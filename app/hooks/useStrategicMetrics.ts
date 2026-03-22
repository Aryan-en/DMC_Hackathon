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
};

// Fallback sample data
const SAMPLE_REGIONS: RegionRisk[] = [
  { name: 'Eastern Europe', risk: 87, color: '#ef4444' },
  { name: 'East Asia', risk: 72, color: '#f97316' },
  { name: 'Middle East', risk: 68, color: '#f97316' },
  { name: 'South Asia', risk: 55, color: '#eab308' },
  { name: 'Sub-Saharan Africa', risk: 62, color: '#f97316' },
  { name: 'Latin America', risk: 38, color: '#22c55e' },
  { name: 'North America', risk: 24, color: '#22c55e' },
  { name: 'Western Europe', risk: 28, color: '#22c55e' },
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
    { label: 'PostgreSQL', value: 98, color: '#22c55e' },
    { label: 'Neo4j', value: 95, color: '#22c55e' },
    { label: 'Kafka', value: 87, color: '#3b82f6' },
    { label: 'Redis', value: 99, color: '#22c55e' },
    { label: 'Ollama ML', value: 82, color: '#eab308' },
    { label: 'API Gateway', value: 96, color: '#22c55e' },
  ],
};

export function useStrategicMetrics() {
  const [data, setData] = useState<StrategicMetrics>({
    regions: SAMPLE_REGIONS,
    globalEntities: SAMPLE_GLOBAL_ENTITIES,
    threatThreads: SAMPLE_THREAT_THREADS,
    dailyIngestion: SAMPLE_DAILY_INGESTION,
    predictionAccuracy: SAMPLE_PREDICTION_ACCURACY,
    infraHealth: SAMPLE_INFRA_HEALTH,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [regions, globalEntities, threatThreads, dailyIngestion, predictionAccuracy, infraHealth] = await Promise.all([
          apiGet<{ regions: RegionRisk[] }>('/api/metrics/regional-risk'),
          apiGet<{ total: number; breakdown: Record<string, number> }>('/api/metrics/global-entities'),
          apiGet<{ critical: number; high: number; monitor: number; total: number }>('/api/metrics/threat-threads'),
          apiGet<{ total_gb: number; realtime_processed_gb: number }>('/api/metrics/daily-ingestion'),
          apiGet<{ accuracy: number }>('/api/metrics/prediction-accuracy'),
          apiGet<{ components: Array<{ label: string; value: number; color: string }> }>('/api/metrics/infrastructure-health'),
        ]);

        if (!active) return;
        setData({
          regions: regions.regions,
          globalEntities,
          threatThreads,
          dailyIngestion,
          predictionAccuracy,
          infraHealth,
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({
          regions: SAMPLE_REGIONS,
          globalEntities: SAMPLE_GLOBAL_ENTITIES,
          threatThreads: SAMPLE_THREAT_THREADS,
          dailyIngestion: SAMPLE_DAILY_INGESTION,
          predictionAccuracy: SAMPLE_PREDICTION_ACCURACY,
          infraHealth: SAMPLE_INFRA_HEALTH,
        });
        setError(err instanceof Error ? err.message : 'Failed to load metrics - using sample data');
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
