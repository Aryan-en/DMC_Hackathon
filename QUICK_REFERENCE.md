# ONTORA Development Quick Reference

## Project Summary

**Project Name**: ONTORA (Intelligence Platform)
**Status**: Phase 1 Foundation - 55% Complete
**Tech Stack**: FastAPI + PostgreSQL + Neo4j + Kafka + React
**Created**: January 15, 2024
**Location**: `d:\DMC_Hackathon`

---

## Quick Start

```bash
# 1. Start all services
cd d:\DMC_Hackathon
docker-compose up -d

# 2. Verify health
curl http://localhost:8000/health

# 3. Access services
# API Docs: http://localhost:8000/docs
# Postgres: psql -h localhost -U ontora_user -d ontora_db
# Neo4j: http://localhost:7474 (neo4j/neo4j_password)
# Grafana: http://localhost:3001 (admin/admin)
# Prometheus: http://localhost:9090
```

---

## File Structure

```
d:\DMC_Hackathon\
├── app/                          # Next.js React frontend
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── [modules]/                # 8 dashboard modules
│       ├── data-lake/page.tsx
│       ├── data-streams/page.tsx
│       ├── geospatial/page.tsx
│       ├── intelligence/page.tsx
│       ├── knowledge-graph/page.tsx
│       ├── predictions/page.tsx
│       ├── security/page.tsx
│       └── data-streams/page.tsx
│
├── backend/                       # FastAPI backend
│   ├── main.py                   # Entry point
│   ├── config.py                 # Environment config
│   ├── requirements.txt           # Python dependencies
│   ├── README.md                 # Setup guide
│   │
│   ├── db/                       # Database layer
│   │   ├── postgres.py           # PostgreSQL async setup
│   │   ├── neo4j.py              # Neo4j async driver
│   │   └── schemas.py            # 10 SQLAlchemy models
│   │
│   ├── api/                      # REST API endpoints
│   │   ├── metrics.py            # 6 endpoints
│   │   ├── intelligence.py       # 3 endpoints
│   │   ├── knowledge_graph.py    # 3 endpoints
│   │   └── geospatial.py         # 3 endpoints
│   │
│   ├── ingestors/                # Data source connectors
│   │   ├── mea_scraper.py        # MEA relations scraper
│   │   ├── worldbank_fetcher.py  # World Bank API client
│   │   └── kafka_producer.py     # 3 Kafka producers
│   │
│   ├── consumers/                # Kafka data processors
│   │   └── postgres_consumer.py  # 3 Kafka consumers
│   │
│   ├── services/                 # Business logic
│   │   └── __init__.py
│   │
│   ├── docs/
│   │   ├── API.md                # API specification
│   │   └── DATABASE.md           # Database schema docs
│   │
│   └── Dockerfile                # Container image
│
├── public/                        # Static assets
├── docker-compose.yml             # 11-service orchestration
├── .env.example                   # Config template
├── INTEGRATION_PLAN.txt           # 16-week roadmap (5800+ lines)
├── PROGRESS_CHECKLIST.txt         # Implementation tracking
└── NEXT_STEPS.md                  # Immediate action items
```

---

## API Endpoints (Live & Ready)

### Metrics (Strategic Overview)
- `GET /api/metrics/regional-risk` - Risk scores by region
- `GET /api/metrics/global-entities` - Entity count breakdown
- `GET /api/metrics/threat-threads` - Threat classification
- `GET /api/metrics/daily-ingestion` - Data volume metrics
- `GET /api/metrics/prediction-accuracy` - Model accuracy scores
- `GET /api/metrics/infrastructure-health` - System health status

### Intelligence Hub
- `GET /api/intelligence/entity-extraction` - NLP entity metrics
- `GET /api/intelligence/language-distribution` - Document languages
- `GET /api/intelligence/trending-keywords` - Top trending topics

### Knowledge Graph
- `GET /api/knowledge-graph/nodes` - Node types & counts
- `GET /api/knowledge-graph/relationships` - Relationship types
- `GET /api/knowledge-graph/paths/{source}/{target}` - Path finding

### Geospatial
- `GET /api/geospatial/hotspots` - Conflict zones
- `GET /api/geospatial/climate-indicators` - Climate data by region
- `GET /api/geospatial/incidents/{region}` - Regional incidents

### Health & Info
- `GET /health` - API health status
- `GET /api/version` - API version info

**Note**: All endpoints currently return mock data. Switch to real database queries in Week 2.

---

## Database Schemas

### PostgreSQL (11 tables)
1. **Country** (193 records) - Nations and territories
2. **CountryRelation** (bilateral) - Trade, diplomatic relations
3. **EconomicIndicator** (time-series) - GDP, inflation, FDI, etc.
4. **Document** (raw content) - MEA, news, social media
5. **Entity** (extracted) - People, organizations, places, events
6. **Relationship** (triplets) - Subject-Predicate-Object
7. **AuditLog** (compliance) - Access tracking
8. **User** (authentication) - Users with clearance levels
9. **SystemMetric** (monitoring) - Prometheus metrics

