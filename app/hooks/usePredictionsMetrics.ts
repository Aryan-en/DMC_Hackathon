'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type ForecastPoint = {
  date: string;
  probability: number;
  confidence: number;
  trend: string;
};

type ModelPerformance = {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
};

type ModelDrift = {
  drift_detected: boolean;
  drift_score: number;
  alert_level: string;
};

type TrainingStatus = {
  status: string;
  progress_pct: number;
  dataset_size: number;
  epochs_completed: number;
  epochs_target: number;
  latest_loss: number;
  last_duration_sec: number;
  updated_at: string;
};

type ServingHealth = {
  status: string;
  requests_per_min: number;
  latency_ms: number;
  error_rate_pct: number;
  uptime_pct: number;
  updated_at: string;
};

type DashboardOverview = {
  latest_risk_probability: number;
  avg_7d_risk_probability: number;
  model_accuracy: number;
  model_f1: number;
  model_auc_roc: number;
  serving_latency_ms: number;
  serving_error_rate_pct: number;
  serving_uptime_pct: number;
};

type PygModelStatus = {
  model_name: string;
  model_version: string;
  status: string;
  precision: number;
  recall: number;
  f1_score: number;
  avg_inference_ms: number;
  updated_at: string;
};

type AbSummary = {
  experiment: string;
  primary_metric: string;
  variant_a: { precision: number; recall: number; sample_size: number };
  variant_b: { precision: number; recall: number; sample_size: number };
  winner: string;
};

type PredictionsMetrics = {
  region: string;
  forecast: ForecastPoint[];
  modelPerformance: ModelPerformance;
  modelDrift: ModelDrift;
  trainingStatus: TrainingStatus;
  servingHealth: ServingHealth;
  dashboardOverview: DashboardOverview;
  pygModelStatus: PygModelStatus;
  abSummary: AbSummary;
};

// Sample fallback data
const SAMPLE_FORECAST: ForecastPoint[] = [
  { date: '2026-03-16', probability: 0.32, confidence: 0.95, trend: 'stable' },
  { date: '2026-03-17', probability: 0.35, confidence: 0.94, trend: 'up' },
  { date: '2026-03-18', probability: 0.38, confidence: 0.93, trend: 'up' },
  { date: '2026-03-19', probability: 0.36, confidence: 0.92, trend: 'down' },
  { date: '2026-03-20', probability: 0.39, confidence: 0.91, trend: 'up' },
  { date: '2026-03-21', probability: 0.41, confidence: 0.90, trend: 'up' },
  { date: '2026-03-22', probability: 0.44, confidence: 0.89, trend: 'up' },
];

const SAMPLE_PERFORMANCE: ModelPerformance = {
  accuracy: 0.84,
  precision: 0.81,
  recall: 0.79,
  f1_score: 0.80,
  auc_roc: 0.87,
};

const SAMPLE_DRIFT: ModelDrift = {
  drift_detected: false,
  drift_score: 0.12,
  alert_level: 'low',
};

const SAMPLE_TRAINING: TrainingStatus = {
  status: 'completed',
  progress_pct: 100.0,
  dataset_size: 125000,
  epochs_completed: 15,
  epochs_target: 15,
  latest_loss: 0.0842,
  last_duration_sec: 342.5,
  updated_at: new Date().toISOString(),
};

const SAMPLE_SERVING: ServingHealth = {
  status: 'healthy',
  requests_per_min: 842.5,
  latency_ms: 128.4,
  error_rate_pct: 0.23,
  uptime_pct: 99.97,
  updated_at: new Date().toISOString(),
};

const SAMPLE_OVERVIEW: DashboardOverview = {
  latest_risk_probability: 0.44,
  avg_7d_risk_probability: 0.375,
  model_accuracy: 0.84,
  model_f1: 0.80,
  model_auc_roc: 0.87,
  serving_latency_ms: 128.4,
  serving_error_rate_pct: 0.23,
  serving_uptime_pct: 99.97,
};

const SAMPLE_PYG: PygModelStatus = {
  model_name: 'PyG Conflict Risk GNN',
  model_version: 'v0.1',
  status: 'ready',
  precision: 0.81,
  recall: 0.79,
  f1_score: 0.80,
  avg_inference_ms: 42.3,
  updated_at: new Date().toISOString(),
};

const SAMPLE_AB: AbSummary = {
  experiment: 'prediction-threshold-policy',
  primary_metric: 'precision',
  variant_a: { precision: 0.81, recall: 0.76, sample_size: 50000 },
  variant_b: { precision: 0.78, recall: 0.82, sample_size: 50000 },
  winner: 'A',
};

export function usePredictionsMetrics(pollInterval = 5000) {
  const [data, setData] = useState<PredictionsMetrics>({
    region: 'Global',
    forecast: SAMPLE_FORECAST,
    modelPerformance: SAMPLE_PERFORMANCE,
    modelDrift: SAMPLE_DRIFT,
    trainingStatus: SAMPLE_TRAINING,
    servingHealth: SAMPLE_SERVING,
    dashboardOverview: SAMPLE_OVERVIEW,
    pygModelStatus: SAMPLE_PYG,
    abSummary: SAMPLE_AB,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let pollTimer: NodeJS.Timeout | null = null;

    async function load() {
      try {
        const [riskRes, perfRes, driftRes, trainingRes, servingRes, overviewRes, pygRes, abRes] = await Promise.all([
          apiGet<{ region: string; forecast: ForecastPoint[] }>('/api/predictions/conflict-risk').catch(() => ({ region: 'Global', forecast: SAMPLE_FORECAST })),
          apiGet<ModelPerformance>('/api/predictions/model-performance').catch(() => SAMPLE_PERFORMANCE),
          apiGet<ModelDrift>('/api/predictions/model-drift').catch(() => SAMPLE_DRIFT),
          apiGet<TrainingStatus>('/api/predictions/training-status').catch(() => SAMPLE_TRAINING),
          apiGet<ServingHealth>('/api/predictions/serving-health').catch(() => SAMPLE_SERVING),
          apiGet<DashboardOverview>('/api/predictions/dashboard-overview').catch(() => SAMPLE_OVERVIEW),
          apiGet<PygModelStatus>('/api/predictions/pyg-model/status').catch(() => SAMPLE_PYG),
          apiGet<AbSummary>('/api/predictions/ab-testing/summary').catch(() => SAMPLE_AB),
        ]);

        if (!active) return;
        
        // Handle nested data structure from API
        const riskData = riskRes && typeof riskRes === 'object' && 'data' in (riskRes as any)
          ? (riskRes as any).data
          : riskRes;

        setData({
          region: riskData.region || 'Global',
          forecast: riskData.forecast || SAMPLE_FORECAST,
          modelPerformance: perfRes,
          modelDrift: driftRes,
          trainingStatus: trainingRes,
          servingHealth: servingRes,
          dashboardOverview: overviewRes,
          pygModelStatus: pygRes,
          abSummary: abRes,
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error('Error loading predictions metrics:', err);
        // Keep using sample data on error
        setError(err instanceof Error ? err.message : 'Using sample prediction data');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    // Set up polling
    pollTimer = setInterval(() => {
      if (active) {
        load();
      }
    }, pollInterval);

    return () => {
      active = false;
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [pollInterval]);

  return { data, loading, error };
}
