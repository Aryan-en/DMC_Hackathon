# IMMEDIATE FIX: Backend Metrics Error

## What's Happening
Your frontend shows: **"Live backend metrics unavailable: Failed to fetch"**

**Why:** Backend server isn't running on port 8000 because something is already using that port.

---

## IMMEDIATE ACTIONS (Do These Now)

### Action 1: Free Port 8000
```powershell
# Find what's using port 8000
netstat -ano | findstr ":8000"

# Copy the PID numbers shown (e.g., 30500, 31448)
# Then kill them:
taskkill /PID 30500 /F
taskkill /PID 31448 /F
taskkill /PID 43176 /F
```

### Action 2: Start Backend
Open PowerShell in VS Code terminal and run:
```powershell
cd d:\DMC_Hackathon\backend
python main.py
```

**Expected output (wait for this):**
```
INFO:     Started server process
2026-03-22 12:05:30 - main - INFO - PostgreSQL initialized
2026-03-22 12:05:31 - main - INFO - Neo4j initialized  
2026-03-22 12:05:33 - main - INFO - ONTORA Backend ready!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Action 3: Seed Database
Open a NEW terminal and run:
```powershell
cd d:\DMC_Hackathon
python seed_simple.py
```

### Action 4: Refresh Browser
- Go to frontend in browser
- Press **Ctrl+Shift+Delete** to open DevTools
- Go to **Application** tab → **Clear All** (Cache Storage)
- Hard refresh: **Ctrl+F5**
- Error should be gone

---

## Verify It's Fixed

### Check Backend Health
```powershell
# Open new PowerShell
Invoke-WebRequest http://localhost:8000/api/health
```

Should show:
```json
{
  "status": "ok",
  "checks": {
    "postgres": "ok",
    "neo4j": "ok"
  }
}
```

### Check Metrics Endpoint
```powershell
Invoke-WebRequest http://localhost:8000/api/metrics/regional-risk
```

Should return data, not empty.

---

## All Backend Endpoints Reference

### Summary by Category

#### 🔐 Authentication & Authorization
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/register` - Create user account
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Current user info
- `GET /api/auth/permissions` - User permissions

#### 📊 **Metrics** (YOUR ERROR IS HERE)
- `GET /api/metrics/regional-risk` - Risk by region
- `GET /api/metrics/global-entities` - Entity counts
- `GET /api/metrics/threat-threads` - Threat severity
- `GET /api/metrics/daily-ingestion` - Data ingestion
- `GET /api/metrics/prediction-accuracy` - Model metrics
- `GET /api/metrics/infrastructure-health` - System health
- `GET /api/metrics/kg-nodes` - Knowledge graph stats

#### 🧠 Intelligence & NLP
- `GET /api/intelligence/entity-extraction` - Named entities
- `GET /api/intelligence/trending-keywords` - Top keywords
- `GET /api/intelligence/sentiment-radar` - Sentiment analysis
- `GET /api/intelligence/pipeline-status` - Model status
- `POST /api/intelligence/classify` - Text classification
- `GET /api/intelligence/processing-log` - Activity log

#### 🗺️ Geospatial
- `GET /api/geospatial/hotspots` - Conflict hotspots
- `GET /api/geospatial/climate-indicators` - Climate data
- `GET /api/geospatial/incidents/global` - Global incidents
- `GET /api/geospatial/heatmap` - Risk heatmap
- `GET /api/geospatial/economic-activity` - Economic data

#### 🔮 Predictions & ML  
- `GET /api/predictions/conflict-risk` - Risk forecast
- `GET /api/predictions/model-performance` - ML metrics
- `GET /api/predictions/dashboard-overview` - KPI summary
- `POST /api/predictions/pyg-model/predict` - GNN prediction

#### 📡 Data Streams
- `GET /api/streams/topics` - Kafka topics
- `GET /api/streams/pipelines` - Flink pipelines
- `GET /api/streams/kafka/lag` - Consumer lag
- `GET /api/streams/flink/clusters` - Cluster status

#### 💾 Data Lake
- `GET /api/data-lake/summary` - Data overview
- `GET /api/data-lake/datasets` - Dataset metadata
- `GET /api/data-lake/quality` - Quality metrics
- `GET /api/data-lake/lineage` - Data lineage

#### 🔒 Security
- `GET /api/security/audit-log` - Audit trail
- `GET /api/security/violations-trend` - Violations
- `POST /api/security/access-check` - Access control
- `GET /api/security/monitoring-dashboard` - Security status
- `POST /api/security/export-request` - Data export request

#### 📚 Knowledge Graph
- `GET /api/knowledge-graph/nodes` - Node types
- `GET /api/knowledge-graph/relationships` - Relations
- `GET /api/knowledge-graph/conflict-detection` - Hotspots
- `GET /api/knowledge-graph/paths/{source}/{target}` - Causal paths

#### 👥 User Management
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{user_id}` - User details
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Delete user

---

## File Structure
```
d:\DMC_Hackathon\
├── backend/                    # FastAPI backend
│   ├── main.py                 # Entry point
│   ├── api/                    # Route modules
│   │   ├── metrics.py          # Metrics endpoints ⚠️
│   │   ├── intelligence.py     # NLP endpoints
│   │   ├── geospatial.py       # Map/climate data
│   │   ├── predictions.py      # ML endpoints
│   │   ├── streams.py          # Kafka/Flink
│   │   ├── knowledge_graph.py  # KG endpoints
│   │   ├── security.py         # Access control
│   │   └── ...
│   ├── db/                     # Database models
│   ├── requirements.txt        # Dependencies
│   └── .env                    # Configuration
│
├── app/                        # Next.js frontend
│   ├── hooks/                  # React hooks
│   │   ├── useStrategicMetrics.ts  # Fetches metrics
│   │   └── ...
│   └── lib/api.ts             # API client
│
├── .env                        # Environment vars
└── seed_simple.py             # Initialize database
```

---

## Configuration Check

Your `.env` should have:
```properties
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
API_HOST=0.0.0.0
API_PORT=8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If different, update frontend API URL in `app/lib/api.ts`:
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:YOUR_PORT';
```

---

## Terminal Commands Quick Ref

```powershell
# Start backend
cd d:\DMC_Hackathon\backend
python main.py

# Seed data (in new terminal after backend starts)
cd d:\DMC_Hackathon
python seed_simple.py
# or comprehensive data:
python seed_knowledge_graph.py

# Test endpoint
Invoke-WebRequest http://localhost:8000/api/metrics/regional-risk

# Check what's using port 8000
netstat -ano | findstr ":8000"

# Kill process (replace PID)
taskkill /PID 30500 /F
```

---

## Next Steps

1. ✅ Kill processes using port 8000
2. ✅ Start backend: `python d:\DMC_Hackathon\backend\main.py`
3. ✅ Seed data: `python d:\DMC_Hackathon\seed_simple.py`
4. ✅ Refresh browser (Ctrl+Shift+Delete then Ctrl+F5)
5. ✅ Error should be gone!

---

## If Still Not Working

1. Check backend terminal - should show "Application startup complete"
2. Test health: `Invoke-WebRequest http://localhost:8000/api/health`
3. Check browser console (F12) - Network tab for failed requests
4. Verify .env file paths match your system
5. Ensure PostgreSQL running: `Test-NetConnection localhost -Port 5432`

For detailed troubleshooting, see: **BACKEND_FIX_GUIDE.md**
