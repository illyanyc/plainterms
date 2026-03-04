import hashlib
import time
from typing import Any, Optional


class TTLCache:
    """Simple in-memory TTL cache."""

    def __init__(self, default_ttl: int = 86400):
        self._store: dict[str, tuple[Any, float]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expiry = entry
        if time.time() > expiry:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expiry = time.time() + (ttl or self._default_ttl)
        self._store[key] = (value, expiry)

    def cleanup(self) -> int:
        """Remove expired entries. Returns number of removed entries."""
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]
        return len(expired)

    @staticmethod
    def make_key(url: str, text: str) -> str:
        content = f"{url}:{text[:5000]}"
        return hashlib.sha256(content.encode()).hexdigest()


analysis_cache = TTLCache(default_ttl=86400)
reputation_cache = TTLCache(default_ttl=86400)
