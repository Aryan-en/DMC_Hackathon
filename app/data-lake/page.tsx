'use client';

import TopBar from '@/components/TopBar';
import { useDataLakeMetrics } from '@/app/hooks/useDataLakeMetrics';

function compact(n: number) {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  return `${n}`;
}

export default function DataLakePage() {
  const { data, loading, error } = useDataLakeMetrics();

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Lake" subtitle="Live storage catalog from data-lake endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live data-lake metrics unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Total Size (GB)</div><div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{data.summary.total_size_gb.toFixed(2)}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Record Count</div><div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>{compact(data.summary.record_count)}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Datasets</div><div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{data.summary.datasets}</div></div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Dataset Catalog</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Format</th>
                  <th className="text-left">Records</th>
                  <th className="text-left">Size (GB)</th>
                  <th className="text-left">Tier</th>
                </tr>
              </thead>
              <tbody>
                {data.datasets.map((d) => (
                  <tr key={d.name}>
                    <td style={{ color: '#e2e8f0' }}>{d.name}</td>
                    <td style={{ color: '#94a3b8' }}>{d.format}</td>
                    <td style={{ color: '#00d4ff' }}>{compact(d.records)}</td>
                    <td style={{ color: '#f59e0b' }}>{d.size_gb.toFixed(2)}</td>
                    <td style={{ color: '#00ff88' }}>{d.tier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.datasets.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live datasets returned by API.</p>}
        </div>
      </main>
    </div>
  );
}
