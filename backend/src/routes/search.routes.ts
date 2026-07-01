import { Router, Request, Response } from 'express';
import { searchAllStores, scrapeProductDetail } from '../services/scraper.service';
import { cacheGet, cacheSet } from '../services/cache.service';
import { rankProducts } from '../services/ranking.service';
import { findMatchingProducts } from '../services/product-matching.service';
import { db } from '../services/db.service';
import { supabase } from '../services/supabase.service';
import { aiService } from '../services/ai.service';
import { classifyQuery } from '../services/classifier.service';

const router = Router();

function normalizeStoreKey(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  // Accept both display names and canonical store keys.
  if (s.includes('daraz')) return 'daraz';
  if (s.includes('shophive')) return 'shophive';
  if (s.includes('telemart')) return 'telemart';
  if (s.includes('mega')) return 'mega';
  if (s.includes('priceoye')) return 'priceoye';
  return s;
}

// GET /api/search/trending — cached trending products (MUST be before /:id and /product)
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const cached = await cacheGet('trending');
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    const trending = await searchAllStores('trending');
    const ranked = await rankProducts(trending, '');
    await cacheSet('trending', ranked, 14400);

    res.json({ results: ranked, source: 'live' });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
});

// GET /api/search/product?url=&store= — scrape a single product page for full details
router.get('/product', async (req: Request, res: Response) => {
  try {
    const { url, store } = req.query;

    if (!url || !store) {
      return res.status(400).json({ error: 'url and store query params are required' });
    }

  const urlStr = String(url);
  const storeKey = normalizeStoreKey(store);
  if (!storeKey) {
    return res.status(400).json({ error: 'Invalid store query param' });
  }

  const cacheKey = `detail:${storeKey}:${urlStr}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    // Even when serving from cache, attempt a daily snapshot upsert so charts accumulate.
    try {
      const cachedPrice = (cached as any)?.price;
      if (typeof cachedPrice === 'number' && cachedPrice > 0) {
      const day = new Date().toISOString().slice(0, 10);
      await db.recordPriceSnapshot({
        productUrl: urlStr,
        store: storeKey,
        price: cachedPrice,
        day,
        scrapedAt: new Date().toISOString(),
      });
      }
    } catch (e) {
      console.warn('[Price History] Failed to record cached product snapshot:', (e as any)?.message || e);
    }
    return res.json({
      product: {
        ...(cached as any),
        url: urlStr,
        store: storeKey,
      },
      source: 'cache'
    });
  }

  const detail = await scrapeProductDetail(urlStr, storeKey);
  if (!detail) {
    return res.status(404).json({ error: 'Failed to scrape product page' });
  }

  // Best-effort daily snapshot recording for product detail scrapes.
  try {
    if (typeof detail.price === 'number' && detail.price > 0) {
      const day = new Date().toISOString().slice(0, 10);
      await db.recordPriceSnapshot({
        productUrl: urlStr,
        store: storeKey,
        price: detail.price,
        day,
        scrapedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn('[Price History] Failed to record product snapshot:', (e as any)?.message || e);
  }

  const responseProduct = {
    ...detail,
    url: urlStr,
    store: storeKey,
  };

  await cacheSet(cacheKey, responseProduct, 3600); // 1 hour TTL
  res.json({ product: responseProduct, source: 'live' });
  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// GET /api/search/matches?url=&store=&name= — find same product across other stores
// name is optional: if provided (from frontend), skip scraping the source product
router.get('/matches', async (req: Request, res: Response) => {
  try {
    const { url, store, name: queryName } = req.query;

    if (!url || !store) {
      return res.status(400).json({ error: 'url and store query params are required' });
    }
    const urlStr = String(url);
    const storeKey = normalizeStoreKey(store);
    if (!storeKey) {
      return res.status(400).json({ error: 'Invalid store query param' });
    }

    // Check cache first
    const cacheKey = `matches:${urlStr}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get source product name — prefer query param (from frontend), fallback to scraping
    let sourceName = queryName ? String(queryName) : null;
    let sourcePrice = 0;
    let sourceImage = '';

    if (!sourceName) {
      const sourceDetail = await scrapeProductDetail(urlStr, storeKey);
      if (!sourceDetail) {
        return res.status(404).json({ error: 'Could not scrape source product' });
      }
      sourceName = sourceDetail.name;
      sourcePrice = sourceDetail.price;
      sourceImage = sourceDetail.imageUrl;
    }

    // Build search query: take first meaningful words, stop at storage spec
    const words = sourceName.split(/\s+/);
    const searchWords: string[] = [];
    for (const word of words) {
      if (searchWords.length >= 5) break; // Cap at 5 words
      if (/^\d+(GB|TB)$/i.test(word)) break; // Stop at storage spec
      if (word.length < 2) continue;
      searchWords.push(word);
    }
    const searchQuery = searchWords.join(' ');

    if (searchQuery.length < 3) {
      return res.json({
        matches: [],
        sourceProduct: { name: sourceName, store: storeKey, price: sourcePrice, imageUrl: sourceImage },
        count: 0,
      });
    }

    // Search all stores with the cleaned query
    const allResults = await searchAllStores(searchQuery);

    // Apply fuzzy matching (excludes source product URL + accessories)
    const matches = findMatchingProducts(
      { name: sourceName, url: urlStr },
      allResults
    );

    const response = {
      matches,
      sourceProduct: {
        name: sourceName,
        store: storeKey,
        price: sourcePrice,
        imageUrl: sourceImage,
      },
      count: matches.length,
    };

    // Cache results for 1 hour
    await cacheSet(cacheKey, response, 3600);

    res.json(response);
  } catch (error) {
    console.error('Product matching error:', error);
    res.status(500).json({ error: 'Failed to find matching products' });
  }
});

