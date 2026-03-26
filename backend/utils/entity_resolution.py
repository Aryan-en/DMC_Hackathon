"""Entity resolution and canonical naming helpers."""

from __future__ import annotations

import logging
import re
from typing import Dict

logger = logging.getLogger(__name__)

COUNTRY_ALIASES: Dict[str, str] = {
    "bharat": "India",
    "republic of india": "India",
    "the republic of india": "India",
    "india official": "India",
    "ind": "India",
    "usa": "United States",
    "u s a": "United States",
    "u s": "United States",
    "united states of america": "United States",
    "united states": "United States",
    "unitedstates": "United States",
    "the us": "United States",
    "the usa": "United States",
    "us": "United States",
    "uk": "United Kingdom",
    "u k": "United Kingdom",
    "britain": "United Kingdom",
    "great britain": "United Kingdom",
    "russian federation": "Russia",
    "the russian federation": "Russia",
    "ru": "Russia",
    "peoples republic of china": "China",
    "prc": "China",
    "mainland china": "China",
    "uae": "United Arab Emirates",
    "the united arab emirates": "United Arab Emirates",
    "the bahamas": "Bahamas",
    "republic of korea": "South Korea",
    "democrats peoples republic of korea": "North Korea",
    "dprk": "North Korea",
    "viet nam": "Vietnam",
    "eu": "European Union",
}


def _normalize_lookup_key(name: str) -> str:
    cleaned = re.sub(r"[^\w\s]", " ", (name or "").lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    cleaned = re.sub(r"^the\s+", "", cleaned)
    return cleaned


def _title_case(name: str) -> str:
    return " ".join(part.capitalize() for part in name.split())


def canonicalize_entity_name(name: str, entity_type: str | None = None) -> str:
    """Collapse common aliases like 'US', 'USA', and 'The US' to one canonical label."""
    if not name:
        return ""

    clean_name = " ".join(name.strip().split())
    lookup = _normalize_lookup_key(clean_name)
    compact = lookup.replace(" ", "")

    if lookup in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[lookup]
    if compact in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[compact]

    if entity_type and entity_type.upper() in {"COUNTRY", "ACTOR", "LOCATION", "GPE"}:
        return _title_case(lookup) if lookup else clean_name

    return clean_name


def normalize_country_name(name: str) -> str:
    """Normalize a country name to its canonical version."""
    return canonicalize_entity_name(name, "COUNTRY")


def resolve_entity(data: Dict, entity_type: str = "country") -> Dict:
    resolved = data.copy()
    name_key = "country_name" if "country_name" in resolved else "country" if "country" in resolved else "name"
    if name_key in resolved:
        original = resolved[name_key]
        resolved[name_key] = canonicalize_entity_name(original, entity_type)
        if original != resolved[name_key]:
            logger.debug("Resolved entity: '%s' -> '%s'", original, resolved[name_key])
    return resolved


def merge_entities(primary: Dict, secondary: Dict) -> Dict:
    merged = primary.copy()
    merged.update(secondary)
    return merged
