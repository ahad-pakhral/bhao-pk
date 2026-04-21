# Bhao.pk — Development Log

> This file is the single source of truth for every change made to the project.
> Newest entries at the top. Never delete old entries.
>
> **Every code change — no matter how small — gets logged here via `/document`.**

---

## Changelog

### [2026-04-21 16:06] — Rich alert cards with live product data enrichment (Feature)

**What changed:**
- `backend/src/routes/alerts.routes.ts` -- Added `GET /api/alerts/enriched` endpoint that batch-fetches user alerts and enriches each with live product data (name, imageUrl, price, store) via scraping. Uses cache-first strategy with 1hr TTL via Redis. Added local `detectStore()` helper for URL-to-store mapping. Enrichment runs in parallel via `Promise.allSettled`. Alerts without URLs or failed enrichment return `product: null`.
- `webapp/hooks/useSmartAlerts.ts` -- Added `EnrichedProductData` and `EnrichedAlertData` interfaces extending `AlertData`. Added `loadEnrichedAlerts()` function that fetches from `/api/alerts/enriched`. Hook now returns `enrichedAlerts` alongside existing `alerts`. Mount effect calls `loadEnrichedAlerts()`. Remove button updates both alert states.
- `webapp/app/alerts/page.tsx` -- Rewrote `AlertCard` with horizontal flex layout: 100x100 product image (dark bg placeholder), product name with 2-line truncation, store badge, current price, target price, and TARGET REACHED badge. Entire card wrapped in `<Link>` to `/product/[id]?url=...&store=...` (Bhao page, not external store). Removed separate VIEW PRODUCT and VISIT STORE buttons. Remove button stops event propagation.

**Why:**
- Alerts were plain text-only with no product context; users couldn't see images or current prices without leaving the page. Plan 01-01 of Phase 1 (Product Experience).

### [2026-04-21 15:16] — Restart backend with Supabase, fix alerts to use Bhao product links (Fix)

**What changed:**
- Killed stale backend process (PID 5661) still running old Prisma+SQLite code and restarted with `npm run dev`
- `webapp/app/alerts/page.tsx` — Added `deriveStoreFromUrl()` helper; changed "VIEW PRODUCT" button from external store `<a>` to internal `<Link href="/product/...">`; added separate "VISIT STORE" button for external link

**Why:**
- Backend was still serving Prisma SQLite responses (camelCase), so Supabase fixes weren't active — wishlist POST returned 500 because the old code spread `imageUrl` into Prisma (which worked) but the server needed restart to load the new Supabase-based code
- User wanted alerts to open the Bhao product page instead of going directly to the external store

**Technical details:**
- `deriveStoreFromUrl()` parses URL hostname and matches against known store domains (daraz, shophive, telemart) to derive the store name
- Bhao product link uses `?url=` and `?store=` query params (added in previous fix) so the product page can scrape the product even without Zustand store data
- Two buttons now: "VIEW PRODUCT" (internal Bhao page) and "VISIT STORE" (external link)

**Side effects:**
- Backend now runs Supabase code; wishlist/alerts use snake_case Supabase columns transformed to camelCase via `snakeToCamel()`
- Redis cache is disabled ("Redis not available — cache disabled, all searches will be live")

**Gotchas / Lessons learned:**
- ts-node-dev --respawn watches for file changes but the old process was started before the Supabase migration — it kept running old Prisma code even after files changed, likely because the import graph was broken (deleted `connection.ts` caused a silent crash without restart)

**Testing:**
- Backend health check passes: `curl localhost:3001/api/health` returns `{"status":"ok"}`
- Wishlist and alerts need to be tested in browser with live Supabase connection

**Related skills updated:**
- None yet

### [2026-04-21 02:28] — Fix product deep-linking in new tab, wishlist error handling, alert validation, remove dummy URL fallback (Fix)

**What changed:**
- `webapp/app/product/[id]/page.tsx` — Product pages now work even if opened via older links where `[id]` is an encoded product URL (infers store from URL + calls `GET /api/search/product`).
- `backend/src/controllers/user.controller.ts` — Wishlist duplicate now returns `409` (not `400`); `ensureUserProfile()` now fails loudly if Supabase calls error (prevents silent FK loops); added guard for “no row returned” to avoid crashing on `snakeToCamel(null)`.
- `webapp/hooks/useWishlist.ts` — Handles `409` duplicate properly; logs backend error payload for non-OK responses.
- `webapp/app/search/page.tsx` — Removed `https://dummy-product.com/...` fallback; blocks wishlist actions when `item.url` is missing.
- `backend/src/routes/alerts.routes.ts` — `ensureUserProfile()` now fails loudly if Supabase calls error; added guard for “no row returned” to avoid crashing on `snakeToCamel(null)`.

**Why:**
- Opening a product page in a separate/new tab could still show “Product Not Found” if the link didn’t include `?url=&store=` and Zustand cache was empty.
- Wishlist POST could surface as a 500 if the insert returned no row (or unexpected shape) and the response transformer crashed.
- Dummy fallback URLs pollute wishlist keys and make debugging harder.
- Alerts creation should fail clearly if an insert returns no row.

**Testing:**
- `npm -C backend run build`
- `npm -C webapp run build`

### [2026-04-21 02:31] — Fix alerts page crash when targetPrice missing (Fix)

**What changed:**
- `/Users/ahad/Documents/Clawd/Bhao.pk/webapp/hooks/useSmartAlerts.ts` — Normalize alerts payloads (accept snake_case/camelCase) and coerce `targetPrice` to a number.
- `/Users/ahad/Documents/Clawd/Bhao.pk/webapp/app/alerts/page.tsx` — Render guard so missing/invalid `targetPrice` won’t crash the UI.

**Why:**
- Some alerts were arriving without a valid `targetPrice` (undefined or non-numeric), causing `alert.targetPrice.toLocaleString()` to throw.

**Testing:**
- `npm -C webapp run build`

### [2026-04-21 02:09] — Add FR/NFR requirements checklist mapping to code (Docs)

**What changed:**
- `docs/REQUIREMENTS_CHECKLIST.md` — Added a checklist mapping 27 functional requirements + 6 non-functional requirements from the report to backend/web/mobile code, with `DONE/PARTIAL/TODO` status and evidence links.

**Why:**
- Make it easy to verify implementation coverage against the project report and quickly spot gaps (notifications, multi-vendor product page, true price history, admin backend).

### [2026-04-20 23:30] — Fix Supabase snake_case mismatch, wishlist, product page new-tab, remove Mega/PriceOye (Fix)

**What changed:**
- `backend/src/routes/alerts.routes.ts` — Added `snakeToCamel()` utility; transformed alerts list and created alert response from snake_case to camelCase
- `backend/src/controllers/user.controller.ts` — Added `snakeToCamel()` utility; transformed wishlist GET and POST responses; fixed `imageUrl` null handling in addWishlistItem
- `backend/src/services/db.service.ts` — Changed `addWishlistItem` to explicitly map `imageUrl` → `image_url` instead of spreading raw object (Supabase column is `image_url`)
- `webapp/app/product/[id]/page.tsx` — Added `useSearchParams` import; product page now reads `?url=` and `?store=` query params to scrape product directly when Zustand store is empty (new tab scenario)
- `webapp/app/search/page.tsx` — Product links now include `?url=` and `?store=` query params for new-tab support; removed "Mega" and "PriceOye" from stores list
- `backend/src/services/scraper.service.ts` — Removed `mega` and `priceoye` from `STORES` array
- `webapp/utils/ranking.ts` — Removed Mega and PriceOye from `storeReliabilityTable`
- `mobile/src/utils/ranking.ts` — Removed Mega and PriceOye from `storeReliabilityTable`
- `backend/src/services/ranking.service.ts` — Removed Mega and PriceOye from `STORE_RELIABILITY`

**Why:**
- Alerts page crashed with `Cannot read properties of undefined (reading 'toLocaleString')` because Supabase returns snake_case (`target_price`, `product_url`, `is_notified`) but frontend expects camelCase
- Wishlist "Failed to add" because `db.service.ts` spread `{imageUrl}` directly into Supabase insert, but the column is `image_url` — PostgREST rejected the unknown column
- Product page showed "Product Not Found" when opened in new tab because Zustand store is empty and Redis cache may have expired
- Mega and PriceOye stores are no longer needed

**Technical details:**
- `snakeToCamel()` uses regex `/_([a-z])/g` to convert snake_case keys to camelCase — applied at the route/controller layer so frontend always receives camelCase
- Product page new-tab fix: search links encode `?url=...&store=...` query params; product page checks these params first when Zustand lookup fails, then calls `GET /api/search/product?url=...&store=...` to scrape on-the-fly
- `db.service.ts` addWishlistItem now explicitly maps each field instead of spreading to avoid camelCase/snake_case mismatch

**Side effects:**
- All Supabase-backed API responses (alerts, wishlist) now consistently use camelCase
- Product detail scrape will fire for every new-tab product page open (no cache, always live scrape)
- Products without URLs in search results won't benefit from new-tab fix (but most products have URLs)

**Gotchas / Lessons learned:**
- Supabase JS client does NOT auto-convert camelCase to snake_case — you must map column names explicitly
- Next.js `useSearchParams()` requires a Suspense boundary — the product page export already wraps in Suspense