### Neo4j (Entity Graph)
- **Nodes**: Country, Policy, Event, Sector, Actor, Concept
- **Relationships**: CONTROLS, GOVERNS, INFLUENCES, OWNS, TRADES_WITH, ALLIES_WITH, CONFLICTS_WITH, AFFECTS, CAUSES, PART_OF

---

## Docker Services (11 Total)

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| PostgreSQL | 5432 | ✓ Running | Relational database |
| Neo4j | 7687 | ✓ Running | Graph database |
| Redis | 6379 | ✓ Running | Cache & session store |
| Zookeeper | 2181 | ✓ Running | Kafka coordination |
| Kafka-1 | 9092 | ✓ Running | Message broker (primary) |
| Kafka-2 | 9093 | ✓ Running | Message broker (replica) |
| Kafka-3 | 9094 | ✓ Running | Message broker (replica) |
| Backend | 8000 | ✓ Running | FastAPI server |
| Prometheus | 9090 | ✓ Running | Metrics collection |
| Grafana | 3001 | ✓ Running | Dashboard/visualization |
| --- | --- | --- | --- |

---

## Key Technologies

| Component | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.104.1 | Web framework |
| PostgreSQL | 15 | OLTP database |
| Neo4j | 5.13 | Knowledge graph |
| Kafka | 3.5 | Message broker |
| Redis | 7 | Cache layer |
| SQLAlchemy | 2.0 | ORM |
| Pydantic | V2 | Data validation |
| spaCy | 3.x | NLP |
| PyTorch | Latest | ML framework |
| Ollama | Latest | LLM inference |

---

## Configuration

**Environment Variables** (see `.env.example`):
```
# API
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=ontora_user
POSTGRES_PASSWORD=ontora_password
POSTGRES_DB=ontora_db

# Neo4j
NEO4J_HOST=neo4j
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j_password

# Kafka
KAFKA_BROKERS=kafka-1:9092,kafka-2:9093,kafka-3:9094

# ML
OLLAMA_HOST=http://ollama:11434
SPACY_MODEL=en_core_web_sm

# Security
JWT_SECRET=your-secret-key
```

---

## Data Sources

### 1. MEA (Ministry of External Affairs)
- **URL**: https://www.mea.gov.in/foreign-relations.htm
- **Data**: Bilateral relations, trade volume, agreements, sentiment
- **Scraper**: `backend/ingestors/mea_scraper.py`
- **Producer Topic**: `mea.relations.raw`
- **Consumer**: `MEARelationConsumer` → PostgreSQL

### 2. World Bank API
- **URL**: https://api.worldbank.org/v2
- **Indicators**: GDP, inflation, unemployment, FDI, population, trade, life expectancy, urbanization
- **Fetcher**: `backend/ingestors/worldbank_fetcher.py`
- **Producer Topic**: `economic.indicators.batch`
- **Consumer**: `EconomicIndicatorConsumer` → PostgreSQL

### 3. News & Social Media (Future)
- **Topics**: Global events, policy changes, conflicts
- **Producer Topic**: `documents.raw`
- **Consumer**: `DocumentConsumer` → PostgreSQL

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ DATA INGESTION LAYER                                            │
├─────────────────────────────────────────────────────────────────┤
│ MEA Scraper     │ World Bank API  │ News Feeds    │ Social Media│
│ (mea_scraper.py)│ (worldbank_*.py)│ (news_client) │ (twitter_*) │
└────────┬─────────────────┬──────────────┬─────────────────┬──────┘
         │                 │              │                 │
         ▼                 ▼              ▼                 ▼
┌────────────────────────────────────────────────────────────────┐
│ KAFKA MESSAGE BROKER (3-broker cluster)                        │
├────────────────────────────────────────────────────────────────┤
│ mea.relations.raw   │ economic.indicators.batch  │  documents.raw
└────┬─────────────────────────┬──────────────────────────┬──────┘
     │                         │                          │
     ▼                         ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│ CONSUMERS (Async Processing)                              │
├──────────────────────────────────────────────────────────────┤
│ MEARelationConsumer │ EconomicIndicatorConsumer │ DocumentConsumer
└────┬───────────────────────┬──────────────────────────┬──────┘
     │                       │                          │
     ▼                       ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE LAYER                                             │
├──────────────────────────────────────────────────────────────┤
│ PostgreSQL          │ Neo4j           │ Redis (Cache)       │
│ ├─ CountryRelation  │ ├─ :Country     │                     │
│ ├─ EconomicIndicator│ ├─ :Entity      │                     │
│ ├─ Document         │ ├─ :Event       │                     │
│ ├─ Entity           │ └─ :Relationship│                     │
│ └─ Relationship     │                 │                     │
└────┬───────────────────────┬──────────────────────┬─────────┘
     │                       │                      │
     ▼                       ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│ API LAYER (FastAPI)                                        │
