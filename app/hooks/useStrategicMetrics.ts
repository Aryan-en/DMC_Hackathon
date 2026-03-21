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

export function useStrategicMetrics() {
  const [data, setData] = useState<StrategicMetrics>({
    regions: [],
    globalEntities: { total: 0, breakdown: {} },
    threatThreads: { critical: 0, high: 0, monitor: 0, total: 0 },
    dailyIngestion: { total_gb: 0, realtime_processed_gb: 0 },
    predictionAccuracy: { accuracy: 0 },
    infraHealth: { components: [] },
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
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
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
