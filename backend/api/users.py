"""User Management API Endpoints - Admin Only."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.postgres import get_db_session
from db.schemas import User
from api.auth import get_current_user, require_role
from services.rbac import UserRole, RBACContext
from services.auth import hash_password
from services.audit import AuditLogger
from utils.response import build_success, build_error

router = APIRouter(prefix="/users", tags=["user-management"])


class UserCreateRequest(BaseModel):
    """Create user request."""
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    roles: list[str] = ["analyst"]
    clearance_level: str = "FOUO"


class UserUpdateRequest(BaseModel):
    """Update user request."""
    full_name: Optional[str] = None
    roles: Optional[list[str]] = None
    clearance_level: Optional[str] = None
    is_active: Optional[bool] = None


class UserListResponse(BaseModel):
    """User list response."""
    id: str
    username: str
    email: str
    full_name: Optional[str]
    roles: list[str]
    clearance_level: str
    is_active: bool


@router.get("/", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def list_users(
    db: AsyncSession = Depends(get_db_session),
    current_user: RBACContext = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """List all users (admin only)."""
    try:
        result = await db.execute(
            select(User).offset(skip).limit(limit)
        )
        users = result.scalars().all()
        
        user_list = [
            {
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "roles": u.roles,
                "clearance_level": u.clearance_level,
                "is_active": u.is_active,
            }
            for u in users
        ]
        
        # Audit log
        await AuditLogger.log_admin_action(
            db=db,
            user_id=current_user.user_id,
            action=AuditLogger.ACTION_READ,
            resource="users",
            status=AuditLogger.STATUS_SUCCESS,
            details={"count": len(user_list)}
        )
        
        return build_success({"users": user_list, "total": len(user_list)})
    
    except Exception as e:
        return build_error("LIST_ERROR", str(e))


@router.post("/", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def create_user(
    payload: UserCreateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: RBACContext = Depends(get_current_user)
):
    """Create new user (admin only)."""
    try:
        # Check if user exists
        result = await db.execute(
            select(User).where(User.username == payload.username)
        )
        if result.scalar_one_or_none():
            return build_error("USER_EXISTS", f"User '{payload.username}' already exists")
        
        # Create user
        new_user = User(
            username=payload.username,
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            roles=payload.roles,
            clearance_level=payload.clearance_level,
            is_active=True
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Audit log
        await AuditLogger.log_admin_action(
            db=db,
            user_id=current_user.user_id,
            action=AuditLogger.ACTION_USER_CREATE,
            resource=new_user.username,
            status=AuditLogger.STATUS_SUCCESS,
            details={"roles": payload.roles, "clearance": payload.clearance_level}
        )
        
        return build_success({
            "id": str(new_user.id),
            "username": new_user.username,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "roles": new_user.roles,
            "clearance_level": new_user.clearance_level,
            "is_active": new_user.is_active,
        })
    
    except Exception as e:
        return build_error("CREATE_ERROR", str(e))


@router.get("/{user_id}", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def get_user(
    user_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: RBACContext = Depends(get_current_user)
):
    """Get user details (admin only)."""
    try:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return build_error("NOT_FOUND", f"User '{user_id}' not found")
        
        return build_success({
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "roles": user.roles,
            "clearance_level": user.clearance_level,
            "is_active": user.is_active,
        })
    
    except Exception as e:
        return build_error("GET_ERROR", str(e))


@router.put("/{user_id}", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def update_user(
    user_id: str,
    payload: UserUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: RBACContext = Depends(get_current_user)
):
    """Update user (admin only)."""
    try:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return build_error("NOT_FOUND", f"User '{user_id}' not found")
        
        # Update fields
        changes = {}
        if payload.full_name is not None:
            user.full_name = payload.full_name
            changes["full_name"] = payload.full_name
        
        if payload.roles is not None:
            user.roles = payload.roles
            changes["roles"] = payload.roles
        
        if payload.clearance_level is not None:
            user.clearance_level = payload.clearance_level
            changes["clearance_level"] = payload.clearance_level
        
        if payload.is_active is not None:
            user.is_active = payload.is_active
            changes["is_active"] = payload.is_active
        
        await db.commit()
        await db.refresh(user)
        
        # Audit log
        await AuditLogger.log_admin_action(
            db=db,
            user_id=current_user.user_id,
            action="USER_UPDATE",
            resource=user.username,
            status=AuditLogger.STATUS_SUCCESS,
            details=changes
        )
        
        return build_success({
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "roles": user.roles,
            "clearance_level": user.clearance_level,
            "is_active": user.is_active,
        })
    
    except Exception as e:
        return build_error("UPDATE_ERROR", str(e))


@router.delete("/{user_id}", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db_session),
    current_user: RBACContext = Depends(get_current_user)
):
    """Delete user (admin only)."""
    try:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return build_error("NOT_FOUND", f"User '{user_id}' not found")
        
        username = user.username
        await db.delete(user)
        await db.commit()
        
        # Audit log
        await AuditLogger.log_admin_action(
            db=db,
            user_id=current_user.user_id,
            action=AuditLogger.ACTION_USER_DELETE,
            resource=username,
            status=AuditLogger.STATUS_SUCCESS
        )
        
        return build_success({"message": f"User '{username}' deleted"})
    
    except Exception as e:
        return build_error("DELETE_ERROR", str(e))
