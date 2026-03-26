# DMC Hackathon Features & API Docs

This document explains the features implemented in this repository from a “feature surface” point of view:

1. Frontend (Next.js) dashboards/pages and what each one shows.
2. Backend (FastAPI) REST endpoints grouped by module (extracted from `backend/api/*.py`).
3. Core supporting systems: bill analysis, NLP/LLM intelligence, knowledge graph, geospatial decision intelligence, predictions monitoring, streaming/data-lake visibility, and security/governance workflows.

## System Architecture (At a Glance)

### Frontend
- Next.js (React) app under `app/`
- Shared layout components under `components/` and `app/components/`
- Data access via `app/lib/api.ts` and custom hooks under `app/hooks/`

### Backend
- FastAPI app entry point: `backend/main.py`
- Central settings: `backend/config.py`
- Standard API response helpers:
  - `backend/utils/response.py` (`build_success`, `build_error`)

### Storage & Compute
- PostgreSQL for relational state and audit logs (`backend/db/schemas.py`, `backend/db/postgres.py`)
- Neo4j for knowledge graph + causal paths (`backend/db/neo4j.py`)
- Kafka for ingest/stream monitoring (`backend/ingestors/*`, `backend/consumers/*`, surfaced via `/api/streams/*`)
- Ollama + spaCy + heuristic fallbacks for classification/NLP (`backend/services/*`, surfaced via `/api/intelligence/*`)
- Bill analysis LLM providers:
  - Gemini and/or Grok for PDF amendment analysis (`backend/services/grok_bill_analyzer.py`)

## Frontend: Pages & User-Facing Features

The sidebar navigation is defined in `components/Sidebar.tsx`, and the overall layout is handled by `components/AppShell.tsx` (sidebar hidden on `/login` and `/landing`).

### `/` Strategic Overview
- What you see: mission brief banner, global strategic metrics, threat thread breakdown, processing/ingestion activity signals, and charts for risk/entity/sentiment/infra health.
- Hook sources:
  - `useStrategicMetrics` (metrics dashboard)
  - `useProcessingLog` (recent intelligence processing activity)
- Primary backend endpoints:
  - `GET /api/metrics/regional-risk`
  - `GET /api/metrics/global-entities`
  - `GET /api/metrics/threat-threads`
  - `GET /api/metrics/daily-ingestion`
  - `GET /api/metrics/prediction-accuracy`
  - `GET /api/metrics/infrastructure-health`
  - `GET /api/intelligence/processing-log`

### `/intelligence` AI Intelligence Hub
- What you see: entity extraction metrics, language distribution, trending keywords, sentiment radar, strategic briefs, pipeline status, climate intelligence, and “live alerts”.
- User actions: triggers server-side NLP/LLM operations (classification, sentiment refinement, entity linking, relationship extraction).
- Hook sources:
  - `useIntelligenceMetrics`
  - `useIntelligenceAlerts`
- Primary backend endpoints:
  - `GET /api/intelligence/entity-extraction`
  - `GET /api/intelligence/language-distribution`
  - `GET /api/intelligence/trending-keywords`
  - `GET /api/intelligence/sentiment-radar`
  - `GET /api/intelligence/strategic-briefs`
  - `POST /api/intelligence/strategic-briefs/generate`
  - `POST /api/intelligence/generate-brief`
  - `POST /api/intelligence/briefs/generate`
  - `GET /api/intelligence/pipeline-status`
  - `GET /api/intelligence/climate-intelligence`
  - `GET /api/intelligence/llm-health`
  - `GET /api/intelligence/mea-strategic-relations`
  - `GET /api/intelligence/processing-log`
  - `GET /api/intelligence/live-alerts`
  - `POST /api/intelligence/classify`
  - `POST /api/intelligence/sentiment`
  - `POST /api/intelligence/entity-linking`
  - `POST /api/intelligence/relationship-extraction`

