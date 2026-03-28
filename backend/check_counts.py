import asyncio
from sqlalchemy import func, select
from db.postgres import engine
from db.schemas import Entity, Relationship, Document

async def check_counts():
    async with engine.connect() as conn:
        ent_count = (await conn.execute(select(func.count(Entity.id)))).scalar()
        rel_count = (await conn.execute(select(func.count(Relationship.id)))).scalar()
        doc_count = (await conn.execute(select(func.count(Document.id)))).scalar()
        
        with open("counts.txt", "w") as f:
            f.write(f"Entities: {ent_count}\n")
            f.write(f"Relationships: {rel_count}\n")
            f.write(f"Documents: {doc_count}\n")

if __name__ == "__main__":
    asyncio.run(check_counts())
