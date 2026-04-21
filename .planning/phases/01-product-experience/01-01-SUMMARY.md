---
phase: 01-product-experience
plan: 01
subsystem: api, ui
tags: [express, nextjs, redis, scraping, alerts]

# Dependency graph
requires: []
provides:
  - "GET /api/alerts/enriched endpoint returning alerts with live scraped product data"
  - "EnrichedAlertData interface with product image, name, price, store"
  - "Rich AlertCard component linking to Bhao product page"
affects: [01-02, 01-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cache-first enrichment pattern: check Redis cache, scrape on miss, cache result with TTL"
    - "Promise.allSettled for parallel enrichment of N alerts"

key-files:
  created: []
  modified:
    - backend/src/routes/alerts.routes.ts
    - webapp/hooks/useSmartAlerts.ts
    - webapp/app/alerts/page.tsx

key-decisions:
  - "Used local detectStore() function matching hostname rather than importing from scraper service"
  - "Alerts without product URLs return product: null rather than being filtered out"
  - "Removed VIEW PRODUCT and VISIT STORE buttons; entire card is now a Link to Bhao product page"

patterns-established:
  - "Enrichment pattern: cache-first, parallel scrape, graceful fallback to null"

requirements-completed: [ALRT-01, ALRT-02]

# Metrics
duration: 3min
completed: 2026-04-21
---

# Phase 1 Plan 1: Rich Alert Cards Summary

**Enriched alert cards with live product images, names, store badges, and pricing via cache-backed scraping endpoint**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-21T11:02:42Z
- **Completed:** 2026-04-21T11:06:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Backend `GET /api/alerts/enriched` endpoint that batch-fetches live product data for each user alert using parallel scraping with Redis caching (1hr TTL)
- Redesigned AlertCard component showing product image, name (with text truncation), store badge, current price, target price, and TARGET REACHED badge
- Alert cards now link to the Bhao product page (`/product/[id]?url=...&store=...`) instead of external stores, satisfying ALRT-02

## Task Commits

Each task was committed atomically:

1. **Task 1: Create backend enrichment endpoint** - `287e428` (feat)
2. **Task 2: Redesign alert cards with rich product data** - `ac2abf4` (feat)

## Files Created/Modified
- `backend/src/routes/alerts.routes.ts` - Added `GET /api/alerts/enriched` with cache-first enrichment, `detectStore()` helper, and parallel `Promise.allSettled` scraping
- `webapp/hooks/useSmartAlerts.ts` - Added `EnrichedAlertData`/`EnrichedProductData` interfaces, `loadEnrichedAlerts()` function, `enrichedAlerts` state
- `webapp/app/alerts/page.tsx` - Rewrote `AlertCard` with horizontal layout: product image, name, store badge, prices, and Link wrapper to Bhao product page

## Decisions Made
- Used local `detectStore()` function in alerts.routes.ts rather than importing from scraper service -- keeps the enrichment endpoint self-contained
- Alerts without product URLs (keyword-only) return `product: null` and render with fallback text instead of being filtered
- Removed separate VIEW PRODUCT and VISIT STORE buttons -- entire card is now a clickable Link to the Bhao product page, providing a cleaner UX
- Graceful degradation: when Redis is unavailable (connected=false), cacheGet returns null and scraping proceeds normally

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - both backend and webapp compiled cleanly on first attempt.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Enrichment endpoint is ready for use by the alert checker service (01-02) and mobile app (Phase 4)
- No database schema changes were made -- product data remains cache-only as per design principle
- Existing `/api/alerts` endpoint preserved for backward compatibility

---
*Phase: 01-product-experience*
*Completed: 2026-04-21*

## Self-Check: PASSED
