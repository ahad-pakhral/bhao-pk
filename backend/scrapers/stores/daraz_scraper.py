"""
Daraz.pk scraper — Pakistan's largest e-commerce platform.
Uses Daraz's JSON API (ajax=true) for reliable data extraction.
"""

import sys
import re
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

                seller_name = item.get('sellerName', '') or "Daraz Seller"
                seller_rating_raw = item.get('sellerRating')
                try:
                    seller_rating = float(seller_rating_raw) if seller_rating_raw else 4.2
                except (ValueError, TypeError):
                    seller_rating = 4.2
                seller_trust = 0.85 if seller_rating > 4.0 else 0.70

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
                    'merchantName': seller_name,
                    'merchantRating': seller_rating,
                    'merchantTrust': seller_trust,
                })
            except Exception:
                continue
        return products

    def scrape_product_page(self, url: str) -> dict:
        """Scrape a single product page for full details.
        Daraz is a CSR app — the HTML containers are empty.
        We use Schema.org JSON-LD embedded in the page for product data.
        """
        import json as json_module

        html = self.fetch(url)

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

        # Parse Schema.org JSON-LD for product data (reliable even on CSR pages)
        ld_match = re.search(r'<script\s+type=["\']application/ld\+json["\']>(.*?)</script>', html, re.DOTALL)
        if ld_match:
            try:
                ld_data = json_module.loads(ld_match.group(1))
                if isinstance(ld_data, dict) and ld_data.get('@type') == 'Product':
                    result['name'] = ld_data.get('name', '')
                    images = ld_data.get('image', [])
                    if isinstance(images, list) and images:
                        result['imageUrl'] = images[0]
                    elif isinstance(images, str):
                        result['imageUrl'] = images
                    desc = ld_data.get('description', '')
                    # Use the intro paragraph (before specs markdown) as description
                    intro_match = re.match(r'^(.*?)(?:###|\Z)', desc, re.DOTALL)
                    if intro_match:
                        result['description'] = intro_match.group(1).strip()[:500]
                    else:
                        result['description'] = desc[:500]

                    # Parse specs from markdown-style description
                    # Format: ### **Section:**#### **Sub:**- **Key:** Value
                    if '###' in desc and '**' in desc:
                        result['specs'] = self._parse_ld_description_specs(desc)

                    offers = ld_data.get('offers', {})
                    if offers:
                        availability = offers.get('availability', '')
                        if 'OutOfStock' in availability:
                            result['inStock'] = False
            except (json_module.JSONDecodeError, TypeError):
                pass

        # Try to extract price from pdpTrackingData (embedded in page scripts)
        tracking_match = re.search(r'var pdpTrackingData\s*=\s*["\']({.*?})["\'];', html, re.DOTALL)
        if tracking_match:
            try:
                tracking = json_module.loads(tracking_match.group(1))
                price_val = tracking.get('pdt_price') or tracking.get('pdt_original_price')
                if price_val:
                    result['price'] = parse_price(str(price_val))
            except (json_module.JSONDecodeError, TypeError):
                pass

        # Also try HTML selectors as fallback for price (some pages may render server-side)
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html, 'lxml')

        if result['price'] == 0:
            price_el = soup.select_one('.pdp-price-type--normal, .pdp-price, [class*="pdp-price"]')
            if price_el:
                result['price'] = parse_price(price_el.get_text(strip=True))

        # Image fallback
        if not result['imageUrl']:
            img_el = soup.select_one('.pdp-mod-common-image img, .product-image img, [class*="pdp-img"] img')
            if img_el:
                result['imageUrl'] = img_el.get('src') or img_el.get('data-src') or ''

        # Name fallback
        if not result['name']:
            title_el = soup.select_one('.pdp-mod-product-name, [class*="pdp-mod-product-name"], h1')
            if title_el:
                result['name'] = title_el.get_text(strip=True)

        # Stock
        oos_el = soup.select_one('[class*="out-of-stock"], [class*="sold-out"], .pdp-mod-stock-info--out-of-stock')
        if oos_el:
            result['inStock'] = False

        return result

    def _parse_ld_description_specs(self, desc: str) -> list:
        """Parse markdown-style product description into structured specs.
        Daraz LD+JSON descriptions use: ### **Section:**- **Key:** Value
        """
        specs = []
        current_section = ''

        # Split on section headers (### or #### followed by **Name**)
        parts = re.split(r'(#{3,4}\s*\*\*[^*]+\*\*)', desc)

        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Check if this is a section header
            section_match = re.match(r'^#{3,4}\s*\*\*([^*]+)\*\*', part)
            if section_match:
                current_section = section_match.group(1).strip().rstrip(':')
                continue

            # Parse bullet items: - **Key:** Value
            items = re.findall(r'-\s*\*\*([^*]+):\*\*\s*(.*?)(?=-\s*\*\*|\Z)', part, re.DOTALL)
            for key, val in items:
                key = key.strip()
                val = val.strip().rstrip('-').strip()
                # Truncate values that absorb trailing prose (beyond spec data)
                if val and len(val) > 300:
                    val = val[:300].rsplit('.', 1)[0].strip()
                if val:
                    full_key = f"{current_section} - {key}" if current_section else key
                    specs.append({'key': full_key, 'value': val})

        # Deduplicate by key
        seen = set()
        unique = []
        for s in specs:
            if s['key'] not in seen:
                seen.add(s['key'])
                unique.append(s)

        return unique
