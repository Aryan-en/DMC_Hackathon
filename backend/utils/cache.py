import time
import functools
import asyncio
import json
import logging
from typing import Any, Dict, Optional, Callable
from redis import Redis
from core.config import settings

logger = logging.getLogger(__name__)

# Simple observability for caching
CACHE_HITS = 0
CACHE_MISSES = 0

class SimpleCache:
    """Fallback in-memory cache when Redis is not available."""
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry['expiry']:
                global CACHE_HITS
                CACHE_HITS += 1
                return entry['data']
            else:
                del self._cache[key]
        global CACHE_MISSES
        CACHE_MISSES += 1
        return None

    def set(self, key: str, data: Any, ttl: int = 30):
        self._cache[key] = {
            'data': data,
            'expiry': time.time() + ttl
        }

    def clear(self):
        self._cache.clear()

class RedisCache:
    """Redis-based cache for distributed caching."""
    def __init__(self):
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Initialize Redis connection."""
        try:
            self.redis_client = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                decode_responses=True,
                socket_connect_timeout=2,
                retry_on_timeout=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Redis cache connected successfully")
        except Exception as e:
            logger.warning(f"Redis unavailable, falling back to in-memory cache: {e}")
            self.redis_client = None
    
    def get(self, key: str) -> Optional[Any]:
        if not self.redis_client:
            return None
        try:
            cached = self.redis_client.get(key)
            if cached is not None:
                return json.loads(cached)
        except Exception as e:
            logger.debug(f"Redis get error: {e}")
            self._connect()  # Try to reconnect
        return None
    
    def set(self, key: str, data: Any, ttl: int = 30):
        if not self.redis_client:
            return
        try:
            serialized = json.dumps(data, default=str)
            self.redis_client.setex(key, ttl, serialized)
        except Exception as e:
            logger.debug(f"Redis set error: {e}")
            self._connect()  # Try to reconnect
    
    def clear(self):
        if not self.redis_client:
            return
        try:
            self.redis_client.flushdb()
        except Exception as e:
            logger.debug(f"Redis clear error: {e}")
            self._connect()  # Try to reconnect

# Global cache instances - try Redis first, fallback to in-memory
try:
    redis_cache = RedisCache()
    global_cache = redis_cache  # Use Redis if available
    logger.info("Using Redis for caching")
except Exception as e:
    global_cache = SimpleCache()  # Fallback to in-memory
    logger.info(f"Using in-memory cache: {e}")

def cached_endpoint(ttl: int = 30):
    """
    Decorator for FastAPI endpoints to cache the JSON response.
    Uses Redis when available, falls back to in-memory cache.
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
