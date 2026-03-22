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

type QualityMetric = {
  dataset: string;
  overall_score: number;
  completeness: number;
  accuracy: number;
};

type Lineage = {
  dataset: string;
  stages: number;
  source: string;
  destination: string;
};

type CostMetrics = {
  period_days: number;
  total_cost_units: number;
  average_cost_per_query: number;
  total_rows_scanned: number;
  queries_tracked: number;
  max_rows_scanned: number;
};

type MaterializedView = {
  name: string;
  base_tables: string[];
  refresh_frequency: string;
  rows: number;
  size_gb: number;
  last_refresh: string;
};

type DataLakeMetrics = {
  summary: Summary;
  datasets: Dataset[];
  quality: QualityMetric[];
  lineage: Lineage[];
  costs: CostMetrics;
  materialized_views: MaterializedView[];
};

// Fallback sample data
const SAMPLE_SUMMARY: Summary = {
  total_size_gb: 0.005,
  record_count: 164,
  datasets: 5,
};

const SAMPLE_DATASETS: Dataset[] = [
  { name: 'economic_indicators', format: 'postgresql', records: 50, size_gb: 0.00005, tier: 'silver' },
  { name: 'country_relations', format: 'postgresql', records: 30, size_gb: 0.00006, tier: 'silver' },
  { name: 'documents', format: 'postgresql', records: 20, size_gb: 0.001, tier: 'bronze' },
  { name: 'entities', format: 'postgresql', records: 42, size_gb: 0.000042, tier: 'gold' },
  { name: 'relationships', format: 'postgresql', records: 22, size_gb: 0.000022, tier: 'gold' },
];

const SAMPLE_QUALITY: QualityMetric[] = [
  { dataset: 'economic_indicators', overall_score: 95.2, completeness: 98.5, accuracy: 97.2 },
  { dataset: 'country_relations', overall_score: 93.8, completeness: 95.3, accuracy: 96.8 },
  { dataset: 'documents', overall_score: 88.9, completeness: 87.6, accuracy: 91.2 },
  { dataset: 'entities', overall_score: 90.9, completeness: 93.1, accuracy: 94.7 },
  { dataset: 'relationships', overall_score: 89.2, completeness: 91.8, accuracy: 93.9 },
];

const SAMPLE_LINEAGE: Lineage[] = [
  { dataset: 'economic_indicators', stages: 3, source: 'worldbank_fetcher.py', destination: 'postgres:economic_indicators' },
  { dataset: 'country_relations', stages: 3, source: 'mea_scraper.py', destination: 'postgres:country_relations' },
  { dataset: 'documents', stages: 3, source: 'mea_scraper.py', destination: 'postgres:documents' },
  { dataset: 'entities', stages: 3, source: 'llm_classifier.py', destination: 'postgres:entities' },
  { dataset: 'relationships', stages: 3, source: 'entity_extractor.py', destination: 'neo4j:relationships' },
];

const SAMPLE_COSTS: CostMetrics = {
  period_days: 1,
  total_cost_units: 0.018,
  average_cost_per_query: 0.006,
  total_rows_scanned: 164,
  queries_tracked: 3,
  max_rows_scanned: 50,
};

const SAMPLE_VIEWS: MaterializedView[] = [
  {
    name: 'v_conflict_risk_summary',
    base_tables: ['country_relations', 'entities'],
    refresh_frequency: 'hourly',
    rows: 1247,
    size_gb: 0.012,
    last_refresh: '2026-03-21T10:00:00Z',
  },
  {
    name: 'v_entity_metrics_daily',
    base_tables: ['entities', 'relationships'],
    refresh_frequency: 'daily',
    rows: 892,
    size_gb: 0.008,
    last_refresh: '2026-03-21T00:00:00Z',
  },
  {
    name: 'v_economic_indicators_monthly',
    base_tables: ['economic_indicators'],
    refresh_frequency: 'monthly',
    rows: 185,
    size_gb: 0.002,
    last_refresh: '2026-03-01T00:00:00Z',
  },
];

export function useDataLakeMetrics() {
  const [data, setData] = useState<DataLakeMetrics>({
    summary: SAMPLE_SUMMARY,
    datasets: SAMPLE_DATASETS,
    quality: SAMPLE_QUALITY,
    lineage: SAMPLE_LINEAGE,
    costs: SAMPLE_COSTS,
    materialized_views: SAMPLE_VIEWS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [summaryRes, datasetsRes, qualityRes, lineageRes, costsRes, viewsRes] = await Promise.allSettled([
          apiGet<Summary>('/api/data-lake/summary'),
          apiGet<{ datasets: Dataset[] }>('/api/data-lake/datasets'),
          apiGet<{ datasets: QualityMetric[] }>('/api/data-lake/quality'),
          apiGet<{ lineages: Lineage[] }>('/api/data-lake/lineage'),
          apiGet<CostMetrics>('/api/data-lake/costs'),
          apiGet<{ materialized_views: MaterializedView[] }>('/api/data-lake/materialized-views'),
        ]);

        if (!active) return;

        const finalData: DataLakeMetrics = {
          summary: summaryRes.status === 'fulfilled' ? summaryRes.value : SAMPLE_SUMMARY,
          datasets: datasetsRes.status === 'fulfilled' ? datasetsRes.value.datasets : SAMPLE_DATASETS,
          quality: qualityRes.status === 'fulfilled' ? qualityRes.value.datasets : SAMPLE_QUALITY,
          lineage: lineageRes.status === 'fulfilled' ? lineageRes.value.lineages : SAMPLE_LINEAGE,
          costs: costsRes.status === 'fulfilled' ? costsRes.value : SAMPLE_COSTS,
          materialized_views: viewsRes.status === 'fulfilled' ? viewsRes.value.materialized_views : SAMPLE_VIEWS,
        };

        setData(finalData);
        setError(null);
      } catch (err) {
        if (!active) return;
        setData({
          summary: SAMPLE_SUMMARY,
          datasets: SAMPLE_DATASETS,
          quality: SAMPLE_QUALITY,
          lineage: SAMPLE_LINEAGE,
          costs: SAMPLE_COSTS,
          materialized_views: SAMPLE_VIEWS,
        });
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
