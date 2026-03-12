'use client';

import TopBar from '@/components/TopBar';
import { Zap, TrendingUp, Target, AlertTriangle, BarChart2, Brain, GitBranch } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart, Bar, Legend
} from 'recharts';

// Inflation prediction data
const inflationData = [
  { date: 'Oct', actual: 3.2, forecast: null, upper: null, lower: null },
  { date: 'Nov', actual: 3.4, forecast: null, upper: null, lower: null },
  { date: 'Dec', actual: 3.1, forecast: null, upper: null, lower: null },
  { date: 'Jan', actual: 3.6, forecast: null, upper: null, lower: null },
  { date: 'Feb', actual: 3.8, forecast: null, upper: null, lower: null },
  { date: 'Mar', actual: 3.9, forecast: 3.9, upper: 4.1, lower: 3.7 },
  { date: 'Apr', actual: null, forecast: 4.1, upper: 4.5, lower: 3.7 },
  { date: 'May', actual: null, forecast: 4.3, upper: 4.8, lower: 3.8 },
  { date: 'Jun', actual: null, forecast: 4.2, upper: 4.9, lower: 3.5 },
  { date: 'Jul', actual: null, forecast: 3.9, upper: 4.7, lower: 3.1 },
  { date: 'Aug', actual: null, forecast: 3.7, upper: 4.6, lower: 2.8 },
];

// Conflict risk data
const conflictData = [
  { region: 'MENA', current: 91, forecast30: 94, forecast90: 87 },
  { region: 'E. Europe', current: 88, forecast30: 91, forecast90: 79 },
  { region: 'S. Asia', current: 55, forecast30: 58, forecast90: 52 },
  { region: 'Sub-Saharan', current: 71, forecast30: 76, forecast90: 68 },
  { region: 'E. Asia', current: 67, forecast30: 72, forecast90: 61 },
  { region: 'LATAM', current: 47, forecast30: 44, forecast90: 41 },
];

// Trade dependency forecast
const tradeData = [
  { month: 'Q1 25', chips: 78, energy: 62, food: 45, pharma: 38 },
  { month: 'Q2 25', chips: 82, energy: 58, food: 48, pharma: 40 },
  { month: 'Q3 25', chips: 79, energy: 71, food: 52, pharma: 41 },
  { month: 'Q4 25', chips: 85, energy: 74, food: 55, pharma: 44 },
  { month: 'Q1 26', chips: 88, energy: 69, food: 61, pharma: 47 },
  { month: 'Q2 26F', chips: 91, energy: 72, food: 64, pharma: 49 },
  { month: 'Q3 26F', chips: 87, energy: 68, food: 59, pharma: 46 },
];

const PREDICTIONS = [
  { title: 'US Inflation Q2 2026', model: 'Prophet + XGBoost', value: '4.1–4.5%', confidence: 88, trend: 'rising', deadline: 'Apr–Jun 2026' },
  { title: 'MENA Conflict Escalation', model: 'PyG Graph Neural Net', value: '94% (30d)', confidence: 74, trend: 'critical', deadline: '30-day window' },
  { title: 'EUR/USD Exchange Rate', model: 'LSTM + ARIMA', value: '1.02–1.07', confidence: 82, trend: 'stable', deadline: 'Q2 2026' },
  { title: 'Global Food Price Index', model: 'Prophet Ensemble', value: '+12.4%', confidence: 91, trend: 'rising', deadline: 'Q3 2026' },
  { title: 'Social Unrest Probability — Jakarta', model: 'XGBoost + NLP', value: '67%', confidence: 71, trend: 'rising', deadline: '60-day window' },
  { title: 'China GDP Growth 2026', model: 'Multi-factor Regression', value: '4.1–4.6%', confidence: 79, trend: 'stable', deadline: 'EOY 2026' },
];

