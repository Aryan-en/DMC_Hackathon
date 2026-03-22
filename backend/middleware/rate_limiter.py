"""Rate limiting and DDoS protection middleware."""

import time
from typing import Dict, Optional, Callable
from functools import wraps
from datetime import datetime, timedelta
from collections import defaultdict
from fastapi import Request, HTTPException, status


class RateLimiter:
    """Simple rate limiting implementation."""
    
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed for identifier."""
        now = time.time()
        cutoff = now - 60  # 1 minute window
        
        # Clean old requests
        self.requests[identifier] = [
            ts for ts in self.requests[identifier] if ts > cutoff
        ]
        
        # Check limit
        if len(self.requests[identifier]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.requests[identifier].append(now)
        return True
    
    def get_remaining(self, identifier: str) -> int:
        """Get remaining requests for identifier."""
        now = time.time()
        cutoff = now - 60
        recent = [ts for ts in self.requests[identifier] if ts > cutoff]
        return max(0, self.requests_per_minute - len(recent))


class EndpointRateLimiter:
    """Per-endpoint rate limiting with configurable limits."""
    
    def __init__(self):
        self.limiters: Dict[str, RateLimiter] = {}
        self.endpoint_configs: Dict[str, int] = {
            # Default limits per minute
            "/api/auth/login": 5,  # Strict for auth
            "/api/auth/register": 10,
            "/api/predictions/pyg-model/predict": 100,  # Higher for inference
            "/api/security/export-request": 20,
            "/api/data-lake/": 50,
            "default": 60,  # Default for all endpoints
        }
    
    def get_limiter(self, endpoint: str) -> RateLimiter:
        """Get or create limiter for endpoint."""
        if endpoint not in self.limiters:
            limit = self.endpoint_configs.get("default", 60)
            for pattern, configured_limit in self.endpoint_configs.items():
                if pattern in endpoint:
                    limit = configured_limit
                    break
            self.limiters[endpoint] = RateLimiter(limit)
        return self.limiters[endpoint]
    
    async def check_rate_limit(self, request: Request) -> bool:
        """Check rate limit for request (uses IP address as identifier)."""
        client_ip = request.client.host if request.client else "unknown"
        endpoint = request.url.path
        
        limiter = self.get_limiter(endpoint)
        if not limiter.is_allowed(client_ip):
            remaining = limiter.get_remaining(client_ip)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Try again in 1 minute. Requests remaining: {remaining}"
            )
        
        remaining = limiter.get_remaining(client_ip)
        return True


class IPBlacklist:
    """IP blacklist with automatic unblocking after timeout."""
    
    def __init__(self, block_duration_minutes: int = 15):
        self.blacklist: Dict[str, datetime] = {}
        self.block_duration = timedelta(minutes=block_duration_minutes)
    
    def block_ip(self, ip: str, reason: str = "Rate limit abuse"):
        """Block an IP address temporarily."""
        self.blacklist[ip] = datetime.utcnow() + self.block_duration
    
    def is_blocked(self, ip: str) -> bool:
        """Check if IP is blocked."""
        if ip not in self.blacklist:
            return False
        
        # Check if block has expired
        if datetime.utcnow() > self.blacklist[ip]:
            del self.blacklist[ip]
            return False
        
        return True
    
    def unblock_ip(self, ip: str):
        """Manually unblock an IP."""
        self.blacklist.pop(ip, None)
    
    def get_blocked_ips(self) -> list:
        """Get list of currently blocked IPs."""
        # Clean expired blocks
        current_time = datetime.utcnow()
        self.blacklist = {
            ip: expiry for ip, expiry in self.blacklist.items()
            if current_time <= expiry
        }
        return list(self.blacklist.keys())


def rate_limit(requests_per_minute: int = 60):
    """Decorator for rate limiting individual functions."""
    limiter = RateLimiter(requests_per_minute)
    
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, request: Request = None, **kwargs):
            if request:
                client_ip = request.client.host if request.client else "unknown"
                if not limiter.is_allowed(client_ip):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded"
                    )
            return await func(*args, request=request, **kwargs)
        
        @wraps(func)
        def sync_wrapper(*args, request: Request = None, **kwargs):
            if request:
                client_ip = request.client.host if request.client else "unknown"
                if not limiter.is_allowed(client_ip):
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded"
                    )
            return func(*args, request=request, **kwargs)
        
        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Global instances
endpoint_rate_limiter = EndpointRateLimiter()
ip_blacklist = IPBlacklist()
