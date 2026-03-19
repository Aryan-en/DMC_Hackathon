"""Intelligence API Endpoints"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/entity-extraction")
async def get_entity_extraction():
    """GET /api/intelligence/entity-extraction - Last 24h extractions"""
    return {
        "status": "success",
        "data": {
            "entities": [
                {"entity": "United States Federal Reserve", "type": "ORG", "confidence": 0.97, "mentions": 1847},
                {"entity": "Xi Jinping", "type": "PERSON", "confidence": 0.99, "mentions": 3241},
                {"entity": "Taiwan Strait", "type": "LOC", "confidence": 0.98, "mentions": 2108},
                {"entity": "NATO", "type": "ORG", "confidence": 0.98, "mentions": 4512},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/language-distribution")
async def get_language_distribution():
    """GET /api/intelligence/language-distribution"""
    return {
        "status": "success",
        "data": {
            "languages": [
                {"lang": "English", "doc_count": 42, "percentage": 52.5},
                {"lang": "Arabic", "doc_count": 18, "percentage": 22.5},
                {"lang": "Chinese", "doc_count": 15, "percentage": 18.75},
                {"lang": "Russian", "doc_count": 9, "percentage": 11.25},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/trending-keywords")
async def get_trending_keywords():
    """GET /api/intelligence/trending-keywords"""
    return {
        "status": "success",
        "data": {
            "keywords": [
                {"keyword": "semiconductor shortage", "velocity": 94, "delta": "+47%", "type": "ECON"},
                {"keyword": "Taiwan independence", "velocity": 88, "delta": "+31%", "type": "GEOPOL"},
                {"keyword": "AI governance", "velocity": 71, "delta": "+68%", "type": "TECH"},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }
