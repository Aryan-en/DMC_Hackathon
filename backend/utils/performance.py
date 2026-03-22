"""Performance optimization utilities (caching, pagination, compression)."""

from typing import Optional, Dict, Any, List, TypeVar, Generic
from datetime import datetime, timedelta
from functools import wraps
import json
import hashlib


T = TypeVar('T')


class CacheEntry(Generic[T]):
    """Represents a cached entry with TTL."""
    
    def __init__(self, value: T, ttl_seconds: int):
        self.value = value
        self.created_at = datetime.utcnow()
        self.ttl_seconds = ttl_seconds
    
    def is_expired(self) -> bool:
        """Check if cache entry has expired."""
        expiry = self.created_at + timedelta(seconds=self.ttl_seconds)
        return datetime.utcnow() > expiry


class SimpleCache:
    """In-memory cache with TTL support."""
    
    def __init__(self, max_entries: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.max_entries = max_entries
        self.hits = 0
        self.misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if key not in self.cache:
            self.misses += 1
            return None
        
        entry = self.cache[key]
        if entry.is_expired():
            del self.cache[key]
            self.misses += 1
            return None
        
        self.hits += 1
        return entry.value
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        """Set value in cache."""
        # Simple eviction: remove oldest entry if cache is full
        if len(self.cache) >= self.max_entries:
            oldest_key = min(self.cache.keys(),
                           key=lambda k: self.cache[k].created_at)
            del self.cache[oldest_key]
        
        self.cache[key] = CacheEntry(value, ttl_seconds)
    
    def delete(self, key: str):
        """Delete value from cache."""
        self.cache.pop(key, None)
    
    def clear(self):
        """Clear all cache."""
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "entries": len(self.cache),
            "max_entries": self.max_entries,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(hit_rate, 2),
            "total_requests": total_requests
        }


class QueryCache(SimpleCache):
    """Cache for database query results."""
    
    def cache_key(self, query: str, params: Dict = None) -> str:
        """Generate cache key from query and parameters."""
        key_str = f"{query}:{json.dumps(params or {}, sort_keys=True)}"
        return hashlib.md5(key_str.encode()).hexdigest()


class PaginationHelper:
    """Utilities for pagination."""
    
    @staticmethod
    def paginate(items: List[T], page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """Paginate a list of items."""
        if page < 1:
            page = 1
        if page_size < 1 or page_size > 500:
            page_size = 20
        
        total_count = len(items)
        total_pages = (total_count + page_size - 1) // page_size
        
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        
        return {
            "items": items[start_idx:end_idx],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
        }
    
    @staticmethod
    def apply_cursor_pagination(items: List[Dict], cursor: Optional[str] = None,
                               page_size: int = 20) -> Dict[str, Any]:
        """Apply cursor-based pagination (more scalable for large datasets)."""
        if page_size < 1 or page_size > 500:
            page_size = 20
        
        start_idx = 0
        if cursor:
            try:
                start_idx = int(cursor)
            except ValueError:
                start_idx = 0
        
        end_idx = start_idx + page_size
        paginated_items = items[start_idx:end_idx]
        
        next_cursor = None
        if end_idx < len(items):
            next_cursor = str(end_idx)
        
        return {
            "items": paginated_items,
            "pagination": {
                "cursor": cursor,
                "next_cursor": next_cursor,
                "count": len(paginated_items),
                "has_more": end_idx < len(items)
            }
        }


class ResponseCompression:
    """Utilities for response compression."""
    
    @staticmethod
    def should_compress(data: str, min_size: int = 1000) -> bool:
        """Determine if response should be compressed."""
        return len(data.encode('utf-8')) > min_size
    
    @staticmethod
    def get_compression_ratio(original_size: int, compressed_size: int) -> float:
        """Get compression ratio percentage."""
        if original_size == 0:
            return 0
        return (1 - compressed_size / original_size) * 100


def cache_result(ttl_seconds: int = 300, max_entries: int = 1000):
    """Decorator for caching function results."""
    cache = SimpleCache(max_entries)
    
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Call function and cache result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl_seconds)
            return result
        
        # Attach cache stats method
        sync_wrapper.cache_stats = cache.get_stats
        async_wrapper.cache_stats = cache.get_stats
        
        # Return appropriate wrapper
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global instances
query_cache = QueryCache(max_entries=500)
simple_cache = SimpleCache(max_entries=1000)
