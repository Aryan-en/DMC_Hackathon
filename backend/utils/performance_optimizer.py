"""Week 15: Performance Optimization & Caching Strategy."""

import time
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Any, Optional, Callable
from functools import wraps
from enum import Enum

from redis import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

logger = logging.getLogger(__name__)


class CacheTTL(Enum):
    """Cache time-to-live durations."""
    INSTANT = 0           # No caching (0 seconds)
    SHORT = 60            # 1 minute
    MEDIUM = 300          # 5 minutes
    LONG = 3600           # 1 hour
    VERY_LONG = 86400     # 24 hours


class CacheStrategy:
    """Caching strategy for different data types."""
    
    # Define TTL by endpoint/table
    CACHE_CONFIG = {
        # Fast-changing data (real-time updates)
        "metrics": CacheTTL.SHORT,
        "streams": CacheTTL.SHORT,
        "events": CacheTTL.SHORT,
        
        # Medium-changing data
        "predictions": CacheTTL.MEDIUM,
        "intelligence": CacheTTL.MEDIUM,
        "knowledge_graph": CacheTTL.MEDIUM,
        
        # Slow-changing data
        "entities": CacheTTL.LONG,
        "regions": CacheTTL.LONG,
        "countries": CacheTTL.LONG,
        "classifications": CacheTTL.VERY_LONG,
    }


