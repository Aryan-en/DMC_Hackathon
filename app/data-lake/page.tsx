'use client';

import TopBar from '@/components/TopBar';
import { useDataLakeMetrics } from '@/app/hooks/useDataLakeMetrics';
import { RefreshCw, Database, TrendingUp, Zap, Eye } from 'lucide-react';
import { useState } from 'react';

function compact(n: number) {
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
  return `${n}`;
}

function getQualityColor(score: number) {
  if (score >= 95) return '#00ff88';
  if (score >= 90) return '#00d4ff';
  if (score >= 80) return '#f59e0b';
  return '#ef4444';
}

function getTierBadgeColor(tier: string) {
  switch (tier) {
    case 'gold':
      return 'rgba(245, 158, 11, 0.2)';
    case 'silver':
      return 'rgba(148, 163, 184, 0.2)';
    case 'bronze':
      return 'rgba(192, 132, 93, 0.2)';
    default:
      return 'rgba(100, 116, 139, 0.2)';
  }
}

export default function DataLakePage() {
  const { data, loading, error } = useDataLakeMetrics();
  const [activeTab, setActiveTab] = useState<'datasets' | 'quality' | 'lineage' | 'costs' | 'views'>('datasets');

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Lake" subtitle="MEA IndiAPI data integration with quality, lineage, and cost monitoring" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live data-lake metrics unavailable: {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Size</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-lavender)' }}>{data.summary.total_size_gb.toFixed(2)} <span style={{ fontSize: '0.6rem' }}>GB</span></div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Across all datasets</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Record Count</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-steel)' }}>{compact(data.summary.record_count)}</div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Total records indexed</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Datasets</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-emerald)' }}>{data.summary.datasets}</div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Active catalogs</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Total Cost (24h)</div>
            <div className="text-2xl font-bold" style={{ color: 'var(--accent-amber)' }}>{data.costs.total_cost_units.toFixed(2)}</div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Cost units tracked</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
          {['datasets', 'quality', 'lineage', 'costs', 'views'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className="px-4 py-3 text-xs font-medium transition-all"
              style={{
                color: activeTab === tab ? 'var(--accent-gold)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-gold)' : '2px solid transparent',
              }}
            >
              {tab === 'datasets' && 'Datasets'}
              {tab === 'quality' && 'Quality'}
              {tab === 'lineage' && 'Lineage'}
              {tab === 'costs' && 'Costs'}
              {tab === 'views' && 'Views'}
            </button>
          ))}
        </div>

        {/* Datasets Tab */}
        {activeTab === 'datasets' && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Dataset Catalog (MEA + IndiAPI)</h3>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Dataset</th>
                    <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Format</th>
                    <th className="text-right py-2" style={{ color: 'var(--text-muted)' }}>Records</th>
                    <th className="text-right py-2" style={{ color: 'var(--text-muted)' }}>Size (GB)</th>
                    <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {data.datasets.map((d) => (
                    <tr key={d.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)' }}>
                        {d.name === 'MEA Bilateral Briefs' ? (
                          <a href="https://www.mea.gov.in/bilateral-documents.htm" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            {d.name}
                          </a>
                        ) : d.name === 'IndiAPI National Metrics' ? (
                          <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            {d.name}
                          </a>
                        ) : (
                          d.name
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{d.format}</td>
                      <td className="text-right" style={{ color: 'var(--accent-steel)' }}>{compact(d.records)}</td>
                      <td className="text-right" style={{ color: 'var(--accent-amber)' }}>{d.size_gb.toFixed(3)}</td>
                      <td>
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase" style={{ background: getTierBadgeColor(d.tier), color: 'var(--text-secondary)' }}>
                          {d.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && data.datasets.length === 0 && (
              <p className="text-xs mt-3" style={{ color: '#64748b' }}>No datasets available.</p>
            )}
          </div>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Data Quality Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="text-left py-2" style={{ color: 'var(--text-muted)' }}>Dataset</th>
                    <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>Overall Score</th>
                    <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>Completeness</th>
                    <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.quality.map((q) => (
                    <tr key={q.dataset} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="py-2" style={{ color: 'var(--text-primary)' }}>{q.dataset}</td>
                      <td className="text-center">
                        <span style={{ color: getQualityColor(q.overall_score), fontWeight: 'bold' }}>{q.overall_score}%</span>
                      </td>
                      <td className="text-center" style={{ color: 'var(--text-secondary)' }}>{q.completeness}%</td>
                      <td className="text-center" style={{ color: 'var(--text-secondary)' }}>{q.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lineage Tab */}
        {activeTab === 'lineage' && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Data Lineage Tracking</h3>
            <div className="space-y-3">
              {data.lineage.map((l) => (
                <div key={l.dataset} className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{l.dataset}</span>
                    <span className="px-2 py-1 text-[10px] rounded font-bold uppercase" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-lavender)' }}>{l.stages} stages</span>
                  </div>
                  <div className="text-[10px] font-mono flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <span>{l.source}</span>
                    <span>→</span>
                    <span>{l.destination}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === 'costs' && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Query Cost Monitoring</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(var(--accent-gold), 0.1)', border: '1px solid var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>Total Cost (24h)</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>{data.costs.total_cost_units.toFixed(2)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--accent-gold)' }}>Cost units</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(var(--accent-steel), 0.1)', border: '1px solid var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--accent-steel)', marginBottom: '0.5rem' }}>Avg Cost / Query</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-steel)' }}>{data.costs.average_cost_per_query.toFixed(2)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--accent-steel)' }}>Units per query</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(var(--accent-emerald), 0.1)', border: '1px solid var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>Rows Scanned</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-emerald)' }}>{compact(data.costs.total_rows_scanned)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--accent-emerald)' }}>Total across period</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(var(--accent-lavender), 0.1)', border: '1px solid var(--border-color)' }}>
                <div className="text-xs" style={{ color: 'var(--accent-lavender)', marginBottom: '0.5rem' }}>Queries Tracked</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-lavender)' }}>{data.costs.queries_tracked}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--accent-lavender)' }}>Monitored queries</div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
              <div className="text-xs font-mono space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Period:</span> {data.costs.period_days} day(s)</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Max Rows Scanned:</span> {compact(data.costs.max_rows_scanned)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Materialized Views Tab */}
        {activeTab === 'views' && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Materialized Views</h3>
            <div className="space-y-3">
              {data.materialized_views.map((view) => (
                <div key={view.name} className="p-4 rounded-lg bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div style={{ color: 'var(--accent-gold)', fontWeight: 'bold', marginBottom: '0.25rem' }}>{view.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Based on: {view.base_tables.join(', ')}</div>
                    </div>
                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--accent-emerald)' }}>
                      {view.refresh_frequency}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                    <div style={{ color: 'var(--text-dim)' }}>Rows: <span style={{ color: 'var(--accent-steel)' }}>{compact(view.rows)}</span></div>
                    <div style={{ color: 'var(--text-dim)' }}>Size: <span style={{ color: 'var(--accent-amber)' }}>{view.size_gb.toFixed(3)} GB</span></div>
                    <div style={{ color: 'var(--text-dim)' }}>Refreshed: <span style={{ color: 'var(--accent-gold)' }}>{new Date(view.last_refresh).toLocaleDateString()}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
