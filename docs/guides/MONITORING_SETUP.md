# ONTORA Monitoring & Observability Setup Guide

## Overview

ONTORA uses a comprehensive monitoring stack:
- **Prometheus** - Metrics collection and time-series database
- **Grafana** - Visualization and dashboards
- **ELK Stack** - Logs (Elasticsearch, Logstash, Kibana)
- **Jaeger** - Distributed tracing
- **AlertManager** - Alert management and routing

---

## 1. Prometheus Setup

### Configuration File: `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    monitor: 'ontora-prod'
    environment: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - localhost:9093

rule_files:
  - 'alert_rules.yml'
  - 'recording_rules.yml'

scrape_configs:
  # Backend API metrics
  - job_name: 'backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
    scrape_interval: 15s
    scrape_timeout: 10s

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  # Neo4j
  - job_name: 'neo4j'
    static_configs:
      - targets: ['localhost:7474']

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  # Node exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # Kafka
  - job_name: 'kafka'
    static_configs:
      - targets: ['localhost:9308']

  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Install Prometheus Exporters

```bash
# PostgreSQL exporter
docker run -d \
  --name postgres_exporter \
  -e DATA_SOURCE_NAME="postgresql://user:password@postgres:5432/ontora_prod?sslmode=disable" \
  -p 9187:9187 \
  prometheuscommunity/postgres-exporter

# Redis exporter  
docker run -d \
  --name redis_exporter \
  -p 9121:9121 \
  -e REDIS_ADDR=redis://redis:6379 \
  oliver006/redis_exporter

# Node exporter (system metrics)
docker run -d \
  --name node_exporter \
  -p 9100:9100 \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /:/rootfs:ro \
  prom/node-exporter:latest

# Nginx exporter
docker run -d \
  --name nginx_exporter \
  -p 9113:9113 \
  -e SCRAPE_URI=http://nginx:80/nginx_status \
  nginx/nginx-prometheus-exporter:latest

# Kafka exporter
docker run -d \
  --name kafka_exporter \
  -p 9308:9308 \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  danielqsj/kafka-exporter:latest
```

---

## 2. Alert Rules Configuration: `alert_rules.yml`

```yaml
groups:
  # API Performance Alerts
  - name: api_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        for: 5m
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected ({{ $value | humanizePercentage }})"
          description: "{{ $labels.instance }} has error rate > 1% for last 5 min"

      - alert: HighLatency
        for: 5m
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        labels:
          severity: warning
        annotations:
          summary: "High API latency (p95: {{ $value | humanizeDuration }})"
          description: "{{ $labels.instance }} p95 latency > 1s"

      - alert: CriticalLatency
        for: 2m
        expr: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 5
        labels:
          severity: critical
        annotations:
          summary: "Critical latency (p99: {{ $value | humanizeDuration }})"
          description: "{{ $labels.instance }} p99 latency > 5s"

  # Database Alerts
  - name: database_alerts
    interval: 30s
    rules:
      - alert: HighDatabaseConnections
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High number of database connections ({{ $value }})"
          description: "PostgreSQL has {{ $value }} active connections (limit: 100)"

      - alert: DatabaseSlowQueries
        expr: pg_stat_statements_mean_exec_time > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Slow database queries detected"
          description: "Average query time: {{ $value | humanizeDuration }}"

      - alert: DatabaseReplicationLag
        expr: pg_replication_lag > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database replication lag too high"
          description: "Replication lag: {{ $value }} seconds"

  # Cache Alerts
  - name: cache_alerts
    interval: 30s
    rules:
      - alert: LowCacheHitRate
        expr: rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m])) < 0.7
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low Redis cache hit rate ({{ $value | humanizePercentage }})"
          description: "Cache efficiency below 70%"

      - alert: RedisCriticalMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.95
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Redis memory usage critical ({{ $value | humanizePercentage }})"
          description: "Redis memory > 95% of limit"

  # System Alerts
  - name: system_alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: rate(node_cpu_seconds_total[5m]) > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage ({{ $value | humanizePercentage }})"

      - alert: CriticalCPUUsage
        expr: rate(node_cpu_seconds_total[5m]) > 0.95
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical CPU usage ({{ $value | humanizePercentage }})"

      - alert: DiskSpaceWarning
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space low ({{ $value | humanizePercentage }} available)"

      - alert: DiskSpaceCritical
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Disk space critical ({{ $value | humanizePercentage }} available)"

  # Service Health Alerts
  - name: service_health
    interval: 30s
    rules:
      - alert: ServiceDown
        expr: up{job!="prometheus"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.instance }} has been unreachable for 2 minutes"
```

