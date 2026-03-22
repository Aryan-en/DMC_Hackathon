"""Input validation and sanitization utilities."""

import re
from typing import Any, Optional, List
from enum import Enum


class ValidationError(Exception):
    """Raised when validation fails."""
    pass


class InputValidator:
    """Comprehensive input validation and sanitization."""
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)",
        r"(--|#|/\*|\*/)",
        r"(;)",
        r"('|\")\s*(OR|AND)",
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<img[^>]*onerror",
    ]
    
    # Path traversal patterns
    PATH_TRAVERSAL_PATTERNS = [
        r"\.\.",
        r"%2e%2e",
        r"\.\.\\",
    ]
    
    @classmethod
    def validate_string(cls, value: Any, min_length: int = 1, max_length: int = 1000,
                       allow_special: bool = False) -> str:
        """Validate and sanitize string input."""
        if not isinstance(value, str):
            raise ValidationError(f"Expected string, got {type(value).__name__}")
        
        value = value.strip()
        
        if len(value) < min_length:
            raise ValidationError(f"String too short (minimum {min_length} characters)")
        
        if len(value) > max_length:
            raise ValidationError(f"String too long (maximum {max_length} characters)")
        
        # Check for SQL injection patterns
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError("Invalid characters detected (possible SQL injection)")
        
        # Check for XSS patterns
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value, re.IGNORECASE):
                raise ValidationError("Invalid characters detected (possible XSS attack)")
        
        # Check for path traversal
        for pattern in cls.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, value):
                raise ValidationError("Invalid characters detected (possible path traversal)")
        
        return value
    
    @classmethod
    def validate_email(cls, value: str) -> str:
        """Validate email address."""
        value = cls.validate_string(value, min_length=5, max_length=254)
        
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, value):
            raise ValidationError("Invalid email address")
        
        return value
    
    @classmethod
    def validate_integer(cls, value: Any, min_value: Optional[int] = None,
                        max_value: Optional[int] = None) -> int:
        """Validate integer input."""
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            raise ValidationError(f"Expected integer, got {type(value).__name__}")
        
        if min_value is not None and int_value < min_value:
            raise ValidationError(f"Value below minimum ({min_value})")
        
        if max_value is not None and int_value > max_value:
            raise ValidationError(f"Value above maximum ({max_value})")
        
        return int_value
    
    @classmethod
    def validate_float(cls, value: Any, min_value: Optional[float] = None,
                      max_value: Optional[float] = None) -> float:
        """Validate float input."""
        try:
            float_value = float(value)
        except (ValueError, TypeError):
            raise ValidationError(f"Expected float, got {type(value).__name__}")
        
        # Check for NaN and Infinity
        if float_value != float_value or float_value == float('inf') or float_value == float('-inf'):
            raise ValidationError("Invalid float value")
        
        if min_value is not None and float_value < min_value:
            raise ValidationError(f"Value below minimum ({min_value})")
        
        if max_value is not None and float_value > max_value:
            raise ValidationError(f"Value above maximum ({max_value})")
        
        return float_value
    
    @classmethod
    def validate_uuid(cls, value: str) -> str:
        """Validate UUID format."""
        uuid_pattern = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
        if not re.match(uuid_pattern, value.lower()):
            raise ValidationError("Invalid UUID format")
        return value
    
    @classmethod
    def validate_url(cls, value: str, allowed_schemes: List[str] = None) -> str:
        """Validate URL format."""
        if allowed_schemes is None:
            allowed_schemes = ["http", "https", "s3"]
        
        url_pattern = r"^([a-zA-Z][a-zA-Z0-9+\-.]*):://[^\s/$.?#].[^\s]*$"
        if not re.match(url_pattern, value):
            raise ValidationError("Invalid URL format")
        
        scheme = value.split("://")[0].lower()
        if scheme not in allowed_schemes:
            raise ValidationError(f"URL scheme not allowed (allowed: {', '.join(allowed_schemes)})")
        
        return value
    
    @classmethod
    def validate_enum(cls, value: Any, enum_class) -> Any:
        """Validate enum value."""
        if isinstance(value, enum_class):
            return value
        
        try:
            return enum_class(value)
        except (ValueError, KeyError):
            valid_values = [e.value for e in enum_class]
            raise ValidationError(f"Invalid enum value. Allowed: {valid_values}")
    
    @classmethod
    def validate_json_depth(cls, obj: Any, max_depth: int = 10, current_depth: int = 0) -> bool:
        """Validate JSON object depth (prevent nested bomb attacks)."""
        if current_depth > max_depth:
            raise ValidationError(f"JSON nesting too deep (maximum depth: {max_depth})")
        
        if isinstance(obj, dict):
            for value in obj.values():
                cls.validate_json_depth(value, max_depth, current_depth + 1)
        elif isinstance(obj, list):
            for item in obj:
                cls.validate_json_depth(item, max_depth, current_depth + 1)
        
        return True
    
    @classmethod
    def sanitize_sql_string(cls, value: str) -> str:
        """Basic SQL string sanitization (use parameterized queries instead)."""
        return value.replace("'", "''")
    
    @classmethod
    def sanitize_html(cls, value: str) -> str:
        """Basic HTML sanitization."""
        # Simple approach - remove dangerous tags
        dangerous_tags = ["<script", "<iframe", "<object", "<embed", "onclick", "onerror", "onload"]
        result = value
        for tag in dangerous_tags:
            result = re.sub(tag, "", result, flags=re.IGNORECASE)
        return result
