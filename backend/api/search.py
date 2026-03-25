"""Global Search API for cross-domain entity and event discovery."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from db.postgres import get_db_session
from db.schemas import Document, SystemMetric
from db.neo4j import get_neo4j_session
from utils.response import build_success, build_error

router = APIRouter()

@router.get("/")
async def global_search(
    q: str = Query(..., min_length=2),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Search across multiple domains:
    1. News Articles (PostgreSQL)
    2. Knowledge Graph Entities (Neo4j)
    3. Metrics & Predictions
    """
    try:
        results = []
        
        # 1. Search News Articles (Documents)
        news_query = select(Document).where(
            or_(
                Document.title.ilike(f"%{q}%"),
                Document.content.ilike(f"%{q}%"),
                Document.source.ilike(f"%{q}%")
            )
        ).limit(limit // 2)
        
        news_results = (await db.execute(news_query)).scalars().all()
        for article in news_results:
            results.append({
                "type": "news",
                "id": str(article.id),
                "title": article.title,
                "subtitle": article.source,
                "url": f"/intelligence?article={article.id}",
                "timestamp": article.published_date.isoformat() if article.published_date else None
            })
            
        # 2. Search Knowledge Graph Entities (Neo4j)
        try:
            with get_neo4j_session() as session:
                cypher = """
                MATCH (n)
                WHERE n.name =~ $pattern OR n.type =~ $pattern
                RETURN n.name as name, n.type as type, labels(n)[0] as label
                LIMIT $limit
                """
                pattern = f"(?i).*{q}.*"
                kg_data = session.run(cypher, pattern=pattern, limit=limit // 2)
                for record in kg_data:
                    results.append({
                        "type": "entity",
                        "title": record["name"],
                        "subtitle": f"{record['label']} • {record['type']}",
                        "url": f"/knowledge-graph?focus={record['name']}"
                    })
        except Exception as e:
            # Neo4j might be down or not configured, log and continue
            print(f"Neo4j search failed: {e}")

        # Sort results by relevance (simplified: just group by type)
        return build_success({
            "query": q,
            "results": results,
            "count": len(results)
        })
        
    except Exception as e:
        return build_error("SEARCH_ERROR", f"Global search failed: {str(e)}")
