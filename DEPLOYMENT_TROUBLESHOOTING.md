# ONTORA Deployment Troubleshooting Guide

## Common Deployment Issues & Solutions

### 1. Docker Compose Fails to Start

#### Issue: "Cannot connect to Docker daemon"
```
ERROR: Cannot connect to Docker daemon at unix:///var/run/docker.sock
```

**Solutions:**
- Ensure Docker is running: `docker --version`
- On Windows/Mac, ensure Docker Desktop is running
- Check permissions: `ls -l /var/run/docker.sock` (Linux)
- Restart Docker: `sudo systemctl restart docker` (Linux)

#### Issue: "Port already in use"
```
ERROR: for postgres  Cannot start service postgres: Ports are not available
```

**Solutions:**
```bash
# Find process using port
lsof -i :5432  # Linux/Mac
netstat -ano | findstr :5432  # Windows

# Kill the process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Or use different port in docker-compose.prod.yml
ports:
  - "5433:5432"  # Map to 5433 instead
```

#### Issue: "Insufficient disk space"
```
ERROR: open /var/lib/docker/tmp/: no space left on device
```

**Solutions:**
```bash
# Check disk usage
df -h
du -sh /var/lib/docker

# Clean up Docker
docker system prune -a  # CAREFUL: removes unused resources
docker image prune -a
docker volume prune
```

---

### 2. Database Connection Issues

#### Issue: "Cannot connect to PostgreSQL"
```
psycopg2.OperationalError: could not connect to server: Connection refused
```

**Solutions:**
```bash
# Verify PostgreSQL is running
docker-compose -f docker-compose.prod.yml ps postgres

# Check logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection directly
psql -h localhost -p 5432 -U ontora -d ontora_prod

# Verify credentials in .env
cat .env | grep DATABASE

# Check if database exists
psql -h localhost -U postgres -c "\l"

# Recreate database if needed
createdb -h localhost -U ontora ontora_prod
```

#### Issue: "Database migration fails"
```
ERROR: relation "table_name" does not exist
```

**Solutions:**
```bash
# Check current migration state
python -m alembic current

# Show pending migrations
python -m alembic heads

# Force migrate to specific version
python -m alembic upgrade [revision]

# Rollback last migration
python -m alembic downgrade -1

# Upgrade all migrations
python -m alembic upgrade head

# Check for syntax errors
python -m sqlalchemy inspectdb postgresql://user:pass@host/db
```

#### Issue: "Connection pool exhausted"
```
sqlalchemy.pool.QueuePool: QueuePool limit exceeded
```

**Solutions:**
```bash
# Increase pool size in backend config
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=10

# Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle for' > interval '30 minutes';

# View connection stats
SELECT * FROM pg_stat_activity;
```

---

### 3. Redis Cache Issues

#### Issue: "Cannot connect to Redis"
```
ConnectionError: Error 111 connecting to localhost:6379
```

**Solutions:**
```bash
# Verify Redis is running
docker-compose -f docker-compose.prod.yml ps redis

# Check Redis logs
docker-compose -f docker-compose.prod.yml logs redis

# Test connection
redis-cli -h localhost -p 6379 ping

# Monitor Redis
redis-cli monitor

# Check memory usage
redis-cli info memory
```

#### Issue: "Redis memory full"
```
MISCONF Redis is configured to save RDB snapshots but is currently not able to persist on disk
```

**Solutions:**
```bash
# Check memory stats
redis-cli info memory

# Flush old data
redis-cli FLUSHDB  # CAREFUL: clears all cache

# Flush expires keys
redis-cli FLUSHDB ASYNC

# Increase maxmemory policy
# In redis config, set: maxmemory-policy allkeys-lru

# Or restart Redis
docker-compose -f docker-compose.prod.yml restart redis
```

---

### 4. Neo4j Graph Database Issues

#### Issue: "Cannot connect to Neo4j"
```
ServiceUnavailable: Could not connect to localhost:7687
```

**Solutions:**
```bash
# Verify Neo4j is running
docker-compose -f docker-compose.prod.yml ps neo4j

# Check Neo4j logs
docker-compose -f docker-compose.prod.yml logs neo4j

# Test connection
wget http://localhost:7474  # Neo4j browser

# Reset Neo4j if corrupted
docker-compose -f docker-compose.prod.yml down neo4j
rm -rf neo4j/data/*
docker-compose -f docker-compose.prod.yml up -d neo4j
```

