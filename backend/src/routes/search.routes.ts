import { Router, Request, Response } from 'express';
import { searchAllStores } from '../services/scraper.service';
import { cacheGet, cacheSet } from '../services/cache.service';
import { rankProducts } from '../services/ranking.service';
import { prisma } from '../services/prisma.service';

const router = Router();

// POST /api/search
router.post('/', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.body;

    if (!keyword || keyword.trim().length === 0) {
      return res.status(400).json({ error: 'Search keyword is required' });
    }

    const normalizedKeyword = keyword.trim().toLowerCase();
    const cacheKey = `search:${normalizedKeyword}`;

    // 1. Check Redis cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    // 2. Cache miss — scrape all stores in parallel
    const rawResults = await searchAllStores(normalizedKeyword);

    // 3. Rank results using Bayesian avg + composite scoring
    const ranked = rankProducts(rawResults);

    // 4. Cache for 1 hour
    await cacheSet(cacheKey, ranked, 3600);

    // 5. Log search (if authenticated)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET || 'bhao-super-secret-key'
        ) as { userId: string };
        await prisma.searchHistory.create({
          data: {
            userId: decoded.userId,
            query: normalizedKeyword
          }
        });
      } catch {
        // Non-critical — skip logging if token invalid
      }
    }

    res.json({ results: ranked, source: 'live', count: ranked.length });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/search/trending — cached trending products
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const cached = await cacheGet('trending');
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }

    // Scrape trending/top pages from each store
    const trending = await searchAllStores('trending');
    const ranked = rankProducts(trending);
    await cacheSet('trending', ranked, 14400); // 4 hour TTL

    res.json({ results: ranked, source: 'live' });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
});

export { router as searchRoutes };
