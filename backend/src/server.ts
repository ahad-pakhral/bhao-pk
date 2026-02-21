import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { searchRoutes } from './routes/search.routes';
import { alertsRoutes } from './routes/alerts.routes';
import { authRoutes } from './routes/auth.routes';
import { wishlistRoutes } from './routes/wishlist.routes';
import { startAlertChecker } from './services/alert-checker.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Bhao.pk API running on port ${PORT}`);

  // Start periodic alert checker (every 30 minutes)
  startAlertChecker();
});

export default app;
