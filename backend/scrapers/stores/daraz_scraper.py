"""
Daraz.pk scraper — Pakistan's largest e-commerce platform.
Uses Daraz's JSON API (ajax=true) for reliable data extraction.
"""

import sys
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class DarazScraper(BaseScraper):
    store_name = 'Daraz'
    base_url = 'https://www.daraz.pk'
    search_url_template = 'https://www.daraz.pk/catalog/?ajax=true&q={keyword}'
    rate_limit_seconds = 2.5

    def search(self, keyword: str) -> list:
        """Override search to use JSON API directly."""
        from urllib.parse import quote
        url = self.search_url_template.format(keyword=quote(keyword))
        self.rate_limiter.wait()

        try:
            response = self.session.get(
                url,
                headers={
                    **self._get_headers(),
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            items = data.get('mods', {}).get('listItems', [])
            return self._parse_list_items(items)
        except Exception as e:
            print(f"Daraz API error: {e}", file=sys.stderr)
            return []

    def parse_search_results(self, html: str) -> list:
        """Fallback HTML parser (not used when API works)."""
        return []

    def _parse_list_items(self, items: list) -> list:
        """Parse Daraz's listItems JSON format."""
        products = []
        for item in items:
            try:
                price = parse_price(str(item.get('price', '0')))
                original_price = parse_price(str(item.get('originalPrice', '0')))
                item_url = item.get('itemUrl', '') or item.get('productUrl', '')
                if item_url:
                    if item_url.startswith('//'):
                        item_url = 'https:' + item_url
                    elif not item_url.startswith('http'):
                        item_url = self.base_url + item_url

                products.append({
                    'name': item.get('name', ''),
                    'price': price,
                    'originalPrice': original_price if original_price and original_price > price else None,
                    'url': item_url,
                    'imageUrl': item.get('image', ''),
                    'rating': float(item.get('ratingScore', 0) or 0),
                    'reviewsCount': int(item.get('review', 0) or 0),
                    'store': self.store_name,
                    'inStock': item.get('inStock', True),
                })
            except Exception:
                continue
        return products

    def scrape_product_page(self, url: str) -> dict:
        """Scrape a single product page for current price."""
        from bs4 import BeautifulSoup

        html = self.fetch(url)
        soup = BeautifulSoup(html, 'lxml')

        price = 0
        in_stock = True

        price_el = soup.select_one('.pdp-price, [class*="pdp-price"]')
        if price_el:
            price = parse_price(price_el.get_text(strip=True))

        oos_el = soup.select_one('[class*="out-of-stock"], [class*="sold-out"]')
        if oos_el:
            in_stock = False

        return {'price': price, 'inStock': in_stock}
