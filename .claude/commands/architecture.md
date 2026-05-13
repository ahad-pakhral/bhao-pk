# Bhao.pk — Project Architecture Reference

Read this entire file, then answer any architecture questions or use this as context for the current task.

## Stack Overview

| Layer | Tech | Location |
|-------|------|----------|
| Mobile app | React Native (Expo) + TypeScript | `mobile/` |
| Web app | Next.js 14 + TypeScript | `webapp/` |
| Backend API | Express + TypeScript | `backend/src/` |
| Scrapers | Python (BeautifulSoup + requests) | `backend/scrapers/` |
| Database | **Supabase** (PostgreSQL + Auth + RLS) | `backend/src/services/supabase.service.ts` |
| DB wrapper | Supabase JS client (service role) | `backend/src/services/db.service.ts` |
| Cache | Redis (product data, TTL-based) | `backend/src/services/cache.service.ts` |

## Critical Design Principle: No Product Storage

We are a **search aggregator** (like Google Shopping), NOT a data warehouse. Product data is NEVER stored in the database.

**What we store in Supabase:** Users (profiles linked to auth.users), alerts (vendor_url + keyword + target_price), wishlist (vendor_url + name + store + image_url), search_history (keyword + timestamp).

**What we DON'T store:** Product names, descriptions, images, prices, ratings, reviews. These are scraped live or cached in Redis with TTL.

## Authentication

- **Auth provider**: Supabase Auth (email + password)
- **Email confirmation**: Enabled — users must verify email before logging in
- **Password reset**: `POST /api/auth/forgot-password` → `supabase.auth.resetPasswordForEmail()` → email with recovery link → `/reset-password` page → `supabase.auth.updateUser()`
- **Password requirements**: Min 6 chars, 1 lowercase, 1 uppercase, 1 special char (validated client-side + server-side in `webapp/utils/passwordValidation.ts` and `backend/src/controllers/auth.controller.ts`)
- **Middleware**: `backend/src/middleware/auth.middleware.ts` — verifies Supabase JWT via `supabase.auth.getUser(token)`
- **User profile**: Stored in `users` table with `auth.users(id)` as foreign key (CASCADE delete)
- **Frontend auth**: Webapp uses Zustand `useAuthStore`, mobile uses React Context `AuthProvider`
- **Auth pages**: `/login`, `/signup`, `/forgot-password`, `/reset-password`
- **Token**: Supabase `access_token` passed as `Authorization: Bearer <token>` header
- **`req.user`**: Supabase user object — use `.id` (NOT `.userId` which was the old JWT format)

## Directory Structure

```
backend/
  src/
    server.ts                    # Express entry point, port 3001
    routes/
      search.routes.ts           # POST /api/search, GET /api/search/:id, GET /api/search/trending
      auth.routes.ts             # POST /api/auth/login, /api/auth/signup, GET /api/auth/me, PUT /api/auth/profile, GET/DELETE /api/auth/history, GET /api/auth/stats, POST /api/auth/forgot-password
      alerts.routes.ts           # CRUD /api/alerts (auth required)
      wishlist.routes.ts         # CRUD /api/wishlist (auth required)
    services/
      supabase.service.ts        # Supabase client (anon + service role)
      db.service.ts              # Supabase DB wrapper (all data operations)
      scraper.service.ts         # Spawns Python scrapers via child_process
      cache.service.ts           # Redis wrapper (graceful when unavailable)
      ranking.service.ts         # Server-side Bayesian ranking
      alert-checker.service.ts   # Cron job every 30 min
    middleware/
      auth.middleware.ts         # Supabase JWT verification
  scrapers/
    .venv/                       # Python virtual environment
    run_search.py                # CLI entry: --keyword X --store Y
    requirements.txt             # beautifulsoup4, requests, lxml
    stores/
      base_scraper.py            # Abstract base (rate limiting, UA rotation, verify=False)
      daraz_scraper.py           # Uses JSON API (ajax=true)
      shophive_scraper.py        # HTML parsing (Magento)
      telemart_scraper.py        # Algolia-based (working)
      mega_scraper.py            # Magento search (?q=KEYWORD)
      priceoye_scraper.py        # HTML parsing (verify=False for SSL)
  supabase-migration.sql        # SQL migration for Supabase tables + RLS
  prisma/
    schema.prisma                # LEGACY — no longer used (replaced by Supabase)

mobile/src/
  screens/SearchScreen.tsx       # Calls backend API, enforces real data
  hooks/useSearch.ts             # Client-side filtering + Bayesian ranking
  utils/ranking.ts               # Bayesian avg + composite scoring
  utils/supabase.ts             # Supabase client with AsyncStorage
  utils/smartAlerts.ts           # Cross-store alert logic
  services/api/auth.service.ts   # Auth via Supabase + backend profile sync
  types/models.ts                # TypeScript interfaces

webapp/
  app/search/page.tsx            # Calls backend API, grid/list toggle, skeleton loaders
  app/product/[id]/page.tsx      # Fetches from API cache, falls back to Zustand store
  store/authStore.ts             # Zustand: Supabase login/register/session
  store/searchStore.ts           # Zustand: search cache + getProductById()
  hooks/useWishlist.ts           # Wishlist CRUD via API
  hooks/useSmartAlerts.ts        # Alert CRUD via API
  utils/supabase.ts              # Supabase anon client
  utils/ranking.ts               # Bayesian avg + composite scoring (same as mobile)
  utils/smartAlerts.ts           # Cross-store alert logic
```

