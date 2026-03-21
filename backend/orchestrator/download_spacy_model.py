"""Download spaCy model used by Phase-1 NLP pipeline."""

from config import settings


def main() -> int:
    try:
        import spacy  # type: ignore
        from spacy.cli import download  # type: ignore
    except Exception as exc:
        print(f"spaCy not installed: {exc}")
        return 1

    model = settings.SPACY_MODEL
    download(model)
    print(f"Downloaded spaCy model: {model}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
