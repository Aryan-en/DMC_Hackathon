'use client';

import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import { Shield, Lock, AlertOctagon, Activity, Fingerprint } from 'lucide-react';
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
          <StatCard
            label="Audit Entries"
            value={data.logs.length.toString()}
            subValue="Telemetry events"
            icon={Shield}
            bgColor="#fef08a"
            textColor="#854d0e"
            loading={loading}
          />
          <StatCard
            label="Login Events"
            value={loginEvents.length.toString()}
            subValue="User authorizations"
            icon={Fingerprint}
            bgColor="#ddd6fe"
            textColor="#4c1d95"
            loading={loading}
          />
          <StatCard
            label="Denied Actions"
            value={denies.toString()}
            subValue="Security violations"
            icon={AlertOctagon}
            bgColor="#fecaca"
            textColor="#991b1b"
            loading={loading}
          />
          <StatCard
            label="Trend Points"
            value={data.trend.length.toString()}
            subValue="Anomaly tracking"
            icon={Activity}
            bgColor="#fde68a"
            textColor="#92400e"
            loading={loading}
          />
          <StatCard
            label="Access Check"
            value={data.accessCheck.allowed ? 'ALLOW' : 'DENY'}
            subValue="System validator"
            icon={Lock}
            bgColor={data.accessCheck.allowed ? '#a7f3d0' : '#fecaca'}
            textColor={data.accessCheck.allowed ? '#064e3b' : '#991b1b'}
            loading={loading}
          />
        </div>

        <div className="tactical-card rounded-xl p-5">
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Audit Log</h3>
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

        <div className="tactical-card rounded-xl p-5">
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Recent Authentication Activity</h3>
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

        <div className="tactical-card rounded-xl p-5">
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>Violations Trend</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {data.trend.map((t) => (
              <div 
                key={t.day} 
                className="p-3 rounded-lg border flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px] hover:shadow-lg" 
                style={{ 
                  background: 'var(--nested-surface)', 
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--tactical-shadow)' 
                }}
              >
                <div className="text-[10px] uppercase font-black tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>{t.day}</div>
                <div className="text-xl font-black" style={{ color: 'var(--accent-crimson)' }}>{t.violation_count}</div>
                <div className="text-[9px] font-bold uppercase" style={{ color: 'var(--accent-gold)' }}>{t.warning_count} WARNS</div>
              </div>
            ))}
          </div>
          {!loading && data.trend.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live violation trend returned by API.</p>}
        </div>
      </main>
    </div>
  );
}