const customTooltipStyle = {
  backgroundColor: '#0d1e35',
  border: '1px solid #1e3a5f',
  borderRadius: '8px',
  padding: '10px 14px',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={customTooltipStyle}>
      <p className="text-xs font-bold mb-2" style={{ color: '#94a3b8' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: '#64748b' }}>{entry.name}:</span>
          <span className="font-mono font-bold" style={{ color: entry.color }}>{entry.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Predictions Engine" subtitle="PyTorch · XGBoost · Prophet · Graph Neural Networks (PyG)" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Banner */}
        <div className="px-5 py-3 rounded-xl flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Brain size={14} style={{ color: '#f59e0b' }} />
          <span className="text-xs" style={{ color: '#64748b' }}>
            <span style={{ color: '#f59e0b' }}>ML ENSEMBLE ACTIVE:</span>{' '}
            Running 7 concurrent forecasting models across 216 nations · Avg backtesting accuracy: 91.3% · Last full retrain: 6h ago
          </span>
        </div>

        {/* Prediction cards */}
        <div className="grid grid-cols-3 gap-4">
          {PREDICTIONS.map((p, i) => {
            const trendColor = p.trend === 'critical' ? '#ef4444' : p.trend === 'rising' ? '#f59e0b' : '#00d4ff';
            const confColor = p.confidence > 85 ? '#00ff88' : p.confidence > 70 ? '#f59e0b' : '#ef4444';
            return (
              <div key={i} className="glass-card rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(90deg, ${trendColor}60, transparent)` }} />
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: trendColor, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                    {p.trend === 'critical' ? '⚠ CRITICAL' : p.trend === 'rising' ? '↑ RISING' : '↔ STABLE'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', fontSize: '0.62rem' }}>{p.model}</span>
                </div>
                <h4 className="font-semibold text-sm mb-2" style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{p.title}</h4>
                <div className="text-xl font-bold font-mono mb-2" style={{ color: trendColor }}>{p.value}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>Window</div>
                    <div className="text-xs font-medium" style={{ color: '#64748b', fontSize: '0.68rem' }}>{p.deadline}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>Confidence</div>
                    <div className="text-sm font-bold font-mono" style={{ color: confColor }}>{p.confidence}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Inflation forecast chart */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>US CPI Inflation Forecast</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Prophet model · 95% confidence interval</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block" style={{ background: '#00d4ff' }} /><span className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>Actual</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 inline-block" style={{ background: '#f59e0b' }} /><span className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>Forecast</span></div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={inflationData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="conf-band" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[2.5, 5.5]} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="Mar" stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#conf-band)" name="Upper CI" />
                <Area type="monotone" dataKey="lower" stroke="none" fill="#020817" name="Lower CI" />
                <Line type="monotone" dataKey="actual" stroke="#00d4ff" strokeWidth={2} dot={{ fill: '#00d4ff', r: 3 }} name="Actual CPI" connectNulls={false} />
                <Line type="monotone" dataKey="forecast" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: '#f59e0b', r: 3 }} name="Forecast" connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Conflict risk forecast */}
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Conflict Risk Probability</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Graph Neural Network · PyG · 30 & 90-day windows</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={conflictData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="region" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                />
                <Bar dataKey="current" fill="#ef4444" opacity={0.8} radius={[0, 3, 3, 0]} name="Current" />
                <Bar dataKey="forecast30" fill="#f59e0b" opacity={0.6} radius={[0, 3, 3, 0]} name="30-day" />
                <Bar dataKey="forecast90" fill="#8b5cf6" opacity={0.5} radius={[0, 3, 3, 0]} name="90-day" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade dependency forecast */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Strategic Trade Dependency Index Forecast</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Supply chain risk model · XGBoost features · Quarterly forecast (F = projected)</p>
            </div>
            <div className="flex items-center gap-4">
              {[{ l: 'Semiconductors', c: '#00d4ff' }, { l: 'Energy', c: '#f59e0b' }, { l: 'Food', c: '#00ff88' }, { l: 'Pharma', c: '#8b5cf6' }].map(x => (
                <div key={x.l} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                  <span className="text-xs" style={{ color: '#64748b', fontSize: '0.68rem' }}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={tradeData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} />
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} domain={[30, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x="Q2 26F" stroke="#334155" strokeDasharray="4 2" label={{ value: 'Forecast', fill: '#334155', fontSize: 9 }} />
              <Line type="monotone" dataKey="chips" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} name="Semiconductors" />
              <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Energy" />
              <Line type="monotone" dataKey="food" stroke="#00ff88" strokeWidth={2} dot={{ r: 3 }} name="Food" />
              <Line type="monotone" dataKey="pharma" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Pharma" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Model performance metrics */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Model Performance Metrics</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Model</th>
                  <th className="text-left">Domain</th>
                  <th className="text-left">Algorithm</th>
                  <th className="text-left">MAE</th>
                  <th className="text-left">RMSE</th>
                  <th className="text-left">Accuracy (backtest)</th>
                  <th className="text-left">Last Retrain</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'CPI Forecast', domain: 'Economics', algo: 'Prophet + XGBoost', mae: '0.18', rmse: '0.24', acc: '91.3%', retrain: '6h ago', status: 'LIVE' },
                  { name: 'Conflict Risk', domain: 'Geopolitical', algo: 'PyG GNN', mae: '4.2', rmse: '6.1', acc: '87.8%', retrain: '12h ago', status: 'LIVE' },
                  { name: 'Currency Forecast', domain: 'Finance', algo: 'LSTM + ARIMA', mae: '0.008', rmse: '0.012', acc: '84.2%', retrain: '4h ago', status: 'LIVE' },
                  { name: 'Unrest Probability', domain: 'Social', algo: 'XGBoost + NLP', mae: '7.1', rmse: '9.4', acc: '78.9%', retrain: '24h ago', status: 'LIVE' },
                  { name: 'Food Price Index', domain: 'Agriculture', algo: 'Prophet Ensemble', mae: '1.4', rmse: '2.1', acc: '91.7%', retrain: '8h ago', status: 'LIVE' },
                ].map(m => (
                  <tr key={m.name}>
                    <td style={{ color: '#e2e8f0' }}>{m.name}</td>
                    <td style={{ color: '#64748b' }}>{m.domain}</td>
                    <td style={{ color: '#8b5cf6', fontFamily: 'monospace', fontSize: '0.75rem' }}>{m.algo}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{m.mae}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{m.rmse}</td>
                    <td>
                      <span className="font-mono font-bold" style={{ color: parseFloat(m.acc) > 88 ? '#00ff88' : '#f59e0b' }}>{m.acc}</span>
                    </td>
                    <td style={{ color: '#475569' }}>{m.retrain}</td>
                    <td><span className="status-online px-2 py-0.5 rounded text-xs">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
