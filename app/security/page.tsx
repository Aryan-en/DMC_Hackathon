'use client';

import TopBar from '@/components/TopBar';
import { useSecurityMetrics } from '@/app/hooks/useSecurityMetrics';

export default function SecurityPage() {
  const { data, loading, error } = useSecurityMetrics();
  const denies = data.logs.filter((l) => l.status === 'DENY').length;

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Security & Governance" subtitle="Live compliance and audit telemetry" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live security data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Audit Entries</div><div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>{data.logs.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Denied Actions</div><div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{denies}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Trend Points</div><div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{data.trend.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Access Check</div><div className="text-2xl font-bold" style={{ color: data.accessCheck.allowed ? '#00ff88' : '#ef4444' }}>{data.accessCheck.allowed ? 'ALLOW' : 'DENY'}</div></div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Timestamp</th>
                  <th className="text-left">User</th>
                  <th className="text-left">Action</th>
                  <th className="text-left">Resource</th>
                  <th className="text-left">Classification</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((l) => (
                  <tr key={`${l.timestamp}-${l.user_id}-${l.action}`}>
                    <td style={{ color: '#64748b' }}>{l.timestamp}</td>
                    <td style={{ color: '#e2e8f0' }}>{l.user_id}</td>
                    <td style={{ color: '#00d4ff' }}>{l.action}</td>
                    <td style={{ color: '#94a3b8' }}>{l.resource}</td>
                    <td style={{ color: '#f59e0b' }}>{l.classification}</td>
                    <td style={{ color: l.status === 'ALLOW' ? '#00ff88' : '#ef4444' }}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.logs.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live audit logs returned by API.</p>}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Violations Trend</h3>
          <div className="grid grid-cols-7 gap-2">
            {data.trend.map((t) => (
              <div key={t.day} className="p-2 rounded" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>{t.day}</div>
                <div className="text-sm font-bold" style={{ color: '#ef4444' }}>{t.violation_count}</div>
                <div className="text-xs" style={{ color: '#f59e0b' }}>warn {t.warning_count}</div>
              </div>
            ))}
          </div>
          {!loading && data.trend.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live violation trend returned by API.</p>}
        </div>
      </main>
    </div>
  );
}
