# NEXT STEPS - IMMEDIATE ACTION ITEMS

## Current Status
- Phase 1 Foundation: 55% Complete
- 26 files created (~4000 lines of code)
- All infrastructure ready: FastAPI, PostgreSQL, Neo4j, Kafka, Docker
- All 12 API endpoints framework-ready (returning mock data)
- Scrapers & data pipeline framework complete

## URGENT - Next Actions (Priority Order)

### 1. CONNECTION TESTING & VALIDATION
**Status**: Ready to test
**Time Estimate**: 30-60 minutes

```bash
# Start all services
cd d:\DMC_Hackathon
docker-compose up -d

# Verify services are running
docker-compose ps

# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/metrics/regional-risk

# Check database connections
# PostgreSQL: psql -h localhost -U ontora_user -d ontora_db
# Neo4j: http://localhost:7474 (neo4j / neo4j_password)
# Kafka: docker-compose logs kafka-1
```

### 2. CONNECT SCRAPERS TO KAFKA PIPELINE (Day 1-2)
**Status**: Code frameworks ready, integration pending

Create orchestrator script that:
1. Runs MEA scraper → produces to Kafka (mea.relations.raw)
2. Runs World Bank fetcher → produces to Kafka (economic.indicators.batch)
3. Kafka consumers read → write to PostgreSQL

**File to Create**: `backend/orchestrator/data_pipeline.py`

```python
# Pseudo-code
async def run_data_pipeline():
    # 1. MEA scraping
    scraper = MEAScraper()
    mea_producer = MEARelationProducer()
    
    countries = ["China", "USA", "Russia", ...]
    for country in countries:
        relations = await scraper.fetch_country_relations(country)
        mea_producer.send_country_relation(relations)
    
    # 2. World Bank fetching
    fetcher = WorldBankFetcher()
    econ_producer = EconomicIndicatorProducer()
    
    for country_code in COUNTRY_CODES:
        indicators = await fetcher.fetch_indicators(country_code)
        econ_producer.send_indicator_batch(indicators)
    
    # 3. Start consumers
    mea_consumer = MEARelationConsumer()
    econ_consumer = EconomicIndicatorConsumer()
    
    await asyncio.gather(
        mea_consumer.start(),    # Reads kafka → writes PostgreSQL
        econ_consumer.start()    # Reads kafka → writes PostgreSQL
    )
```

### 3. CONNECT APIS TO REAL DATABASE QUERIES (Day 2-3)
**Status**: Mock data framework ready, database queries pending

Replace mock data in:
- `backend/api/metrics.py` - Query PostgreSQL for real metrics
- `backend/api/intelligence.py` - Query for real entities & language stats
- `backend/api/knowledge_graph.py` - Connect to Neo4j for graph data
- `backend/api/geospatial.py` - Query PostGIS for spatial data

**Example transformation**:
```python
# BEFORE (metrics.py - mock data)
@router.get("/api/metrics/regional-risk")
async def regional_risk():
    return {
        "status": "success",
        "data": [
            {"region": "South Asia", "risk_score": 72, ...}
        ]
    }

# AFTER (with real database)
@router.get("/api/metrics/regional-risk")
async def regional_risk(db: AsyncSession = Depends(get_db_session)):
    # Query regions from Neo4j
    # Calculate risk scores from threat threads
    # Return real data
```

### 4. NLP PIPELINE INTEGRATION (Day 3-4)
**Status**: Skeleton ready, models pending

Add to `backend/services/nlp_service.py`:
```python
import spacy

class NLPService:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
    
    def extract_entities(self, text: str):
        doc = self.nlp(text)
        return [(ent.text, ent.label_) for ent in doc.ents]
    
    def extract_relationships(self, text: str):
        # Dependency-based extraction
        doc = self.nlp(text)
        triplets = []
        for token in doc:
            if token.dep_ == "nsubj":  # Subject
                subject = token.text
                # Find object and predicate...
                triplets.append((subject, predicate, obj))
        return triplets
```

### 5. FRONTEND INTEGRATION (Day 4-5)
**Status**: Backend APIs ready, frontend pending

Create `app/lib/api.ts`:
```typescript
// Fetch real data from backend
export async function fetchMetrics() {
  const response = await fetch('http://localhost:8000/api/metrics/regional-risk');
  return response.json();
}

// Hook for React components
export function useMetrics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMetrics().then(setData).finally(() => setLoading(false));
  }, []);
  
  return { data, loading };
}
```

### 6. MONITORING & OBSERVABILITY (Day 5)
**Status**: Infrastructure ready (Prometheus/Grafana), dashboards pending

1. Verify Prometheus scraping FastAPI metrics
2. Create Grafana dashboards for:
   - API latency
   - Database query performance
   - Kafka lag & throughput
   - Error rates
   - System health

---

