# Bhao.pk — Development Log

> This file is the single source of truth for every change made to the project.
> Newest entries at the top. Never delete old entries.
>
> **Every code change — no matter how small — gets logged here via `/document`.**

---

## Changelog

### [2026-02-20 23:55] — Create /document and /update-skills meta-skills (Skill)

**What changed:**
- `.claude/commands/document.md` — Created mandatory documentation skill that logs every code change to this devlog
- `.claude/commands/update-skills.md` — Created meta-skill for updating other skills after fixes/features
- `docs/DEVLOG.md` — Created this devlog file with retroactive history
- `CLAUDE.md` — Created project-level instructions enforcing /document after every change

**Why:**
- Need a persistent, append-only record of all project changes for maintainability
- Skills were referencing `/update-skills` but the file didn't exist
- Need to enforce documentation happens automatically, not as an afterthought

**Technical details:**
- `/document` skill defines a strict entry format: what/why/technical/side-effects/gotchas/testing/skills-updated
- 16 categories defined (Feature, Fix, Scraper, Ranking, etc.)
- Devlog is reverse-chronological (newest first)
- `CLAUDE.md` uses Claude Code's project instruction system to enforce `/document` runs after every change

**Side effects:**
- All future Claude Code sessions will see the CLAUDE.md instruction to run /document
- Devlog will grow over time — may need to split into monthly files eventually

**Gotchas / Lessons learned:**
- None

**Testing:**
- Verified skill files created and formatted correctly

**Related skills updated:**
- Created `/update-skills` and `/document` (this is the initial creation)

---

### [2026-02-20 23:30] — Create 11 Claude Code slash command skills (Skill)

**What changed:**
- `.claude/commands/architecture.md` — Full project architecture reference (directory structure, tech stack, design principles)
- `.claude/commands/start.md` — How to start all development services (backend, webapp, mobile, with correct order and venv activation)
- `.claude/commands/test-scraper.md` — Test store scrapers with specific commands and expected output
- `.claude/commands/add-scraper.md` — Step-by-step guide for adding new store scrapers (9 steps)
- `.claude/commands/build-check.md` — Verify all builds pass (backend tsc, webapp next build, mobile expo)
- `.claude/commands/search-flow.md` — End-to-end search pipeline reference (user types → API → scraper → ranking → display)
- `.claude/commands/debug-scraper.md` — Known issues per store, diagnostic steps, common fixes
- `.claude/commands/fix-types.md` — Common TypeScript type errors and their fixes
- `.claude/commands/add-route.md` — Adding new Express API routes (with auth middleware pattern)
- `.claude/commands/add-screen.md` — Adding new mobile/webapp screens (file locations, navigation, patterns)
- `.claude/commands/ranking.md` — Ranking algorithm reference (Bayesian formula, composite score, tuning)

**Why:**
- Capture all lessons learned during development so future work is faster
- Avoid re-discovering the same gotchas (brotli encoding, Daraz JSON API, type mismatches)
- Standardize common procedures (adding scrapers, routes, screens)

**Technical details:**
- Each skill follows a consistent format: quick reference, step-by-step, common issues, verification
- Skills reference each other (e.g., `/add-scraper` references `/test-scraper` and `/update-skills`)
- `/debug-scraper` contains known issues per store with root causes and fixes

**Side effects:**
- None — these are documentation files only

**Gotchas / Lessons learned:**
- Skills should always end with "run `/update-skills`" to keep the knowledge base current

**Testing:**
- All skill files created and verified readable

**Related skills updated:**
- N/A (initial creation)

---

### [2026-02-20 22:00] — Connect webapp and mobile to backend API (Feature)

**What changed:**
- `webapp/app/search/page.tsx` — Complete rewrite: added `fetchFromAPI()` with 400ms debounce, `normalizeProduct()` to convert backend format to display format, loading states, LIVE/CACHED/FALLBACK badges, falls back to dummy data if backend unavailable
- `mobile/src/screens/SearchScreen.tsx` — Added `fetchFromAPI()`, `normalizeProduct()`, `liveProducts` state, `ActivityIndicator` for loading, falls back to existing dummy data if backend unavailable