---

## 3. Grafana Dashboard Setup

### Dashboard Queries

#### API Performance Dashboard
```
Queries:
1. Request Rate: rate(http_requests_total[5m])
2. Error Rate: rate(http_requests_total{status=~"5.."}[5m]) * 100
3. Latency p50: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
4. Latency p95: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
5. Latency p99: histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
6. Request Distribution: sum(rate(http_requests_total[5m])) by (endpoint)
```

#### Database Performance Dashboard
```
Queries:
1. Active Connections: pg_stat_activity_count
2. Query Rate: rate(pg_queries_total[5m])
3. Slow Queries (>1s): rate(pg_stat_statements_calls{mean_exec_time > 1000}[5m])
4. Cache Hit Ratio: rate(pg_blks_hit[5m]) / (rate(pg_blks_hit[5m]) + rate(pg_blks_read[5m]))
5. Transactions: rate(pg_xact_commit_total[5m]) + rate(pg_xact_rollback_total[5m])
6. Replication Lag: pg_replication_lag
```

#### Resource Usage Dashboard
```
Queries:
1. CPU Usage: 100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
2. Memory Usage: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
3. Disk Usage: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
4. Network In: rate(node_network_receive_bytes_total[5m])
5. Network Out: rate(node_network_transmit_bytes_total[5m])
6. Disk Read: rate(node_disk_read_bytes_total[5m])
7. Disk Write: rate(node_disk_written_bytes_total[5m])
```

#### Business Metrics Dashboard
```
Queries:
1. Export Requests: rate(export_requests_total[1d])
2. Conflict Predictions: rate(predictions_total{type="conflict_risk"}[1d])
3. Data Ingestion Rate: rate(events_ingested_total[1m])
4. Active Users: count(distinct(user_id)) by (time)
5. API Endpoint Usage: sum(rate(http_requests_total[1h])) by (endpoint)
```

---

## 4. ELK Stack Setup for Log Aggregation

### Docker Compose Addition

```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
  ports:
    - "9200:9200"
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data
  networks:
    - ontora_network

logstash:
  image: docker.elastic.co/logstash/logstash:8.0.0
  volumes:
    - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
  environment:
    - "LS_JAVA_OPTS=-Xmx256m -Xms256m"
  ports:
    - "5000:5000"
  depends_on:
    - elasticsearch
  networks:
    - ontora_network

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
  environment:
    - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
  depends_on:
    - elasticsearch
  networks:
    - ontora_network

volumes:
  elasticsearch_data:
```

### Logstash Configuration: `logstash.conf`

```
input {
  tcp {
    port => 5000
    codec => json
  }
  udp {
    port => 5000
    codec => json
  }
}

filter {
  if [type] == "backend" {
    if [level] == "ERROR" {
      mutate {
        add_tag => [ "alert" ]
      }
    }
  }
  
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }
  
  grok {
    match => {
      "message" => "%{COMBINEDAPACHELOG}"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "logs-%{+YYYY.MM.dd}"
  }
  
  if "alert" in [tags] {
    stdout {
      codec => json
    }
  }
}
```

---

## 5. Jaeger Distributed Tracing Setup

### Docker Compose Addition

```yaml
jaeger:
  image: jaegertracing/all-in-one:latest
  ports:
    - "6831:6831/udp"
    - "16686:16686"
  environment:
    - COLLECTOR_ZIPKIN_HOST_PORT=:9411
    - SPAN_STORAGE_TYPE=elasticsearch
  networks:
    - ontora_network
```

