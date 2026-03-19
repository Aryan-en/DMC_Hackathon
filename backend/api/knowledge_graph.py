"""Knowledge Graph API Endpoints"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/nodes")
async def get_nodes():
    """GET /api/knowledge-graph/nodes - Node types and counts"""
    return {
        "status": "success",
        "data": {
            "node_types": [
                {"type": "Country", "count": 216, "color": "#00d4ff"},
                {"type": "Policy", "count": 1204, "color": "#8b5cf6"},
                {"type": "Event", "count": 5621, "color": "#ef4444"},
                {"type": "Sector", "count": 342, "color": "#f59e0b"},
                {"type": "Actor", "count": 3892, "color": "#00ff88"},
                {"type": "Concept", "count": 9841, "color": "#64748b"},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/relationships")
async def get_relationships():
    """GET /api/knowledge-graph/relationships - Relationship types"""
    return {
        "status": "success",
        "data": {
            "relationships": [
                {"source": "Iran", "target": "Oil Supply Chain", "relation": "CONTROLS", "strength": 94},
                {"source": "NATO", "target": "European Defense", "relation": "GOVERNS", "strength": 88},
                {"source": "Fed Policy", "target": "USD Index", "relation": "INFLUENCES", "strength": 97},
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }


@router.get("/paths/{source}/{target}")
async def get_paths(source: str, target: str):
    """GET /api/knowledge-graph/paths/{source}/{target} - Causal paths"""
    return {
        "status": "success",
        "data": {
            "paths": [
                {
                    "chain": ["Russia", "Energy Export", "EU Dependency", "Industrial Output"],
                    "strength": 92
                }
            ]
        },
        "meta": {"timestamp": datetime.utcnow().isoformat()}
    }
