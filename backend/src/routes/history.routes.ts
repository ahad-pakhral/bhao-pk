import { Router, Request, Response } from 'express';
import { db } from '../services/db.service';

const router = Router();

// GET /api/history?url=...&store=...
// Public endpoint (price history is not user-private; only served via our backend).
router.get('/', async (req: Request, res: Response) => {
  try {
    const { url, store } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'url query param is required' });
    }

    const productUrl = String(url);
    const storeFilter = store ? String(store) : null;

    const { data, error } = await db.getPriceHistory(productUrl, storeFilter);

    if (error) {
      console.error('Get history error:', error);
      return res.status(500).json({ error: 'Failed to fetch price history' });
    }

    const points = (data || []).map((row: any) => ({
      day: row.day,
      price: row.price,
      store: row.store,
    }));

    return res.json({
      url: productUrl,
      store: storeFilter,
      points,
    });
  } catch (e) {
    console.error('Get history error:', e);
    return res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

export { router as historyRoutes };

