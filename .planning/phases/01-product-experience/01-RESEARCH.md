# Phase 1: Product Experience - Research

**Researched:** 2026-04-21
**Domain:** Next.js 14 webapp + Express API + Python scrapers (brownfield)
**Confidence:** HIGH

## Summary

Phase 1 transforms two existing pages: the alerts page (currently plain text cards) into rich product cards with images and prices, and the product detail page (currently single-vendor) into a multi-vendor comparison page with a "Best Value" badge. The core technical challenges are: (1) enriching alert data with live scraped product data (alerts only store a URL, not product metadata), (2) fuzzy matching product names across stores to group "same" products, and (3) building a new multi-vendor product page layout.

The existing codebase provides strong foundations: scrapers already return structured `ScrapedProduct` objects with name/price/image/rating, the ranking service already has sophisticated text similarity logic (`calculateRelevance`), and the product detail page already fetches from the backend. The main work is wiring these together and adding the fuzzy matching layer.

**Primary recommendation:** Use the existing `calculateRelevance` scoring as the foundation for fuzzy product matching (PROD-02), add a new backend endpoint to batch-fetch alert product data, and build the multi-vendor comparison as a new section on the existing product page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ALRT-01 | Alerts page displays product cards with image, name, store, price, and target price | Alerts currently show plain text with URL buttons. Need backend endpoint to batch-enrich alerts with scraped product data. AlertData only has `productUrl`, not image/name/price. |
| ALRT-02 | Each alert card links to the Bhao product page (not directly to the external store) | Alert page already generates `bhaoProductHref` linking to `/product/[id]`, but the link format is fragile (uses encodeURIComponent of full URL as ID). Needs cleanup. |
| PROD-01 | Product detail page shows same product from multiple stores side-by-side with prices | Current product page is single-vendor. Need new backend endpoint to search across stores for matching products, and new UI section showing vendor comparison. |
| PROD-02 | Products from different stores are grouped by name similarity (fuzzy matching) | Existing `calculateRelevance()` in ranking.ts/ranking.service.ts already implements token-based matching with position weighting. Can be adapted for cross-store product matching. |
| PROD-03 | "Best Value" badge is automatically assigned to the lowest-priced listing | Simple min-price comparison within grouped products. CSS badge class `badge-best` already exists in globals.css. |
</phase_requirements>

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 14.2.18 | Web framework | Already in use, pages router |
| React | 18 | UI library | Already in use |
| Express | 4.21.0 | Backend API | Already in use |
| Zustand | 5.0.11 | State management | Already in use (searchStore) |
| Supabase JS | 2.103.3 | Database client | Already in use (alerts, auth) |
| lucide-react | 0.563.0 | Icons | Already in use |

### Needs Installation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fuse.js | ~7.0 | Fuzzy search library for product name matching (PROD-02) | Client-side and/or server-side product name comparison across stores |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fuse.js | string-similarity | fuse.js is more feature-rich (weighted fields, threshold tuning), string-similarity is simpler but less configurable |
| fuse.js | Roll own (adapt calculateRelevance) | The existing `calculateRelevance` function works for query-to-product matching but is not designed for product-to-product cross-store matching. It expects a short query vs long product name. For product-to-product, you need symmetric comparison. fuse.js handles this natively. |
| fuse.js | Levenshtein distance (hand-rolled) | Too simplistic for product names -- "iPhone 16 Pro Max 256GB" vs "iPhone 16 Pro Max 128GB" should match but Levenshtein would give a low score due to length difference. fuse.js handles substring matching better. |

**Installation:**
```bash
# Webapp
cd webapp && npm install fuse.js

# Backend (if needed server-side)
cd backend && npm install fuse.js
```

## Architecture Patterns

### Recommended Approach by Requirement

#### ALRT-01 + ALRT-02: Rich Alert Cards

