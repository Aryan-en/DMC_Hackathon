"""
ONTORA Backend Configuration Management
"""

import os
from typing import List
from pydantic_settings import BaseSettings


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
        "http://localhost:8000",
        "https://ontora.example.com"
    ]
    
    # PostgreSQL Configuration
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", "5432"))
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "ontora_user")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "ontora_password")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "ontora_prod")
    POSTGRES_URL: str = None
    
    # Neo4j Configuration
    NEO4J_HOST: str = os.getenv("NEO4J_HOST", "localhost")
    NEO4J_PORT: int = int(os.getenv("NEO4J_PORT", "7687"))
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "neo4j_password")
    NEO4J_URL: str = None
    
    # Redis Configuration
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
    REDIS_URL: str = None
    
    # Kafka Configuration
    KAFKA_BROKERS: str = os.getenv("KAFKA_BROKERS", "localhost:9092")
    KAFKA_BROKERS_LIST: List[str] = None
    
    # ML Models
    OLLAMA_HOST: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    SPACY_MODEL: str = os.getenv("SPACY_MODEL", "en_core_web_sm")
    
    # Data Sources
    MEA_BASE_URL: str = "https://www.mea.gov.in"
    WORLDBANK_API_BASE: str = "https://api.worldbank.org/v2"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **data):
        super().__init__(**data)
        
        # Build connection URLs
        self.POSTGRES_URL = (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
        
        self.NEO4J_URL = (
            f"neo4j+s://{self.NEO4J_USER}:{self.NEO4J_PASSWORD}"
            f"@{self.NEO4J_HOST}:{self.NEO4J_PORT}"
        )
        
        self.REDIS_URL = (
            f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}"
            if self.REDIS_PASSWORD else f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}"
        )
        
        self.KAFKA_BROKERS_LIST = [
            broker.strip() for broker in self.KAFKA_BROKERS.split(",")
        ]


# Global settings instance
settings = Settings()
