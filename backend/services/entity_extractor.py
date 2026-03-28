"""Entity extraction service built on top of NLPProcessor."""

from __future__ import annotations

from typing import Any

from services.nlp_processor import NLPProcessor
from utils.entity_resolution import canonicalize_entity_name


ENTITY_TYPE_MAP = {
    "GPE": "GPE",
    "LOC": "LOCATION",
    "ORG": "ORG",
    "PERSON": "PERSON",
    "NORP": "ACTOR",
    "EVENT": "EVENT",
    "PROPN": "CONCEPT",
    "MONEY": "ECONOMIC",
    "PERCENT": "ECONOMIC",
    "QUANTITY": "ECONOMIC",
    "FAC": "LOCATION",
}

# Tactical Category Keywords
TACTICAL_MAP = {
    "MILITARY": ["military", "army", "navy", "air force", "defense", "weapon", "missile", "troop", "soldier", "pentagon", "nato", "war", "combat"],
    "CYBER": ["cyber", "hacker", "software", "malware", "firewall", "encryption", "digital", "internet", "coding", "database", "ai", "llm"],
    "CLIMATE": ["climate", "environment", "warming", "carbon", "emission", "greenhouse", "ecology", "biodiversity", "renewable", "flood", "drought"],
    "ECONOMIC": ["economic", "trade", "finance", "market", "gdp", "inflation", "currency", "bank", "tariff", "export", "import", "investment"],
    "POLICY": ["policy", "legislation", "regulation", "law", "government", "parliament", "treaty", "decree", "sanction", "bilateral"],
    "SOCIAL": ["social", "humanitarian", "migration", "protest", "rights", "equity", "education", "health", "poverty", "culture", "population"],
    "GEOPOLITICAL": ["geopolitical", "strategic", "alliance", "sovereignty", "territory", "border", "diplomatic", "embassy", "bilateral", "summit"],
}


class EntityExtractionService:
    def __init__(self, processor: NLPProcessor | None = None):
        self.processor = processor or NLPProcessor()

    def _refine_type(self, text: str, current_type: str) -> str:
        text_lower = text.lower()
        for tactical_type, keywords in TACTICAL_MAP.items():
            if any(kw in text_lower for kw in keywords):
                return tactical_type
        return current_type

    def extract(self, text: str) -> list[dict[str, Any]]:
        parsed = self.processor.parse_text(text)
        entities = []

        for item in parsed.get("entities", []):
            raw_label = item.get("label", "CONCEPT")
            base_type = ENTITY_TYPE_MAP.get(raw_label, "CONCEPT")
            entity_text = item.get("text", "")
            
            # Refine type based on context/keywords for tactical intelligence
            entity_type = self._refine_type(entity_text, base_type)
            
            confidence = float(item.get("confidence", 0.5))

            entities.append(
                {
                    "name": canonicalize_entity_name(entity_text, entity_type),
                    "entity_type": entity_type,
                    "confidence_score": round(confidence, 4),
                    "mention_count": 1,
                    "link_key": self._entity_link_key(entity_text, entity_type),
                }
            )

        return [e for e in entities if e["name"]]

    def extract_triplets(self, text: str) -> list[dict[str, Any]]:
        """Create simple subject-predicate-object triplets from extracted entities."""
        entities = self.extract(text)
        triplets: list[dict[str, Any]] = []

        if len(entities) < 2:
            return triplets

        for idx in range(len(entities) - 1):
            subject = entities[idx]
            obj = entities[idx + 1]
            triplets.append(
                {
                    "subject": subject["name"],
                    "subject_link": subject["link_key"],
                    "predicate": "RELATED_TO",
                    "object": obj["name"],
                    "object_link": obj["link_key"],
                    "confidence": round(min(subject["confidence_score"], obj["confidence_score"]), 4),
                }
            )

        return triplets

    @staticmethod
    def _entity_link_key(name: str, entity_type: str) -> str:
        norm = canonicalize_entity_name(name, entity_type).lower()
        return f"{entity_type}:{norm}"
