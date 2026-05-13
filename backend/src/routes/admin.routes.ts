import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { db } from '../services/db.service';
import { cacheStatus } from '../services/cache.service';
import { runAlertCheckOnce } from '../services/alert-checker.service';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// GET /api/admin/stats — real counts for admin dashboard
router.get('/stats', async (_req, res: Response) => {
  try {
    const stats = await db.getAdminStats();
    res.json({ stats });
  } catch (e) {
    console.error('[Admin] Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/activity — unified activity feed (users/searches/wishlist/alerts)
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const before = req.query.before ? String(req.query.before) : null;
    const activity = await db.getAdminActivity({ limit, before });
    res.json(activity);
  } catch (e) {
    console.error('[Admin] Activity error:', e);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// GET /api/admin/health — basic service health/telemetry
router.get('/health', async (_req: Request, res: Response) => {
  try {
    const started = Date.now();
    // Simple DB ping via service role client.
    await db.getAdminStats();
    const dbLatencyMs = Date.now() - started;

    const mem = process.memoryUsage();
    const health = {
      ok: true,
      now: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMB: Math.round(mem.rss / (1024 * 1024)),
        heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
      },
      db: {
        latencyMs: dbLatencyMs,
      },
      cache: cacheStatus(),
      alertChecker: {
        schedule: '*/30 * * * *',
      },
    };

    res.json(health);
  } catch (e) {
    console.error('[Admin] Health error:', e);
    res.status(500).json({ ok: false, error: 'Failed to fetch health' });
  }
});

// POST /api/admin/run-alert-check — run the alert checker once (manual)
router.post('/run-alert-check', async (_req: Request, res: Response) => {
  try {
    // Fire-and-forget: respond immediately while the check runs.
    void runAlertCheckOnce().catch((e) => console.error('[Admin] run-alert-check error:', e));
    res.json({ started: true });
  } catch (e) {
    console.error('[Admin] run-alert-check error:', e);
    res.status(500).json({ error: 'Failed to start alert check' });
  }
});

export { router as adminRoutes };