**Current state:** The alerts page (`webapp/app/alerts/page.tsx`) renders `AlertCard` components that only display `alert.keyword || alert.productUrl` as text. The `AlertData` interface has: `id`, `userId`, `targetPrice`, `keyword`, `productUrl`, `isNotified`, `createdAt`, `updatedAt`. No product name, image, or current price.

**Problem:** The `price_alerts` table in Supabase only stores `target_price`, `keyword`, `product_url`, and `is_notified`. It does NOT store the product name, image, or current price at alert creation time.

**Solution: Create a backend batch-enrich endpoint.**

```
GET /api/alerts/enriched
```

This endpoint:
1. Fetches all alerts for the authenticated user (existing `db.getAlerts`)
2. For each alert with a `product_url`, calls `scrapeProductPage(url, store)` to get current product data
3. Returns alerts merged with their current product data (name, imageUrl, price, store)

**Important:** Do NOT modify the `price_alerts` schema. Per CLAUDE.md design principle: "No product storage -- PostgreSQL stores only user data and vendor URLs. Product data lives in Redis cache (TTL-based) only." The enrichment happens on-the-fly, with backend caching via the existing `cacheGet`/`cacheSet` pattern.

**Pattern:** Batch with parallel fetches and cache hits.

```typescript
// Backend: new route handler (conceptual)
router.get('/enriched', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { data: alerts } = await db.getAlerts(userId);

  const enriched = await Promise.all(alerts.map(async (alert) => {
    if (!alert.product_url) return { ...alert, product: null };

    // Check cache first
    const cacheKey = `alert-enrich:${alert.product_url}`;
    let product = await cacheGet(cacheKey);

    if (!product) {
      const store = detectStore(alert.product_url);
      if (store) {
        product = await scrapeProductDetail(alert.product_url, store);
        await cacheSet(cacheKey, product, 3600); // 1 hour
      }
    }

    return { ...snakeToCamel(alert), product };
  }));

  res.json({ alerts: enriched });
});
```

**Frontend changes to alerts/page.tsx:**
- Add new hook or extend `useSmartAlerts` to fetch enriched data
- Replace `AlertCard` to display image, product name, store badge, current price, target price
- Use existing `.card` CSS class for consistent styling
- Link pattern: `/product/${encodeURIComponent(productUrl)}?url=${encodeURIComponent(productUrl)}&store=${store}` (already exists, just needs cleanup)

#### PROD-01 + PROD-02: Multi-Vendor Product Page with Fuzzy Matching

**Current state:** The product page (`webapp/app/product/[id]/page.tsx`) fetches a single product by URL+store. It shows one vendor's listing with detailed info.

**Approach:**

1. **New backend endpoint: `GET /api/search/matches?url=&store=`**

   Given a product URL and store, this endpoint:
   - Scrapes the product to get its name
   - Searches all stores using that product name (via `searchAllStores`)
   - Applies fuzzy matching to filter results to "same product" across stores
   - Returns the matched products sorted by price (lowest first)

2. **Fuzzy matching strategy (PROD-02):**

   Use `fuse.js` configured for product name matching:
   ```typescript
   import Fuse from 'fuse.js';

   const fuse = new Fuse(allSearchResults, {
     keys: [{ name: 'name', weight: 1.0 }],
     threshold: 0.3,  // Tight match -- only very similar names
     includeScore: true,
     minMatchCharLength: 4,
   });

   const matches = fuse.search(sourceProductName).map(r => r.item);
   ```

   **Why fuse.js over adapting calculateRelevance:** The existing `calculateRelevance()` is asymmetric (short query vs long name, with position weighting favoring prefix matches). Cross-store product matching needs symmetric comparison -- "Samsung Galaxy S24 Ultra 256GB" on Daraz vs "Samsung Galaxy S24 Ultra 256GB" on Telemart should match equally in both directions. fuse.js handles this correctly.

   **Tuning considerations:**
   - `threshold: 0.3` is tight (0 = exact, 1 = match anything). For product names, 0.3 is a good starting point.
   - Some stores append "Free Delivery", "Official Warranty", etc. These suffixes should be ignored.
   - Pre-processing: strip common store-specific suffixes before matching.

