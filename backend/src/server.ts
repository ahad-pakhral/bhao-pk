import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchRoutes } from './routes/search.routes';
import { alertsRoutes } from './routes/alerts.routes';
import { authRoutes } from './routes/auth.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { historyRoutes } from './routes/history.routes';
import { adminRoutes } from './routes/admin.routes';
import { recentRoutes } from './routes/recent.routes';
import { startAlertChecker } from './services/alert-checker.service';
import { initClassifierService } from './services/classifier.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — CORS for Vercel production + localhost dev
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : undefined; // undefined = allow all (dev mode)

app.use(cors({
  origin: allowedOrigins || true,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recently-viewed', recentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root — redirect to API health info
app.get('/', (_req, res) => {
  res.json({
    service: 'Bhao.pk Backend API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      search: 'POST /api/search',
      trending: 'GET /api/search/trending',
      auth: '/api/auth/*',
      wishlist: '/api/wishlist/*',
      alerts: '/api/alerts/*',
      history: 'GET /api/history?url=...&store=...',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Bhao.pk API running on port ${PORT}`);

  // Start periodic alert checker (every 30 minutes)
  startAlertChecker();

  // Initialize Python query classifier microservice
  initClassifierService();
});

export default app;