### `/knowledge-graph` Knowledge Graph Explorer
- What you see: node type counts, relationship types/strengths, SHACL validation summary, conflict detection metrics, network centrality stats, and causal path exploration.
- Hook source: `useKnowledgeGraphMetrics`
- Primary backend endpoints:
  - `GET /api/knowledge-graph/nodes`
  - `GET /api/knowledge-graph/relationships`
  - `GET /api/knowledge-graph/shacl-validation-summary`
  - `GET /api/knowledge-graph/conflict-detection`
  - `GET /api/knowledge-graph/centrality-stats`
  - `GET /api/knowledge-graph/paths/{source}/{target}`
  - `POST /api/knowledge-graph/seed-data`
  - `GET /api/knowledge-graph/node-details` (used for node detail views/modals where applicable)

### `/geospatial` Geospatial Intelligence Dashboard
- What you see: conflict hotspots, climate indicators, incidents (global and per-region), region analysis, coordinate indexing, and economic activity mapping.
- Hook source: `useGeospatialMetrics`
- Primary backend endpoints (geospatial module):
  - `GET /api/geospatial/hotspots`
  - `GET /api/geospatial/climate-indicators`
  - `GET /api/geospatial/incidents/global`
  - `GET /api/geospatial/incidents/{region}`
  - `GET /api/geospatial/region-analysis/{region}`
  - `GET /api/geospatial/coordinate-index`
  - `GET /api/geospatial/economic-activity`

### `/heatmap` Multi-Layer Heatmap (Decision Intelligence Map)
- What you see: interactive Leaflet map with multiple risk layers and a composite risk score.
- Main components:
  - `app/components/DecisionHeatmapLeaflet.tsx`
  - `app/hooks/useDecisionHeatmapData.ts`
- Layer model:
  - Layers: `climate`, `population`, `economy`, `sentiment`
  - Default weights (normalized in UI): `climate 0.34`, `population 0.25`, `economy 0.27`, `sentiment 0.14`
  - Marker color/label thresholds are derived from composite risk score bands (e.g., Critical/High/Moderate/Low).
- Sentiment integration:
  - `useDecisionHeatmapData` fetches `GET /api/intelligence/sentiment-radar`
  - Computes a `sentimentRiskBaseline` from the radar average
  - Uses hotspots/climate/economic signals from `useGeospatialMetrics` to build composite heatmap points
- Primary backend endpoints used:
  - `GET /api/geospatial/hotspots`
  - `GET /api/geospatial/climate-indicators`
  - `GET /api/geospatial/economic-activity`
  - `GET /api/intelligence/sentiment-radar`
  - Knowledge graph context is requested as part of the detail modal flow (see knowledge graph module endpoints above).

### `/predictions` Predictions Engine Dashboard
- What you see: conflict risk forecast trends, model performance, model drift monitoring, training status, serving health, a PyG model status/inference panel, and A/B testing metrics.
- Hook sources:
  - `usePredictionsMetrics`
  - `useServingHealthMetrics`
- Primary backend endpoints:
  - `GET /api/predictions/conflict-risk`
  - `GET /api/predictions/model-performance`
  - `GET /api/predictions/model-drift`
  - `GET /api/predictions/training-status`
  - `GET /api/predictions/serving-health`
  - `GET /api/predictions/serving-live-matrix`
  - `GET /api/predictions/dashboard-overview`
  - `GET /api/predictions/pyg-model/status`
  - `POST /api/predictions/pyg-model/predict`
  - `GET /api/predictions/ab-testing/variants`
  - `GET /api/predictions/ab-testing/assignment`
  - `GET /api/predictions/ab-testing/summary`
  - `POST /api/predictions/training-pipeline/jobs`
  - `GET /api/predictions/training-pipeline/jobs/{job_id}`
  - `GET /api/predictions/training-pipeline/runs`
  - `GET /api/predictions/training-pipeline/artifacts`

### `/bill-analysis` Bill Amendment Analysis
- What you see: upload a PDF, observe analysis progress + logs, and review structured outputs (summary, pros/cons, economic impact, risk assessment, global impact, stakeholder effects, amendments/comparison style sections).
- Hook sources: page calls backend endpoints directly (progress/log UI is part of the page component).
- Primary backend endpoints:
  - `POST /api/bill-analysis/analyze` (multipart PDF upload)
  - `GET /api/bill-analysis/status` (provider/model status + config)
  - `GET /api/bill-analysis/history` (previous mock history; production is expected to query real persisted analyses)
