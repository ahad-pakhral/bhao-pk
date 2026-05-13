import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../services/db.service';

function snakeToCamel(obj: any): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

const router = Router();
router.use(requireAuth);

// GET /api/recently-viewed — list user's recently viewed products
router.get('/', async (req: Request, res: Response) => {
  try {
    // @ts-ignore - set by auth middleware
    const userId = req.user.id;
    const limit = req.query.limit ? Math.min(Number(req.query.limit) || 20, 50) : 20;
    const { data, error } = await db.getRecentlyViewed(userId, limit);
    if (error) {
      console.error('[Recently Viewed] Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch recently viewed' });
    }
    res.json({ items: (data || []).map(snakeToCamel) });
  } catch (e) {
    console.error('[Recently Viewed] Fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch recently viewed' });
  }
});

// POST /api/recently-viewed — upsert a viewed product
router.post('/', async (req: Request, res: Response) => {
  try {
    // @ts-ignore - set by auth middleware
    const userId = req.user.id;
    const { productUrl, store, name, imageUrl } = req.body || {};

    if (!productUrl || !store || !name) {
      return res.status(400).json({ error: 'productUrl, store, and name are required' });
    }

    const { error } = await db.upsertRecentlyViewed(userId, {
      productUrl: String(productUrl),
      store: String(store),
      name: String(name),
      imageUrl: imageUrl ? String(imageUrl) : null,
    });

    if (error) {
      console.error('[Recently Viewed] Upsert error:', error);
      return res.status(500).json({ error: 'Failed to record recently viewed' });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[Recently Viewed] Upsert error:', e);
    res.status(500).json({ error: 'Failed to record recently viewed' });
  }
});

export { router as recentRoutes };

