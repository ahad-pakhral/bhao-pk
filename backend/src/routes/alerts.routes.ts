import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';

const router = Router();

// All alert routes require authentication
router.use(requireAuth);

// GET /api/alerts — list user's alerts
router.get('/', async (req, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const alerts = await prisma.priceAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST /api/alerts — create new alert
router.post('/', async (req, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { keyword, productUrl, targetPrice } = req.body;

    if (!targetPrice || (!keyword && !productUrl)) {
      return res.status(400).json({ error: 'targetPrice and either keyword or productUrl are required' });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        targetPrice,
        keyword,
        productUrl
      }
    });

    res.status(201).json({ alert });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// DELETE /api/alerts/:id — remove alert
router.delete('/:id', async (req, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    await prisma.priceAlert.delete({
      where: { id: req.params.id, userId }
    });

    res.json({ deleted: true });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

export { router as alertsRoutes };