- Bill analysis provider behavior:
  - Implemented by `backend/services/grok_bill_analyzer.py`
  - Provider selection:
    - Gemini if `GEMINI_API_KEY` present
    - Grok if `GROK_API_KEY` present
    - Otherwise uses mock mode (no provider enabled)

### `/data-streams` Data Streams (Kafka/Flink Monitoring)
- What you see: Kafka topic metrics, Flink pipeline status, consumer lag, cluster status, live alerts, and aggregation metrics.
- Hook source: `useStreamsMetrics`
- Primary backend endpoints:
  - `GET /api/streams/topics`
  - `GET /api/streams/pipelines`
  - `GET /api/streams/kafka/lag`
  - `GET /api/streams/flink/clusters`
  - `GET /api/streams/alerts`
  - `GET /api/streams/aggregations`

### `/data-lake` Data Lake Operations (Catalog + Quality + Cost + Lineage)
- What you see: data lake summary, dataset inventory, data quality metrics, lineage, query cost monitoring, and materialized view metadata.
- Hook source: `useDataLakeMetrics`
- Primary backend endpoints:
  - `GET /api/data-lake/summary`
  - `GET /api/data-lake/datasets`
  - `GET /api/data-lake/quality`
  - `GET /api/data-lake/lineage`
  - `GET /api/data-lake/costs`
  - `GET /api/data-lake/materialized-views`

### `/security` Security & Governance Dashboard
- What you see: audit logs, violations trend, access check / export workflow summaries, and monitoring views.
- Hook source: `useSecurityMetrics` (and related security monitoring hooks where applicable)
- Primary backend endpoints:
  - `GET /api/security/audit-log`
  - `GET /api/security/violations-trend`
  - `POST /api/security/access-check`
  - `GET /api/security/monitoring-dashboard`
  - `POST /api/security/export-request`
  - `GET /api/security/export-requests/{request_id}`
  - `GET /api/security/export-requests`
  - `POST /api/security/export-approve`
  - `GET /api/security/data-classification/{resource_type}`
  - `GET /api/security/pending-approvals`
  - (also surfaced via security monitoring module:)
    - `GET /api/security-monitoring/threats/summary`
    - `GET /api/security-monitoring/threats/critical`
    - `GET /api/security-monitoring/events/recent`

### `/control-panel` Infrastructure Control
- What you see: static “control panel” cards for service status and an “refresh status” button (UI-only in current code).
- This page currently does not rely on backend calls; it is intended as a dev/prototype control surface.

### Public Pages
- `/landing`: public entry point
- `/login`: login portal

## Backend: Global Endpoints (FastAPI App)