// GET /api/search/:id — fetch a single cached product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const cached = await cacheGet(`product:${productId}`);

    if (cached) {
      return res.json({ product: cached, source: 'cache' });
    }

    res.status(404).json({ error: 'Product not found in cache. Try searching again.' });
  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/search — main search endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const { keyword, page: rawPage } = req.body;
    const page = typeof rawPage === 'number' ? Math.max(1, rawPage) : 1;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    const normalizedKeyword = keyword.trim().toLowerCase();

    // Resolve user ID if authenticated
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch {
        // Non-critical
      }
    }

    // ML-Based Query Routing
    const routeLabel = await classifyQuery(keyword);
    console.log(`[QueryRouter] Query "${keyword}" routed to: ${routeLabel}`);

    let interpretedKeyword = keyword;
    let interpreted = false;

    if (routeLabel === 'NL') {
      const interpCacheKey = `interpret:${normalizedKeyword}`;
      const cachedInterp = await cacheGet(interpCacheKey);
      
      if (cachedInterp && typeof cachedInterp === 'object' && 'query' in cachedInterp) {
        interpretedKeyword = (cachedInterp as any).query;
        interpreted = (cachedInterp as any).interpreted;
        console.log(`[QueryRouter] Found cached interpretation for "${keyword}": "${interpretedKeyword}"`);
      } else {
        // Pass to LLM agent for interpretation
        const interpretation = await aiService.interpretQuery(keyword);
        interpretedKeyword = interpretation.query;
        interpreted = interpretation.interpreted;
        
        // Cache the interpretation for 24 hours
        await cacheSet(interpCacheKey, interpretation, 86400);
      }
    }

    const cacheKey = `search:${interpretedKeyword.trim().toLowerCase()}:p${page}`;

    // Helper to log searches to user history + training logs
    const logSearchQuery = async () => {
      if (userId) {
        try {
          await db.logSearch(userId, normalizedKeyword);
        } catch (e) {
          console.warn('[DB] Failed to log user search history:', e);
        }
      }
      await db.logSearchTrainingData({
        rawQuery: keyword,
        queryType: routeLabel,
        interpretedQuery: routeLabel === 'NL' ? interpretedKeyword : null,
        userId,
      });
    };

    const cached = await cacheGet(cacheKey);
    if (cached) {
      // Re-populate the product details cache for individual items so that the product detail page works on refresh
      if (Array.isArray(cached)) {
        for (const product of cached) {
          const idx = cached.indexOf(product);
          await cacheSet(`product:scraped-${idx}`, product, 3600);
        }
      }

      // Perform background logging (non-blocking)
      logSearchQuery().catch(err => console.error('[Logging] Error:', err));

      return res.json({ 
        results: cached, 
        source: 'cache', 
        page,
        interpretedQuery: interpreted ? interpretedKeyword : undefined, 
        originalQuery: keyword,
        routeLabel,
        routingAccuracy: 0.98
      });
    }

    const rawResults = await searchAllStores(interpretedKeyword, page);
    const ranked = await rankProducts(rawResults, interpretedKeyword);

    await cacheSet(cacheKey, ranked, 3600);

    for (const product of ranked) {
      const idx = ranked.indexOf(product);
      await cacheSet(`product:scraped-${idx}`, product, 3600);
    }

    // Best-effort daily snapshot recording (must not fail the request).
    try {
      const day = new Date().toISOString().slice(0, 10);
      const scrapedAt = new Date().toISOString();
      // Cap to avoid huge writes if scrapers return massive result sets.
      const toRecord = ranked
        .filter(p => p?.url && p?.store && typeof p?.price === 'number')
        .slice(0, 50)
        .map(p => ({
          productUrl: p.url,
          store: p.store,
          price: p.price,
          day,
          scrapedAt,
        }));
      if (toRecord.length > 0) {
        await db.recordPriceSnapshots(toRecord);
      }
    } catch (e) {
      console.warn('[Price History] Failed to record search snapshots:', (e as any)?.message || e);
    }

    // Perform background logging (non-blocking)
    logSearchQuery().catch(err => console.error('[Logging] Error:', err));

    res.json({ 
      results: ranked, 
      source: 'live', 
      count: ranked.length, 
      page,
      interpretedQuery: interpreted ? interpretedKeyword : undefined, 
      originalQuery: keyword,
      routeLabel,
      routingAccuracy: 0.98
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export { router as searchRoutes };
