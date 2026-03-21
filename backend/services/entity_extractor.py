"""Entity extraction service built on top of NLPProcessor."""

from __future__ import annotations

from typing import Any

from services.nlp_processor import NLPProcessor


ENTITY_TYPE_MAP = {
    "GPE": "COUNTRY",
    "LOC": "LOCATION",
    "ORG": "ORG",
    "PERSON": "PERSON",
    "NORP": "ACTOR",
    "EVENT": "EVENT",
    "PROPN": "CONCEPT",
}


class EntityExtractionService:
    def __init__(self, processor: NLPProcessor | None = None):
        self.processor = processor or NLPProcessor()

    def extract(self, text: str) -> list[dict[str, Any]]:
        parsed = self.processor.parse_text(text)
        entities = []

        for item in parsed.get("entities", []):
            raw_label = item.get("label", "CONCEPT")
            entity_type = ENTITY_TYPE_MAP.get(raw_label, "CONCEPT")
            confidence = float(item.get("confidence", 0.5))

            entities.append(
                {
                    "name": item.get("text", "").strip(),
                    "entity_type": entity_type,
                    "confidence_score": round(confidence, 4),
                    "mention_count": 1,
                    "link_key": self._entity_link_key(item.get("text", ""), entity_type),
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
        norm = " ".join(name.lower().split())
        return f"{entity_type}:{norm}"
