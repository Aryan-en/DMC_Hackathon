"""OAuth2 Authentication and JWT Token Management Service."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import os

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class Token(BaseModel):
    """JWT Token response model."""
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    """JWT Token payload data."""
    user_id: str
    username: str
    email: str
    roles: list[str]
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


def hash_password(password: str) -> str:
    """Hash a password for secure storage."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    user_id: str,
    username: str,
    email: str,
    roles: list[str],
    clearance_level: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "roles": roles,
        "clearance_level": clearance_level,
        "exp": expire,
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(user_id: str, username: str) -> str:
    """Create JWT refresh token."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "user_id": user_id,
        "username": username,
        "exp": expire,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[TokenData]:
    """Verify and decode JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        username: str = payload.get("username")
        email: str = payload.get("email")
        roles: list = payload.get("roles", [])
        clearance_level: str = payload.get("clearance_level", "UNCLASS")
        
        if user_id is None or username is None:
            return None
        
        return TokenData(
            user_id=user_id,
            username=username,
            email=email,
            roles=roles,
            clearance_level=clearance_level
        )
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode refresh token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return {"user_id": payload.get("user_id"), "username": payload.get("username")}
    except JWTError:
        return None


class OAuth2Provider:
    """OAuth2 provider implementation."""
    
    SUPPORTED_PROVIDERS = ["google", "github", "microsoft"]
    
    @staticmethod
    def get_oauth_config(provider: str) -> dict:
        """Get OAuth2 configuration for a provider."""
        configs = {
            "google": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
                "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token"
            },
            "github": {
                "client_id": os.getenv("GITHUB_CLIENT_ID", ""),
                "client_secret": os.getenv("GITHUB_CLIENT_SECRET", ""),
                "authorize_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token"
            },
            "microsoft": {
                "client_id": os.getenv("AZURE_CLIENT_ID", ""),
                "client_secret": os.getenv("AZURE_CLIENT_SECRET", ""),
                "tenant": os.getenv("AZURE_TENANT_ID", "common"),
                "authorize_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
                "token_url": "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token"
            }
        }
        
        return configs.get(provider, {})
