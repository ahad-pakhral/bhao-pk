# Debug a Scraper Issue

Use this when a scraper returns empty results, errors, or wrong data.

## Diagnostic Steps

### Step 1: Test the scraper directly

```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend/scrapers
source .venv/bin/activate
python3 run_search.py --keyword "iPhone 15" --store STORE_NAME 2>&1
```

Look at stderr for error messages. stdout should be valid JSON.

### Step 2: Test the raw HTTP request

```python
import requests
from bs4 import BeautifulSoup

url = 'SEARCH_URL_HERE'
r = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept-Encoding': 'gzip, deflate',
}, timeout=15)

print(f'Status: {r.status_code}')
print(f'Content-Type: {r.headers.get("content-type")}')
print(f'Length: {len(r.text)}')
print(f'First 500 chars: {r.text[:500]}')
```

### Step 3: Identify the problem

| Symptom | Cause | Fix |
|---------|-------|-----|
| Garbled binary output | Brotli encoding | Remove `br` from `Accept-Encoding` header |
| Empty `[]` with 200 status | Wrong CSS selectors | Inspect page HTML, update selectors |
| Empty `[]` with short HTML | JS-rendered page (CSR) | Find JSON API endpoint or use Selenium |
| 404 error | Wrong search URL | Fetch homepage, find search form action URL |
| 403 error | Bot blocked | Rotate User-Agent, add delays, check robots.txt |
| SSL error | Old Python SSL | Upgrade Python or use `--break-system-packages` |
| Timeout | Slow response | Increase timeout in base_scraper.py fetch() |
| JSON parse error | Scraper outputting debug text to stdout | Use `print(..., file=sys.stderr)` for debug |

## Known Issues by Store

### Daraz
- **Fixed**: Was JS-rendered (CSR). Now uses JSON API at `?ajax=true`
- URL pattern: `itemUrl` starts with `//www.daraz.pk/...` — must prepend `https:` not `base_url`
- Some products have `ratingScore: null` — default to 0

### Shophive
- **Fixed**: Brotli encoding caused garbled content
- Uses Magento: selectors are `.product-item`, `.product-item-link`, `.price`
- Old prices use `[data-price-type="oldPrice"]`

### Telemart
- Uses Algolia for search (client-side). Traditional scraping returns 404
- Would need Algolia API credentials or reverse-engineer the API

### Mega.pk
- Uses table-based layout, not standard product cards
- Search URL `/search/KEYWORD` returns 404. Might need `/mobiles/?q=KEYWORD`
- Products in `<table>` with `<td>` for price

### PriceOye
- SSL error: `TLSV1_ALERT_PROTOCOL_VERSION`
- Python 3.9's LibreSSL is too old for their TLS setup
- Fix: upgrade Python to 3.11+ or install pyOpenSSL

## After Fixing

Always run `/update-skills` to record what you learned about the fix.
