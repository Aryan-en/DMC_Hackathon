"""
Kafka Producer for ONTORA data ingestion pipeline.

Publishes scraped/fetched data to Kafka topics:
- mea.relations.raw: MEA bilateral relations data
- economic.indicators.batch: World Bank economic indicators

Usage:
    from ingestors.kafka_producer import MEARelationProducer, EconomicIndicatorProducer
    import asyncio
    
    async def main():
        producer = MEARelationProducer()
        await producer.send({
            "country": "China",
            "relation_type": "TRADE",
            "trade_volume": 120.5
        })
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError
from config import Settings

logger = logging.getLogger(__name__)
config = Settings()


class BaseKafkaProducer:
    """Base class for Kafka producers with common methods."""
    
    def __init__(self, topic: str, bootstrap_servers: Optional[str] = None):
        """
        Initialize Kafka producer.
        
        Args:
            topic: Kafka topic name
            bootstrap_servers: Comma-separated list of broker addresses
        """
        self.topic = topic
        self.bootstrap_servers = bootstrap_servers or config.kafka_brokers
        
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers.split(','),
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                acks='all',  # Wait for all replicas
                retries=3,
                max_in_flight_requests_per_connection=5,
            )
            logger.info(f"Kafka producer initialized for topic: {self.topic}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {e}")
            raise
    
    def send_message(self, data: Dict[str, Any], key: Optional[str] = None) -> bool:
        """
        Send message to Kafka topic synchronously.
        
        Args:
            data: Message data (will be JSON serialized)
            key: Optional message key for partition routing
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Add metadata
            message = {
                **data,
                "timestamp": datetime.utcnow().isoformat(),
                "kafka_topic": self.topic
            }
            
            # Send to Kafka
            future = self.producer.send(
                self.topic,
                value=message,
                key=key.encode('utf-8') if key else None
            )
            
            # Wait for send confirmation
            record_metadata = future.get(timeout=10)
            
            logger.debug(
                f"Message sent to {record_metadata.topic} "
                f"partition {record_metadata.partition} "
                f"offset {record_metadata.offset}"
            )
            return True
            
        except KafkaError as e:
            logger.error(f"Kafka error sending message: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending message: {e}")
            return False
    
    def flush(self, timeout: int = 10) -> bool:
        """
        Flush pending messages.
        
        Args:
            timeout: Timeout in seconds
            
        Returns:
            True if successful
        """
        try:
            self.producer.flush(timeout=timeout)
            logger.info("Producer flushed successfully")
            return True
        except Exception as e:
            logger.error(f"Error flushing producer: {e}")
            return False
    
    def close(self) -> None:
        """Close producer connection."""
        try:
            self.producer.close()
            logger.info(f"Producer for {self.topic} closed")
        except Exception as e:
            logger.error(f"Error closing producer: {e}")


