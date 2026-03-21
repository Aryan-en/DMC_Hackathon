"""Kafka consumer for NLP triplet extraction and Neo4j writes."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select

from consumers.postgres_consumer import BaseKafkaConsumer
from db.neo4j import get_driver
from db.postgres import AsyncSessionLocal
from db.schemas import Document
from services.entity_extractor import EntityExtractionService

logger = logging.getLogger(__name__)


class Neo4jEntityConsumer(BaseKafkaConsumer):
    """Consume document events, extract entities, and write a graph projection."""

    TOPIC = "documents.raw"
    GROUP_ID = "neo4j-entities-group"

    def __init__(self):
        self.extractor = EntityExtractionService()
        super().__init__(topic=self.TOPIC, group_id=self.GROUP_ID, process_fn=self.store_document_graph)

    async def store_document_graph(self, data: dict[str, Any]) -> None:
        content = data.get("content") or ""
        title = data.get("title") or "Untitled"
        source = data.get("source") or "UNKNOWN"

        entities = self.extractor.extract(content)
        triplets = self.extractor.extract_triplets(content)
        if not entities:
            logger.info("No entities extracted for document: %s", title)
            return

        driver = get_driver()
        async with driver.session() as session:
            for ent in entities:
                await session.run(
                    """
                    MERGE (e:Entity {link_key: $link_key})
                    SET e.name = $name,
                        e.entity_type = $entity_type,
                        e.confidence_score = $confidence_score,
                        e.updated_at = $updated_at
                    """,
                    {
                        "link_key": ent["link_key"],
                        "name": ent["name"],
                        "entity_type": ent["entity_type"],
                        "confidence_score": ent["confidence_score"],
                        "updated_at": datetime.utcnow().isoformat(),
                    },
                )

            for triplet in triplets:
                await session.run(
                    """
                    MATCH (s:Entity {link_key: $subject_link})
                    MATCH (o:Entity {link_key: $object_link})
                    MERGE (s)-[r:RELATED_TO {predicate: $predicate}]->(o)
                    SET r.confidence_score = $confidence,
                        r.updated_at = $updated_at
                    """,
                    {
                        "subject_link": triplet["subject_link"],
                        "object_link": triplet["object_link"],
                        "predicate": triplet["predicate"],
                        "confidence": triplet["confidence"],
                        "updated_at": datetime.utcnow().isoformat(),
                    },
                )

                await session.run(
                    """
                    MERGE (d:Document {title: $title, source: $source})
                    MERGE (d)-[r:MENTIONS]->(e:Entity {link_key: $link_key})
                    SET r.updated_at = $updated_at
                    """,
                    {
                        "title": title,
                        "source": source,
                        "link_key": ent["link_key"],
                        "updated_at": datetime.utcnow().isoformat(),
                    },
                )

        logger.info("Wrote %s entities and %s triplets to Neo4j for document: %s", len(entities), len(triplets), title)


def get_neo4j_consumer() -> Neo4jEntityConsumer:
    if not hasattr(get_neo4j_consumer, "instance"):
        get_neo4j_consumer.instance = Neo4jEntityConsumer()
    return get_neo4j_consumer.instance
