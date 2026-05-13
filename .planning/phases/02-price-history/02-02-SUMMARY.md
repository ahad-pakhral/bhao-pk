---
phase: 02-price-history
plan: 02
subsystem: backend
tags: [api, history, express]

requires: [02-price-history/02-01]
provides:
  - "GET /api/history?url=...&store=... endpoint returning ordered daily points"
affects: [02-price-history/02-03]

key-files:
  created:
    - backend/src/routes/history.routes.ts
  modified:
    - backend/src/server.ts
    - backend/src/services/db.service.ts

requirements-completed: [HIST-03]
completed: 2026-04-21
---

# Phase 2 Plan 02 Summary: Price History API

Added a backend API endpoint to retrieve stored price history points by product URL (and optional store filter).

## What changed
- Created `backend/src/routes/history.routes.ts` with `GET /api/history?url=...&store=...`.
- Mounted `historyRoutes` in `backend/src/server.ts`.
- Implemented `db.getPriceHistory(productUrl, store?)` in `backend/src/services/db.service.ts`.

## Response shape
Returns stable chart-ready points ordered by day ASC:
```json
{
  "url": "...",
  "store": "daraz|null",
  "points": [{ "day": "YYYY-MM-DD", "price": 123456, "store": "daraz" }]
}
```

