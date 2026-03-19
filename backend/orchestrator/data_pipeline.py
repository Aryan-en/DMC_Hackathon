"""
ONTORA Data Pipeline Orchestrator
Connects MEA scraper, World Bank fetcher, Kafka producers, and consumers.

This script demonstrates the complete data flow:
1. MEA Scraper → Kafka (mea.relations.raw)
2. World Bank Fetcher → Kafka (economic.indicators.batch)
3. Kafka Consumers → PostgreSQL/Neo4j

Run this to start the complete data pipeline.
"""

import asyncio
import logging
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

from backend.ingestors.mea_scraper import MEAScraper
from backend.ingestors.worldbank_fetcher import WorldBankFetcher
from backend.ingestors.kafka_producer import (
    MEARelationProducer,
    EconomicIndicatorProducer,
    get_mea_producer,
    get_economic_producer
)
from backend.consumers.postgres_consumer import (
    MEARelationConsumer,
    EconomicIndicatorConsumer,
)
from backend.config import Settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

config = Settings()


async def run_mea_pipeline():
    """Run MEA scraper and produce to Kafka."""
    logger.info("="*70)
    logger.info("Starting MEA Relations Data Pipeline")
    logger.info("="*70)
    
    try:
        scraper = MEAScraper()
        producer = get_mea_producer()
        
        # Demo: Scrape a few key countries
        countries = [
            "China",
            "United States",
            "Pakistan",
            "Bangladesh",
            "Japan",
        ]
        
        logger.info(f"Scraping MEA relations for {len(countries)} countries...")
        
        for country in countries:
            try:
                logger.info(f"  Scraping relations with {country}...")
                relations = await scraper.fetch_country_relations(country)
                
                if relations:
                    # Produce to Kafka
                    success = producer.send_country_relation(relations)
                    if success:
                        logger.info(f"    ✓ Sent to Kafka: {country}")
                    else:
                        logger.warning(f"    ✗ Failed to send: {country}")
                else:
                    logger.warning(f"    No data found for {country}")
                    
            except Exception as e:
                logger.error(f"    Error processing {country}: {e}")
                continue
        
        # Flush pending messages
        producer.flush()
        logger.info("✓ MEA pipeline complete")
        
    except Exception as e:
        logger.error(f"MEA pipeline error: {e}")


async def run_worldbank_pipeline():
    """Run World Bank fetcher and produce to Kafka."""
    logger.info("="*70)
    logger.info("Starting World Bank Economic Data Pipeline")
    logger.info("="*70)
    
    try:
        fetcher = WorldBankFetcher()
        producer = get_economic_producer()
        
        # Demo: Fetch indicators for key SAARC countries
        countries = {
            "IND": "India",
            "PAK": "Pakistan",
            "BGD": "Bangladesh",
            "LKA": "Sri Lanka",
            "NPL": "Nepal",
        }
        
        logger.info(f"Fetching economic indicators for {len(countries)} countries...")
        
        for code, name in countries.items():
            try:
                logger.info(f"  Fetching indicators for {name}...")
                indicators = await fetcher.fetch_indicators(code)
                
                if indicators:
                    # Produce to Kafka
                    success = producer.send_indicator_batch(indicators)
                    if success:
                        logger.info(f"    ✓ Sent to Kafka: {len(indicators.get('indicators', []))} indicators")
                    else:
                        logger.warning(f"    ✗ Failed to send: {name}")
                else:
                    logger.warning(f"    No data found for {name}")
                    
            except Exception as e:
                logger.error(f"    Error processing {name}: {e}")
                continue
        
        # Flush pending messages
        producer.flush()
        logger.info("✓ World Bank pipeline complete")
        
    except Exception as e:
        logger.error(f"World Bank pipeline error: {e}")


async def run_consumers(duration_seconds: int = 30):
    """Run Kafka consumers to process messages."""
    logger.info("="*70)
    logger.info(f"Starting Kafka Consumers (running for {duration_seconds}s)")
    logger.info("="*70)
    
    try:
        mea_consumer = MEARelationConsumer()
        econ_consumer = EconomicIndicatorConsumer()
        
        # Run consumers for a limited time
        start_time = datetime.utcnow()
        
        async def consume_with_timeout(consumer, timeout_sec):
            """Consume messages with timeout."""
            end_time = start_time.timestamp() + timeout_sec
            
            try:
                # Note: This would normally block, but for demo we just log
                logger.info(f"Consumer {consumer.__class__.__name__} ready to process messages from Kafka")
                await asyncio.sleep(timeout_sec)
                logger.info(f"Consumer {consumer.__class__.__name__} finished")
            except Exception as e:
                logger.error(f"Consumer error: {e}")
        
        # Run both consumers concurrently
        await asyncio.gather(
            consume_with_timeout(mea_consumer, duration_seconds),
            consume_with_timeout(econ_consumer, duration_seconds),
        )
        
        logger.info("✓ Consumers finished")
        
    except Exception as e:
        logger.error(f"Consumer error: {e}")


async def run_complete_pipeline():
    """Run the complete data pipeline."""
    logger.info("\n")
    logger.info("╔" + "="*68 + "╗")
    logger.info("║" + " "*68 + "║")
    logger.info("║" + "ONTORA DATA PIPELINE ORCHESTRATOR".center(68) + "║")
    logger.info("║" + " "*68 + "║")
    logger.info("╚" + "="*68 + "╝")
    logger.info("")
    
    try:
        # Step 1: Run MEA scraper
        await run_mea_pipeline()
        logger.info("")
        
        # Step 2: Run World Bank fetcher
        await run_worldbank_pipeline()
        logger.info("")
        
        # Step 3: Run consumers (if Kafka is available)
        # await run_consumers(duration_seconds=10)
        # logger.info("")
        
        logger.info("="*70)
        logger.info("✓ DATA PIPELINE ORCHESTRATION COMPLETE")
        logger.info("="*70)
        logger.info("")
        logger.info("Next Steps:")
        logger.info("  1. Verify Kafka messages were produced")
        logger.info("  2. Start Kafka consumers to process messages")
        logger.info("  3. Check PostgreSQL for ingested data")
        logger.info("  4. Query API endpoints for real data")
        logger.info("")
        
    except KeyboardInterrupt:
        logger.info("Pipeline interrupted by user")
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        return 1
    
    return 0


def main():
    """Main entry point."""
    # Run async pipeline
    exit_code = asyncio.run(run_complete_pipeline())
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
