# Backend Error Fix Guide: Live Metrics Unavailable

## Error Summary
**Message:** "Live backend metrics unavailable: Failed to fetch. Displaying latest available live-response state."

**Root Cause:** Backend metrics endpoints cannot be reached from the frontend.

---

## Root Cause Analysis

### Port 8000 Already In Use
The backend tried to start but found port 8000 already bound by existing processes (PIDs: 31448, 30500, 43176).

### Current Status
- ✅ Python environment configured
- ✅ FastAPI installed (0.128.3)
- ✅ PostgreSQL initialized successfully
- ✅ Neo4j driver initialized
- ✅ Ollama model (llama3) ready
- ❌ Backend failed to bind to port 8000 (port in use)
- ❌ Metrics endpoints unreachable

---

## Solutions

### Solution 1: Kill Existing Processes (Recommended)

#### Using Windows Task Manager
1. Press `Ctrl+Shift+Esc` to open Task Manager
2. Search for python or node processes listening on port 8000
3. Select each and click "End Task"

#### Using Command Line
```powershell
# Find processes using port 8000
netstat -ano | findstr ":8000"

# Kill using Task Kill (replace PID values)
taskkill /PID 31448 /F
taskkill /PID 30500 /F
taskkill /PID 43176 /F

# Verify port is free
netstat -ano | findstr ":8000"  # Should be empty or only TIME_WAIT
```

### Solution 2: Change Backend Port

If you cannot free port 8000, modify backend config to use different port:

#### Option A: Environment Variable
```powershell
# In PowerShell
$env:API_PORT=8001
# Then start backend
python d:\DMC_Hackathon\backend\main.py
```

#### Option B: Edit .env File
```bash
# d:\DMC_Hackathon\.env
API_PORT=8001
API_HOST=0.0.0.0
```

#### Option C: Edit Frontend Config
```typescript
// app/lib/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001';
```

### Solution 3: Use Docker (Cleanest Option)

```bash
cd d:\DMC_Hackathon
docker-compose up -d backend
# Automatically manages port binding and isolation
```

---

## Step-by-Step Fix (Recommended Approach)

### Step 1: Clean Up Port 8000
```powershell
# Kill existing processes (requires admin)
taskkill /F /FI "MEMUSAGE gt 50000"  # Kill large consumers
# or
taskkill /PID 30500 /F  # Replace with actual PID
```

### Step 2: Verify Port is Free
```powershell
netstat -ano | findstr ":8000"
# Should return: no results or TIME_WAIT entries only
```

### Step 3: Start Backend
```powershell
cd d:\DMC_Hackathon\backend

# Using venv Python
.\..\venv\Scripts\python.exe main.py

# or simply
python main.py
```

### Step 4: Wait for Initialization
Watch for these log messages:
```
✅ INFO: PostgreSQL initialized
✅ INFO: Neo4j initialized  
✅ INFO: Ollama model ready: llama3
✅ INFO: ONTORA Backend ready!
✅ INFO: Application startup complete.
```

### Step 5: Verify Health
```powershell
# In another terminal
Invoke-WebRequest http://localhost:8000/api/health | ConvertFrom-Json

# Should return:
# {
#   "status": "ok",
#   "checks": {
#     "postgres": "ok",
#     "neo4j": "ok",
#     "kafka": "unknown",
#     "redis": "unknown"
#   }
# }
```

### Step 6: Seed Initial Data
```powershell
cd d:\DMC_Hackathon
python seed_simple.py
# or for comprehensive data
python seed_knowledge_graph.py
```

### Step 7: Test Metrics Endpoint
```powershell
$response = Invoke-WebRequest http://localhost:8000/api/metrics/regional-risk
$response.Content | ConvertFrom-Json
```

### Step 8: Refresh Frontend
- Close and reopen browser tab
- Hard refresh (Ctrl+F5) to clear cache
- Check browser console (F12) for fetch errors

---

## Critical Metrics Endpoints to Verify

Once backend is running, test these endpoints to confirm metrics are available:

```powershell
# Regional Risk
Invoke-WebRequest http://localhost:8000/api/metrics/regional-risk

# Global Entities  
Invoke-WebRequest http://localhost:8000/api/metrics/global-entities

# Threat Levels
Invoke-WebRequest http://localhost:8000/api/metrics/threat-threads

# Infrastructure Health
Invoke-WebRequest http://localhost:8000/api/metrics/infrastructure-health

# Daily Ingestion
Invoke-WebRequest http://localhost:8000/api/metrics/daily-ingestion

# Prediction Accuracy
Invoke-WebRequest http://localhost:8000/api/metrics/prediction-accuracy
```

