"""Neo4j incremental sync endpoints wrapper."""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/neo4j", tags=["Neo4j"])

try:
    import neo4j_sync as neo4j_sync_module
except Exception:
    neo4j_sync_module = None


@router.get("/sync")
async def neo4j_sync_endpoint(limit_entities: int = 1000, limit_relationships: int = 1000):
    """Trigger incremental sync from Postgres to Neo4j (basic implementation)."""
    if neo4j_sync_module is None:
        raise HTTPException(status_code=503, detail="Neo4j sync module not loaded")
    try:
        result = await neo4j_sync_module.incremental_sync(limit_entities=limit_entities, limit_relationships=limit_relationships)
        return {"status": "started", "result": result}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
