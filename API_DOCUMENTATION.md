# ONTORA API Documentation & Testing Guide

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Core API Endpoints](#core-api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [API Testing](#api-testing)
7. [Performance Testing](#performance-testing)
8. [API Versioning](#api-versioning)

---

## API Overview

### Base URLs

```
Development:  http://localhost:8000/api/v1
Staging:      https://staging-api.ontora.com/api/v1
Production:   https://api.ontora.com/api/v1
```

### API Specification Format

- **Format**: JSON/REST
- **Protocol**: HTTP/2 over HTTPS (TLS 1.3)
- **Rate Limit**: 100 requests/minute (headers: X-RateLimit-*)
- **Timeout**: 30 seconds
- **Response**: Always JSON

### Health Check

```http
GET /health

Response: 200 OK
{
  "status": "healthy",
  "timestamp": "2026-03-22T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "cache": "ok",
    "graph": "ok",
    "search": "ok"
  }
}
```

---

## Authentication

### OAuth2 Authorization Code Flow

```plaintext
1. User clicks "Login"
         ↓
2. Frontend redirects to: /auth/authorize?client_id=...&response_type=code
         ↓
3. User authenticates via OAuth provider (Google, GitHub, Azure)
         ↓
4. Provider redirects to: /auth/callback?code=xxx&state=yyy
         ↓
5. Backend exchanges code for token: POST /auth/token
         ↓
6. Frontend stores access token in secure storage
         ↓
7. All API requests use: Authorization: Bearer <access_token>
```

### Request Headers

```http
GET /api/v1/predictions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

### API Key Authentication (Service-to-Service)

```http
GET /api/v1/data/stream
Authorization: ApiKey ontora_key_abc123_xyz789
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

### Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

## Core API Endpoints

### 1. Predictions Engine

#### Get Conflict Risk Prediction

```http
POST /api/v1/predictions/conflict-risk
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "region": "East Africa",
  "date_range_start": "2026-01-01T00:00:00Z",
  "date_range_end": "2026-12-31T23:59:59Z",
  "factors": ["political", "economic", "social", "military"],
  "confidence_threshold": 0.7,
  "include_historical": true
}

Response: 200 OK
{
  "prediction_id": "pred_123456",
  "timestamp": "2026-03-22T10:30:00Z",
  "region": "East Africa",
  "conflict_risk_score": 0.82,
  "confidence": 0.91,
  "prediction_window": {
    "start": "2026-04-01T00:00:00Z",
    "end": "2026-06-30T23:59:59Z"
  },
  "key_factors": [
    {
      "factor": "political",
      "influence": 0.35,
      "change": "increasing"
    },
    {
      "factor": "economic",
      "influence": 0.28,
      "change": "stable"
    }
  ],
  "recommended_actions": [
    "Increase diplomatic engagement",
    "Monitor armed group activities",
    "Track economic sanctions impact"
  ],
  "historical_accuracy": 0.88
}
```

#### List Predictions

```http
GET /api/v1/predictions?region=East%20Africa&limit=10&offset=0
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "prediction_id": "pred_123456",
      "region": "East Africa",
      "conflict_risk_score": 0.82,
      "confidence": 0.91,
      "created_at": "2026-03-22T10:30:00Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

### 2. Data Management

#### List Data Sources

```http
GET /api/v1/data/sources
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "source_id": "src_news_api",
      "name": "News API",
      "type": "news",
      "status": "active",
      "last_update": "2026-03-22T10:28:00Z",
      "record_count": 125000,
      "coverage": ["Africa", "Middle East"]
    },
    {
      "source_id": "src_twitter",
      "name": "Twitter/X Feed",
      "type": "social_media",
      "status": "active",
      "last_update": "2026-03-22T10:29:30Z",
      "record_count": 500000,
      "coverage": ["Global"]
    }
  ]
}
```

#### Stream Data Events

```http
GET /api/v1/data/stream?type=events&region=East%20Africa
Authorization: Bearer <token>
Accept: text/event-stream

Response: 200 OK (Server-Sent Events)
data: {"event_id": "evt_001", "source": "news", "region": "Kenya", "timestamp": "2026-03-22T10:30:15Z", "content": "..."}
data: {"event_id": "evt_002", "source": "social", "region": "Somalia", "timestamp": "2026-03-22T10:30:20Z", "content": "..."}
...
```

#### Upload Custom Dataset

```http
POST /api/v1/data/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Parameters:
- file: <CSV/JSON file>
- dataset_name: "Custom events"
- category: "security"
- start_date: "2026-01-01"
- end_date: "2026-03-22"

