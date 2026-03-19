"""
Kafka Consumer for ONTORA data processing pipeline.

Consumes from Kafka topics and writes to databases:
- mea.relations.raw → PostgreSQL (country_relation table)
- economic.indicators.batch → PostgreSQL (economic_indicator table)
- documents.raw → PostgreSQL (document table)

Usage:
    from consumers.postgres_consumer import MEARelationConsumer
    import asyncio
    
    async def main():
        consumer = MEARelationConsumer()
        await consumer.start()
"""

import json
import logging
import asyncio
from typing import Dict, Any, Optional, Callable
from datetime import datetime
from kafka import KafkaConsumer
from kafka.errors import KafkaError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert

from config import Settings
from db.postgres import AsyncSessionLocal
from db.schemas import CountryRelation, EconomicIndicator, Document, Country

logger = logging.getLogger(__name__)
config = Settings()


class BaseKafkaConsumer:
    """Base class for Kafka consumers."""
    
    def __init__(
        self,
        topic: str,
        group_id: str,
        bootstrap_servers: Optional[str] = None,
        process_fn: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        """
        Initialize Kafka consumer.
        
        Args:
            topic: Kafka topic to consume from
            group_id: Consumer group ID
            bootstrap_servers: Comma-separated list of broker addresses
            process_fn: Async function to process messages (default: store_message)
        """
        self.topic = topic
        self.group_id = group_id
        self.bootstrap_servers = bootstrap_servers or config.kafka_brokers
        self.process_fn = process_fn or self.store_message
        
        try:
            self.consumer = KafkaConsumer(
                topic,
                bootstrap_servers=self.bootstrap_servers.split(','),
                group_id=group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                max_poll_records=100,  # Batch size
                session_timeout_ms=30000,
            )
            logger.info(f"Kafka consumer initialized for topic: {topic}, group: {group_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka consumer: {e}")
            raise
    
    async def process_batch(self, messages: list) -> int:
        """
        Process a batch of messages.
        
        Args:
            messages: List of KafkaMessage objects
            
        Returns:
            Number of successfully processed messages
        """
        processed = 0
        for message in messages:
            try:
                await self.process_fn(message.value)
                processed += 1
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                continue
        
        return processed
    
    async def store_message(self, data: Dict[str, Any]) -> None:
        """Override in subclass."""
        logger.info(f"Storing message: {data}")
    
    async def start(self) -> None:
        """Start consuming messages (blocking)."""
        logger.info(f"Starting consumer for {self.topic}...")
        try:
            for messages in self.consumer:
                batch_size = len(messages)
                processed = await self.process_batch(messages)
                logger.info(
                    f"Processed {processed}/{batch_size} messages from {self.topic}"
                )
        except KeyboardInterrupt:
            logger.info("Consumer interrupted")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.consumer.close()
    
    def close(self) -> None:
        """Close consumer connection."""
        try:
            self.consumer.close()
            logger.info(f"Consumer for {self.topic} closed")
        except Exception as e:
            logger.error(f"Error closing consumer: {e}")


class MEARelationConsumer(BaseKafkaConsumer):
    """Consumer for MEA bilateral relations data."""
    
    TOPIC = "mea.relations.raw"
    GROUP_ID = "mea-relations-group"
    
    def __init__(self):
        """Initialize MEA relations consumer."""
        super().__init__(
            topic=self.TOPIC,
            group_id=self.GROUP_ID,
            process_fn=self.store_mea_relation
        )
    
    async def store_mea_relation(self, data: Dict[str, Any]) -> None:
        """
        Store MEA relation data to PostgreSQL.
        
        Args:
            data: Country relation data from Kafka
        """
        required_fields = ["country", "relation_type"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {data}")
            return
        
        async with AsyncSessionLocal() as session:
            try:
                # Find country IDs
                stmt = select(Country).where(Country.name == data["country"])
                result = await session.execute(stmt)
                country = result.scalar_one_or_none()
                
                if not country:
                    logger.warning(f"Country not found: {data['country']}")
                    return
                
                # Create relation record
                relation = CountryRelation(
                    country1_id=country.id,  # India as default source
                    country2_id=country.id,  # Target country
                    relation_type=data.get("relation_type", "UNKNOWN"),
                    trade_volume=data.get("trade_volume"),
                    trade_volume_currency=data.get("trade_volume_currency", "USD"),
                    trade_volume_year=datetime.utcnow().year,
                    status=data.get("status"),
                    agreements=data.get("agreements", []),
                    key_issues=data.get("key_issues", []),
                    sentiment_score=self._map_sentiment_to_score(data.get("sentiment")),
                    confidence_score=data.get("confidence_score", 0.5),
                    source=data.get("source", "MEA"),
                )
                
                session.add(relation)
                await session.commit()
                logger.info(f"Stored MEA relation for {data['country']}")
                
            except Exception as e:
                logger.error(f"Error storing MEA relation: {e}")
                await session.rollback()
    
    @staticmethod
    def _map_sentiment_to_score(sentiment: Optional[str]) -> float:
        """Map sentiment string to -1.0 to 1.0 score."""
        mapping = {
            "positive": 1.0,
            "neutral": 0.0,
            "negative": -1.0,
        }
        return mapping.get(sentiment, 0.0) if sentiment else 0.0


class EconomicIndicatorConsumer(BaseKafkaConsumer):
    """Consumer for World Bank economic indicator data."""
    
    TOPIC = "economic.indicators.batch"
    GROUP_ID = "economic-indicators-group"
    
    def __init__(self):
        """Initialize economic indicator consumer."""
        super().__init__(
            topic=self.TOPIC,
            group_id=self.GROUP_ID,
            process_fn=self.store_indicator_batch
        )
    
    async def store_indicator_batch(self, data: Dict[str, Any]) -> None:
        """
        Store economic indicator batch to PostgreSQL.
        
        Args:
            data: Indicator batch from Kafka
        """
        required_fields = ["country_code", "indicators"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {data}")
            return
        
        async with AsyncSessionLocal() as session:
            try:
                # Find country
                stmt = select(Country).where(Country.iso_code == data["country_code"])
                result = await session.execute(stmt)
                country = result.scalar_one_or_none()
                
                if not country:
                    logger.warning(f"Country not found: {data['country_code']}")
                    return
                
                # Store each indicator
                indicators = data.get("indicators", [])
                for indicator in indicators:
                    try:
                        econ_indicator = EconomicIndicator(
                            country_id=country.id,
                            indicator_code=indicator.get("indicator_code"),
                            indicator_name=indicator.get("indicator_name"),
                            value=indicator.get("value"),
                            unit=indicator.get("unit"),
                            year=indicator.get("year"),
                            source=data.get("source", "World Bank"),
                        )
                        session.add(econ_indicator)
                    except Exception as e:
                        logger.warning(f"Error processing indicator: {e}")
                        continue
                
                await session.commit()
                logger.info(
                    f"Stored {len(indicators)} indicators for {data['country_code']}"
                )
                
            except Exception as e:
                logger.error(f"Error storing economic indicators: {e}")
                await session.rollback()


class DocumentConsumer(BaseKafkaConsumer):
    """Consumer for document data."""
    
    TOPIC = "documents.raw"
    GROUP_ID = "documents-group"
    
    def __init__(self):
        """Initialize document consumer."""
        super().__init__(
            topic=self.TOPIC,
            group_id=self.GROUP_ID,
            process_fn=self.store_document
        )
    
    async def store_document(self, data: Dict[str, Any]) -> None:
        """
        Store document to PostgreSQL.
        
        Args:
            data: Document data from Kafka
        """
        required_fields = ["title", "content", "source_type"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {data}")
            return
        
        async with AsyncSessionLocal() as session:
            try:
                # Optional: Find country if specified
                country_id = None
                if "country" in data:
                    stmt = select(Country).where(Country.name == data["country"])
                    result = await session.execute(stmt)
                    country = result.scalar_one_or_none()
                    if country:
                        country_id = country.id
                
                # Create document
                document = Document(
                    title=data.get("title"),
                    content=data.get("content"),
                    source_type=data.get("source_type"),
                    source_url=data.get("source_url"),
                    country_id=country_id,
                    language=data.get("language", "en"),
                    published_date=self._parse_date(data.get("published_date")),
                    metadata=data.get("metadata", {}),
                )
                
                session.add(document)
                await session.commit()
                logger.info(f"Stored document: {data.get('title', 'Unknown')}")
                
            except Exception as e:
                logger.error(f"Error storing document: {e}")
                await session.rollback()
    
    @staticmethod
    def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
        """Parse ISO format date string."""
        if not date_str:
            return None
        try:
            if isinstance(date_str, str):
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return date_str
        except Exception as e:
            logger.warning(f"Error parsing date: {e}")
            return None


def get_mea_consumer() -> MEARelationConsumer:
    """Get or create MEA consumer singleton."""
    if not hasattr(get_mea_consumer, 'instance'):
        get_mea_consumer.instance = MEARelationConsumer()
    return get_mea_consumer.instance


def get_economic_consumer() -> EconomicIndicatorConsumer:
    """Get or create economic consumer singleton."""
    if not hasattr(get_economic_consumer, 'instance'):
        get_economic_consumer.instance = EconomicIndicatorConsumer()
    return get_economic_consumer.instance


def get_document_consumer() -> DocumentConsumer:
    """Get or create document consumer singleton."""
    if not hasattr(get_document_consumer, 'instance'):
        get_document_consumer.instance = DocumentConsumer()
    return get_document_consumer.instance


async def start_all_consumers():
    """Start all consumers concurrently."""
    consumers = [
        get_mea_consumer(),
        get_economic_consumer(),
        get_document_consumer(),
    ]
    
    tasks = [consumer.start() for consumer in consumers]
    
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        logger.info("Stopping all consumers")
        for consumer in consumers:
            consumer.close()


# Example usage / testing
if __name__ == "__main__":
    import logging.config
    
    logging.basicConfig(level=logging.INFO)
    
    # Run all consumers
    asyncio.run(start_all_consumers())
