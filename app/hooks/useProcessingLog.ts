'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

export type ProcessingLogEvent = {
  timestamp: string;
  type: string;
  event: string;
};

// Fallback sample data
const SAMPLE_EVENTS: ProcessingLogEvent[] = [
  { timestamp: '2026-03-22T11:48:00Z', type: 'NER', event: 'Entity extraction completed: 245 entities from 18 documents' },
  { timestamp: '2026-03-22T11:45:00Z', type: 'INGEST', event: 'Batch ingestion: 1,200 diplomatic cables processed' },
  { timestamp: '2026-03-22T11:42:00Z', type: 'CLASSIFY', event: 'Document classification: 89 documents auto-classified (SECRET: 12, FOUO: 45, UNCLASS: 32)' },
  { timestamp: '2026-03-22T11:38:00Z', type: 'SENTIMENT', event: 'Sentiment analysis completed: 340 articles across 6 languages' },
  { timestamp: '2026-03-22T11:35:00Z', type: 'GRAPH', event: 'Knowledge graph update: 78 new relationships added, 12 conflicts resolved' },
  { timestamp: '2026-03-22T11:30:00Z', type: 'TRANSLATE', event: 'Translation pipeline: 56 documents translated (AR→EN: 28, ZH→EN: 18, RU→EN: 10)' },
  { timestamp: '2026-03-22T11:25:00Z', type: 'PREDICT', event: 'Conflict risk model inference: 42 regions evaluated, 3 alerts raised' },
  { timestamp: '2026-03-22T11:20:00Z', type: 'EXPORT', event: 'Scheduled export: weekly intelligence digest generated (PDF, 48 pages)' },
];

export function useProcessingLog() {
  const [events, setEvents] = useState<ProcessingLogEvent[]>(SAMPLE_EVENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await apiGet<{ events: ProcessingLogEvent[] }>('/api/intelligence/processing-log');
        if (!active) return;
        setEvents(response.events || SAMPLE_EVENTS);
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setEvents(SAMPLE_EVENTS);
        setError(err instanceof Error ? err.message : 'Failed to load processing log - using sample data');
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