#### Issue: "Neo4j database locked"
```
Database is locked, in the process of rotating stores
```

**Solutions:**
```bash
# Wait for rotation to complete (can take minutes)
docker-compose logs neo4j | grep -i "rotation"

# Force restart if needed
docker-compose -f docker-compose.prod.yml restart neo4j

# Check Neo4j status
curl http://localhost:7474/db/manage/info/jmx/query/org.neo4j%3Ainstance%3D*%2Cname%3D*
```

---

### 5. API & Application Issues

#### Issue: "500 Internal Server Error"
```
ERROR: Internal Server Error - check backend logs
```

**Solutions:**
```bash
# Check backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Check for specific error
docker-compose logs backend | grep -i "error"

# Check environment variables
docker-compose config | grep -E "^[A-Z_]+"

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# Check backend health
curl http://localhost:8000/health
```

#### Issue: "API timeout"
```
TimeoutError: Request timed out after 30 seconds
```

**Solutions:**
```bash
# Check server load
docker stats

# Check database performance
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000 
ORDER BY mean_exec_time DESC LIMIT 10;

# Check slow logs
docker exec -it postgres_container psql -U ontora -d ontora_prod \
  -c "SELECT * FROM pg_stat_statements WHERE query LIKE '%SELECT%' ORDER BY mean_exec_time DESC;"

# Increase timeout in config
API_TIMEOUT=60

# Check Redis cache hit rate
redis-cli INFO stats | grep -E "hits|misses"
```

#### Issue: "Out of memory in frontend"
```
JavaScript heap out of memory (in Next.js build)
```

**Solutions:**
```bash
# Increase Node memory for build
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or in docker-compose
environment:
  NODE_OPTIONS: "--max-old-space-size=2048"

# Monitor memory during build
docker stats
```

---

### 6. Kafka Message Queue Issues

#### Issue: "Cannot connect to Kafka"
```
BrokerNotAvailableError: Unable to connect to broker
```

**Solutions:**
```bash
# Check Kafka broker status
docker-compose -f docker-compose.prod.yml ps kafka

# Check Kafka logs
docker-compose -f docker-compose.prod.yml logs kafka

# Verify Kafka cluster
docker exec -it kafka_container kafka-broker-api-versions.sh \
  --bootstrap-server localhost:9092

# List topics
docker exec -it kafka_container kafka-topics.sh --list \
  --bootstrap-server localhost:9092

# Describe topic
docker exec -it kafka_container kafka-topics.sh --describe \
  --topic data-stream \
  --bootstrap-server localhost:9092
```

#### Issue: "Message consumer lag high"
```
Consumer group lag > 1000 messages
```

**Solutions:**
```bash
# Check consumer group status
docker exec -it kafka_container kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group ontora-consumers \
  --describe

# Reset consumer offset
docker exec -it kafka_container kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group ontora-consumers \
  --reset-offsets \
  --to-latest \
  --topic data-stream \
  --execute

# Scale up consumers
docker-compose -f docker-compose.prod.yml up -d --scale consumer=3
```

---

### 7. SSL/TLS Certificate Issues

#### Issue: "SSL certificate verification failed"
```
ssl.SSLError: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed
```

**Solutions:**
```bash
# Check certificate validity
openssl x509 -in cert.crt -text -noout

# Check expiration
openssl x509 -in cert.crt -noout -dates

# Test with curl
curl -v --cacert ca-bundle.crt https://localhost

# Renew certificate
certbot renew  # Let's Encrypt

# Update in nginx
# Edit cert paths in nginx config and reload
nginx -s reload
```

#### Issue: "Certificate not trusted by clients"
```
curl: (60) SSL: certificate problem
```

**Solutions:**
```bash
# Check certificate chain
openssl s_client -connect localhost:443 -showcerts

# Add CA certificate to trust store (Linux)
cp ca-cert.crt /usr/local/share/ca-certificates/
update-ca-certificates

# For Windows containers, add to cert store
certutil -addstore Root ca-cert.crt
```

---

### 8. Performance Issues

#### Issue: "Slow API responses"

