'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type RegionRisk = { name: string; risk: number; color: string };

type StrategicMetrics = {
  regions: RegionRisk[];
  globalEntities: { total: number; breakdown: Record<string, number> };
  threatThreads: { critical: number; high: number; monitor: number; total: number };
  dailyIngestion: { total_gb: number; realtime_processed_gb: number };
  predictionAccuracy: { accuracy: number };
  infraHealth: { components: Array<{ label: string; value: number; color: string }> };
  riskTrend: any[]; // Flexible for chart mapping
  sentimentTrend: any[];
  entityDistribution: any[];
  liveTelemetry: any;
};

// Fallback sample data
const SAMPLE_REGIONS: RegionRisk[] = [
  { name: 'Eastern Europe', risk: 87, color: 'var(--accent-crimson)' },
  { name: 'East Asia', risk: 72, color: 'var(--accent-amber)' },
  { name: 'Middle East', risk: 68, color: 'var(--accent-amber)' },
  { name: 'South Asia', risk: 55, color: 'var(--accent-gold)' },
  { name: 'Sub-Saharan Africa', risk: 62, color: 'var(--accent-amber)' },
  { name: 'Latin America', risk: 38, color: 'var(--accent-emerald)' },
  { name: 'North America', risk: 24, color: 'var(--accent-emerald)' },
  { name: 'Western Europe', risk: 28, color: 'var(--accent-emerald)' },
];

const SAMPLE_GLOBAL_ENTITIES = {
  total: 2840,
  breakdown: { Country: 195, Organization: 342, Person: 1205, Event: 876, Treaty: 128, Resource: 94 },
};

const SAMPLE_THREAT_THREADS = { critical: 3, high: 12, monitor: 47, total: 62 };

const SAMPLE_DAILY_INGESTION = { total_gb: 12.4, realtime_processed_gb: 8.7 };

const SAMPLE_PREDICTION_ACCURACY = { accuracy: 0.84 };

const SAMPLE_INFRA_HEALTH = {
  components: [
    { label: 'PostgreSQL', value: 98, color: 'var(--accent-emerald)' },
    { label: 'Neo4j', value: 95, color: 'var(--accent-emerald)' },
    { label: 'Kafka', value: 87, color: 'var(--accent-steel)' },
    { label: 'Redis', value: 99, color: 'var(--accent-emerald)' },
    { label: 'Ollama ML', value: 82, color: 'var(--accent-gold)' },
    { label: 'API Gateway', value: 96, color: 'var(--accent-emerald)' },
  ],
};

const INITIAL_DATA: StrategicMetrics = {
  regions: [],
  globalEntities: { total: 0, breakdown: {} },
  threatThreads: { critical: 0, high: 0, monitor: 0, total: 0 },
  dailyIngestion: { total_gb: 0, realtime_processed_gb: 0 },
  predictionAccuracy: { accuracy: 0 },
  infraHealth: { components: [] },
  riskTrend: [],
  sentimentTrend: [],
  entityDistribution: [],
  liveTelemetry: null,
};

let _cachedData: StrategicMetrics | null = null;
let _lastFetch: number = 0;
const CACHE_TTL = 30000;

