"""
Extract numeric price from various Pakistani Rupee formats.
Examples: "Rs. 345,000", "PKR 12,500", "₨ 85000", "Rs.65,000/-"
"""

import re


def parse_price(price_str: str) -> int:
    """Parse a PKR price string to an integer."""
    if not price_str:
        return 0

    # Remove currency symbols, spaces, commas, dashes
    cleaned = re.sub(r'[^\d.]', '', price_str)

    if not cleaned:
        return 0

    try:
        # Handle decimal prices (round to nearest rupee)
        return int(float(cleaned))
    except ValueError:
        return 0


def format_price(price: int) -> str:
    """Format an integer price as PKR string."""
    return f"Rs. {price:,}"
