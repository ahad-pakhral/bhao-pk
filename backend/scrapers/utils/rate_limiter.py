"""
Rate limiter to avoid getting banned by stores.
Ensures minimum delay between requests to the same store.
"""

import time


class RateLimiter:
    def __init__(self, min_delay: float = 2.0):
        self.min_delay = min_delay
        self.last_request_time = 0.0

    def wait(self):
        """Wait until enough time has passed since the last request."""
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()
