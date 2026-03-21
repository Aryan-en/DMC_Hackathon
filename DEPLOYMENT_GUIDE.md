# ONTORA Production Deployment Guide - Week 16

## Pre-Deployment Checklist

### 1. Security Verification
- [ ] Run `python validate_production.py` - all checks must pass
- [ ] Scan dependencies: `pip audit`
- [ ] Scan code: `python -m bandit -r backend/`
- [ ] Scan Docker image: `docker scan <image>`
- [ ] Review secrets: ensure no secrets in codebase
- [ ] Test API security: verify security headers present
- [ ] Verify rate limiting: test 429 responses
- [ ] Test input validation: verify injection detection

### 2. Infrastructure Verification
- [ ] Database backups configured
- [ ] Redis persistence verified
- [ ] Network security groups configured
- [ ] VPN/Bastion host setup
- [ ] SSL/TLS certificates valid (not self-signed)
- [ ] Load balancer configured
- [ ] CDN configured (if applicable)

### 3. Application Readiness
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Neo4j indexes created
- [ ] Redis cache cleared
- [ ] Kafka topics created
- [ ] Monitoring/logging agents configured
- [ ] Health checks passing
- [ ] Load testing completed

### 4. Operational Readiness
- [ ] On-call rotation established
- [ ] Incident response plan documented
- [ ] Rollback procedures tested
- [ ] Status page configured
- [ ] Alerts configured and tested
- [ ] Dashboard created
- [ ] Documentation updated
- [ ] Team trained on procedures

## Deployment Process

### Phase 1: Pre-Deployment (T-1 hour)

```bash
# 1. Prepare environment variables
cp .env.production.template .env.production
# Edit .env.production with actual values

# 2. Set permissions on secrets
chmod 600 .env.production
chmod 600 .env

# 3. Run validation
python validate_production.py

# 4. Build Docker image
docker build -t ontora:latest -t ontora:v1.0 .

# 5. Scan image
docker scan ontora:latest

# 6. Tag image for registry
docker tag ontora:v1.0 registry.example.com/ontora:v1.0
```

### Phase 2: Staging Deployment (T-30 minutes)

```bash
# 1. Deploy to staging
docker-compose -f docker-compose.staging.yml up -d

# 2. Wait for services to be healthy
docker-compose -f docker-compose.staging.yml ps

# 3. Run smoke tests
curl -H "Authorization: Bearer $TEST_TOKEN" http://localhost:8000/api/health

# 4. Load test
# Using wrk or Apache Bench
wrk -t4 -c100 -d30s http://localhost:8000/health

# 5. Monitor metrics
# Check dashboard for normal operation
```

### Phase 3: Production Deployment (T-0)

#### Option A: Blue-Green Deployment

```bash
# 1. Deploy to "green" environment
docker push registry.example.com/ontora:v1.0
kubectl set image deployment/ontora blue=registry.example.com/ontora:v1.0 --record

# 2. Wait for health checks (5-10 minutes)
kubectl rollout status deployment/ontora

# 3. Run smoke tests against green
for i in {1..10}; do
  curl https://green.api.example.com/health
done

# 4. Switch traffic to green
kubectl set image deployment/ontora green=registry.example.com/ontora:v1.0 --record

# 5. Monitor production metrics
# Watch dashboard for 15+ minutes
```

#### Option B: Rolling Deployment

```bash
# 1. Update deployment
kubectl set image deployment/ontora \
  app=registry.example.com/ontora:v1.0 --record

# 2. Watch rollout
kubectl rollout status deployment/ontora --timeout=10m

# 3. Verify pods are healthy
kubectl get pods -l app=ontora

# 4. Check metrics
kubectl logs deployment/ontora --tail=100
```

#### Option C: Docker Compose

```bash
# 1. Stop current containers
docker-compose down

# 2. Pull new image
docker pull registry.example.com/ontora:v1.0

# 3. Update compose file with new image tag
vi docker-compose.prod.yml

# 4. Start new containers
docker-compose -f docker-compose.prod.yml up -d

# 5. Verify health
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:8000/health
```

### Phase 4: Post-Deployment (T+30 minutes)

```bash
# 1. Verify all endpoints
./scripts/smoke-tests.sh production

# 2. Check metrics
# - Request rate should be normal
# - Error rate < 0.1%
# - P99 latency < 500ms

# 3. Monitor application logs
docker logs ontora-backend --tail=100 --follow

# 4. Run security tests
# - Verify security headers present
# - Test rate limiting
# - Test input validation

# 5. Verify data integrity
# - Check database consistency
# - Verify neo4j graph integrity
# - Check cache consistency

# 6. Performance baseline
# - Get latency metrics
# - Get throughput metrics
# - Save baseline for comparison
```

