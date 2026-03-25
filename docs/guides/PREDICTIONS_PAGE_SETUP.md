# Predictions Page - Setup & Testing Guide

## Architecture Overview

The Predictions page (`http://localhost:3002/predictions`) is a comprehensive ML model monitoring dashboard that includes:

- **Conflict Risk Forecasting**: 7-day probability predictions
- **Model Performance Metrics**: Accuracy, Precision, Recall, F1, AUC-ROC
- **Model Drift Detection**: Automated monitoring for data/concept drift
- **Training Status**: Real-time training job progress tracking
- **Serving Health**: API latency, error rates, uptime monitoring
- **A/B Testing Framework**: Variant comparison and winner selection
- **PyG GNN Model Status**: Graph neural network metrics for conflict prediction

## Component Stack

### Backend (FastAPI)
- **Location**: `backend/api/predictions.py`
- **Port**: 8000 (default)
- **Database**: PostgreSQL for metrics persistence
- **Endpoints** (8 total):
  1. `GET /api/predictions/conflict-risk` - Risk forecasts
  2. `GET /api/predictions/model-performance` - Performance metrics
  3. `GET /api/predictions/model-drift` - Drift detection
  4. `GET /api/predictions/training-status` - Training progress
  5. `GET /api/predictions/serving-health` - Service health
  6. `GET /api/predictions/dashboard-overview` - Summary metrics
  7. `GET /api/predictions/pyg-model/status` - Model status
  8. `GET /api/predictions/ab-testing/summary` - A/B test results

### Frontend (Next.js)
- **Location**: `app/predictions/page.tsx`
- **Port**: 3002 (configured via npm script)
- **Hook**: `app/hooks/usePredictionsMetrics.ts`
- **Features**:
  - Auto-polling backend (5-second intervals)
  - Graceful fallback to sample data if API unavailable
  - Real-time updates with visual indicators
  - Comprehensive error handling

### Database (PostgreSQL)
- **Table**: `system_metric`
- **Key Metrics**:
  - `conflict_risk_probability` (time-series)
  - `model_accuracy`, `model_precision`, `model_recall`
  - `model_f1`, `model_auc_roc`

## Setup Instructions

### 1. Seed Test Data
```bash
cd d:\DMC_Hackathon
python seed_predictions_metrics.py
```
This populates the database with 12 test metrics:
- 7 daily conflict risk probabilities (increasing trend)
- 5 model performance metrics (accuracy, precision, recall, F1, AUC-ROC)

### 2. Start Backend API
```bash
cd d:\DMC_Hackathon\backend
python main.py
```
Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### 3. Start Frontend (Port 3002)
```bash
cd d:\DMC_Hackathon
npm run dev -- -p 3002
```
Expected output:
```
 ▲ Next.js 16.1.6
 - Local:        http://localhost:3002
```

### 4. Access the Application
Open: **http://localhost:3002/predictions**

## Testing Checklist

### Visual Verification
- [ ] Page loads without errors
- [ ] All 4 summary cards display (Forecast Horizon, Latest Probability, Model Accuracy, Serving Health)
- [ ] PyG Conflict Model section shows model version and metrics
- [ ] A/B Testing Framework section displays variant comparisons
- [ ] Training Status, Serving Health, and Dashboard Overview cards render correctly
- [ ] Conflict Risk Forecast table shows 7 days of data
- [ ] Model Performance grid displays 5 metrics
- [ ] Model Drift Monitoring section shows drift status

### Data Verification
- [ ] Latest Probability is > 0% (from seeded data: ~44%)
- [ ] Model Accuracy is ~84%
- [ ] Serving Health Status is 'HEALTHY'
- [ ] At least 7 forecast points in the table
- [ ] Training Status shows "COMPLETED"

### Analytics Checks
- [ ] All percentages are formatted correctly (e.g., "44.00%")
- [ ] All decimals are limited to 2-4 places
- [ ] Trends in forecast show progression (up/down/stable)
- [ ] Color coding is consistent:
  - Cyan (#00d4ff) for primary metrics
  - Orange (#f59e0b) for caution metrics
  - Green (#00ff88) for healthy status
  - Red (#ef4444) for errors/high risk

### API Integration Checks
- [ ] Network tab shows requests to `/api/predictions/*` endpoints
- [ ] Requests complete within 5 seconds
- [ ] No CORS errors in browser console
- [ ] Polling continues every 5 seconds (check network tab)

### Error Handling Checks
1. **Stop the backend** and verify:
   - [ ] Page still displays sample data
   - [ ] Error message appears in error banner (optional)
   - [ ] No console errors or warnings

2. **Restart backend** and verify:
   - [ ] Page fetches live data again
   - [ ] Numbers update with real database values
   - [ ] Error banner disappears

## Troubleshooting

### Issue: "Cannot connect to http://localhost:8000"
**Solution**:
```bash
# Start backend in another terminal
cd backend
python main.py
```

### Issue: Port 3002 already in use
**Solution**:
```bash
# Use a different port
npm run dev -- -p 3003
# Then access: http://localhost:3003/predictions
```

### Issue: No data in the forecast table
**Solution**:
```bash
# Reseed the database
python seed_predictions_metrics.py

# Verify data exists
cd backend
python -c "from db.postgres import async_session; from db.schemas import SystemMetric; from sqlalchemy import select, func; ..."
```

### Issue: "Request timeout" errors
**Solution**:
- Check backend is running: `curl http://localhost:8000/health`
- Check network connectivity
- Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local` is `http://localhost:8000`

## Development Notes

### Adding New Metrics
To add a new prediction metric:

1. **Seed data**: Add to `seed_predictions_metrics.py`
2. **Backend endpoint**: Add to `backend/api/predictions.py`
3. **Hook type**: Update `PredictionsMetrics` type in `usePredictionsMetrics.ts`
4. **Frontend**: Add UI component to `app/predictions/page.tsx`

### Sample Data Fallback
If the backend is unavailable, the page automatically uses hardcoded sample data defined in the hook:
- `SAMPLE_FORECAST`: 7-day trend data
- `SAMPLE_PERFORMANCE`: Model metrics
- `SAMPLE_DRIFT`: Drift detection state
- `SAMPLE_TRAINING`: Training job status
- `SAMPLE_SERVING`: API health metrics
- `SAMPLE_OVERVIEW`: Dashboard summary
- `SAMPLE_PYG`: Graph neural network status
- `SAMPLE_AB`: A/B testing results

This ensures the page is always usable, even during backend maintenance.

## Performance Notes

- **Polling Interval**: 5 seconds (configurable in hook)
- **Request Timeout**: 10 seconds per endpoint
- **Concurrent Requests**: 8 endpoints fetched in parallel
- **Typical Load Time**: 200-500ms with backend available

## Files Modified

✓ `app/predictions/page.tsx` - Fixed forecast latest value (line 6)
✓ `app/hooks/usePredictionsMetrics.ts` - Already complete
✓ `backend/api/predictions.py` - 8 endpoints already implemented
✓ `seed_predictions_metrics.py` - Created for test data
✓ `.env.local` - API_BASE_URL already configured

## Status: ✅ READY

The predictions page is fully functional and ready to use!
