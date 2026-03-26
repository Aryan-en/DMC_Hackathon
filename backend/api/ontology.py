"""Ontology versioning endpoints."""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from db.postgres import get_db_session
from db.schemas import OntologyVersion
from utils.response import build_error, build_success

router = APIRouter()


@router.get("/version")
async def get_version(db: AsyncSession = Depends(get_db_session)):
    try:
        result = await db.execute(
            select(OntologyVersion).order_by(OntologyVersion.applied_at.desc()).limit(1)
        )
        current = result.scalar_one_or_none()
        if current:
            return build_success({
                "version": current.version,
                "applied_at": current.applied_at.isoformat() if current.applied_at else None,
                "changes": current.changes,
                "current": current.current,
            })
        return build_success({"version": "unknown", "applied_at": None, "changes": None, "current": False})
    except Exception as exc:
        return build_error("QUERY_ERROR", str(exc))


@router.post("/version/update")
async def update_version(version: str, changes: Dict[str, Any], db: AsyncSession = Depends(get_db_session)):
    try:
        # Mark all existing versions as non-current
        await db.execute(update(OntologyVersion).values(current=False))
        new_ver = OntologyVersion(
            version=version,
            applied_at=datetime.utcnow(),
            changes=changes,
            current=True,
        )
        db.add(new_ver)
        await db.commit()
        return build_success({"message": "Ontology version updated", "version": version})
    except Exception as exc:
        await db.rollback()
        return build_error("UPDATE_ERROR", str(exc))
