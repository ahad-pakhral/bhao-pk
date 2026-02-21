# Start Bhao.pk Development Services

Start the requested services for local development. If the user doesn't specify which services, start all of them.

## Backend API (Port 3001)

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend && npm run dev
```

This starts the Express server with ts-node-dev (auto-reload). It will:
- Log "PostgreSQL not available" if no DB (search still works)
- Log "Redis not available" if no Redis (cache disabled, live scraping every time)
- Start the alert checker cron job (skips if no DB)

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

# Search test (should return real products from Daraz + Shophive)
curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword":"iPhone 15"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d.get(\"results\",[]))} products from {d.get(\"source\",\"?\")}')"
```

## Important Notes

- Backend must be running FIRST for webapp/mobile to get real search results
- If backend is down, frontends automatically fall back to dummy data
- Python venv is at `backend/scrapers/.venv/` — scraper.service.ts auto-detects it
- No PostgreSQL or Redis needed for basic search functionality
