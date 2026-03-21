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

export function useSecurityMetrics() {
  const [data, setData] = useState<SecurityMetrics>({
    logs: [],
    trend: [],
    accessCheck: { allowed: false, reason: 'unknown' },
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
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load security metrics');
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
