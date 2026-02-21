"""
PriceOye.pk scraper — Pakistani mobile & gadgets price comparison.
"""

import re
from bs4 import BeautifulSoup
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class PriceOyeScraper(BaseScraper):
    store_name = 'PriceOye'
    base_url = 'https://priceoye.pk'
    search_url_template = 'https://priceoye.pk/search?q={keyword}'
    rate_limit_seconds = 2.0

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

        for card in soup.select('.product-card, .productBox, .product-item, .p-item'):
            try:
                name_el = card.select_one('.product-title, .p-title, h3, h4, .name')
                price_el = card.select_one('.product-price, .p-price, .price')
                link_el = card.select_one('a')
                img_el = card.select_one('img')
                rating_el = card.select_one('.rating, .stars')

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

                rating = 0.0
                if rating_el:
                    rating_text = rating_el.get_text(strip=True)
                    nums = re.findall(r'[\d.]+', rating_text)
                    if nums:
                        rating = float(nums[0])

                products.append({
                    'name': name,
                    'price': price,
                    'originalPrice': None,
                    'url': url,
                    'imageUrl': image_url,
                    'rating': rating,
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

        price = 0
        in_stock = True

        price_el = soup.select_one('.product-price, .price, .p-price')
        if price_el:
            price = parse_price(price_el.get_text(strip=True))

        oos_el = soup.select_one('.out-of-stock, .sold-out')
        if oos_el:
            in_stock = False

        return {'price': price, 'inStock': in_stock}
