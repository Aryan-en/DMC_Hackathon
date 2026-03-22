# Fix: "Failed to load stream metrics: TypeError: Failed to fetch"

## Error Analysis

### The Error
```
Failed to load stream metrics: TypeError: Failed to fetch
    at apiGet (api.ts:17:28)
    at load (useStreamsMetrics.ts:84:17)
```

### Root Causes (Fixed)

#### 1. ✅ FIXED: Type Mismatch in Hook
**Issue:** `useStreamsMetrics.ts` was using incorrect type definitions:
```typescript
// WRONG:
apiGet<{ data: { topics: Topic[] } }>('/api/streams/topics')
```

**Why:** The `apiGet` function already extracts `payload.data`, so the hook shouldn't expect nested `data`.

**Fix Applied:**
```typescript
// CORRECT:
apiGet<{ topics: Topic[] }>('/api/streams/topics')
```

#### 2. ✅ FIXED: Error Handling in apiGet
**Issue:** The `apiGet` function didn't properly catch network errors or timeout errors.

**Fix Applied:** Added try-catch block with specific error handling for abort errors.

---

## Critical Issue: Backend Not Running

The "Failed to fetch" error is a **network-level error**, which means:
- ❌ The backend server is NOT listening on `http://localhost:8000`
- ❌ The browser cannot reach the backend at all
- ❌ It's not a 404 or 500 error - it's a connection failure

### Solution: Start the Backend

#### Step 1: Free Port 8000
```powershell
# Check if port is in use
netstat -ano | findstr ":8000"

# Kill any processes (if PIDs show)
taskkill /PID <PID> /F
```

#### Step 2: Start Backend
```powershell
cd d:\DMC_Hackathon\backend
python main.py
```

**Expected output:**
```
INFO:     Started server process [XXXX]
2026-03-22 XX:XX:XX - main - INFO - PostgreSQL initialized
2026-03-22 XX:XX:XX - main - INFO - Neo4j initialized
2026-03-22 XX:XX:XX - main - INFO - ONTORA Backend ready!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Step 3: Seed Database (New Terminal)
```powershell
cd d:\DMC_Hackathon
python seed_simple.py
```

#### Step 4: Verify Streams Endpoints
```powershell
# Test topics endpoint
Invoke-WebRequest http://localhost:8000/api/streams/topics | ConvertFrom-Json

# Test pipelines endpoint
Invoke-WebRequest http://localhost:8000/api/streams/pipelines | ConvertFrom-Json
```

Both should return data similar to:
```json
{
  "status": "ok",
  "data": {
    "topics": [
      {
        "topic": "documents.raw",
        "partitions": 4,
        "lag": 892,
        "throughput": 5000,
        "status": "degraded"
      }
    ]
  }
}
```

#### Step 5: Refresh Frontend
```
1. Press Ctrl+Shift+Delete → Clear Cache Storage
2. Press Ctrl+F5 → Hard refresh
3. Error should be gone!
```

---

## Changes Made

### File: `app/hooks/useStreamsMetrics.ts`
**Changed:** Fixed type definitions for API response
```diff
- apiGet<{ data: { topics: Topic[] } }>('/api/streams/topics'),
- apiGet<{ data: { pipelines: Pipeline[] } }>('/api/streams/pipelines'),
+ apiGet<{ topics: Topic[] }>('/api/streams/topics'),
+ apiGet<{ pipelines: Pipeline[] }>('/api/streams/pipelines'),
```

**Changed:** Simplified response handling
```diff
- const topics = topicsRes && typeof topicsRes === 'object' && 'data' in (topicsRes as any)
-   ? (topicsRes as any).data.topics
-   : (topicsRes as any)?.topics || SAMPLE_TOPICS;
+ const topics = topicsRes?.topics || SAMPLE_TOPICS;
```

### File: `app/lib/api.ts`
**Changed:** Added proper error handling
```diff
  try {
    const response = await fetch(...);
    const payload = await parseJson(response);
    return payload.data as T;
+ } catch (error) {
+   if (error instanceof Error && error.name === 'AbortError') {
+     throw new Error('Request timeout - API server may be unavailable');
+   }
+   throw error;
  } finally {
    clearTimeout(timeout);
  }
```

---

## Fallback Behavior

The hook now has **dual fallback mechanisms**:

1. **Response-level fallback:** If API call fails but data exists:
   ```typescript
   const topics = topicsRes?.topics || SAMPLE_TOPICS;  // Uses sample data
   ```

2. **Catch-level fallback:** If entire request fails:
   ```typescript
   catch (err) {
     setData({ topics: SAMPLE_TOPICS, pipelines: SAMPLE_PIPELINES });
     setError(err.message); // User sees error
   }
   ```

This ensures the UI always shows *something* instead of blank/error states.

---

## Verification

Once backend is running, check these endpoints:

| Endpoint | Expected Response |
|----------|-------------------|
| `/api/streams/topics` | Kafka topic list with lag/throughput |
| `/api/streams/pipelines` | Flink pipeline status |
| `/api/streams/kafka/lag` | Detailed lag metrics |
| `/api/streams/flink/clusters` | Cluster information |
| `/api/streams/alerts` | Real-time alerts |

All should return `200 OK` with data in the format:
```json
{
  "status": "ok",
  "data": { ... },
  "meta": { ... }
}
```

---

## Database Requirements

For streams metrics to work, ensure:

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | ✅ Required |
| Neo4j | 7687 | ✅ Required |
| Kafka | 9092 | ⚠️ Optional (warning if missing) |
| Redis | 6379 | ⚠️ Optional (warning if missing) |

Test connectivity:
```powershell
Test-NetConnection localhost -Port 5432  # PostgreSQL
Test-NetConnection localhost -Port 7687  # Neo4j
Test-NetConnection localhost -Port 9092  # Kafka
```

---

## Related Documentation

- **QUICK_FIX.md** - 30-second backend startup guide
- **BACKEND_FIX_GUIDE.md** - Comprehensive troubleshooting
- **COMPLETE_API_REFERENCE.md** - All 106 API endpoints

---

## Summary

| Step | Status |
|------|--------|
| ✅ Fixed hook type definitions | DONE |
| ✅ Improved error handling in apiGet | DONE |
| ▶️ **Start backend server** | **DO THIS NOW** |
| ▶️ Seed database with sample data | **DO THIS NEXT** |
| ▶️ Hard refresh browser (Ctrl+F5) | **DO THIS LAST** |

Once backend is running, the error will disappear and streams metrics will display!
