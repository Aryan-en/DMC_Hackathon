'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type Summary = {
  total_size_gb: number;
  record_count: number;
  datasets: number;
};

type Dataset = {
  name: string;
  format: string;
  records: number;
  size_gb: number;
  tier: string;
};

type DataLakeMetrics = {
  summary: Summary;
  datasets: Dataset[];
};

export function useDataLakeMetrics() {
  const [data, setData] = useState<DataLakeMetrics>({
    summary: { total_size_gb: 0, record_count: 0, datasets: 0 },
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [summaryRes, datasetsRes] = await Promise.all([
          apiGet<Summary>('/api/data-lake/summary'),
          apiGet<{ datasets: Dataset[] }>('/api/data-lake/datasets'),
        ]);

        if (!active) return;
        setData({ summary: summaryRes, datasets: datasetsRes.datasets });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load data lake metrics');
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