Response: 202 Accepted
{
  "upload_id": "upl_789012",
  "status": "processing",
  "estimated_completion": "2026-03-22T11:30:00Z",
  "file_size": 5242880,
  "estimated_records": 50000
}
```

### 3. Intelligence Hub

#### Search Knowledge Base

```http
POST /api/v1/intelligence/search
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "query": "militia groups Kenya",
  "type": "group",
  "filters": {
    "active": true,
    "countries": ["Kenya"],
    "confidence_min": 0.7
  },
  "limit": 20
}

Response: 200 OK
{
  "results": [
    {
      "entity_id": "org_123",
      "name": "Al-Shabab",
      "type": "militant_group",
      "countries": ["Kenya", "Somalia"],
      "last_activity": "2026-03-20T15:30:00Z",
      "threat_level": "high",
      "associated_entities": ["org_124", "org_125"]
    }
  ],
  "total": 127,
  "search_time_ms": 245
}
```

#### Get Entity Details

```http
GET /api/v1/intelligence/entities/org_123
Authorization: Bearer <token>

Response: 200 OK
{
  "entity_id": "org_123",
  "name": "Al-Shabab",
  "type": "militant_group",
  "aliases": ["Harakat al-Shabaab al-Mujahideen"],
  "countries": ["Kenya", "Somalia"],
  "founded": "2006-01-01",
  "leadership": [
    {
      "person_id": "pers_456",
      "name": "Ahmed Abdi Godane",
      "role": "Leader",
      "status": "deceased",
      "status_date": "2014-09-05"
    }
  ],
  "relationships": [
    {
      "related_id": "org_124",
      "name": "Al-Qaeda in the Islamic Maghreb",
      "relationship_type": "affiliated_with",
      "confidence": 0.85
    }
  ],
  "incidents": [
    {
      "incident_id": "inc_001",
      "date": "2023-06-05",
      "location": "Nairobi",
      "type": "bombing",
      "casualties": 7
    }
  ]
}
```

### 4. Export Requests

#### Request Data Export

```http
POST /api/v1/exports/request
Content-Type: application/json
Authorization: Bearer <token>

Request:
{
  "dataset_id": "ds_001",
  "format": "csv",
  "filters": {
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-03-22"
    },
    "regions": ["East Africa"],
    "confidence_threshold": 0.7
  },
  "include_predictions": true,
  "include_raw_data": false,
  "purpose": "Research and analysis",
  "redistribution_allowed": false
}

Response: 202 Accepted
{
  "export_request_id": "exp_req_123456",
  "status": "pending_approval",
  "created_at": "2026-03-22T10:30:00Z",
  "estimated_completion": "2026-03-23T14:00:00Z",
  "file_size_estimate": 104857600,
  "approval_required": true
}
```

#### Check Export Status

```http
GET /api/v1/exports/exp_req_123456
Authorization: Bearer <token>

Response: 200 OK
{
  "export_request_id": "exp_req_123456",
  "status": "approved",
  "created_at": "2026-03-22T10:30:00Z",
  "approved_at": "2026-03-22T10:45:00Z",
  "approved_by": "user_789",
  "download_url": "https://api.ontora.com/exports/file_abc123.csv",
  "expires_at": "2026-03-29T10:45:00Z",
  "file_size": 104857600,
  "record_count": 250000
}
```

---

## Data Models

### Prediction Model

```typescript
interface Prediction {
  prediction_id: string;
  timestamp: ISO8601DateTime;
  region: string;
  conflict_risk_score: number;  // 0-1
  confidence: number;            // 0-1
  prediction_window: {
    start: ISO8601DateTime;
    end: ISO8601DateTime;
  };
  key_factors: Factor[];
  recommended_actions: string[];
  historical_accuracy: number;
  
  created_by: string;
  created_at: ISO8601DateTime;
  updated_at: ISO8601DateTime;
}
```

### Data Source Model

```typescript
interface DataSource {
  source_id: string;
  name: string;
  type: "news" | "social_media" | "government" | "custom";
  url: string;
  status: "active" | "inactive" | "error";
  last_update: ISO8601DateTime;
  record_count: number;
  coverage: string[];
  