## Quick Start Checklist

- [ ] Start Docker Compose: `docker-compose up -d`
- [ ] Verify health: `curl http://localhost:8000/health`
- [ ] Test API endpoints
- [ ] Populate PostgreSQL with country data
- [ ] Run data pipeline orchestrator
- [ ] Verify Kafka message flow
- [ ] Query real data from PostgreSQL/Neo4j
- [ ] Update React components to use real APIs
- [ ] Test end-to-end data flow
- [ ] Setup Grafana dashboards

---

## Week-by-Week Plan for Next Phase

**Week 2 (Current):**
- [ ] Test all services startup (Day 1)
- [ ] Connect data pipeline (Day 2)
- [ ] Replace mock data with real queries (Day 3)
- [ ] Integrate NLP (Day 4)
- [ ] Connect React frontend (Day 5)

**Week 3:**
- [ ] Full end-to-end testing
- [ ] Performance optimization
- [ ] Add more country data
- [ ] Implement spaCy NLP extraction
- [ ] Begin Phase 2 (Intelligence Layer)

**Week 4:**
- [ ] LLM integration (Ollama + LLaMA-3)
- [ ] Neo4j graph population
- [ ] Advanced query optimization
- [ ] Dashboard refinement

---

## Known Issues & Workarounds

### 1. MEA Scraper HTML Structure
- **Issue**: Real MEA website structure may differ from implementation
- **Status**: BeautifulSoup selectors need validation
- **Action**: Test against actual MEA website and adjust CSS selectors

### 2. World Bank API Credentials
- **Issue**: Public API doesn't require auth, but rate limits may apply
- **Status**: Current implementation uses public endpoint
- **Action**: Implement exponential backoff & caching

### 3. PostgreSQL Foreign Keys
- **Issue**: CountryRelation expects country1_id and country2_id to reference different countries
- **Status**: Current MEA consumer logic may create self-references
- **Action**: Need to map bilateral relations properly (India-China, not India-India)

### 4. Neo4j Async Transactions
- **Issue**: Neo4j async driver requires proper session/transaction management
- **Status**: Consumer implementation ready but untested
- **Action**: Test with actual data and verify transaction semantics

---

## Files Needing Attention

### Critical (Must Create)
1. `backend/orchestrator/data_pipeline.py` - Main orchestration
2. Updates to `/backend/api/*.py` - Add database queries
3. `backend/services/nlp_service.py` - NLP pipeline
4. `app/lib/api.ts` - Frontend API client

### Important (Should Create)
1. `backend/tests/` - Unit tests for all services
2. `backend/migrations/` - Database migration scripts
3. `backend/scheduled_jobs.py` - Scheduler for periodic scraping

### Optional (Can Wait)
1. `backend/auth/` - Authentication service
2. `backend/monitoring/` - Custom monitoring
3. Documentation updates

---

## Validation Checkpoints

After each major section, validate:

✅ **Checkpoint 1: Services Running**
- [ ] All containers healthy: `docker-compose ps`
- [ ] API responds: `curl http://localhost:8000/health`
- [ ] Databases accessible

✅ **Checkpoint 2: Data Pipeline**
- [ ] Kafka messages flowing: `docker-compose logs kafka-1`
- [ ] PostgreSQL receives data: `SELECT COUNT(*) FROM country_relation;`
- [ ] No consumer errors

✅ **Checkpoint 3: Real Queries**
- [ ] API returns real data: `curl http://localhost:8000/api/metrics/regional-risk`
- [ ] Neo4j queries work: Verify in Neo4j browser
- [ ] Query latency acceptable (<500ms)

✅ **Checkpoint 4: End-to-End**
- [ ] Frontend loads data: Check React dev tools
- [ ] Charts render correctly
- [ ] No console errors

---

## Resources

- API Docs: `backend/docs/API.md`
- Database Schema: `backend/docs/DATABASE.md`
- Architecture: `INTEGRATION_PLAN.txt`
- Setup Guide: `backend/README.md`
- Code Examples: `/backend` (all .py files)

---

## Support / Debugging

**Docker Issues:**
```bash
docker-compose logs <service>  # View service logs
docker-compose down            # Stop all services
docker-compose up --build      # Rebuild images
```

**Database Issues:**
```bash
# PostgreSQL
docker-compose exec postgres psql -U ontora_user -d ontora_db

# Neo4j Browser
http://localhost:7474  (neo4j / neo4j_password)

# Kafka Topics
docker-compose exec kafka-1 kafka-topics --list --bootstrap-server localhost:9092
```

**Python Issues:**
```bash
cd backend
python -m pip install -r requirements.txt
python main.py  # Run FastAPI directly for debugging
```

---

**Last Updated**: January 15, 2024
**Phase**: 1 Foundation (55% complete)
**Target**: Phase 1 70% by end of Week 2
