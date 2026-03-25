# ONTORA API Specification v0.1.0

## Base URL
```
http://localhost:8000/api
```

## Standard Response Format

All endpoints return JSON in this format:

```json
{
  "status": "success" | "error",
  "data": {},
  "error": null | "error message",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "0.1.0"
  }
}
```

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "environment": "development"
}
```

---

## Metrics Endpoints

### 1. Regional Risk Assessment

`GET /api/metrics/regional-risk`

Returns risk scores for key geographic regions.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "region": "South Asia",
      "risk_score": 72,
      "color": "red",
      "countries_affected": 8,
      "last_updated": "2024-01-15"
    }
  ]
}
```

**Fields:**
- `risk_score`: 0-100 scale (red: 70+, orange: 40-70, green: <40)
- `color`: Visual indicator
- `countries_affected`: Count of countries in region

---

### 2. Global Entities Overview

`GET /api/metrics/global-entities`

Total count of extracted entities across all knowledge graph.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_entities": 1470000,
    "breakdown": {
      "nations": 193,
      "organizations": 45000,
      "individuals": 120000,
      "events": 700000,
      "concepts": 605000
    }
  }
}
```

---

### 3. Threat Classification

`GET /api/metrics/threat-threads`

Threat assessment by severity level.

**Response:**
```json
{
  "status": "success",
  "data": {
    "critical": {
      "count": 3,
      "examples": ["North Korea Missile Tests", "Taiwan Strait Tension", "Iran Nuclear Program"]
    },
    "high": {
      "count": 12,
      "examples": ["Border Disputes", "Trade Wars", "Sanctions Regime"]
    },
    "monitor": {
      "count": 33,
      "examples": []
    }
  }
}
```

---

### 4. Daily Data Ingestion

`GET /api/metrics/daily-ingestion`

Volume of data processed in last 24 hours.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_volume": "2.9 TB",
    "breakdown": {
      "documents": "1.2 TB",
      "structured_data": "800 GB",
      "media": "450 GB",
      "metadata": "450 GB"
    },
    "sources": {
      "mea_scraper": "450 GB",
      "world_bank_api": "150 GB",
      "news_feeds": "1.5 TB",
      "social_media": "800 GB"
    }
  }
}
```

---

### 5. Prediction Accuracy

`GET /api/metrics/prediction-accuracy`

Model performance metrics.

**Response:**
```json
{
  "status": "success",
  "data": {
    "overall_accuracy": 91.3,
    "metrics": {
      "precision": 0.89,
      "recall": 0.93,
      "f1_score": 0.91
    },
    "models": {
      "entity_extraction": 0.94,
      "relationship_prediction": 0.88,
      "sentiment_analysis": 0.91,
      "threat_classification": 0.87
    },
    "last_updated": "2024-01-15T00:00:00Z"
  }
}
```

---

### 6. Infrastructure Health

`GET /api/metrics/infrastructure-health`

System component status.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "component": "PostgreSQL",
      "health_percentage": 99,
      "status": "operational",
      "response_time_ms": 45
    },
    {
      "component": "Neo4j",
      "health_percentage": 97,
      "status": "operational",
      "response_time_ms": 120
    }
  ]
}
```

---

## Intelligence Endpoints

### 1. Entity Extraction Metrics

`GET /api/intelligence/entity-extraction`

NLP entity extraction performance.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_extracted": 1470000,
    "breakdown": [
      {
        "type": "PERSON",
        "count": 120000,
        "confidence": 0.94
      },
      {
        "type": "ORGANIZATION",
        "count": 45000,
        "confidence": 0.91
      }
    ]
  }
}
```

---

### 2. Language Distribution

`GET /api/intelligence/language-distribution`

Languages in processed documents.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "language": "English",
      "document_count": 450000,
      "percentage": 45.0
    },
    {
      "language": "Hindi",
      "document_count": 350000,
      "percentage": 35.0
    }
  ]
}
```

---

### 3. Trending Keywords

`GET /api/intelligence/trending-keywords`

Top trending topics.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "keyword": "Trade Dispute",
      "frequency": 15000,
      "velocity": 2.3,
      "delta_24h": 45.2
    }
  ]
}
```

---

## Knowledge Graph Endpoints

### 1. Node Types

`GET /api/knowledge-graph/nodes`

Available node types in knowledge graph.

**Response:**
```json
{
  "status": "success",
  "data": {
    "types": [
      {
        "name": "Country",
        "count": 193,
        "properties": ["iso_code", "name", "region"]
      }
    ]
  }
}
```

---

### 2. Relationship Types

`GET /api/knowledge-graph/relationships`

Available relationship types.

**Response:**
```json
{
  "status": "success",
  "data": {
    "types": [
      {
        "name": "CONTROLS",
        "count": 45000,
        "source_type": "Country",
        "target_type": "Territory"
      }
    ]
  }
}
```

---

### 3. Path Finding

`GET /api/knowledge-graph/paths/{source}/{target}`

Find causal connections between entities.

**Parameters:**
- `source` (string, required): Source node ID
- `target` (string, required): Target node ID

**Response:**
```json
{
  "status": "success",
  "data": {
    "paths": [
      {
        "nodes": ["Node1", "Node2", "Node3"],
        "relationships": ["rel1", "rel2"],
        "distance": 2,
        "confidence": 0.85
      }
    ]
  }
}
```

---

## Geospatial Endpoints

### 1. Conflict Hotspots

`GET /api/geospatial/hotspots`

Active conflict zones with severity.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "location": "Taiwan Strait",
      "latitude": 24.5,
      "longitude": 120.5,
      "severity": 8.5,
      "incidents_30d": 12,
      "last_incident": "2024-01-14"
    }
  ]
}
```

---

### 2. Climate Indicators

`GET /api/geospatial/climate-indicators`

Climate/environmental data by region.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "region": "Middle East",
      "temperature_anomaly": 2.1,
      "drought_severity": 0.75,
      "flood_risk": 0.3,
      "last_updated": "2024-01-15"
    }
  ]
}
```

---

### 3. Regional Incidents

`GET /api/geospatial/incidents/{region}`

Detailed incidents in a region.

**Parameters:**
- `region` (string, required): Region name or code

**Response:**
```json
{
  "status": "success",
  "data": {
    "region": "Middle East",
    "total_incidents": 48,
    "time_period": "30 days",
    "incidents": [
      {
        "id": "INC-001",
        "date": "2024-01-14",
        "location": "Gaza Strip",
        "severity": 9,
        "description": "Incident description"
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "error": "Invalid region parameter",
  "data": null
}
```

### 404 Not Found
```json
{
  "status": "error",
  "error": "Resource not found",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "error": "Internal server error",
  "data": null
}
```

---

## Rate Limiting

Currently unlimited. Future: 1000 req/min per API key.

## Authentication

Currently none. Future: JWT token required in `Authorization: Bearer <token>` header.

## Versioning

API version in response meta. Breaking changes trigger major version bump.

---

## Testing

### cURL Examples

```bash
# Health check
curl http://localhost:8000/health

# Regional risk
curl http://localhost:8000/api/metrics/regional-risk

# Interactive docs (Swagger UI)
# http://localhost:8000/docs
```

---

## Roadmap

- **v0.2.0**: Database queries replacing mock data
- **v0.3.0**: NLP pipeline integration
- **v0.4.0**: Authentication & Authorization
- **v0.5.0**: GraphQL endpoint
