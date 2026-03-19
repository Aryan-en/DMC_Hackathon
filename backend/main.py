"""
ONTORA Backend - FastAPI Application Entry Point
Classification: UNCLASSIFIED
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from db.postgres import init_db as init_postgres_db
from db.neo4j import init_driver as init_neo4j_driver
from api import metrics, intelligence, knowledge_graph, geospatial

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting ONTORA Backend...")
    
    # Initialize databases
    try:
        await init_postgres_db()
        logger.info("PostgreSQL initialized")
    except Exception as e:
        logger.error(f"PostgreSQL initialization failed: {e}")
    
    try:
        init_neo4j_driver()
        logger.info("Neo4j initialized")
    except Exception as e:
        logger.error(f"Neo4j initialization failed: {e}")
    
    logger.info("ONTORA Backend ready!")
    yield
    
    logger.info("Shutting down ONTORA Backend...")
    # Cleanup
    logger.info("Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="ONTORA Global Intelligence Platform",
    description="Backend API for Global Intelligence & Ontology Analysis",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health():
    """System health check"""
    return {
        "status": "ok",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/version")
async def version():
    """Get API version"""
    return {
        "version": "0.1.0",
        "api_version": "v1",
        "status": "operational"
    }


# Include routers
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["Knowledge Graph"])
app.include_router(geospatial.router, prefix="/api/geospatial", tags=["Geospatial"])


# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": {
                "code": exc.detail,
                "message": str(exc.detail)
            },
            "data": None
        }
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint - welcome message"""
    return {
        "message": "Welcome to ONTORA Global Intelligence Platform",
        "status": "operational",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
