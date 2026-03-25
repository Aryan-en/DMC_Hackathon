'use client';

import TopBar from '@/components/TopBar';
import { useSecurityMetrics } from '@/app/hooks/useSecurityMetrics';

export default function SecurityPage() {
  const { data, loading, error } = useSecurityMetrics();
  const denies = data.logs.filter((l) => l.status === 'DENY').length;
  const loginEvents = data.logs.filter((l) => l.action === 'LOGIN');

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Security & Governance" subtitle="Live compliance and audit telemetry" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(var(--accent-crimson), 0.08)', border: '1px solid var(--border-color)', color: 'var(--accent-crimson)', fontSize: '0.72rem' }}>
            Live security data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Audit Entries</div><div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>{data.logs.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Login Events</div><div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>{loginEvents.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Denied Actions</div><div className="text-2xl font-bold" style={{ color: 'var(--accent-crimson)' }}>{denies}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Trend Points</div><div className="text-2xl font-bold" style={{ color: 'var(--accent-amber)' }}>{data.trend.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Access Check</div><div className="text-2xl font-bold" style={{ color: data.accessCheck.allowed ? 'var(--accent-emerald)' : 'var(--accent-crimson)' }}>{data.accessCheck.allowed ? 'ALLOW' : 'DENY'}</div></div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Audit Log</h3>
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
                    <td style={{ color: 'var(--text-muted)' }}>{l.timestamp}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{l.user_id}</td>
                    <td style={{ color: 'var(--accent-gold)' }}>{l.action}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.resource}</td>
                    <td style={{ color: 'var(--accent-amber)' }}>{l.classification}</td>
                    <td style={{ color: l.status === 'ALLOW' ? 'var(--accent-emerald)' : 'var(--accent-crimson)' }}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.logs.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live audit logs returned by API.</p>}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Recent Authentication Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Timestamp</th>
                  <th className="text-left">User</th>
                  <th className="text-left">Action</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginEvents.slice(0, 12).map((l) => (
                  <tr key={`${l.timestamp}-${l.user_id}-${l.status}`}>
                    <td style={{ color: 'var(--text-muted)' }}>{l.timestamp}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{l.user_id}</td>
                    <td style={{ color: 'var(--accent-gold)' }}>{l.action}</td>
                    <td style={{ color: l.status === 'ALLOW' ? 'var(--accent-emerald)' : 'var(--accent-crimson)' }}>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && loginEvents.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No login activity captured yet.</p>}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Violations Trend</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.trend.map((t) => (
              <div key={t.day} className="p-2 rounded bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>{t.day}</div>
                <div className="text-sm font-bold" style={{ color: 'var(--accent-crimson)' }}>{t.violation_count}</div>
                <div className="text-[9px] font-medium" style={{ color: 'var(--accent-gold)' }}>warn {t.warning_count}</div>
              </div>
            ))}
          </div>
          {!loading && data.trend.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live violation trend returned by API.</p>}
        </div>
      </main>
    </div>
  );
}