Defined in `backend/main.py`:

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/` | Welcome message + docs hint |
| GET | `/health` | Basic system health check |
| GET | `/api/health` | Dependency-aware health (`postgres`, `neo4j`, plus placeholders for others) |
| GET | `/api/version` | API version info |
| GET | `/api/monitoring/performance` | Live request counter + error rate + avg latency |
| GET | `/metrics` | Prometheus-compatible metrics text payload |

## Backend: REST API Modules (Extracted From Routers)

All API responses should follow the standardized shape from `backend/utils/response.py`:

| Field | Meaning |
| --- | --- |
| `status` | `"success"` or `"error"` |
| `data` | Response payload (or `null` on error) |
| `error` | `null` on success, or `{ code, message }` on error |
| `meta` | `{ timestamp, request_id, source, ... }` |
| `progress` / `logs` | Present for bill-analysis streaming-like UX |

### Authentication: `auth` router (paths start at `/auth`)
File: `backend/api/auth.py`

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create a user account and return JWT tokens |
| POST | `/auth/login` | Authenticate user and return JWT tokens |
| POST | `/auth/refresh` | Refresh access token using refresh token |
| POST | `/auth/logout` | Logout (invalidate session conceptually for the UI flow) |
| GET | `/auth/me` | Get current user info + RBAC context |
| GET | `/auth/permissions` | Get current user permissions |

### User Management: `users` router (paths start at `/users`)
File: `backend/api/users.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/users/` | List users (admin only) |
| POST | `/users/` | Create user (admin only) |
| GET | `/users/{user_id}` | Get user details (admin only) |
| PUT | `/users/{user_id}` | Update user (admin only) |
| DELETE | `/users/{user_id}` | Delete user (admin only) |

### Metrics Dashboard: `metrics` router (`/api/metrics`)
File: `backend/api/metrics.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/metrics/regional-risk` | Risk scores by region |
| GET | `/api/metrics/global-entities` | Global entity counts + breakdown |
| GET | `/api/metrics/threat-threads` | Threat classification summary (critical/high/monitor) |
| GET | `/api/metrics/daily-ingestion` | Data ingestion volume (total + realtime processed) |
| GET | `/api/metrics/prediction-accuracy` | Prediction model accuracy |
| GET | `/api/metrics/infrastructure-health` | Infrastructure component health (status and response-time style fields) |
| GET | `/api/metrics/kg-nodes` | Knowledge graph node metrics |

### Intelligence Hub: `intelligence` router (`/api/intelligence`)
File: `backend/api/intelligence.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/intelligence/entity-extraction` | Entity extraction metrics |
| GET | `/api/intelligence/language-distribution` | Document language distribution |
| GET | `/api/intelligence/trending-keywords` | Trending keyword analytics |
| GET | `/api/intelligence/sentiment-radar` | Sentiment radar by subject/domain |
| GET | `/api/intelligence/strategic-briefs` | Strategic briefs list |
| POST | `/api/intelligence/strategic-briefs/generate` | Generate strategic briefs |
| POST | `/api/intelligence/generate-brief` | Alias: generate a brief |
| POST | `/api/intelligence/briefs/generate` | Alias: generate briefs |
| GET | `/api/intelligence/pipeline-status` | NLP/LLM pipeline health |
| GET | `/api/intelligence/climate-intelligence` | Climate risk intelligence |
| POST | `/api/intelligence/classify` | Text classification |
| POST | `/api/intelligence/sentiment` | Sentiment scoring/refinement |
| POST | `/api/intelligence/entity-linking` | Entity linking / canonicalization |
| POST | `/api/intelligence/relationship-extraction` | Extract relationships (SPO-style) |
| GET | `/api/intelligence/llm-health` | LLM/model readiness (Ollama health) |
| GET | `/api/intelligence/mea-strategic-relations` | MEA strategic relations summary |
| GET | `/api/intelligence/processing-log` | Recent processing events |
| GET | `/api/intelligence/live-alerts` | Live intelligence alerts |

### Knowledge Graph: `knowledge_graph` router (`/api/knowledge-graph`)
File: `backend/api/knowledge_graph.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/knowledge-graph/nodes` | Node types and counts |
| GET | `/api/knowledge-graph/relationships` | Relationship types (with filtering via query params where supported) |
| GET | `/api/knowledge-graph/shacl-validation-summary` | SHACL-style validation summary + shapes |
| GET | `/api/knowledge-graph/conflict-detection` | Conflict hotspot metrics computed from graph signals |
| GET | `/api/knowledge-graph/centrality-stats` | Centrality/network stats |
| GET | `/api/knowledge-graph/paths/{source}/{target}` | Multi-hop causal paths between nodes |
| POST | `/api/knowledge-graph/seed-data` | Populate knowledge graph with sample data |
| GET | `/api/knowledge-graph/node-details` | Node detail lookup |

### Geospatial Intelligence: `geospatial` router (`/api/geospatial`)
File: `backend/api/geospatial.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/geospatial/hotspots` | Global conflict hotspots |
| GET | `/api/geospatial/climate-indicators` | Climate indicators by region |
| GET | `/api/geospatial/incidents/global` | Global incidents list |
| GET | `/api/geospatial/incidents/{region}` | Incidents for a region |
| GET | `/api/geospatial/heatmap` | Heatmap data (legacy/utility; main heatmap uses `useDecisionHeatmapData`) |
| GET | `/api/geospatial/region-analysis/{region}` | Region-specific analysis bundle |
| GET | `/api/geospatial/coordinate-index` | Entity-to-coordinate indexing |
| GET | `/api/geospatial/economic-activity` | Economic activity mapping |

### Predictions & ML Monitoring: `predictions` router (`/api/predictions`)
File: `backend/api/predictions.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/predictions/conflict-risk` | Conflict risk forecast |
| GET | `/api/predictions/model-performance` | Model performance metrics |
| GET | `/api/predictions/model-drift` | Drift detection metrics |
| GET | `/api/predictions/training-status` | Training pipeline status |
| GET | `/api/predictions/serving-health` | Serving health snapshot |
| GET | `/api/predictions/serving-live-matrix` | Live CPU/serving matrix for charts |
| GET | `/api/predictions/dashboard-overview` | Aggregated KPIs for the dashboard |
| GET | `/api/predictions/pyg-model/status` | PyG model status |
| POST | `/api/predictions/pyg-model/predict` | Graph model inference |
| GET | `/api/predictions/ab-testing/variants` | A/B experiment variants |
| GET | `/api/predictions/ab-testing/assignment` | Assignment logic (deterministic/session) |
| GET | `/api/predictions/ab-testing/summary` | A/B experiment KPI summary |
| POST | `/api/predictions/training-pipeline/jobs` | Start async training job |
| GET | `/api/predictions/training-pipeline/jobs/{job_id}` | Training job status |
| GET | `/api/predictions/training-pipeline/runs` | Training history |
| GET | `/api/predictions/training-pipeline/artifacts` | Model artifact metadata |

### Streaming Monitoring: `streams` router (`/api/streams`)
File: `backend/api/streams.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/streams/topics` | Kafka topics with lag/throughput-style metrics |
| GET | `/api/streams/pipelines` | Flink pipelines health |
| GET | `/api/streams/kafka/lag` | Consumer lag metrics |
| GET | `/api/streams/flink/clusters` | Flink cluster status |
| GET | `/api/streams/alerts` | Real-time alerts derived from stream monitoring |
| GET | `/api/streams/aggregations` | Stream aggregations/derived metrics |

### Data Lake Operations: `data_lake` router (`/api/data-lake`)
File: `backend/api/data_lake.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/data-lake/summary` | Lake summary: size/records/datasets |
| GET | `/api/data-lake/datasets` | Dataset catalog |
| GET | `/api/data-lake/quality` | Quality metrics |
| GET | `/api/data-lake/lineage` | Data lineage/provenance |
| GET | `/api/data-lake/costs` | Query costs monitoring |
| GET | `/api/data-lake/materialized-views` | Materialized view metadata |

### Security & Governance: `security` router (`/api/security`)
File: `backend/api/security.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/security/audit-log` | Audit log (user actions, status, classification) |
| GET | `/api/security/violations-trend` | Violations trend over a time window |
| POST | `/api/security/access-check` | Check access eligibility based on clearance/classification inputs |
| GET | `/api/security/monitoring-dashboard` | Security monitoring dashboard data bundle |
| POST | `/api/security/export-request` | Request an export (starts approval workflow) |
| GET | `/api/security/export-requests/{request_id}` | Export request status lookup |
| GET | `/api/security/export-requests` | List export requests |
| POST | `/api/security/export-approve` | Approve/deny an export request |
| GET | `/api/security/data-classification/{resource_type}` | Resource classification lookup |
| GET | `/api/security/pending-approvals` | Pending approvals queue |

### Security Monitoring: `security_monitoring` router (`/api/security-monitoring`)
File: `backend/api/security_monitoring.py`

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/security-monitoring/threats/summary` | Threat summary from security monitor |
| GET | `/api/security-monitoring/threats/critical` | Critical threats |
| GET | `/api/security-monitoring/events/recent` | Recent security events |
| GET | `/api/security-monitoring/classification/{resource}` | Resource classification view |
| GET | `/api/security-monitoring/classifications` | All classifications |
| POST | `/api/security-monitoring/export/request` | Export approval request (monitoring module) |
| GET | `/api/security-monitoring/export/pending` | Pending exports |
| POST | `/api/security-monitoring/export/{export_id}/approve` | Approve monitored export request |
| GET | `/api/security-monitoring/export/history` | Export history |

