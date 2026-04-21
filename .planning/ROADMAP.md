# Roadmap: Bhao.pk

## Overview

Completing the remaining 18 v1 requirements for the Bhao.pk price comparison platform. The project is brownfield with working search, auth, wishlist, alerts (backend), and product pages. This roadmap covers the leap from functional prototype to polished product: rich product pages with multi-vendor comparison, real price history, email notifications, admin dashboard, and a fully wired mobile app.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Product Experience** - Alerts product cards + multi-vendor product page with Best Value badge (completed 2026-04-21)
- [ ] **Phase 2: Price History** - Daily price snapshots, automatic tracking, real charts on web and mobile
- [ ] **Phase 3: Notifications & Admin** - Email alerts on price drops + admin dashboard with real stats
- [ ] **Phase 4: Mobile Integration** - Wire trending, recently viewed, wishlist, and alerts to backend APIs

## Phase Details

### Phase 1: Product Experience
**Goal**: Users see rich product cards on their alerts page and can compare the same product across multiple stores on a unified product page
**Depends on**: Nothing (brownfield -- builds on existing search, alerts, and product pages)
**Requirements**: ALRT-01, ALRT-02, PROD-01, PROD-02, PROD-03
**Success Criteria** (what must be TRUE):
  1. User sees alerts page populated with product cards showing image, product name, store, current price, and target price
  2. User can click an alert card and land on the Bhao product page (not the external store)
  3. User can view a product page that shows the same product from multiple stores side-by-side with prices
  4. User sees a "Best Value" badge on the cheapest listing within a multi-vendor product page
**Plans**: 3 plans in 2 waves

Plans:
- [x] 01-01: Replace plain alert cards with rich product cards (image, name, store, price, target)
- [ ] 01-02: Build fuzzy product matching to group same products across stores
- [ ] 01-03: Multi-vendor product page with side-by-side store listings and Best Value badge

### Phase 2: Price History
**Goal**: Users can see real historical price trends on product pages instead of placeholder/mock charts
**Depends on**: Phase 1
**Requirements**: HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. Backend automatically stores a price snapshot each time a product is scraped
  2. User can view a price history chart on the web product page showing real past prices over time
  3. User can view a price history chart on the mobile product page showing real past prices (no mock data)
**Plans**: TBD

Plans:
- [ ] 02-01: Create price_history table in Supabase and integrate snapshot recording into scraper pipeline
- [ ] 02-02: Build backend API endpoint for fetching price history by product URL
- [ ] 02-03: Replace chart placeholders with real data on web and mobile product pages

### Phase 3: Notifications & Admin
**Goal**: Users receive email alerts when prices drop, and admins can monitor platform health from a real dashboard
**Depends on**: Phase 2 (notifications need price history to detect drops)
**Requirements**: NOTF-01, NOTF-02, NOTF-03, ADMN-01, ADMN-02, ADMN-03
**Success Criteria** (what must be TRUE):
  1. User receives an email when a tracked product's price drops below their alert target
  2. Email contains the product name, old price, new price, and a link back to Bhao
  3. User does not receive duplicate emails for the same price drop
  4. Admin can log in with role='ADMIN' credentials and see a dashboard with real user/alert/search/wishlist counts and scraper status
**Plans**: TBD

Plans:
- [ ] 03-01: Set up email service (Resend/SendGrid) and integrate with alert checker to send price drop emails
- [ ] 03-02: Add notification_sent tracking to prevent duplicate emails
- [ ] 03-03: Implement admin role-based auth and build real stats backend endpoint
- [ ] 03-04: Wire admin dashboard UI to the real stats endpoint

### Phase 4: Mobile Integration
**Goal**: Mobile app screens show real data from the backend instead of dummy/local data
**Depends on**: Phase 3 (all web features should be stable before wiring mobile)
**Requirements**: MOBL-01, MOBL-02, MOBL-03, MOBL-04
**Success Criteria** (what must be TRUE):
  1. Mobile trending screen shows real trending products fetched from the backend API
  2. Mobile recently viewed section shows products the user actually viewed (persisted on backend)
  3. Mobile wishlist shows items synced with the backend (adding on mobile appears on web and vice versa)
  4. Mobile price alerts page shows alerts created from the backend (not local-only)
**Plans**: TBD

Plans:
- [ ] 04-01: Wire mobile trending and recently viewed to backend APIs
- [ ] 04-02: Sync mobile wishlist with backend API (bidirectional)
- [ ] 04-03: Integrate mobile price alerts with backend API (create, list, delete)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Product Experience | 2/3 | Complete    | 2026-04-21 |
| 2. Price History | 0/3 | Not started | - |
| 3. Notifications & Admin | 0/4 | Not started | - |
| 4. Mobile Integration | 0/3 | Not started | - |
