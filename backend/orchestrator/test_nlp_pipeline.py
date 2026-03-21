"""Phase-1 NLP pipeline validation checks."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.entity_extractor import EntityExtractionService
from services.nlp_processor import NLPProcessor


def run_checks() -> dict:
    text = "India held talks with the United States in New Delhi on energy security."

    processor = NLPProcessor()
    parsed = processor.parse_text(text)
    extractor = EntityExtractionService(processor)
    entities = extractor.extract(text)

    return {
        "model_loaded": processor.model_loaded,
        "token_count": len(parsed.get("tokens", [])),
        "dependency_count": len(parsed.get("dependencies", [])),
        "entity_count": len(entities),
        "entities": entities[:5],
    }


if __name__ == "__main__":
    print(run_checks())
