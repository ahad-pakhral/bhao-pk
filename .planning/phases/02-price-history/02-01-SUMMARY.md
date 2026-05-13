---
phase: 02-price-history
plan: 01
subsystem: backend
tags: [supabase, price-history, snapshots, express]

requires: [01-product-experience]
provides:
  - "Daily price snapshot persistence into Supabase price_history (idempotent by product_url+store+day)"
  - "Best-effort snapshot recording on POST /api/search and GET /api/search/product"
affects: [02-price-history/02-02, 02-price-history/02-03, notifications-admin]

key-files:
  modified:
    - backend/src/services/db.service.ts
    - backend/src/routes/search.routes.ts
    - backend/supabase-migration.sql

requirements-completed: [HIST-01, HIST-02]
completed: 2026-04-21
---

# Phase 2 Plan 01 Summary: Daily Price Snapshots

Implemented daily price snapshot persistence using Supabase `price_history` and wired snapshot recording into the scraping pipeline.

## What changed
- Added `price_history` table DDL (with `UNIQUE(product_url, store, day)`) to `backend/supabase-migration.sql`.
- Added Supabase upsert helpers to `backend/src/services/db.service.ts`:
  - `recordPriceSnapshot(...)`
  - `recordPriceSnapshots(...)`
  - `getPriceHistory(...)` (used by 02-02)
- Wired best-effort snapshot recording into `backend/src/routes/search.routes.ts`:
  - after `POST /api/search` returns ranked results (capped to 50 rows per request)
  - after `GET /api/search/product` returns a product (both cache-hit and live scrape paths)

## Key decisions
- Snapshots are idempotent per day via Supabase `upsert(..., { onConflict: 'product_url,store,day' })`.
- Snapshot failures must never fail the user request (wrapped in try/catch; logs warnings only).

## User setup required
- Run the updated `backend/supabase-migration.sql` in Supabase SQL Editor to create `price_history`.