3. **Product page changes (PROD-01 + PROD-03):**

   Add a "Compare Prices" section below the main product details:
   ```tsx
   // Multi-vendor comparison section
   {matchedProducts.length > 1 && (
     <div style={{ marginBottom: '60px' }}>
       <div className="section-title">
         <h3>Compare Prices</h3>
         <span>{matchedProducts.length} stores</span>
       </div>
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
         {matchedProducts.map((p, idx) => (
           <VendorCard
             key={p.url}
             product={p}
             isBestValue={idx === 0} // Sorted by price, first = cheapest
           />
         ))}
       </div>
     </div>
   )}
   ```

   **Best Value badge (PROD-03):** Sort matched products by price ascending. The first item gets the `badge-best` class (already defined in `globals.css`):
   ```css
   .badge-best {
       background: var(--accent-primary);  /* #CCFF00 */
       color: #000;
       box-shadow: 0 0 10px rgba(204, 255, 0, 0.3);
   }
   ```

### Recommended File Changes

```
webapp/
  app/alerts/page.tsx            # REWRITE: Rich product cards
  app/product/[id]/page.tsx      # MODIFY: Add multi-vendor comparison section
  hooks/useSmartAlerts.ts        # MODIFY: Add enriched alert fetching
  utils/productMatching.ts       # NEW: Fuse.js fuzzy matching logic

backend/
  src/routes/alerts.routes.ts    # MODIFY: Add GET /enriched endpoint
  src/routes/search.routes.ts    # MODIFY: Add GET /matches endpoint
  src/services/scraper.service.ts # No change needed (already has scrapeProductDetail)
  src/services/ranking.service.ts # No change needed (multi-vendor uses fuse.js, not ranking)

webapp/app/globals.css           # No change needed (badge-best already exists)
```

### Anti-Patterns to Avoid

- **Storing product data in alerts table:** Violates the "no product storage" design principle. Product data changes; only URLs are stable identifiers.
- **Scraping on every page load:** Use the existing cache service (`cacheGet`/`cacheSet`) for enriched alert data. Set reasonable TTL (1 hour).
- **Client-side-only fuzzy matching:** The search results come from the backend. Matching should happen server-side so the client receives a clean, filtered list.
- **Using the ranking algorithm for cross-store matching:** Ranking is for ordering results by relevance to a query. Cross-store matching is a different problem (pairwise similarity). Don't conflate them.
- **Over-fetching:** When building the multi-vendor section, don't re-scrape the product already shown. Exclude the current product URL from the matches.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Custom Levenshtein/Jaccard implementation | fuse.js | Handles substring matching, weighted fields, configurable thresholds, and edge cases (store suffixes, spec variants) out of the box |
| Cache invalidation for enriched alerts | Custom TTL tracking | Existing `cacheGet`/`cacheSet` in cache.service.ts | Already integrated with Redis, consistent with the rest of the backend |
| "Best Value" selection | Custom sorting/comparison logic | `Array.sort((a, b) => a.price - b.price)` | Trivial -- just sort by price, pick first. No library needed. |
| Store detection from URL | Regex per store (already exists) | Existing `inferStoreFromUrl` / `detectStore` | Both frontend and backend already have this function |

**Key insight:** The most tempting thing to hand-roll is fuzzy matching ("how hard can Levenshtein be?"), but product name matching has many edge cases: spec variants (128GB vs 256GB), store suffixes, minor naming differences, generation detection. fuse.js handles all of these through its configurable tokenization and threshold system.

## Common Pitfalls

