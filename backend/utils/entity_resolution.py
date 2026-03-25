"""Entity Resolution and Deduplication logic for global intelligence entities."""

import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Primary canonical mapping for common country variations
COUNTRY_ALIASES: Dict[str, str] = {
    # India variations
    "bharat": "India",
    "republic of india": "India",
    "the republic of india": "India",
    "india (official)": "India",
    "ind": "India",
    
    # USA variations
    "usa": "United States",
    "u.s.a.": "United States",
    "united states of america": "United States",
    "u.s.": "United States",
    "usb": "United States",
    "us": "United States",
    
    # UK variations
    "uk": "United Kingdom",
    "u.k.": "United Kingdom",
    "britain": "United Kingdom",
    "great britain": "United Kingdom",
    
    # Russia variations
    "russian federation": "Russia",
    "the russian federation": "Russia",
    "ru": "Russia",
    
    # China variations
    "peoples republic of china": "China",
    "prc": "China",
    "mainland china": "China",
    
    # UAE variations
    "uae": "United Arab Emirates",
    "the united arab emirates": "United Arab Emirates",
    
    # Generic normalization candidates
    "the bahamas": "Bahamas",
    "republic of korea": "South Korea",
    "democrats peoples republic of korea": "North Korea",
    "dprk": "North Korea",
    "viet nam": "Vietnam"
}


def normalize_country_name(name: str) -> str:
    """Normalize a country name to its canonical version."""
    if not name:
        return ""
    
    # Standardize whitespace and casing
    clean_name = " ".join(name.lower().split())
    
    # Check direct alias
    if clean_name in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[clean_name]
    
    # Partial match logic (e.g., if a name contains a canonical version)
    # Be careful with short names like 'Mali'
    # Simplified for now: just return title case if no alias
    return name.strip().title()


def resolve_entity(data: Dict, entity_type: str = "country") -> Dict:
    """
    Apply entity resolution rules to a record before database insertion.
    
    Args:
        data: The entity record (dictionary)
        entity_type: Category (default: 'country')
        
    Returns:
        The record with normalized fields.
    """
    resolved = data.copy()
    
    if entity_type == "country":
        name_key = "country_name" if "country_name" in resolved else "country" if "country" in resolved else "name"
        if name_key in resolved:
            original = resolved[name_key]
            resolved[name_key] = normalize_country_name(original)
            if original != resolved[name_key]:
                logger.debug(f"Resolved entity: '{original}' -> '{resolved[name_key]}'")
                
    return resolved


def merge_entities(primary: Dict, secondary: Dict) -> Dict:
    """Combine data from two sources for the same resolved entity."""
    # Logic to prioritize source or merge attributes
    # Example: If both have 'gdp', average them or take the most recent
    merged = primary.copy()
    merged.update(secondary)
    return merged
