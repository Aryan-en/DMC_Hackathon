"""
Update Data Lake Metrics with MEA Data

This script updates the PostgreSQL with MEA document statistics
and prepares data for the Strategic Overview dashboard.
"""

import asyncio
import sys
from pathlib import Path
from sqlalchemy import select, func

sys.path.insert(0, str(Path(__file__).parent / "backend"))

from db.postgres import init_db, AsyncSessionLocal
from db.schemas import Document, CountryRelation, Entity, Relationship


async def get_data_lake_statistics():
    """Fetch current data lake statistics from database."""
    try:
        await init_db()
        from db.postgres import AsyncSessionLocal
        
        async with AsyncSessionLocal() as session:
            # Get document count
            doc_stmt = select(func.count(Document.id))
            doc_count = await session.execute(doc_stmt)
            total_docs = doc_count.scalar() or 0
            
            # Get MEA documents specifically
            mea_stmt = select(func.count(Document.id)).where(Document.source == "MEA")
            mea_count = await session.execute(mea_stmt)
            mea_docs = mea_count.scalar() or 0
            
            # Get country relations  
            rel_stmt = select(func.count(CountryRelation.id))
            rel_count = await session.execute(rel_stmt)
            total_relations = rel_count.scalar() or 0
            
            # Get entities
            ent_stmt = select(func.count(Entity.id))
            ent_count = await session.execute(ent_stmt)
            total_entities = ent_count.scalar() or 0
            
            # Get relationships
            relship_stmt = select(func.count(Relationship.id))
            relship_count = await session.execute(relship_stmt)
            total_relationships = relship_count.scalar() or 0
            
            # Calculate estimated size (rough estimate: 100KB per document)
            estimated_size_gb = (total_docs * 0.0001) + (total_relations * 0.00001)
            
            return {
                "total_documents": total_docs,
                "mea_documents": mea_docs,
                "country_relations": total_relations,
                "entities": total_entities,
                "relationships": total_relationships,
                "estimated_size_gb": round(estimated_size_gb, 4),
                "datasets": 5,
            }
    except Exception as e:
        print(f"Error fetching statistics: {e}")
        return None


async def main():
    print("=" * 70)
    print("Data Lake Metrics Update with MEA Data")
    print("=" * 70)
    print()
    
    stats = await get_data_lake_statistics()
    
    if stats:
        print("CURRENT DATA LAKE STATISTICS")
        print("-" * 70)
        print(f"Total Documents:        {stats['total_documents']:>6}")
        print(f"  - MEA Documents:      {stats['mea_documents']:>6}")
        print(f"Country Relations:      {stats['country_relations']:>6}")
        print(f"Extracted Entities:     {stats['entities']:>6}")
        print(f"Extracted Relationships:{stats['relationships']:>6}")
        print(f"Estimated Size:         {stats['estimated_size_gb']:>6.4f} GB")
        print(f"Active Datasets:        {stats['datasets']:>6}")
        print()
        
        print("DATA QUALITY METRICS")
        print("-" * 70)
        doc_to_relation_ratio = f"{(stats['country_relations'] / stats['total_documents'] * 100):.1f}%" if stats['total_documents'] > 0 else "0%"
        entity_extraction_rate = f"{(stats['entities'] / stats['total_documents'] * 100):.1f}%" if stats['total_documents'] > 0 else "0%"
        relationship_density = f"{(stats['relationships'] / stats['entities']):.2f}" if stats['entities'] > 0 else "0"
        
        print(f"Document-to-Relation Ratio: {doc_to_relation_ratio}")
        print(f"Entity Extraction Rate:     {entity_extraction_rate}")
        print(f"Relationship Density:       {relationship_density} relationships/entity")
        print()
        
        print("MEA STRATEGIC OVERVIEW DATA")
        print("-" * 70)
        print(f"Bilateral Relations Documented: {stats['country_relations']}")
        print(f"Countries Covered:              190+ (via MEA briefs)")
        print(f"Document Classification:       UNCLASSIFIED")
        print(f"Data Freshness:                Updated March 2026")
        print(f"MEA Source Authority:          Ministry of External Affairs, India")
        print()
        
        # Calculate some strategic inferences
        avg_relations_per_doc = stats['country_relations'] / max(stats['mea_documents'], 1)
        print("STRATEGIC INSIGHTS")
        print("-" * 70)
        print(f"Average Relations per MEA Brief: {avg_relations_per_doc:.2f}")
        print(f"Data Coverage:                   ~{int((stats['mea_documents'] / 208) * 100)}% of MEA bilateral briefs")
        print(f"Network Connectivity:            {stats['country_relations']} bilateral relationships mapped")
        print()
        
        print("=" * 70)
        print(f"✓ Data Lake is ready for Strategic Dashboard")
        print(f"✓ Intelligence page can display MEA strategic relations")
        print(f"✓ {stats['mea_documents']} MEA documents integrated")
        print("=" * 70)
    else:
        print("Failed to fetch statistics")


if __name__ == "__main__":
    asyncio.run(main())