### Backend Integration

```python
from jaeger_client import Config
from flask_opentracing import FlaskTracing

def init_jaeger_tracer(service_name, agent_host='localhost', agent_port=6831):
    config = Config(
        config={
            'sampler': {
                'type': 'const',
                'param': 1,
            },
            'logging': True,
            'local_agent': {
                'reporting_host': agent_host,
                'reporting_port': agent_port,
            }
        },
        service_name=service_name,
        validate=True,
    )
    return config.initialize_tracer()

# In Flask app
from flask import Flask
app = Flask(__name__)
jaeger_tracer = init_jaeger_tracer('ontora-backend')
tracing = FlaskTracing(jaeger_tracer, True, app)
```

---

## 6. Monitoring Dashboards

### Key Metrics to Display

#### Real-time Monitoring
```
- Current error rate (%)
- Current API latency (p95, p99)
- Active database connections
- Redis memory usage (%)
- System CPU (%)
- System memory (%)
- Disk usage (%)
- Network throughput
```

#### Historical Trends
```
- Error rate over 24h, 7d, 30d
- API latency trends
- Traffic volume trends
- Database query performance
- Cache hit ratio trends
- System resource trends
```

#### Business Metrics
```
- Export requests processed
- Conflict predictions made
- Data ingestion rate
- Active user count
- API endpoint usage breakdown
```

---

## 7. Alert Notification Configuration

### AlertManager Config: `alertmanager.yml`

```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'

route:
  receiver: 'default'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  
  routes:
    - match:
        severity: critical
      receiver: 'critical'
      group_wait: 5s
      repeat_interval: 1h

    - match:
        severity: warning
      receiver: 'warning'
      repeat_interval: 4h

receivers:
  - name: 'default'
    slack_configs:
      - channel: '#alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: 'critical'
    slack_configs:
      - channel: '#critical-alerts'
        title: '🚨 CRITICAL: {{ .GroupLabels.alertname }}'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'

  - name: 'warning'
    slack_configs:
      - channel: '#alerts'
        title: '⚠️  WARNING: {{ .GroupLabels.alertname }}'
        color: 'warning'
```

---

## 8. SLO & Performance Targets

### Service Level Objectives

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Availability | 99.9% | < 99.5% |
| API Latency p95 | < 500ms | > 1s |
| API Latency p99 | < 2s | > 5s |
| Error Rate | < 0.1% | > 1% |
| Cache Hit Ratio | > 80% | < 70% |
| DB Connection Health | > 95% | < 80% |
| Database Latency p95 | < 100ms | > 500ms |
| Data Freshness | < 1 min lag | > 5 min |

---

## 9. Monitoring Checklist

### Daily Monitoring Tasks
- [ ] Review error rate trends
- [ ] Check API latency metrics
- [ ] Verify database health
- [ ] Monitor cache performance
- [ ] Check disk space usage
- [ ] Review failed backup logs (if any)

### Weekly Monitoring Tasks
- [ ] Review performance trends
- [ ] Analyze slow query patterns
- [ ] Check security audit logs
- [ ] Verify backup restoration
- [ ] Review resource utilization

### Monthly Monitoring Tasks
- [ ] Capacity planning review
- [ ] Performance optimization review
- [ ] Alert tuning evaluation
- [ ] Disaster recovery drill
- [ ] Security audit

---

## 10. Useful Prometheus Queries

```promql
# Request rate per endpoint
sum(rate(http_requests_total[5m])) by (endpoint)

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) by (instance) / 
sum(rate(http_requests_total[5m])) by (instance) * 100

# Latency percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Database active connections
pg_stat_activity_count

# Cache hit ratio
rate(redis_keyspace_hits_total[5m]) / (rate(redis_keyspace_hits_total[5m]) + rate(redis_keyspace_misses_total[5m]))

# Memory usage percentage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage percentage
(1 - (node_filesystem_avail_bytes / node_filesystem_size_bytes)) * 100
```

---

**Last Updated**: 2026-03-22
**Monitoring Stack Version**: Latest stable
**Review Schedule**: Monthly
