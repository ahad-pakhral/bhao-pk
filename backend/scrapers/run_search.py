#!/usr/bin/env python3
"""
Entry point for the Bhao.pk scraper system.
Called by Node.js via child_process.spawn.

Usage:
  python3 run_search.py --keyword "iPhone 15" --store daraz
  python3 run_search.py --url "https://daraz.pk/..." --store daraz --mode product

Outputs JSON to stdout.
"""

import argparse
import json
import sys

from stores.daraz_scraper import DarazScraper
from stores.telemart_scraper import TelemartScraper
from stores.shophive_scraper import ShophiveScraper
from stores.mega_scraper import MegaScraper
from stores.priceoye_scraper import PriceOyeScraper


SCRAPERS = {
    'daraz': DarazScraper,
    'telemart': TelemartScraper,
    'shophive': ShophiveScraper,
    'mega': MegaScraper,
    'priceoye': PriceOyeScraper,
}


def main():
    parser = argparse.ArgumentParser(description='Bhao.pk product scraper')
    parser.add_argument('--keyword', type=str, help='Search keyword')
    parser.add_argument('--store', type=str, required=True, choices=SCRAPERS.keys())
    parser.add_argument('--url', type=str, help='Product URL (for single product scraping)')
    parser.add_argument('--mode', type=str, default='search', choices=['search', 'product'])
    args = parser.parse_args()

    scraper_class = SCRAPERS[args.store]
    scraper = scraper_class()

    try:
        if args.mode == 'product' and args.url:
            result = scraper.scrape_product_page(args.url)
            print(json.dumps(result, ensure_ascii=False))
        elif args.keyword:
            results = scraper.search(args.keyword)
            print(json.dumps(results, ensure_ascii=False))
        else:
            print(json.dumps([]))
    except Exception as e:
        print(f"Scraper error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
