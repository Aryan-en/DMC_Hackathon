# ONTORA Database Schema Documentation

## Overview

ONTORA uses a hybrid database architecture:

1. **PostgreSQL** (d:/DMC_Hackathon/backend/db/schemas.py)
   - Relational data: Countries, Economic Indicators, Documents, Entities, Relationships
   - Time-series data: System metrics, Audit logs
   - Full-text search capability

2. **Neo4j**
   - Knowledge graph: Entity relationships, causal chains
   - Graph algorithms: Path finding, community detection
   - Real-time relationship traversal

---

## PostgreSQL Schema

### 1. Country

Stores sovereign nations and territories.

```sql
CREATE TABLE country (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    gdp FLOAT,
    population BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_country_iso ON country(iso_code);
CREATE INDEX idx_country_region ON country(region);
```

**Relationships:**
- One-to-Many: Country → EconomicIndicator
- One-to-Many: Country → Document (source country)
- Many-to-Many: Country ↔ CountryRelation

---

### 2. CountryRelation

Bilateral relations and trade data.

```sql
CREATE TABLE country_relation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country1_id UUID NOT NULL REFERENCES country(id),
    country2_id UUID NOT NULL REFERENCES country(id),
    relation_type VARCHAR(50) NOT NULL,  -- ALLY, RIVAL, NEUTRAL, etc.
    trade_volume FLOAT,
    trade_volume_currency VARCHAR(10) DEFAULT 'USD',
    trade_volume_year INT,
    status VARCHAR(50),
    agreements JSONB,
    key_issues TEXT [],
    sentiment_score FLOAT,
    confidence_score FLOAT,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_country_relation_pair ON country_relation(country1_id, country2_id);
CREATE INDEX idx_country_relation_type ON country_relation(relation_type);
CREATE INDEX idx_country_relation_sentiment ON country_relation(sentiment_score);
```

**Relationships:**
- Many-to-One: CountryRelation → Country (country1)
- Many-to-One: CountryRelation → Country (country2)

---

### 3. EconomicIndicator

World Bank economic data.

```sql
CREATE TABLE economic_indicator (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES country(id),
    indicator_code VARCHAR(20) NOT NULL,  -- NY.GDP.MKTP.CD, etc.
    indicator_name VARCHAR(255) NOT NULL,
    value FLOAT,
    unit VARCHAR(50),
    year INT NOT NULL,
    source VARCHAR(100) DEFAULT 'World Bank',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_economic_indicator_country_year 
    ON economic_indicator(country_id, year);
CREATE INDEX idx_economic_indicator_code 
    ON economic_indicator(indicator_code);
```

**Relationships:**
- Many-to-One: EconomicIndicator → Country

---

### 4. Document

Raw documents from various sources.

```sql
CREATE TABLE document (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(50) NOT NULL,  -- MEA, NEWS, SOCIAL, RESEARCH
    source_url VARCHAR(500),
    country_id UUID REFERENCES country(id),
    language VARCHAR(10) DEFAULT 'en',
    published_date TIMESTAMP,
    ingested_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB,
    embedding_id UUID  -- Future: vector embedding reference
);

CREATE INDEX idx_document_source_type ON document(source_type);
CREATE INDEX idx_document_country ON document(country_id);
CREATE INDEX idx_document_ingested ON document(ingested_at);
```

**Relationships:**
- Many-to-One: Document → Country
- One-to-Many: Document → Entity (via extraction)

---

### 5. Entity

Extracted entities (people, organizations, places, events).

```sql
CREATE TABLE entity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,  -- PERSON, ORG, GPE, EVENT, CONCEPT
    description TEXT,
    wikipedia_url VARCHAR(500),
    wikidata_id VARCHAR(50),
    confidence_score FLOAT,
    source_document_id UUID REFERENCES document(id),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_entity_name ON entity(name);
CREATE INDEX idx_entity_type ON entity(entity_type);
CREATE INDEX idx_entity_confidence ON entity(confidence_score);
CREATE UNIQUE INDEX idx_entity_wikidata ON entity(wikidata_id) 
    WHERE wikidata_id IS NOT NULL;
```

**Relationships:**
- Many-to-One: Entity → Document

---

### 6. Relationship

Triplets: (subject, predicate, object).

```sql
CREATE TABLE relationship (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entity_id UUID NOT NULL REFERENCES entity(id),
    target_entity_id UUID NOT NULL REFERENCES entity(id),
    predicate VARCHAR(100) NOT NULL,  -- CONTROLS, INFLUENCES, OWNS, etc.
    confidence_score FLOAT,
    source_document_id UUID REFERENCES document(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_relationship_source 
    ON relationship(source_entity_id);
CREATE INDEX idx_relationship_target 
    ON relationship(target_entity_id);
CREATE INDEX idx_relationship_predicate 
    ON relationship(predicate);
CREATE UNIQUE INDEX idx_relationship_triplet 
    ON relationship(source_entity_id, target_entity_id, predicate);
```

**Relationships:**
- Many-to-One: Relationship → Entity (source)
- Many-to-One: Relationship → Entity (target)
- Many-to-One: Relationship → Document

---

### 7. AuditLog

Access and modification audit trail.

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    action VARCHAR(50) NOT NULL,  -- READ, CREATE, UPDATE, DELETE
    resource_type VARCHAR(50) NOT NULL,  -- entity, country, document, etc.
    resource_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_resource 
    ON audit_log(resource_type, resource_id);
