'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ServingHealthDataPoint {
  timestamp: string;
  latency_ms: number;
  requests_per_min: number;
  error_rate_pct: number;
  uptime_pct: number;
}

interface ServingHealthChartProps {
  data: ServingHealthDataPoint[];
  loading: boolean;
  error?: string | null;
}

export default function ServingHealthChart({ data, loading, error }: ServingHealthChartProps) {
  if (error) {
    return (
      <div
        className="glass-card rounded-xl p-5 h-96 flex items-center justify-center"
        style={{
          background: 'rgba(2,8,23,0.8)',
          border: '1px solid rgba(30,58,95,0.3)',
        }}
      >
        <div style={{ color: '#ef4444' }}>Error: {error}</div>
      </div>
    );
  }

  if (loading || data.length === 0) {
    return (
      <div
        className="glass-card rounded-xl p-5 h-96 flex items-center justify-center"
        style={{
          background: 'rgba(2,8,23,0.8)',
          border: '1px solid rgba(30,58,95,0.3)',
        }}
      >
        <div style={{ color: '#94a3b8' }}>Loading metrics data... ({data.length} points)</div>
      </div>
    );
  }

  return (
    <div
      className="glass-card rounded-xl p-5"
      style={{
        background: 'rgba(2,8,23,0.8)',
        border: '1px solid rgba(30,58,95,0.3)',
      }}
    >
      <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>
        Serving Health Live Metrics
      </h3>
      
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 100, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(30,58,95,0.3)"
          />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 11 }}
            stroke="#94a3b8"
            interval={data.length > 10 ? Math.floor(data.length / 5) : 0}
          />
          <YAxis
            yAxisId="left"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            label={{ value: 'Requests & Uptime %', angle: 90, position: 'insideRight' }}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(2,8,23,0.95)',
              border: '1px solid rgba(30,58,95,0.5)',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: any) => [
              typeof value === 'number' ? value.toFixed(2) : value,
              '',
            ]}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          
          {/* Latency line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="latency_ms"
            stroke="#ef4444"
            dot={false}
            strokeWidth={2}
            name="Latency (ms)"
            isAnimationActive={true}
            animationDuration={300}
          />
          
          {/* Requests per minute line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="requests_per_min"
            stroke="#00d4ff"
            dot={false}
            strokeWidth={2}
            name="Requests/min"
            isAnimationActive={true}
            animationDuration={300}
          />
          
          {/* Uptime line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="uptime_pct"
            stroke="#00ff88"
            dot={false}
            strokeWidth={2}
            name="Uptime %"
            isAnimationActive={true}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <div className="text-xs" style={{ color: '#94a3b8' }}>Latest Latency</div>
          <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
            {data.length > 0 ? data[data.length - 1].latency_ms.toFixed(2) : '0.00'} ms
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <div className="text-xs" style={{ color: '#94a3b8' }}>Avg Latency</div>
          <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>
            {data.length > 0 ? (data.reduce((sum, d) => sum + d.latency_ms, 0) / data.length).toFixed(2) : '0.00'} ms
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <div className="text-xs" style={{ color: '#94a3b8' }}>Error Rate</div>
          <div className="text-lg font-bold" style={{ color: data.length > 0 && data[data.length - 1].error_rate_pct > 1.0 ? '#ef4444' : '#00ff88' }}>
            {data.length > 0 ? data[data.length - 1].error_rate_pct.toFixed(3) : '0.000'}%
          </div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
          <div className="text-xs" style={{ color: '#94a3b8' }}>Uptime %</div>
          <div className="text-lg font-bold" style={{ color: '#00ff88' }}>
            {data.length > 0 ? data[data.length - 1].uptime_pct.toFixed(2) : '0.00'}%
          </div>
        </div>
      </div>
    </div>
  );
}
