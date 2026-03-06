import os
import time
from collections import defaultdict

_DEBUG = os.environ.get("DEBUG", "").lower() in ("1", "true", "yes")


class SlidingWindowRateLimiter:
    """In-memory sliding window rate limiter."""

    def __init__(self, max_requests: int, window_seconds: int):
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        if _DEBUG:
            return True
        now = time.time()
        cutoff = now - self._window_seconds
        timestamps = self._requests[key]

        self._requests[key] = [t for t in timestamps if t > cutoff]

        if len(self._requests[key]) >= self._max_requests:
            return False

        self._requests[key].append(now)
        return True

    def retry_after(self, key: str) -> int:
        if not self._requests[key]:
            return 0
        oldest = min(self._requests[key])
        return max(0, int(oldest + self._window_seconds - time.time()) + 1)


quick_limiter = SlidingWindowRateLimiter(max_requests=30, window_seconds=3600)
burst_limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
