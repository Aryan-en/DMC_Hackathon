'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

export type ProcessingLogEvent = {
  timestamp: string;
  type: string;
  event: string;
};

export function useProcessingLog() {
  const [events, setEvents] = useState<ProcessingLogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiGet<{ events: ProcessingLogEvent[] }>('/api/intelligence/processing-log');
        if (!active) return;
        setEvents(response.events || []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load processing log');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { events, loading, error };
}