├──────────────────────────────────────────────────────────────┤
│ /api/metrics/*      │ /api/intelligence/*  │ /api/geospatial/*
│ /api/knowledge-graph/   (12 endpoints total)
└────┬─────────────────────────┬──────────────────────────┬───┘
     │                         │                          │
     ▼                         ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND LAYER (React/Next.js)                             │
├──────────────────────────────────────────────────────────────┤
│ Strategic    │ Intelligence │ Knowledge   │ Geospatial  │   │
│ Overview     │ Hub          │ Graph       │ Intelligence│ ... │
└──────────────────────────────────────────────────────────────┘
```

---

## Development Workflow

### Starting Development
```bash
# Terminal 1: Start all services
docker-compose up -d

# Terminal 2: View logs
docker-compose logs -f backend

# Terminal 3: Run frontend dev server
cd d:\DMC_Hackathon
npm run dev
```

### Testing
```bash
# API endpoint test
curl http://localhost:8000/api/metrics/regional-risk

# Database connection
docker-compose exec postgres psql -U ontora_user -d ontora_db
```

### Making Changes

**Backend Code**:
1. Edit Python files in `backend/`
2. Restart service: `docker-compose restart backend`
3. Check logs: `docker-compose logs backend`

**Frontend Code**:
1. Edit React/TypeScript in `app/`
2. Next.js dev server auto-reloads
3. Check console: Browser DevTools

**Database Schema**:
1. Edit `backend/db/schemas.py`
2. Restart backend (auto-migrates on startup)
3. Verify in database

---

## Common Tasks

### Add a New API Endpoint
1. Create function in `backend/api/module.py`
2. Add `@router.get("/path")`
3. Include router in `backend/main.py`
4. Restart backend

### Add a New Data Source
1. Create scraper/fetcher class in `backend/ingestors/`
2. Create producer in `backend/ingestors/kafka_producer.py`
3. Create consumer in `backend/consumers/postgres_consumer.py`
4. Update data pipeline orchestrator

### Query Real Data Instead of Mock
1. Replace mock dict in endpoint
2. Query database: `session.execute(select(Model)...)`
3. Return DTO: `[item.to_dict() for item in results]`

### Monitor Performance
1. Prometheus: http://localhost:9090
2. Grafana: http://localhost:3001 (admin/admin)
3. Create dashboard queries for your metrics

---

## Known Limitations & TODOs

- ✗ Mock data only (replace with DB queries Week 2)
- ✗ No authentication (add OAuth2 Week 5)
- ✗ Limited NLP (add spaCy+LLaMA Week 3)
- ✗ No real Neo4j queries (implement Week 3)
- ✗ No PostGIS geospatial (implement Week 4)
- ✗ Frontend not connected (integrate Week 2)
- ✓ Docker infrastructure: READY
- ✓ Database schemas: READY
- ✓ API framework: READY
- ✓ Data pipelines: READY

---

## Troubleshooting

**Docker won't start?**
```bash
docker-compose down  # Clean up
docker system prune   # Remove dangling resources
docker-compose up -d  # Try again
```

**PostgreSQL connection error?**
```bash
docker-compose logs postgres  # Check logs
docker-compose restart postgres # Restart
```

**Kafka lag behind?**
```bash
docker-compose logs kafka-1    # Check broker logs
docker-compose exec kafka-1 kafka-topics --list --bootstrap-server localhost:9092
```

**API returning 500?**
```bash
docker-compose logs backend     # Check Python errors
python backend/main.py          # Run locally for debug
```

---

## Additional Resources

- **Architecture**: [INTEGRATION_PLAN.txt](./INTEGRATION_PLAN.txt) (5800+ lines)
- **Progress**: [PROGRESS_CHECKLIST.txt](./PROGRESS_CHECKLIST.txt)
- **Next Steps**: [NEXT_STEPS.md](./NEXT_STEPS.md)
- **API Docs**: [backend/docs/API.md](./backend/docs/API.md)
- **DB Schema**: [backend/docs/DATABASE.md](./backend/docs/DATABASE.md)
- **Setup**: [backend/README.md](./backend/README.md)

---

## Contact & Support

- **Architecture**: See INTEGRATION_PLAN.txt for technical decisions
- **Code Issues**: Check logs via `docker-compose logs`
- **Database Questions**: See DATABASE.md
- **API Questions**: Swagger UI at http://localhost:8000/docs

---

**Last Updated**: January 15, 2024
**Version**: 0.1.0
**Phase**: 1 Foundation (55% complete)
