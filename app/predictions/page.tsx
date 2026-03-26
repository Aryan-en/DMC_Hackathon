'use client';

import TopBar from '@/components/TopBar';
import { usePredictionsMetrics } from '@/app/hooks/usePredictionsMetrics';
import { useServingHealthMetrics } from '@/app/hooks/useServingHealthMetrics';
import ServingHealthChart from '@/components/app/ServingHealthChart';
import IngestionStatus from '@/components/app/IngestionStatus';

export default function PredictionsPage() {
  const { data, loading, error } = usePredictionsMetrics();
  const { history, snapshot, loading: historyLoading, error: historyError } = useServingHealthMetrics();
  
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const accentColor = 'var(--metric-accent)';
  const secondaryAccent = isDark ? 'var(--metric-1-text)' : 'var(--accent-gold)';

  const latest = data.forecast.length > 0 ? data.forecast[data.forecast.length - 1] : { probability: 0, date: '', trend: 'stable' };
  const servingColor = data.servingHealth.status === 'healthy' ? 'var(--accent-emerald)' : data.servingHealth.status === 'degraded' ? 'var(--accent-amber)' : 'var(--accent-crimson)';

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <TopBar title="Predictions Engine" subtitle="Live model outputs from prediction endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live prediction data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="tactical-card rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-60" style={{ color: 'var(--text-secondary)' }}>Forecast Horizon</div>
            <div className="text-2xl font-black mt-1" style={{ color: 'var(--metric-2-text)' }}>{data.forecast.length} Days</div>
          </div>
          <div className="tactical-card rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-60" style={{ color: 'var(--text-secondary)' }}>Latest Risk</div>
            <div className="text-2xl font-black mt-1" style={{ color: 'var(--accent-amber)' }}>{latest ? `${(latest.probability * 100).toFixed(1)}%` : '0%'}</div>
          </div>
          <div className="tactical-card rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-60" style={{ color: 'var(--text-secondary)' }}>Model Precision</div>
            <div className="text-2xl font-black mt-1" style={{ color: 'var(--accent-emerald)' }}>{data.dashboardOverview.model_accuracy.toFixed(2)}%</div>
          </div>
          <div className="tactical-card rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wider font-bold opacity-60" style={{ color: 'var(--text-secondary)' }}>Serving Status</div>
            <div className="text-2xl font-black mt-1" style={{ color: servingColor }}>{data.servingHealth.status.toUpperCase()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="tactical-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: accentColor, opacity: 0.5 }}></div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 opacity-70" style={{ color: 'var(--text-primary)' }}>PyG GNN // Conflict Model</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                ['Version', data.pygModelStatus.model_version, 'var(--metric-2-text)'],
                ['Precision', data.pygModelStatus.precision.toFixed(3), 'var(--accent-emerald)'],
                ['Recall', data.pygModelStatus.recall.toFixed(3), 'var(--accent-amber)'],
                ['Latecy', `${data.pygModelStatus.avg_inference_ms.toFixed(1)}ms`, 'var(--accent-crimson)']
              ].map(([l, v, c]) => (
                <div key={String(l)} className="p-3 rounded transition-colors" style={{ background: 'var(--nested-surface)' }}>
                  <div className="text-[9px] uppercase opacity-60 mb-1" style={{ color: 'var(--text-secondary)' }}>{l}</div>
                  <div className="text-base font-black" style={{ color: String(c) }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="tactical-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ background: isDark ? 'var(--accent-gold)' : 'var(--accent-lavender)', opacity: 0.5 }}></div>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 opacity-70" style={{ color: 'var(--text-primary)' }}>A/B Framework // Variant Analysis</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Variant A', data.abSummary.variant_a.precision.toFixed(3), 'var(--metric-2-text)'],
                ['Variant B', data.abSummary.variant_b.precision.toFixed(3), 'var(--accent-lavender)'],
                ['Winner', data.abSummary.winner, 'var(--accent-emerald)']
              ].map(([l, v, c]) => (
                <div key={String(l)} className="p-3 rounded transition-colors" style={{ background: 'var(--nested-surface)' }}>
                  <div className="text-[9px] uppercase opacity-60 mb-1" style={{ color: 'var(--text-secondary)' }}>{l}</div>
                  <div className="text-base font-black" style={{ color: String(c) }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Training Status</h3>
            <div className="space-y-2 text-xs">
              <div style={{ color: 'var(--text-muted)' }}>State: <span style={{ color: 'var(--metric-2-text)' }}>{data.trainingStatus.status.toUpperCase()}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Progress: <span style={{ color: 'var(--accent-emerald)' }}>{data.trainingStatus.progress_pct.toFixed(1)}%</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Epochs: <span style={{ color: 'var(--accent-amber)' }}>{data.trainingStatus.epochs_completed}/{data.trainingStatus.epochs_target}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Dataset Size: <span style={{ color: 'var(--metric-2-text)' }} suppressHydrationWarning>{data.trainingStatus.dataset_size.toLocaleString('en-US')}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Latest Loss: <span style={{ color: 'var(--accent-crimson)' }}>{data.trainingStatus.latest_loss.toFixed(4)}</span></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Serving Health</h3>
            <div className="space-y-2 text-xs">
              <div style={{ color: 'var(--text-muted)' }}>Requests/min: <span style={{ color: 'var(--metric-2-text)' }}>{data.servingHealth.requests_per_min.toFixed(2)}</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Latency: <span style={{ color: 'var(--accent-amber)' }}>{data.servingHealth.latency_ms.toFixed(2)} ms</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Error Rate: <span style={{ color: 'var(--accent-crimson)' }}>{data.servingHealth.error_rate_pct.toFixed(3)}%</span></div>
              <div style={{ color: 'var(--text-muted)' }}>Uptime: <span style={{ color: 'var(--accent-emerald)' }}>{data.servingHealth.uptime_pct.toFixed(3)}%</span></div>
            </div>
          </div>

          <div className="md:col-span-1">
            <IngestionStatus />
          </div>
        </div>

        <ServingHealthChart cpuModel={history.cpu_model} data={history.data} snapshot={snapshot} loading={historyLoading} error={historyError} />

        <div className="tactical-card rounded-xl p-5">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 opacity-70" style={{ color: 'var(--text-primary)' }}>Live Conflict Forecast Stream // {data.region}</h3>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SITREP DATE</th>
                  <th>PROBABILITY</th>
                  <th>CONFIDENCE</th>
                  <th>TREND</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f, i) => (
                  <tr key={`${f.date}-${i}`}>
                    <td className="font-mono">{f.date}</td>
                    <td className="font-black" style={{ color: 'var(--metric-2-text)' }}>{(f.probability * 100).toFixed(2)}%</td>
                    <td style={{ color: 'var(--accent-emerald)' }}>{(f.confidence * 100).toFixed(2)}%</td>
                    <td style={{ color: f.trend === 'up' ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
                      {f.trend.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="tactical-card rounded-xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 opacity-70" style={{ color: 'var(--text-primary)' }}>Model Performance Analytics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ['Accuracy', data.modelPerformance.accuracy, 'var(--accent-emerald)'],
                ['Precision', data.modelPerformance.precision, 'var(--accent-amber)'],
                ['Recall', data.modelPerformance.recall, 'var(--accent-crimson)'],
                ['F1 Score', data.modelPerformance.f1_score, 'var(--accent-lavender)'],
                ['AUC ROC', data.modelPerformance.auc_roc, 'var(--metric-2-text)'],
              ].map(([label, value, c]) => (
                <div key={String(label)} className="p-3 rounded transition-colors" style={{ background: 'var(--nested-surface)' }}>
                  <div className="text-xs opacity-60" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                  <div className="text-lg font-black" style={{ color: String(c) }}>{Number(value).toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="tactical-card rounded-xl p-6">
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black mb-4 opacity-70" style={{ color: 'var(--text-primary)' }}>Model Drift Sentinel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded transition-colors" style={{ background: 'var(--nested-surface)' }}>
                <div className="text-[9px] uppercase opacity-60 mb-1" style={{ color: 'var(--text-secondary)' }}>Status</div>
                <div className="text-base font-black" style={{ color: data.modelDrift.drift_detected ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
                  {data.modelDrift.drift_detected ? 'DRIFT' : 'NOMINAL'}
                </div>
              </div>
              <div className="p-3 rounded bg-white/[0.03] transition-colors hover:bg-white/[0.06]">
                <div className="text-[9px] uppercase opacity-50 mb-1" style={{ color: 'var(--text-secondary)' }}>Score</div>
                <div className="text-base font-black" style={{ color: 'var(--accent-amber)' }}>{data.modelDrift.drift_score.toFixed(4)}</div>
              </div>
              <div className="p-3 rounded bg-white/[0.03] transition-colors hover:bg-white/[0.06]">
                <div className="text-[9px] uppercase opacity-50 mb-1" style={{ color: 'var(--text-secondary)' }}>Alert</div>
                <div className="text-base font-black" style={{ color: 'var(--metric-2-text)' }}>{data.modelDrift.alert_level.toUpperCase()}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
