'use client';

import TopBar from '@/components/TopBar';
import { useStreamsMetrics } from '@/app/hooks/useStreamsMetrics';

export default function DataStreamsPage() {
  const { data, loading, error } = useStreamsMetrics();
  const totalLag = data.topics.reduce((acc, t) => acc + (t.lag || 0), 0);

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Streams" subtitle="Live Kafka/Flink status from stream endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live stream data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Topics</div><div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>{data.topics.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Pipelines</div><div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{data.pipelines.length}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Aggregate Lag</div><div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{totalLag}</div></div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Topic Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Topic</th>
                  <th className="text-left">Partitions</th>
                  <th className="text-left">Lag</th>
                  <th className="text-left">Throughput</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.topics.map((t) => (
                  <tr key={t.topic}>
                    <td style={{ color: '#e2e8f0' }}>{t.topic}</td>
                    <td style={{ color: '#94a3b8' }}>{t.partitions}</td>
                    <td style={{ color: '#f59e0b' }}>{t.lag}</td>
                    <td style={{ color: '#00d4ff' }}>{t.throughput}</td>
                    <td style={{ color: '#00ff88' }}>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.topics.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live topics returned by API.</p>}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Pipeline Health</h3>
          <div className="space-y-2">
            {data.pipelines.map((p) => (
              <div key={p.name} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="flex items-center justify-between">
                  <span style={{ color: '#e2e8f0', fontSize: '0.75rem' }}>{p.name}</span>
                  <span style={{ color: '#00ff88', fontSize: '0.72rem' }}>{p.status}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: '#64748b' }}>{p.throughput} · latency {p.latency}</div>
              </div>
            ))}
          </div>
          {!loading && data.pipelines.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live pipelines returned by API.</p>}
        </div>
      </main>
    </div>
  );
}