def cache_async(ttl: int = CacheTTL.MEDIUM.value, key_builder: Optional[Callable] = None):
    """
    Async function caching decorator with Redis.
    
    Args:
        ttl: Cache time-to-live in seconds
        key_builder: Custom function to build cache key
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            redis_client = None
            
            try:
                from config import settings
                redis_client = Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    decode_responses=True,
                    socket_connect_timeout=2
                )
            except Exception as e:
                logger.warning(f"Redis unavailable, bypassing cache: {e}")
                return await func(*args, **kwargs)
            
            # Build cache key
            if key_builder:
                cache_key = key_builder(*args, **kwargs)
            else:
                # Default: function name + args (excluding self)
                func_name = func.__name__
                args_str = "_".join(str(arg) for arg in args[1:] if not isinstance(arg, AsyncSession))
                cache_key = f"{func_name}:{args_str}"
            
            # Try to get from cache
            try:
                cached = redis_client.get(cache_key)
                if cached:
                    logger.debug(f"Cache hit: {cache_key}")
                    
                    import json
                    return json.loads(cached)
            except Exception as e:
                logger.debug(f"Cache get error: {e}")
            
            # Execute function if not cached
            result = await func(*args, **kwargs)
            
            # Store in cache
            try:
                import json
                redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                logger.debug(f"Cache set: {cache_key} (TTL: {ttl}s)")
            except Exception as e:
                logger.debug(f"Cache set error: {e}")
            
            return result
        
        return wrapper
    
    return decorator


class DatabaseQueryOptimizer:
    """Optimize database queries for performance."""
    
    @staticmethod
    async def enable_query_logging(session: AsyncSession):
        """Enable slow query logging."""
        await session.execute(text("SET log_min_duration_statement = 500;"))
        logger.info("Query logging enabled (log queries > 500ms)")
    
    @staticmethod
    async def create_missing_indexes(session: AsyncSession):
        """Create indexes for common queries."""
        
        indexes_to_create = [
            # Conflicts table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conflicts_region ON conflicts(region)",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conflicts_timestamp ON conflicts(timestamp)",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conflicts_region_timestamp ON conflicts(region, timestamp)",
            
            # Entities table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_name ON entities(name)",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entities_type ON entities(entity_type)",
            
            # Events table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_timestamp ON events(timestamp)",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_region ON events(region)",
            
            # Metrics table
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_timestamp ON system_metrics(timestamp)",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_metrics_metric_type ON system_metrics(metric_type)",
        ]
        
        for index_sql in indexes_to_create:
            try:
                await session.execute(text(index_sql))
                logger.info(f"Index created: {index_sql.split()[-1]}")
            except Exception as e:
                logger.warning(f"Index creation failed: {e}")


class QueryPerformanceAnalyzer:
    """Analyze and optimize database query performance."""
    
    @staticmethod
    async def get_slow_queries(session: AsyncSession, threshold_ms: int = 500):
        """Get queries slower than threshold."""
        
        query = """
        SELECT 
            query,
            calls,
            total_time,
            mean_time,
            max_time
        FROM pg_stat_statements
        WHERE mean_time > :threshold
        ORDER BY mean_time DESC
        LIMIT 20
        """
        
        try:
            result = await session.execute(
                text(query),
                {"threshold": threshold_ms}
            )
            return result.fetchall()
        except Exception as e:
            logger.error(f"Could not fetch slow queries: {e}")
            return []
    
    @staticmethod
    async def analyze_query_plan(session: AsyncSession, query: str):
        """Analyze execution plan for a query."""
        
        try:
            result = await session.execute(text(f"EXPLAIN ANALYZE {query}"))
            plan = result.fetchall()
            return [row[0] for row in plan]
        except Exception as e:
            logger.error(f"Could not analyze query plan: {e}")
            return []


class ConnectionPoolOptimizer:
    """Optimize database connection pool settings."""
    
    @staticmethod
    def get_optimal_pool_size() -> int:
        """
        Calculate optimal connection pool size.
        
        Formula: (core_count * 2) + effective_spindle_count
        For cloud: typically 10-20
        """
        import os
        cores = os.cpu_count() or 4
        return (cores * 2) + 1
    
    @staticmethod
    async def monitor_pool_status(session: AsyncSession) -> dict:
        """Monitor connection pool health."""
        
        try:
            result = await session.execute(
                text("""
                SELECT 
                    count(*) as total_connections,
                    count(*) FILTER (WHERE state = 'active') as active_connections,
                    count(*) FILTER (WHERE state = 'idle') as idle_connections,
                    max(extract(epoch from (now() - query_start))) as longest_query_sec
                FROM pg_stat_activity
                """)
            )
            row = result.first()
            
            return {
                "total_connections": row[0],
                "active_connections": row[1],
                "idle_connections": row[2],
                "longest_query_sec": row[3],
                "health": "good" if row[1] < (row[0] * 0.8) else "warning"
            }
        except Exception as e:
            logger.error(f"Could not monitor pool: {e}")
            return {}


class JSONResponseOptimization:
    """Optimize JSON response serialization."""
    
    @staticmethod
    def compress_response(data: dict) -> dict:
        """Remove unnecessary fields from response."""
        
        # Remove internal fields
        fields_to_remove = {"_sa_instance_state", "_sa_pending_changes"}
        
        def clean_dict(obj):
            if isinstance(obj, dict):
                return {
                    k: clean_dict(v)
                    for k, v in obj.items()
                    if k not in fields_to_remove
                }
            elif isinstance(obj, list):
                return [clean_dict(item) for item in obj]
            return obj
        
        return clean_dict(data)
    
    @staticmethod
    def optimize_field_selection(fields_requested: list[str], available_fields: list[str]) -> list[str]:
        """
        Optimize which fields to fetch from database.
        Only fetch requested fields to reduce data transfer.
        """
        
        # Required fields (always needed)
        required_fields = {"id", "created_at", "updated_at"}
        
        # Combine requested with required
        final_fields = set(required_fields)
        
        for field in fields_requested:
            if field in available_fields:
                final_fields.add(field)
        
        return list(final_fields)


class AsyncBatchProcessor:
    """Process requests in batches for better performance."""
    
    @staticmethod
    async def batch_fetch(
        ids: list[int],
        fetch_func: Callable,
        batch_size: int = 100
    ) -> dict[int, Any]:
        """Fetch multiple items in batches to avoid N+1 queries."""
        
        results = {}
        
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            logger.debug(f"Processing batch of {len(batch_ids)} items")
            
            batch_results = await fetch_func(batch_ids)
            results.update(batch_results)
            
            # Add small delay between batches to avoid overwhelming DB
            if i + batch_size < len(ids):
                await asyncio.sleep(0.01)
        
        return results


class PerformanceMonitor:
    """Monitor and report on performance metrics."""
    
    def __init__(self):
        self.request_times = []
        self.db_query_times = []
        self.cache_hits = 0
        self.cache_misses = 0
    
    async def report(self) -> dict:
        """Get performance report."""
        
        def percentile(data, p):
            if not data:
                return 0
            sorted_data = sorted(data)
            idx = int(len(sorted_data) * p / 100)
            return sorted_data[idx]
        
        total_requests = len(self.request_times)
        total_cache = self.cache_hits + self.cache_misses
        cache_hit_rate = (self.cache_hits / total_cache * 100) if total_cache > 0 else 0
        
        return {
            "summary": {
                "total_requests": total_requests,
                "cache_hit_rate": f"{cache_hit_rate:.1f}%",
            },
            "request_times_ms": {
                "average": sum(self.request_times) / len(self.request_times) if self.request_times else 0,
                "p50": percentile(self.request_times, 50),
                "p95": percentile(self.request_times, 95),
                "p99": percentile(self.request_times, 99),
                "min": min(self.request_times) if self.request_times else 0,
                "max": max(self.request_times) if self.request_times else 0,
            },
            "db_query_times_ms": {
                "average": sum(self.db_query_times) / len(self.db_query_times) if self.db_query_times else 0,
                "p95": percentile(self.db_query_times, 95),
                "p99": percentile(self.db_query_times, 99),
            }
        }


# Global performance monitor instance
perf_monitor = PerformanceMonitor()


if __name__ == "__main__":
    logger.info("Performance optimization module loaded")