## Search Flow (End-to-End)

```
User types "iPhone 15" → Frontend POST /api/search {keyword}
  → Backend checks Redis cache
  → Cache miss: spawn 5 Python scrapers in parallel (child_process)
  → Each scraper returns JSON to stdout
  → Merge results, rank with Bayesian composite algorithm
  → Cache in Redis (1hr TTL)
  → Cache each product individually (product:scraped-N, 1hr TTL)
  → Return ranked results to frontend
  → Frontend displays with store filters, price filters, sort options
```

## Product Detail Flow (New)

```
User clicks product → Navigate to /product/[id]
  → Try Zustand client cache (instant if user came from search)
  → If miss: GET /api/search/:id → Backend checks Redis product:scraped-N
  → Display product with price history chart, alerts, wishlist
  → If miss: Show "Product Not Found" with link back to search
```

## Ranking Algorithm

Weighted composite score (sum = 1.0) with multi-step penalization:

**1. Base Score Components:**
- **0.50 Relevance**: Textual match quality (exact phrase > token match > typo tolerance).
- **0.20 Price Score**: Log-scale normalized price (favoring lower prices within the results IQR).
- **0.10 Bayesian Rating**: `(C * m + n * R) / (C + n)` where C=25.
- **0.10 Popularity**: Log-dampened review count.
- **0.05 Store Reliability**: Trust factor (Daraz: 0.85, etc.).
- **0.05 Discount Bonus**: Rewarding items with higher percentage discount.

**2. Strict Penalization (Multipliers):**
- **Partial match?** `score *= 0.1` (90% penalty if query tokens are missing).
- **Out of stock?** `score *= 0.1` (90% penalty).
- **Accidental accessory?** `score *= 0.4` (60% penalty if item is a case/protector but query is for a phone).

## Working Scrapers

| Store | Method | Status | Products/search |
|-------|--------|--------|-----------------|
| Daraz | JSON API (`?ajax=true`) | Working | ~40 |
| Shophive | HTML (Magento `.product-item`) | Working | ~16 |
| Telemart | Algolia REST API | Working | ~40 |
| Mega | Magento (`catalogsearch/result/?q=`) | Untested | TBD |
| PriceOye | HTML (`.product-card`, `.p-item`) | Untested (SSL fix applied) | TBD |

## Resilience

- **No Redis?** Cache operations silently no-op. All searches are live.
- **No Supabase?** Search still works. Auth/alerts/wishlist return 500.
- **Scraper fails?** That store returns []. Other stores unaffected.
- **No backend?** Frontend shows connection error (no more dummy data fallback).

## Environment Variables

```
# Backend (.env)
PORT=3001
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
REDIS_URL=redis://localhost:6379

# Webapp (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Mobile (.env)
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Key Files for DB Operations

All database operations go through `backend/src/services/db.service.ts`:

| Operation | Method | Table |
|-----------|--------|-------|
| Create user | `db.createUser(id, email, name)` | `users` |
| Find user | `db.findUser(id)` | `users` |
| Get wishlist | `db.getWishlist(userId)` | `wishlist_items` |
| Add to wishlist | `db.addWishlistItem(userId, data)` | `wishlist_items` |
| Get alerts | `db.getAlerts(userId)` | `price_alerts` |
| Create alert | `db.createAlert(userId, data)` | `price_alerts` |
| Log search | `db.logSearch(userId, query)` | `search_history` |
| Get search history | `db.getSearchHistory(userId)` | `search_history` |
| Clear search history | `db.clearSearchHistory(userId)` | `search_history` |
| Update user | `db.updateUser(id, data)` | `users` |
| Get user stats | `db.getUserStats(userId)` | `wishlist_items` + `price_alerts` + `search_history` |
