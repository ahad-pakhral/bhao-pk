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
    search_url_template = 'https://www.shophive.com/catalogsearch/result/?q={keyword}&p={page}'
    rate_limit_seconds = 2.0

    def parse_search_results(self, html: str) -> list:
        soup = BeautifulSoup(html, 'lxml')
        products = []

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
                        rating = float(width_match.group(1)) / 20

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
                    'merchantName': 'Shophive Partner',
                    'merchantRating': 4.3,
                    'merchantTrust': 0.75,
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
        title_el = soup.select_one('.page-title, .product-name, h1')
        if title_el:
            result['name'] = title_el.get_text(strip=True)

        # Image
        img_el = soup.select_one('.product-image-photo, .fotorama__img, .product.media .photo.image')
        if img_el:
            result['imageUrl'] = img_el.get('src') or img_el.get('data-src') or ''

        # Price
        price_el = soup.select_one('.price, [data-price-type="finalPrice"], .special-price .price')
        if price_el:
            result['price'] = parse_price(price_el.get_text(strip=True))

        # Original price
        orig_el = soup.select_one('.old-price .price, [data-price-type="oldPrice"]')
        if orig_el:
            orig = parse_price(orig_el.get_text(strip=True))
            if orig > result['price']:
                result['originalPrice'] = orig

        # Stock
        stock_el = soup.select_one('.stock.unavailable, .out-of-stock')
        if stock_el:
            result['inStock'] = False

        # Rating
        rating_el = soup.select_one('.rating-result, .product-reviews-summary .rating')
        if rating_el:
            width_match = re.search(r'(\d+)%', rating_el.get('style', ''))
            if width_match:
                result['rating'] = round(float(width_match.group(1)) / 20, 1)

        # Description
        desc_el = soup.select_one('.product.description, .product.attribute.description')
        if desc_el:
            result['description'] = desc_el.get_text(strip=True)[:500]

        # Specs (.additional-attributes IS the table, not a parent of one)
        for row in soup.select('.additional-attributes tr, .product.attibute.table tr, table.data.table tr'):
            cells = row.select('th, td')
            if len(cells) >= 2:
                key = cells[0].get_text(strip=True).rstrip(':')
                val = cells[1].get_text(strip=True)
                if key and val:
                    result['specs'].append({'key': key, 'value': val})

        # Reviews — try Magento 2 review AJAX endpoint
        # Shophive loads reviews via tab using listAjax (not in initial HTML)
        try:
            import requests as req
            ajax_match = re.search(
                r'productReviewUrl["\s:]+((?:[^"}\\]|\\.)+)',
                html,
            )
            if ajax_match:
                review_url = ajax_match.group(1)
                # Decode unicode escapes
                review_url = review_url.replace('\\u003A', ':').replace('\\u002F', '/').replace('\\u003F', '?').replace('\\u0026', '&')
                ajax_resp = req.get(
                    review_url,
                    headers={'User-Agent': 'Mozilla/5.0', 'X-Requested-With': 'XMLHttpRequest'},
                    timeout=10,
                )
                if ajax_resp.status_code == 200 and len(ajax_resp.text.strip()) > 50:
                    review_soup = BeautifulSoup(ajax_resp.text, 'lxml')
                    for review_el in review_soup.select('.review-item, .review-details, [class*="review-item"]'):
                        try:
                            author = ''
                            rating = 0
                            text = ''
                            date = ''

                            author_el = review_el.select_one('.review-author, .author, .nickname')
                            if author_el:
                                author = author_el.get_text(strip=True)

                            rating_el2 = review_el.select_one('.rating-result, [class*="rating"]')
                            if rating_el2:
                                width_match = re.search(r'(\d+)%', rating_el2.get('style', ''))
                                if width_match:
                                    rating = round(float(width_match.group(1)) / 20, 1)

                            text_el = review_el.select_one('.review-content, .review-text, .review-title')
                            if text_el:
                                text = text_el.get_text(strip=True)[:300]

                            date_el = review_el.select_one('.review-date, .date')
                            if date_el:
                                date = date_el.get_text(strip=True)

                            if text:
                                result['reviews'].append({
                                    'author': author,
                                    'rating': rating,
                                    'text': text,
                                    'date': date,
                                })
                        except Exception:
                            continue
        except Exception:
            pass

        # Fallback: check reviews already in main HTML
        if not result['reviews']:
            for review_el in soup.select('.review-item, .block.review-list .review'):
                try:
                    author = ''
                    rating = 0
                    text = ''
                    date = ''

                    author_el = review_el.select_one('.review-author, .review-details .author')
                    if author_el:
                        author = author_el.get_text(strip=True)

                    rating_el2 = review_el.select_one('.rating-summary .rating-result')
                    if rating_el2:
                        width_match = re.search(r'(\d+)%', rating_el2.get('style', ''))
                        if width_match:
                            rating = round(float(width_match.group(1)) / 20, 1)

                    text_el = review_el.select_one('.review-content, .review-title')
                    if text_el:
                        text = text_el.get_text(strip=True)[:300]

                    date_el = review_el.select_one('.review-date, .review-details .date')
                    if date_el:
                        date = date_el.get_text(strip=True)

                    if text:
                        result['reviews'].append({
                            'author': author,
                            'rating': rating,
                            'text': text,
                            'date': date,
                        })
                except Exception:
                    continue

        return result