```

**Relationships:**
- Many-to-One: AuditLog → User

---

### 8. User

System users with clearance levels.

```sql
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    clearance_level VARCHAR(50),  -- UNCLASS, CONFIDENTIAL, SECRET, TS/SCI
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_clearance ON "user"(clearance_level);
```

---

### 9. SystemMetric

Generic metric storage for monitoring.

```sql
CREATE TABLE system_metric (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    tags JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_system_metric_name_time 
    ON system_metric(metric_name, timestamp);
```

---

## Neo4j Schema

### Node Labels

```cypher
-- Nodes
CREATE LABEL Country
CREATE LABEL Policy
CREATE LABEL Event
CREATE LABEL Sector
CREATE LABEL Actor
CREATE LABEL Concept

-- Constraints (Uniqueness)
CREATE CONSTRAINT country_code IF NOT EXISTS
FOR (n:Country) REQUIRE n.iso_code IS UNIQUE

CREATE CONSTRAINT policy_id IF NOT EXISTS
FOR (n:Policy) REQUIRE n.policy_id IS UNIQUE

CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (n:Event) REQUIRE n.event_id IS UNIQUE
```

### Relationship Types

```cypher
CONTROLS      -- Actor → Resource
GOVERNS       -- Government → Territory
INFLUENCES    -- Entity → Entity (causal)
OWNS          -- Organization → Asset
TRADES_WITH   -- Country → Country
ALLIES_WITH   -- Country → Country
CONFLICTS_WITH -- Country → Country
AFFECTS       -- Event → Region
CAUSES        -- Event → Event (causal chain)
PART_OF       -- Entity → Larger Entity
```

### Example Queries

**Find all allies of a country:**
```cypher
MATCH (c1:Country {iso_code: 'IND'})-[:ALLIES_WITH]->(c2:Country)
RETURN c2
```

**Find causal event chains:**
```cypher
MATCH path = (e1:Event)-[:CAUSES*1..5]->(e2:Event)
WHERE e1.event_id = 'EVENT_001'
  AND e2.event_id = 'EVENT_999'
RETURN path
```

**Find policy influence networks:**
```cypher
MATCH (p:Policy)-[:INFLUENCES*1..3]->(s:Sector)
WHERE p.country = 'IND'
RETURN s
```

---

## Database Initialization (PostgreSQL)

Tables are auto-created on first run via SQLAlchemy:

```python
from db.postgres import init_db
import asyncio

asyncio.run(init_db())
```

This executes:
```sql
CREATE TABLE IF NOT EXISTS country (...)
CREATE TABLE IF NOT EXISTS country_relation (...)
-- ... all tables
```

---

## Database Initialization (Neo4j)

Constraints must be created manually:

```bash
# Via Neo4j Browser: http://localhost:7474
# Execute in Cypher console:

CREATE CONSTRAINT country_code IF NOT EXISTS
FOR (n:Country) REQUIRE n.iso_code IS UNIQUE

CREATE CONSTRAINT policy_id IF NOT EXISTS
FOR (n:Policy) REQUIRE n.policy_id IS UNIQUE

CREATE CONSTRAINT event_id IF NOT EXISTS
FOR (n:Event) REQUIRE n.event_id IS UNIQUE
```

Or programmatically:

```python
from db.neo4j import init_constraints
import asyncio

asyncio.run(init_constraints())
```

---

## Migration Strategy

### PostgreSQL

Current: No migrations (SQLAlchemy creates schema)

Future: Implement Alembic for schema versioning:

```bash
alembic init alembic
alembic revision --autogenerate -m "Add column X"
alembic upgrade head
```

### Neo4j

Current: Manual constraint creation

Future: Implement cypher migration scripts in `db/migrations/`

---

## Backup & Recovery

### PostgreSQL Backup
```bash
docker-compose exec postgres \
  pg_dump -U ontora_user ontora_db \
  > backup.sql
```

### PostgreSQL Restore
```bash
docker-compose exec -T postgres \
  psql -U ontora_user ontora_db \
  < backup.sql
```

### Neo4j Backup
```bash
docker-compose exec neo4j \
  neo4j-admin dump \
  --database=neo4j \
  --to=/data/backups/backup.dump
```

---

## Troubleshooting

### PostgreSQL Connection Issues
```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle';
```

### Neo4j Performance
```cypher
-- Profile query performance
PROFILE MATCH (n:Country) RETURN n

-- Check index usage
SHOW INDEXES
```

---

## Performance Optimization

### Indexes
- Country: iso_code (lookup), region (filtering)
- EconomicIndicator: (country_id, year) composite
- Entity: name (search), type (filtering), confidence (sorting)
- Relationship: (source, target, predicate) composite for uniqueness

### Query Optimization
- Use composite indexes for filtering
- Avoid SELECT * (specify columns)
- Use LIMIT for paging
- Batch operations for bulk inserts

### Monitoring
- Prometheus collects db metrics
- Grafana dashboards for visualization
- Slow query logs in PostgreSQL

---

## Future Enhancements

1. **Full-Text Search Index**
   ```sql
   CREATE INDEX idx_document_fts ON document 
   USING GIN (to_tsvector('english', content))
   ```

2. **Vector Embeddings**
   - Store embeddings in pgvector extension
   - Enable semantic similarity search

3. **Geospatial Queries**
   - PostGIS extension for location data
   - Spatial indexing on incident locations

4. **Streaming**
   - Real-time data lake (Delta Lake/Apache Iceberg)
   - Streaming to Kafka → Spark → Data Lake
