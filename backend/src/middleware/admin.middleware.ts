import { Request, Response, NextFunction } from 'express';
import { db } from '../services/db.service';

/**
 * Requires an authenticated user (req.user set by requireAuth) with role ADMIN
 * in our `users` profile table.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - set by auth middleware
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: profile, error } = await db.findUser(userId);
    if (error || !profile) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const role = String((profile as any).role || 'USER').toUpperCase();
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  } catch (e) {
    console.error('[Admin] requireAdmin error:', e);
    return res.status(403).json({ error: 'Forbidden' });
  }
};

