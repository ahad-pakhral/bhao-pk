# Start Bhao.pk Development Services

Start the requested services for local development. If the user doesn't specify which services, start all of them.

## Prerequisites

1. **Supabase tables** must be created first — run `backend/supabase-migration.sql` in Supabase Dashboard > SQL Editor
2. **Supabase Auth email confirmation** — Enable in Dashboard > Authentication > Email (required for signup verification)
3. **Supabase redirect URLs** — Add `http://localhost:3000/reset-password` in Dashboard > Authentication > URL Configuration
4. **Python venv** at `backend/scrapers/.venv/` — create if missing: `cd backend/scrapers && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`

## Backend API (Port 3001)

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend && npm run dev
```

This starts the Express server with ts-node-dev (auto-reload). It will:
- Connect to Supabase for auth + database (logs warning if credentials missing)
- Log "Redis not available" if no Redis (cache disabled, live scraping every time)
- Start the alert checker cron job (skips if no Supabase)

Test: `curl http://localhost:3001/api/health`

## Webapp (Port 3000)

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/webapp && npm run dev
```

Visit http://localhost:3000. Search page at /search calls backend API.

## Mobile App

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/mobile && npx expo start
```

## Quick Test After Starting

```bash
# Health check
curl -s http://localhost:3001/api/health

# Search test (should return real products from Daraz + Shophive + Telemart)
curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword":"iPhone 15"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\"results\",[]))} products from {d.get(\"source\",\"?\")}')"
```

## Important Notes

- **Run SQL migration first** — backend needs Supabase tables created before auth/wishlist/alerts work
- Backend must be running FIRST for webapp/mobile to get real search results
- Python venv is at `backend/scrapers/.venv/` — scraper.service.ts auto-detects it
- No PostgreSQL needed — all database operations go through Supabase
- Redis is optional — only used for search result caching
