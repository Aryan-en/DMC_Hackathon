"""Backend Service Management API."""

import random
import time
import subprocess
import os
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from utils.response import build_success, build_error

router = APIRouter()

class ServiceStatus(BaseModel):
    id: str
    name: str
    status: str  # online, offline, degraded, restarting, stopping
    uptime: float
    responseTime: int
    description: str
    icon: str
    lastHeartbeat: float

class ServiceLog(BaseModel):
    timestamp: str
    service_id: str
    level: str
    message: str

SERVICES_DB = {
    "postgres": {
        "id": "postgres",
        "name": "PostgreSQL Database",
        "status": "offline",
        "uptime": 0.0,
        "responseTime": 12,
        "description": "Primary data store for entity records and relationships",
        "icon": "Database",
    },
    "neo4j": {
        "id": "neo4j",
        "name": "Neo4j Graph DB",
        "status": "offline",
        "uptime": 0.0,
        "responseTime": 8,
        "description": "Knowledge graph and ontology engine",
        "icon": "Network",
    },
    "redis": {
        "id": "redis",
        "name": "Redis Cache",
        "status": "offline",
        "uptime": 0.0,
        "responseTime": 2,
        "description": "Distributed caching and session management",
        "icon": "Zap",
    },
    "kafka": {
        "id": "kafka",
        "name": "Kafka Streams",
        "status": "offline",
        "uptime": 0.0,
        "responseTime": 45,
        "description": "Real-time data pipeline and event streaming",
        "icon": "AlertCircle",
    },
    "backend": {
        "id": "backend",
        "name": "API Gateway",
        "status": "online",
        "uptime": 100.0,
        "responseTime": 5,
        "description": "FastAPI backend service orchestration",
        "icon": "Zap",
    },
    "celery": {
        "id": "celery",
        "name": "Task Worker",
        "status": "offline",
        "uptime": 0.0,
        "responseTime": 15,
        "description": "Background task processing and ingestion",
        "icon": "Layers",
    }
}

# Mapping of logical service IDs to Docker container names
CONTAINER_MAP = {
    "postgres": "ontora-postgres",
    "neo4j": "ontora-neo4j",
    "redis": "ontora-redis",
    "kafka": "ontora-kafka-1",  # Primary broker for health
    "backend": "ontora-backend",
    "celery": "ontora-celery-worker"
}

def get_docker_status(service_id: str) -> str:
    """Get actual container status via docker ps, supporting both full and lite modes."""
    base_name = CONTAINER_MAP.get(service_id)
    if not base_name:
        return SERVICES_DB.get(service_id, {}).get("status", "unknown")
    
    # Try both standard and lite names
    for name in [base_name, f"{base_name}-lite"]:
        try:
            result = subprocess.run(
                ["docker", "ps", "-a", "--filter", f"name={name}$", "--format", "{{.State}}"],
                capture_output=True, text=True, check=False
            )
            status = result.stdout.strip().lower()
            if "running" in status:
                return "online"
            if "restarting" in status:
                return "restarting"
            if status: # If we found a container but it's not running/restarting
                return "offline"
        except Exception:
            continue
            
    return "offline"

def run_docker_command(service_id: str, action: str):
    """Execute docker-compose command for a service."""
    # Action map: start, stop, restart
    cmd_map = {
        "start": ["up", "-d"],
        "stop": ["stop"],
        "restart": ["restart"]
    }
    
    # Locate docker-compose file relative to workspace root
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    compose_file = os.path.join(root_dir, "..", "infra", "docker", "docker-compose.yml")
    
    try:
        if action == "start":
            subprocess.Popen(["docker", "compose", "-f", compose_file, "up", "-d", service_id])
        else:
            subprocess.Popen(["docker", "compose", "-f", compose_file, action, service_id])
        return True
    except Exception as e:
        print(f"Docker command failed: {e}")
        return False

