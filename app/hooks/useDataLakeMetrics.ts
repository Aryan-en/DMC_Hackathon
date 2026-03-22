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

// Fallback sample data
const SAMPLE_SUMMARY: Summary = {
  total_size_gb: 847.3,
  record_count: 12450000,
  datasets: 6,
};

const SAMPLE_DATASETS: Dataset[] = [
  { name: 'diplomatic_cables', format: 'parquet', records: 3200000, size_gb: 245.1, tier: 'hot' },
  { name: 'economic_indicators', format: 'parquet', records: 4500000, size_gb: 198.7, tier: 'hot' },
  { name: 'geospatial_events', format: 'parquet', records: 1800000, size_gb: 156.2, tier: 'warm' },
  { name: 'media_corpus', format: 'json', records: 1250000, size_gb: 112.4, tier: 'warm' },
  { name: 'satellite_imagery_meta', format: 'parquet', records: 950000, size_gb: 89.3, tier: 'cold' },
  { name: 'historical_archives', format: 'csv', records: 750000, size_gb: 45.6, tier: 'cold' },
];

export function useDataLakeMetrics() {
  const [data, setData] = useState<DataLakeMetrics>({
    summary: SAMPLE_SUMMARY,
    datasets: SAMPLE_DATASETS,
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
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({ summary: SAMPLE_SUMMARY, datasets: SAMPLE_DATASETS });
        setError(err instanceof Error ? err.message : 'Failed to load data lake metrics - using sample data');
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
