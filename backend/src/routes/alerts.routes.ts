import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { db } from '../services/db.service';
import { scrapeProductDetail } from '../services/scraper.service';
import { cacheGet, cacheSet } from '../services/cache.service';

function snakeToCamel(obj: any): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

async function ensureUserProfile(req: any, userId: string) {
  const { data: existing, error: findError } = await db.findUser(userId);
  if (existing) return;
  if (findError && (findError as any).code && (findError as any).code !== 'PGRST116') {
    throw findError;
  }
  const email = req.user?.email || '';
  const name = req.user?.user_metadata?.name || '';
  const { error: createError } = await db.createUser(userId, email, name);
  if (createError && (createError as any).code !== '23505') {
    throw createError;
  }
}

function detectStore(url: string): string | null {
  const lower = url.toLowerCase();
  if (lower.includes('daraz')) return 'daraz';
  if (lower.includes('telemart')) return 'telemart';
  if (lower.includes('shophive')) return 'shophive';
  return null;
}

const router = Router();

// All alert routes require authentication
router.use(requireAuth);

// GET /api/alerts — list user's alerts
router.get('/', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    await ensureUserProfile(req, userId);
    const { data: alerts, error } = await db.getAlerts(userId);

    if (error) {
      console.error('Get alerts error:', error);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    res.json({ alerts: (alerts || []).map(snakeToCamel) });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts — create new alert
router.post('/', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    const { keyword, productUrl, targetPrice } = req.body;

    if (!targetPrice || (!keyword && !productUrl)) {
      return res.status(400).json({ error: 'targetPrice and either keyword or productUrl are required' });
    }

    await ensureUserProfile(req, userId);

    let { data: alert, error } = await db.createAlert(userId, {
      targetPrice,
      keyword,
      productUrl,
    });

    if (error) {
      const code = (error as any).code;
      if (code === '23503') {
        // FK violation: user profile row missing
        try {
          await ensureUserProfile(req, userId);
          const retry = await db.createAlert(userId, { targetPrice, keyword, productUrl });
          alert = retry.data as any;
          error = retry.error as any;
        } catch {
          // fall through
        }
      }
    }

    if (error) {
      console.error('Create alert error:', error);
      return res.status(500).json({ error: 'Failed to create alert' });
    }

    if (!alert) {
      return res.status(500).json({ error: 'Failed to create alert (no row returned)' });
    }

    res.status(201).json({ alert: snakeToCamel(alert) });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// GET /api/alerts/enriched — list user's alerts with live product data
// MUST be before /:id to avoid Express matching "enriched" as :id
router.get('/enriched', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;
    await ensureUserProfile(req, userId);
    const { data: alerts, error } = await db.getAlerts(userId);

    if (error) {
      console.error('Get enriched alerts error:', error);
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }

    const rawAlerts = (alerts || []).map(snakeToCamel);

    // Enrich each alert with live product data in parallel
    const enrichedResults = await Promise.allSettled(
      rawAlerts.map(async (alert: any) => {
        if (!alert.productUrl) {
          return { ...alert, product: null };
        }

        // Check cache first (1hr TTL)
        const cacheKey = `alert-enrich:${alert.productUrl}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
          return { ...alert, product: cached };
        }

        // Cache miss — scrape live data
        const store = detectStore(alert.productUrl);
        if (!store) {
          return { ...alert, product: null };
        }

        try {
          const product = await scrapeProductDetail(alert.productUrl, store);
          if (product) {
            const productData = {
              name: product.name,
              imageUrl: product.imageUrl,
              price: product.price,
              store: product.store || store,
            };
            await cacheSet(cacheKey, productData, 3600);
            return { ...alert, product: productData };
          }
        } catch (err) {
          console.error(`Failed to enrich alert ${alert.id}:`, err);
        }

        return { ...alert, product: null };
      })
    );

    const enrichedAlerts = enrichedResults.map((result) =>
      result.status === 'fulfilled' ? result.value : { ...result.reason, product: null }
    );

    res.json({ alerts: enrichedAlerts });
  } catch (error) {
    console.error('Get enriched alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch enriched alerts' });
  }
});

// DELETE /api/alerts/:id — remove alert
router.delete('/:id', async (req, res: Response) => {
  try {
    // @ts-ignore - set by authMiddleware
    const userId = req.user.id;

    const { error } = await db.deleteAlert(req.params.id, userId);

    if (error) {
      console.error('Delete alert error:', error);
      return res.status(500).json({ error: 'Failed to delete alert' });
    }

    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export { router as alertsRoutes };