@router.get("/api-health")
async def get_api_health():
    """Check health of key system API endpoints."""
    endpoints = [
        {"id": "auth", "name": "Authentication Gateway", "path": "/auth/me", "method": "GET"},
        {"id": "users", "name": "User Identity Provider", "path": "/users/", "method": "GET"},
        {"id": "intelligence", "name": "Intelligence Engine", "path": "/api/intelligence/entity-extraction", "method": "GET"},
        {"id": "knowledge_graph", "name": "Knowledge Graph", "path": "/api/knowledge-graph/nodes", "method": "GET"},
        {"id": "predictions", "name": "Predictive Analytics", "path": "/api/predictions/conflict-risk", "method": "GET"},
        {"id": "geospatial", "name": "Geospatial Intel", "path": "/api/geospatial/hotspots", "method": "GET"},
        {"id": "security", "name": "Security Hardening", "path": "/api/security/monitoring-dashboard", "method": "GET"},
        {"id": "monitoring", "name": "Security Monitoring", "path": "/api/security-monitoring/security/threats/summary", "method": "GET"},
        {"id": "bill_analysis", "name": "Legislative Intel", "path": "/api/bill-analysis/history", "method": "GET"},
        {"id": "data_lake", "name": "Data Lake Storage", "path": "/api/data-lake/summary", "method": "GET"},
        {"id": "streams", "name": "Event Streams", "path": "/api/streams/topics", "method": "GET"},
        {"id": "tasks", "name": "Task Orchestrator", "path": "/api/tasks/status/0", "method": "GET"},
        {"id": "search", "name": "Global Search", "path": "/api/search/?q=ontora", "method": "GET"},
        {"id": "ontology", "name": "Ontology Manager", "path": "/api/ontology/version", "method": "GET"},
    ]
    
    health_results = []
    # Base URL for internal pings (since we are on the same server)
    import httpx
    
    async with httpx.AsyncClient() as client:
        for ep in endpoints:
            try:
                # We use a short timeout and check the root of each router
                # Internal host is usually localhost:8000
                url = f"http://localhost:8000{ep['path']}"
                response = await client.get(url, timeout=1.0)
                # Any response (even 401/404 if it's from FastAPI) means the router is 'alive'
                status = "operational" if response.status_code < 500 else "degraded"
                latency = response.elapsed.total_seconds() * 1000
            except Exception:
                status = "offline"
                latency = 0
                
            health_results.append({
                **ep,
                "status": status,
                "latency": round(latency, 2)
            })
            
    return build_success({"endpoints": health_results})

@router.get("/")
async def list_services():
    """List all infrastructure services and their health using a bulk Docker query."""
    container_stats = {}
    try:
        # Get all ontora- container statuses in one go
        result = subprocess.run(
            ["docker", "ps", "-a", "--format", "{{.Names}}:{{.State}}"],
            capture_output=True, text=True, check=False, timeout=5
        )
        if result.returncode == 0:
            docker_output = result.stdout.strip().split("\n")
            for line in docker_output:
                if ":" in line:
                    name, state = line.split(":", 1)
                    container_stats[name] = state.lower()
    except Exception as e:
        # Log error but don't crash
        print(f"Docker discovery error: {e}")

    services = []
    try:
        for sid, info in SERVICES_DB.items():
            base_name = CONTAINER_MAP.get(sid)
            real_status = "offline"
            
            if base_name:
                # Check both standard and lite names in the pre-fetched stats
                for name in [base_name, f"{base_name}-lite"]:
                    state = container_stats.get(name, "")
                    if "running" in state:
                        real_status = "online"
                        break
                    if "restarting" in state:
                        real_status = "restarting"
                        break
                    if state: # Any other state (exited, created) means we found the container but it's offline
                        real_status = "offline"
                        break
            
            # Randomize response time slightly for "live" feel if online
            resp_time = info.get("responseTime", 10) + random.randint(-2, 2) if real_status == "online" else 0
            uptime = info.get("uptime", 0) if real_status == "online" else 0.0
            
            services.append({
                **info,
                "status": real_status,
                "responseTime": max(0, resp_time),
                "uptime": uptime,
                "lastHeartbeat": round(random.random() * 3, 1) if real_status == "online" else 999
            })
        return build_success({"services": services})
    except Exception as e:
        return build_error("API_ERROR", f"Error building service list: {str(e)}")

