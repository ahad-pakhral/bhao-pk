import { Request, Response } from 'express';
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

async function ensureUserProfile(req: Request, userId: string) {
    // @ts-ignore - set by authMiddleware
    const authUser = req.user;
    const { data: existing, error: findError } = await db.findUser(userId);
    if (existing) return;
    // If the lookup failed for reasons other than "no rows", bail early.
    if (findError && (findError as any).code && (findError as any).code !== 'PGRST116') {
      throw findError;
    }

    // Create profile row to satisfy FK constraints (wishlist_items.user_id -> users.id)
    const email = authUser?.email || '';
    const name = authUser?.user_metadata?.name || '';
    const { error: createError } = await db.createUser(userId, email, name);
    // Ignore duplicate user row (race between requests)
    if (createError && (createError as any).code !== '23505') {
      throw createError;
    }
}

export const getWishlist = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - set by authMiddleware
        const userId = req.user.id;
        await ensureUserProfile(req, userId);
        const { data: wishlist, error } = await db.getWishlist(userId);

        if (error) {
            console.error('Fetch Wishlist Error:', error);
            return res.status(500).json({ error: 'Failed to fetch wishlist' });
        }

        res.json({ wishlist: (wishlist || []).map(snakeToCamel) });
    } catch (error) {
        console.error('Fetch Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

export const addWishlistItem = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - set by authMiddleware
        const userId = req.user.id;
        const { store, url, name, imageUrl } = req.body || {};

        if (!store || !url || !name) {
            return res.status(400).json({ error: 'Missing required product data' });
        }

        // Ensure profile exists before inserting wishlist row (FK users.id)
        await ensureUserProfile(req, userId);

        let { data: item, error } = await db.addWishlistItem(userId, { store, url, name, imageUrl: imageUrl || null });

        if (error) {
            const code = (error as any).code;
            // FK violation: user profile row missing (common when user never hit /auth/me)
            if (code === '23503') {
                try {
                    await ensureUserProfile(req, userId);
                    const retry = await db.addWishlistItem(userId, { store, url, name, imageUrl: imageUrl || null });
                    item = retry.data as any;
                    error = retry.error as any;
                } catch {
                    // fall through to normal error handling
                }
            }
            if (code === '23505') {
                return res.status(409).json({ error: 'Item already in wishlist' });
            }
            if (error) {
            console.error('Add Wishlist Error:', error);
            return res.status(500).json({ error: 'Failed to add item' });
            }
        }

        if (!item) {
            return res.status(500).json({ error: 'Failed to add item (no row returned)' });
        }

        res.status(201).json({ item: snakeToCamel(item) });
    } catch (error) {
        console.error('Add Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
};

export const removeWishlistItem = async (req: Request, res: Response) => {
    try {
        // @ts-ignore - set by authMiddleware
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await db.removeWishlistItem(id, userId);

        if (error) {
            console.error('Remove Wishlist Error:', error);
            return res.status(500).json({ error: 'Failed to remove item' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Remove Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
};
