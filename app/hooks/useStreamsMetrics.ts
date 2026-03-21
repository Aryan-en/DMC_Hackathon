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

export function useStreamsMetrics() {
  const [data, setData] = useState<StreamsMetrics>({ topics: [], pipelines: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [topicsRes, pipelinesRes] = await Promise.all([
          apiGet<{ topics: Topic[] }>('/api/streams/topics'),
          apiGet<{ pipelines: Pipeline[] }>('/api/streams/pipelines'),
        ]);

        if (!active) return;
        setData({ topics: topicsRes.topics, pipelines: pipelinesRes.pipelines });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load stream metrics');
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
