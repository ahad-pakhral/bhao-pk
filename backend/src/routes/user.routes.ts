import { Router } from 'express';
import { getWishlist, addWishlistItem, removeWishlistItem } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth); // Protect all user routes

// Wishlist Endpoints
router.get('/wishlist', getWishlist);
router.post('/wishlist', addWishlistItem);
router.delete('/wishlist/:id', removeWishlistItem);

export default router;
