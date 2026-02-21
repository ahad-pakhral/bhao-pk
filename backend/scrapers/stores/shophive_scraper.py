"""
Shophive.com scraper — Pakistani electronics & gadgets store.
"""

import re
from bs4 import BeautifulSoup
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class ShophiveScraper(BaseScraper):
    store_name = 'Shophive'
    base_url = 'https://www.shophive.com'
    search_url_template = 'https://www.shophive.com/catalogsearch/result/?q={keyword}'
    rate_limit_seconds = 2.0

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

        # Shophive uses Magento-style product listing
        for card in soup.select('.product-item, .item.product, .product-card'):
            try:
                name_el = card.select_one('.product-item-link, .product-name, .product-title')
                price_el = card.select_one('.price, .special-price .price, [data-price-type="finalPrice"]')
                orig_price_el = card.select_one('.old-price .price, [data-price-type="oldPrice"]')
                link_el = card.select_one('a.product-item-link, a')
                img_el = card.select_one('img.product-image-photo, img')
                rating_el = card.select_one('.rating-result')

                if not name_el or not price_el:
                    continue

                name = name_el.get_text(strip=True)
                price = parse_price(price_el.get_text(strip=True))
                original_price = parse_price(orig_price_el.get_text(strip=True)) if orig_price_el else None

                url = ''
                if link_el and link_el.get('href'):
                    url = link_el['href']

                image_url = ''
                if img_el:
                    image_url = img_el.get('data-src') or img_el.get('data-original') or img_el.get('src', '')

                rating = 0.0
                if rating_el:
                    width_match = re.search(r'(\d+)%', rating_el.get('style', ''))
                    if width_match:
                        rating = float(width_match.group(1)) / 20  # 100% = 5 stars

                products.append({
                    'name': name,
                    'price': price,
                    'originalPrice': original_price,
                    'url': url,
                    'imageUrl': image_url,
                    'rating': round(rating, 1),
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

        price_el = soup.select_one('.price, [data-price-type="finalPrice"]')
        if price_el:
            price = parse_price(price_el.get_text(strip=True))

        stock_el = soup.select_one('.stock.unavailable, .out-of-stock')
        if stock_el:
            in_stock = False

        return {'price': price, 'inStock': in_stock}
