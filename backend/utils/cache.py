import time
import functools
import asyncio
from typing import Any, Dict, Optional, Callable

class SimpleCache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry['expiry']:
                return entry['data']
            else:
                del self._cache[key]
        return None

    def set(self, key: str, data: Any, ttl: int = 30):
        self._cache[key] = {
            'data': data,
            'expiry': time.time() + ttl
        }

    def clear(self):
        self._cache.clear()

# Global cache instance
global_cache = SimpleCache()

def cached_endpoint(ttl: int = 30):
    """
    Decorator for FastAPI endpoints to cache the JSON response.
    Only works for GET requests without complex query params for now.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate a simple cache key based on function name and kwargs
            # We exclude the DB session from the key
            cache_kwargs = {k: v for k, v in kwargs.items() if k != 'db'}
            key = f"{func.__name__}:{str(cache_kwargs)}"
            
            cached_val = global_cache.get(key)
            if cached_val is not None:
                return cached_val
            
            # Execute the actual function
            result = await func(*args, **kwargs)
            
            # Cache the result
            global_cache.set(key, result, ttl)
            return result
        return wrapper
    return decorator
