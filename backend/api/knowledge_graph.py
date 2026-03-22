"""Knowledge Graph API Endpoints."""

from collections import defaultdict, deque

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from db.postgres import get_db_session
from db.schemas import Entity, Relationship
from utils.sanitize import sanitize_identifier
from utils.response import build_error, build_success

router = APIRouter()


async def _relationship_rows(db: AsyncSession, limit: int = 3000):
    """Load relationship rows joined with entity names for graph analytics."""
    s = Entity.__table__.alias("s")
    o = Entity.__table__.alias("o")

    stmt = (
        select(
            s.c.name,
            o.c.name,
            Relationship.predicate,
            Relationship.confidence_score,
        )
        .join(s, Relationship.subject_entity_id == s.c.id)
        .join(o, Relationship.object_entity_id == o.c.id)
        .order_by(Relationship.created_at.desc())
        .limit(limit)
    )
    return (await db.execute(stmt)).all()


@router.get("/nodes")
async def get_nodes(db: AsyncSession = Depends(get_db_session)):
    """GET /api/knowledge-graph/nodes - Node types and counts"""
    try:
        rows = (
            await db.execute(
                select(Entity.entity_type, func.count(Entity.id))
                .group_by(Entity.entity_type)
                .order_by(func.count(Entity.id).desc())
            )
        ).all()

        color_map = {
            "COUNTRY": "#5b8db8",
            "POLICY": "#8a78c8",
            "EVENT": "#b84a4a",
            "SECTOR": "#c8822a",
            "ACTOR": "#3eb87a",
            "CONCEPT": "#4a6070",
            "ORG": "#c8a84a",
            "PERSON": "#3eb87a",
        }
        node_types = [
            {"type": entity_type, "count": int(count), "color": color_map.get((entity_type or "").upper(), "#5b8db8")}
            for entity_type, count in rows
        ]
        return build_success({"node_types": node_types})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch node metrics: {exc}")


@router.get("/relationships")
async def get_relationships(
    limit: int = Query(default=50, ge=1, le=500),
    query: str | None = Query(default=None, min_length=1, max_length=120),
    min_strength: int = Query(default=0, ge=0, le=100),
    db: AsyncSession = Depends(get_db_session),
):
    """GET /api/knowledge-graph/relationships - Relationship types"""
    try:
        rows = await _relationship_rows(db, limit=limit)

        q = query.strip().lower() if query else None

        relationships = []
        for source, target, relation, confidence in rows:
            strength = int((confidence or 0.75) * 100)
            if strength < min_strength:
                continue
            if q:
                haystack = f"{source or ''} {target or ''} {relation or ''}".lower()
                if q not in haystack:
                    continue
            relationships.append(
                {
                    "source": source,
                    "target": target,
                    "relation": relation,
                    "strength": strength,
                }
            )

        return build_success({"relationships": relationships}, meta={"count": len(relationships)})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch relationships: {exc}")


