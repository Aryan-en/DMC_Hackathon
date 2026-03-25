from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserResponse(BaseModel):
    """User response model (no password)."""
    id: str
    username: str
    email: str
    roles: List[str]
    clearance_level: str
    is_active: bool

class Token(BaseModel):
    """JWT Token model."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int

class TokenResponse(BaseModel):
    """Full token response with user info."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenData(BaseModel):
    """JWT Token payload data."""
    user_id: str
    username: str
    email: str
    roles: List[str]
    clearance_level: str
    exp: Optional[datetime] = None

class UserCredentials(BaseModel):
    """User login credentials."""
    username: str
    password: str

class UserRegistration(BaseModel):
    """User registration payload."""
    username: str
    email: str
    password: str
    clearance_level: str = "UNCLASS"
    roles: Optional[List[str]] = None
