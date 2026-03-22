'use client';

import TopBar from '@/components/TopBar';
import { usePredictionsMetrics } from '@/app/hooks/usePredictionsMetrics';
import { useServingHealthMetrics } from '@/app/hooks/useServingHealthMetrics';
import ServingHealthChart from '@/app/components/ServingHealthChart';

export default function PredictionsPage() {
  const { data, loading, error } = usePredictionsMetrics();
  const { history, loading: historyLoading, error: historyError } = useServingHealthMetrics();
  const latest = data.forecast.length > 0 ? data.forecast[data.forecast.length - 1] : { probability: 0, date: '', trend: 'stable' };
  const servingColor = data.servingHealth.status === 'healthy' ? '#00ff88' : data.servingHealth.status === 'degraded' ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Predictions Engine" subtitle="Live model outputs from prediction endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live prediction data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Forecast Horizon</div><div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>{data.forecast.length} days</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Latest Probability</div><div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{latest ? `${(latest.probability * 100).toFixed(1)}%` : '0%'}</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Model Accuracy</div><div className="text-2xl font-bold" style={{ color: '#00ff88' }}>{data.dashboardOverview.model_accuracy.toFixed(2)}%</div></div>
          <div className="glass-card rounded-xl p-4"><div className="text-xs" style={{ color: '#94a3b8' }}>Serving Health</div><div className="text-2xl font-bold" style={{ color: servingColor }}>{data.servingHealth.status.toUpperCase()}</div></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>PyG Conflict Model</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Version</div>
                <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>{data.pygModelStatus.model_version}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Precision</div>
                <div className="text-lg font-bold" style={{ color: '#00ff88' }}>{data.pygModelStatus.precision.toFixed(3)}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Recall</div>
                <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{data.pygModelStatus.recall.toFixed(3)}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Inference</div>
                <div className="text-lg font-bold" style={{ color: '#ef4444' }}>{data.pygModelStatus.avg_inference_ms.toFixed(2)} ms</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>A/B Testing Framework</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Variant A Precision</div>
                <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>{data.abSummary.variant_a.precision.toFixed(3)}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Variant B Precision</div>
                <div className="text-lg font-bold" style={{ color: '#8b5cf6' }}>{data.abSummary.variant_b.precision.toFixed(3)}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Current Winner</div>
                <div className="text-lg font-bold" style={{ color: '#00ff88' }}>{data.abSummary.winner}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Training Status</h3>
            <div className="space-y-2 text-xs">
              <div style={{ color: '#94a3b8' }}>State: <span style={{ color: '#00d4ff' }}>{data.trainingStatus.status.toUpperCase()}</span></div>
              <div style={{ color: '#94a3b8' }}>Progress: <span style={{ color: '#00ff88' }}>{data.trainingStatus.progress_pct.toFixed(1)}%</span></div>
              <div style={{ color: '#94a3b8' }}>Epochs: <span style={{ color: '#f59e0b' }}>{data.trainingStatus.epochs_completed}/{data.trainingStatus.epochs_target}</span></div>
              <div style={{ color: '#94a3b8' }}>Dataset Size: <span style={{ color: '#00d4ff' }}>{data.trainingStatus.dataset_size.toLocaleString()}</span></div>
              <div style={{ color: '#94a3b8' }}>Latest Loss: <span style={{ color: '#ef4444' }}>{data.trainingStatus.latest_loss.toFixed(4)}</span></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Serving Health</h3>
            <div className="space-y-2 text-xs">
              <div style={{ color: '#94a3b8' }}>Requests/min: <span style={{ color: '#00d4ff' }}>{data.servingHealth.requests_per_min.toFixed(2)}</span></div>
              <div style={{ color: '#94a3b8' }}>Latency: <span style={{ color: '#f59e0b' }}>{data.servingHealth.latency_ms.toFixed(2)} ms</span></div>
              <div style={{ color: '#94a3b8' }}>Error Rate: <span style={{ color: '#ef4444' }}>{data.servingHealth.error_rate_pct.toFixed(3)}%</span></div>
              <div style={{ color: '#94a3b8' }}>Uptime: <span style={{ color: '#00ff88' }}>{data.servingHealth.uptime_pct.toFixed(3)}%</span></div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Dashboard Overview</h3>
            <div className="space-y-2 text-xs">
              <div style={{ color: '#94a3b8' }}>Latest Risk: <span style={{ color: '#ef4444' }}>{(data.dashboardOverview.latest_risk_probability * 100).toFixed(2)}%</span></div>
              <div style={{ color: '#94a3b8' }}>7d Avg Risk: <span style={{ color: '#f59e0b' }}>{(data.dashboardOverview.avg_7d_risk_probability * 100).toFixed(2)}%</span></div>
              <div style={{ color: '#94a3b8' }}>F1 Score: <span style={{ color: '#00d4ff' }}>{data.dashboardOverview.model_f1.toFixed(2)}</span></div>
              <div style={{ color: '#94a3b8' }}>AUC ROC: <span style={{ color: '#00ff88' }}>{data.dashboardOverview.model_auc_roc.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        <ServingHealthChart data={history.data} loading={historyLoading} error={historyError} />

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Conflict Risk Forecast ({data.region})</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Probability</th>
                  <th className="text-left">Confidence</th>
                  <th className="text-left">Trend</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f) => (
                  <tr key={f.date}>
                    <td style={{ color: '#e2e8f0' }}>{f.date}</td>
                    <td style={{ color: '#00d4ff' }}>{(f.probability * 100).toFixed(2)}%</td>
                    <td style={{ color: '#00ff88' }}>{(f.confidence * 100).toFixed(2)}%</td>
                    <td style={{ color: '#f59e0b' }}>{f.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.forecast.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live forecast points returned by API.</p>}
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Model Performance</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              ['Accuracy', data.modelPerformance.accuracy],
              ['Precision', data.modelPerformance.precision],
              ['Recall', data.modelPerformance.recall],
              ['F1 Score', data.modelPerformance.f1_score],
              ['AUC ROC', data.modelPerformance.auc_roc],
            ].map(([label, value]) => (
              <div key={String(label)} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="text-xs" style={{ color: '#94a3b8' }}>{label}</div>
                <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>{Number(value).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Model Drift Monitoring</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Drift Detected</div>
              <div className="text-lg font-bold" style={{ color: data.modelDrift.drift_detected ? '#ef4444' : '#00ff88' }}>
                {data.modelDrift.drift_detected ? 'YES' : 'NO'}
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Drift Score</div>
              <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{data.modelDrift.drift_score.toFixed(4)}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
              <div className="text-xs" style={{ color: '#94a3b8' }}>Alert Level</div>
              <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>{data.modelDrift.alert_level.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
