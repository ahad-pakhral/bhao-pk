# Bhao.pk — Project Architecture Reference

Read this entire file, then answer any architecture questions or use this as context for the current task.

## Stack Overview

| Layer | Tech | Location |
|-------|------|----------|
| Mobile app | React Native (Expo) + TypeScript | `mobile/` |
| Web app | Next.js 14 + TypeScript | `webapp/` |
| Backend API | Express + TypeScript | `backend/src/` |
| Scrapers | Python (BeautifulSoup + requests) | `backend/scrapers/` |
| Database | PostgreSQL (user data only) | `backend/src/db/` |
| Cache | Redis (product data, TTL-based) | `backend/src/services/cache.service.ts` |

## Critical Design Principle: No Product Storage

We are a **search aggregator** (like Google Shopping), NOT a data warehouse. Product data is NEVER stored in PostgreSQL.

**What we store in PostgreSQL:** Users, alerts (vendor_url + keyword + target_price), wishlist (vendor_url + keyword), search history (keyword + timestamp), scraper job logs.

**What we DON'T store:** Product names, descriptions, images, prices, ratings, reviews. These are scraped live or cached in Redis with TTL.

## Directory Structure

```
backend/
  src/
    server.ts                    # Express entry point, port 3001
    routes/
      search.routes.ts           # POST /api/search, GET /api/search/trending
      auth.routes.ts             # POST /api/auth/login, /api/auth/signup
      alerts.routes.ts           # CRUD /api/alerts (auth required)
      wishlist.routes.ts         # CRUD /api/wishlist (auth required)
    services/
      scraper.service.ts         # Spawns Python scrapers via child_process
      cache.service.ts           # Redis wrapper (graceful when unavailable)
      ranking.service.ts         # Server-side Bayesian ranking
      alert-checker.service.ts   # Cron job every 30 min
    db/
      connection.ts              # PostgreSQL pool (graceful when unavailable)
      migrations/001_initial.sql # Schema
    middleware/
      auth.middleware.ts         # JWT verification
  scrapers/
    .venv/                       # Python virtual environment
    run_search.py                # CLI entry: --keyword X --store Y
    requirements.txt             # beautifulsoup4, requests, lxml
    stores/
      base_scraper.py            # Abstract base (rate limiting, UA rotation)
      daraz_scraper.py           # Uses JSON API (ajax=true)
      shophive_scraper.py        # HTML parsing (Magento)
      telemart_scraper.py        # Algolia-based (currently non-functional)
      mega_scraper.py            # Table-based layout
      priceoye_scraper.py        # SSL issues with old Python

mobile/src/
  screens/SearchScreen.tsx       # Calls backend API, falls back to dummy data
  hooks/useSearch.ts             # Client-side filtering + Bayesian ranking
  utils/ranking.ts               # Bayesian avg + composite scoring
  utils/smartAlerts.ts           # Cross-store alert logic
  constants/dummyData.ts         # Fallback product data
  services/api/client.ts         # API client with mock fallback
  types/models.ts                # TypeScript interfaces

webapp/
  app/search/page.tsx            # Calls backend API, falls back to dummy data
  hooks/useSearch.ts             # Client-side filtering + Bayesian ranking
  utils/ranking.ts               # Bayesian avg + composite scoring (same as mobile)
  utils/smartAlerts.ts           # Cross-store alert logic
  constants/dummyData.ts         # Fallback product data
  services/api/client.ts         # API client with mock fallback
  types/models.ts                # TypeScript interfaces
```

## Search Flow (End-to-End)

```
User types "iPhone 15" → Frontend POST /api/search {keyword}
  → Backend checks Redis cache
  → Cache miss: spawn 5 Python scrapers in parallel (child_process)
  → Each scraper returns JSON to stdout
  → Merge results, rank with Bayesian composite algorithm
  → Cache in Redis (1hr TTL)
  → Return ranked results to frontend
  → Frontend displays with store filters, price filters, sort options
```

## Ranking Algorithm

**Bayesian Average** solves "5 reviews @ 5.0 vs 50 reviews @ 4.5":
```
bayesian = (C * m + n * R) / (C + n)
```
- C = 25 (confidence threshold)
- m = global average rating
- n = review count, R = raw rating

**Composite Score** (weights sum to 1.0):
- 0.30 bayesianRating (quality with confidence)
- 0.30 priceScore (lower = better)
- 0.20 popularity (log-dampened reviews)
- 0.10 storeReliability (Daraz: 0.85, Telemart: 0.80, etc.)
- 0.10 discountBonus (original vs current price)

## Working Scrapers

| Store | Method | Status | Products/search |
|-------|--------|--------|-----------------|
| Daraz | JSON API (`?ajax=true`) | Working | ~40 |
| Shophive | HTML (Magento `.product-item`) | Working | ~16 |
| Telemart | Algolia (client-side) | Not working | 0 |
| Mega | Table layout, wrong URL | Not working | 0 |
| PriceOye | SSL error (old Python) | Not working | 0 |

## Resilience

- **No Redis?** Cache operations silently no-op. All searches are live.
- **No PostgreSQL?** Search still works. Auth/alerts/wishlist return 500.
- **Scraper fails?** That store returns []. Other stores unaffected.
- **No backend?** Frontend falls back to dummy data.

## Environment Variables

```
# Backend
PORT=3001
DATABASE_URL=postgresql://localhost:5432/bhaopk
REDIS_URL=redis://localhost:6379
JWT_SECRET=bhao_pk_secret_key

# Webapp
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Mobile
EXPO_PUBLIC_API_URL=http://localhost:3001/api
EXPO_PUBLIC_USE_MOCK=false  (set to 'false' for real API)
```