### Pitfall 1: Alert enrichment is slow (N+1 scraping)
**What goes wrong:** Each alert with a product URL triggers a separate scrape. If a user has 20 alerts, that's 20 sequential scrapes taking 20+ seconds.
**Why it happens:** Scrapers have a 30-second timeout each.
**How to avoid:** Use `Promise.allSettled` for parallel fetching. Most alerts will hit the cache after the first load.
**Warning signs:** Alerts page takes > 5 seconds to load. Add a loading skeleton.

### Pitfall 2: Fuzzy matching groups different products
**What goes wrong:** "iPhone 16 Pro Max" matches "iPhone 16 Pro" (different tier) or "iPhone 16 Pro Max Case" (accessory).
**Why it happens:** fuse.js threshold too loose, or not filtering accessories.
**How to avoid:** Use tight threshold (0.3), and filter out products containing accessory keywords from the existing `ACCESSORY_KEYWORDS` list in ranking.ts. Pre-process product names to strip common suffixes like "Free Delivery", "Official Warranty", "Best Price".
**Warning signs:** Multi-vendor section shows cases/covers alongside phones, or shows Pro and non-Pro models together.

### Pitfall 3: Circular redirect on product page
**What goes wrong:** User clicks alert card -> product page loads -> multi-vendor section tries to match -> matches the same product -> renders link back to same page -> infinite loop feeling.
**Why it happens:** The matches endpoint returns the current product URL as a match.
**How to avoid:** Exclude the current product's URL from the matched results before rendering the comparison section.
**Warning signs:** Multi-vendor section shows the same listing that's already displayed above.

### Pitfall 4: Alert product data is stale
**What goes wrong:** Alert shows "Rs. 150,000" but the actual price is now Rs. 140,000.
**Why it happens:** Cache TTL is too long, or alert was enriched long ago.
**How to avoid:** Show a "Last checked: X minutes ago" timestamp. Use 1-hour cache TTL for enriched data. The alert checker cron (every 30 min) keeps prices relatively fresh.
**Warning signs:** Users report alert prices don't match what they see on store websites.

### Pitfall 5: Breaking the "no product storage" principle
**What goes wrong:** Developer adds `product_name`, `image_url`, `current_price` columns to `price_alerts` table.
**Why it happens:** Seems natural to denormalize for performance.
**How to avoid:** Only add caching at the Redis level (TTL-based), never persist product data in PostgreSQL for alerts. The cache service already handles this.
**Warning signs:** New Prisma schema migration touching the alerts table.

## Code Examples

### Alert enrichment backend endpoint
```typescript
// Source: Based on existing alerts.routes.ts pattern + scraper.service.ts
// New route in alerts.routes.ts

function detectStore(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('daraz')) return 'daraz';
  if (lower.includes('telemart')) return 'telemart';
  if (lower.includes('shophive')) return 'shophive';
  if (lower.includes('mega.pk')) return 'mega';
  if (lower.includes('priceoye')) return 'priceoye';
  return null;
}

// GET /api/alerts/enriched
router.get('/enriched', async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const { data: alerts, error } = await db.getAlerts(userId);
  if (error) return res.status(500).json({ error: 'Failed to fetch alerts' });

  const enriched = await Promise.allSettled(
    (alerts || []).map(async (alert: any) => {
      if (!alert.product_url) return { ...snakeToCamel(alert), product: null };

      const cacheKey = `alert-enrich:${alert.product_url}`;
      let product = await cacheGet(cacheKey);

      if (!product) {
        const store = detectStore(alert.product_url);
        if (store) {
          product = await scrapeProductDetail(alert.product_url, store);
          if (product) await cacheSet(cacheKey, product, 3600);
        }
      }

      return { ...snakeToCamel(alert), product: product || null };
    })
  );

  const results = enriched
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);

  res.json({ alerts: results });
});
```

