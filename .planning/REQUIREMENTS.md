# Requirements: Bhao.pk

**Defined:** 2026-04-21
**Core Value:** Users find the cheapest price for any product across Pakistani e-commerce stores in a single search

## v1 Requirements

Requirements for completing the MVP. Each maps to roadmap phases.

### Alerts & Product Cards

- [x] **ALRT-01**: Alerts page displays product cards with image, name, store, price, and target price — not just plain text with link buttons
- [x] **ALRT-02**: Each alert card links to the Bhao product page (not directly to the external store)

### Multi-Vendor Product Page

- [x] **PROD-01**: Product detail page shows the same product from multiple stores side-by-side with prices
- [x] **PROD-02**: Products from different stores are grouped by name similarity (fuzzy matching)
- [x] **PROD-03**: "Best Value" badge is automatically assigned to the lowest-priced listing by the ranking algorithm

### Price History

- [x] **HIST-01**: Backend stores daily price snapshots in Supabase (new price_history table with product_url, price, store, date)
- [x] **HIST-02**: Backend tracks price changes when search results are scraped (automatic snapshot on each search)
- [x] **HIST-03**: Product detail page chart displays real historical price data from the stored snapshots
- [x] **HIST-04**: Mobile product detail page displays real historical price data (replaces mock data)

### Notifications

- [x] **NOTF-01**: Backend sends email notification when a tracked product's price drops below the alert's target price
- [x] **NOTF-02**: Email includes product name, old price, new price, and link to the Bhao product page
- [x] **NOTF-03**: Notification is marked as sent to prevent duplicate emails

### Admin Panel (Web Only)

- [x] **ADMN-01**: Admin can log in with a separate admin role (role='ADMIN' in users table)
- [x] **ADMN-02**: Admin dashboard displays real stats: total users, active alerts, searches today, wishlist items, scraper health
- [x] **ADMN-03**: Admin dashboard fetches stats from a dedicated backend endpoint (not hardcoded)

### Mobile Data Integration

- [ ] **MOBL-01**: Mobile trending products screen fetches real data from backend API (not dummy)
- [ ] **MOBL-02**: Mobile recently viewed products show real data (not dummy)
- [ ] **MOBL-03**: Mobile wishlist syncs with backend API (not local-only)
- [ ] **MOBL-04**: Mobile price alerts integrate with backend API (not local-only)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Scaling
- **SCAL-01**: Add more store scrapers (i.eStore, HomeShopping, Symbios)
- **SCAL-02**: Automated scraper health monitoring and alerting
- **SCAL-03**: API rate limiting

### Performance
- **PERF-01**: Enable Redis caching (currently disabled)
- **PERF-02**: Image CDN/optimization for product thumbnails
- **PERF-03**: Search result pagination

### User Experience
- **UX-01**: Search suggestions on mobile (currently disabled)
- **UX-02**: Push notifications for mobile
- **UX-03**: Product comparison feature (select 2+ products to compare)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile admin panel | Admin is web-only per user decision |
| OCR/image search | Not in v1 scope |
| In-app purchases | Bhao.pk is comparison, not marketplace |
| User product reviews | Only shows vendor reviews |
| Social features | Deferred |
| Multi-language | English only |
| CI/CD pipeline | Deferred |
| Automated testing | Deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ALRT-01 | Phase 1 | Complete |
| ALRT-02 | Phase 1 | Complete |
| PROD-01 | Phase 1 | Complete |
| PROD-02 | Phase 1 | Complete |
| PROD-03 | Phase 1 | Complete |
| HIST-01 | Phase 2 | Complete |
| HIST-02 | Phase 2 | Complete |
| HIST-03 | Phase 2 | Complete |
| HIST-04 | Phase 2 | Complete |
| NOTF-01 | Phase 3 | Complete |
| NOTF-02 | Phase 3 | Complete |
| NOTF-03 | Phase 3 | Complete |
| ADMN-01 | Phase 3 | Complete |
| ADMN-02 | Phase 3 | Complete |
| ADMN-03 | Phase 3 | Complete |
| MOBL-01 | Phase 4 | Pending |
| MOBL-02 | Phase 4 | Pending |
| MOBL-03 | Phase 4 | Pending |
| MOBL-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after Phase 3 execution*
