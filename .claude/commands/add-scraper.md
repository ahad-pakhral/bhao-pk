# Add a New Store Scraper

Guide for adding a scraper for a new Pakistani e-commerce store.

## Step 1: Investigate the Store

Before writing code, check:

```python
# Test in Python REPL
import requests
from bs4 import BeautifulSoup

url = 'https://STORE_URL/search?q=iPhone+15'  # Try common patterns
r = requests.get(url, headers={
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept-Encoding': 'gzip, deflate',  # NEVER include 'br' (brotli)
}, timeout=15)

print(f'Status: {r.status_code}, Length: {len(r.text)}')

# Check if content is readable (not brotli-encoded gibberish)
soup = BeautifulSoup(r.text, 'lxml')
print(f'Title: {soup.title.text if soup.title else "None"}')

# Look for product cards
for selector in ['.product-item', '.product-card', '.item', 'article', '[class*=product]']:
    cards = soup.select(selector)
    if cards:
        print(f'{selector}: {len(cards)} cards')
        print(f'First card HTML: {str(cards[0])[:500]}')
        break

# Check for JSON API (like Daraz)
if 'window.pageData' in r.text or 'application/json' in r.headers.get('content-type', ''):
    print('Possible JSON API available!')

# Check for client-side rendering (like Telemart/Algolia)
if len(r.text) < 50000 and not cards:
    print('Likely JS-rendered — need API endpoint or Selenium')
```

## Step 2: Determine Scraping Strategy

| If... | Then... |
|-------|---------|
| Site has JSON API | Override `search()` method, call API directly (like Daraz) |
| Site is server-rendered HTML | Use `parse_search_results()` with BeautifulSoup (like Shophive) |
| Site uses Algolia/client-side | Need Algolia API key or use Selenium/Playwright |
| Site blocks requests | Try different User-Agents, add delays, respect robots.txt |

## Step 3: Create the Scraper File

Create `backend/scrapers/stores/STORENAME_scraper.py`:

```python
"""
STORENAME scraper — description
"""

from bs4 import BeautifulSoup
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class STORENAMEScraper(BaseScraper):
    store_name = 'StoreName'  # Displayed in results
    base_url = 'https://www.store.pk'
    search_url_template = 'https://www.store.pk/search?q={keyword}'
    rate_limit_seconds = 2.0  # Be respectful

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

        for card in soup.select('.product-card'):  # ADAPT selector
            try:
                name_el = card.select_one('.product-name')
                price_el = card.select_one('.price')
                link_el = card.select_one('a')
                img_el = card.select_one('img')

                if not name_el or not price_el:
                    continue

                products.append({
                    'name': name_el.get_text(strip=True),
                    'price': parse_price(price_el.get_text(strip=True)),
                    'originalPrice': None,
                    'url': (link_el['href'] if link_el else ''),
                    'imageUrl': (img_el.get('src', '') if img_el else ''),
                    'rating': 0.0,
                    'reviewsCount': 0,
                    'store': self.store_name,
                    'inStock': True,
                })
            except Exception:
                continue

        return products

    def scrape_product_page(self, url: str) -> dict:
        html = self.fetch(url)
        soup = BeautifulSoup(html, 'lxml')
        price_el = soup.select_one('.price')
        return {
            'price': parse_price(price_el.get_text(strip=True)) if price_el else 0,
            'inStock': soup.select_one('.out-of-stock') is None,
        }
```

## Step 4: Register the Scraper

In `backend/scrapers/run_search.py`, add the import and register:

```python
from stores.STORENAME_scraper import STORENAMEScraper

SCRAPERS = {
    ...
    'storename': STORENAMEScraper,
}
```

## Step 5: Add to Node.js Store List

In `backend/src/services/scraper.service.ts`, add the store name:

```typescript
const STORES = ['daraz', 'telemart', 'shophive', 'mega', 'priceoye', 'storename'];
```

## Step 6: Add Store Reliability Score

In BOTH `webapp/utils/ranking.ts` AND `mobile/src/utils/ranking.ts` AND `backend/src/services/ranking.service.ts`:

```typescript
const STORE_RELIABILITY: Record<string, number> = {
    ...
    'StoreName': 0.75,  // Estimate based on trust/delivery
};
```

## Step 7: Update Filter UI

In `webapp/app/search/page.tsx`, add to the `stores` array:
```typescript
const stores = ["Daraz", "Telemart", "Shophive", "Mega", "PriceOye", "StoreName"];
```

In `mobile/src/screens/SearchScreen.tsx`, same.

## Step 8: Test

```bash
cd backend/scrapers && source .venv/bin/activate
python3 run_search.py --keyword "iPhone 15" --store storename
```

## Step 9: Update Skills

Run `/update-skills` to record what you learned about this store's scraping patterns.
