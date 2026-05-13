import { Router } from 'express';
import { register, login, getMe, forgotPassword, updateProfile, getSearchHistory, clearSearchHistory, getUserStats } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.post('/forgot-password', forgotPassword);
router.put('/profile', requireAuth, updateProfile);
router.get('/history', requireAuth, getSearchHistory);
router.delete('/history', requireAuth, clearSearchHistory);
router.get('/stats', requireAuth, getUserStats);

export { router as authRoutes };
