'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

type SecurityEvent = {
  id: string;
  event_type: string;
  severity: ThreatLevel;
  user_id: string;
  resource: string;
  description: string;
  timestamp: string;
};

type SecuritySummary = {
  total_events: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  critical_unresolved: number;
  timestamp: string;
};

type SecurityMonitoringData = {
  summary: SecuritySummary;
  critical_events: SecurityEvent[];
  recent_events_count: number;
  current_status: 'healthy' | 'degraded' | 'critical';
  last_updated: string;
};

const SAMPLE_SUMMARY: SecuritySummary = {
  total_events: 42,
  by_severity: {
    low: 28,
    medium: 10,
    high: 3,
    critical: 1,
  },
  critical_unresolved: 1,
  timestamp: new Date().toISOString(),
};

const SAMPLE_CRITICAL_EVENTS: SecurityEvent[] = [
  {
    id: 'evt-001',
    event_type: 'privilege_escalation',
    severity: 'critical',
    user_id: 'user-12345',
    resource: 'users/admin-role',
    description: 'Unauthorized privilege escalation attempt detected',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

const SAMPLE_DATA: SecurityMonitoringData = {
  summary: SAMPLE_SUMMARY,
  critical_events: SAMPLE_CRITICAL_EVENTS,
  recent_events_count: 42,
  current_status: 'degraded',
  last_updated: new Date().toISOString(),
};

export function useSecurityMonitoring(pollInterval = 10000) {
  const [data, setData] = useState<SecurityMonitoringData>(SAMPLE_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let pollTimer: NodeJS.Timeout | null = null;

    async function load() {
      try {
        const monitoringRes = await apiGet<SecurityMonitoringData>('/api/security/monitoring-dashboard').catch(() => null);

        if (!active) return;

        if (monitoringRes) {
          setData(monitoringRes);
        } else {
          setData(SAMPLE_DATA);
        }
        setError(null);
      } catch (err) {
        if (!active) return;
        console.error('Error loading security monitoring:', err);
        setError(err instanceof Error ? err.message : 'Failed to load security data');
        // Keep using sample data on error
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