  created_at: ISO8601DateTime;
  config: SourceConfig;
}
```

### Event Model

```typescript
interface Event {
  event_id: string;
  source_id: string;
  timestamp: ISO8601DateTime;
  
  event_type: string;
  region: string;
  location: {
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  
  entities: {
    type: "person" | "organization" | "location";
    id: string;
    name: string;
    confidence: number;
  }[];
  
  created_at: ISO8601DateTime;
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET request |
| 201 | Created | Resource created via POST |
| 202 | Accepted | Long-running request accepted |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Maintenance or downtime |

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_REGION",
    "message": "Region 'Atlantis' not recognized",
    "details": {
      "field": "region",
      "valid_regions": ["East Africa", "West Africa", "North Africa", "Southern Africa"]
    },
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-03-22T10:30:00Z"
  }
}
```

### Common Error Codes

```
INVALID_REQUEST         - Malformed request
INVALID_PARAMETER       - Invalid parameter value
MISSING_REQUIRED_FIELD  - Required field missing
AUTHENTICATION_FAILED   - Auth token invalid/expired
PERMISSION_DENIED       - User lacks required permission
RESOURCE_NOT_FOUND      - Resource doesn't exist
RATE_LIMIT_EXCEEDED     - Too many requests
INTERNAL_ERROR          - Server error
SERVICE_UNAVAILABLE     - Service temporarily down
```

---

## API Testing

### Unit Testing

```python
import pytest
from backend.api.predictions import calculate_conflict_risk

def test_conflict_risk_calculation():
    """Test conflict risk prediction calculation"""
    result = calculate_conflict_risk(
        region="Kenya",
        factors=["political", "economic"],
        start_date="2026-01-01",
        end_date="2026-03-22"
    )
    
    assert 0 <= result['score'] <= 1
    assert result['confidence'] > 0.5
    assert 'factors' in result
```

### Integration Testing

```python
def test_predictions_endpoint_e2e(client, auth_token):
    """Test full conflict prediction API flow"""
    
    # Request prediction
    response = client.post(
        '/api/v1/predictions/conflict-risk',
        json={
            'region': 'Kenya',
            'date_range_start': '2026-01-01T00:00:00Z',
            'date_range_end': '2026-12-31T23:59:59Z',
            'factors': ['political', 'economic']
        },
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert 'prediction_id' in data
    assert 'conflict_risk_score' in data
    
    # Verify prediction stored
    pred_id = data['prediction_id']
    response = client.get(
        f'/api/v1/predictions/{pred_id}',
        headers={'Authorization': f'Bearer {auth_token}'}
    )
    assert response.status_code == 200
```

### API Testing with Postman

```json
{
  "info": {
    "name": "ONTORA API Tests",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Get Conflict Prediction",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/predictions/conflict-risk",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "predictions", "conflict-risk"]
        },
        "body": {
          "mode": "raw",
          "raw": "{\"region\": \"Kenya\", \"date_range_start\": \"2026-01-01T00:00:00Z\"}"
        }
      }
    }
  ]
}
```

### Automated API Tests (pytest)

```python
# Run with: pytest backend/testing/test_api.py -v

import pytest
from flask.testing import FlaskClient

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client):
    # Get valid token
    response = client.post('/auth/login', json={
        'username': 'test_user',
        'password': 'test_password'
    })
    return response.json['access_token']