class MEARelationProducer(BaseKafkaProducer):
    """Producer for MEA bilateral relations data."""
    
    TOPIC = "mea.relations.raw"
    
    def __init__(self):
        """Initialize MEA relations producer."""
        super().__init__(topic=self.TOPIC)
    
    def send_country_relation(self, data: Dict[str, Any]) -> bool:
        """
        Send MEA country relation data.
        
        Expected data structure:
        {
            "country": "China",
            "relation_type": "ALLY|RIVAL|NEUTRAL|PARTNER",
            "status": "Active|Dormant|Strained",
            "trade_volume": 120.5,
            "trade_volume_currency": "USD",
            "agreements": ["Trade Agreement 2023", "Defense Pact 2022"],
            "key_issues": ["Border", "Trade Deficit"],
            "sentiment": "positive|neutral|negative",
            "confidence_score": 0.92,
            "source": "MEA",
            "scraped_at": "2024-01-15T10:30:00Z"
        }
        
        Args:
            data: Relation data from MEA scraper
            
        Returns:
            True if successful
        """
        # Validate required fields
        required_fields = ["country", "relation_type"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields in MEA data: {data}")
            return False
        
        # Use country as key for partition routing (all relations for a country go to same partition)
        key = f"mea_{data['country']}"
        
        return self.send_message(data, key=key)


class EconomicIndicatorProducer(BaseKafkaProducer):
    """Producer for World Bank economic indicator data."""
    
    TOPIC = "economic.indicators.batch"
    
    def __init__(self):
        """Initialize economic indicator producer."""
        super().__init__(topic=self.TOPIC)
    
    def send_indicator_batch(self, data: Dict[str, Any]) -> bool:
        """
        Send World Bank economic indicator data.
        
        Expected data structure:
        {
            "country_code": "IND",
            "country_name": "India",
            "indicators": [
                {
                    "indicator_code": "NY.GDP.MKTP.CD",
                    "indicator_name": "GDP (current US$)",
                    "value": 3.73e12,
                    "year": 2023,
                    "unit": "USD"
                },
                ...
            ],
            "source": "World Bank",
            "fetch_timestamp": "2024-01-15T10:30:00Z"
        }
        
        Args:
            data: Indicator data from World Bank fetcher
            
        Returns:
            True if successful
        """
        # Validate required fields
        required_fields = ["country_code", "indicators"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields in indicator data: {data}")
            return False
        
        # Use country code as key
        key = f"wb_{data['country_code']}"
        
        return self.send_message(data, key=key)
    
    def send_indicator(self, data: Dict[str, Any]) -> bool:
        """
        Send single World Bank economic indicator.
        
        Expected data structure:
        {
            "country_code": "IND",
            "indicator_code": "NY.GDP.MKTP.CD",
            "indicator_name": "GDP (current US$)",
            "value": 3.73e12,
            "year": 2023,
            "unit": "USD",
            "source": "World Bank"
        }
        
        Args:
            data: Single indicator from World Bank
            
        Returns:
            True if successful
        """
        required_fields = ["country_code", "indicator_code", "value"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {data}")
            return False
        
        key = f"wb_{data['country_code']}_{data['indicator_code']}"
        return self.send_message(data, key=key)


class DocumentProducer(BaseKafkaProducer):
    """Producer for documents from various sources."""
    
    TOPIC = "documents.raw"
    
    def __init__(self):
        """Initialize document producer."""
        super().__init__(topic=self.TOPIC)
    
    def send_document(self, data: Dict[str, Any]) -> bool:
        """
        Send document data.
        
        Expected data structure:
        {
            "title": "India-China Relations in 2024",
            "content": "Full document text...",
            "source_type": "MEA|NEWS|SOCIAL|RESEARCH",
            "source_url": "https://...",
            "language": "en|hi|zh",
            "published_date": "2024-01-15T10:00:00Z",
            "country": "China",
            "region": "Asia"
        }
        
        Args:
            data: Document data
            
        Returns:
            True if successful
        """
        required_fields = ["title", "content", "source_type"]
        if not all(field in data for field in required_fields):
            logger.warning(f"Missing required fields: {data}")
            return False
        
        key = f"{data['source_type']}_{data.get('country', 'GLOBAL')}"
        return self.send_message(data, key=key)


def get_mea_producer() -> MEARelationProducer:
    """Get or create MEA relations producer singleton."""
    if not hasattr(get_mea_producer, 'instance'):
        get_mea_producer.instance = MEARelationProducer()
    return get_mea_producer.instance


def get_economic_producer() -> EconomicIndicatorProducer:
    """Get or create economic indicator producer singleton."""
    if not hasattr(get_economic_producer, 'instance'):
        get_economic_producer.instance = EconomicIndicatorProducer()
    return get_economic_producer.instance


def get_document_producer() -> DocumentProducer:
    """Get or create document producer singleton."""
    if not hasattr(get_document_producer, 'instance'):
        get_document_producer.instance = DocumentProducer()
    return get_document_producer.instance


# Example usage / testing
if __name__ == "__main__":
    import asyncio
    
    async def test_producers():
        """Test all producers."""
        
        # Test MEA producer
        mea_producer = MEARelationProducer()
        success = mea_producer.send_country_relation({
            "country": "China",
            "relation_type": "RIVAL",
            "status": "Active",
            "trade_volume": 136.5,
            "trade_volume_currency": "USD",
            "agreements": ["Trade Agreement 2023"],
            "key_issues": ["Border Disputes", "Trade Deficit"],
            "sentiment": "negative",
            "confidence_score": 0.88,
            "source": "MEA",
            "scraped_at": datetime.utcnow().isoformat()
        })
        print(f"MEA message sent: {success}")
        
        # Test Economic producer
        econ_producer = EconomicIndicatorProducer()
        success = econ_producer.send_indicator_batch({
            "country_code": "IND",
            "country_name": "India",
            "indicators": [
                {
                    "indicator_code": "NY.GDP.MKTP.CD",
                    "indicator_name": "GDP (current US$)",
                    "value": 3730000000000,
                    "year": 2023,
                    "unit": "USD"
                }
            ],
            "source": "World Bank",
            "fetch_timestamp": datetime.utcnow().isoformat()
        })
        print(f"Economic message sent: {success}")
        
        # Flush and close
        mea_producer.flush()
        econ_producer.flush()
        
        mea_producer.close()
        econ_producer.close()
    
    asyncio.run(test_producers())
