# ONTORA Local Development Quick Start Guide

## TL;DR - Get Running in 2 Minutes

```bash
# 1. Start all services
cd d:/DMC_Hackathon
docker-compose up -d

# 2. Verify they're running
docker-compose ps

# 3. Open services in browser
# - Frontend: http://localhost:3000 (run `npm run dev` first)
# - Backend API: http://localhost:8000/docs
# - pgAdmin4: http://localhost:5050
# - Grafana: http://localhost:3001
```

---

## Service Ports & Credentials

| Service | URL | Username | Password |
|---------|-----|----------|----------|
| **Frontend** | http://localhost:3000 | — | — |
| **Backend API** | http://localhost:8000 | — | — |
| **API Docs (Swagger)** | http://localhost:8000/docs | — | — |
| **pgAdmin4** | http://localhost:5050 | `admin@admin.com` | `admin` |
| **PostgreSQL** | localhost:5432 | `ontora_user` | `ontora_password` |
| **Neo4j** | http://localhost:7474 | `neo4j` | `neo4j_password` |
| **Grafana** | http://localhost:3001 | `admin` | `admin` |
| **Prometheus** | http://localhost:9090 | — | — |

---

## Directory Structure

```
d:/DMC_Hackathon/
├── docker-compose.yml          # All services configuration
├── backend/                    # FastAPI backend
│   ├── main.py                # Entry point
│   ├── README.md              # Backend documentation
│   ├── Dockerfile             # Docker image
│   └── requirements.txt        # Dependencies
├── app/                        # Next.js frontend
│   ├── page.tsx               # Home page
│   ├── globals.css            # Design system
│   └── components/            # React components
├── README.md                  # This project's main docs
└── LOCAL_SETUP.md             # Quick start (this file)
```

---

## Step-by-Step Setup

### 1. Prerequisites
- ✅ Docker Desktop installed and running
- ✅ Docker Compose v2.20+
- ✅ Node.js 18+ (for frontend)
- ✅ 4GB+ RAM available
- ✅ Ports available: 3000, 5000, 5432, 7474, 8000, 9090, 3001, 5050

### 2. Clone & Setup Repo
```bash
cd d:/DMC_Hackathon
```

### 3. Start Backend Services
```bash
docker-compose up -d
```

### 4. Verify Services Running
```bash
docker-compose ps

# Should show: postgres, neo4j, redis, kafka, zookeeper, backend, prometheus, grafana
```

### 5. Test Backend
```bash
curl http://localhost:8000/health

# Expected output:
# {"status": "ok", "version": "0.1.0", "environment": "development"}
```

### 6. (Optional) Start Frontend
```bash
# In a NEW terminal at project root
npm install
npm run dev

# Access at http://localhost:3000
```

---

## Accessing PostgreSQL Data

### Quick Option: pgAdmin4 Web UI (Easiest)

1. **Open browser**: http://localhost:5050
2. **Login**:
   - Email: `admin@admin.com`
   - Password: `admin`
3. **Add Server**:
   - Right-click Servers → Register → Server
   - Name: `ONTORA PostgreSQL`
   - Host: `postgres`
   - User: `ontora_user`
   - Password: `ontora_password`
4. **View Data**:
   - Navigate to Tables → Right-click any table → View/Edit Data

### Advanced Option: Command Line

```bash
# Drop into PostgreSQL CLI
docker-compose exec postgres psql -U ontora_user -d ontora_prod

# View users table
SELECT * FROM users;

# Exit
\q
```

### Python Option: Write Your Own Script

```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="ontora_prod",
    user="ontora_user",
    password="ontora_password"
)

cursor = conn.cursor()
cursor.execute("SELECT username, email, role FROM users;")

for row in cursor.fetchall():
    print(row)

cursor.close()
conn.close()
```

---

## Common Tasks

### View Backend Logs
```bash
docker-compose logs -f backend
```

### View PostgreSQL Logs
```bash
docker-compose logs -f postgres
```

### Restart a Service
```bash
docker-compose restart postgres
```