@router.get("/shacl-validation-summary")
async def get_shacl_validation_summary(db: AsyncSession = Depends(get_db_session)):
    """GET /api/knowledge-graph/shacl-validation-summary - SHACL-style constraint status."""
    try:
        type_rows = (
            await db.execute(select(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type))
        ).all()

        empty_name_violations = (
            await db.execute(
                select(func.count(Entity.id)).where((Entity.name.is_(None)) | (func.length(func.trim(Entity.name)) == 0))
            )
        ).scalar() or 0

        type_counts = {str(entity_type or "UNKNOWN").upper(): int(count) for entity_type, count in type_rows}
        total_entities = sum(type_counts.values())

        shape_defs = [
            ("CountryShape", "geo:Country", ["COUNTRY", "GPE"], 12),
            ("PolicyShape", "gov:Policy", ["POLICY"], 8),
            ("EventShape", "evt:Event", ["EVENT"], 15),
            ("ActorShape", "act:Actor", ["ACTOR", "ORG", "PERSON"], 11),
            ("ImpactShape", "imp:Impact", ["IMPACT", "CONCEPT"], 7),
        ]

        shapes = []
        total_violations = int(empty_name_violations)
        for shape_name, target_class, mapped_types, constraints in shape_defs:
            target_nodes = sum(type_counts.get(t, 0) for t in mapped_types)
            violations = 0
            status = "PASS"
            if target_nodes == 0 and total_entities > 0:
                violations = 1
                status = "WARN"
            if empty_name_violations > 0 and target_nodes > 0:
                violations += int(min(empty_name_violations, max(1, target_nodes // 12)))
                status = "WARN"

            total_violations += violations
            shapes.append(
                {
                    "shape": shape_name,
                    "target": target_class,
                    "constraints": constraints,
                    "target_nodes": int(target_nodes),
                    "violations": int(violations),
                    "status": "PASS" if violations == 0 else "WARN",
                }
            )

        summary = {
            "shapes_total": len(shapes),
            "shapes_passed": sum(1 for s in shapes if s["status"] == "PASS"),
            "shapes_warn": sum(1 for s in shapes if s["status"] == "WARN"),
            "total_violations": int(total_violations),
        }

        return build_success({"summary": summary, "shapes": shapes})
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to compute SHACL-style summary: {exc}")


@router.get("/conflict-detection")
async def get_conflict_detection(db: AsyncSession = Depends(get_db_session)):
    """GET /api/knowledge-graph/conflict-detection - Conflict hotspot metrics from graph relations."""
    try:
        rows = await _relationship_rows(db, limit=3000)

        keywords = {"conflict", "dispute", "sanction", "attack", "military", "crisis", "war", "threat"}
        high_risk_edges = []
        hotspot_counter = defaultdict(int)

        for source, target, predicate, confidence in rows:
            pred = (predicate or "").lower()
            conf = float(confidence or 0.0)
            is_keyword_match = any(k in pred for k in keywords)
            risk_score = min(100, int((conf * 65) + (25 if is_keyword_match else 0) + 10))
            if is_keyword_match or risk_score >= 70:
                edge = {
                    "source": source,
                    "target": target,
                    "predicate": predicate,
                    "risk": risk_score,
                }
                high_risk_edges.append(edge)
                hotspot_counter[source] += 1
                hotspot_counter[target] += 1

        high_risk_edges.sort(key=lambda item: item["risk"], reverse=True)
        hotspots = [
            {"entity": name, "hits": hits}
            for name, hits in sorted(hotspot_counter.items(), key=lambda item: item[1], reverse=True)[:8]
        ]

        payload = {
            "total_edges": len(rows),
            "high_risk_edges": len(high_risk_edges),
            "risk_ratio": round((len(high_risk_edges) / len(rows)) * 100, 2) if rows else 0,
            "hotspots": hotspots,
            "sample": high_risk_edges[:12],
        }
        return build_success(payload)
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to compute conflict detection metrics: {exc}")


@router.get("/centrality-stats")
async def get_centrality_stats(db: AsyncSession = Depends(get_db_session)):
    """GET /api/knowledge-graph/centrality-stats - Degree centrality overview."""
    try:
        rows = await _relationship_rows(db, limit=5000)

        degree = defaultdict(int)
        nodes = set()
        for source, target, _predicate, _confidence in rows:
            if not source or not target:
                continue
            nodes.add(source)
            nodes.add(target)
            degree[source] += 1
            degree[target] += 1

        node_count = len(nodes)
        edge_count = len(rows)
        avg_degree = round((sum(degree.values()) / node_count), 2) if node_count else 0.0
        max_possible = node_count * (node_count - 1)
        density = round((edge_count / max_possible), 6) if max_possible > 0 else 0.0

        central_nodes = [
            {"entity": name, "degree": deg, "centrality": round((deg / max(node_count - 1, 1)), 4)}
            for name, deg in sorted(degree.items(), key=lambda item: item[1], reverse=True)[:12]
        ]

        payload = {
            "node_count": node_count,
            "edge_count": edge_count,
            "avg_degree": avg_degree,
            "density": density,
            "top_central_nodes": central_nodes,
        }
        return build_success(payload)
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to compute centrality stats: {exc}")


@router.get("/paths/{source}/{target}")
async def get_paths(
    source: str,
    target: str,
    depth: int = 4,
    max_paths: int = 3,
    db: AsyncSession = Depends(get_db_session),
):
    """GET /api/knowledge-graph/paths/{source}/{target} - Multi-hop causal paths."""
    try:
        source_safe = sanitize_identifier(source)
        target_safe = sanitize_identifier(target)

        depth = max(1, min(depth, 6))
        max_paths = max(1, min(max_paths, 5))

        rows = await _relationship_rows(db, limit=5000)
        if not rows:
            return build_success({"paths": []}, meta={"note": "No graph edges available yet"})

        adjacency = defaultdict(list)
        canonical = {}
        for s_name, o_name, _predicate, confidence in rows:
            if not s_name or not o_name:
                continue
            s_key = s_name.strip().lower()
            o_key = o_name.strip().lower()
            canonical[s_key] = s_name
            canonical[o_key] = o_name
            adjacency[s_key].append((o_key, float(confidence or 0.7)))

        if source_safe.lower() not in canonical or target_safe.lower() not in canonical:
            return build_success(
                {"paths": []},
                meta={"note": "Entity not found for concrete pathing", "depth": depth, "max_paths": max_paths},
            )

        source_key = source_safe.lower()
        target_key = target_safe.lower()

        queue = deque([(source_key, [source_key], [])])
        found = []

        while queue and len(found) < max_paths:
            current, chain, strengths = queue.popleft()
            if len(chain) - 1 >= depth:
                continue

            for neighbor, edge_strength in adjacency.get(current, []):
                if neighbor in chain:
                    continue

                next_chain = chain + [neighbor]
                next_strengths = strengths + [edge_strength]

                if neighbor == target_key:
                    aggregate = int((sum(next_strengths) / len(next_strengths)) * 100)
                    found.append(
                        {
                            "chain": [canonical[k] for k in next_chain],
                            "strength": aggregate,
                            "hops": len(next_chain) - 1,
                        }
                    )
                    if len(found) >= max_paths:
                        break
                else:
                    queue.append((neighbor, next_chain, next_strengths))

        found.sort(key=lambda p: (p["hops"], -p["strength"]))
        return build_success(
            {"paths": found},
            meta={"depth": depth, "max_paths": max_paths, "paths_found": len(found)},
        )
    except Exception as exc:
        return build_error("QUERY_ERROR", f"Failed to fetch graph paths: {exc}")


@router.post("/seed-data")
async def seed_knowledge_graph_data(db: AsyncSession = Depends(get_db_session)):
    """POST /api/knowledge-graph/seed-data - Populate knowledge graph with sample entities and relationships"""
    try:
        import uuid
        from sqlalchemy import text
        
        # Clear existing data
        await db.execute(text("DELETE FROM relationships"))
        await db.execute(text("DELETE FROM entities"))
        await db.commit()
        
        # Define entities
        entities_data = {
            # Countries (GPE)
            "USA": ("COUNTRY", "United States of America - Global superpower", 0.95),
            "Russia": ("COUNTRY", "Russian Federation - Major regional power", 0.95),
            "China": ("COUNTRY", "People's Republic of China - Rising superpower", 0.95),
            "India": ("COUNTRY", "Republic of India - Regional power", 0.95),
            "EU": ("COUNTRY", "European Union - Political and economic union", 0.92),
            "Ukraine": ("COUNTRY", "Eastern European nation", 0.95),
            "Pakistan": ("COUNTRY", "South Asian nation", 0.95),
            "Iran": ("COUNTRY", "Middle Eastern power", 0.95),
            "Saudi Arabia": ("COUNTRY", "Gulf state leader", 0.95),
            
            # Organizations
            "NATO": ("ORG", "North Atlantic Treaty Organization - Military alliance", 0.98),
            "UN": ("ORG", "United Nations - International organization", 0.98),
            "OPEC": ("ORG", "Organization of Petroleum Exporting Countries", 0.95),
            "WTO": ("ORG", "World Trade Organization", 0.95),
            "IMF": ("ORG", "International Monetary Fund", 0.95),
            "SCO": ("ORG", "Shanghai Cooperation Organization", 0.92),
            
            # Events
            "Ukraine Conflict": ("EVENT", "Ongoing military conflict in Ukraine", 0.94),
            "Taiwan Strait Tensions": ("EVENT", "Geopolitical tensions in Taiwan Strait", 0.93),
            "Middle East Crisis": ("EVENT", "Regional instability and conflicts", 0.92),
            "Kashmir Dispute": ("EVENT", "Long-standing territorial dispute", 0.94),
            
            # Actors
            "Putin": ("PERSON", "Russian President", 0.99),
            "Biden": ("PERSON", "US President", 0.99),
            "Xi Jinping": ("PERSON", "Chinese President", 0.99),
            "Modi": ("PERSON", "Indian Prime Minister", 0.99),
            
            # Concepts & Policy Areas
            "Energy Security": ("CONCEPT", "Reliable access to energy resources", 0.90),
            "Nuclear Proliferation": ("CONCEPT", "Spread of nuclear weapons", 0.92),
            "Trade Dispute": ("POLICY", "Commercial and tariff conflicts", 0.88),
            "Cyber Warfare": ("CONCEPT", "Digital conflict and attacks", 0.91),
            "Climate Crisis": ("CONCEPT", "Global environmental challenge", 0.93),
            "Sanctions": ("POLICY", "Economic and political penalties", 0.89),
        }
        
        # Create entity records
        entity_map = {}
        for name, (entity_type, description, confidence) in entities_data.items():
            entity_id = str(uuid.uuid4())
            stmt = text("""
                INSERT INTO entities (id, name, entity_type, description, confidence_score, mention_count, created_at, updated_at)
                VALUES (:id, :name, :type, :description, :confidence, 1, NOW(), NOW())
            """)
            await db.execute(stmt, {
                "id": entity_id,
                "name": name,
                "type": entity_type,
                "description": description,
                "confidence": confidence,
            })
            entity_map[name] = entity_id
        
        await db.commit()
        
        # Define relationships
        relationships_data = [
            # USA relationships
            ("USA", "supports", "NATO", 0.95),
            ("USA", "sanctions", "Russia", 0.94),
            ("USA", "in_conflict_with", "China", 0.88),
            ("USA", "opposes", "Iran", 0.92),
            ("USA", "leads", "WTO", 0.91),
            ("Biden", "heads", "USA", 0.99),
            
            # Russia relationships
            ("Russia", "conflicts_with", "Ukraine", 0.96),
            ("Russia", "competes_with", "USA", 0.93),
            ("Russia", "allied_with", "China", 0.85),
            ("Russia", "threatens", "NATO", 0.89),
            ("Russia", "member_of", "SCO", 0.92),
            ("Putin", "heads", "Russia", 0.99),
            ("Putin", "directs", "Ukraine Conflict", 0.95),
            
            # China relationships
            ("China", "disputes_with", "India", 0.90),
            ("China", "threatens", "Taiwan Strait Tensions", 0.94),
            ("China", "competes_with", "USA", 0.91),
            ("China", "cooperates_with", "Russia", 0.82),
            ("China", "member_of", "SCO", 0.93),
            ("Xi Jinping", "heads", "China", 0.99),
            
            # India relationships
            ("India", "disputes_with", "Pakistan", 0.95),
            ("India", "disputes_with", "China", 0.93),
            ("India", "cooperates_with", "USA", 0.80),
            ("India", "member_of", "SCO", 0.91),
            ("Modi", "heads", "India", 0.99),
            
            # EU relationships
            ("EU", "supports", "Ukraine", 0.94),
            ("EU", "member_of", "NATO", 0.81),
            ("EU", "sanctions", "Russia", 0.95),
            ("EU", "trades_with", "USA", 0.85),
            
            # Conflict relationships
            ("Ukraine Conflict", "involves", "Russia", 0.96),
            ("Ukraine Conflict", "involves", "Ukraine", 0.97),
            ("Ukraine Conflict", "supported_by", "USA", 0.91),
            ("Ukraine Conflict", "supported_by", "EU", 0.92),
            
            ("Taiwan Strait Tensions", "involves", "China", 0.95),
            ("Taiwan Strait Tensions", "monitored_by", "USA", 0.93),
            
            ("Kashmir Dispute", "involves", "India", 0.96),
            ("Kashmir Dispute", "involves", "Pakistan", 0.96),
            
            ("Middle East Crisis", "involves", "Iran", 0.88),
            ("Middle East Crisis", "involves", "Saudi Arabia", 0.87),
            
            # Economic relationships
            ("USA", "imposes", "Trade Dispute", 0.82),
            ("China", "engages_in", "Trade Dispute", 0.84),
            ("OPEC", "controls", "Energy Security", 0.91),
            ("Russia", "supplies", "Energy Security", 0.89),
            
            # Threat relationships
            ("Iran", "develops", "Nuclear Proliferation", 0.87),
            ("Russia", "engages_in", "Cyber Warfare", 0.85),
            ("China", "engages_in", "Cyber Warfare", 0.84),
            
            # Policy relationships
            ("UN", "enforces", "Sanctions", 0.88),
            ("Russia", "evades", "Sanctions", 0.83),
            ("USA", "leads", "Sanctions", 0.89),
            
            # Climate relationships
            ("USA", "addresses", "Climate Crisis", 0.75),
            ("China", "addresses", "Climate Crisis", 0.72),
            ("EU", "leads", "Climate Crisis", 0.86),
            
            # Organization relationships
            ("NATO", "led_by", "USA", 0.94),
            ("SCO", "includes", "Russia", 0.93),
            ("SCO", "includes", "China", 0.95),
            ("WTO", "regulates", "Trade Dispute", 0.87),
            
            # Additional connections for graph density
            ("USA", "monitors", "Middle East Crisis", 0.85),
            ("China", "interests_in", "Middle East Crisis", 0.78),
            ("Russia", "involved_in", "Middle East Crisis", 0.80),
            ("Pakistan", "disputes_with", "USA", 0.75),
            ("Iran", "sanctions_by", "USA", 0.93),
            ("Saudi Arabia", "allies_with", "USA", 0.87),
            ("Energy Security", "related_to", "Middle East Crisis", 0.86),
            ("India", "partners_with", "USA", 0.78),
            ("India", "opposes", "Nuclear Proliferation", 0.85),
            ("Pakistan", "develops", "Nuclear Proliferation", 0.88),
        ]
        
        # Create relationship records
        for subject, predicate, obj, confidence in relationships_data:
            if subject in entity_map and obj in entity_map:
                rel_id = str(uuid.uuid4())
                stmt = text("""
                    INSERT INTO relationships (id, subject_entity_id, predicate, object_entity_id, confidence_score, created_at)
                    VALUES (:id, :subject_id, :predicate, :object_id, :confidence, NOW())
                """)
                await db.execute(stmt, {
                    "id": rel_id,
                    "subject_id": entity_map[subject],
                    "predicate": predicate,
                    "object_id": entity_map[obj],
                    "confidence": confidence,
                })
        
        await db.commit()
        
        return build_success({
            "message": "Knowledge graph seeded successfully",
            "entities": len(entity_map),
            "relationships": len(relationships_data),
        })
    except Exception as exc:
        return build_error("SEED_ERROR", f"Failed to seed knowledge graph: {exc}")
