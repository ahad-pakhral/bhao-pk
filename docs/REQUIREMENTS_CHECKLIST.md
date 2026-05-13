# Bhao.pk Requirements Checklist (FR/NFR)

This checklist maps the **Functional Requirements (27)** and **Non-Functional Requirements (6)** from the project report (Chapter 2 tables) to the current codebase.

## Legend

- `DONE` = implemented with a real code path (not just dummy text)
- `PARTIAL` = implemented but incomplete / dummy / not end-to-end
- `TODO` = not implemented
- `N/A` = not applicable (or the surface does not own this requirement)
- `MANUAL` = cannot be verified from code alone (needs UX/perf/security testing)

## Verification Criteria

- A requirement is `DONE` on a surface only if:
  - the UI/route exists **and**
  - it is wired to real data/logic (not hard-coded demo values), **or**
  - there is a backend endpoint that supports the behavior end-to-end.
- If a feature exists only with mock/dummy data, or critical pieces are TODO, mark it `PARTIAL`.

## Functional Requirements (FR)

| FR # | Requirement (from report) | Backend | Webapp | Mobile | Evidence (key code refs) |
|---:|---|---|---|---|---|
| 1 | View product listings retrieved from multiple supported e-commerce platforms | DONE | DONE | DONE | Backend multi-store scrape: `backend/src/services/scraper.service.ts:38` + `backend/src/services/scraper.service.ts:80`; Web search fetch + render: `webapp/app/search/page.tsx:92` + `webapp/app/search/page.tsx:148`; Mobile search fetch + render: `mobile/src/screens/SearchScreen.tsx:60` + `mobile/src/screens/SearchScreen.tsx:196` |
| 2 | View “Trending Products” on homepage | DONE | DONE | PARTIAL | Backend trending: `backend/src/routes/search.routes.ts:11`; Web trending fetch/cache: `webapp/app/page.tsx:160`; Mobile trending is dummy: `mobile/src/screens/HomeScreen.tsx:7` |
| 3 | View real-time search suggestions while typing | N/A | DONE | PARTIAL | Web suggestions: `webapp/app/page.tsx:124` + `webapp/app/page.tsx:220`; Mobile home suggestions: `mobile/src/screens/HomeScreen.tsx:11` + `mobile/src/screens/HomeScreen.tsx:71`; Mobile search suggestions disabled: `mobile/src/screens/SearchScreen.tsx:82` |
| 4 | View recently viewed products | N/A | DONE | PARTIAL | Web store + UI: `webapp/store/searchStore.ts:8` + `webapp/app/page.tsx:331`; Web adds recently viewed from product page: `webapp/app/product/[id]/page.tsx:70`; Mobile “recently viewed” is dummy list: `mobile/src/screens/HomeScreen.tsx:7` |
| 5 | View a single unified product page containing prices from multiple vendors | TODO | TODO | TODO | Product detail is single-store: `webapp/app/product/[id]/page.tsx:141`; Backend detail scrape is store+url: `backend/src/routes/search.routes.ts:30` |
| 6 | Search for a product using keywords | DONE | DONE | DONE | Backend search endpoint: `backend/src/routes/search.routes.ts:87`; Web search submit: `webapp/app/page.tsx:230`; Mobile search submit: `mobile/src/screens/SearchScreen.tsx:86` |
| 7 | View aggregated search results from multiple stores | DONE | DONE | DONE | Backend aggregates store searches: `backend/src/services/scraper.service.ts:80`; Web renders results grid/list: `webapp/app/search/page.tsx:148`; Mobile renders results list: `mobile/src/screens/SearchScreen.tsx:196` |
| 8 | Sort search results by Price (Low to High) | N/A | DONE | DONE | Web sort: `webapp/app/search/page.tsx:163`; Mobile sort options: `mobile/src/screens/SearchScreen.tsx:100` + sorting in hook `mobile/src/hooks/useSearch.ts:66` |
| 9 | Filter results by Store | N/A | DONE | DONE | Web store filter: `webapp/app/search/page.tsx:151`; Mobile store filter UI: `mobile/src/screens/SearchScreen.tsx:236` |
| 10 | Filter results by Price Range (Min/Max) | N/A | DONE | DONE | Web price range filter: `webapp/app/search/page.tsx:156`; Mobile min/max filter: `mobile/src/screens/SearchScreen.tsx:273` |
| 11 | View detailed product information on a dedicated page | DONE | DONE | PARTIAL | Backend product detail endpoint: `backend/src/routes/search.routes.ts:30`; Web detail page + detail scrape: `webapp/app/product/[id]/page.tsx:118`; Mobile detail screen exists but uses passed-in product + dummy sections: `mobile/src/screens/ProductDetailScreen.tsx:14` |
| 12 | “Open in Vendor Site” navigation | N/A | DONE | PARTIAL | Web opens vendor URL: `webapp/app/product/[id]/page.tsx:335`; Mobile button exists but onPress is empty: `mobile/src/screens/ProductDetailScreen.tsx:149` |
| 13 | Create a new account (Sign up) using email + password | DONE | DONE | DONE | Backend register: `backend/src/routes/auth.routes.ts:7` + `backend/src/controllers/auth.controller.ts:17`; Web register: `webapp/store/authStore.ts:70`; Mobile register: `mobile/src/services/api/auth.service.ts:45` |
| 14 | Log into the system using valid credentials | DONE | DONE | DONE | Backend login: `backend/src/routes/auth.routes.ts:8` + `backend/src/controllers/auth.controller.ts:78`; Web login: `webapp/store/authStore.ts:36`; Mobile login: `mobile/src/services/api/auth.service.ts:12` |
| 15 | Log out | N/A | DONE | DONE | Web logout: `webapp/store/authStore.ts:33` + UI wiring: `webapp/app/layout.tsx:104`; Mobile logout: `mobile/src/services/api/auth.service.ts:59` |
| 16 | Recover forgotten password via email | DONE | DONE | DONE | Backend forgot password: `backend/src/routes/auth.routes.ts:10` + `backend/src/controllers/auth.controller.ts:165`; Web forgot password page: `webapp/app/forgot-password/page.tsx:24`; Mobile forgot password screen: `mobile/src/screens/ForgotPasswordScreen.tsx:31` |
| 17 | Set a specific target price alert for a product | DONE | DONE | PARTIAL | Backend alert create: `backend/src/routes/alerts.routes.ts:38` + `backend/src/services/db.service.ts:60`; Web alert modal + POST: `webapp/app/product/[id]/page.tsx:215`; Mobile smart alert is local-only: `mobile/src/screens/ProductDetailScreen.tsx:50` |
| 18 | Receive an email notification when price <= target | TODO | TODO | TODO | Backend has TODO notification send: `backend/src/services/alert-checker.service.ts:59` |
| 19 | Receive a push notification on mobile for price drops | TODO | TODO | TODO | Backend has TODO notification send: `backend/src/services/alert-checker.service.ts:59` |
| 20 | View graphical history of price changes over time | TODO | PARTIAL | PARTIAL | Web chart exists but uses generated/1-point history: `webapp/app/product/[id]/page.tsx:136` + chart `webapp/components/PriceHistoryChart.tsx:14`; Mobile chart uses mock history: `mobile/src/screens/ProductDetailScreen.tsx:87` |
| 21 | Add products to a personal “Wishlist” | DONE | DONE | PARTIAL | Backend wishlist insert: `backend/src/services/db.service.ts:33`; Web wishlist toggle: `webapp/app/product/[id]/page.tsx:198` + hook `webapp/hooks/useWishlist.ts:55`; Mobile wishlist is local storage: `mobile/src/hooks/useWishlist.ts:24` |
| 22 | Remove items from “Wishlist” | DONE | DONE | PARTIAL | Backend wishlist delete: `backend/src/services/db.service.ts:47`; Web delete: `webapp/hooks/useWishlist.ts:81`; Mobile delete local: `mobile/src/hooks/useWishlist.ts:49` |
| 23 | View updated prices refreshed at scheduled intervals | PARTIAL | PARTIAL | PARTIAL | Backend has Redis TTL + alert cron, but no general periodic product refresh: `backend/src/services/cache.service.ts:50` + `backend/src/services/alert-checker.service.ts:77` |
| 24 | Admin logs into backend dashboard | TODO | PARTIAL | PARTIAL | Web admin login is dummy: `webapp/app/admin/login/page.tsx:9`; Mobile admin login is dummy: `mobile/src/screens/AdminLoginScreen.tsx:14`; Backend has no admin auth endpoints |
| 25 | Admin views statistics on total scraped + active users | TODO | PARTIAL | PARTIAL | Web dashboard stats are hard-coded: `webapp/app/admin/dashboard/page.tsx:6`; Mobile dashboard stats are hard-coded: `mobile/src/screens/AdminDashboardScreen.tsx:10`; Backend has no admin stats endpoints |
| 26 | Automatically assigned “Best Value” badges | TODO | PARTIAL | PARTIAL | Only present as dummy data/UI support, not computed: `webapp/constants/dummyData.ts:35` + `mobile/src/constants/dummyData.ts:35` |
| 27 | Personalized recommendations based on browsing history | DONE | DONE | PARTIAL | Backend logs history when auth header is present: `backend/src/routes/search.routes.ts:111` and exposes history: `backend/src/routes/auth.routes.ts:12`; Web recommendations from history: `webapp/app/page.tsx:175`; Mobile recommendations are static card: `mobile/src/screens/HomeScreen.tsx:137` |