### Fuzzy matching for cross-store products
```typescript
// Source: fuse.js documentation + existing codebase patterns
// New file: webapp/utils/productMatching.ts (or backend equivalent)

import Fuse from 'fuse.js';

// Common suffixes that stores add to product names -- strip before matching
const STORE_SUFFIXES = [
  'free delivery', 'official warranty', 'best price', 'cash on delivery',
  'genuine product', 'brand new', 'imported', 'local stock',
  'online shopping', 'buy now', 'order now', 'limited stock',
];

function cleanProductName(name: string): string {
  let cleaned = name.toLowerCase().trim();
  for (const suffix of STORE_SUFFIXES) {
    cleaned = cleaned.replace(new RegExp(`\\s*[-|–|,]?\\s*${suffix}`, 'gi'), '');
  }
  return cleaned.trim();
}

interface ProductForMatch {
  name: string;
  price: number;
  url: string;
  imageUrl: string;
  store: string;
  rating: number;
  reviewsCount: number;
  inStock: boolean;
}

export function findMatchingProducts(
  sourceProduct: ProductForMatch,
  searchResults: ProductForMatch[],
  threshold: number = 0.3
): ProductForMatch[] {
  // Filter out current product
  const others = searchResults.filter(p => p.url !== sourceProduct.url);

  const cleanedResults = others.map(p => ({
    ...p,
    cleanedName: cleanProductName(p.name),
  }));

  const fuse = new Fuse(cleanedResults, {
    keys: [{ name: 'cleanedName', weight: 1.0 }],
    threshold,
    includeScore: true,
    minMatchCharLength: 4,
  });

  const sourceName = cleanProductName(sourceProduct.name);
  const matches = fuse.search(sourceName);

  // Sort by price ascending for "Best Value" determination
  return matches
    .map(m => m.item)
    .sort((a, b) => a.price - b.price);
}
```