### Stop Everything (Keep Data)
```bash
docker-compose stop
```

### Stop & Delete Everything (Including Data)
```bash
docker-compose down -v
```

### Access Backend Shell
```bash
docker-compose exec backend /bin/bash
```

### Access Frontend Dev Tools
```bash
# In the frontend directory
npm run dev

# Browser DevTools: F12
```

---

## Useful SQL Queries

### Check Who's Connected
```sql
SELECT * FROM users;
```

### View Audit Trail
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

### Check Security Events
```sql
SELECT * FROM security_events ORDER BY timestamp DESC LIMIT 10;
```

### Count Data
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM audit_logs;
SELECT COUNT(*) FROM security_events;
```

### View Specific User Info
```sql
SELECT u.*, r.role_name 
FROM users u 
LEFT JOIN user_roles ur ON u.id = ur.user_id 
LEFT JOIN roles r ON ur.role_id = r.id 
WHERE u.username = 'admin';
```

---

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are already in use
netstat -ano | findstr :5432  # Check if 5432 is in use

# Kill the conflicting process
taskkill /PID <PID> /F

# Try again
docker-compose up -d
```

### PostgreSQL Connection Refused
```bash
# Check if PostgreSQL container is healthy
docker-compose ps postgres

# If not healthy, check logs
docker-compose logs postgres

# Restart it
docker-compose restart postgres

# Wait 10 seconds for startup, then test
docker-compose exec postgres psql -U ontora_user -d ontora_prod -c "SELECT 1"
```

### pgAdmin4 Won't Load
```bash
# Restart pgAdmin container
docker-compose restart pgadmin

# Clear browser cache and try again
# http://localhost:5050
```

### Backend API Returning Errors
```bash
# Check logs
docker-compose logs backend

# Verify database connection
curl http://localhost:8000/api/health

# Restart backend
docker-compose restart backend
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    ONTORA Stack                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Frontend (Next.js/React/TypeScript)      Port 3000 │
│  ├── Pages: /, /intelligence, /security  etc.       │
│  └── Components: Sidebar, TopBar, Charts            │
│                                                      │
│  ↕ (API Calls)                                      │
│                                                      │
│  Backend API (FastAPI/Python)             Port 8000 │
│  ├── /api/health - Health checks                    │
│  ├── /api/users - User management                   │
│  ├── /api/security - Security events                │
│  └── /docs - Swagger documentation                  │
│                                                      │
│  ↕ (SQL/Graph Queries)                              │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │         Data Layer                              ││
│  ├─────────────────────────────────────────────────┤│
│  │ PostgreSQL (5432)  │  Neo4j (7687)  │ Redis    ││
│  │ - Users            │  - Ontology    │ (6379)   ││
│  │ - Audit Logs       │  - Knowledge   │ - Cache  ││
│  │ - Security Events  │    Graph       │          ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  Monitoring & Tools                                 │
│  ├── Prometheus (9090) - Metrics                   │
│  ├── Grafana (3001) - Dashboards                   │
│  ├── pgAdmin4 (5050) - Database UI                 │
│  └── Kafka (9092) - Event Streaming                │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Explore the API**: http://localhost:8000/docs
2. **Check Database**: http://localhost:5050 (pgAdmin4)
3. **Monitor Metrics**: http://localhost:9090 (Prometheus)
4. **View Dashboards**: http://localhost:3001 (Grafana)
5. **Review Code**: Start with `backend/main.py` and `app/page.tsx`

---

## Documentation

- Main README: [README.md](../README.md)
- Backend Docs: [backend/README.md](../backend/README.md)
- Deployment Guide: [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
- Production Hardening: [PRODUCTION_HARDENING.md](../PRODUCTION_HARDENING.md)

---

## Support

- **API Issues**: Check logs with `docker-compose logs backend`
- **Database Issues**: Access pgAdmin4 at http://localhost:5050
- **Port Conflicts**: Stop other services or change ports in docker-compose.yml
- **Performance**: Monitor with Prometheus (9090) and Grafana (3001)

---

**Happy Hacking!** 🚀
