# ONTORA — Global Intelligence & Ontology Analysis Platform
## Full Feature Documentation & User Guide

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Navigation & Layout](#4-navigation--layout)
5. [Pages & Features](#5-pages--features)
   - [5.1 Strategic Overview (Home)](#51-strategic-overview-home)
   - [5.2 AI Intelligence Hub](#52-ai-intelligence-hub)
   - [5.3 Knowledge Graph Explorer](#53-knowledge-graph-explorer)
   - [5.4 Geospatial Intelligence](#54-geospatial-intelligence)
   - [5.5 Predictions Engine](#55-predictions-engine)
   - [5.6 Multi-Layer Heatmap](#56-multi-layer-heatmap)
   - [5.7 Data Streams Monitor](#57-data-streams-monitor)
   - [5.8 Data Lake Operations](#58-data-lake-operations)
   - [5.9 Security & Governance](#59-security--governance)
   - [5.10 Bill Amendment Analysis](#510-bill-amendment-analysis)
   - [5.11 Control Panel](#511-control-panel)
   - [5.12 Landing Page](#512-landing-page)
   - [5.13 Login](#513-login)
6. [Backend API Reference](#6-backend-api-reference)
7. [Database Schema](#7-database-schema)
8. [Custom Hooks](#8-custom-hooks)
9. [Design System](#9-design-system)
10. [Configuration & Deployment](#10-configuration--deployment)

---

## 1. Platform Overview

**ONTORA** is a production-grade Global Intelligence & Ontology Analysis Platform designed for geopolitical threat monitoring, multilingual intelligence processing, and predictive analysis across 216 nations.

It functions as a classified intelligence operations center with:
- Real-time streaming data ingestion via Kafka
- Graph-based entity relationship tracking via Neo4j
- AI/ML-powered conflict prediction via PyTorch Geometric
- Large legislative document analysis powered by Grok/Gemini LLMs
- Interactive geospatial visualizations via Leaflet + PostGIS
- Zero-trust security and compliance audit logging

**Core Capabilities:**
| Capability | Description |
|---|---|
| 2,840+ entities tracked | Nations, organizations, persons, events |
| 216 countries monitored | Full global geopolitical coverage |
| 8 languages processed | Multilingual NLP pipeline |
| 300+ page bills analyzed | AI-powered PDF legislative analysis |
| Real-time streaming | Kafka-backed high-throughput ingestion |
| Graph ontology | Neo4j knowledge graph with SHACL validation |

---

## 2. Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | React framework, server/client rendering, routing |
| React | 19.2.3 | UI component library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | v4 | Utility-first styling with custom design tokens |
| Recharts | latest | Data visualization (Area, Bar, Line, Radar charts) |
| Leaflet + React-Leaflet | latest | Interactive geospatial maps |

### Backend
| Technology | Purpose |
|---|---|
| Python FastAPI | REST API with async/await support |
| SQLAlchemy ORM | PostgreSQL data access |
| PostgreSQL | Relational data (entities, documents, audit logs) |
| Neo4j | Knowledge graph storage and traversal |
| Redis | Session caching and performance |
| Apache Kafka | Real-time data streaming |
| Apache Flink | Stream processing and event aggregation |
| Ollama + LLaMA-3 | Local LLM inference for NER and text classification |
| Grok API | Large document bill analysis (primary) |
| Gemini API | Large document bill analysis (fallback) |
| PyTorch Geometric | Graph neural networks for conflict prediction |
| PyPDF2 | PDF parsing for legislative documents |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerized deployment |
| Kubernetes | Production orchestration (manifests in `/k8s`) |
| API Ninjas | External country profile data |

---

## 3. Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- PostgreSQL, Neo4j, Redis (or use Docker)

### Frontend Setup
```bash
cd d:/DMC_Hackathon
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend Setup
```bash
cd d:/DMC_Hackathon/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API available at http://localhost:8000
```

### Docker (Full Stack)
```bash
cd d:/DMC_Hackathon
docker-compose up
```

### Environment Variables
Create a `.env` file in the backend directory with:
```
DATABASE_URL=postgresql://user:pass@localhost/ontora
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://localhost:6379
GROK_API_KEY=your_grok_key
GEMINI_API_KEY=your_gemini_key
API_NINJAS_KEY=your_api_ninjas_key
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
```

---

## 4. Navigation & Layout

### Sidebar
The left sidebar (`components/Sidebar.tsx`) contains the primary navigation organized into three groups:

**COMMAND**
- Strategic Overview (`/`) — Main dashboard
- AI Intelligence Hub (`/intelligence`) — NLP pipeline
- Knowledge Graph (`/knowledge-graph`) — Ontology explorer
- Geospatial Intel (`/geospatial`) — Map-based intelligence

**ANALYSIS**
- Predictions (`/predictions`) — ML conflict forecasting
- Heatmap (`/heatmap`) — Multi-layer geospatial heatmap
- Bill Analysis (`/bill-analysis`) — Legislative document analysis

**INFRASTRUCTURE**
- Data Streams (`/data-streams`) — Kafka/Flink monitoring
- Data Lake (`/data-lake`) — Delta Lake operations
- Security (`/security`) — Audit and governance
- Control Panel (`/control-panel`) — System health

Active route is highlighted in gold. The ONTORA logo and branding are at the top.

### TopBar
The top bar (`components/TopBar.tsx`) displays:
- Page title and subtitle
- Live clock (auto-updates with current date and time)
- Current user info and logout button
- Theme toggle (light/dark mode)
- Search bar

---

## 5. Pages & Features

---

### 5.1 Strategic Overview (Home)

**Route:** `/`
**File:** [app/page.tsx](app/page.tsx)
**Hook:** [app/hooks/useStrategicMetrics.ts](app/hooks/useStrategicMetrics.ts)

The main command center dashboard. Provides a real-time global snapshot of platform health, threat activity, and intelligence coverage.

#### Stat Cards (Top Row)
| Metric | Description |
|---|---|
| Total Users | Active platform users (e.g. 1,247) |
| System Uptime | Platform availability percentage (e.g. 99.97%) |
| Databases | Number of connected data sources (e.g. 12) |
| API Endpoints | Total active API routes (e.g. 84) |

#### Regional Risk Matrix
Color-coded risk scores for 8 global regions (Americas, Europe, Africa, Asia-Pacific, Middle East, etc.). Each region shows a numerical risk score and a threat level category (Critical / High / Moderate / Low).

#### Global Entity Coverage
Shows counts broken down by entity type:
- Nations (195)
- Organizations (342)
- Persons (1,205)
- Events (876)
- Total: 2,840+

#### Threat Threads
Summary of active monitoring categories:
- **Critical** — Immediate escalation threats (e.g. 3)
- **High** — Significant ongoing situations (e.g. 12)
- **Monitoring** — Watch-list items (e.g. 47)

#### Key Insights
A list of 4 dynamically-generated intelligence summaries covering:
- Geopolitical escalation hotspots
- Economic volatility indicators
- Cyber incident clusters
- Climate-driven migration pressures

#### Live Alert Feed
Scrolling list of real-time intelligence alerts color-coded by severity:
- Red: Critical
- Orange: High
- Yellow: Medium
- Green: Low/Info

#### Operations Log
System event history showing timestamped processing actions across all pipeline components.

#### Module Performance Metrics
Performance indicators for each major platform module (Intelligence, Knowledge Graph, Bill Analysis, Geospatial, Predictions, Streaming). Each module shows throughput, latency, and health status.

#### Global Coverage by Region
Percentage of data coverage per geographic region, displayed as progress bars.

**API endpoints used:** `GET /api/metrics/regional-risk`, `/global-entities`, `/threat-threads`, `/daily-ingestion`, `/prediction-accuracy`, `/infrastructure-health`

---

### 5.2 AI Intelligence Hub

**Route:** `/intelligence`
**File:** [app/intelligence/page.tsx](app/intelligence/page.tsx)
**Hook:** [app/hooks/useIntelligenceMetrics.ts](app/hooks/useIntelligenceMetrics.ts)

Monitors the NLP inference pipeline, entity extraction results, language processing, and document ingestion.

#### Entity Extraction Panel
Top 10 extracted entities with:
- Entity name and type (PERSON, ORG, GPE, EVENT, CONCEPT)
- Confidence score (%)
- Mention count across documents
- Trend indicator

#### Language Distribution
Breakdown of 8 languages processed by the pipeline:
- Language name and ISO code
- Document count per language
- Percentage share
- Processing status

Currently tracked: English, Arabic, Mandarin, French, Spanish, Russian, Hindi, German.

#### Trending Keywords
12 trending terms with:
- Keyword text
- Velocity score (rate of increase)
- Sentiment label (Positive / Negative / Neutral)
- Associated entity types

#### Sentiment Analysis Radar Chart
A radar/spider chart with 6 domains:
- Geopolitical
- Economic
- Climate
- Social
- Cyber
- Military

Each domain scored 0–100 based on aggregate document sentiment in that category.

#### Document Ingestion Breakdown
Bar chart showing document volume by source type:
- **DOC** — Official government documents
- **MEA** — Ministry of External Affairs releases
- **NEWS** — News media scrapes
- **SOCIAL** — Social media signals
- **METRIC** — Economic/statistical indicators

#### Pipeline Model Status
Current LLM inference model information:
- Model name (e.g. LLaMA-3)
- Version
- Status (Active / Degraded)
- Inference time (ms)
- GPU availability

#### MEA Relations Summary
Data from Ministry of External Affairs:
- Bilateral relations count
- Documents ingested
- Countries covered
- Recent activity log

#### Classification Distribution
Document security classification breakdown:
- UNCLASSIFIED
- CONFIDENTIAL
- SECRET
- TOP SECRET

#### Strategic Brief Generation
An interactive feature where users can request an AI-generated strategic brief for any region or topic. The backend uses the LLM to synthesize current intelligence into a concise executive summary.

**How to use:** Click "Generate Brief", optionally specify a region or topic, and the system returns a multi-paragraph strategic assessment.

**API endpoints used:** `GET /api/intelligence/entity-extraction`, `/language-distribution`, `/trending-keywords`, `/sentiment-analysis`, `/mea-summary`, `/document-sources`, `POST /api/intelligence/strategic-briefs/generate`

---

### 5.3 Knowledge Graph Explorer

**Route:** `/knowledge-graph`
**File:** [app/knowledge-graph/page.tsx](app/knowledge-graph/page.tsx)
**Hook:** [app/hooks/useKnowledgeGraphMetrics.ts](app/hooks/useKnowledgeGraphMetrics.ts)

A visual ontology browser for exploring entity relationships stored in Neo4j.

#### Node Type Distribution
Bar or pie chart showing the count of each node type in the graph:
- COUNTRY
- POLICY
- EVENT
- SECTOR
- ACTOR
- CONCEPT
- ORG
- PERSON

#### Relationship Graph Visualization
An interactive force-directed (circular layout) graph rendering:
- Nodes colored by type
- Edges labeled with relationship predicates (e.g. "SANCTIONS", "ALLIED_WITH", "TRADE_PARTNER")
- Edge thickness weighted by relationship strength
- Default rendering: 40+ nodes, 120+ edges

**Interactions:**
- **Click a node** — Highlights all connected paths from that node
- **Zoom** — Mouse scroll or pinch gesture
- **Pan** — Click and drag the canvas
- **Hover** — Shows tooltip with entity details

#### Filter Controls
Three controls to refine the graph view:

| Control | Description |
|---|---|
| Minimum Strength | Slider (0–100) to hide low-confidence edges |
| Search | Text filter — shows only nodes/edges matching the search term |
| Limit | Number input (1–500) for max relationships to render |

#### Refresh
"Refresh Graph" button fetches fresh data from Neo4j in real time.

#### Graph Metadata
- Total node count
- Total edge count
- SHACL validation status
- Graph traversal latency (ms)

**API endpoints used:** `GET /api/knowledge-graph/nodes`, `/relationships?min_strength=X&search=Y&limit=Z`, `/traverse`

---

### 5.4 Geospatial Intelligence

**Route:** `/geospatial`
**File:** [app/geospatial/page.tsx](app/geospatial/page.tsx)
**Hook:** [app/hooks/useGeospatialMetrics.ts](app/hooks/useGeospatialMetrics.ts)

PostGIS-backed mapping module for 2.1M+ data points covering conflict zones, climate risks, and economic indicators.

#### Interactive Map
Leaflet-based global map with clickable markers and regions.

**Marker Types:**
- **Red markers** — Critical hotspots (active conflict, severe threat)
- **Orange markers** — High-severity zones
- **Yellow markers** — Medium-severity / monitoring zones
- **Blue markers** — Climate-related zones
- **Green markers** — Economic indicators / stable regions

**Interactions:**
- Click any marker to open a detail modal
- Zoom in/out
- Toggle layer visibility

#### Hotspots Panel
List of all active geopolitical hotspots with:
- Location name and coordinates
- Severity level (Critical / High / Medium)
- Short description of the situation
- Last updated timestamp

Clicking a hotspot entry centers the map on that location.

#### Climate Regions Panel
List of climate-monitored zones with:
- Region name
- Temperature change (°C vs baseline)
- Drought threat level
- Flood risk
- Agricultural/crop risk score

#### Incidents Log
Timestamped log of geopolitical events:
- Event title and location
- Incident type (Military, Economic, Diplomatic, Environmental)
- Detailed description
- Date and time of occurrence

#### Country Profile Modal
Clicking on a country opens a profile panel showing:
- Country name and ISO code
- GDP and GDP per capita
- Population
- Government type
- Key trading partners
- Active conflicts or disputes

Data sourced from both the internal database and the API Ninjas Country API.

**API endpoints used:** `GET /api/geospatial/hotspots`, `/climate-regions`, `/incidents`, `/country-profile`

---

### 5.5 Predictions Engine

**Route:** `/predictions`
**File:** [app/predictions/page.tsx](app/predictions/page.tsx)
**Hook:** [app/hooks/usePredictionsMetrics.ts](app/hooks/usePredictionsMetrics.ts)

PyTorch Geometric (PyG)-powered conflict risk forecasting module with live model monitoring.

#### Model Overview Cards
| Metric | Description |
|---|---|
| Model Version | Current PyG model version |
| Precision | Model precision on validation set |
| Recall | Model recall on validation set |
| Inference Latency | Time to generate a prediction (ms) |
| Forecast Horizon | How many days ahead the model predicts |
| Latest Probability | Current conflict risk % for top hotspot |
| Validation Accuracy | Overall accuracy on held-out test data |

#### Serving Health
Real-time status of the model serving infrastructure:
- **Healthy** (green) — Model responding within SLA
- **Degraded** (yellow) — Elevated latency or partial failures
- **Unhealthy** (red) — Model offline or unresponsive

Includes a time-series chart of serving health score over the past 24 hours.

#### Forecast Timeseries Chart
Line chart showing predicted conflict risk probability (0–100%) over time for top monitored regions. Users can select a specific region/country from a dropdown to view its forecast.

#### A/B Testing Framework
The system runs two model variants simultaneously:
- **Variant A** — Current production model
- **Variant B** — Challenger model (newer architecture or training data)

Displays:
- Precision and recall for each variant
- Current winning variant
- Traffic split percentage

#### Training Status
If a training job is active, shows:
- Job state (Queued / Running / Completed / Failed)
- Progress percentage
- Current epoch / total epochs
- Dataset size (number of graph snapshots)

#### Training History
Table of past training runs:
- Run ID
- Start time
- Duration
- Final accuracy
- Artifact location (stored model weights)

**How to trigger training:** Click "Initiate Training Run" — this submits an async job to the backend.

**API endpoints used:** `GET /api/predictions/forecast`, `/model-status`, `/serving-health`, `/training-history`, `POST /api/predictions/train`

---

### 5.6 Multi-Layer Heatmap

**Route:** `/heatmap`
**File:** [app/heatmap/page.tsx](app/heatmap/page.tsx)
**Component:** [app/components/DecisionHeatmapLeaflet.tsx](app/components/DecisionHeatmapLeaflet.tsx)
**Hook:** [app/hooks/useDecisionHeatmapData.ts](app/hooks/useDecisionHeatmapData.ts)

An interactive multi-layer geospatial heatmap for decision intelligence scoring.

#### Leaflet Map with Layers
The map supports toggling multiple overlays independently:

| Layer | Description |
|---|---|
| Climate Impact | Heatmap intensity based on climate risk scores |
| Population Density | Overlay showing population concentration |
| Economic Activity | GDP and trade activity per region |
| Sentiment Scores | Aggregated sentiment from intelligence documents |

Each layer uses a color gradient from cool (low) to hot (high) intensity.

#### Layer Controls
Checkbox toggles for each layer — multiple layers can be active simultaneously, with blending for composite analysis.

#### Decision Intelligence Score
An aggregate score combining all active layers, displayed as a numerical value and color-coded zone overlay on the map.

**API endpoints used:** `GET /api/geospatial/hotspots`, `/climate-regions`

---

### 5.7 Data Streams Monitor

**Route:** `/data-streams`
**File:** [app/data-streams/page.tsx](app/data-streams/page.tsx)
**Hook:** [app/hooks/useStreamsMetrics.ts](app/hooks/useStreamsMetrics.ts)

Real-time monitoring of the Kafka messaging infrastructure and Apache Flink stream processing clusters.

#### Summary Metrics
| Metric | Description |
|---|---|
| Total Throughput | Aggregated messages/sec across all Kafka topics |
| Active Topics | Number of active Kafka topics |
| Flink Clusters | Number of running Flink job clusters |
| Total Consumer Lag | Combined lag across all topic partitions |

#### Kafka Topics Table
Each row represents one Kafka topic:

| Column | Description |
|---|---|
| Topic Name | e.g. `documents.raw`, `mea.relations.raw` |
| Partitions | Number of topic partitions |
| Consumer Lag | Current unprocessed message backlog |
| Throughput | Messages per second |
| Status | Healthy / Warning / Degraded |

**Tracked topics:**
- `documents.raw`
- `mea.relations.raw`
- `economic.indicators.batch`
- `geospatial.events`
- `predictions.output`

#### Flink Clusters Panel
Each Flink cluster entry shows:
- Cluster name
- Task Manager count
- Parallelism setting
- Uptime
- Health percentage

#### Pipeline Latency
Per-pipeline processing latency in milliseconds. Tracks end-to-end time from ingestion to storage.

#### Stream Alerts
Color-coded alerts for stream anomalies:
- **WARNING** — Consumer lag spike, elevated latency
- **INFO** — Pipeline restart, scaling event

**API endpoints used:** `GET /api/streams/topics`, `/pipelines`, `/alerts`

---

### 5.8 Data Lake Operations

**Route:** `/data-lake`
**File:** [app/data-lake/page.tsx](app/data-lake/page.tsx)
**Hook:** [app/hooks/useDataLakeMetrics.ts](app/hooks/useDataLakeMetrics.ts)

Delta Lake management interface for data quality monitoring, lineage tracking, and cost analysis.

#### Summary Cards
| Metric | Description |
|---|---|
| Total Size | Combined storage across all datasets (GB) |
| Record Count | Total rows across all tables (millions) |
| Active Datasets | Number of currently active datasets |
| 24h Cost | Compute cost units for the past 24 hours |

#### Tabbed Interface

**Datasets Tab**
Table of all data lake tables using the **medallion architecture**:
- **Bronze** — Raw ingested data (unprocessed)
- **Silver** — Cleaned and validated data
- **Gold** — Aggregated analytics-ready data

Each row shows: dataset name, tier (bronze/silver/gold), format (Parquet/Delta), size (GB), record count, last updated.

**Quality Tab**
Per-dataset data quality scores:
| Dimension | Description |
|---|---|
| Completeness | % of non-null required fields (87–98%) |
| Accuracy | Validation against known reference data (91–98%) |
| Freshness | Age of the most recent record |
| Uniqueness | Absence of duplicate records |

**Lineage Tab**
A DAG (Directed Acyclic Graph) visualization showing the data pipeline:
- Source systems (e.g. `worldbank_fetcher.py`, `mea_scraper.py`)
- Processing steps (Kafka → Flink)
- Storage destinations (PostgreSQL, Delta Lake)

Shows upstream/downstream dependencies for each dataset.

**Costs Tab**
Query-level cost tracking:
- Query name / job ID
- Data scanned (GB)
- Compute units consumed
- Cost in normalized units
- Timestamp

**Views Tab**
Logical views and materialized tables:
- View name
- Underlying source tables
- Refresh schedule
- Last refresh time

**API endpoints used:** `GET /api/data-lake/summary`, `/datasets`, `/quality`, `/lineage`, `/costs`, `/views`

---

### 5.9 Security & Governance

**Route:** `/security`
**File:** [app/security/page.tsx](app/security/page.tsx)
**Hook:** [app/hooks/useSecurityMetrics.ts](app/hooks/useSecurityMetrics.ts)

Zero-trust access control, compliance audit logging, and data classification governance.

#### Access Control Summary
- Total audit entries
- ALLOW count vs DENY count
- Access denied rate (%)
- Recent policy violations

#### Audit Log Table
Scrollable table of the 50 most recent audit events:

| Column | Description |
|---|---|
| Timestamp | ISO datetime of the event |
| User | Username or user ID |
| Action | READ, WRITE, EXPORT, DELETE, LOGIN |
| Resource | Endpoint or table accessed |
| Classification | UNCLASS, FOUO, SECRET, TOP SECRET |
| Status | ALLOW or DENY |
| IP Address | Source IP address |

#### Violations Trend Chart
A 7-day bar chart showing daily counts of:
- DENY decisions (red)
- ALLOW decisions (green)

Useful for identifying access anomalies or escalations.

#### Login Events
Chronological list of authentication events:
- Successful logins
- Failed login attempts
- Multi-factor authentication events
- Session expirations

#### Access Check Panel
An interactive form where administrators can check whether a specific user has access to a specific resource at a given clearance level. Returns ALLOW or DENY with the reason.

#### Data Classification Overview
Resource classification breakdown showing how much data falls under each sensitivity tier:
- UNCLASSIFIED
- FOR OFFICIAL USE ONLY (FOUO)
- SECRET
- TOP SECRET

**API endpoints used:** `GET /api/security/audit-log`, `/violations-trend`, `POST /api/security/access-check`, `/export-request`

---

### 5.10 Bill Amendment Analysis

**Route:** `/bill-analysis`
**File:** [app/bill-analysis/page.tsx](app/bill-analysis/page.tsx)
**Backend Service:** [backend/services/grok_bill_analyzer.py](backend/services/grok_bill_analyzer.py)

AI-powered legislative document analysis for bills up to 300+ pages, using Grok API (primary) with Gemini as fallback.

#### PDF Upload
Drag-and-drop or file picker to upload a legislative PDF document. The backend uses PyPDF2 to extract text, then splits it into intelligent chunks for parallel LLM analysis.

**Supported formats:** PDF only
**Size:** Up to 300+ pages supported

#### Bill Metadata (auto-extracted)
After upload and analysis:
- Bill title
- Country of origin
- Legislative session/year
- Executive summary

#### Analysis Sections

**Impact Assessment**
- GDP impact (% change estimate)
- Employment effect (jobs created/lost)
- Inflation pressure
- Sector-by-sector breakdown (Finance, Energy, Agriculture, Technology, etc.)

**Global Impact**
- Trade relations affected
- Geopolitical influence assessment
- List of affected regions and countries
- International treaty implications

**Amendments**
For each identified section with potential issues:
- Original text excerpt (the "flaw")
- Proposed amendment text
- Impact comparison: before vs. after
- Amendment rationale

**Risk Assessment**
- Overall risk level (Low / Medium / High / Critical)
- Probability of negative outcomes
- Top 3–5 risk factors
- Mitigation strategies per risk

**Implementation Timeline**
Phased roadmap:
- Phase name and description
- Duration (months)
- Key milestones per phase
- Dependencies

**Stakeholder Analysis**
For each identified stakeholder group:
- Name (e.g. Domestic Industry, Foreign Investors, Civil Society)
- Sentiment toward the bill (Positive / Neutral / Negative)
- Influence level (High / Medium / Low)
- Key concerns or interests

**Comparative Analysis**
Similar bills enacted in other countries:
- Country and bill name
- Outcome (Success / Partial Success / Failed)
- Relevant lessons learned

**India-Specific Metrics** *(if applicable)*
When analyzing bills with India-related content:
- Regional signal strength
- India mentions count
- South Asia mentions
- Inflation pressure index
- Employment pressure index
- Readiness score
- Opportunity score

**Policy Brief**
Auto-generated executive summary suitable for senior stakeholders:
- Core metrics table
- Top 3 recommendations (prioritized)
- Confidence level

**Recommendations**
Prioritized action list:
- Priority level (High / Medium / Low)
- Recommendation text
- Expected impact
- Responsible stakeholder

#### Sample Bills
The repository includes pre-loaded sample PDFs in `/sample_bills/`:
- `climate_action_initiative.pdf`
- `digital_privacy_act.pdf`
- `trade_facilitation_act.pdf`

These can be used to test the analysis pipeline without uploading new documents.

**API endpoints used:** `POST /api/bill-analysis/analyze`, `GET /api/bill-analysis/status`

---

### 5.11 Control Panel

**Route:** `/control-panel`
**File:** [app/control-panel/page.tsx](app/control-panel/page.tsx)

System service health monitoring for all backend infrastructure components.

#### Service Status Grid
Each service card shows:
- Service name
- Status indicator (Online / Degraded / Offline / Maintenance)
- Uptime percentage
- Average response time (ms)
- Last health check timestamp

**Monitored Services:**
| Service | Typical Uptime | Response Time |
|---|---|---|
| PostgreSQL Database | 99.9% | 12ms |
| Neo4j Graph DB | 99.8% | 8ms |
| FastAPI Gateway | 100% | 5ms |
| Authentication Service | 99.95% | 6ms |
| Redis Cache | 99.7% | 2ms |
| Kafka Streams | 97.5% | 45ms |

**Status Color Codes:**
- Green: Online and healthy
- Amber: Degraded performance
- Red: Offline or critical failure
- Gray: Maintenance mode

---

### 5.12 Landing Page

**Route:** `/landing`
**File:** [app/landing/page.tsx](app/landing/page.tsx)

A feature showcase and platform introduction page, suitable for onboarding new users or stakeholders. Highlights the seven core platform capabilities with visual cards:

1. Geospatial Intelligence
2. Metrics & Analytics
3. Intelligence Processing
4. Conflict Prediction Models
5. Data Architecture & Infrastructure
6. Knowledge Graph Management
7. Security & Compliance

---

### 5.13 Login

**Route:** `/login`
**File:** [app/login/page.tsx](app/login/page.tsx)

OAuth2/JWT authentication page.

#### Features
- Username and password fields
- "Remember me" checkbox — persists session to `localStorage` vs `sessionStorage`
- Error feedback for failed login attempts
- JWT token pair on success (access token + refresh token)
- Clearance level is stored in the session and used throughout the platform for RBAC enforcement

**Token storage:**
- Access token: Short-lived JWT for API requests
- Refresh token: Long-lived token for session renewal
- Clearance level: Determines which data classifications the user can access

---

## 6. Backend API Reference

Base URL: `http://localhost:8000`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate with username/password, returns JWT pair |
| POST | `/auth/logout` | Invalidate current session |

### Metrics (`/api/metrics`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/metrics/regional-risk` | Risk scores by region |
| GET | `/api/metrics/global-entities` | Entity counts by type |
| GET | `/api/metrics/threat-threads` | Critical/high/monitoring threat counts |
| GET | `/api/metrics/daily-ingestion` | Data volume processed |
| GET | `/api/metrics/prediction-accuracy` | Model accuracy metrics |
| GET | `/api/metrics/infrastructure-health` | Component health percentages |

### Intelligence (`/api/intelligence`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/intelligence/entity-extraction` | Top 10 entities with confidence scores |
| GET | `/api/intelligence/language-distribution` | Languages and document counts |
| GET | `/api/intelligence/trending-keywords` | Trending terms with velocity |
| GET | `/api/intelligence/sentiment-analysis` | 6-domain sentiment radar data |
| GET | `/api/intelligence/mea-summary` | MEA relations data |
| GET | `/api/intelligence/regional-hotspots` | Active geopolitical tension zones |
| GET | `/api/intelligence/document-sources` | Document ingestion by source type |
| POST | `/api/intelligence/strategic-briefs/generate` | AI brief generation |

### Knowledge Graph (`/api/knowledge-graph`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/knowledge-graph/nodes` | Node type distribution |
| GET | `/api/knowledge-graph/relationships` | Edges with optional filters (`min_strength`, `search`, `limit`) |
| GET | `/api/knowledge-graph/traverse` | Graph traversal from a given node |

### Geospatial (`/api/geospatial`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/geospatial/hotspots` | Conflict/tension hotspots |
| GET | `/api/geospatial/climate-regions` | Climate impact zones |
| GET | `/api/geospatial/incidents` | Timestamped geopolitical incidents |
| GET | `/api/geospatial/country-profile` | Economic and geographic country data |

### Predictions (`/api/predictions`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/predictions/forecast` | Conflict risk probability timeseries |
| GET | `/api/predictions/model-status` | PyG model metadata |
| GET | `/api/predictions/serving-health` | Model serving infrastructure status |
| GET | `/api/predictions/training-history` | Past training runs and artifacts |
| POST | `/api/predictions/train` | Submit async training job |

### Data Streams (`/api/streams`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/streams/topics` | Kafka topic lag and throughput |
| GET | `/api/streams/pipelines` | Flink cluster status |
| GET | `/api/streams/alerts` | Stream processing alerts |

### Data Lake (`/api/data-lake`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/data-lake/summary` | Total size, record count, cost |
| GET | `/api/data-lake/datasets` | Per-dataset metrics |
| GET | `/api/data-lake/quality` | Data quality scores |
| GET | `/api/data-lake/lineage` | Data pipeline DAG |
| GET | `/api/data-lake/costs` | Query cost tracking |
| GET | `/api/data-lake/views` | Logical views metadata |

### Security (`/api/security`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/security/audit-log` | Access audit trail |
| GET | `/api/security/violations-trend` | 7-day DENY/ALLOW trend |
| POST | `/api/security/access-check` | Check user access to resource |
| POST | `/api/security/export-request` | Submit data export approval request |

### Bill Analysis (`/api/bill-analysis`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bill-analysis/analyze` | Upload and analyze a PDF legislative document |
| GET | `/api/bill-analysis/status` | Check analysis job progress |

---

## 7. Database Schema

### PostgreSQL Tables

**`users`**
```
id              UUID PRIMARY KEY
username        VARCHAR UNIQUE NOT NULL
email           VARCHAR UNIQUE
hashed_password VARCHAR NOT NULL
roles           TEXT[]          (e.g. ["analyst", "admin"])
clearance_level VARCHAR         (UNCLASS, FOUO, SECRET, TS)
is_active       BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**`countries`**
```
id        UUID PRIMARY KEY
iso_code  VARCHAR(3) UNIQUE
name      VARCHAR NOT NULL
region    VARCHAR
continent VARCHAR
```

**`country_relations`**
```
id            UUID PRIMARY KEY
country_a_id  UUID FK → countries
country_b_id  UUID FK → countries
status        VARCHAR  (stable, tense, active_dispute, conflict)
trade_volume  DECIMAL
sentiment     FLOAT    (-1.0 to 1.0)
agreements    JSONB    (list of treaty names)
key_issues    JSONB    (list of dispute topics)
```

**`economic_indicators`**
```
id              UUID PRIMARY KEY
country_id      UUID FK → countries
indicator_code  VARCHAR  (e.g. NY.GDP.MKTP.CD)
indicator_name  VARCHAR  (e.g. GDP (current US$))
value           DECIMAL
year            INTEGER
unit            VARCHAR
```

**`documents`**
```
id             UUID PRIMARY KEY
title          VARCHAR
content        TEXT
source         VARCHAR  (MEA, NEWS, SOCIAL)
language       VARCHAR
url            VARCHAR
published_date TIMESTAMP
```

**`entities`**
```
id               UUID PRIMARY KEY
entity_type      VARCHAR  (PERSON, ORG, GPE, EVENT, CONCEPT)
name             VARCHAR
description      TEXT
confidence_score FLOAT
mention_count    INTEGER
sentiment        FLOAT
```

**`relationships`** *(Knowledge Graph triplets)*
```
id                  UUID PRIMARY KEY
subject_entity_id   UUID FK → entities
predicate           VARCHAR  (e.g. SANCTIONS, ALLIED_WITH, TRADE_PARTNER)
object_entity_id    UUID FK → entities
confidence_score    FLOAT
source_document_id  UUID FK → documents
```

**`audit_logs`**
```
id              UUID PRIMARY KEY
user_id         UUID FK → users
action          VARCHAR  (READ, WRITE, EXPORT, DELETE, LOGIN)
resource        VARCHAR
classification  VARCHAR
status          VARCHAR  (ALLOW, DENY)
ip_address      VARCHAR
timestamp       TIMESTAMP
details         JSONB
```

**`system_metrics`**
```
id           UUID PRIMARY KEY
metric_name  VARCHAR
value        FLOAT
component    VARCHAR
recorded_at  TIMESTAMP
```

### Neo4j Graph Model
Nodes use labels matching entity types: `:COUNTRY`, `:POLICY`, `:EVENT`, `:SECTOR`, `:ACTOR`, `:CONCEPT`, `:ORG`, `:PERSON`

Relationships are named predicates: `SANCTIONS`, `ALLIED_WITH`, `TRADE_PARTNER`, `IN_CONFLICT_WITH`, `MEMBER_OF`, `INFLUENCED_BY`, `LOCATED_IN`, etc.

Each relationship has a `strength` property (0–100) and `confidence` (0.0–1.0).

---

## 8. Custom Hooks

All hooks in [app/hooks/](app/hooks/) follow a consistent pattern:

```typescript
const { data, loading, error } = useXxxMetrics();
```

| Hook | File | Purpose |
|---|---|---|
| `useStrategicMetrics` | [useStrategicMetrics.ts](app/hooks/useStrategicMetrics.ts) | Home dashboard stats |
| `useIntelligenceMetrics` | [useIntelligenceMetrics.ts](app/hooks/useIntelligenceMetrics.ts) | NLP pipeline data |
| `useKnowledgeGraphMetrics` | [useKnowledgeGraphMetrics.ts](app/hooks/useKnowledgeGraphMetrics.ts) | Graph nodes and relationships |
| `useGeospatialMetrics` | [useGeospatialMetrics.ts](app/hooks/useGeospatialMetrics.ts) | Hotspots, climate, incidents |
| `usePredictionsMetrics` | [usePredictionsMetrics.ts](app/hooks/usePredictionsMetrics.ts) | Model status and forecasts |
| `useStreamsMetrics` | [useStreamsMetrics.ts](app/hooks/useStreamsMetrics.ts) | Kafka and Flink health |
| `useDataLakeMetrics` | [useDataLakeMetrics.ts](app/hooks/useDataLakeMetrics.ts) | Storage, quality, lineage |
| `useSecurityMetrics` | [useSecurityMetrics.ts](app/hooks/useSecurityMetrics.ts) | Audit logs, access control |
| `useSecurityMonitoring` | [useSecurityMonitoring.ts](app/hooks/useSecurityMonitoring.ts) | Real-time threat detection |
| `useServingHealthMetrics` | [useServingHealthMetrics.ts](app/hooks/useServingHealthMetrics.ts) | ML model serving health |
| `useIntelligenceAlerts` | [useIntelligenceAlerts.ts](app/hooks/useIntelligenceAlerts.ts) | NLP pipeline alert feed |
| `useProcessingLog` | [useProcessingLog.ts](app/hooks/useProcessingLog.ts) | System event history |
| `useDecisionHeatmapData` | [useDecisionHeatmapData.ts](app/hooks/useDecisionHeatmapData.ts) | Multi-layer heatmap data |

**Behavior:**
- Each hook initializes `data`, `loading`, and `error` state
- Fetches from its API endpoint on mount via `useEffect`
- Provides fallback/mock data if the backend is unavailable
- Cleans up via cancellation token on unmount

---

## 9. Design System

### Color Palette
Defined in [app/globals.css](app/globals.css) as CSS custom properties:

| Variable | Hex | Usage |
|---|---|---|
| `--accent-gold` | `#c8a84a` | Primary accent, active nav items, highlights |
| `--accent-steel` | `#5b8db8` | Secondary data, charts, borders |
| `--accent-emerald` | `#3eb87a` | Online status, positive metrics, success |
| `--accent-crimson` | `#b84a4a` | Critical alerts, errors, denials |
| `--accent-amber` | `#c8822a` | High severity warnings |
| `--accent-lavender` | `#8a78c8` | AI/ML pipeline elements |
| `--background` | `#030810` | Deep obsidian background |

### Typography
- **Sans font:** Geist Sans (Google Fonts)
- **Mono font:** Geist Mono (Google Fonts) — used for data values, logs, code
- **Framework:** Tailwind CSS v4 with custom design tokens

### Component Patterns
- Stat cards with colored borders keyed to data category
- Section headers with uppercase tracking and muted subtitles
- Tables with subtle row hover states
- Charts using the Recharts library with custom ONTORA color scheme
- Loading skeletons while data fetches

---

## 10. Configuration & Deployment

### Key Configuration Files

| File | Purpose |
|---|---|
| [backend/config.py](backend/config.py) | All environment-driven backend configuration |
| [package.json](package.json) | Frontend dependencies and scripts |
| `docker-compose.yml` | Full-stack local development |
| `/k8s/` | Kubernetes manifests for production |

### Backend Configuration (`config.py`)
```python
DATABASE_URL         = "postgresql://..."
NEO4J_URI            = "bolt://..."
REDIS_URL            = "redis://..."
GROK_API_KEY         = "..."
GEMINI_API_KEY       = "..."
API_NINJAS_KEY       = "..."
OLLAMA_HOST          = "http://localhost:11434"
OLLAMA_MODEL         = "llama3"
CHUNK_SIZE           = 4000       # Bill analysis chunk size (tokens)
MAX_CHUNKS           = 10         # Max parallel LLM calls
ENVIRONMENT          = "development"
```

### Frontend Scripts (`package.json`)
```bash
npm run dev      # Start Next.js dev server (port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

### Docker Compose Services
```yaml
services:
  frontend:    # Next.js — port 3000
  backend:     # FastAPI — port 8000
  postgres:    # PostgreSQL — port 5432
  neo4j:       # Neo4j — ports 7474 (browser), 7687 (bolt)
  redis:       # Redis — port 6379
  kafka:       # Apache Kafka — port 9092
  zookeeper:   # Kafka dependency — port 2181
  flink:       # Apache Flink — port 8081
```

### Port Summary
| Service | Port |
|---|---|
| Next.js Frontend | 3000 |
| FastAPI Backend | 8000 |
| PostgreSQL | 5432 |
| Neo4j Browser | 7474 |
| Neo4j Bolt | 7687 |
| Redis | 6379 |
| Kafka | 9092 |
| Flink Dashboard | 8081 |

---

*Documentation for ONTORA — DMC Hackathon project. Last updated: 2026-03-26.*