## Docker Compose Production Deployment

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: ontora:v1.0
    container_name: ontora-backend
    restart: always
    ports:
      - "8000:8000"
    environment:
      - ENVIRONMENT=production
      - DEBUG=false
      - POSTGRES_HOST=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      # ... other environment variables
    depends_on:
      postgres:
        condition: service_healthy
      neo4j:
        condition: service_healthy
    networks:
      - ontora-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "com.ontora.service=backend"
      - "com.ontora.environment=production"

  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: ontora-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - ontora-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Add other services as needed

volumes:
  postgres_data:
    driver: local
  neo4j_data:
    driver: local

networks:
  ontora-network:
    driver: bridge
```

Deploy with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Rollback Procedures

### If Issues Detected (T+30 minutes)

#### Immediate Rollback

```bash
# Kubernetes
kubectl rollout undo deployment/ontora

# Docker Compose
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml.bak up -d  # previous version

# Verify
curl http://localhost:8000/health
```

#### Database Rollback

If database changes were made:

```bash
# Backup current state
pg_dump -U postgres ontora_prod > backup_rollback_$(date +%s).sql

# Restore previous backup
psql -U postgres ontora_prod < backup_previous.sql

# Verify
psql -U postgres -d ontora_prod -c "SELECT COUNT(*) FROM users;"
```

## Monitoring Production

### Key Metrics to Monitor

1. **Application Health**
   - Request rate (requests/sec)
   - Error rate (errors/min)
   - Latency (p50, p95, p99)
   - Uptime percentage

2. **Database Health**
   - Connection count
   - Query execution time
   - Replication lag
   - Disk usage

3. **System Health**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

4. **Security Events**
   - Authentication failures
   - Authorization denials
   - Rate limit exceeded events
   - Injection attack attempts

### Alert Thresholds

```
- Error rate > 1% : CRITICAL
- P99 latency > 1s : WARNING
- Disk usage > 80% : WARNING
- CPU > 90% : WARNING
- Memory > 85% : WARNING
- Failed health checks > 3 : CRITICAL
```

## Maintenance & Updates

### Regular Maintenance

- **Weekly**: Review logs, monitor resources
- **Monthly**: Update dependencies, review security
- **Quarterly**: Full security audit, capacity planning
- **Annually**: Disaster recovery drill, compliance review

### Security Updates

```bash
# Check for vulnerable packages
pip audit

# Update packages
pip install --upgrade package_name

# Rebuild and redeploy
docker build -t ontora:latest .
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## Disaster Recovery

### Backup & Restore

```bash
# Daily backups
0 2 * * * /scripts/backup-databases.sh

# Point-in-time recovery
/scripts/restore-point-in-time.sh <timestamp>

# Cross-region replication
# Configure continuous replication to DR region
```

### High Availability

- [ ] Multi-region deployment
- [ ] Database replication
- [ ] Load balancing
- [ ] Auto-scaling groups
- [ ] Network redundancy

## Support & Escalation

### On-Call Procedure

1. **Alert received** → Page on-call engineer
2. **Triage** → Determine severity
3. **Investigation** → Check metrics, logs, health
4. **Mitigation** → Hotfix or rollback
5. **Resolution** → Full fix and deployment
6. **Post-mortem** → Document incident

### Incident Severity

- **CRITICAL**: Service down, data loss risk
  - Mitigation: 5 minutes
  - Resolution: 30 minutes

- **HIGH**: Service degraded, feature broken
  - Mitigation: 15 minutes
  - Resolution: 2 hours

- **MEDIUM**: Minor feature issue
  - Mitigation: 1 hour
  - Resolution: Next business day

- **LOW**: Documentation, non-critical feature
  - Resolution: Within week

## Success Criteria

Deployment is considered successful when:

- ✅ All health checks passing
- ✅ Error rate < 0.1%
- ✅ P99 latency < 500ms
- ✅ No security alerts
- ✅ Database consistency verified
- ✅ All API endpoints responding
- ✅ Monitoring dashboards operational
- ✅ 0 rollbacks in first 24 hours

## Contacts & Resources

- **On-Call Engineer**: Page via PagerDuty
- **DevOps Team**: #devops-oncall on Slack
- **Security Team**: security@ontora.example.com
- **Incident Commander**: incident-commander@ontora.example.com

---

**Document Version**: 1.0  
**Last Updated**: Week 16  
**Next Review**: After first production deployment