## Non-Functional Requirements (NFR)

| NFR # | Requirement (from report) | Status | Evidence / How to verify |
|---:|---|---|---|
| 1 | UI is user-friendly and easy to navigate | MANUAL | Needs UX review + user testing; can’t be proven from code alone |
| 2 | Passwords/personal data stored securely | PARTIAL | Supabase Auth used for credentials; DB tables have RLS policies: `backend/supabase-migration.sql:47`; Backend verifies Supabase JWT: `backend/src/middleware/auth.middleware.ts:7` |
| 3 | Helpful messages and feedback on user input | DONE | Web toasts + messaging components (e.g. wishlist/auth flows); Mobile uses Toast in auth/wishlist flows: `mobile/src/context/AuthContext.tsx:76` |
| 4 | Mobile app runs smoothly on standard devices | MANUAL | Needs profiling on target devices/emulators (FPS, memory); not verifiable from repo alone |
| 5 | Consistent fonts/colors/icons throughout | DONE | Web CSS variables + global styles: `webapp/app/globals.css:1`; Mobile theme constants: `mobile/src/theme/index.ts:1` (theme-driven components) |
| 6 | Website is responsive | DONE | Responsive CSS media queries exist: `webapp/app/globals.css:419` |

## Notes (Biggest gaps to close)

- Unified multi-vendor product detail page (FR5) needs cross-store grouping + listings model.
- Price history over time (FR20) needs a persistence strategy (or at least a time-series cache) and a real history endpoint.
- Notifications (FR18/FR19) are not implemented (backend TODO).
- Admin login/stats (FR24/FR25) are currently demo-only UIs without backend support.
- “Best Value” badges (FR26) are not computed by ranking; they exist only in dummy data.