All should return `200 OK` with JSON data.

---

## Database Connection Requirements

For metrics to work, ensure these services are running:

| Service | Host | Port | Status |
|---------|------|------|--------|
| PostgreSQL | localhost | 5432 | Required ✓ |
| Neo4j | localhost | 7687 | Required ✓ |
| Redis | localhost | 6379 | Optional (warning if missing) |
| Kafka | localhost | 9092 | Optional (warning if missing) |
| Ollama | localhost | 11434 | Required for LLM features |

Check databases:
```powershell
# PostgreSQL
Test-NetConnection localhost -Port 5432

# Neo4j  
Test-NetConnection localhost -Port 7687

# Ollama
curl http://localhost:11434/api/tags
```

---

## Environment Configuration

### .env File Location: `d:\DMC_Hackathon\.env`

```properties
# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=8000

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ontora_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Neo4j
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Frontend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Ollama LLM
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3

# Optional Services
REDIS_HOST=localhost
REDIS_PORT=6379
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
```

---

## CORS Configuration

If frontend can reach backend but requests are blocked by CORS, check `backend/config.py`:

```python
ALLOWED_ORIGINS=[
    "http://localhost:3000",      # Frontend dev
    "http://localhost:8000",      # Backend docs
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://localhost",
]
```

---

## Common Issues & Solutions

### Issue: "Connection refused"
```
Solution: Backend not running on port 8000
- Start backend: python d:\DMC_Hackathon\backend\main.py
- Or use different port: API_PORT=8001
```

### Issue: "CORS policy error"
```
Solution: Origin not in ALLOWED_ORIGINS list
- Add frontend URL to ALLOWED_ORIGINS in config.py
- Or add NEXT_PUBLIC_API_BASE_URL to .env
```

### Issue: "Database connection failed"
```
Solution: PostgreSQL/Neo4j not running
- Start PostgreSQL: services.msc → PostgreSQL → Start
- Start Neo4j: neo4j console (from Neo4j directory)
- Check ports: netstat -ano | findstr ":5432" or ":7687"
```

### Issue: "No metrics returned (empty arrays)"
```
Solution: Database has no seed data
- Run: python seed_simple.py
- Or: python seed_knowledge_graph.py
```

### Issue: "Ollama model not available"
```
Solution: Ollama not running or model not pulled
- Start Ollama: ollama serve
- Pull model: ollama pull llama3
- Check: curl http://localhost:11434/api/tags
```

---

## Verification Checklist

Once you complete the fix, verify:

- [ ] Port 8000 is free: `netstat -ano | findstr ":8000"` returns TIME_WAIT only
- [ ] PostgreSQL running: `Test-NetConnection localhost -Port 5432`
- [ ] Neo4j running: `Test-NetConnection localhost -Port 7687`
- [ ] Backend started: `python main.py` in backend folder
- [ ] Backend logs show "Application startup complete"
- [ ] Health check passes: `Invoke-WebRequest http://localhost:8000/api/health`
- [ ] Database seeded: `python seed_simple.py`
- [ ] Metrics endpoint returns data: Check `/api/metrics/regional-risk`
- [ ] Frontend can reach backend (check Network tab in browser DevTools)
- [ ] "Live metrics unavailable" error is gone

---

## Quick Start Command (Do This First)

```powershell
# 1. Kill port 8000 processes (choose one)
taskkill /PID 30500 /F
# OR
taskkill /F /FI "IMAGESIZE gt 50000"

# 2. Wait a moment
Start-Sleep -Seconds 3

# 3. Start backend
cd d:\DMC_Hackathon\backend
python main.py

# In another terminal:
# 4. Seed data (wait 10 secs after backend starts)
Start-Sleep -Seconds 10
cd d:\DMC_Hackathon
python seed_simple.py

# 5. Test
Start-Sleep -Seconds 5
Invoke-WebRequest http://localhost:8000/api/health
```

---

## If Issues Persist

Check logs and debug:
```powershell
# Backend logs (already printing to console)
# Check: PostgreSQL, Neo4j, Ollama service status
# Frontend: Press F12 → Network → see failed requests
# Check .env file: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Docker approach (cleanest)
docker-compose up -d
```
