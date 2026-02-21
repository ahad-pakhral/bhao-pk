"""
Fuzzy product matching — groups the same product across different stores.
Uses SequenceMatcher for string similarity.
"""

from difflib import SequenceMatcher


def similarity(a: str, b: str) -> float:
    """Normalized string similarity (0-1)."""
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def group_products(all_listings: list, threshold: float = 0.75) -> list:
    """
    Group listings that refer to the same product across stores.

    Returns list of grouped products, each with:
      - name: representative product name
      - best_price: lowest price across stores
      - best_store: store with the lowest price
      - image_url: product image
      - listings: all individual store listings
    """
    groups = []

    for listing in all_listings:
        matched = False
        for group in groups:
            if similarity(listing.get('name', ''), group['name']) >= threshold:
                group['listings'].append(listing)
                if listing.get('price', float('inf')) < group['best_price']:
                    group['best_price'] = listing['price']
                    group['best_store'] = listing.get('store', '')
                matched = True
                break

        if not matched:
            groups.append({
                'name': listing.get('name', ''),
                'best_price': listing.get('price', 0),
                'best_store': listing.get('store', ''),
                'image_url': listing.get('imageUrl', ''),
                'category': listing.get('category', ''),
                'listings': [listing],
            })

    return groups
