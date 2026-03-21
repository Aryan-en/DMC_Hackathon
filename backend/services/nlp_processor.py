"""NLP processor service for entity recognition and dependency parsing."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from config import settings

try:
    import spacy  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    spacy = None


@dataclass
class ParsedEntity:
    text: str
    label: str
    start_char: int
    end_char: int
    confidence: float


class NLPProcessor:
    """Wrapper over spaCy with graceful fallback when models are unavailable."""

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.SPACY_MODEL
        self._nlp = None
        self._load_model()

    def _load_model(self) -> None:
        if spacy is None:
            self._nlp = None
            return

        try:
            self._nlp = spacy.load(self.model_name)
        except Exception:
            # Fallback to a blank English pipeline when model isn't installed.
            self._nlp = spacy.blank("en")

    @property
    def model_loaded(self) -> bool:
        return self._nlp is not None

    def parse_text(self, text: str) -> dict[str, Any]:
        if not text:
            return {"tokens": [], "dependencies": [], "entities": []}

        if self._nlp is None:
            return {
                "tokens": text.split(),
                "dependencies": [],
                "entities": self._fallback_entities(text),
            }

        doc = self._nlp(text)
        dependencies = []
        if "parser" in self._nlp.pipe_names:
            dependencies = [
                {
                    "token": token.text,
                    "dep": token.dep_,
                    "head": token.head.text,
                }
                for token in doc
            ]

        entities = []
        if "ner" in self._nlp.pipe_names:
            entities = [
                {
                    "text": ent.text,
                    "label": ent.label_,
                    "start_char": ent.start_char,
                    "end_char": ent.end_char,
                    "confidence": 0.9,
                }
                for ent in doc.ents
            ]
        else:
            entities = self._fallback_entities(text)

        return {
            "tokens": [token.text for token in doc],
            "dependencies": dependencies,
            "entities": entities,
        }

    def _fallback_entities(self, text: str) -> list[dict[str, Any]]:
        # Simple deterministic fallback using capitalized multiword spans.
        entities = []
        for match in re.finditer(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b", text):
            entities.append(
                {
                    "text": match.group(1),
                    "label": "PROPN",
                    "start_char": match.start(),
                    "end_char": match.end(),
                    "confidence": 0.6,
                }
            )
        return entities
