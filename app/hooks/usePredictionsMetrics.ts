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

export function usePredictionsMetrics() {
  const [data, setData] = useState<PredictionsMetrics>({
    region: 'Global',
    forecast: [],
    modelPerformance: { accuracy: 0, precision: 0, recall: 0, f1_score: 0, auc_roc: 0 },
    modelDrift: { drift_detected: false, drift_score: 0, alert_level: 'unknown' },
    trainingStatus: {
      status: 'unknown',
      progress_pct: 0,
      dataset_size: 0,
      epochs_completed: 0,
      epochs_target: 0,
      latest_loss: 0,
      last_duration_sec: 0,
      updated_at: '',
    },
    servingHealth: {
      status: 'unknown',
      requests_per_min: 0,
      latency_ms: 0,
      error_rate_pct: 0,
      uptime_pct: 0,
      updated_at: '',
    },
    dashboardOverview: {
      latest_risk_probability: 0,
      avg_7d_risk_probability: 0,
      model_accuracy: 0,
      model_f1: 0,
      model_auc_roc: 0,
      serving_latency_ms: 0,
      serving_error_rate_pct: 0,
      serving_uptime_pct: 0,
    },
    pygModelStatus: {
      model_name: 'PyG Conflict Risk GNN',
      model_version: 'v0.1',
      status: 'unknown',
      precision: 0,
      recall: 0,
      f1_score: 0,
      avg_inference_ms: 0,
      updated_at: '',
    },
    abSummary: {
      experiment: 'prediction-threshold-policy',
      primary_metric: 'precision',
      variant_a: { precision: 0, recall: 0, sample_size: 0 },
      variant_b: { precision: 0, recall: 0, sample_size: 0 },
      winner: 'A',
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [riskRes, perfRes, driftRes, trainingRes, servingRes, overviewRes, pygRes, abRes] = await Promise.all([
          apiGet<{ region: string; forecast: ForecastPoint[] }>('/api/predictions/conflict-risk'),
          apiGet<ModelPerformance>('/api/predictions/model-performance'),
          apiGet<ModelDrift>('/api/predictions/model-drift'),
          apiGet<TrainingStatus>('/api/predictions/training-status'),
          apiGet<ServingHealth>('/api/predictions/serving-health'),
          apiGet<DashboardOverview>('/api/predictions/dashboard-overview'),
          apiGet<PygModelStatus>('/api/predictions/pyg-model/status'),
          apiGet<AbSummary>('/api/predictions/ab-testing/summary'),
        ]);

        if (!active) return;
        setData({
          region: riskRes.region,
          forecast: riskRes.forecast,
          modelPerformance: perfRes,
          modelDrift: driftRes,
          trainingStatus: trainingRes,
          servingHealth: servingRes,
          dashboardOverview: overviewRes,
          pygModelStatus: pygRes,
          abSummary: abRes,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load predictions metrics');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
