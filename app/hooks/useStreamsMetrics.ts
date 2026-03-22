'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type Topic = {
  topic: string;
  partitions: number;
  lag: number;
  throughput: number;
  status: string;
};

type Pipeline = {
  name: string;
  status: string;
  throughput: string;
  latency: string;
};

type StreamsMetrics = {
  topics: Topic[];
  pipelines: Pipeline[];
};

// Fallback sample data
const SAMPLE_TOPICS: Topic[] = [
  {
    topic: 'documents.raw',
    partitions: 4,
    lag: 892,
    throughput: 5000,
    status: 'degraded',
  },
  {
    topic: 'mea.relations.raw',
    partitions: 3,
    lag: 746,
    throughput: 5000,
    status: 'warning',
  },
  {
    topic: 'economic.indicators.batch',
    partitions: 2,
    lag: 23,
    throughput: 2000,
    status: 'healthy',
  },
];

const SAMPLE_PIPELINES: Pipeline[] = [
  {
    name: 'conflict-aggregation',
    status: 'healthy',
    throughput: '20000 msg/s',
    latency: '165.2ms',
  },
  {
    name: 'entity-enrichment',
    status: 'healthy',
    throughput: '15000 msg/s',
    latency: '172.5ms',
  },
  {
    name: 'indicator-windowing',
    status: 'warning',
    throughput: '10000 msg/s',
    latency: '185.1ms',
  },
];

export function useStreamsMetrics(pollInterval = 5000) {
  const [data, setData] = useState<StreamsMetrics>({ topics: SAMPLE_TOPICS, pipelines: SAMPLE_PIPELINES });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let pollTimer: NodeJS.Timeout | null = null;

    async function load() {
      try {
        const [topicsRes, pipelinesRes] = await Promise.all([
          apiGet<{ topics: Topic[] }>('/api/streams/topics'),
          apiGet<{ pipelines: Pipeline[] }>('/api/streams/pipelines'),
        ]);

        if (!active) return;

        // apiGet returns payload.data directly, so destructure the response
        const topics = topicsRes?.topics || SAMPLE_TOPICS;
        const pipelines = pipelinesRes?.pipelines || SAMPLE_PIPELINES;

        setData({ topics, pipelines });
        setError(null);
      } catch (err) {
        if (!active) return;
        console.warn('Failed to load stream metrics (using sample data):', err);
        // Use sample data as fallback
        setData({ topics: SAMPLE_TOPICS, pipelines: SAMPLE_PIPELINES });
        setError(err instanceof Error ? err.message : 'Failed to load stream metrics - using sample data');
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
