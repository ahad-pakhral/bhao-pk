# Add a New Backend API Route

Guide for adding new endpoints to the Express backend.

## Step 1: Create the Route File

Create `backend/src/routes/FEATURE.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Add auth middleware if route requires login
// router.use(authMiddleware);

// GET /api/feature
router.get('/', async (req: Request, res: Response) => {
  try {
    // Implementation
    res.json({ data: [] });
  } catch (error) {
    console.error('Feature error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

export { router as featureRoutes };
```

## Step 2: Register in Server

In `backend/src/server.ts`:

```typescript
import { featureRoutes } from './routes/feature.routes';
// ...
app.use('/api/feature', featureRoutes);
```

## Step 3: Handle in Mock Service (if needed)

For frontend development without backend, add mock handling in:
- `webapp/services/mock/mockData.service.ts`
- `mobile/src/services/mock/mockData.service.ts`

```typescript
if (endpoint.includes('/feature')) {
  return this.mockFeature() as T;
}
```

## Patterns to Follow

- **Auth routes** use `authMiddleware` and `AuthRequest` (has `req.userId`)
- **Public routes** use `Request` from express
- **DB queries** use `query()` from `../db/connection` with parameterized queries ($1, $2)
- **Validation**: Check required fields, return 400 with clear error message
- **Error handling**: Always wrap in try/catch, log error, return 500
- **No product data in DB**: Only store URLs, keywords, user references

## Important: Remember the No-Storage Principle

If the route deals with product data:
- Store only `vendor_url`, `keyword`, `store_name` in PostgreSQL
- Product details (name, price, image) are scraped live or cached in Redis
- Never persist product data to the database
