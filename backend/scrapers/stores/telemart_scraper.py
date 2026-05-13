"""
Telemart.pk scraper — uses Algolia for search and Telemart API for product details.

Telemart uses Cloudflare + Algolia for search, so traditional HTML scraping
returns empty pages. This scraper calls:
  - Algolia REST API for search (embedded public credentials)
  - Telemart's public product API (telemart.pk/api/product/{slug}) for full details
"""

import re
import sys
import urllib3
import requests
from stores.base_scraper import BaseScraper
from bs4 import BeautifulSoup

# Suppress SSL warnings for older Python SSL libs
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ALGOLIA_APP_ID = '7Z6UNQYQER'
ALGOLIA_API_KEY = '9b4c33f99e845fe1363fd4c6ceb0f467'
ALGOLIA_INDEX = 'products'
ALGOLIA_URL = f'https://{ALGOLIA_APP_ID}.algolia.net/1/indexes/{ALGOLIA_INDEX}/query'
TELEMART_API_URL = 'https://telemart.pk/api/product/'


class TelemartScraper(BaseScraper):
    store_name = 'Telemart'
    base_url = 'https://telemart.pk'
    search_url_template = ''  # Not used — Algolia handles search
    rate_limit_seconds = 1.0

    def search(self, keyword: str) -> list:
        """Override base search to use Algolia API instead of HTML scraping."""
        self.rate_limiter.wait()
        try:
            response = requests.post(
                ALGOLIA_URL,
                headers={
                    'X-Algolia-Application-Id': ALGOLIA_APP_ID,
                    'X-Algolia-API-Key': ALGOLIA_API_KEY,
                    'Content-Type': 'application/json',
                },
                json={
                    'query': keyword,
                    'hitsPerPage': 40,
                },
                timeout=10,
                verify=False,  # Old Python SSL may not support Algolia's TLS
            )
            response.raise_for_status()
            data = response.json()
            return self._parse_hits(data.get('hits', []))
        except Exception as e:
            print(f"Telemart Algolia error: {e}", file=sys.stderr)
            return []

    def _parse_hits(self, hits: list) -> list:
        products = []
        for hit in hits:
            try:
                title = hit.get('title', '')
                slug = hit.get('slug', '')
                if not title or not slug:
                    continue

                # Use sale_price (discounted) if available, otherwise price
                sale_price = hit.get('sale_price') or hit.get('discounted_price')
                original_price = hit.get('price')

                price = float(sale_price) if sale_price else 0
                orig = float(original_price) if original_price else None

                # Only set originalPrice if there's an actual discount
                if orig and orig <= price:
                    orig = None

                # Telemart URLs: telemart.pk/{slug} (NOT /product/{slug})
                url = f"{self.base_url}/{slug}"
                image = hit.get('mainImageLink', '')
                rating = float(hit.get('rating', 0) or 0)
                reviews_count = int(hit.get('reviewsCount', 0) or 0)
                qty = int(hit.get('qty', 0) or 0)

                products.append({
                    'name': title,
                    'price': price,
                    'originalPrice': orig,
                    'url': url,
                    'imageUrl': image,
                    'rating': rating,
                    'reviewsCount': reviews_count,
                    'store': self.store_name,
                    'inStock': qty > 0,
                })
            except Exception:
                continue

        return products

    def parse_search_results(self, html: str) -> list:
        """Not used — search() calls Algolia API directly."""
        return []

    def scrape_product_page(self, url: str) -> dict:
        """Scrape full product details using Telemart's public product API.
        Endpoint: telemart.pk/api/product/{slug} returns JSON with
        title, price, description (HTML with specs), reviews, gallery, brand, etc.
        """
        result = {
            'price': 0,
            'originalPrice': None,
            'inStock': True,
            'name': '',
            'imageUrl': '',
            'rating': 0,
            'reviewsCount': 0,
            'description': '',
            'specs': [],
            'reviews': [],
        }

        # Extract slug from URL: https://telemart.pk/{slug} or https://www.telemart.pk/product/{slug}
        if '/product/' in url:
            slug = url.split('/product/')[-1].strip('/')
        else:
            # telemart.pk/{slug} format
            slug = url.rstrip('/').split('/')[-1]
        if not slug:
            return result

        self.rate_limiter.wait()
        try:
            response = requests.get(
                f"{TELEMART_API_URL}{slug}",
                headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'},
                timeout=15,
                verify=False,
            )
            response.raise_for_status()
            data = response.json()
            product = data.get('product', {})

            if not product or not product.get('title'):
                return result

            # Basic info
            result['name'] = product.get('title', '')
            result['imageUrl'] = product.get('mainImageLink', '')
            result['rating'] = float(product.get('rating', 0) or 0)
            result['reviewsCount'] = int(product.get('reviewsCount', 0) or 0)
            result['inStock'] = product.get('isInStock', True) and int(product.get('qty', 0) or 0) > 0

            # Price
            discounted_price = product.get('discounted_price')
            original_price = product.get('price')
            result['price'] = float(discounted_price) if discounted_price else 0
            if original_price:
                orig = float(original_price)
                if orig > result['price']:
                    result['originalPrice'] = orig

            # Description (plain text fallback)
            result['description'] = (product.get('meta_description', '') or '')[:500]

            # Parse specs from HTML description field
            # Telemart stores specs as HTML: <h6>Section Name</h6><dl><dt>Key</dt><dd>Value</dd>...
            desc_html = product.get('description', '')
            if desc_html:
                soup = BeautifulSoup(desc_html, 'lxml')
                for dl in soup.select('dl'):
                    for row in dl.select('dt, dd'):
                        text = row.get_text(strip=True)
                        if text:
                            result['description'] = re.sub(r'<[^>]+>', '', desc_html).strip()[:500]
                            break
                    break

                # Extract dt/dd pairs as specs
                for dt in soup.select('dt'):
                    dd = dt.find_next_sibling('dd')
                    if dd:
                        key = dt.get_text(strip=True)
                        val = dd.get_text(strip=True)
                        if key and val:
                            result['specs'].append({'key': key, 'value': val})

            # Reviews from API
            for review in product.get('reviews', []):
                try:
                    result['reviews'].append({
                        'author': review.get('user', {}).get('name', review.get('name', '')),
                        'rating': float(review.get('rating', 0) or 0),
                        'text': review.get('review', '')[:300],
                        'date': review.get('created_at', '')[:10],
                    })
                except Exception:
                    continue

        except Exception as e:
            print(f"Telemart product API error: {e}", file=sys.stderr)

        return result
