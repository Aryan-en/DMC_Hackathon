"""Production Security Hardening Middleware - Week 15."""

import logging
import time
from typing import Dict
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from config import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers for production
        if settings.ENVIRONMENT == "production":
            # HSTS - Enforce HTTPS
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            # Prevent clickjacking
            response.headers["X-Frame-Options"] = "DENY"
            
            # XSS protection
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            
            # Content Security Policy
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; "
                "script-src 'self'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data:; "
                "font-src 'self'; "
                "connect-src 'self'; "
                "frame-ancestors 'none';"
            )
            
            # Referrer Policy
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            
            # Permissions Policy (formerly Feature Policy)
            response.headers["Permissions-Policy"] = (
                "geolocation=(), "
                "microphone=(), "
                "camera=(), "
                "usb=(), "
                "magnetometer=(), "
                "gyroscope=(), "
                "accelerometer=()"
            )
        
        # Always hide server info
        response.headers["Server"] = "ONTORA"
        response.headers.pop("X-Powered-By", None)
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting per IP address."""
    
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_history: Dict[str, list] = {}
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/api/health"]:
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        
        # Clean up old requests (older than 1 minute)
        current_time = time.time()
        if client_ip in self.request_history:
            self.request_history[client_ip] = [
                t for t in self.request_history[client_ip]
                if current_time - t < 60
            ]
        else:
            self.request_history[client_ip] = []
        
        # Check rate limit
        if len(self.request_history[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "status": "error",
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later."
                    }
                }
            )
        
        # Record this request
        self.request_history[client_ip].append(current_time)
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.requests_per_minute - len(self.request_history[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        
        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Validate and sanitize incoming requests."""
    
    async def dispatch(self, request: Request, call_next):
        # Check Content-Length
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")
            
            # Reject requests without content-length
            if not content_length:
                return JSONResponse(
                    status_code=411,
                    content={
                        "status": "error",
                        "error": {
                            "code": "LENGTH_REQUIRED",
                            "message": "Content-Length header required"
                        }
                    }
                )
            
            # Reject extremely large requests (> 10MB)
            try:
                size = int(content_length)
                if size > 10 * 1024 * 1024:  # 10MB
                    return JSONResponse(
                        status_code=413,
                        content={
                            "status": "error",
                            "error": {
                                "code": "PAYLOAD_TOO_LARGE",
                                "message": "Request payload too large"
                            }
                        }
                    )
            except ValueError:
                pass
        
        # Proceed with request
        response = await call_next(request)
        return response


class ErrorSanitizationMiddleware(BaseHTTPMiddleware):
    """Redact sensitive information from error responses."""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Unhandled exception: {exc}", exc_info=True)
            
            # In production, don't leak internal error details
            if settings.ENVIRONMENT == "production":
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": "An internal error occurred. Please contact support."
                        }
                    }
                )
            else:
                # In development, provide more details
                return JSONResponse(
                    status_code=500,
                    content={
                        "status": "error",
                        "error": {
                            "code": "INTERNAL_SERVER_ERROR",
                            "message": str(exc)
                        }
                    }
                )


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """Detect and block common injection attacks."""
    
    # Common SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        b"' OR '",
        b"\" OR \"",
        b"'; DROP TABLE",
        b"1=1",
        b"1=2",
        b"UNION SELECT",
        b"exec(",
        b"execute(",
    ]
    
    # Common XSS patterns  
    XSS_PATTERNS = [
        b"<script",
        b"javascript:",
        b"onerror=",
        b"onload=",
        b"eval(",
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Check query parameters
        query_string = request.url.query.encode() if request.url.query else b""
        
        for pattern in self.SQL_INJECTION_PATTERNS + self.XSS_PATTERNS:
            if pattern in query_string.lower():
                logger.warning(f"Potential injection attack from {request.client.host}: {request.url.path}")
                return JSONResponse(
                    status_code=400,
                    content={
                        "status": "error",
                        "error": {
                            "code": "INVALID_REQUEST",
                            "message": "Request contains invalid characters"
                        }
                    }
                )
        
        response = await call_next(request)
        return response


class ProductionSecurityConfig:
    """Configure all security hardening middleware."""
    
    @staticmethod
    def apply_to_app(app):
        """Apply all security middleware to the app."""
        # Order matters - apply from bottom to top (last added = first executed)
        
        # Input validation first
        app.add_middleware(InputSanitizationMiddleware)
        
        # Then rate limiting
        app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
        
        # Then request validation
        app.add_middleware(RequestValidationMiddleware)
        
        # Error sanitization
        app.add_middleware(ErrorSanitizationMiddleware)
        
        # Security headers last (applied to every response)
        app.add_middleware(SecurityHeadersMiddleware)
        
        logger.info("Production security hardening applied")