export function useStrategicMetrics() {
  const [data, setData] = useState<StrategicMetrics>(() => {
    // Keep server and first client render deterministic to avoid hydration mismatch.
    return _cachedData || INITIAL_DATA;
  });
  const [loading, setLoading] = useState(!_cachedData && (!data || data.regions.length === 0));
  const [error, setError] = useState<string | null>(null);

  async function load(force = false) {
    if (!force && _cachedData && (Date.now() - _lastFetch < CACHE_TTL)) {
      if (loading) setLoading(false);
      return;
    }
    
    try {
      const noData = !data || data.regions.length === 0;
      if (noData) setLoading(true);
      const [
        regions,
        globalEntities,
        threatThreads,
        dailyIngestion,
        predictionAccuracy,
        infraHealth,
        riskTrend,
        sentimentTrend,
        entityDistribution,
        liveTelemetry
      ] = await Promise.all([
        apiGet<{ regions: RegionRisk[] }>('/api/metrics/regional-risk'),
        apiGet<{ total: number; breakdown: Record<string, number> }>('/api/metrics/global-entities'),
        apiGet<{ critical: number; high: number; monitor: number; total: number }>('/api/metrics/threat-threads'),
        apiGet<{ total_gb: number; realtime_processed_gb: number }>('/api/metrics/daily-ingestion'),
        apiGet<{ accuracy: number }>('/api/metrics/prediction-accuracy'),
        apiGet<{ components: Array<{ label: string; value: number; color: string }> }>('/api/metrics/infrastructure-health'),
        apiGet<{ forecast: Array<{ date: string; probability: number }> }>('/api/predictions/conflict-risk'),
        apiGet<{ history: any[] }>('/api/metrics/sentiment-trend'),
        apiGet<{ distribution: any[] }>('/api/metrics/entity-distribution'),
        apiGet<any>('/api/tasks/telemetry/live'),
      ]);

      const newData = {
        regions: regions.regions,
        globalEntities,
        threatThreads,
        dailyIngestion,
        predictionAccuracy,
        infraHealth,
        riskTrend: (riskTrend.forecast && riskTrend.forecast.length > 0) ? riskTrend.forecast.map((f: any) => ({
          month: f.date,
          geopolitical: f.probability * 100,
          economic: (f.probability * 0.85) * 100,
          climate: (f.probability * 0.7) * 100,
          cyber: (f.probability * 0.95) * 100
        })) : [
          { month: '00:00', geopolitical: 62, economic: 48, climate: 35, cyber: 71 },
          { month: '04:00', geopolitical: 65, economic: 52, climate: 38, cyber: 75 },
          { month: '08:00', geopolitical: 58, economic: 42, climate: 40, cyber: 68 },
          { month: '12:00', geopolitical: 74, economic: 61, climate: 42, cyber: 78 },
          { month: '16:00', geopolitical: 69, economic: 55, climate: 47, cyber: 82 },
          { month: '20:00', geopolitical: 83, economic: 67, climate: 52, cyber: 76 },
          { month: '23:59', geopolitical: 91, economic: 74, climate: 63, cyber: 84 },
        ],
        sentimentTrend: (sentimentTrend.history && sentimentTrend.history.length > 0) ? sentimentTrend.history : [
          { date: '00:00', positive: 0.65, neutral: 0.25, negative: 0.10 },
          { date: '12:00', positive: 0.62, neutral: 0.28, negative: 0.10 },
          { date: '23:59', positive: 0.68, neutral: 0.22, negative: 0.10 }
        ],
        entityDistribution: (entityDistribution.distribution && entityDistribution.distribution.length > 0) ? entityDistribution.distribution.map((d: any) => ({
          name: d.category,
          value: d.count
        })) : [
          { name: 'PEOPLE', value: 1240 }, { name: 'ORGS', value: 870 },
          { name: 'PLACE', value: 2150 }, { name: 'EVENT', value: 540 },
          { name: 'CONCEPT', value: 920 }, { name: 'GPE', value: 1540 }
        ],
        liveTelemetry: liveTelemetry,
      };

      _cachedData = newData;
      _lastFetch = Date.now();
      if (typeof window !== 'undefined') {
        localStorage.setItem('ontora_strategic_metrics', JSON.stringify(newData));
      }
      setData(newData);
      setError(null);
    } catch (err) {
      // Use sample data as fallback
      setData({
        regions: SAMPLE_REGIONS,
        globalEntities: SAMPLE_GLOBAL_ENTITIES,
        threatThreads: SAMPLE_THREAT_THREADS,
        dailyIngestion: SAMPLE_DAILY_INGESTION,
        predictionAccuracy: SAMPLE_PREDICTION_ACCURACY,
        infraHealth: SAMPLE_INFRA_HEALTH,
        riskTrend: [
          { month: '00:00', geopolitical: 62, economic: 48, climate: 35, cyber: 71 },
          { month: '04:00', geopolitical: 65, economic: 52, climate: 38, cyber: 75 },
          { month: '08:00', geopolitical: 58, economic: 42, climate: 40, cyber: 68 },
          { month: '12:00', geopolitical: 74, economic: 61, climate: 42, cyber: 78 },
          { month: '16:00', geopolitical: 69, economic: 55, climate: 47, cyber: 82 },
          { month: '20:00', geopolitical: 83, economic: 67, climate: 52, cyber: 76 },
          { month: '23:59', geopolitical: 91, economic: 74, climate: 63, cyber: 84 },
        ] as any,
        sentimentTrend: [
          { date: '00:00', positive: 0.65, neutral: 0.25, negative: 0.10 },
          { date: '06:00', positive: 0.58, neutral: 0.32, negative: 0.10 },
          { date: '12:00', positive: 0.62, neutral: 0.28, negative: 0.10 },
          { date: '18:00', positive: 0.55, neutral: 0.35, negative: 0.10 },
          { date: '23:59', positive: 0.68, neutral: 0.22, negative: 0.10 }
        ] as any,
        entityDistribution: [
          { name: 'PEOPLE', value: 1240 }, { name: 'ORGS', value: 870 },
          { name: 'PLACE', value: 2150 }, { name: 'EVENT', value: 540 },
          { name: 'CONCEPT', value: 920 }, { name: 'GPE', value: 1540 }
        ] as any,
        liveTelemetry: null,
      });
      setError(err instanceof Error ? err.message : 'Failed to load metrics - using sample data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !_cachedData) {
      const saved = localStorage.getItem('ontora_strategic_metrics');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as StrategicMetrics;
          _cachedData = parsed;
          _lastFetch = Date.now();
          setData(parsed);
          setLoading(false);
        } catch {
          // Ignore invalid cache payloads.
        }
      }
    }

    load();
  }, []);

  return { data, loading, error, refresh: load };
}
