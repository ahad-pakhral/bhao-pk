# Test a Store Scraper

Test a specific store scraper or all scrapers. The user may specify a store and/or keyword.

## How to Test

### Single Store

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend/scrapers && \
source .venv/bin/activate && \
python3 run_search.py --keyword "KEYWORD" --store STORE 2>&1
```

Replace STORE with: `daraz`, `telemart`, `shophive`, `mega`, `priceoye`
Replace KEYWORD with the search term.

### Parse Results

Pipe output through this to get a readable summary:
```bash
python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f'Results: {len(data)}')
for p in data[:10]:
    print(f'  {p[\"name\"][:55]:55} | Rs. {p[\"price\"]:>10,} | {p[\"store\"]:10} | rating: {round(p[\"rating\"],1)} ({p[\"reviewsCount\"]} reviews)')
"
```

### Test via Backend API

If the backend is running:
```bash
curl -s -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"keyword":"KEYWORD"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
results = data.get('results', [])
stores = {}
for r in results:
    s = r.get('store', '?')
    stores[s] = stores.get(s, 0) + 1
print(f'Source: {data.get(\"source\")}, Total: {len(results)}, By store: {stores}')
for r in results[:5]:
    print(f'  {r[\"name\"][:55]} | Rs. {r[\"price\"]:>10,} | {r[\"store\"]}')
"
```

## Current Scraper Status

| Store | Status | Notes |
|-------|--------|-------|
| **Daraz** | WORKING | Uses JSON API (`?ajax=true`), ~40 results |
| **Shophive** | WORKING | HTML parsing (Magento `.product-item`), ~16 results |
| **Telemart** | BROKEN | Uses Algolia client-side search, needs Algolia API key |
| **Mega** | BROKEN | Wrong search URL pattern, table-based layout |
| **PriceOye** | BROKEN | SSL error with Python 3.9's LibreSSL |

## Common Issues

1. **Empty results `[]`**: Check if the site uses JS rendering (Daraz did before API fix)
2. **SSL errors**: Old Python + LibreSSL. Upgrade Python or use `--break-system-packages`
3. **404 errors**: Search URL pattern changed. Fetch homepage, inspect search form action
4. **Garbled output**: Brotli encoding. Ensure `Accept-Encoding: gzip, deflate` (NOT `br`)
5. **Timeout**: Increase `SCRAPER_TIMEOUT` in `scraper.service.ts` (default 30s)
