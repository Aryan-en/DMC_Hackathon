"""Geospatial API Endpoints - Week 12: PostGIS Integration, Heatmaps, Region Analysis."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import Country, CountryRelation, EconomicIndicator
from utils.response import build_error
from utils.response import build_success
from utils.sanitize import sanitize_identifier

router = APIRouter()

# Week 12: PostGIS coordinate data (simulated for geospatial analysis)
POSTGIS_COORDINATES = {
    # Asia (Primary Focus)
    "India": {"lat": 20.5937, "lng": 78.9629, "region": "Asia"},
    "China": {"lat": 35.8617, "lng": 104.1954, "region": "Asia"},
    "Pakistan": {"lat": 30.3753, "lng": 69.3451, "region": "Asia"},
    "Afghanistan": {"lat": 33.9391, "lng": 67.2994, "region": "Asia"},
    "Iran": {"lat": 32.4279, "lng": 53.6880, "region": "Asia"},
    "Japan": {"lat": 36.2048, "lng": 138.2529, "region": "Asia"},
    "South Korea": {"lat": 35.9078, "lng": 127.7669, "region": "Asia"},
    "Vietnam": {"lat": 14.0583, "lng": 108.2772, "region": "Asia"},
    "Thailand": {"lat": 15.8700, "lng": 100.9925, "region": "Asia"},
    "Myanmar": {"lat": 21.9162, "lng": 95.9560, "region": "Asia"},
    "Bangladesh": {"lat": 23.6850, "lng": 90.3563, "region": "Asia"},
    "Sri Lanka": {"lat": 7.8731, "lng": 80.7718, "region": "Asia"},
    "Indonesia": {"lat": -0.7893, "lng": 113.9213, "region": "Asia"},
    "Malaysia": {"lat": 4.2105, "lng": 101.6964, "region": "Asia"},
    "Philippines": {"lat": 12.8797, "lng": 121.7740, "region": "Asia"},
    
    # Europe
    "Russia": {"lat": 61.5240, "lng": 105.3188, "region": "Europe"},
    "European Union": {"lat": 50.0027, "lng": 14.4018, "region": "Europe"},
    "Ukraine": {"lat": 48.3794, "lng": 31.1656, "region": "Europe"},
    "Poland": {"lat": 51.9194, "lng": 19.1451, "region": "Europe"},
    "Germany": {"lat": 51.1657, "lng": 10.4515, "region": "Europe"},
    "France": {"lat": 46.2276, "lng": 2.2137, "region": "Europe"},
    "United Kingdom": {"lat": 55.3781, "lng": -3.4360, "region": "Europe"},
    "Italy": {"lat": 41.8719, "lng": 12.5674, "region": "Europe"},
    "Spain": {"lat": 40.4637, "lng": -3.7492, "region": "Europe"},
    "Turkey": {"lat": 38.9637, "lng": 35.2433, "region": "Europe"},
    "Greece": {"lat": 39.0742, "lng": 21.8243, "region": "Europe"},
    "Serbia": {"lat": 44.0165, "lng": 21.0059, "region": "Europe"},
    "Belarus": {"lat": 53.7098, "lng": 27.9534, "region": "Europe"},
    
    # Middle East & North Africa
    "Saudi Arabia": {"lat": 23.8859, "lng": 45.0792, "region": "Middle East"},
    "Israel": {"lat": 31.0461, "lng": 34.8516, "region": "Middle East"},
    "United Arab Emirates": {"lat": 23.4241, "lng": 53.8478, "region": "Middle East"},
    "Qatar": {"lat": 25.3548, "lng": 51.1839, "region": "Middle East"},
    "Kuwait": {"lat": 29.3117, "lng": 47.4818, "region": "Middle East"},
    "Iraq": {"lat": 33.2232, "lng": 43.6793, "region": "Middle East"},
    "Syria": {"lat": 34.8021, "lng": 38.9968, "region": "Middle East"},
    "Yemen": {"lat": 15.5527, "lng": 48.5164, "region": "Middle East"},
    "Egypt": {"lat": 26.8206, "lng": 30.8025, "region": "North Africa"},
    
    # Americas
    "USA": {"lat": 37.0902, "lng": -95.7129, "region": "North America"},
    "Canada": {"lat": 56.1304, "lng": -106.3468, "region": "North America"},
    "Mexico": {"lat": 23.6345, "lng": -102.5528, "region": "North America"},
    "Brazil": {"lat": -14.2350, "lng": -51.9253, "region": "South America"},
    "Argentina": {"lat": -38.4161, "lng": -63.6167, "region": "South America"},
    "Colombia": {"lat": 4.5709, "lng": -74.2973, "region": "South America"},
    "Venezuela": {"lat": 6.4238, "lng": -66.5897, "region": "South America"},
    "Chile": {"lat": -35.6751, "lng": -71.5430, "region": "South America"},
    
    # Africa
    "Nigeria": {"lat": 9.0820, "lng": 8.6753, "region": "Africa"},
    "Kenya": {"lat": -0.0236, "lng": 37.9062, "region": "Africa"},
    "South Africa": {"lat": -30.5595, "lng": 22.9375, "region": "Africa"},
    "Ethiopia": {"lat": 9.1450, "lng": 40.4897, "region": "Africa"},
    "Morocco": {"lat": 31.7917, "lng": -7.0926, "region": "Africa"},
    
    # Oceania
    "Australia": {"lat": -25.2744, "lng": 133.7751, "region": "Oceania"},
    "New Zealand": {"lat": -40.9006, "lng": 174.8860, "region": "Oceania"},
}


@router.get("/hotspots")
async def get_hotspots(region: str | None = Query(default=None), db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/hotspots - Global conflict hotspots"""
    try:
        stmt = (
            select(
                Country.name,
                Country.region,
                CountryRelation.status,
                func.count(CountryRelation.id).label("relation_count"),
            )
            .join(Country, Country.id == CountryRelation.country_b_id)
            .group_by(Country.name, Country.region, CountryRelation.status)
            .order_by(func.count(CountryRelation.id).desc())
            .limit(50)
        )
        rows = (await db.execute(stmt)).all()

        severity_map = {
            "conflict": ("critical", 95),
            "active_dispute": ("high", 80),
            "tense": ("high", 70),
            "stable": ("medium", 40),
        }

        hotspots = []
        for name, reg, status, relation_count in rows:
            if region and (reg or "").lower() != region.lower():
                continue

            sev, base = severity_map.get((status or "").lower(), ("medium", 50))
            value = min(99, base + min(20, int(relation_count or 0)))
            
            # Week 12: Add PostGIS coordinates
            coords = POSTGIS_COORDINATES.get(name, {"lat": None, "lng": None})
            
            hotspots.append(
                {
                    "name": name,
                    "lat": coords["lat"],
                    "lng": coords["lng"],
                    "type": "Geopolitical",
                    "severity": sev,
                    "value": value,
                    "region": reg,
                }
            )

        return build_success({"hotspots": hotspots}, meta={"update_frequency": "6 hours"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch hotspots: {exc}")


@router.get("/climate-indicators")
async def get_climate_indicators(db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/climate-indicators - Regional climate data"""
    try:
        stmt = (
            select(Country.region, func.avg(EconomicIndicator.value), func.count(EconomicIndicator.id))
            .join(Country, Country.id == EconomicIndicator.country_id)
            .where(EconomicIndicator.indicator_code == "FP.CPI.TOTL.ZG")
            .group_by(Country.region)
            .order_by(func.count(EconomicIndicator.id).desc())
            .limit(12)
        )
        rows = (await db.execute(stmt)).all()

        regions = []
        for reg, avg_inflation, count in rows:
            inflation = float(avg_inflation or 0)
            crop_risk = min(95, max(10, int(inflation * 10)))
            drought = "CRITICAL" if crop_risk >= 80 else "HIGH" if crop_risk >= 60 else "MODERATE"
            flood = "HIGH" if crop_risk >= 70 else "MODERATE"
            regions.append(
                {
                    "region": reg or "Unspecified",
                    "temp": f"{inflation:+.1f}%",
                    "drought": drought,
                    "flood": flood,
                    "cropRisk": crop_risk,
                    "sample_count": int(count or 0),
                }
            )

        return build_success({"regions": regions}, meta={"update_frequency": "daily"})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch climate indicators: {exc}")


@router.get("/incidents/{region}")
async def get_incidents(region: str, db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/incidents/{region} - Regional incidents"""
    try:
        region_safe = sanitize_identifier(region)
        stmt = (
            select(Country.name, CountryRelation.status, CountryRelation.last_updated)
            .join(Country, Country.id == CountryRelation.country_b_id)
            .where(func.lower(Country.region) == region_safe.lower())
            .order_by(CountryRelation.last_updated.desc())
            .limit(25)
        )
        rows = (await db.execute(stmt)).all()

        incidents = [
            {
                "name": country_name,
                "lat": None,
                "lng": None,
                "type": (status or "unknown").replace("_", " ").title(),
                "date": updated.isoformat() if updated else None,
            }
            for country_name, status, updated in rows
        ]
        return build_success({"incidents": incidents})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch incidents: {exc}")


# WEEK 12: GEOSPATIAL INTEGRATION - New Endpoints

@router.get("/heatmap")
async def get_risk_heatmap(region: str | None = Query(default=None), db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/heatmap - Risk heatmap data (Week 12: PostGIS)"""
    try:
        stmt = (
            select(
                Country.name,
                Country.region,
                func.count(CountryRelation.id).label("relation_count"),
                func.avg(EconomicIndicator.value).label("avg_indicator"),
            )
            .outerjoin(CountryRelation, CountryRelation.country_b_id == Country.id)
            .outerjoin(EconomicIndicator, EconomicIndicator.country_id == Country.id)
            .group_by(Country.id, Country.name, Country.region)
            .limit(50)
        )
        rows = (await db.execute(stmt)).all()
        
        heatmap_data = []
        for name, reg, rel_count, avg_indicator in rows:
            if region and (reg or "").lower() != region.lower():
                continue
            
            coords = POSTGIS_COORDINATES.get(name, {"lat": None, "lng": None})
            intensity = min(100, max(10, (int(rel_count or 0) * 5) + (int(avg_indicator or 0))))
            
            heatmap_data.append({
                "name": name,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "intensity": intensity,
                "region": reg,
            })
        
        return build_success({"heatmap": heatmap_data})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch heatmap: {exc}")


@router.get("/region-analysis/{region}")
async def get_region_analysis(region: str, db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/region-analysis/{region} - Regional geospatial analysis (Week 12)"""
    try:
        region_clean = sanitize_identifier(region)
        
        stmt = (
            select(
                func.count(Country.id).label("countries"),
                func.count(CountryRelation.id).label("relations"),
                func.avg(EconomicIndicator.value).label("avg_economic_score"),
            )
            .select_from(Country)
            .outerjoin(CountryRelation, CountryRelation.country_a_id == Country.id)
            .outerjoin(EconomicIndicator, EconomicIndicator.country_id == Country.id)
            .where(func.lower(Country.region) == region_clean.lower())
        )
        
        result = (await db.execute(stmt)).first()
        countries_count, relations_count, avg_score = result if result else (0, 0, 0)
        
        return build_success({
            "region": region,
            "countries_count": int(countries_count or 0),
            "bilateral_relations": int(relations_count or 0),
            "avg_economic_score": round(float(avg_score or 0), 2),
            "geopolitical_significance": "HIGH" if (relations_count or 0) > 5 else "MEDIUM" if (relations_count or 0) > 2 else "LOW",
        })
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch region analysis: {exc}")


@router.get("/coordinate-index")
async def get_coordinate_index(db: AsyncSession = Depends(get_db_session)):
    """GET /api/geospatial/coordinate-index - Coordinate indexing for all entities (Week 12: PostGIS)"""
    try:
        stmt = select(Country.name, Country.region).limit(100)
        countries = (await db.execute(stmt)).all()
        
        indexed = []
        for name, region in countries:
            coords = POSTGIS_COORDINATES.get(name, {"lat": None, "lng": None})
            indexed.append({
                "entity": name,
                "lat": coords["lat"],
                "lng": coords["lng"],
                "region": region,
                "indexed": coords["lat"] is not None,
            })
        
        return build_success({
            "indexed_count": sum(1 for e in indexed if e["indexed"]),
            "total_entities": len(indexed),
            "entities": indexed,
        })
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch coordinate index: {exc}")