**Diagnosis:**
```bash
# 1. Check database performance
docker exec -it postgres_container psql -U ontora -d ontora_prod << EOF
SELECT query, mean_exec_time, calls, total_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
EOF

# 2. Check cache effectiveness
redis-cli INFO stats | grep -E "keyspace_hits|keyspace_misses"

# 3. Check server resources
docker stats

# 4. Check API metrics
curl http://localhost:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m]))
```

**Solutions:**
```bash
# Add database indexes
CREATE INDEX CONCURRENTLY idx_timestamp ON events(timestamp);

# Optimize queries (check execution plans)
EXPLAIN ANALYZE SELECT * FROM large_table WHERE condition;

# Increase redis cache TTL
REDIS_CACHE_TTL=3600  # 1 hour

# Add database connection pooling
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_POOL_RECYCLE=3600

# Enable database query caching
ENABLE_REDIS_CACHING=true
```

#### Issue: "High CPU usage"

**Diagnosis:**
```bash
# Check which process consumes CPU
docker stats --no-stream

# List top CPU consuming containers
docker stats --no-stream | sort -k3 -nr
```

**Solutions:**
```bash
# Identify hot paths
docker-compose exec backend py-spy record -o profile.svg -d 30 -f [PID]

# Reduce frequency of background jobs
CELERY_TASK_SCHEDULE="{...}"  # Increase intervals

# Scale horizontally
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

---

### 9. Networking Issues

#### Issue: "Cannot resolve service hostname"
```
Name or service not known (postgres, redis, etc.)
```

**Solutions:**
```bash
# Verify service names in docker-compose
docker network inspect bridge

# Check DNS resolution
docker exec backend bash -c "getent hosts postgres"

# Verify network configuration
docker-compose config | grep -A 5 networks

# Restart networking
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

#### Issue: "Communication between containers blocked"
```
Connection refused
```

**Solutions:**
```bash
# Check firewall rules
sudo iptables -L -n

# Verify exposed ports
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Test connectivity between containers
docker exec backend ping postgres

# Check network driver
docker network ls
docker network inspect [network_name]
```

---

### 10. Security Issues

#### Issue: "Exposed secrets in logs"
```
DATABASE_PASSWORD=abc123 logged in output
```

**Solutions:**
```bash
# Filter sensitive data from logs
docker-compose logs backend | grep -v PASSWORD

# Configure logging driver to not log secrets
# In docker-compose.prod.yml:
logging:
  driver: "json-file"
  options:
    labels: "service=backend"

# Use secrets in Docker Swarm
docker secret create db_password -
docker service create --secret db_password ...

# Or use environment files
--env-file .env.prod.secured
chmod 600 .env.prod.secured
```

#### Issue: "Unauthorized access detected"
```
Multiple failed login attempts
```

**Solutions:**
```bash
# Check access logs
docker-compose logs nginx | grep 401

# Review security groups/firewall rules
ufw status  # UFW on Linux

# Enable rate limiting in nginx
# In nginx.conf:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20;

# Reset user passwords
# Via database
UPDATE users SET password_hash = ... WHERE username = 'admin';

# Enable 2FA if available
UPDATE users SET mfa_enabled = true WHERE role = 'admin';
```

---

## Quick Reference: Essential Commands

```bash
# Status checks
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml ps --services
docker stats

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]
docker-compose -f docker-compose.prod.yml logs --tail=100 [service]

# Restart services
docker-compose -f docker-compose.prod.yml restart [service]
docker-compose -f docker-compose.prod.yml restart  # all services

# Execute commands in container
docker-compose -f docker-compose.prod.yml exec [service] [command]

# Database operations
psql -h localhost -U ontora -d ontora_prod
redis-cli -h localhost
neo4j console (from neo4j container)

# Performance monitoring
docker stats
docker top [container_id]
```

---

## Prevention: Best Practices

1. **Always backup before deployments**
   ```bash
   pg_dump ontora_prod > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test locally before production**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   pytest backend/testing/test_integration.py
   ```

3. **Use health checks**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

4. **Monitor logs continuously**
   ```bash
   docker-compose -f docker-compose.prod.yml logs -f
   ```

5. **Keep documentation updated**
   - Update runbooks after incidents
   - Document all manual interventions
   - Record lessons learned

---

**Last Updated**: 2026-03-22
**For Issues**: Contact DevOps Team at devops@example.com
