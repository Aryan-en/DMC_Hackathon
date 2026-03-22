"""
ONTORA Backend - FastAPI Application Entry Point
Classification: UNCLASSIFIED
"""

import logging
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse

from config import settings
from db.postgres import init_db as init_postgres_db
from db.neo4j import init_driver as init_neo4j_driver, verify_connection as verify_neo4j_connection
from api import metrics, intelligence, knowledge_graph, geospatial, predictions, streams, data_lake, security, auth, users, security_monitoring, bill_analysis
from services.llm_classifier import LLMClassifierService
from middleware.security_hardening import ProductionSecurityConfig

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
llm_preflight = LLMClassifierService()


monitoring_state = {
    "requests_total": 0,
    "errors_total": 0,
    "latency_total_ms": 0.0,
}


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting ONTORA Backend...")
    logger.info("Config source: %s", settings.ACTIVE_ENV_FILE)
    logger.info(
        "Service targets: postgres=%s:%s/%s neo4j=%s:%s redis=%s:%s ollama=%s model=%s",
        settings.POSTGRES_HOST,
        settings.POSTGRES_PORT,
        settings.POSTGRES_DB,
        settings.NEO4J_HOST,
        settings.NEO4J_PORT,
        settings.REDIS_HOST,
        settings.REDIS_PORT,
        settings.OLLAMA_HOST,
        settings.OLLAMA_MODEL,
    )
    
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

    try:
        llm_status = llm_preflight.model_status()
        if llm_status.get("model_available"):
            logger.info("Ollama model ready: %s", settings.OLLAMA_MODEL)
        elif llm_status.get("reachable"):
            logger.warning("Ollama reachable but model missing: %s", settings.OLLAMA_MODEL)
        else:
            logger.warning("Ollama not reachable at startup: %s", settings.OLLAMA_HOST)
    except Exception as e:
        logger.error(f"Ollama preflight failed: {e}")
    
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

# Apply production security hardening
if settings.ENVIRONMENT in ["production", "staging"]:
    ProductionSecurityConfig.apply_to_app(app)
    logger.info("Production security hardening enabled")


@app.middleware("http")
async def request_monitoring_middleware(request: Request, call_next):
    start = perf_counter()
    monitoring_state["requests_total"] += 1

    try:
        response = await call_next(request)
    except Exception:
        monitoring_state["errors_total"] += 1
        raise

    elapsed_ms = (perf_counter() - start) * 1000
    monitoring_state["latency_total_ms"] += elapsed_ms

    if response.status_code >= 500:
        monitoring_state["errors_total"] += 1

    return response


# Health check endpoint
@app.get("/health")
async def health():
    """System health check"""
    return {
        "status": "ok",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/health")
async def api_health():
    """Dependency-aware API health endpoint."""
    checks = {
        "postgres": "ok",
        "neo4j": "ok",
        "kafka": "unknown",
        "redis": "unknown",
    }

    try:
        neo_ok = await verify_neo4j_connection()
        checks["neo4j"] = "ok" if neo_ok else "degraded"
    except Exception:
        checks["neo4j"] = "down"

    status = "ok"
    if checks["neo4j"] in {"degraded", "down"}:
        status = "degraded"

    return {
        "status": status,
        "checks": checks,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/api/version")
async def version():
    """Get API version"""
    return {
        "version": "0.1.0",
        "api_version": "v1",
        "status": "operational"
    }


@app.get("/api/monitoring/performance")
async def monitoring_performance():
    total = monitoring_state["requests_total"]
    errors = monitoring_state["errors_total"]
    avg_latency_ms = (monitoring_state["latency_total_ms"] / total) if total else 0.0
    error_rate = (errors / total) if total else 0.0

    return {
        "status": "ok",
        "data": {
            "requests_total": total,
            "errors_total": errors,
            "avg_latency_ms": round(avg_latency_ms, 3),
            "error_rate": round(error_rate, 6),
        },
        "error": None,
    }


@app.get("/metrics")
async def prometheus_metrics():
    total = monitoring_state["requests_total"]
    errors = monitoring_state["errors_total"]
    avg_latency_ms = (monitoring_state["latency_total_ms"] / total) if total else 0.0

    payload = "\n".join(
        [
            "# HELP ontora_requests_total Total HTTP requests.",
            "# TYPE ontora_requests_total counter",
            f"ontora_requests_total {total}",
            "# HELP ontora_errors_total Total HTTP 5xx/error requests.",
            "# TYPE ontora_errors_total counter",
            f"ontora_errors_total {errors}",
            "# HELP ontora_avg_latency_ms Average request latency in milliseconds.",
            "# TYPE ontora_avg_latency_ms gauge",
            f"ontora_avg_latency_ms {round(avg_latency_ms, 3)}",
        ]
    )
    return PlainTextResponse(payload)


# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(users.router, tags=["User Management"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["Metrics"])
app.include_router(intelligence.router, prefix="/api/intelligence", tags=["Intelligence"])
app.include_router(knowledge_graph.router, prefix="/api/knowledge-graph", tags=["Knowledge Graph"])
app.include_router(geospatial.router, prefix="/api/geospatial", tags=["Geospatial"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(streams.router, prefix="/api/streams", tags=["Streams"])
app.include_router(data_lake.router, prefix="/api/data-lake", tags=["Data Lake"])
app.include_router(security.router, prefix="/api/security", tags=["Security"])
app.include_router(security_monitoring.router, prefix="/api/security-monitoring", tags=["Security Monitoring"])
app.include_router(bill_analysis.router, prefix="/api/bill-analysis", tags=["Bill Analysis"])


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
