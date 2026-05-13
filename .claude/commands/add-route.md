# Add a New Backend API Route

Guide for adding new endpoints to the Express backend.

## Step 1: Create the Route File

Create `backend/src/routes/FEATURE.routes.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { db } from '../services/db.service';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// For auth-required routes, use requireAuth middleware:
// router.get('/', requireAuth, async (req: Request, res: Response) => { ... });

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

## Step 3: Add DB methods (if needed)

Add methods to `backend/src/services/db.service.ts` using the Supabase client:

```typescript
myMethod: (userId: string) =>
  supabaseAdmin.from('my_table').select('*').eq('user_id', userId),
```

## Patterns to Follow

- **Auth routes** use `requireAuth` middleware (verifies Supabase JWT)
- **Access user ID**: `// @ts-ignore; const userId = req.user?.id;`
- **DB queries** use `db` from `../services/db.service` (Supabase wrapper with service role)
- **Validation**: Check required fields, return 400 with clear error message
- **Error handling**: Always wrap in try/catch, log error, return 500
- **No product data in DB**: Only store URLs, keywords, user references

## Important: Remember the No-Storage Principle

If the route deals with product data:
- Store only `vendor_url`, `keyword`, `store_name` in PostgreSQL
- Product details (name, price, image) are scraped live or cached in Redis
- Never persist product data to the database