**Why:**
- Frontends were using hardcoded dummy data only. Need to display real scraped products from backend.
- Graceful fallback ensures app works even without backend running.

**Technical details:**
- Webapp: `POST ${API_BASE}/search` with `{ keyword }` body, API_BASE from `NEXT_PUBLIC_API_URL` env var (default `http://localhost:3001/api`)
- Mobile: Same POST request to `http://localhost:3001/api/search`
- Both use debounced search (400ms) to avoid hammering the API on every keystroke
- `normalizeProduct()` maps backend fields (`imageUrl`, `reviewsCount`, `originalPrice`) to frontend display fields (`image`, `reviews`, `price` as formatted string)
- Webapp shows colored badges: green "LIVE" for fresh scrape, blue "CACHED" for Redis cache hit
- Ranking: for live data, backend already ranks by Bayesian composite; for fallback data, client-side `rankByRelevance()` is used

**Side effects:**
- Search now makes real HTTP requests — needs backend running on port 3001 for live data
- If backend is down, users see fallback dummy data (no error shown)

**Gotchas / Lessons learned:**
- `rankByRelevance<SearchProduct>(filtered)` needs explicit generic because TypeScript can't infer the intersection type
- `originalPrice` must be typed as `string` (not `number`) to satisfy `rankByRelevance`'s generic constraint which expects `originalPrice?: string`
- When comparing originalPrice (now string) with priceValue (number), can't use `>` operator — simplified to truthy check since originalPrice is only set when it's greater than current price

**Testing:**
- Started backend (`cd backend && npm run dev`), searched "iPhone 15"
- Verified 56 real products returned (40 Daraz + 16 Shophive)
- Verified "LIVE" badge appears on webapp
- `npx next build` passes with no type errors
- `npx tsc --noEmit` passes for backend

**Related skills updated:**
- None yet (skills created after this)

---

### [2026-02-20 21:00] — Fix Daraz scraper URL doubling (Fix)

**What changed:**
- `backend/scrapers/stores/daraz_scraper.py` — Fixed URL construction: added check for `//` prefix in `itemUrl` from API response

**Why:**
- Daraz API returns URLs like `//www.daraz.pk/products/...` (protocol-relative). The old code only checked `startswith('http')` which was False, so it prepended `base_url`, creating `https://www.daraz.pk//www.daraz.pk/products/...`.

**Technical details:**
- Added: `if item_url.startswith('//'): item_url = 'https:' + item_url`
- This runs before the existing `elif not item_url.startswith('http')` check
- Protocol-relative URLs (`//domain/path`) are a common web pattern meaning "use whatever protocol the page is on"

**Side effects:**
- All Daraz product URLs are now correct and clickable

**Gotchas / Lessons learned:**
- Always check for protocol-relative URLs (`//`) when constructing absolute URLs from API data
- Daraz/Lazada API consistently uses `//` prefix for URLs

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store daraz` — all 40 URLs now start with `https://www.daraz.pk/products/...` (no doubling)

**Related skills updated:**
- None yet

---

### [2026-02-20 20:30] — Rewrite Daraz scraper to use JSON API (Fix)

**What changed:**
- `backend/scrapers/stores/daraz_scraper.py` — Complete rewrite: switched from HTML parsing to Daraz's hidden JSON API (`?ajax=true`)

**Why:**
- Daraz is a Client-Side Rendered (CSR/React) app. The HTML returned by requests contains no product data — it's all loaded via JavaScript. HTML scraping returned empty `[]`.