@router.post("/start-all")
async def start_all_services():
    """Trigger a sequential startup of all mesh components."""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    compose_file = os.path.normpath(os.path.join(root_dir, "..", "infra", "docker", "docker-compose.yml"))
    
    try:
        # Start all core infra services
        # If full compose fails, try lite
        try:
            subprocess.Popen(["docker", "compose", "-f", compose_file, "up", "-d"])
        except Exception:
            lite_file = compose_file.replace("docker-compose.yml", "docker-compose.lite.yml")
            subprocess.Popen(["docker", "compose", "-f", lite_file, "up", "-d"])
            
        return build_success({"message": "Global mesh initialization sequence started."})
    except Exception as e:
        return build_error("DOCKER_ERROR", f"Failed to initiate startup: {str(e)}")

@router.post("/{service_id}/start")
async def start_service(service_id: str):
    """Simulate starting a service."""
    if service_id not in SERVICES_DB:
        return build_error("NOT_FOUND", f"Service {service_id} not found")
    
    success = run_docker_command(service_id, "start")
    if success:
        return build_success({"status": "restarting", "message": f"Service {service_id} startup initiated."})
    return build_error("DOCKER_ERROR", "Failed to communicate with Docker daemon")

@router.post("/{service_id}/restart")
async def restart_service(service_id: str):
    """Simulate a service restart."""
    if service_id not in SERVICES_DB:
        return build_error("NOT_FOUND", f"Service {service_id} not found")
    
    success = run_docker_command(service_id, "restart")
    if success:
        return build_success({"status": "restarting", "message": f"Service {service_id} restart initiated."})
    return build_error("DOCKER_ERROR", "Failed to communicate with Docker daemon")

@router.post("/{service_id}/stop")
async def stop_service(service_id: str):
    """Simulate stopping a service."""
    if service_id not in SERVICES_DB:
        return build_error("NOT_FOUND", f"Service {service_id} not found")
    
    success = run_docker_command(service_id, "stop")
    if success:
        return build_success({"status": "stopping", "message": f"Service {service_id} shutdown initiated."})
    return build_error("DOCKER_ERROR", "Failed to communicate with Docker daemon")

@router.get("/{service_id}/logs")
async def get_service_logs(service_id: str):
    """Fetch real log lines for the service via docker logs, supporting lite mode."""
    try:
        base_name = CONTAINER_MAP.get(service_id)
        if not base_name:
            return build_error("NOT_FOUND", "No container mapping found for this service")
        
        # Identify which container exists (standard or lite)
        target_name = None
        # Bulk check Names to avoid multiple subprocess calls
        res = subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}"], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            names = res.stdout.strip().split("\n")
            for name in [base_name, f"{base_name}-lite"]:
                if name in names:
                    target_name = name
                    break
                
        if not target_name:
            return build_success({"logs": [{"timestamp": "--:--:--", "service_id": service_id, "level": "DEBUG", "message": f"Service '{service_id}' container not found. Start it from the panel."}]})

        result = subprocess.run(
            ["docker", "logs", "--tail", "50", target_name],
            capture_output=True, text=True, check=False, timeout=5
        )
        raw_logs = result.stdout + result.stderr
        
        # Parse logs into structured format
        log_lines = []
        for line in raw_logs.strip().split("\n"):
            if not line.strip(): continue
            msg = line.strip()
            
            level = "INFO"
            if "ERROR" in msg or "Exception" in msg or "failed" in msg.lower():
                level = "ERROR"
            elif "WARN" in msg or "Warning" in msg:
                level = "WARNING"
            
            log_lines.append({
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "service_id": service_id,
                "level": level,
                "message": msg
            })
            
        if not log_lines:
            return build_success({"logs": [{"timestamp": "--:--:--", "service_id": service_id, "level": "DEBUG", "message": "Waiting for container logs..."}]})
            
        return build_success({"logs": log_lines})
        
    except Exception as e:
        return build_error("API_ERROR", f"Could not fetch real logs: {str(e)}")
