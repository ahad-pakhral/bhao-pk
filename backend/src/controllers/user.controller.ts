import { Request, Response } from 'express';
import { prisma } from '../services/prisma.service';

export const getWishlist = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const wishlist = await prisma.wishlistItem.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ wishlist });
    } catch (error) {
        console.error('Fetch Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
};

export const addWishlistItem = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const { store, url, name, imageUrl } = req.body;

        if (!store || !url || !name) {
            return res.status(400).json({ error: 'Missing required product data' });
        }

        const item = await prisma.wishlistItem.create({
            data: {
                userId,
                store,
                url,
                name,
                imageUrl,
            }
        });

        res.status(201).json({ item });
    } catch (error: any) {
        if (error.code === 'P2002') { // Prisma unique constraint violation
            return res.status(400).json({ error: 'Item already in wishlist' });
        }
        console.error('Add Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
};

export const removeWishlistItem = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.userId;
        const { id } = req.params;

        await prisma.wishlistItem.delete({
            where: { id, userId } // Ensure user owns the item
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Remove Wishlist Error:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
};