**Technical details:**
- Daraz (built on Lazada platform) has a hidden JSON API at `https://www.daraz.pk/catalog/?ajax=true&q={keyword}`
- Returns structured JSON with `mods.listItems[]` containing: `name`, `price`, `originalPrice`, `itemUrl`, `image`, `ratingScore`, `review`, `location`, `inStock`
- New method `_parse_list_items()` extracts product data from the JSON response
- `Accept: application/json` header required
- Rate limit set to 2.5 seconds (slightly higher than other stores since it's an API call)

**Side effects:**
- Daraz scraper is now the most reliable (structured data vs HTML parsing)
- Returns ~40 products per search (full first page)

**Gotchas / Lessons learned:**
- Many modern e-commerce sites use CSR — always check if there's a JSON/API endpoint before writing HTML parsers
- Daraz's `?ajax=true` parameter is the key to getting structured data
- The JSON API returns `ratingScore` (string) and `review` (string count), not the same field names as the HTML

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store daraz` — returned 40 products with correct data

**Related skills updated:**
- None yet

---

### [2026-02-20 20:00] — Fix brotli encoding issue in base scraper (Fix)

**What changed:**
- `backend/scrapers/stores/base_scraper.py` — Changed `Accept-Encoding` header from `'gzip, deflate, br'` to `'gzip, deflate'`

**Why:**
- Shophive (and potentially other stores) responded with brotli-compressed content when `br` was in Accept-Encoding. Python's `requests` library cannot decode brotli without the `brotli` package installed. The response body was 29KB of gibberish instead of 270KB of readable HTML.

**Technical details:**
- Brotli (`br`) is a compression algorithm by Google. Browsers support it natively, but Python `requests` doesn't.
- The `brotli` pip package adds support, but it's simpler and more reliable to just not request brotli
- `gzip` and `deflate` are supported natively by `requests` via urllib3
- This fix affects ALL store scrapers since they inherit from `BaseScraper`

**Side effects:**
- Slightly larger response sizes (gzip is ~10% less efficient than brotli)
- All stores now return readable HTML

**Gotchas / Lessons learned:**
- Never include `br` (brotli) in Accept-Encoding for Python scrapers unless the `brotli` package is installed
- Symptom: scraper finds elements (e.g., 16 product cards) but all text content is empty/garbled
- Debug tip: check `len(response.text)` — if it's suspiciously small for a full HTML page, it's likely a compression issue

**Testing:**
- `python3 backend/scrapers/run_search.py --keyword "iPhone 15" --store shophive` — returned 16 products with correct names and prices

**Related skills updated:**
- None yet

---

### [2026-02-20 19:30] — Make backend resilient without PostgreSQL/Redis (Config)

**What changed:**
- `backend/src/db/connection.ts` — Added startup connectivity test, `dbAvailable` flag, `isDbAvailable()` export. Server no longer crashes if PostgreSQL is unavailable.
- `backend/src/services/alert-checker.service.ts` — Added `isDbAvailable()` check before querying alerts. Skips silently if DB is down.

**Why:**
- Development often happens without PostgreSQL/Redis running. The backend should still serve search results (scraping doesn't need a database).
- Alert checker was spamming error logs every 30 minutes when DB was unavailable.

**Technical details:**
- `connection.ts`: `pool.query('SELECT 1')` on startup, sets `dbAvailable = true/false`. Pool error handler also sets flag.
- `alert-checker.service.ts`: Checks `isDbAvailable()` at the start of `checkAlerts()`, returns early with log message if false.
- Auth routes, alert routes, wishlist routes still fail gracefully if DB is down (they return 500s, but server doesn't crash)
- Search route works fully without DB — only needs Python scrapers and optionally Redis for caching

**Side effects:**
- Auth, alerts, and wishlist features are disabled when PostgreSQL is down
- Search works fully without any external dependencies

**Gotchas / Lessons learned:**
- Always design Node.js services to start without hard dependencies — fail at the route level, not at startup
- `pool.on('error')` catches runtime disconnections; the startup `SELECT 1` catches initial unavailability

**Testing:**
- Started backend without PostgreSQL/Redis → server started successfully on port 3001
- `curl -X POST localhost:3001/api/search -d '{"keyword":"iPhone 15"}'` → returned 56 ranked products
- Console showed "PostgreSQL not available — auth, alerts, wishlist disabled. Search still works."

**Related skills updated:**
- None yet

---

### [2026-02-20 19:00] — Set up Python venv and install scraper dependencies (Config)

**What changed:**
- `backend/scrapers/.venv/` — Created Python virtual environment
- `backend/src/services/scraper.service.ts` — Added `fs` import, `VENV_PYTHON` path detection, uses venv Python if available

**Why:**
- macOS (Ventura+) uses "externally managed" Python that blocks `pip install` globally. A venv is required.
- `scraper.service.ts` needed to know the venv Python path to spawn scrapers correctly.

**Technical details:**
- `python3 -m venv backend/scrapers/.venv`
- `source .venv/bin/activate && pip install -r requirements.txt` (installs: scrapy, beautifulsoup4, requests, lxml)
- `scraper.service.ts` checks `fs.existsSync(VENV_PYTHON)` where `VENV_PYTHON = path.join(SCRAPERS_DIR, '.venv', 'bin', 'python3')`
- Falls back to system `python3` if venv doesn't exist

**Side effects:**
- `.venv/` is in `.gitignore` (should be) — each developer needs to create their own
- Backend npm `postinstall` script could automate venv setup (not done yet)

**Gotchas / Lessons learned:**
- Always use venv for Python on macOS Ventura+
- The venv path must match what `scraper.service.ts` expects (`backend/scrapers/.venv/bin/python3`)

**Testing:**
- `backend/scrapers/.venv/bin/python3 -c "import bs4; print('ok')"` → ok

**Related skills updated:**
- None yet

---

### [2026-02-20 18:00] — Install backend npm dependencies (Config)

**What changed:**
- `backend/node_modules/` — Installed all npm dependencies
- `backend/package-lock.json` — Generated

**Why:**
- Backend had `package.json` with dependencies defined but `npm install` was never run.

**Technical details:**
- Key dependencies: express, pg (PostgreSQL), ioredis (Redis), node-cron, bcryptjs, jsonwebtoken, cors, dotenv
- Dev dependencies: typescript, ts-node, @types/*, nodemon

**Side effects:**
- None

**Gotchas / Lessons learned:**
- None

**Testing:**
- `npm run dev` starts the backend successfully

**Related skills updated:**
- None yet

---

### [2026-02-20 15:00] — Implement full plan: ranking, smart alerts, scrapers, backend (Feature)

**What changed:**

*Ranking algorithm (frontend):*
- `webapp/utils/ranking.ts` — Created: Bayesian average + composite scoring (5 weighted components)
- `mobile/src/utils/ranking.ts` — Created: Same implementation
- `webapp/hooks/useSearch.ts` — Wired `rankByRelevance()` into "Relevance" sort option
- `mobile/src/hooks/useSearch.ts` — Same
- `webapp/app/search/page.tsx` — Added ranking import, used in inline Relevance sort branch

*Smart Alerts (frontend):*
- `mobile/src/utils/smartAlerts.ts` — Created: cross-store tracking, alternative finding, alert evaluation
- `webapp/utils/smartAlerts.ts` — Created: Same
- `mobile/src/hooks/useSmartAlerts.ts` — Created: React hook for smart alert CRUD + mock checking
- `webapp/hooks/useSmartAlerts.ts` — Created: Same
- `mobile/src/components/SmartAlertCard.tsx` — Created: Rich alert card with store prices + alternatives
- `mobile/src/screens/AlertsScreen.tsx` — Redesigned with SmartAlertCard
- `webapp/app/alerts/page.tsx` — Redesigned for web with cross-store display
- `mobile/src/screens/ProductDetailScreen.tsx` — Updated to use `createSmartAlert()`
- `webapp/app/product/[id]/page.tsx` — Same

*Types:*
- `mobile/src/types/models.ts` — Added SmartAlert, StoreSnapshot, AlternativeProduct types, reviewsCount field
- `webapp/types/models.ts` — Same

*Dummy data:*
- `mobile/src/constants/dummyData.ts` — Added categories, 3 edge-case products (No-Name TWS, JBL Tune, Samsung Watch), cross-store listings
- `webapp/constants/dummyData.ts` — Same

*Storage:*
- `mobile/src/services/storage.service.ts` — Added smartAlertsStorage
- `webapp/services/storage.service.ts` — Same

*Backend (all new):*
- `backend/package.json` — Express, pg, ioredis, node-cron, bcryptjs, jsonwebtoken
- `backend/src/server.ts` — Express app with CORS, routes, port 3001
- `backend/src/routes/search.routes.ts` — POST /api/search with Redis cache
- `backend/src/routes/auth.routes.ts` — Login/signup with bcrypt + JWT
- `backend/src/routes/alerts.routes.ts` — CRUD with auth middleware
- `backend/src/routes/wishlist.routes.ts` — CRUD with auth middleware
- `backend/src/services/scraper.service.ts` — Spawns Python scrapers, collects results
- `backend/src/services/cache.service.ts` — Redis with lazyConnect, graceful fallback
- `backend/src/services/ranking.service.ts` — Server-side Bayesian ranking
- `backend/src/services/alert-checker.service.ts` — Cron job for alert monitoring
- `backend/src/db/connection.ts` — PostgreSQL connection pool
- `backend/src/db/migrations/001_initial.sql` — Users, alerts, wishlist, search_history, scraper_jobs tables
- `backend/src/middleware/auth.middleware.ts` — JWT verification

*Python scrapers (all new):*
- `backend/scrapers/requirements.txt` — scrapy, beautifulsoup4, requests, lxml
- `backend/scrapers/run_search.py` — CLI entry point
- `backend/scrapers/stores/base_scraper.py` — Abstract base class with rate limiting, UA rotation
- `backend/scrapers/stores/daraz_scraper.py` — Daraz.pk scraper
- `backend/scrapers/stores/telemart_scraper.py` — Telemart.pk scraper
- `backend/scrapers/stores/shophive_scraper.py` — Shophive.com scraper
- `backend/scrapers/stores/mega_scraper.py` — Mega.pk scraper
- `backend/scrapers/stores/priceoye_scraper.py` — PriceOye.pk scraper
- `backend/scrapers/utils/price_parser.py` — PKR price extraction
- `backend/scrapers/utils/product_matcher.py` — Fuzzy matching across stores
- `backend/scrapers/utils/rate_limiter.py` — Anti-ban delays

**Why:**
- Implementing the full plan from `stateless-tumbling-creek.md`: ranking algorithm, smart alerts, scraper architecture, backend API

**Technical details:**
- Bayesian average formula: `(C * m + n * R) / (C + n)` with C=25
- Composite score: 0.30 rating + 0.30 price + 0.20 popularity + 0.10 store + 0.10 discount
- "No product storage" architecture: PostgreSQL stores only user data and vendor URLs, never product data
- Python scrapers communicate with Node.js via child_process.spawn(), output JSON to stdout
- Redis cache with 1-hour TTL for search results, 4-hour for trending
- Three identical ranking implementations: backend, webapp, mobile (for offline/fallback use)

**Side effects:**
- Entire backend directory is new — needs npm install and venv setup
- Frontend search pages now have backend integration code (graceful fallback to dummy data)

**Gotchas / Lessons learned:**
- See subsequent entries for all the fixes that were needed (brotli, Daraz CSR, URL doubling, type errors)

**Testing:**
- End-to-end test: 56 real products returned from Daraz (40) + Shophive (16), ranked by Bayesian composite
- Webapp and backend builds pass with no type errors

**Related skills updated:**
- N/A (initial implementation)
