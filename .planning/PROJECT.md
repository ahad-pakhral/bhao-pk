# Bhao.pk

## What This Is

Bhao.pk is a Pakistani price comparison platform that aggregates product prices from multiple e-commerce stores (Daraz, Shophive, Telemart) into a single search experience. Users search once and see ranked results from all stores, with wishlist tracking, price alerts, and product detail pages. The platform includes a Next.js 14 web app, a React Native + Expo mobile app, and an Express + Python scrapers backend.

## Core Value

Users find the cheapest price for any product across Pakistani e-commerce stores in a single search.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. Inferred from existing codebase. -->

- ✓ Product search across multiple stores (Daraz, Shophive, Telemart)
- ✓ Composite ranking algorithm (relevance, price, rating, popularity, store reliability, discount)
- ✓ User authentication via Supabase Auth (email/password signup, login, logout, password reset)
- ✓ Wishlist (add/remove products, persisted in Supabase)
- ✓ Price alerts (set target price, alert checker runs every 30 min)
- ✓ Product detail pages (scraped details, specs, reviews, price history chart placeholder)
- ✓ Search history (logged per user in Supabase)
- ✓ Store filtering and sorting (by price, by store)
- ✓ Responsive web design with dark theme
- ✓ Mobile app with auth, search, product details, wishlist UI
- ✓ Graceful degradation (backend works without Redis, frontends work without backend)
- ✓ Python scraper infrastructure (base class, rate limiting, parallel execution)
- ✓ Redis caching with TTL (1hr search results, 1hr product details)
- ✓ User profile page with stats
- ✓ Recently viewed products tracking (web)
- ✓ Skeleton loading states (web)

### Active

<!-- Current scope. Building toward these. -->

- [ ] **FR3**: Alerts page shows product cards (like search results) instead of just link text — currently plain card with link buttons
- [ ] **FR5**: Unified product page showing prices from multiple vendors for the same product — currently single-store listing only
- [ ] **FR18**: Email notifications when price drops below alert target — backend checker marks alerts but sending is TODO
- [ ] **FR19**: Push notifications for mobile price alerts — no notification infrastructure
- [ ] **FR20**: Real price history over time (persisted time-series data) — currently only current price shown in chart
- [ ] **FR23**: Mobile app data integration (trending, recently viewed, wishlist, alerts wired to backend) — currently local/dummy data
- [ ] **FR24**: Admin login with role-based auth (web only) — UI exists but dummy, no backend auth
- [ ] **FR25**: Admin dashboard with real stats (user counts, search counts, alert counts, scraper health) — UI exists but hardcoded
- [ ] **FR26**: "Best Value" badge automatically assigned by ranking algorithm — only exists in dummy data, not computed

### Out of Scope

- Mobile admin — admin features are web-only per user decision
- OCR/image search — not in v1 scope
- In-app purchases/payments — Bhao.pk is a comparison tool, not a marketplace
- Product reviews by users — only shows vendor reviews
- Social features (sharing, recommendations) — deferred
- Multi-language support — English only for now

## Context

### Architecture
- **Web**: Next.js 14 (App Router), TypeScript, Zustand, Recharts, Lucide icons
- **Mobile**: React Native 0.81 + Expo 54, React Navigation, React Context, Chart Kit
- **Backend**: Express, TypeScript, Supabase (PostgreSQL + Auth + RLS), Redis, Python scrapers
- **Scrapers**: Python (BeautifulSoup4, requests, lxml), spawned via child_process from Node
- **Database**: Supabase PostgreSQL with RLS — users, wishlist_items, price_alerts, search_history tables
- **Cache**: Redis with TTL (1hr search, 1hr product details, 4hr trending) — currently disabled

### Key Design Principles
1. No product storage — PostgreSQL stores only user data and vendor URLs; product data in Redis cache only
2. Graceful degradation — backend works without PostgreSQL/Redis; frontends work without backend
3. Three ranking implementations — backend, webapp, and mobile must stay in sync

### Recent Technical Issues Resolved
- Supabase snake_case → frontend camelCase mismatch (added snakeToCamel transforms)
- Wishlist insert failing due to imageUrl vs image_url column name
- Product page "not found" in new tab (added ?url= and ?store= query params for scrape fallback)
- Mega and PriceOye scrapers removed (not needed)
- ensureUserProfile added to handle FK violations when user profile row missing

## Constraints

- **Stores**: Only 3 active scrapers (Daraz, Shophive, Telemart) — adding stores requires new Python scrapers
- **Redis**: Currently disabled — all searches are live (slow without cache)
- **Scraping**: Rate-limited by stores, some use anti-bot (Telemart uses Algolia API workaround)
- **Testing**: No automated tests — changes verified manually
- **Deployment**: No CI/CD or documented deployment strategy
- **Notification infrastructure**: No email service (Resend/SendGrid) or push notification service configured
- **Price history storage**: No time-series data store — Redis TTL only, no historical persistence

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase Auth + PostgreSQL | Managed auth, RLS, reduces boilerplate | ✓ Good |
| No product DB storage | Search aggregator, not warehouse | ✓ Good |
| Python scrapers via child_process | Better scraping ecosystem | ✓ Good |
| Zustand for web state | Lightweight, simple API | ✓ Good |
| Three-tier ranking (backend/web/mobile) | Client-side filtering without re-fetch | ⚠️ Maintenance burden |
| Redis TTL caching | Balance freshness and performance | ⚠️ Currently disabled |
| Admin web-only | Per user decision | — Pending |
| Mega/PriceOye removed | Not needed, reducing maintenance | ✓ Good |

---
*Last updated: 2026-04-21 after GSD project initialization*
