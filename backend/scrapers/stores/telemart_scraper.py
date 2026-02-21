"""
Telemart.pk scraper — popular Pakistani electronics retailer.
"""

import re
from bs4 import BeautifulSoup
from stores.base_scraper import BaseScraper
from utils.price_parser import parse_price


class TelemartScraper(BaseScraper):
    store_name = 'Telemart'
    base_url = 'https://www.telemart.pk'
    search_url_template = 'https://www.telemart.pk/search?q={keyword}'
    rate_limit_seconds = 2.0

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

        for card in soup.select('.product-card, .product-item, .product-box'):
            try:
                name_el = card.select_one('.product-title, .product-name, h3, h4')
                price_el = card.select_one('.product-price, .price, .current-price')
                orig_price_el = card.select_one('.old-price, .original-price, .was-price')
                link_el = card.select_one('a')
                img_el = card.select_one('img')
                rating_el = card.select_one('.rating, .stars')

                if not name_el or not price_el:
                    continue

                name = name_el.get_text(strip=True)
                price = parse_price(price_el.get_text(strip=True))
                original_price = parse_price(orig_price_el.get_text(strip=True)) if orig_price_el else None

                url = ''
                if link_el and link_el.get('href'):
                    href = link_el['href']
                    url = href if href.startswith('http') else self.base_url + href

                image_url = ''
                if img_el:
                    image_url = img_el.get('src', '') or img_el.get('data-src', '')

                rating = 0.0
                reviews_count = 0
                if rating_el:
                    stars = rating_el.select('.star-filled, .fa-star')
                    rating = len(stars) if stars else 0.0

                products.append({
                    'name': name,
                    'price': price,
                    'originalPrice': original_price,
                    'url': url,
                    'imageUrl': image_url,
                    'rating': rating,
                    'reviewsCount': reviews_count,
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

        price_el = soup.select_one('.product-price, .price, .current-price')
        if price_el:
            price = parse_price(price_el.get_text(strip=True))

        oos_el = soup.select_one('.out-of-stock, .sold-out')
        if oos_el:
            in_stock = False

        return {'price': price, 'inStock': in_stock}
