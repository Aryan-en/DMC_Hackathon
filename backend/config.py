"""
ONTORA Backend Configuration Management
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings


ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = Path(__file__).resolve().parent
ENV_CANDIDATES = [
    ROOT_DIR / ".env",
    BACKEND_DIR / ".env",
]


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Application
    APP_NAME: str = "ONTORA"
    VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3002",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "https://ontora.example.com"
    ]
    
    # PostgreSQL Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "ontora_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "ontora_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "ontora_prod")
    POSTGRES_URL: Optional[str] = os.getenv("POSTGRES_URL")
    
    # Neo4j Configuration
    NEO4J_HOST: str = os.getenv("NEO4J_HOST", "localhost")
    NEO4J_PORT: int = int(os.getenv("NEO4J_PORT", "7687"))
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "neo4j_password")
    NEO4J_URL: Optional[str] = os.getenv("NEO4J_URL")
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    
    # Kafka Configuration
    KAFKA_BROKERS: str = os.getenv("KAFKA_BROKERS", "localhost:9092")
    KAFKA_BROKERS_LIST: Optional[List[str]] = None
    ACTIVE_ENV_FILE: str = "none"
    
    # ML Models
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3")
    OLLAMA_TIMEOUT_SEC: int = int(os.getenv("OLLAMA_TIMEOUT_SEC", "20"))
    SPACY_MODEL: str = os.getenv("SPACY_MODEL", "en_core_web_sm")
    
    # Data Sources
    MEA_BASE_URL: str = "https://www.mea.gov.in"
    WORLDBANK_API_BASE: str = "https://api.worldbank.org/v2"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    
    class Config:
        env_file = (
            str(ROOT_DIR / ".env"),
            str(BACKEND_DIR / ".env"),
            ".env",
        )
        case_sensitive = True
    
    def __init__(self, **data):
        super().__init__(**data)
        
        # Build connection URLs
        if not self.POSTGRES_URL:
            self.POSTGRES_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        
        if not self.NEO4J_URL:
            self.NEO4J_URL = f"bolt://{self.NEO4J_HOST}:{self.NEO4J_PORT}"
        
        if not self.REDIS_URL:
            self.REDIS_URL = (
                f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}"
                if self.REDIS_PASSWORD else f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"
            )
        
        self.KAFKA_BROKERS_LIST = [
            broker.strip() for broker in self.KAFKA_BROKERS.split(",")
        ]

        self.ACTIVE_ENV_FILE = self._detect_active_env_file()

    def _detect_active_env_file(self) -> str:
        for candidate in ENV_CANDIDATES:
            if candidate.exists():
                return str(candidate)
        return "process_environment_only"


# Global settings instance
settings = Settings()
