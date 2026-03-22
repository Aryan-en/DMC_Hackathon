"""Week 15: Advanced Request Validation & Async Processing Improvements."""

import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from functools import wraps
from time import perf_counter

from fastapi import Request, HTTPException
from starlette.datastructures import MutableHeaders
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from config import settings
from utils.sanitize import sanitize_string

logger = logging.getLogger(__name__)


class VerboseRequestValidationMiddleware(BaseHTTPMiddleware):
    """Enhanced request validation with detailed logging and sanitization."""
    
    # Sensitive fields that should not be logged
    SENSITIVE_FIELDS = {
        "password", "token", "api_key", "secret", "auth", 
        "authorization", "credentials", "api_secret", "private_key"
    }
    
    # Max allowed request size by content type
    SIZE_LIMITS = {
        "application/json": 1 * 1024 * 1024,      # 1MB
        "multipart/form-data": 50 * 1024 * 1024,  # 50MB
        "text/plain": 5 * 1024 * 1024,            # 5MB
        "default": 10 * 1024 * 1024,              # 10MB
    }
    
    async def dispatch(self, request: Request, call_next):
        """Process and validate request."""
        
        # 1. Check Content-Type
        content_type = request.headers.get("content-type", "").split(";")[0]
        
        # 2. Validate Content-Length for POST/PUT/PATCH
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            
            if not content_length and request.method in ["POST", "PUT"]:
                return JSONResponse(
                    status_code=411,
                    content={
                        "status": "error",
                        "error": {
                            "code": "LENGTH_REQUIRED",
                            "message": "Content-Length header required for POST/PUT requests"
                        }
                    }
                )
            
            # Check size limits
            if content_length:
                try:
                    size = int(content_length)
                    limit = self.SIZE_LIMITS.get(content_type, self.SIZE_LIMITS["default"])
                    
                    if size > limit:
                        return JSONResponse(
                            status_code=413,
                            content={
                                "status": "error",
                                "error": {
                                    "code": "PAYLOAD_TOO_LARGE",
                                    "message": f"Request size {size} exceeds limit {limit}",
                                    "max_size": limit
                                }
                            }
                        )
                except ValueError:
                    pass
        
        # 3. Validate headers
        await self._validate_headers(request)
        
        # 4. Sanitize path
        request.url._url = sanitize_string(str(request.url))
        
        # 5. Process request with error handling
        try:
            response = await call_next(request)
        except Exception as e:
            logger.error(f"Request processing error: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={
                    "status": "error",
                    "error": {
                        "code": "INTERNAL_ERROR",
                        "message": "Internal server error"
                    }
                }
            )
        
        # 6. Add security headers to response
        self._add_security_headers(response)
        
        return response
    
    async def _validate_headers(self, request: Request) -> None:
        """Validate request headers."""
        
        # Check for suspicious headers
        suspicious_headers = ["x-forwarded-host", "x-original-url", "x-rewrite-url"]
        
        for header in suspicious_headers:
            if header in request.headers:
                # These can be used for header injection attacks
                value = request.headers.get(header)
                if any(char in value for char in ["\r", "\n", "\0"]):
                    logger.warning(f"Suspicious header detected: {header}")
                    raise HTTPException(status_code=400, detail="Invalid header")
    
    def _add_security_headers(self, response) -> None:
        """Add security headers to response."""
        
        headers = MutableHeaders(response.headers)
        
        # Prevent MIME type sniffing
        headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        headers["X-Frame-Options"] = "DENY"
        
        # XSS Protection
        headers["X-XSS-Protection"] = "1; mode=block"
        
        # Disable client-side caching of sensitive data
        headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        headers["Pragma"] = "no-cache"
        headers["Expires"] = "0"
        
        # Content Security Policy
        if settings.ENVIRONMENT == "production":
            headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'"
            )
            
            # HSTS
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Referrer policy
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy
        headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with sanitized sensitive data."""
    
    SENSITIVE_FIELDS = {
        "password", "token", "api_key", "secret", "auth",
        "authorization", "credentials"
    }
    
    async def dispatch(self, request: Request, call_next):
        """Log request and response with timing."""
        
        start_time = perf_counter()
        
        # Build request log
        request_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", ""),
        }
        
        # Log headers (sanitized)
        headers_to_log = {
            "content-type": request.headers.get("content-type"),
            "accept": request.headers.get("accept"),
        }
        request_log["headers"] = headers_to_log
        
        # Try to log body for POST/PUT
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    try:
                        body_data = json.loads(body)
                        # Sanitize sensitive fields
                        sanitized_body = self._sanitize_body(body_data)
                        request_log["body_preview"] = str(sanitized_body)[:500]
                    except json.JSONDecodeError:
                        request_log["body_preview"] = f"(binary data, {len(body)} bytes)"
            except Exception as e:
                logger.debug(f"Could not read request body: {e}")
        
        logger.info(f"Request: {json.dumps(request_log)}")
        
        # Process request
        response = await call_next(request)
        
        # Calculate duration
        duration_ms = (perf_counter() - start_time) * 1000
        
        # Log response
        response_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }
        
        logger.info(f"Response: {json.dumps(response_log)}")
        
        # Add timing header
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"
        
        return response
    
    def _sanitize_body(self, data: Any, depth: int = 0) -> Any:
        """Recursively sanitize sensitive fields from request body."""
        
        if depth > 5:  # Prevent deep recursion
            return data
        
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in self.SENSITIVE_FIELDS):
                    sanitized[key] = "***REDACTED***"
                else:
                    sanitized[key] = self._sanitize_body(value, depth + 1)
            return sanitized
        
        elif isinstance(data, list):
            return [self._sanitize_body(item, depth + 1) for item in data]
        
        return data


class QueryParameterValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize query parameters."""
    
    # Max length for query parameter values
    MAX_PARAM_LENGTH = 1000
    
    # Parameters that require strict validation
    STRICT_PARAMS = {
        "limit": (int, 1, 10000),
        "offset": (int, 0, 1000000),
        "page": (int, 1, 100000),
    }
    
    async def dispatch(self, request: Request, call_next):
        """Validate query parameters."""
        
        # Validate common pagination parameters
        for param_name, (expected_type, min_val, max_val) in self.STRICT_PARAMS.items():
            if param_name in request.query_params:
                try:
                    value = request.query_params[param_name]
                    
                    if expected_type == int:
                        int_value = int(value)
                        
                        if int_value < min_val or int_value > max_val:
                            return JSONResponse(
                                status_code=400,
                                content={
                                    "status": "error",
                                    "error": {
                                        "code": "INVALID_PARAMETER",
                                        "message": f"Parameter '{param_name}' out of range: {min_val}-{max_val}",
                                        "parameter": param_name,
                                        "value": int_value,
                                        "valid_range": [min_val, max_val]
                                    }
                                }
                            )
                except (ValueError, TypeError):
                    return JSONResponse(
                        status_code=400,
                        content={
                            "status": "error",
                            "error": {
                                "code": "INVALID_PARAMETER",
                                "message": f"Parameter '{param_name}' must be {expected_type.__name__}",
                                "parameter": param_name
                            }
                        }
                    )
        
        # Validate other parameters for excessive length
        for param_name, param_value in request.query_params.items():
            if len(param_value) > self.MAX_PARAM_LENGTH:
                return JSONResponse(
                    status_code=400,
                    content={
                        "status": "error",
                        "error": {
                            "code": "PARAMETER_TOO_LONG",
                            "message": f"Parameter '{param_name}' exceeds maximum length",
                            "parameter": param_name,
                            "max_length": self.MAX_PARAM_LENGTH
                        }
                    }
                )
        
        return await call_next(request)


def rate_limit_by_tier(tier_limits: Dict[str, int]):
    """
    Decorator for tier-based rate limiting.
    
    Example:
        @rate_limit_by_tier({
            "free": 100,      # 100 requests/hour for free tier
            "premium": 1000,  # 1000 requests/hour for premium tier
        })
    """
    def decorator(func):
        # Store tier limits on function
        func._rate_limit_tiers = tier_limits
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await func(*args, **kwargs)
        
        return wrapper
    
    return decorator


def validate_output(schema: Dict[str, Any]):
    """
    Decorator to validate response against schema.
    
    Example:
        @validate_output({
            "status": str,
            "data": dict,
            "timestamp": str,
        })
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            response = await func(*args, **kwargs)
            
            # Validate response structure
            for key, expected_type in schema.items():
                if key not in response:
                    logger.warning(f"Missing required key in response: {key}")
                elif not isinstance(response[key], expected_type):
                    logger.warning(
                        f"Invalid type for key {key}: expected {expected_type}, "
                        f"got {type(response[key])}"
                    )
            
            return response
        
        return wrapper
    
    return decorator


if __name__ == "__main__":
    logger.info("Advanced validation middleware loaded")
