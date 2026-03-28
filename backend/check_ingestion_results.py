import asyncio
from db.postgres import AsyncSessionLocal
from sqlalchemy import select, func
from db.schemas import Document, Entity

async def check():
    async with AsyncSessionLocal() as session:
        output = []
        # Check source counts
        q = select(Document.source, func.count(Document.id)).group_by(Document.source)
        res = await session.execute(q)
        output.append("--- Document Source Counts ---")
        for source, count in res.all():
            output.append(f"{source}: {count}")
            
        # Check tactical categories
        q2 = select(Entity.entity_type, func.count(Entity.id)).group_by(Entity.entity_type)
        res2 = await session.execute(q2)
        output.append("\n--- Tactical Entity Categories ---")
        for ent_type, count in res2.all():
            output.append(f"{ent_type}: {count}")
            
        with open("ingestion_report.txt", "w") as f:
            f.write("\n".join(output))

if __name__ == "__main__":
    asyncio.run(check())
