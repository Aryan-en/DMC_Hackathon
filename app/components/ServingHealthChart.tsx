'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface ServingHealthDataPoint {
  timestamp: string;
  label: string;
  cpu_util_pct: number;
  latency_ms: number;
  requests_per_min: number;
  error_rate_pct: number;
  uptime_pct: number;
}

interface ServingMatrixSnapshot {
  status: string;
  utilization_pct: number;
  speed_ghz: number;
  base_speed_ghz: number;
  processes: number;
  threads: number;
  handles: number;
  sockets: number;
  cores: number;
  logical_processors: number;
  uptime_seconds: number;
}

interface ServingHealthChartProps {
  cpuModel: string;
  data: ServingHealthDataPoint[];
  snapshot: ServingMatrixSnapshot;
  loading: boolean;
  error?: string | null;
}

function formatUptime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600).toString().padStart(2, '0');
  const mins = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const secs = (safe % 60).toString().padStart(2, '0');
  return `${days}:${hours}:${mins}:${secs}`;
}

export default function ServingHealthChart({ cpuModel, data, snapshot, loading, error }: ServingHealthChartProps) {
  if (error) {
    return (
      <div
        className="glass-card rounded-xl p-5 h-96 flex items-center justify-center"
        style={{
          background: 'rgba(2,8,23,0.8)',
          border: '1px solid rgba(30,58,95,0.3)',
        }}
      >
        <div style={{ color: '#ef4444' }}>Serving live matrix unavailable: {error}</div>
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
        <div style={{ color: '#94a3b8' }}>Loading serving live matrix...</div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const utilization = snapshot.utilization_pct || latest.cpu_util_pct || 0;

  return (
    <div
      className="glass-card rounded-xl p-5"
      style={{
        background: 'rgba(2,8,23,0.8)',
        border: '1px solid rgba(30,58,95,0.3)',
      }}
    >
      <div className="flex items-end justify-between mb-2">
        <div>
          <h3 className="font-semibold" style={{ color: '#e2e8f0', fontSize: '2rem', lineHeight: 1 }}>CPU</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>% Utilization</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#e2e8f0', fontSize: '2rem', fontWeight: 700 }}>{utilization.toFixed(0)}%</div>
          <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>{cpuModel}</div>
        </div>
      </div>

      <div style={{ height: 300, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(2,8,23,0.6)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={true} horizontal={true} />
            <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(2,8,23,0.96)',
                border: '1px solid rgba(30,58,95,0.6)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => {
                const numeric = typeof value === 'number' ? value : Number(value || 0);
                if (name === 'cpu_util_pct') return [`${numeric.toFixed(1)}%`, 'CPU'];
                return [numeric.toFixed(2), String(name)];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="cpu_util_pct"
              stroke="#22d3ee"
              fill="rgba(34,211,238,0.25)"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={250}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-1" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
        <span>60 seconds</span>
        <span>0</span>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-5">
        <div>
          <div className="grid grid-cols-2 gap-y-2" style={{ fontSize: '0.95rem' }}>
            <div style={{ color: '#94a3b8' }}>Utilization</div>
            <div style={{ color: '#e2e8f0', fontSize: '2rem', lineHeight: 1 }}>{utilization.toFixed(0)}%</div>

            <div style={{ color: '#94a3b8' }}>Speed</div>
            <div style={{ color: '#e2e8f0', fontSize: '2rem', lineHeight: 1 }}>{snapshot.speed_ghz.toFixed(2)} GHz</div>

            <div style={{ color: '#94a3b8' }}>Up time</div>
            <div style={{ color: '#e2e8f0', fontSize: '1.7rem', lineHeight: 1 }}>{formatUptime(snapshot.uptime_seconds)}</div>
          </div>
        </div>

        <div>
          <div className="space-y-2" style={{ fontSize: '1rem' }}>
            <div><span style={{ color: '#94a3b8' }}>Requests/min:</span> <span style={{ color: '#00d4ff' }}>{latest.requests_per_min.toFixed(1)}</span></div>
            <div><span style={{ color: '#94a3b8' }}>Latency:</span> <span style={{ color: '#f59e0b' }}>{latest.latency_ms.toFixed(1)} ms</span></div>
            <div><span style={{ color: '#94a3b8' }}>Error rate:</span> <span style={{ color: '#ef4444' }}>{latest.error_rate_pct.toFixed(3)}%</span></div>
            <div><span style={{ color: '#94a3b8' }}>Uptime:</span> <span style={{ color: '#00ff88' }}>{latest.uptime_pct.toFixed(3)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
