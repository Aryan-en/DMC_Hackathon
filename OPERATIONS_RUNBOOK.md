# ONTORA Production Deployment & Operations Runbook

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedure](#deployment-procedure)
3. [Post-Deployment Verification](#post-deployment-verification)
4. [Operations Procedures](#operations-procedures)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedure](#rollback-procedure)

---

## Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] Production server provisioned (2+ CPU cores, 4GB+ RAM)
- [ ] PostgreSQL 15+ database configured
- [ ] Neo4j 5+ graph database configured
- [ ] Redis cache configured
- [ ] Kafka cluster (3+ brokers) configured
- [ ] Nginx reverse proxy configured
- [ ] SSL certificates obtained and installed
- [ ] DNS records configured
- [ ] Firewalls configured (allow 80, 443 inbound)

### Security Checklist
- [ ] All default credentials changed
- [ ] Database backups configured (daily)
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] API keys and secrets stored securely (env vars, secrets manager)
- [ ] OAuth2 providers configured
- [ ] Audit logging enabled
- [ ] Data encryption keys generated and backed up

### Testing Checklist
- [ ] All integration tests passing locally
- [ ] Load tests completed (target: 100 req/s, p95 <500ms)
- [ ] Security scan completed
- [ ] Database migration tested
- [ ] Fallback mechanisms verified
- [ ] Authentication flow tested end-to-end
- [ ] Export approval workflow tested
- [ ] Monitoring alerts configured and tested

### Documentation Checklist
- [ ] Deployment runbook reviewed
- [ ] Operations procedures documented
- [ ] Emergency contacts listed
- [ ] Rollback procedures tested
- [ ] User documentation updated
- [ ] API documentation current

---

## Deployment Procedure

### Step 1: Pre-Deployment Backup
```bash
# Backup existing database
pg_dump ontora_prod > ontora_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup Neo4j
neo4j admin dump --to=/backups/neo4j_$(date +%Y%m%d_%H%M%S).dump

# Tag current version in git
git tag -a v1.0.0-prod -m "Production release"
```

### Step 2: Build and Push Docker Images
```bash
# Build production image
docker build -f Dockerfile.prod -t ontora-backend:1.0.0 .
docker build -f Dockerfile.prod -t ontora-frontend:1.0.0 ./app

# Tag for registry
docker tag ontora-backend:1.0.0 registry.example.com/ontora-backend:1.0.0
docker tag ontora-frontend:1.0.0 registry.example.com/ontora-frontend:1.0.0

# Push to registry
docker push registry.example.com/ontora-backend:1.0.0
docker push registry.example.com/ontora-frontend:1.0.0
```

### Step 3: Database Migration
```bash
# Run database migrations
cd backend
python -m alembic upgrade head

# Seed initial data
python scripts/seed_production_data.py

# Verify migration
python scripts/verify_schema.py
```

### Step 4: Deploy Infrastructure
```bash
# Start services with docker-compose
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Wait for health checks
docker-compose -f docker-compose.prod.yml ps

# Verify all services healthy
docker-compose -f docker-compose.prod.yml ps | grep -c healthy
# Should show all services as healthy
```

### Step 5: Verify Deployment
```bash
# Check backend health
curl -f http://localhost:8000/health

# Check API endpoints
curl http://localhost:8000/api/health

# Run smoke tests
pytest backend/testing/test_smoke.py

# Verify monitoring setup
curl http://localhost:9090/api/v1/targets
```

---

## Post-Deployment Verification

### Automated Verification
```bash
# Run integration tests against production
pytest backend/testing/test_integration.py -m production

# Run smoke tests
bash scripts/smoke_tests.sh

# Load test (low intensity)
python -m backend.testing.load_tester http://localhost:8000 \
  --endpoint "/api/predictions/conflict-risk" \
  --num-requests 100 \
  --concurrent-users 10
```

### Manual Verification
1. [ ] Login to web dashboard (https://example.com)
2. [ ] Navigate to each dashboard module:
   - [ ] Strategic Overview
   - [ ] Intelligence Hub
   - [ ] Knowledge Graph
   - [ ] Geospatial Intelligence
   - [ ] Predictions Engine
   - [ ] Data Streams
   - [ ] Data Lake Operations
   - [ ] Security & Governance
3. [ ] Verify real-time data is loading
4. [ ] Test create export request workflow
5. [ ] Test user management (admin only)

### Monitoring Setup
1. [ ] Prometheus collecting metrics
2. [ ] Grafana dashboards working
3. [ ] Alert rules active
4. [ ] Log aggregation working

---

## Operations Procedures

### Daily Operations Checklist
- [ ] Monitor error rates (should be <1%)
- [ ] Check disk space usage
- [ ] Verify backup completion
- [ ] Review security logs for anomalies
- [ ] Check database performance metrics

### Database Maintenance
```bash
# Weekly: Analyze tables for query optimization
ANALYZE;

# Weekly: Vacuum to reclaim space
VACUUM ANALYZE;

# Monthly: Full backup and test restore
pg_dump ontora_prod | gzip > backup_$(date +%Y%m%d).sql.gz

# Test restore (on test instance)
gunzip < backup_*.sql.gz | psql ontora_test
```

### Scaling Procedures

#### Horizontal Scaling (Add More Backend Instances)
```bash
# With load balancer (Nginx), simply scale container replicas:
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

#### Vertical Scaling (Increase Resources)
```bash
# Update docker-compose resources and restart
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

#### Database Scaling
```bash
# PostgreSQL read replicas (enable streaming replication)
# Configure secondary servers with replication

# Partitioning large tables
ALTER TABLE system_metric PARTITION BY RANGE (YEAR(timestamp));
```

### Log Management
```bash
# View recent logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Export logs
docker-compose -f docker-compose.prod.yml logs backend > backend_logs.txt

# Clean up old logs
docker container prune -f
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check startup logs
docker-compose logs backend | tail -50

# Verify database connection
psql -h localhost -U ontora -d ontora_prod -c "SELECT 1;"

# Check environment variables
docker-compose config | grep DATABASE_URL
```

### High Response Latency
```bash
# Check database slow queries
SELECT * FROM pg_stat_statements WHERE mean_exec_time > 1000;

# Cache hit rate
GET redis://localhost:6379/info stats

# API metrics from Prometheus
curl http://localhost:9090/api/v1/query?query=http_request_duration_seconds
```

### Memory Exhaustion
```bash
# Check container memory usage
docker stats

# Check Redis memory
redis-cli info memory

# Clear old cache entries
redis-cli FLUSHDB

# Increase limits in docker-compose
# Edit memory resource limits and restart
```

### Database Connection Pool Exhaustion
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Check connection limits
SHOW max_connections;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND query_start < now() - interval '1 hour';
```

---

## Rollback Procedure

### Quick Rollback (Last Docker Image)
```bash
# Pull previous image
docker-compose -f docker-compose.prod.yml pull old-image:previous-tag

# Stop current
docker-compose -f docker-compose.prod.yml down

# Start previous
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:8000/health
```

### Full Rollback (Restore from Backup)
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restore database from backup
psql ontora_prod < ontora_backup_YYYYMMDD_HHMMSS.sql

# Restore Neo4j
neo4j admin restore --from=/backups/neo4j_backup.dump

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Verify data integrity
python scripts/verify_schema.py
```

### Database Rollback Only
```bash
# If only database needs rollback:
pg_restore -d ontora_prod ontora_backup.sql

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

---

## Monitoring & Alerting

### Key Metrics to Monitor
- API response latency (p95, p99)
- Error rate (5xx errors)
- Database query performance
- Cache hit ratio
- CPU and memory usage
- Disk space remaining
- SSL certificate expiration

### Alert Thresholds
- Error rate > 1% → Critical
- API latency p95 > 1s → Warning
- API latency p99 > 5s → Critical
- Server CPU > 80% → Warning
- Server CPU > 95% → Critical
- Disk usage > 80% → Warning
- Disk usage > 95% → Critical
- SSL cert expires in < 30 days → Warning

### Health Check Endpoints
- `/health` - Basic health check
- `/api/health` - Full health check (includes database, cache, etc.)
- `/metrics` - Prometheus metrics

---

## Emergency Contacts

- **On-call Engineer**: [Name] - [Phone] - [Email]
- **Database Expert**: [Name] - [Phone] - [Email]
- **Security**: [Name] - [Phone] - [Email]
- **Management**: [Name] - [Phone] - [Email]

---

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0 | 2026-03-22 | Initial production release | DevOps Team |

---

**Last Updated**: 2026-03-22
**Next Review**: 2026-04-22
