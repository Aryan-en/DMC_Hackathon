'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/app/lib/api';

export interface IntelAlert {
  id: string;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  region: string;
  message: string;
  source: string;
  confidence: number;
  url?: string | null;
}

let _cachedAlerts: IntelAlert[] = [];
let _lastAlertFetch: number = 0;
const ALERTS_CACHE_TTL = 30000;

export function useIntelligenceAlerts(pollingInterval = 30000) {
  const [alerts, setAlerts] = useState<IntelAlert[]>(() => {
    // Keep first render deterministic across SSR/client to avoid hydration mismatches.
    return _cachedAlerts;
  });
  const [loading, setLoading] = useState(_cachedAlerts.length === 0 && alerts.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async (force = false) => {
    const hasData = _cachedAlerts.length > 0 || alerts.length > 0;
    if (!force && hasData && (Date.now() - _lastAlertFetch < ALERTS_CACHE_TTL)) {
      if (loading) setLoading(false);
      return;
    }

    try {
      if (!hasData) setLoading(true);
      const data = await apiGet<{ alerts: IntelAlert[] }>('/api/intelligence/alerts?min_severity=medium&limit=10');
      if (data && data.alerts) {
        // Client-side deduping by message to prevent redundant alerts for same news item
        const seen = new Set();
        const deduped = data.alerts.filter(alert => {
          if (seen.has(alert.message)) return false;
          seen.add(alert.message);
          return true;
        });
        
        _cachedAlerts = deduped;
        _lastAlertFetch = Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem('ontora_intelligence_alerts', JSON.stringify(deduped));
        }
        setAlerts(deduped);
        setError(null);
      }
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && _cachedAlerts.length === 0) {
      const saved = localStorage.getItem('ontora_intelligence_alerts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as IntelAlert[];
          _cachedAlerts = parsed;
          _lastAlertFetch = Date.now();
          setAlerts(parsed);
          setLoading(false);
        } catch {
          // Ignore malformed cached payloads.
        }
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchAlerts, pollingInterval]);

  return { alerts, loading, error, refetch: fetchAlerts };
}
