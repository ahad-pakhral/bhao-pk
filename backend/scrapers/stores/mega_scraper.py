"""
Mega.pk scraper — Pakistani price comparison & electronics store.
"""

import re
from bs4 import BeautifulSoup
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class MegaScraper(BaseScraper):
    store_name = 'Mega'
    base_url = 'https://www.mega.pk'
    search_url_template = 'https://www.mega.pk/catalogsearch/result/?q={keyword}'
    rate_limit_seconds = 2.0

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

        for card in soup.select('.product-card, .product-item, .pro-box, .product'):
            try:
                name_el = card.select_one('.product-title, .pro-title, h3, h4, .name')
                price_el = card.select_one('.product-price, .pro-price, .price')
                link_el = card.select_one('a')
                img_el = card.select_one('img')

                if not name_el or not price_el:
                    continue

                name = name_el.get_text(strip=True)
                price = parse_price(price_el.get_text(strip=True))

                url = ''
                if link_el and link_el.get('href'):
                    href = link_el['href']
                    url = href if href.startswith('http') else self.base_url + href

                image_url = ''
                if img_el:
                    image_url = img_el.get('src', '') or img_el.get('data-src', '')

                products.append({
                    'name': name,
                    'price': price,
                    'originalPrice': None,
                    'url': url,
                    'imageUrl': image_url,
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

        # Name
        title_el = soup.select_one('.product-name, .pro-title, h1')
        if title_el:
            result['name'] = title_el.get_text(strip=True)

        # Image
        img_el = soup.select_one('.product-image img, .fotorama__img, .gallery-image img')
        if img_el:
            result['imageUrl'] = img_el.get('src') or img_el.get('data-src') or ''

        # Price
        price_el = soup.select_one('.product-price, .price, .pro-price')
        if price_el:
            result['price'] = parse_price(price_el.get_text(strip=True))

        # Original price
        orig_el = soup.select_one('.old-price, .price-old')
        if orig_el:
            orig = parse_price(orig_el.get_text(strip=True))
            if orig > result['price']:
                result['originalPrice'] = orig

        # Stock
        oos_el = soup.select_one('.out-of-stock, .sold-out, .unavailable')
        if oos_el:
            result['inStock'] = False

        # Description
        desc_el = soup.select_one('.product-description, .std, .description')
        if desc_el:
            result['description'] = desc_el.get_text(strip=True)[:500]

        # Specs
        for row in soup.select('.data-table table tr, .product-attributes table tr, .specifications table tr'):
            cells = row.select('th, td')
            if len(cells) >= 2:
                key = cells[0].get_text(strip=True).rstrip(':')
                val = cells[1].get_text(strip=True)
                if key and val:
                    result['specs'].append({'key': key, 'value': val})

        return result
