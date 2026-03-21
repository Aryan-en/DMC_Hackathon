"""LLM-backed text classification and sentiment refinement service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests

from config import settings


@dataclass
class ClassificationResult:
    label: str
    confidence: float
    model: str
    reasoning: str


class LLMClassifierService:
    def __init__(self, model: str | None = None):
        self.model = model or settings.OLLAMA_MODEL
        self.ollama_url = f"{settings.OLLAMA_HOST.rstrip('/')}/api/generate"
        self.ollama_tags_url = f"{settings.OLLAMA_HOST.rstrip('/')}/api/tags"

    def classify(self, text: str) -> ClassificationResult:
        prompt = (
            "Classify the text into one label among: GEOPOLITICAL, ECONOMIC, CLIMATE, SECURITY, SOCIAL, OTHER. "
            "Return strict JSON with keys label, confidence, reasoning. Text: "
            f"{text[:3000]}"
        )

        try:
            response = requests.post(
                self.ollama_url,
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=settings.OLLAMA_TIMEOUT_SEC,
            )
            response.raise_for_status()
            payload = response.json()
            content = (payload.get("response") or "").strip()
            parsed = self._safe_parse_json_like(content)

            label = str(parsed.get("label") or "OTHER").upper()
            confidence = float(parsed.get("confidence") or 0.5)
            reasoning = str(parsed.get("reasoning") or "")
            return ClassificationResult(
                label=label,
                confidence=max(0.0, min(confidence, 1.0)),
                model=self.model,
                reasoning=reasoning,
            )
        except Exception:
            return self._heuristic_classify(text)

    def model_status(self) -> dict[str, Any]:
        try:
            response = requests.get(self.ollama_tags_url, timeout=8)
            response.raise_for_status()
            payload = response.json()
            models = payload.get("models", []) if isinstance(payload, dict) else []
            names = [str(model.get("name", "")) for model in models if isinstance(model, dict)]
            has_model = any(name == self.model or name.startswith(f"{self.model}:") for name in names)
            return {
                "host": settings.OLLAMA_HOST,
                "model": self.model,
                "reachable": True,
                "model_available": has_model,
                "installed_models": names,
            }
        except Exception as exc:
            return {
                "host": settings.OLLAMA_HOST,
                "model": self.model,
                "reachable": False,
                "model_available": False,
                "installed_models": [],
                "error": str(exc),
            }

    def sentiment(self, text: str) -> dict[str, Any]:
        lower = (text or "").lower()
        positive_words = ["cooperation", "growth", "agreement", "stability", "peace"]
        negative_words = ["conflict", "sanction", "crisis", "attack", "war", "threat"]

        pos = sum(word in lower for word in positive_words)
        neg = sum(word in lower for word in negative_words)
        score = (pos - neg) / max(1, (pos + neg))

        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        else:
            label = "neutral"

        return {
            "label": label,
            "score": round(score, 4),
            "method": "lexicon_refined",
        }

    def _heuristic_classify(self, text: str) -> ClassificationResult:
        lower = (text or "").lower()
        keyword_map = {
            "GEOPOLITICAL": ["border", "diplom", "treaty", "ministry", "foreign"],
            "ECONOMIC": ["gdp", "inflation", "trade", "investment", "econom"],
            "CLIMATE": ["climate", "drought", "flood", "temperature", "crop"],
            "SECURITY": ["threat", "attack", "military", "terror", "defense"],
            "SOCIAL": ["migration", "protest", "population", "labor", "society"],
        }

        best_label = "OTHER"
        best_score = 0
        for label, words in keyword_map.items():
            score = sum(word in lower for word in words)
            if score > best_score:
                best_label = label
                best_score = score

        confidence = min(0.95, 0.45 + (best_score * 0.1)) if best_score else 0.4
        return ClassificationResult(
            label=best_label,
            confidence=confidence,
            model="heuristic",
            reasoning="Keyword-based fallback classifier",
        )

    @staticmethod
    def _safe_parse_json_like(content: str) -> dict[str, Any]:
        import json

        content = content.strip()
        if content.startswith("```"):
            content = content.strip("`")
            if content.startswith("json"):
                content = content[4:].strip()

        try:
            obj = json.loads(content)
            return obj if isinstance(obj, dict) else {}
        except Exception:
            return {}
