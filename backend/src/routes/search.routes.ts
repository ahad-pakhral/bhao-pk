import { Router, Request, Response } from 'express';
import { searchAllStores, scrapeProductDetail } from '../services/scraper.service';
import { cacheGet, cacheSet } from '../services/cache.service';
import { rankProducts } from '../services/ranking.service';
import { findMatchingProducts } from '../services/product-matching.service';
import { db } from '../services/db.service';
import { supabase } from '../services/supabase.service';

const router = Router();

// GET /api/search/trending — cached trending products (MUST be before /:id and /product)
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const cached = await cacheGet('trending');
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    const trending = await searchAllStores('trending');
    const ranked = rankProducts(trending, '');
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

    const cacheKey = `detail:${String(store)}:${String(url)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ product: cached, source: 'cache' });
    }

    const detail = await scrapeProductDetail(String(url), String(store));
    if (!detail) {
      return res.status(404).json({ error: 'Failed to scrape product page' });
    }

    await cacheSet(cacheKey, detail, 3600); // 1 hour TTL
    res.json({ product: detail, source: 'live' });
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

    // Check cache first
    const cacheKey = `matches:${String(url)}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get source product name — prefer query param (from frontend), fallback to scraping
    let sourceName = queryName ? String(queryName) : null;
    let sourcePrice = 0;
    let sourceImage = '';

    if (!sourceName) {
      const sourceDetail = await scrapeProductDetail(String(url), String(store));
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
        sourceProduct: { name: sourceName, store: String(store), price: sourcePrice, imageUrl: sourceImage },
        count: 0,
      });
    }

    // Search all stores with the cleaned query
    const allResults = await searchAllStores(searchQuery);

    // Apply fuzzy matching (excludes source product URL + accessories)
    const matches = findMatchingProducts(
      { name: sourceName, url: String(url) },
      allResults
    );

    const response = {
      matches,
      sourceProduct: {
        name: sourceName,
        store: String(store),
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
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    const cacheKey = `search:${normalizedKeyword}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    const rawResults = await searchAllStores(normalizedKeyword);
    const ranked = rankProducts(rawResults, keyword);

    await cacheSet(cacheKey, ranked, 3600);

    for (const product of ranked) {
      const idx = ranked.indexOf(product);
      await cacheSet(`product:scraped-${idx}`, product, 3600);
    }

    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          await db.logSearch(user.id, normalizedKeyword);
        }
      } catch {
        // Non-critical
      }
    }

    res.json({ results: ranked, source: 'live', count: ranked.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export { router as searchRoutes };