class TestPredictionsAPI:
    
    def test_missing_region(self, client, auth_token):
        """Test validation of required region parameter"""
        response = client.post(
            '/api/v1/predictions/conflict-risk',
            json={},  # Missing required 'region'
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 400
        assert 'region' in response.json['error']['details']['field']
    
    def test_invalid_date_range(self, client, auth_token):
        """Test validation of date range"""
        response = client.post(
            '/api/v1/predictions/conflict-risk',
            json={
                'region': 'Kenya',
                'date_range_start': '2026-12-31T00:00:00Z',
                'date_range_end': '2026-01-01T00:00:00Z'  # Invalid: end before start
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 400
    
    def test_successful_prediction(self, client, auth_token):
        """Test successful conflict prediction"""
        response = client.post(
            '/api/v1/predictions/conflict-risk',
            json={
                'region': 'Kenya',
                'date_range_start': '2026-01-01T00:00:00Z',
                'date_range_end': '2026-12-31T23:59:59Z',
                'factors': ['political']
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 200
        data = response.json
        assert 'prediction_id' in data
        assert data['conflict_risk_score'] >= 0
        assert data['conflict_risk_score'] <= 1
```

---

## Performance Testing

### Load Testing with Apache JMeter

```jmx
<jmeterTestPlan>
  <ThreadGroup guiclass="ThreadGroupGui" testname="Conflict Prediction Load Test">
    <elementProp name="ThreadGroup.main_controller">
      <stringProp name="ThreadGroup.num_threads">100</stringProp>
      <stringProp name="ThreadGroup.ramp_time">60</stringProp>
      <elementProp name="ThreadGroup.duration_ms">600000</elementProp>
    </elementProp>
    
    <HTTPSampler guiclass="HttpTestSampleGui" testname="Conflict Risk Prediction">
      <stringProp name="HTTPSampler.domain">api.ontora.com</stringProp>
      <stringProp name="HTTPSampler.path">/api/v1/predictions/conflict-risk</stringProp>
      <stringProp name="HTTPSampler.method">POST</stringProp>
    </HTTPSampler>
  </ThreadGroup>
</jmeterTestPlan>
```

### Python Load Test

```python
from locust import HttpUser, task, between

class OntoraPredictionUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login and get token
        response = self.client.post('/auth/login', json={
            'username': 'test',
            'password': 'pass'
        })
        self.token = response.json()['access_token']
    
    @task(3)
    def get_prediction(self):
        """Simulate user requesting predictions"""
        self.client.post(
            '/api/v1/predictions/conflict-risk',
            json={
                'region': 'Kenya',
                'date_range_start': '2026-01-01T00:00:00Z',
                'date_range_end': '2026-12-31T23:59:59Z'
            },
            headers={'Authorization': f'Bearer {self.token}'}
        )
    
    @task(1)
    def search_intelligence(self):
        """Simulate user searching intelligence"""
        self.client.post(
            '/api/v1/intelligence/search',
            json={'query': 'al-shabab'},
            headers={'Authorization': f'Bearer {self.token}'}
        )

# Run with: locust -f performance_tests.py
```

### Performance Benchmarks

```
Target Performance Metrics:
- Conflict Risk Prediction: p95 < 500ms, p99 < 2s
- Intelligence Search: p95 < 200ms, p99 < 1s
- Export Request: p95 < 100ms, p99 < 500ms
- Stream Events: < 100ms latency per event

Current Performance (v1.0.0):
- Conflict Risk: p95 = 450ms, p99 = 1.8s ✓
- Intelligence Search: p95 = 180ms, p99 = 890ms ✓
- Export Request: p95 = 85ms, p99 = 420ms ✓
- Stream Events: ~50ms latency ✓
```

---

## API Versioning

### Version Strategy

```
Current: /api/v1/
Next: /api/v2/ (planned for Q4 2026)

v1 Sunset: 2027-01-01
v2 Sunset: 2028-01-01
```

### Backward Compatibility

```python
# Maintain backward compatibility
from packaging import version

API_VERSIONS = {
    '1.0': {
        'endpoints': ['predictions', 'intelligence', 'data', 'exports'],
        'deprecated': [],
        'sunset_date': '2027-01-01'
    },
    '2.0': {
        'endpoints': ['predictions', 'intelligence', 'data', 'exports'],
        'deprecated': ['search'],  # Use 'intelligence/search' instead
        'new_features': ['streaming_subscriptions', 'webhooks'],
        'sunset_date': '2028-01-01'
    }
}

# Migration helper
@app.route('/api/v1/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def version_compatibility(endpoint):
    # Check if v1 endpoint exists
    if endpoint in API_VERSIONS['1.0']['endpoints']:
        return handle_v1_endpoint(endpoint)
    # Redirect if deprecated
    elif endpoint == 'search':
        flask.redirect('/api/v2/intelligence/search')
```

---

**Last Updated**: 2026-03-22
**API Version**: 1.0.0
**Next Minor Release**: v1.1.0 (Q2 2026)
**Next Major Release**: v2.0.0 (Q4 2026)
