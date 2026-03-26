"""Basic Neo4j-backed traversal API"""

from fastapi import APIRouter, HTTPException
from neo4j.exceptions import ServiceUnavailable
from db.neo4j_driver import get_driver
from utils.response import build_error, build_success

router = APIRouter(prefix="/neo4j", tags=["Neo4j Traversal"])


@router.get("/traverse")
async def traverse(start_name: str, end_name: str, depth: int = 3, limit: int = 10):
    """Traverse the graph in Neo4j between two node names up to a max depth.
    Returns a list of paths with nodes and relationship types.
    """
    driver = get_driver()
    if not driver:
        raise HTTPException(status_code=503, detail="Neo4j driver not initialized")

    query = (
        "MATCH p = (start {name: $start})-[*1..$depth]-(end {name: $end}) "
        "RETURN [n IN nodes(p) | n.name] AS nodes, [r IN relationships(p) | type(r)] AS relations, length(p) AS hops "
        "LIMIT $limit"
    )

    results = []
    try:
        async with driver.session() as session:
            result = await session.run(query, start=start_name, end=end_name, depth=depth, limit=limit)
            async for record in result:
                results.append({
                    "nodes": record["nodes"],
                    "relations": record["relations"],
                    "hops": int(record["hops"]) if record["hops"] is not None else None
                })
        return {"paths": results}
    except ServiceUnavailable:
        raise HTTPException(status_code=503, detail="Neo4j service unavailable")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