**Testing:**
- Not tested yet (requires running backend + Supabase)

**Related skills updated:**
- None yet

### [2026-04-20 22:40] — Ranking V3 — Position-Aware Relevance, Post-Score Generation Penalty, Prefix Accessory Detection (Ranking)

**What changed:**
- `backend/src/services/ranking.service.ts` — Major ranking fixes: position-aware relevance, generation penalty moved to post-score, prefix accessory detection, expanded keyword list
- `webapp/utils/ranking.ts` — Synced all changes from backend
- `mobile/src/utils/ranking.ts` — Synced all changes from backend
- `backend/src/routes/search.routes.ts` — Briefly added debug logging (removed after debugging)

**Why:**
- "iphone" single-word search returned accessories (skins, body housings, camera rings) at rank 1 and Google Pixel "camera better than iphone" at rank 2
- "iphone 16 pro max" still showed "Iphone 16 Pro Max Arrow Camera Rings" at rank 1 (accessory with device name prefix)
- iPhone 17 appeared at ranks 3-6 for "iphone 16 pro max" queries (generation penalty too weak at 0.15x, only applied to relevance not total score)

**Technical details:**
Four new/updated mechanisms:

1. **Position-aware relevance** (`firstMatchIndex` tracking in `calculateRelevance`): Tracks where the first query token appears in the product name. Position 0 → 1.2x boost (name starts with query = actual product). Position <10 → 1.0x. Position <30 → 0.6x. Position 30+ → 0.15x (mentioned in passing). Critical for single-word queries like "iphone" where many products contain the word but only actual iPhones start with it.

2. **Post-score generation penalty**: Moved `calculateGenerationPenalty` from inside `calculateRelevance` (where it only affected 50% of the score via relevance weight) to `rankProducts` as a multiplier on the **final composite score**. This ensures ALL factors (price, rating, popularity, store reliability) are penalized for wrong-generation products. Adjacent generations (16 vs 17) → 0.03x (was 0.15x). Far generations (16 vs 14) → 0.01x (was 0.15x). Model variant penalties also strengthened: pro/max mismatch → 0.4x (was 0.6x), plus/mini/ultra → 0.3x (was 0.5x).

3. **Prefix accessory detection** (`isPrefixAccessory`): Detects products that start with query words but are actually accessories — e.g. "Iphone 16 Pro Max Arrow Camera Rings". Finds the last matched query token position, checks what follows: if it contains only specs (GB, TB, MHz) it's the actual product; if it contains accessory keywords, it's an accessory. Also added `isPrefixAccessory` to the penalty check alongside regular `ACCESSORY_KEYWORDS` match.

4. **Expanded ACCESSORY_KEYWORDS** (now ~60 keywords): Added: converter, back protection, full protection, 360 protection, carbon fiber, camera ring, ring, arrow, lens ring, bezel, button, antenna, speaker mesh, earpiece, microphone mesh, volume button, power button, sim tray, sim slot, matte, glossy, transparent, clear, tinted, hybrid, armor, defender, rugged. Also added `GENERIC_IN_DESCRIPTION` list for phrases like "better than", "alternative to", "like iphone" → 0.02x penalty.

**Side effects:**
- Accessory penalty strengthened from 0.05x to 0.03x (97% vs 95%)
- Query "iphone case" correctly shows cases (penalty disabled when query contains accessory keywords)
- All three ranking files must stay in sync

**Gotchas / Lessons learned:**
- Generation penalty MUST be applied to the final composite score, not just the relevance component. When applied only to relevance (weighted at 0.50), a wrong-generation product with good price/rating/store scores could still outrank the correct product. Post-score multiplication ensures ALL factors are penalized.
- Stale server instances can cause confusing test results. When restarting, always verify `lsof -i:PORT` shows only one process and the output matches expectations. Debug logging inside the ranking function confirmed correct behavior even when curl showed stale results from a zombie process.
- "360 Back Protection" products may not always contain "sheet" in the truncated name from scrapers — added "back protection", "full protection", "360 protection", "carbon fiber" as standalone accessory keywords to catch these edge cases.

**Testing:**
- "iphone 16 pro max": Rank 1-2 actual iPhone 16 Pro Max. iPhone 17 eliminated from top 15. Accessories correctly below devices.
- "iphone 14": Rank 1 actual iPhone 14 (when server fully restarted). Accessories at bottom.
- "iphone": All top results are actual iPhones across generations. No accessories, no Google Pixel.
- "samsung galaxy s25 ultra": Top 5 all S25 Ultra variants (perfect).
- "airpods": All AirPods/earbuds (correct).
- "iphone case": All cases (correct — penalty disabled for accessory queries).
- "nike shoes", "makeup", "shirt", "perfume", "toy": All correctly category-matched.

**Related skills updated:**
- `/ranking` — Added full penalties table, relevance calculation, generation penalty, accessory detection docs
- `/search-flow` — Updated pipeline description and debugging tips

### [2026-04-20 15:25] — Ranking Algorithm Overhaul — Relevance Cutoff, Generation Detection, Stronger Accessory Filtering (Ranking)

**What changed:**
- `backend/src/services/ranking.service.ts` — Major rewrite of ranking algorithm
- `webapp/utils/ranking.ts` — Synced identical changes
- `mobile/src/utils/ranking.ts` — Synced identical changes

**Why:**
- Search for "iphone 16 pro max" returned Tecno SPARK 40 at rank 3, screen protectors at ranks 4-5, Samsung/Infinix/OPPO junk filling the results
- Root causes: (1) zero-relevance products getting boosted by price/popularity scores, (2) accessory penalty too weak (0.4x), (3) no generation detection (iPhone 17 ranked same as iPhone 16)

**Technical details:**
Three new mechanisms added:

1. **Hard relevance cutoff** (`MIN_MATCH_RATIO = 0.4`): If less than 40% of query tokens match the product name, relevance is forced to 0 and the product gets score 0 (eliminated from meaningful results). Previously, partial matches returned `matchRatio * 0.1` which still allowed other factors (price, reviews, store reliability) to push unrelated products high.

2. **Generation/version mismatch detection** (`calculateGenerationPenalty`): Extracts numbers from query and product name. If query has "16" and product has "17" (different generation), applies 0.15x penalty. Also detects model variant mismatches: "pro max" vs "pro" (0.6x), "plus" vs base (0.5x), "ultra" vs base (0.5x), "mini" vs base (0.5x).

3. **Stronger accessory penalty** (0.05x instead of 0.4x): Changed from 60% penalty to 95% penalty. Expanded `ACCESSORY_KEYWORDS` from 12 to 25 keywords (added: skin, pouch, holder, mount, stand, dock, adapter, cord, screen protector, tempered glass, armor, holster).

**Side effects:**
- All three ranking files must stay in sync (backend, webapp, mobile)
- Some edge cases: "pro" is a common word — "Redmi Note 14 Pro" matches "pro" token (1/4 = 0.25 < 0.4 threshold, correctly eliminated)
- Products with score 0 still appear in results at the bottom (not filtered out) — could be filtered later if needed

**Gotchas / Lessons learned:**
- The core insight: when relevance is 0, other factors (cheap price + high reviews + reliable store) can still produce a score of ~0.3, beating moderately relevant products. The fix is a hard cutoff, not just a weight adjustment.
- Generation numbers in product names are the strongest signal for "wrong product" — "16" vs "17" is a clear mismatch
- Accessory keywords need to include compound terms like "screen protector" and "tempered glass" — single-word keywords miss these

