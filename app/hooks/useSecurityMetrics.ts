'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL, apiGet } from '@/app/lib/api';

type AuditLog = {
  timestamp: string;
  user_id: string;
  action: string;
  resource: string;
  classification: string;
  status: string;
};

type ViolationTrend = {
  day: string;
  violation_count: number;
  warning_count: number;
};

type AccessCheck = {
  allowed: boolean;
  reason: string;
};

type SecurityMetrics = {
  logs: AuditLog[];
  trend: ViolationTrend[];
  accessCheck: AccessCheck;
};

// Fallback sample data
const SAMPLE_LOGS: AuditLog[] = [
  { timestamp: '2026-03-22T11:45:00Z', user_id: 'admin-001', action: 'LOGIN', resource: 'auth/session', classification: 'UNCLASS', status: 'ALLOW' },
  { timestamp: '2026-03-22T11:30:00Z', user_id: 'analyst-042', action: 'QUERY', resource: 'knowledge-graph/nodes', classification: 'FOUO', status: 'ALLOW' },
  { timestamp: '2026-03-22T11:15:00Z', user_id: 'analyst-018', action: 'EXPORT', resource: 'geospatial/hotspots', classification: 'SECRET', status: 'DENY' },
  { timestamp: '2026-03-22T10:55:00Z', user_id: 'admin-001', action: 'UPDATE', resource: 'users/roles', classification: 'FOUO', status: 'ALLOW' },
  { timestamp: '2026-03-22T10:30:00Z', user_id: 'analyst-007', action: 'QUERY', resource: 'intelligence/briefs', classification: 'SECRET', status: 'ALLOW' },
  { timestamp: '2026-03-22T10:12:00Z', user_id: 'viewer-105', action: 'ACCESS', resource: 'predictions/forecast', classification: 'FOUO', status: 'ALLOW' },
  { timestamp: '2026-03-22T09:45:00Z', user_id: 'analyst-042', action: 'EXPORT', resource: 'data-lake/economic', classification: 'SECRET', status: 'DENY' },
  { timestamp: '2026-03-22T09:20:00Z', user_id: 'admin-002', action: 'CONFIG_CHANGE', resource: 'security/policy', classification: 'TS', status: 'ALLOW' },
];

const SAMPLE_TREND: ViolationTrend[] = [
  { day: 'Mon', violation_count: 3, warning_count: 8 },
  { day: 'Tue', violation_count: 5, warning_count: 12 },
  { day: 'Wed', violation_count: 2, warning_count: 6 },
  { day: 'Thu', violation_count: 7, warning_count: 15 },
  { day: 'Fri', violation_count: 4, warning_count: 9 },
  { day: 'Sat', violation_count: 1, warning_count: 3 },
  { day: 'Sun', violation_count: 0, warning_count: 2 },
];

const SAMPLE_ACCESS_CHECK: AccessCheck = { allowed: true, reason: 'clearance_sufficient' };

export function useSecurityMetrics() {
  const [data, setData] = useState<SecurityMetrics>({
    logs: SAMPLE_LOGS,
    trend: SAMPLE_TREND,
    accessCheck: SAMPLE_ACCESS_CHECK,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [auditRes, trendRes, accessRes] = await Promise.all([
          apiGet<{ logs: AuditLog[]; total_count: number }>('/api/security/audit-log?limit=50'),
          apiGet<{ trend: ViolationTrend[] }>('/api/security/violations-trend'),
          fetch(`${API_BASE_URL}/api/security/access-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clearance_level: 'SECRET', classification: 'FOUO' }),
          }).then(async (res) => {
            const payload = await res.json();
            if (!res.ok || payload?.status === 'error') {
              throw new Error(payload?.error?.message || 'Access check failed');
            }
            return payload.data as AccessCheck;
          }),
        ]);

        if (!active) return;
        setData({ logs: auditRes.logs, trend: trendRes.trend, accessCheck: accessRes });
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({ logs: SAMPLE_LOGS, trend: SAMPLE_TREND, accessCheck: SAMPLE_ACCESS_CHECK });
        setError(err instanceof Error ? err.message : 'Failed to load security metrics - using sample data');
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
