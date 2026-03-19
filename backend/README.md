# ONTORA Backend Setup Guide

## Quick Start (Using Docker Compose)

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11+ (for local development)
- 4GB+ RAM available

### Step 1: Start Containers

```bash
cd d:/DMC_Hackathon
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Neo4j (ports 7687, 7474)
- Redis (port 6379)
- Kafka cluster (3 brokers, ports 9092-9094)
- FastAPI backend (port 8000)
- Prometheus (port 9090)
- Grafana (port 3001)

### Step 2: Verify Services

```bash
# Check API health
curl http://localhost:8000/health

# Check each response
# Success: {"status": "ok", "version": "0.1.0", ...}
```

### Step 3: Access Services

- **API Documentation**: http://localhost:8000/docs
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Neo4j Browser**: http://localhost:7474 (neo4j/neo4j_password)
- **PostgreSQL**: Use pgAdmin or command line

## Local Development (Without Docker)

### Prerequisites
```bash
# RECOMMENDED: Python 3.12 (best package compatibility)
# https://www.python.org/downloads/

# Also supported: Python 3.11, Python 3.13 (with requirements-py313.txt)

python -m venv venv
source venv/Scripts/activate  # Windows
source venv/bin/activate      # Linux/Mac
```

### Install Dependencies

**For Python 3.13 on Windows (FIX FOR BUILD ERRORS):**
```bash
pip install -r requirements-windows-py313.txt --only-binary :all: --no-build-isolation
```

**For Python 3.13 (other OS):**
```bash
pip install -r requirements-py313.txt --only-binary :all:
```

**For Python 3.12 (RECOMMENDED):**
```bash
pip install -r requirements-py312.txt
```

**For Python 3.11:**
```bash
pip install -r requirements.txt
```

**For Windows (any Python version - no compilation):**
```bash
pip install -r requirements-windows.txt
```

**Troubleshooting If Install Fails:**
```bash
# Force pre-built wheels only (no compilation)
pip install --only-binary :all: -r requirements-windows-py313.txt

# Or upgrade pip first
python -m pip install --upgrade pip
pip install -r requirements-windows-py313.txt --only-binary :all:

# Clear pip cache if needed
pip cache purge
```

**Note:** 
- All requirements now use available stable versions (sqlalchemy==2.0.48+)
- Windows users should add `--only-binary :all:` to avoid pandas/numpy compilation errors
- Python 3.12 is recommended for best package compatibility
- If you get compilation errors, you likely need Microsoft C++ Build Tools or should use pre-built wheels only

### Run PostgreSQL & Neo4j
```bash
# Install locally or use Docker for just databases
docker-compose up -d postgres neo4j redis zookeeper kafka-1 kafka-2 kafka-3
```

### Start Backend
```bash
cd backend
python main.py
```

## API Endpoints (Phase 1)

### Metrics
- `GET /api/metrics/regional-risk` - Regional risk scores
- `GET /api/metrics/global-entities` - Entity counts
- `GET /api/metrics/threat-threads` - Threat statistics
- `GET /api/metrics/daily-ingestion` - Data ingestion metrics
- `GET /api/metrics/prediction-accuracy` - Model accuracy

### Intelligence
- `GET /api/intelligence/entity-extraction` - Entity metrics
- `GET /api/intelligence/language-distribution` - Language stats
- `GET /api/intelligence/trending-keywords` - Trending topics

### Knowledge Graph
- `GET /api/knowledge-graph/nodes` - Node types and counts
- `GET /api/knowledge-graph/relationships` - Relationship info
- `GET /api/knowledge-graph/paths/{source}/{target}` - Path finding

### Geospatial
- `GET /api/geospatial/hotspots` - Conflict hotspots
- `GET /api/geospatial/climate-indicators` - Climate data
- `GET /api/geospatial/incidents/{region}` - Regional incidents

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update credentials as needed
3. Backend will read from `.env` automatically

## Requirements Files Guide

- **requirements.txt** - Core dependencies for Python 3.11 (shared base)
- **requirements-py312.txt** - For Python 3.12 (RECOMMENDED - best compatibility)
- **requirements-py313.txt** - For Python 3.13+ (uses newer package versions)
- **requirements-windows.txt** - For Windows local development (excludes psycopg2-binary)
- **requirements-windows-py313.txt** - **FOR WINDOWS + PYTHON 3.13** (use `--only-binary :all:`)
- **requirements-docker.txt** - For Docker builds (includes psycopg2-binary and production packages)
- **requirements-dev.txt** - For full development environment (testing, linting, docs)
- **requirements-optional.txt** - Heavy optional packages (NLP, transformers, Selenium)

## Database Initialization

PostgreSQL tables are auto-created on startup. To manually initialize:

```python
from db.postgres import init_db
import asyncio

asyncio.run(init_db())
```

Neo4j constraints:

```bash
# Via Neo4j Browser (http://localhost:7474)
CREATE CONSTRAINT country_code IF NOT EXISTS 
  FOR (n:Country) REQUIRE n.iso_code IS UNIQUE
```

## Troubleshooting

### SQLAlchemy Version Not Found
**Problem:** `Could not find a version that satisfies the requirement sqlalchemy>=2.1.0`

**Solution:** SQLAlchemy 2.1.0 hasn't been released yet (still in beta). Use available stable version:
```bash
# Already fixed in requirements files (using sqlalchemy==2.0.48)
pip install -r requirements-windows-py313.txt --only-binary :all: --no-build-isolation
```

All requirements files now use `sqlalchemy==2.0.48` which is stable and available.

### Pandas Compilation Error (Windows Python 3.13)
**Problem:** `subprocess-exited-with-error` when installing pandas

**Solution:** Use pre-built wheels only:
```bash
pip install -r requirements-windows-py313.txt --only-binary :all: --no-build-isolation
```

Pandas 2.1.3 doesn't have pre-built wheels for Python 3.13, so pip tries to compile from source. Using `--only-binary :all:` forces pip to find pandas 2.2.0+ (which has Python 3.13 wheels) or skip compilation.

**Alternative:** Use Python 3.12 instead:
```bash
# Download Python 3.12 from python.org
pip install -r requirements-py312.txt
```

### Windows: psycopg2-binary Build Error
**Problem:** `error: pg_config executable not found`

**Solution:** Use `requirements-windows.txt` instead:
```bash
pip install -r requirements-windows.txt
```

This avoids psycopg2-binary and uses `asyncpg` for async operations instead.

### PostgreSQL Connection Error
```bash
# Check if service is running
docker-compose logs postgres

# Verify credentials in .env
POSTGRES_USER=ontora_user
POSTGRES_PASSWORD=ontora_password
```

### Neo4j Connection Error
```bash
# Check service
docker-compose logs neo4j

# Access browser at http://localhost:7474
# Default: neo4j / neo4j_password
```

### Kafka Not Responding
```bash
docker-compose logs kafka-1

# Test connection
docker-compose exec kafka-1 \
  kafka-broker-api-versions \
  --bootstrap-server localhost:9092
```

## Next Steps

1. Test MEA scraper: `python backend/ingestors/mea_scraper.py`
2. Test World Bank fetcher: `python backend/ingestors/worldbank_fetcher.py`
3. Develop Kafka producers/consumers
4. Implement NLP pipeline
5. Connect React frontend

## Documentation

- [Architecture](../INTEGRATION_PLAN.txt)
- [API Spec](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)

## Support

For issues, check:
1. Docker logs: `docker-compose logs <service>`
2. Backend logs: `/var/log/ontora/` (if configured)
3. Integration Plan (INTEGRATION_PLAN.txt)
