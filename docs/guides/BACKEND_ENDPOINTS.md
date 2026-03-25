# ONTORA Backend API Endpoints Reference

## Global Health Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Welcome message |
| `/health` | GET | System health check |
| `/api/health` | GET | Dependency-aware API health (postgres, neo4j, kafka, redis) |
| `/api/version` | GET | Get API version info |
| `/api/monitoring/performance` | GET | Performance metrics (requests, errors, latency) |
| `/metrics` | GET | Prometheus-format metrics |

---

## Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user account |
| `/api/auth/login` | POST | Authenticate user and return JWT tokens |
| `/api/auth/refresh` | POST | Refresh access token using refresh token |
| `/api/auth/me` | GET | Get current user info and RBAC context |
| `/api/auth/permissions` | GET | Get all permissions for current user |

---

## User Management Endpoints (`/api/users`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/` | GET | List all users (admin only) |
| `/api/users/` | POST | Create new user (admin only) |
| `/api/users/{user_id}` | GET | Get user details (admin only) |
| `/api/users/{user_id}` | PUT | Update user (admin only) |
| `/api/users/{user_id}` | DELETE | Delete user (admin only) |

---

## Metrics Endpoints (`/api/metrics`) ⚠️ *ISSUE LOCATION*

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/regional-risk` | GET | Risk metrics by region |
| `/api/metrics/global-entities` | GET | Global entity counts (nations, organizations, individuals, events) |
| `/api/metrics/threat-threads` | GET | Threat classification (critical, high, monitor) |
| `/api/metrics/daily-ingestion` | GET | Daily data ingestion metrics (GB, realtime vs batch) |
| `/api/metrics/prediction-accuracy` | GET | Model accuracy/precision/recall/f1 metrics |
| `/api/metrics/infrastructure-health` | GET | Infrastructure component health (Kafka, Neo4j, ML, Vector, Flink) |
| `/api/metrics/kg-nodes` | GET | Knowledge graph node metrics |

---

## Intelligence Endpoints (`/api/intelligence`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/intelligence/entity-extraction` | GET | Last 24h entity extractions |
| `/api/intelligence/language-distribution` | GET | Document language breakdown |
| `/api/intelligence/trending-keywords` | GET | Top trending keywords with velocity |
| `/api/intelligence/sentiment-radar` | GET | Sentiment analysis by domain |
| `/api/intelligence/strategic-briefs` | GET | Strategic intelligence briefs |
| `/api/intelligence/pipeline-status` | GET | Processing pipeline status (spaCy, LLM, Vector, Whisper) |
| `/api/intelligence/classify` | POST | LLM-backed text classification |
| `/api/intelligence/sentiment` | POST | Refined sentiment scoring |
| `/api/intelligence/entity-linking` | POST | Entity extraction and canonical linking |
| `/api/intelligence/relationship-extraction` | POST | SPO triplet extraction |
| `/api/intelligence/llm-health` | GET | Ollama and model readiness |
| `/api/intelligence/processing-log` | GET | Recent backend intelligence processing events |

---

## Knowledge Graph Endpoints (`/api/knowledge-graph`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/knowledge-graph/nodes` | GET | Node types and counts |
| `/api/knowledge-graph/relationships` | GET | Relationship types with strength |
| `/api/knowledge-graph/shacl-validation-summary` | GET | SHACL-style constraint status |
| `/api/knowledge-graph/conflict-detection` | GET | Conflict hotspot metrics from graph relations |
| `/api/knowledge-graph/centrality-stats` | GET | Degree centrality overview |
| `/api/knowledge-graph/paths/{source}/{target}` | GET | Multi-hop causal paths |
| `/api/knowledge-graph/seed-data` | POST | Populate knowledge graph with sample entities |

---

## Geospatial Endpoints (`/api/geospatial`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/geospatial/hotspots` | GET | Global conflict hotspots (100+ countries) |
| `/api/geospatial/climate-indicators` | GET | Regional climate data (100+ regions) |
| `/api/geospatial/incidents/global` | GET | Global geopolitical incidents (100+ events) |
| `/api/geospatial/incidents/{region}` | GET | Regional incidents |
| `/api/geospatial/heatmap` | GET | Risk heatmap data (Week 12: PostGIS) |
| `/api/geospatial/region-analysis/{region}` | GET | Regional geospatial analysis |
| `/api/geospatial/coordinate-index` | GET | Coordinate indexing for all entities (Week 12) |
| `/api/geospatial/economic-activity` | GET | Economic activity mapping (GDP, industries, agriculture) |

---

## Predictions Endpoints (`/api/predictions`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predictions/conflict-risk` | GET | Conflict risk forecast |
| `/api/predictions/model-performance` | GET | Model accuracy/precision/recall/f1/AUC-ROC |
| `/api/predictions/model-drift` | GET | Model drift detection |
| `/api/predictions/training-status` | GET | Pipeline status for model training lifecycle |
| `/api/predictions/serving-health` | GET | Prediction model serving health and SLO |
| `/api/predictions/dashboard-overview` | GET | Aggregated prediction dashboard KPIs |
| `/api/predictions/pyg-model/status` | GET | Graph model serving status |
| `/api/predictions/pyg-model/predict` | POST | Risk inference from graph features |
| `/api/predictions/ab-testing/variants` | GET | Active experiment variants |
| `/api/predictions/ab-testing/assignment` | GET | Deterministic user/session assignment |
| `/api/predictions/ab-testing/summary` | GET | Experiment KPI summary |
| `/api/predictions/training-pipeline/jobs` | POST | Start async training orchestration job |
| `/api/predictions/training-pipeline/jobs/{job_id}` | GET | Retrieve orchestration job state |
| `/api/predictions/training-pipeline/runs` | GET | Historical training runs |
| `/api/predictions/training-pipeline/artifacts` | GET | Artifact metadata catalogue |

