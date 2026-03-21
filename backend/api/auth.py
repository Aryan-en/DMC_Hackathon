"""Authentication & User Management API Endpoints."""

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.postgres import get_db_session
from db.schemas import User
from services.auth import (
    UserCredentials, UserRegistration, Token,
    hash_password, verify_password,
    create_access_token, create_refresh_token, verify_token, verify_refresh_token
)
from services.rbac import UserRole, ClearanceLevel, RBACContext
from utils.response import build_success, build_error

router = APIRouter(prefix="/auth", tags=["authentication"])


class UserResponse(BaseModel):
    """User response model (no password)."""
    id: str
    username: str
    email: str
    roles: list[str]
    clearance_level: str
    is_active: bool


class TokenResponse(BaseModel):
    """Token response model."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Dependency: Get current user from token
async def get_current_user(
    token: str = None,
    db: AsyncSession = Depends(get_db_session)
) -> RBACContext:
    """Extract and validate JWT token, return RBAC context."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token"
        )
    
    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return RBACContext(
        user_id=token_data.user_id,
        username=token_data.username,
        roles=token_data.roles,
        clearance=token_data.clearance_level
    )


def require_permission(resource: str, action: str):
    """Dependency: Require specific permission."""
    async def check_permission(current_user: RBACContext = Depends(get_current_user)):
        if not current_user.has_permission(resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {action} on {resource}"
            )
        return current_user
    return check_permission


def require_role(*roles: UserRole):
    """Dependency: Require one of specified roles."""
    async def check_role(current_user: RBACContext = Depends(get_current_user)):
        if not any(UserRole(r) in current_user.roles for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {', '.join(r.value for r in roles)}"
            )
        return current_user
    return check_role


@router.post("/register", response_model=TokenResponse)
async def register(
    payload: UserRegistration,
    db: AsyncSession = Depends(get_db_session)
):
    """Register new user account."""
    try:
        # Check if user exists
        result = await db.execute(
            select(User).where(User.username == payload.username)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            return build_error("USER_EXISTS", f"Username '{payload.username}' already exists")
        
        # Check email
        result = await db.execute(
            select(User).where(User.email == payload.email)
        )
        if result.scalar_one_or_none():
            return build_error("EMAIL_EXISTS", f"Email '{payload.email}' already registered")
        
        # Create user
        hashed_password = hash_password(payload.password)
        new_user = User(
            username=payload.username,
            email=payload.email,
            hashed_password=hashed_password,
            full_name=payload.username,
            roles=payload.roles if isinstance(payload.roles, list) else [UserRole.ANALYST.value],
            clearance_level=payload.clearance_level,
            is_active=True
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Generate tokens
        access_token = create_access_token(
            user_id=str(new_user.id),
            username=new_user.username,
            email=new_user.email,
            roles=new_user.roles,
            clearance_level=new_user.clearance_level
        )
        
        refresh_token = create_refresh_token(
            user_id=str(new_user.id),
            username=new_user.username
        )
        
        return build_success({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 30 * 60,  # 30 minutes
            "user": {
                "id": str(new_user.id),
                "username": new_user.username,
                "email": new_user.email,
                "roles": new_user.roles,
                "clearance_level": new_user.clearance_level,
                "is_active": new_user.is_active
            }
        })
    
    except Exception as e:
        return build_error("REGISTRATION_ERROR", str(e))


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: UserCredentials,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticate user and return JWT tokens."""
    try:
        # Find user
        result = await db.execute(
            select(User).where(User.username == payload.username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(payload.password, user.password_hash):
            return build_error("AUTH_FAILED", "Invalid username or password")
        
        if not user.is_active:
            return build_error("USER_INACTIVE", "User account is disabled")
        
        # Generate tokens
        access_token = create_access_token(
            user_id=str(user.id),
            username=user.username,
            email=user.email,
            roles=user.roles,
            clearance_level=user.clearance_level
        )
        
        refresh_token = create_refresh_token(
            user_id=str(user.id),
            username=user.username
        )
        
        return build_success({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 30 * 60,
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "roles": user.roles,
                "clearance_level": user.clearance_level,
                "is_active": user.is_active
            }
        })
    
    except Exception as e:
        return build_error("LOGIN_ERROR", str(e))


@router.post("/refresh")
async def refresh_access_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Refresh access token using refresh token."""
    try:
        token_data = verify_refresh_token(refresh_token)
        if not token_data:
            return build_error("INVALID_TOKEN", "Invalid or expired refresh token")
        
        # Get user
        result = await db.execute(
            select(User).where(User.id == token_data["user_id"])
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            return build_error("USER_NOT_FOUND", "User not found or inactive")
        
        # Generate new access token
        access_token = create_access_token(
            user_id=str(user.id),
            username=user.username,
            email=user.email,
            roles=user.roles,
            clearance_level=user.clearance_level
        )
        
        return build_success({
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 30 * 60
        })
    
    except Exception as e:
        return build_error("TOKEN_ERROR", str(e))


@router.get("/me")
async def get_current_user_info(
    current_user: RBACContext = Depends(get_current_user)
):
    """Get current user info and RBAC context."""
    return build_success(current_user.to_dict())


@router.get("/permissions")
async def get_user_permissions(
    current_user: RBACContext = Depends(get_current_user)
):
    """Get all permissions for current user."""
    try:
        return build_success({
            "user": current_user.username,
            "roles": [r.value for r in current_user.roles],
            "clearance_level": current_user.clearance.value,
            "accessible_resources": list(current_user.get_accessible_resources()),
            "permission_matrix": {r.value: {} for r in current_user.roles}
        })
    except Exception as e:
        return build_error("PERMISSION_ERROR", str(e))
