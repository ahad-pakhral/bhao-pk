---
phase: 02-price-history
plan: 03
subsystem: web+mobile
tags: [charts, product-page, history-api]

requires: [02-price-history/02-02]
provides:
  - "Web product page renders PriceHistoryChart from real backend points"
  - "Mobile product detail renders PriceHistoryChart from real backend points"

key-files:
  modified:
    - webapp/app/product/[id]/page.tsx
    - mobile/src/screens/ProductDetailScreen.tsx
    - mobile/src/screens/HomeScreen.tsx
    - mobile/src/services/api/auth.service.ts

requirements-completed: [HIST-03, HIST-04]
completed: 2026-04-21
---

# Phase 2 Plan 03 Summary: Real Price History Charts (Web + Mobile)

Replaced placeholder/mock price history with real points fetched from `GET /api/history`.

## Web
- `webapp/app/product/[id]/page.tsx` now fetches `/history?url=...&store=...` and passes points into `PriceHistoryChart`.
- The Price History section is always rendered (empty state handled by the chart component).

## Mobile
- `mobile/src/screens/ProductDetailScreen.tsx` now fetches `/history?url=...&store=...` via `apiClient` and passes points into the chart.
- Added safe fallbacks when product `url/store` is missing (chart shows empty state).

## Notes
- `mobile/src/screens/HomeScreen.tsx` wishlist toggles were disabled for dummy products (they have no `url` to send to the backend wishlist API).
- `mobile/src/services/api/auth.service.ts` fallback user object was fixed to match the mobile `User` type (removed unsupported `role` field).