### Bill Analysis: `bill_analysis` router (`/api/bill-analysis`)
File: `backend/api/bill_analysis.py`

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/bill-analysis/analyze` | Upload a PDF and run amendment analysis |
| GET | `/api/bill-analysis/history` | Retrieve previous analyses (mock in current code) |
| GET | `/api/bill-analysis/status` | Report provider/model/config status |

## Backend Supporting Systems (Key “Feature Engines”)

### Standardized Responses
- Central helpers in `backend/utils/response.py`:
  - `build_success(data, progress?, logs?)`
  - `build_error(code, message, progress?, logs?)`

### Security Hardening Middleware (Production)
File: `backend/middleware/security_hardening.py`
- `SecurityHeadersMiddleware`: adds security headers (HSTS, CSP, clickjacking prevention, etc.)
- `RateLimitMiddleware`: simple in-memory request limiting with 429 responses
- `RequestValidationMiddleware`: rejects missing `Content-Length` and large payloads
- `ErrorSanitizationMiddleware`: redacts internal error details in production
- `InputSanitizationMiddleware`: blocks common injection-like patterns in query strings

### RBAC + Clearance Model
File: `backend/services/rbac.py`
- Roles: `admin`, `analyst`, `viewer`, `auditor`, `operator`
- Clearance levels: `UNCLASS`, `FOUO`, `SECRET`, `TS`, `TS/SCI`
- Permission matrix maps resource/action → required clearance thresholds
- Runtime wrapper: `RBACContext` checks whether the user can access resources/actions

### Data Classification + Export Approval Workflow
Files:
- `backend/services/data_classification.py`
- `backend/services/export_approval.py`
- `backend/api/security.py` and `backend/api/security_monitoring.py` expose this workflow
- `DataClassifier` assigns a sensitivity to resources/actions and determines whether approval is required.
- `ExportApprovalWorkflow` stores pending approvals, and enforces multi-step approvals for high sensitivity.

### Real-Time Security Monitoring
File: `backend/services/security_monitor.py`
- Detects suspicious patterns (brute force, privilege escalation, large exports, anomalous access time)
- Provides:
  - `get_threat_summary()`
  - `get_critical_events()`
  - `get_recent_events()`

### Bill Amendment Analysis Engine
File: `backend/services/grok_bill_analyzer.py`
- `GrokBillAnalyzer.analyze_bill(text, logs)`:
  - Validates provider availability (Gemini/Grok; else mock)
  - Splits large documents into smart chunks (size controlled by `GROK_CHUNK_SIZE`)
  - Extracts metadata and runs parallel section analyses:
    - summary, pros/cons, economic impact, risk assessment, global impact, stakeholders, amendments
  - Synthesizes a final structured analysis object
- Frontend progress/log UI is driven by the `progress` and `logs` returned by:
  - `POST /api/bill-analysis/analyze`

### Intelligence NLP/LLM Service Layer
Files:
- `backend/services/llm_classifier.py` (classification + sentiment style scoring)
- `backend/services/entity_extractor.py` (NER/entity + relation triplets)
- `backend/services/nlp_processor.py` (spaCy wrapper + fallbacks)
- `backend/api/intelligence.py` orchestrates calls and exposes results via REST endpoints

## Notes on “Each Feature” Coverage

This docs file focuses on feature coverage (pages, backend REST feature surface, and the key “engine” classes that power those endpoints). It is not a line-by-line code comment.

If you want the docs to go further into “every single file in the repository”, tell me whether you want:
1. a per-file appendix (one section per file path), or
2. a dependency graph appendix (which services/files feed which API endpoints/pages).