---

## Streams Endpoints (`/api/streams`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/streams/topics` | GET | Kafka topics with lag and throughput |
| `/api/streams/pipelines` | GET | Flink pipeline status |
| `/api/streams/kafka/lag` | GET | Kafka consumer lag monitoring |
| `/api/streams/flink/clusters` | GET | Flink cluster status |
| `/api/streams/alerts` | GET | Real-time stream alerts |
| `/api/streams/aggregations` | GET | Streaming aggregations |

---

## Data Lake Endpoints (`/api/data-lake`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/data-lake/summary` | GET | Data lake summary (size, record count, datasets) |
| `/api/data-lake/datasets` | GET | Dataset metadata (economic indicators, relations, documents, entities) |
| `/api/data-lake/quality` | GET | Data quality metrics (completeness, accuracy) |
| `/api/data-lake/lineage` | GET | Data lineage tracking |
| `/api/data-lake/costs` | GET | Query cost monitoring |
| `/api/data-lake/materialized-views` | GET | Materialized views metadata |

---

## Security Endpoints (`/api/security`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/security/audit-log` | GET | Audit log with filters |
| `/api/security/violations-trend` | GET | 7-day violation trends |
| `/api/security/access-check` | POST | Check resource access by clearance |
| `/api/security/monitoring-dashboard` | GET | Security monitoring dashboard |
| `/api/security/export-request` | POST | Create data export request |
| `/api/security/export-requests/{request_id}` | GET | Retrieve export request status |
| `/api/security/export-requests` | GET | List export requests |
| `/api/security/export-approve` | POST | Approve or deny export request |
| `/api/security/data-classification/{resource_type}` | GET | Get data classification for resource |
| `/api/security/pending-approvals` | GET | Get pending export approvals (admin) |

---

## Security Monitoring Endpoints (`/api/security-monitoring`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/security-monitoring/threats/summary` | GET | Current security threat summary |
| `/api/security-monitoring/threats/critical` | GET | Critical unresolved security threats (admin only) |
| `/api/security-monitoring/events/recent` | GET | Recent security events |
| `/api/security-monitoring/classification/{resource}` | GET | Resource classification and access controls |
| `/api/security-monitoring/classifications` | GET | List classifications for all resources |
| `/api/security-monitoring/export/request` | POST | Request data export approval |
| `/api/security-monitoring/export/pending` | GET | Pending export requests (admin only) |
| `/api/security-monitoring/export/{export_id}/approve` | POST | Approve data export request (admin only) |
| `/api/security-monitoring/export/history` | GET | User's export request history |

---

## Issue: Live Backend Metrics Unavailable

### Problem
Frontend shows error: "Live backend metrics unavailable: Failed to fetch. Displaying latest available live-response state."

### Root Causes
1. **Backend not running** - FastAPI server not started on `http://localhost:8000`
2. **Database connection issue** - PostgreSQL/Neo4j not accessible
3. **CORS misconfiguration** - Frontend blocked by CORS policy
4. **No seed data** - Database empty, all metrics return empty

### Solution Steps

#### 1. Start the Backend
```powershell
cd d:\DMC_Hackathon\backend
python main.py
```

#### 2. Seed Database with Sample Data
```powershell
# Run from backend directory
python seed_simple.py
# or for more comprehensive data
python seed_knowledge_graph.py
```

#### 3. Verify Backend Health
```bash
curl http://localhost:8000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "checks": {
    "postgres": "ok",
    "neo4j": "ok",
    "kafka": "unknown",
    "redis": "unknown"
  },
  "version": "0.1.0",
  "environment": "development"
}
```

#### 4. Test Metrics Endpoint
```bash
curl http://localhost:8000/api/metrics/regional-risk
```

### Environment Variables Check
Ensure `.env` file exists with:
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ontora_db
NEO4J_HOST=localhost
NEO4J_PORT=7687
API_HOST=0.0.0.0
API_PORT=8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Quick Reference: By Feature

### Monitoring & Metrics
- `/api/monitoring/performance` - Backend performance
- `/api/metrics/*` - Strategic dashboard metrics
- `/metrics` - Prometheus format

### Data Ingestion  
- `/api/streams/topics` - Kafka topics
- `/api/streams/pipelines` - Flink pipelines
- `/api/data-lake/*` - Data lake management

### Intelligence & Analysis
- `/api/intelligence/*` - NLP/LLM services
- `/api/knowledge-graph/*` - Knowledge graph operations
- `/api/geospatial/*` - Geopolitical analysis

### Predictions & ML
- `/api/predictions/*` - Risk prediction models

### Security & Compliance
- `/api/security/*` - Access control & audit
- `/api/security-monitoring/*` - Security events

### Administration
- `/api/users/*` - User management
- `/api/auth/*` - Authentication
