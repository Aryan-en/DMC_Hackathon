"""Geospatial API Endpoints"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/hotspots")
async def get_hotspots():
    """GET /api/geospatial/hotspots - Global conflict hotspots"""
    return {
        "status": "success",
        "data": {
            "hotspots": [
                {"name": "Strait of Hormuz", "lat": 26.5, "lng": 56.2, "type": "Military", "severity": "critical", "value": 94},
                {"name": "Taiwan Strait", "lat": 24.0, "lng": 120.5, "type": "Geopolitical", "severity": "critical", "value": 91},
                {"name": "Ukraine-Russia Border", "lat": 49.5, "lng": 36.0, "type": "Conflict", "severity": "critical", "value": 96},
                {"name": "Sahel Region", "lat": 14.0, "lng": 2.0, "type": "Climate", "severity": "critical", "value": 88},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/climate-indicators")
async def get_climate_indicators():
    """GET /api/geospatial/climate-indicators - Regional climate data"""
    return {
        "status": "success",
        "data": {
            "regions": [
                {"region": "Sub-Saharan Africa", "temp": "+2.4°C", "drought": "CRITICAL", "flood": "MODERATE", "cropRisk": 84},
                {"region": "Southeast Asia", "temp": "+1.9°C", "drought": "HIGH", "flood": "HIGH", "cropRisk": 71},
                {"region": "Middle East", "temp": "+3.1°C", "drought": "CRITICAL", "flood": "LOW", "cropRisk": 91},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/incidents/{region}")
async def get_incidents(region: str):
    """GET /api/geospatial/incidents/{region} - Regional incidents"""
    return {
        "status": "success",
        "data": {
            "incidents": [
                {"name": "Incident 1", "lat": 25.0, "lng": 55.0, "type": "Military", "date": "2026-03-15"},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }
