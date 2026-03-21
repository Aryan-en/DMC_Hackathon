"""Input sanitization helpers for API parameters."""

import re

_ALLOWED_IDENTIFIER = re.compile(r"[^a-zA-Z0-9 _\-/:.]")


def sanitize_identifier(value: str, *, max_len: int = 128) -> str:
    """Return a safe identifier-like string for downstream queries and logs."""
    cleaned = _ALLOWED_IDENTIFIER.sub("", value or "")
    cleaned = cleaned.strip()
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len]
    return cleaned