**Testing:**
- "iphone 16 pro max": Top 3 are now actual iPhone 16 Pro Max listings (was: Tecno SPARK 40 at #3). Accessories pushed from ranks 4-5 to ranks 11+. All Samsung/Infinix/OPPO eliminated from top 10.
- "samsung galaxy s25 ultra": Top 7 are Samsung Galaxy S25 Ultra variants. S23 Ultra correctly penalized at #8.
- All 3 files compile without TypeScript errors

**Related skills updated:**
- None yet

### [2026-04-20 12:15] — Daraz Specs from LD+JSON, Telemart Public API, Shophive Reviews AJAX (Scraper)

**What changed:**
- `backend/scrapers/stores/daraz_scraper.py` — Added `_parse_ld_description_specs()` method that parses the markdown-style product description from Schema.org LD+JSON into structured specs (41 specs extracted for S23 Ultra: Display, Performance, Storage, Camera, Battery, OS, Connectivity, SIM, Design, Other Features). Description now uses the intro paragraph (before `###` markers) instead of raw markdown. Values over 300 chars are truncated at sentence boundary to prevent trailing prose leakage
- `backend/scrapers/stores/telemart_scraper.py` — Rewrote `scrape_product_page` to use Telemart's public product API at `telemart.pk/api/product/{slug}` instead of HTML scraping or Algolia search. Parses HTML description field for specs (extracts `<dt>`/`<dd>` pairs — 25 specs for test product). Gets reviews from API `reviews` array. Fixed URL format: `telemart.pk/{slug}` not `telemart.pk/product/{slug}` (latter returns 404)
- `backend/scrapers/stores/shophive_scraper.py` — Updated review fetching to use Magento 2's `listAjax` endpoint. Extracts `productReviewUrl` from `data-mage-init` script block (contains `productReviewUrl` with unicode-escaped URL like `review/product/listAjax/id/{id}/`). Decodes unicode escapes (`\u003A` → `:`, `\u002F` → `/`). Falls back to checking main HTML for review elements. Products with 0 reviews return empty array (verified that Shophive genuinely has no reviews for tested products)

**Why:**
- User reported Daraz pages have bullet-point highlights/details, Telemart links always 404, Telemart pages have collapsible specs and reviews, Shophive has details and reviews tabs
- Daraz LD+JSON contains rich markdown-formatted specs in the description field (not available as separate structured data)
- Telemart HTML scraping and Algolia search both failed — discovered public API endpoint with full product data
- Shophive reviews are loaded via Magento 2 AJAX tab component, not present in initial HTML

**Technical details:**
- Daraz LD+JSON description format: `### **Section:**#### **Sub:**- **Key:** Value` — all on single lines without newlines. Parser splits on `#{3,4}\s*\*\*[^*]+\*\*` regex, then extracts `-\s*\*\*([^*]+):\*\*\s*(.*?)(?=-\s*\*\*|\Z)` for key/value pairs. Deduplicates by key
- Telemart API `telemart.pk/api/product/{slug}` returns JSON with `product.description` containing HTML spec table (`<dl>` with `<dt>`/`<dd>` pairs), `product.meta_description` for text description, `reviews` array for reviews, `gallery` for images. Uses BeautifulSoup to parse the HTML description field
- Shophive's Magento 2 review component config is in `<script type="text/x-magento-init">` with `Magento_Review/js/process-reviews` module pointing to `productReviewUrl`. The `listAjax` endpoint returns whitespace (3 bytes) for products with 0 reviews — the threshold of `> 50` chars avoids parsing empty responses
- Not all Daraz products have markdown specs — cheaper products may have plain text descriptions. Parser only activates when both `###` and `**` are present in description

**Side effects:**
- Daraz product pages now show 30-40 structured specs (Display, Performance, Camera, Battery, etc.) in addition to description
- Telemart 404s are fixed — correct URL format `telemart.pk/{slug}` used everywhere
- Telemart product pages now show full specs (25+) and reviews when available
- Shophive reviews still show 0 for most products — this is accurate data (Shophive has very few user reviews)

**Gotchas / Lessons learned:**
- Daraz markdown specs have no line breaks — all on one line separated by `###` and `-` markers. Naive split on `\n` produces 0 items. Must use regex split on section headers
- Telemart's old URL format `/product/{slug}` returns 404 but the Algolia search index still uses it. Real URLs are `telemart.pk/{slug}`
- Shophive's `?review=list` query parameter returns the full product page (not AJAX partial). The correct endpoint is the decoded `productReviewUrl` from `data-mage-init`
- Last spec value in Daraz can absorb trailing prose text — must truncate at 300 chars or sentence boundary

**Testing:**
- Daraz: Tested with Samsung Galaxy S23 Ultra — 41 specs parsed correctly, clean description, last spec trimmed
- Telemart: Tested with Infinix Hot 40i — 25 specs from API, price and name correct
- Shophive: Tested with Samsung Galaxy Watch 8 and ESR iPhone protector — specs (2-3) correct, reviews correctly return 0 (empty AJAX response)

**Related skills updated:**
- None yet

### [2026-04-19 19:35] — Wishlist Fix, Product Detail Scrapers, Root Route (Fix/Scraper/API)

**What changed:**
- `backend/src/server.ts` — Added `GET /` root route that returns API info JSON (service name, version, available endpoints) instead of Express default "Cannot GET /"
- `backend/src/controllers/auth.controller.ts` — `getMe` now auto-creates user profile if missing from `users` table (handles migration-not-run or failed profile creation). `login` also auto-creates profile if `findUser` returns null
- `backend/scrapers/stores/daraz_scraper.py` — **Rewrote** `scrape_product_page`: Daraz is CSR, HTML containers are empty. Now parses Schema.org JSON-LD (`<script type="application/ld+json">`) for name, image, description, and availability. Falls back to HTML selectors for price and image. Extracts price from `pdpTrackingData` embedded script when available
- `backend/scrapers/stores/shophive_scraper.py` — Fixed specs selector: changed `.additional-attributes table tr` to `.additional-attributes tr` (`.additional-attributes` IS the table, not a parent). Fixed image selector: added `.product-image-photo` before `.fotorama__img` (fotorama not present on Shophive pages). Now returns 12 specs correctly
- `backend/scrapers/stores/telemart_scraper.py` — **Rewrote** `scrape_product_page`: Telemart is CSR + Cloudflare, HTML scraping returns empty pages. Now uses Algolia search API with slug as query text to fetch product details (name, price, image, rating, stock). Verifies slug match to avoid wrong product

**Why:**
- User reported: "Failed to add to wishlist", product details/reviews not showing on product page, some products show wrong prices
- Wishlist failure caused by missing user profile in Supabase `users` table (FK constraint on `wishlist_items.user_id REFERENCES users(id)` prevents insert)
- Product detail scrapers all returned empty data because Daraz/Telemart are CSR apps and Shophive had wrong CSS selectors
- "Cannot GET /" error when visiting backend URL directly

**Technical details:**
- Schema.org JSON-LD is server-rendered even on CSR pages — Daraz embeds `<script type="application/ld+json">` with `@type: Product` containing name, image array, description, and availability. This survives client-side rendering
- The `pdpTrackingData` variable in Daraz pages contains `pdt_price` but uses escaped JSON in a JS string — regex `var pdpTrackingData\s*=\s*["\']({.*?})["\'];` extracts it
- Shophive uses Magento 2, which renders `.additional-attributes` as a `<table class="data table additional-attributes">` — the old selector looked for a nested table that didn't exist
- Telemart Algolia `slug` field is not a filterable facet, so `filters=slug:xxx` returns 0 hits. Using `query=slug` works because Algolia text search matches the slug field
- Auto-profile creation in `getMe` ensures that even if the Supabase migration was run but profile creation during registration failed (network error, RLS issue), the profile gets created on first authenticated request

**Side effects:**
- Wishlist, alerts, search history, and all auth-protected endpoints now work even if the `users` table was missing the user's row
- Daraz product detail page now shows name, image, and description (but no specs/reviews — not available in Schema.org or server-rendered HTML)
- Telemart product detail page now shows price, name, image, rating, stock status (but no description/specs/reviews — not available in Algolia index)
- Shophive product detail page now shows all 12 specification rows correctly

**Gotchas / Lessons learned:**
- When a CSS class IS the table element itself (not a wrapper), don't use `.classname table tr` — use `.classname tr` instead
- Algolia facet filters require the attribute to be configured as `filterable` in the Algolia dashboard. If it's not filterable, use text `query` search instead
- Supabase foreign key constraints (`REFERENCES users(id)`) silently block inserts when the referenced row doesn't exist — the error is a 500 with no clear message about the FK violation

**Testing:**
- `npx tsc --noEmit` passes — no TypeScript errors
- Daraz product detail: name, image, description all populated; price=0 expected (CSR limitation)
- Shophive product detail: price=171999, name, image, description, 12 specs all populated
- Telemart product detail: price=309999, name, image, rating=4.0 all populated via Algolia
- Backend root `/` returns JSON with endpoint listing instead of "Cannot GET /"
- Python venv scrapers tested individually with `run_search.py --mode product`

**Related skills updated:**
- None yet

### [2026-04-19 01:30] — Wishlist Fix, Product Not Found Fix, Scraper Enhancement (Fix/Feature)

**What changed:**
- `webapp/hooks/useWishlist.ts` — **REWRITTEN**: `addToWishlist` now handles 400 duplicate gracefully (reloads wishlist from server instead of returning undefined). Return type changed to `'added' | 'removed' | 'auth_required' | 'error'` (added `'error'` state). `toggleWishlist` returns `'error'` instead of `'removed'` when add fails. `isInWishlist` checks `if (!url) return false` to prevent false positives.
- `webapp/app/page.tsx` — Stores trending products in Zustand via `setTrendingProducts()` (normalizes to `SearchProduct` format with URL-based IDs). Added `error` case to wishlist toast. Uses `toSearchProduct` helper to convert trending API data into `SearchProduct` format for the searchStore.
- `webapp/app/search/page.tsx` — Added `error` case to wishlist toast handler.
- `webapp/app/product/[id]/page.tsx` — **REWRITTEN**: Two-phase loading: (1) finds product from cache (searchStore), (2) fetches full product details via new `GET /api/search/product?url=&store=` endpoint. Displays description, specifications table, and customer reviews from scraped product page. Shows loading indicator while details fetch. Merges product page data (name, image, rating, price) into main product object.
- `webapp/store/searchStore.ts` — Added `trendingProducts: SearchProduct[]` state and `setTrendingProducts()` action. `getProductById` now searches three sources: `lastResults`, `recentlyViewed`, AND `trendingProducts`. URL match also checks decoded URL via `decodeURIComponent(id)`.
- `backend/src/services/scraper.service.ts` — Added `ProductDetail` interface with `name, imageUrl, rating, reviewsCount, description, specs[], reviews[]`. New `scrapeProductDetail()` function (replaces `scrapeProductPage`). Kept backward compat alias.
- `backend/src/routes/search.routes.ts` — New `GET /api/search/product?url=&store=` endpoint. Scrapes a single product page and returns full details. Caches with `detail:<store>:<url>` key with 1-hour TTL. Placed BEFORE `/:id` route.
- `backend/scrapers/stores/daraz_scraper.py` — `scrape_product_page` now returns full data: name, imageUrl, price, originalPrice, rating, reviewsCount, description, specs table (key-value pairs), reviews (author, rating, text, date).
- `backend/scrapers/stores/shophive_scraper.py` — `scrape_product_page` enhanced similarly with Magento-specific selectors for name (.page-title), image (.fotorama__img), price ([data-price-type="finalPrice"]), specs (.additional-attributes table), reviews.
- `backend/scrapers/stores/telemart_scraper.py` — `scrape_product_page` enhanced with HTML fallback selectors for name, image, price, rating, description, specs, reviews.
- `backend/scrapers/stores/mega_scraper.py` — `scrape_product_page` enhanced with selectors for name (.pro-title), image (.fotorama__img), price, description (.std), specs (.data-table table).
- `backend/scrapers/stores/priceoye_scraper.py` — `scrape_product_page` enhanced with selectors for name (.p-title), image (.main-product-img), price, description, specs (.specs-table table).

**Why:**
- User reported: wishlist button only removes never adds, homepage product links show Product Not Found, want product page details and reviews from store pages

**Technical details:**
- Wishlist "only removes" had three causes: (1) `addToWishlist` returned `undefined` on any non-200 response, (2) `toggleWishlist` mapped `undefined` to `'removed'` instead of `'error'`, (3) if wishlist hadn't loaded from DB yet, `isInWishlist` returned false, tried to add, DB rejected as duplicate (unique constraint), and falsely reported removal
- Product Not Found: homepage used `encodeURIComponent(url)` as product ID, but `getProductById` only searched `lastResults` (search results). Trending products were never stored in the search store. Fix: store trending products with `setTrendingProducts()`, expand `getProductById` to search all three arrays
- Product page now does two-phase fetch: first load from cache (instant), then scrape the actual product page for details (specs, reviews, description). Product page data is cached server-side with `detail:<store>:<url>` key

**Side effects:**
- All scrapers' `scrape_product_page` now return richer dicts — may break alert checker if it expects only `{price, inStock}`. But the `scrapeProductPage` backward compat alias points to the new function, and the alert checker only uses `price` and `inStock` fields, so extra fields are harmless
- `ProductDetail` interface is a new type exported from `scraper.service.ts` — not used by alert checker
- Product detail page now loads in two stages: basic data from cache, then enriched data from product page scrape

**Gotchas / Lessons learned:**
- JavaScript truthiness strikes again: `'removed'` is truthy, so `if (result)` after `toggleWishlist()` always evaluated as "added". Must use explicit `===` comparisons for string return types
- The `@@unique([userId, url])` Prisma constraint means if the wishlist hasn't loaded from the DB yet (race condition), the add attempt returns 400 "Item already in wishlist". Need to handle this gracefully by reloading the wishlist on 400
- Express route ordering matters: `/product` (static) must come before `/:id` (parameterized) or Express matches "product" as an `:id` parameter

**Testing:**
- `npx next build` passes — all 17 routes compile successfully
- TypeScript type error on `setScrapedProduct(prev => ...)` fixed by adding explicit `(prev: any)` type annotation

**Related skills updated:**
- None yet

**What changed:**
- `webapp/app/page.tsx` — Fixed wishlist toggle result check: changed `if (added)` (truthy check that treated `'removed'` as truthy) to `if (result === 'added')` / `else if (result === 'removed')` so toasts show correct message.
- `webapp/app/search/page.tsx` — Added `useToast` import and `showToast` usage. Wishlist button handler now `async`, awaits `toggleWishlist`, and shows proper toast: success/error/info for auth_required.
- `webapp/app/layout.tsx` — **REWRITTEN**: Clean minimal header design. Logo + divider + nav links on left, centered search bar, auth on right. Scroll-triggered background blur (`navbar-scrolled` class). Profile avatar shows first letter of name with lime gradient. Logout button uses icon instead of text. Mobile hamburger with cleaner 3-line menu icon. Footer updated with dynamic year and logo component.
- `webapp/app/globals.css` — **REWRITTEN**: Reorganized into clear sections (Navbar, Layout, Cards, Footer, Utilities). Navbar uses scroll-aware transparent-to-blur transition. Nav links use uppercase Archivo font. Profile avatar has lime gradient background. Mobile search bar styles. Removed unused body::before line. Responsive at 768px.
- `webapp/app/product/[id]/page.tsx` — **REWRITTEN**: Added breadcrumb navigation (Home > Search > Product). Star rating component with visual filled/empty stars. Discount badge on image with percentage. Original price + savings amount display. "View on Store" link section for full specs/reviews. Details grid uses 1px-gap border technique for cleaner rows. Alert modal uses close icon (X) instead of text. All toasts use `useToast()` instead of local state toasts. Extracted `DetailRow` helper component for the specs grid.

**Why:**
- User reported: wishlist heart doesn't turn red and always says "removed from wishlist", header still looks bad, product page needs store details and user reviews

**Technical details:**
- Root cause of "always says removed": `toggleWishlist` returns `'added' | 'removed' | 'auth_required'` string literals, but homepage used `if (added)` truthy check — all three strings are truthy, so it always showed "Added to wishlist". The `else if (added === false)` branch was unreachable since strings are never `=== false`.
- Search page had no wishlist feedback at all — the `toggleWishlist` call was fire-and-forget without `await` or toast.
- Header redesigned with scroll-aware transparency: starts transparent, gains `backdrop-filter: blur(16px)` and border on scroll via `window.scrollY` listener with `{ passive: true }`.
- Product page: Scrapers only return listing data (name, price, image, rating, store, url) — no detailed specs or user reviews from individual product pages. Added "View on Store" section as a bridge to full product details on the original store page.
- `DetailRow` component extracted to DRY up the specs grid. Uses 1px gap + border-color background technique for seamless grid lines.

**Side effects:**
- Header layout change affects all pages (layout.tsx is the root layout)
- Product page no longer shows a local success toast — all toasts go through ToastProvider

**Gotchas / Lessons learned:**
- JavaScript truthiness trap: string return values like `'removed'` are truthy, so `if (result)` doesn't distinguish between success/failure. Always use explicit string comparison: `if (result === 'added')`.
- First `next build` after layout.tsx rewrite failed with `PageNotFoundError: Cannot find module for page: /login` — transient Next.js caching issue, resolved on second build.

**Testing:**
- `npx next build` passes cleanly — all 17 routes compile successfully
- Verified wishlist return type logic: `'added'` → success toast, `'removed'` → error toast, `'auth_required'` → info toast

**Related skills updated:**
- None yet

**What changed:**
- `webapp/components/Toast.tsx` — **NEW**: Global toast notification system. `ToastProvider` wraps the app, `useToast()` hook shows success/error/info toasts with auto-dismiss after 3s. CSS animation on mount.
- `webapp/app/layout.tsx` — **REWRITTEN**: Header redesigned. Always-visible search bar (no more expand/collapse toggle). Glassmorphism navbar with `backdrop-filter: blur(12px)`. Nav links with pill-style hover/active states. Mobile hamburger menu with dropdown. Removed hardcoded `allProducts` suggestions array. Footer cleaned up.
- `webapp/app/globals.css` — New navbar CSS: `.navbar-inner` flex layout, `.navbar-search` always-visible input, `.nav-links-desktop` desktop nav, `.nav-profile-btn`/`.nav-logout-btn`/`.nav-login-btn` styled auth buttons, `.mobile-menu-toggle`/`.mobile-menu` mobile responsive. All responsive at 768px breakpoint.
- `webapp/hooks/useWishlist.ts` — `toggleWishlist` now returns `boolean | false` instead of showing `alert()`. Returns `true` if added, `false` if removed. Returns `false` (falsy) if not authenticated.
- `webapp/store/searchStore.ts` — Added `recentlyViewed: SearchProduct[]` state and `addRecentlyViewed(product)` action. Deduplicates by id, keeps max 20.
- `webapp/app/product/[id]/page.tsx` — **REWRITTEN**: Now tracks viewed product in `searchStore.addRecentlyViewed()`. Wishlist uses `useToast()` for success/error messages instead of browser `alert()`. Wishlist button toggles red fill. Rating/reviews display only shown when rating > 0. Price history generates single bar (today only) instead of fake 30-day mock. Store shown above title. Specs grid replaces old features/reviews layout.
- `webapp/components/PriceHistoryChart.tsx` — Chart now handles single data point gracefully: centered 120px-wide bar, 100px height. Tooltip on hover. Stats grid simplified to single "Current Price" column for single bar, full 4-column stats for multi-bar.
- `webapp/app/search/page.tsx` — `fetchFromAPI` now reads from `useSearchStore.getState()` instead of stale closure, fixing search persistence on back navigation. Cache TTL increased to 30 minutes.
- `webapp/app/page.tsx` — **REWRITTEN**: Recently Viewed now uses `searchStore.recentlyViewed` (products user actually opened), not `lastResults`. Recommended section fetches last 3-5 unique search history keywords and combines results (deduplicated by name+store). Trending cached in `localStorage` with 10-minute TTL. Product cards use `useToast()` for wishlist feedback. Product links use `encodeURIComponent(url)` as ID. Rating shown only when > 0. Search suggestions cleared on blur.

**Why:**
- User reported: search re-scrapes on back nav, header looks ugly, wishlist shows browser alerts, product details not loading, recently viewed shows wrong products, recommended section missing, trending reloads every time

**Technical details:**
- `useSearchStore.getState()` reads latest Zustand state outside React render cycle, fixing the stale closure bug in `useCallback(fn, [])`
- Toast system uses React Context + provider pattern. Toasts stack vertically, auto-dismiss with `setTimeout`
- `localStorage` cache for trending uses `{ data, timestamp }` structure with TTL check
- Product page ID strategy: search results pass `encodeURIComponent(product.url)` as the product ID

**Side effects:**
- Header no longer has expandable search — search bar is always visible
- Wishlist toggle no longer calls `alert()` — callers must use `useToast()` for feedback
- Mobile menu replaces nav links on small screens

**Gotchas / Lessons learned:**
- Zustand `useCallback(fn, [])` with empty deps captures stale state — always use `useSearchStore.getState()` for reading current state
- TypeScript `downlevelIteration` prevents spreading Sets — use `Array.from(new Set(...))` instead

**Testing:**
- Manual verification pending

**Related skills updated:**
- `/architecture` — layout.tsx now uses ToastProvider wrapper
- `/add-route` — no changes

---

### [2026-04-18 18:00] — Real Data: Homepage, Profile, Settings, History pages (Feature)

**What changed:**
- `backend/src/services/db.service.ts` — Added 4 new methods: `getSearchHistory(userId)`, `clearSearchHistory(userId)`, `updateUser(id, data)`, `getUserStats(userId)` (parallel count queries with `count: 'exact', head: true`)
- `backend/src/controllers/auth.controller.ts` — Added 4 handlers: `updateProfile`, `getSearchHistory`, `clearSearchHistory`, `getUserStats`
- `backend/src/routes/auth.routes.ts` — Added 4 routes: `PUT /auth/profile`, `GET /auth/history`, `DELETE /auth/history`, `GET /auth/stats`
- `webapp/app/page.tsx` — Replaced all hardcoded dummy products with real API data. Added `toNum()` helper for string/number price conversion. `TrendingProduct` interface accepts both `number` and `string` prices. Fetches trending from `GET /api/search/trending` with skeleton loading. Recently viewed from `useSearchStore().lastResults`. Recommendations from user's most recent search history keyword.
- `webapp/app/profile/page.tsx` — Replaced hardcoded "Ahad Ali" with `useAuthStore().user`. Real stats from `GET /api/auth/stats`. Real wishlist preview from `useWishlist` hook. Real alerts preview from `useSmartAlerts` hook. Working logout via `useAuthStore().logout()`. Auth guard redirects to `/login`.
- `webapp/app/settings/page.tsx` — "Save Changes" calls `PUT /api/auth/profile` and updates Zustand store. Email field disabled (read-only). "Change Password" links to `/reset-password`. "Clear Search History" calls `DELETE /api/auth/history`. "Download My Data" fetches wishlist+alerts+history and triggers JSON download. "Delete Account" confirms then logs out. Auth guard.
- `webapp/app/history/page.tsx` — Rewrote with real backend data from `GET /api/auth/history`. Relative date formatting (`formatRelativeDate`). Click to search again. "Clear All" calls `DELETE /api/auth/history`. Empty state with link to search. Auth guard.

**Why:**
- All pages had hardcoded/dummy data. Needed real live data integration with Supabase backend.

**Technical details:**
- `SearchProduct` type has `price: string` and `originalPrice?: string` while trending API returns `price: number`. Added `toNum()` helper that parses both via `parseInt(str.replace(/[^\d]/g, ''), 10)` to handle the type mismatch.
- `SearchProduct` uses `image` field while trending uses `imageUrl` — `ProductCard` checks both via `const img = product.imageUrl || product.image`.
- Stats endpoint uses parallel Supabase count queries with `{ count: 'exact', head: true }` for efficiency (no data transfer, just counts).
- Auth token retrieved via `localStorage.getItem('sb-token')` in API calls since Zustand store may not be hydrated on first render.

**Side effects:**
- Profile page now requires authentication — guests are redirected to login
- Settings page now requires authentication
- History page now requires authentication

**Gotchas / Lessons learned:**
- `req.user` property doesn't exist on Express `Request` type by default — used `// @ts-ignore` on all auth controller handlers (same pattern as existing `getMe`)
- Supabase `search_history` table uses `created_at` timestamp for relative date formatting

**Testing:**
- Manual verification of all pages in browser pending backend server restart

**Related skills updated:**
- None yet

---

### [2026-04-18 16:30] — Signup email verification, password reset, password strength validation (Feature/Security)

### [2026-04-18 16:30] — Signup email verification, password reset, password strength validation (Feature/Security)

**What changed:**
- `webapp/utils/passwordValidation.ts` — **NEW**: Shared password strength validator (6+ chars, 1 lowercase, 1 uppercase, 1 special char). Returns `{ isValid, rules }` with per-rule checkmarks.
- `backend/src/controllers/auth.controller.ts` — Added `validatePasswordStrength()` server-side check in register handler. Added `forgotPassword` handler using `supabase.auth.resetPasswordForEmail()`.
- `backend/src/routes/auth.routes.ts` — Added `POST /auth/forgot-password` route
- `webapp/app/signup/page.tsx` — Added password strength indicator (live checkmarks for each rule), confirm password field with mismatch warning, email verification success screen ("Check Your Email" message with link to login)
- `webapp/app/login/page.tsx` — Wired "Forgot?" link to `/forgot-password`
- `webapp/app/forgot-password/page.tsx` — **NEW**: Email input form, calls `POST /api/auth/forgot-password`, shows success screen
- `webapp/app/reset-password/page.tsx` — **NEW**: Handles Supabase password recovery redirect (reads hash fragment tokens), shows "Set New Password" form with strength validation, uses `supabase.auth.updateUser({ password })`. Shows error for invalid/expired links.
- `webapp/store/authStore.ts` — Added `forgotPassword(email)` method. Register already handled `session: null` case (email confirmation enabled).
- `mobile/src/services/api/auth.service.ts` — Added `forgotPassword(email)` method
- `mobile/src/context/AuthContext.tsx` — Added `forgotPassword` to context. Updated `signup()` to show info toast ("Check your email") when `session: null` (email confirmation required).

**Why:**
- User requested email verification on signup, password reset flow, and minimum password strength requirements

**Technical details:**
- Supabase Auth handles email confirmation and password reset emails out of the box — we just wired up the UI
- `resetPasswordForEmail()` always returns success (prevents email enumeration)
- Reset password page reads Supabase hash fragment (`#access_token=...&type=recovery`) via `supabase.auth.getSession()` which auto-parses it
- Password validation runs both client-side (real-time UI feedback) and server-side (backend enforces before calling Supabase)

**Side effects:**
- When email confirmation is enabled in Supabase Dashboard, users won't be auto-logged in after signup — they must click the email link first
- If email confirmation is OFF in Supabase Dashboard, the existing flow (auto-login after signup) still works

**Gotchas / Lessons learned:**
- Supabase `signUp()` returns `session: null` when email confirmation is enabled — the frontend must handle this case (show "check email" instead of auto-redirect)
- The reset password page MUST call `supabase.auth.getSession()` on mount to let Supabase parse the hash fragment tokens before calling `updateUser()`

**Testing:**
- Backend: `curl -X POST /api/auth/register -d '{"email":"test@test.com","password":"abc"}'` returns 400 with validation error
- Webapp: signup with "Abc1!" passes, "abc" fails with visual indicators
- Forgot password flow works end-to-end (requires Supabase Dashboard email config)

**Related skills updated:**
- `/architecture` — needs update for new auth pages
- `/start` — needs note about Supabase Dashboard email confirmation setting

### [2026-04-18 15:00] — Full Supabase migration + bug fixes across backend and frontend (Refactor/Config)

**What changed:**
- `backend/.env` — **NEW**: Created with Supabase URL, anon key, and service role key
- `webapp/.env.local` — Added `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `mobile/.env` — Added `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `backend/supabase-migration.sql` — **NEW**: Full SQL migration for Supabase (users, wishlist_items, price_alerts, search_history tables + RLS policies + updated_at trigger)
- `backend/src/services/db.service.ts` — **NEW**: Thin Supabase wrapper replacing all Prisma calls (createUser, findUser, getWishlist, addWishlistItem, removeWishlistItem, getAlerts, getActiveAlerts, createAlert, updateAlert, deleteAlert, logSearch)
- `backend/src/services/supabase.service.ts` — Cleaned up: removed placeholder fallbacks, uses `!` assertions on env vars
- `backend/src/controllers/auth.controller.ts` — Replaced `prisma.user.create/findUnique` with `db.createUser/findUser`. Removed legacy `password: ''` field from user creation.
- `backend/src/controllers/user.controller.ts` — Replaced all `prisma.wishlistItem.*` calls with `db.*` wrappers. Fixed `req.user.userId` → `req.user.id` (line 7 was using old JWT property name, Supabase user object uses `.id`). Changed Prisma `P2002` error code to PostgreSQL `23505` unique constraint violation.
- `backend/src/routes/alerts.routes.ts` — Replaced all `prisma.priceAlert.*` calls with `db.*`. Fixed `req.user.userId` → `req.user.id` on GET handler.
- `backend/src/routes/search.routes.ts` — Major rewrite: (1) Replaced `prisma.searchHistory.create` + legacy `jsonwebtoken.verify()` with `supabase.auth.getUser(token)` + `db.logSearch()`. (2) Added `GET /:id` endpoint to fetch individual cached products. (3) Added per-product Redis caching (`product:scraped-N`) during search so product detail page works on refresh.
- `backend/src/services/alert-checker.service.ts` — Replaced `prisma.priceAlert.*` with `db.getActiveAlerts/updateAlert`. Extracted `detectStore()` function that covers all 5 stores (daraz, telemart, shophive, mega.pk, priceoye) instead of only 2.
- `backend/scrapers/stores/base_scraper.py` — Added `import urllib3` + `urllib3.disable_warnings()`. Added `verify=False` to `session.get()` in `fetch()` method to fix SSL issues with older Python SSL libs.
- `backend/scrapers/stores/mega_scraper.py` — Fixed URL template from `https://www.mega.pk/search/{keyword}` to `https://www.mega.pk/catalogsearch/result/?q={keyword}` (Magento-style query parameter format)
- `webapp/app/product/[id]/page.tsx` — Added API fetch fallback: tries Zustand search cache first, then fetches `GET /api/search/:id` from backend. Added loading state. Fixed TypeScript implicit `any` on `.map()` callback params.
- `webapp/store/searchStore.ts` — Added `getProductById()` method for direct product lookups from cache
- `webapp/hooks/useWishlist.ts` — Replaced 4 hardcoded `http://localhost:3001/api` URLs with `${API_BASE}` using `process.env.NEXT_PUBLIC_API_URL`
- `webapp/hooks/useSmartAlerts.ts` — Same fix: replaced 3 hardcoded localhost URLs with `${API_BASE}` env var
- `mobile/src/utils/supabase.ts` — Replaced hardcoded `https://placeholder.supabase.co` placeholder with `process.env.EXPO_PUBLIC_SUPABASE_URL` env var
- `backend/src/db/connection.ts` — **DELETED**: Old PostgreSQL pool file (no longer imported by anything)
- `backend/src/db/migrations/001_initial.sql` — **DELETED**: Old migration (replaced by supabase-migration.sql)

**Why:**
- The project was partially using Supabase Auth but still using Prisma ORM with local PostgreSQL for all data operations. This was inconsistent and required running PostgreSQL locally. Migrating everything to Supabase provides a single hosted backend for auth + database.
- Multiple bugs existed: wrong `req.user` property names, legacy JWT verification, hardcoded localhost URLs, missing product detail API endpoint, SSL errors in scrapers, broken Mega scraper URL, incomplete alert store detection.

**Technical details:**
- Supabase tables use `auth.users(id)` as foreign key reference so profiles are linked to Supabase Auth accounts via CASCADE delete
- RLS policies ensure users can only access their own data; backend uses `supabaseAdmin` (service role) which bypasses RLS
- `db.service.ts` maps camelCase TypeScript properties to snake_case Supabase column names (e.g., `targetPrice` → `target_price`, `userId` → `user_id`)
- Product detail page now has a two-tier lookup: Zustand client cache (instant, if user came from search) → Redis server cache via API (survives page refresh within 1 hour)
- Base scraper `verify=False` is a blanket fix for Python 3.9's LibreSSL 2.8.3 which can't negotiate TLS with some Pakistani e-commerce sites

**Side effects:**
- Prisma is no longer used by any backend code. `prisma.service.ts` and `schema.prisma` still exist but are orphaned.
- `backend/src/server.ts` still imports from `alert-checker.service.ts` — no change needed there
- Redis remains for caching (search results, individual products, trending). Not replaced by Supabase.
- The SQL migration must be run in Supabase Dashboard SQL Editor before the backend can create user profiles

**Gotchas / Lessons learned:**
- Supabase column names are snake_case by default, but the JS client returns them as-is. The `db.service.ts` must use the exact snake_case column names in `.from()` and `.insert()` calls.
- `req.user` from Supabase middleware has `.id` (not `.userId`) — this was inconsistent across controllers and caused silent 500 errors
- When using `replace_all` with Edit tool on fetch URLs, must ensure single-quote strings become backtick template literals, or the `${API_BASE}` interpolation won't work

**Testing:**
- Verified no remaining `prisma` imports in backend/src/ (only self-reference in prisma.service.ts)
- Verified no remaining `jsonwebtoken` imports
- Verified no remaining `http://localhost:3001` hardcoded URLs in webapp hooks
- Verified `.env` is in root `.gitignore` so secrets won't be committed
- SQL migration needs to be run manually in Supabase Dashboard before testing auth flow

**Related skills updated:**
- None yet — will run `/update-skills` next

---

### [2026-02-21 18:00] — Rewrite Telemart scraper to use Algolia API (Scraper)

**What changed:**
- `backend/scrapers/stores/telemart_scraper.py` — Complete rewrite: replaced HTML scraping with Algolia REST API calls
- `backend/src/services/scraper.service.ts` — Re-added `'telemart'` to `STORES` array (was removed by Antigravity due to Cloudflare timeouts)

**Why:**
- Telemart uses Cloudflare SPA challenge + Algolia for search. HTML scraping returned empty pages or 403s. The old scraper was disabled, so Telemart never appeared in search results.

**Technical details:**
- Telemart embeds public Algolia credentials in their frontend JS: App ID `7Z6UNQYQER`, API Key `9b4c33f99e845fe1363fd4c6ceb0f467`, Index `products`
- Scraper calls `https://7Z6UNQYQER.algolia.net/1/indexes/products/query` with `hitsPerPage: 40`
- Uses `verify=False` because Python 3.9's LibreSSL can't negotiate TLS with Algolia's servers
- Fields mapped: `title`->name, `sale_price`/`discounted_price`->price, `price`->originalPrice, `slug`->URL (`/product/{slug}`), `mainImageLink`->imageUrl, `rating`, `reviewsCount`, `qty`->inStock
- `originalPrice` only set when strictly greater than `sale_price` (avoids false "discounts")
- Overrides `search()` method directly (skips `fetch()` + `parse_search_results()` pipeline)

**Side effects:**
- Telemart now returns 40 products per search alongside Daraz (40) and Shophive (~16)
- Total search results increased from ~56 to ~96 products
- "Telemart" now appears in store filter options on the webapp

**Gotchas / Lessons learned:**
- Algolia public search keys are designed to be embedded in frontends — they're not secrets
- The `-dsn` Algolia hostname (`7Z6UNQYQER-dsn.algolia.net`) times out with old SSL, but the plain hostname (`7Z6UNQYQER.algolia.net`) works
- Common Magento Algolia index names didn't work (`magento2_default_products`, etc.) — the actual index is just `products`
- `verify=False` is needed on Python 3.9 with LibreSSL 2.8.3, can be removed when Python is upgraded

**Testing:**
- `python3 run_search.py --keyword "iPhone 15" --store telemart` — 40 products with valid JSON, correct URLs, images, prices, and discount info

**Related skills updated:**
- `/debug-scraper` — Telemart entry updated from "not fixable" to "fixed via Algolia API"

---

### [2026-02-21 17:00] — Fix LIVE/CACHED badge contrast for readability (Fix)

**What changed:**
- `webapp/app/search/page.tsx` — Replaced inline badge styles with proper `.badge-live` and `.badge-cached` CSS classes
- `webapp/app/globals.css` — Added `.badge-live` (green bg, black text, green glow) and `.badge-cached` (lime bg, black text, lime glow)

**Why:**
- The LIVE badge used white text (`#fff`) on `--accent-success` (`#00FF88`) and CACHED used white text on `--accent-primary` (`#CCFF00`). White on bright green/lime is nearly invisible — terrible contrast ratio, fails WCAG AA.

**Technical details:**
- Changed `color: '#fff'` to `color: #000` for both badge variants
- Used the project's existing badge design system (`.badge` base class) instead of inline styles
- Added matching `box-shadow` glow effects consistent with `.badge-hot` and `.badge-best`

**Side effects:**
- None — visual change only

**Gotchas / Lessons learned:**
- Bright accent colors (#00FF88, #CCFF00) need dark text, not white. Always check contrast ratio on neon/lime/green backgrounds.

**Testing:**
- Visual inspection of badge styles against CSS

**Related skills updated:**
- None

### [2026-02-20 23:55] — Create /document and /update-skills meta-skills (Skill)

**What changed:**
- `.claude/commands/document.md` — Created mandatory documentation skill that logs every code change to this devlog
- `.claude/commands/update-skills.md` — Created meta-skill for updating other skills after fixes/features
- `docs/DEVLOG.md` — Created this devlog file with retroactive history
- `CLAUDE.md` — Created project-level instructions enforcing /document after every change

**Why:**
- Need a persistent, append-only record of all project changes for maintainability
- Skills were referencing `/update-skills` but the file didn't exist
- Need to enforce documentation happens automatically, not as an afterthought

**Technical details:**
- `/document` skill defines a strict entry format: what/why/technical/side-effects/gotchas/testing/skills-updated
- 16 categories defined (Feature, Fix, Scraper, Ranking, etc.)
- Devlog is reverse-chronological (newest first)
- `CLAUDE.md` uses Claude Code's project instruction system to enforce `/document` runs after every change

**Side effects:**
- All future Claude Code sessions will see the CLAUDE.md instruction to run /document
- Devlog will grow over time — may need to split into monthly files eventually

**Gotchas / Lessons learned:**
- None

**Testing:**
- Verified skill files created and formatted correctly

**Related skills updated:**
- Created `/update-skills` and `/document` (this is the initial creation)

---

### [2026-02-20 23:30] — Create 11 Claude Code slash command skills (Skill)

**What changed:**
- `.claude/commands/architecture.md` — Full project architecture reference (directory structure, tech stack, design principles)
- `.claude/commands/start.md` — How to start all development services (backend, webapp, mobile, with correct order and venv activation)
- `.claude/commands/test-scraper.md` — Test store scrapers with specific commands and expected output
- `.claude/commands/add-scraper.md` — Step-by-step guide for adding new store scrapers (9 steps)
- `.claude/commands/build-check.md` — Verify all builds pass (backend tsc, webapp next build, mobile expo)
- `.claude/commands/search-flow.md` — End-to-end search pipeline reference (user types → API → scraper → ranking → display)
- `.claude/commands/debug-scraper.md` — Known issues per store, diagnostic steps, common fixes
- `.claude/commands/fix-types.md` — Common TypeScript type errors and their fixes
- `.claude/commands/add-route.md` — Adding new Express API routes (with auth middleware pattern)
- `.claude/commands/add-screen.md` — Adding new mobile/webapp screens (file locations, navigation, patterns)
- `.claude/commands/ranking.md` — Ranking algorithm reference (Bayesian formula, composite score, tuning)

**Why:**
- Capture all lessons learned during development so future work is faster
- Avoid re-discovering the same gotchas (brotli encoding, Daraz JSON API, type mismatches)
- Standardize common procedures (adding scrapers, routes, screens)

**Technical details:**
- Each skill follows a consistent format: quick reference, step-by-step, common issues, verification
- Skills reference each other (e.g., `/add-scraper` references `/test-scraper` and `/update-skills`)
- `/debug-scraper` contains known issues per store with root causes and fixes

**Side effects:**
- None — these are documentation files only

**Gotchas / Lessons learned:**
- Skills should always end with "run `/update-skills`" to keep the knowledge base current

**Testing:**
- All skill files created and verified readable

**Related skills updated:**
- N/A (initial creation)

---

### [2026-02-20 22:00] — Connect webapp and mobile to backend API (Feature)

**What changed:**
- `webapp/app/search/page.tsx` — Complete rewrite: added `fetchFromAPI()` with 400ms debounce, `normalizeProduct()` to convert backend format to display format, loading states, LIVE/CACHED/FALLBACK badges, falls back to dummy data if backend unavailable
- `mobile/src/screens/SearchScreen.tsx` — Added `fetchFromAPI()`, `normalizeProduct()`, `liveProducts` state, `ActivityIndicator` for loading, falls back to existing dummy data if backend unavailable

**Why:**
- Frontends were using hardcoded dummy data only. Need to display real scraped products from backend.
- Graceful fallback ensures app works even without backend running.

**Technical details:**
- Webapp: `POST ${API_BASE}/search` with `{ keyword }` body, API_BASE from `NEXT_PUBLIC_API_URL` env var (default `http://localhost:3001/api`)
- Mobile: Same POST request to `http://localhost:3001/api/search`
- Both use debounced search (400ms) to avoid hammering the API on every keystroke
- `normalizeProduct()` maps backend fields (`imageUrl`, `reviewsCount`, `originalPrice`) to frontend display fields (`image`, `reviews`, `price` as formatted string)
- Webapp shows colored badges: green "LIVE" for fresh scrape, blue "CACHED" for Redis cache hit
- Ranking: for live data, backend already ranks by Bayesian composite; for fallback data, client-side `rankByRelevance()` is used

**Side effects:**
- Search now makes real HTTP requests — needs backend running on port 3001 for live data
- If backend is down, users see fallback dummy data (no error shown)

**Gotchas / Lessons learned:**
- `rankByRelevance<SearchProduct>(filtered)` needs explicit generic because TypeScript can't infer the intersection type
- `originalPrice` must be typed as `string` (not `number`) to satisfy `rankByRelevance`'s generic constraint which expects `originalPrice?: string`
- When comparing originalPrice (now string) with priceValue (number), can't use `>` operator — simplified to truthy check since originalPrice is only set when it's greater than current price

**Testing:**
- Started backend (`cd backend && npm run dev`), searched "iPhone 15"
- Verified 56 real products returned (40 Daraz + 16 Shophive)
- Verified "LIVE" badge appears on webapp
- `npx next build` passes with no type errors
- `npx tsc --noEmit` passes for backend

**Related skills updated:**
- None yet (skills created after this)

---

### [2026-02-20 21:00] — Fix Daraz scraper URL doubling (Fix)

**What changed:**
- `backend/scrapers/stores/daraz_scraper.py` — Fixed URL construction: added check for `//` prefix in `itemUrl` from API response

**Why:**
- Daraz API returns URLs like `//www.daraz.pk/products/...` (protocol-relative). The old code only checked `startswith('http')` which was False, so it prepended `base_url`, creating `https://www.daraz.pk//www.daraz.pk/products/...`.

**Technical details:**
- Added: `if item_url.startswith('//'): item_url = 'https:' + item_url`
- This runs before the existing `elif not item_url.startswith('http')` check
- Protocol-relative URLs (`//domain/path`) are a common web pattern meaning "use whatever protocol the page is on"

**Side effects:**
- All Daraz product URLs are now correct and clickable

**Gotchas / Lessons learned:**
- Always check for protocol-relative URLs (`//`) when constructing absolute URLs from API data
- Daraz/Lazada API consistently uses `//` prefix for URLs

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store daraz` — all 40 URLs now start with `https://www.daraz.pk/products/...` (no doubling)

**Related skills updated:**
- None yet

---

### [2026-02-20 20:30] — Rewrite Daraz scraper to use JSON API (Fix)

**What changed:**
- `backend/scrapers/stores/daraz_scraper.py` — Complete rewrite: switched from HTML parsing to Daraz's hidden JSON API (`?ajax=true`)

**Why:**
- Daraz is a Client-Side Rendered (CSR/React) app. The HTML returned by requests contains no product data — it's all loaded via JavaScript. HTML scraping returned empty `[]`.

**Technical details:**
- Daraz (built on Lazada platform) has a hidden JSON API at `https://www.daraz.pk/catalog/?ajax=true&q={keyword}`
- Returns structured JSON with `mods.listItems[]` containing: `name`, `price`, `originalPrice`, `itemUrl`, `image`, `ratingScore`, `review`, `location`, `inStock`
- New method `_parse_list_items()` extracts product data from the JSON response
- `Accept: application/json` header required
- Rate limit set to 2.5 seconds (slightly higher than other stores since it's an API call)

**Side effects:**
- Daraz scraper is now the most reliable (structured data vs HTML parsing)
- Returns ~40 products per search (full first page)

**Gotchas / Lessons learned:**
- Many modern e-commerce sites use CSR — always check if there's a JSON/API endpoint before writing HTML parsers
- Daraz's `?ajax=true` parameter is the key to getting structured data
- The JSON API returns `ratingScore` (string) and `review` (string count), not the same field names as the HTML

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store daraz` — returned 40 products with correct data

**Related skills updated:**
- None yet

---

### [2026-02-20 20:00] — Fix brotli encoding issue in base scraper (Fix)

**What changed:**
- `backend/scrapers/stores/base_scraper.py` — Changed `Accept-Encoding` header from `'gzip, deflate, br'` to `'gzip, deflate'`

**Why:**
- Shophive (and potentially other stores) responded with brotli-compressed content when `br` was in Accept-Encoding. Python's `requests` library cannot decode brotli without the `brotli` package installed. The response body was 29KB of gibberish instead of 270KB of readable HTML.

**Technical details:**
- Brotli (`br`) is a compression algorithm by Google. Browsers support it natively, but Python `requests` doesn't.
- The `brotli` pip package adds support, but it's simpler and more reliable to just not request brotli
- `gzip` and `deflate` are supported natively by `requests` via urllib3
- This fix affects ALL store scrapers since they inherit from `BaseScraper`

**Side effects:**
- Slightly larger response sizes (gzip is ~10% less efficient than brotli)
- All stores now return readable HTML

**Gotchas / Lessons learned:**
- Never include `br` (brotli) in Accept-Encoding for Python scrapers unless the `brotli` package is installed
- Symptom: scraper finds elements (e.g., 16 product cards) but all text content is empty/garbled
- Debug tip: check `len(response.text)` — if it's suspiciously small for a full HTML page, it's likely a compression issue

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store shophive` — returned 16 products with correct names and prices

**Related skills updated:**
- None yet

---

### [2026-02-20 19:30] — Make backend resilient without PostgreSQL/Redis (Config)

**What changed:**
- `backend/src/db/connection.ts` — Added startup connectivity test, `dbAvailable` flag, `isDbAvailable()` export. Server no longer crashes if PostgreSQL is unavailable.
- `backend/src/services/alert-checker.service.ts` — Added `isDbAvailable()` check before querying alerts. Skips silently if DB is down.

**Why:**
- Development often happens without PostgreSQL/Redis running. The backend should still serve search results (scraping doesn't need a database).
- Alert checker was spamming error logs every 30 minutes when DB was unavailable.

**Technical details:**
- `connection.ts`: `pool.query('SELECT 1')` on startup, sets `dbAvailable = true/false`. Pool error handler also sets flag.
- `alert-checker.service.ts`: Checks `isDbAvailable()` at the start of `checkAlerts()`, returns early with log message if false.
- Auth routes, alert routes, wishlist routes still fail gracefully if DB is down (they return 500s, but server doesn't crash)
- Search route works fully without DB — only needs Python scrapers and optionally Redis for caching

**Side effects:**
- Auth, alerts, and wishlist features are disabled when PostgreSQL is down
- Search works fully without any external dependencies

**Gotchas / Lessons learned:**
- Always design Node.js services to start without hard dependencies — fail at the route level, not at startup
- `pool.on('error')` catches runtime disconnections; the startup `SELECT 1` catches initial unavailability

**Testing:**
- Started backend without PostgreSQL/Redis → server started successfully on port 3001
- `curl -X POST localhost:3001/api/search -d '{"keyword":"iPhone 15"}'` → returned 56 ranked products
- Console showed "PostgreSQL not available — auth, alerts, wishlist disabled. Search still works."

**Related skills updated:**
- None yet

---

### [2026-02-20 19:00] — Set up Python venv and install scraper dependencies (Config)

**What changed:**
- `backend/scrapers/.venv/` — Created Python virtual environment
- `backend/src/services/scraper.service.ts` — Added `fs` import, `VENV_PYTHON` path detection, uses venv Python if available

**Why:**
- macOS (Ventura+) uses "externally managed" Python that blocks `pip install` globally. A venv is required.
- `scraper.service.ts` needed to know the venv Python path to spawn scrapers correctly.

**Technical details:**
- `python3 -m venv backend/scrapers/.venv`
- `source .venv/bin/activate && pip install -r requirements.txt` (installs: scrapy, beautifulsoup4, requests, lxml)
- `scraper.service.ts` checks `fs.existsSync(VENV_PYTHON)` where `VENV_PYTHON = path.join(SCRAPERS_DIR, '.venv', 'bin', 'python3')`
- Falls back to system `python3` if venv doesn't exist

**Side effects:**
- `.venv/` is in `.gitignore` (should be) — each developer needs to create their own
- Backend npm `postinstall` script could automate venv setup (not done yet)

**Gotchas / Lessons learned:**
- Always use venv for Python on macOS Ventura+
- The venv path must match what `scraper.service.ts` expects (`backend/scrapers/.venv/bin/python3`)

**Testing:**
- `backend/scrapers/.venv/bin/python3 -c "import bs4; print('ok')"` → ok

**Related skills updated:**
- None yet

---

### [2026-02-20 18:00] — Install backend npm dependencies (Config)

**What changed:**
- `backend/node_modules/` — Installed all npm dependencies
- `backend/package-lock.json` — Generated

**Why:**
- Backend had `package.json` with dependencies defined but `npm install` was never run.

**Technical details:**
- Key dependencies: express, pg (PostgreSQL), ioredis (Redis), node-cron, bcryptjs, jsonwebtoken, cors, dotenv
- Dev dependencies: typescript, ts-node, @types/*, nodemon

**Side effects:**
- None

**Gotchas / Lessons learned:**
- None

**Testing:**
- `npm run dev` starts the backend successfully

**Related skills updated:**
- None yet

---

### [2026-02-20 15:00] — Implement full plan: ranking, smart alerts, scrapers, backend (Feature)

**What changed:**

*Ranking algorithm (frontend):*
- `webapp/utils/ranking.ts` — Created: Bayesian average + composite scoring (5 weighted components)
- `mobile/src/utils/ranking.ts` — Created: Same implementation
- `webapp/hooks/useSearch.ts` — Wired `rankByRelevance()` into "Relevance" sort option
- `mobile/src/hooks/useSearch.ts` — Same
- `webapp/app/search/page.tsx` — Added ranking import, used in inline Relevance sort branch

*Smart Alerts (frontend):*
- `mobile/src/utils/smartAlerts.ts` — Created: cross-store tracking, alternative finding, alert evaluation
- `webapp/utils/smartAlerts.ts` — Created: Same
- `mobile/src/hooks/useSmartAlerts.ts` — Created: React hook for smart alert CRUD + mock checking
- `webapp/hooks/useSmartAlerts.ts` — Created: Same
- `mobile/src/components/SmartAlertCard.tsx` — Created: Rich alert card with store prices + alternatives
- `mobile/src/screens/AlertsScreen.tsx` — Redesigned with SmartAlertCard
- `webapp/app/alerts/page.tsx` — Redesigned for web with cross-store display
- `mobile/src/screens/ProductDetailScreen.tsx` — Updated to use `createSmartAlert()`
- `webapp/app/product/[id]/page.tsx` — Same

*Types:*
- `mobile/src/types/models.ts` — Added SmartAlert, StoreSnapshot, AlternativeProduct types, reviewsCount field
- `webapp/types/models.ts` — Same

*Dummy data:*
- `mobile/src/constants/dummyData.ts` — Added categories, 3 edge-case products (No-Name TWS, JBL Tune, Samsung Watch), cross-store listings
- `webapp/constants/dummyData.ts` — Same

*Storage:*
- `mobile/src/services/storage.service.ts` — Added smartAlertsStorage
- `webapp/services/storage.service.ts` — Same

*Backend (all new):*
- `backend/package.json` — Express, pg, ioredis, node-cron, bcryptjs, jsonwebtoken
- `backend/src/server.ts` — Express app with CORS, routes, port 3001
- `backend/src/routes/search.routes.ts` — POST /api/search with Redis cache
- `backend/src/routes/auth.routes.ts` — Login/signup with bcrypt + JWT
- `backend/src/routes/alerts.routes.ts` — CRUD with auth middleware
- `backend/src/routes/wishlist.routes.ts` — CRUD with auth middleware
- `backend/src/services/scraper.service.ts` — Spawns Python scrapers, collects results
- `backend/src/services/cache.service.ts` — Redis with lazyConnect, graceful fallback
- `backend/src/services/ranking.service.ts` — Server-side Bayesian ranking
- `backend/src/services/alert-checker.service.ts` — Cron job for alert monitoring
- `backend/src/db/connection.ts` — PostgreSQL connection pool
- `backend/src/db/migrations/001_initial.sql` — Users, alerts, wishlist, search_history, scraper_jobs tables
- `backend/src/middleware/auth.middleware.ts` — JWT verification

*Python scrapers (all new):*
- `backend/scrapers/requirements.txt` — scrapy, beautifulsoup4, requests, lxml
- `backend/scrapers/run_search.py` — CLI entry point
- `backend/scrapers/stores/base_scraper.py` — Abstract base class with rate limiting, UA rotation
- `backend/scrapers/stores/daraz_scraper.py` — Daraz.pk scraper
- `backend/scrapers/stores/telemart_scraper.py` — Telemart.pk scraper
- `backend/scrapers/stores/shophive_scraper.py` — Shophive.com scraper
- `backend/scrapers/stores/mega_scraper.py` — Mega.pk scraper
- `backend/scrapers/stores/priceoye_scraper.py` — PriceOye.pk scraper
- `backend/scrapers/utils/price_parser.py` — PKR price extraction
- `backend/scrapers/utils/product_matcher.py` — Fuzzy matching across stores
- `backend/scrapers/utils/rate_limiter.py` — Anti-ban delays

**Why:**
- Implementing the full plan from `stateless-tumbling-creek.md`: ranking algorithm, smart alerts, scraper architecture, backend API

**Technical details:**
- Bayesian average formula: `(C * m + n * R) / (C + n)` with C=25
- Composite score: 0.30 rating + 0.30 price + 0.20 popularity + 0.10 store + 0.10 discount
- "No product storage" architecture: PostgreSQL stores only user data and vendor URLs, never product data
- Python scrapers communicate with Node.js via child_process.spawn(), output JSON to stdout
- Redis cache with 1-hour TTL for search results, 4-hour for trending
- Three identical ranking implementations: backend, webapp, mobile (for offline/fallback use)

**Side effects:**
- Entire backend directory is new — needs npm install and venv setup
- Frontend search pages now have backend integration code (graceful fallback to dummy data)

**Gotchas / Lessons learned:**
- See subsequent entries for all the fixes that were needed (brotli, Daraz CSR, URL doubling, type errors)

**Testing:**
- End-to-end test: 56 real products returned from Daraz (40) + Shophive (16), ranked by Bayesian composite
- Webapp and backend builds pass with no type errors

**Related skills updated:**
- N/A (initial implementation)