### Rich alert card component (conceptual)
```tsx
// Source: Based on existing AlertCard in alerts/page.tsx + search page card patterns
// Uses existing .card CSS class and badge classes

function AlertCard({ alert, onRemove }: { alert: EnrichedAlertData; onRemove: (id: string) => void }) {
  const product = alert.product;
  const store = product?.store || deriveStoreFromUrl(alert.productUrl);
  const currentPrice = product?.price;
  const isPriceBelowTarget = currentPrice && currentPrice <= alert.targetPrice;

  return (
    <Link href={`/product/${encodeURIComponent(alert.productUrl)}?url=${encodeURIComponent(alert.productUrl)}&store=${encodeURIComponent(store || '')}`} className="card" style={{ display: 'flex', gap: '16px', textDecoration: 'none', color: 'inherit' }}>
      {/* Product image */}
      <div style={{ width: '100px', height: '100px', borderRadius: '12px', background: '#1a1a1a', flexShrink: 0, overflow: 'hidden' }}>
        {product?.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>--</div>
        )}
      </div>

      {/* Product info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 className="product-title" style={{ fontSize: '16px', marginBottom: '4px' }}>
          {product?.name || alert.keyword || alert.productUrl}
        </h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span>{store}</span>
          {currentPrice > 0 && <span className="product-price" style={{ fontSize: '16px' }}>Rs. {currentPrice.toLocaleString()}</span>}
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Target: <span style={{ color: isPriceBelowTarget ? 'var(--accent-success)' : 'var(--accent-primary)', fontWeight: 700 }}>Rs. {alert.targetPrice.toLocaleString()}</span>
        </div>
        {alert.isNotified && (
          <span className="badge badge-hot" style={{ marginTop: '8px', display: 'inline-block' }}>TARGET REACHED</span>
        )}
      </div>

      {/* Remove button (stop propagation) */}
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(alert.id); }} style={{ ... }}>
        REMOVE
      </button>
    </Link>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store product metadata in DB | Only store URLs, enrich on-the-fly | Original design principle | Phase must respect this -- no schema changes to alerts table |
| Manual URL linking | Dynamic route with query params | Already in place | Alert cards link to `/product/[id]?url=...&store=...` |
| Single-vendor product page | Multi-vendor comparison | Phase 1 implements this | Major UX improvement |
| No product matching | Fuzzy matching with fuse.js | Phase 1 introduces this | Enables cross-store grouping |

**Deprecated/outdated:**
- The `Prisma schema` (`backend/prisma/schema.prisma`) is no longer the active schema. The project has migrated to Supabase directly (`db.service.ts` uses `supabaseAdmin`). Do not modify Prisma schema; make any DB changes via Supabase SQL migrations if needed (but none needed for Phase 1).

## Open Questions

1. **fuse.js: backend vs frontend matching?**
   - What we know: Search results come from the backend, so matching logically belongs there. But the frontend already has all search results after a search.
   - What's unclear: Should the `/matches` endpoint do the matching, or should the frontend do it with pre-fetched search results?
   - Recommendation: Backend-side matching. The `/matches` endpoint receives a URL, scrapes the product name, searches all stores, filters via fuse.js, and returns only matching products. This keeps the matching logic centralized and testable.

2. **What happens when no matches are found?**
   - What we know: Some products may only be available on one store.
   - What's unclear: Should we show an empty comparison section, or hide it entirely?
   - Recommendation: Hide the "Compare Prices" section entirely when there are fewer than 2 matches. Show only the single-vendor view. This avoids a confusing empty UI.

3. **Alert enrichment caching strategy**
   - What we know: The existing cache service supports TTL-based caching. Alerts can have many product URLs.
   - What's unclear: How many concurrent scrapes is too many? What if a user has 50 alerts?
   - Recommendation: Add a cap -- enrich at most 10 alerts at a time. Show the rest as plain text (current style) with a "Load more" button. This prevents slow initial loads.

4. **Should we add product name to PriceAlert at creation time?**
   - What we know: Per design principle, product data should not be stored in DB.
   - What's unclear: The keyword field sometimes contains the product name (when creating alerts from search results).
   - Recommendation: If the alert was created with a `keyword` field that matches the product name, use that for display. Otherwise, fetch from enrichment endpoint. Do NOT add new columns to the alerts table.

## Sources

### Primary (HIGH confidence)
- Codebase analysis of `webapp/app/alerts/page.tsx` -- current alert card implementation
- Codebase analysis of `webapp/app/product/[id]/page.tsx` -- current product page implementation
- Codebase analysis of `backend/src/routes/search.routes.ts` -- existing search API patterns
- Codebase analysis of `backend/src/routes/alerts.routes.ts` -- existing alert API patterns
- Codebase analysis of `backend/src/services/scraper.service.ts` -- scraper interface and capabilities
- Codebase analysis of `backend/src/services/ranking.service.ts` -- existing text matching logic
- Codebase analysis of `webapp/utils/ranking.ts` -- frontend ranking (mirrors backend)
- Codebase analysis of `webapp/hooks/useSmartAlerts.ts` -- alert data interface
- Codebase analysis of `webapp/store/searchStore.ts` -- Zustand store patterns
- Codebase analysis of `webapp/app/globals.css` -- existing badge/card CSS classes
- Codebase analysis of `backend/src/services/db.service.ts` -- Supabase DB operations
- Codebase analysis of `backend/prisma/schema.prisma` -- data model (reference only, migrated to Supabase)

### Secondary (MEDIUM confidence)
- fuse.js library documentation (training data) -- API surface, configuration options, threshold tuning
- CLAUDE.md design principles -- "no product storage" constraint

### Tertiary (LOW confidence)
- Web search unavailable during this research session. Library version and API claims for fuse.js based on training data only. Recommend verifying fuse.js latest version before installing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - based on direct codebase inspection of package.json files
- Architecture: HIGH - based on thorough analysis of existing page components, API routes, and data flow
- Pitfalls: HIGH - based on patterns observed in the existing codebase and common issues with scraping + caching architectures
- Fuzzy matching: MEDIUM - fuse.js recommendation based on training data; library verification needed at plan time
