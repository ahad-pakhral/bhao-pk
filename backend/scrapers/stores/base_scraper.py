"""
Abstract base class for all store scrapers.
Each store scraper implements parse_search_results() and scrape_product_page().
"""

import time
import random
from abc import ABC, abstractmethod
from urllib.parse import quote

import requests
from bs4 import BeautifulSoup

from utils.rate_limiter import RateLimiter


# Rotate User-Agents to reduce ban risk
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
]


class BaseScraper(ABC):
    store_name: str = ''
    base_url: str = ''
    search_url_template: str = ''
    rate_limit_seconds: float = 2.0

    def __init__(self):
        self.session = requests.Session()
        self.rate_limiter = RateLimiter(self.rate_limit_seconds)

    def _get_headers(self) -> dict:
        return {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }

    def fetch(self, url: str, retries: int = 2) -> str:
        """HTTP GET with rate limiting, retries, and User-Agent rotation."""
        self.rate_limiter.wait()

        for attempt in range(retries + 1):
            try:
                response = self.session.get(
                    url,
                    headers=self._get_headers(),
                    timeout=15,
                )
                response.raise_for_status()
                return response.text
            except requests.RequestException as e:
                if attempt < retries:
                    time.sleep(1 + random.random())
                    continue
                raise e

        return ''

    def search(self, keyword: str) -> list:
        """Search store for keyword, return list of product dicts."""
        url = self.search_url_template.format(keyword=quote(keyword))
        html = self.fetch(url)
        return self.parse_search_results(html)

    @abstractmethod
    def parse_search_results(self, html: str) -> list:
        """Extract products from search results HTML. Override per store."""
        raise NotImplementedError

    @abstractmethod
    def scrape_product_page(self, url: str) -> dict:
        """Scrape a single product page for current price."""
        raise NotImplementedError
