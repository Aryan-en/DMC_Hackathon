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
      <div className="tactical-card rounded-xl p-5 h-96 flex items-center justify-center">
        <div style={{ color: 'var(--accent-crimson)' }}>Serving live matrix unavailable: {error}</div>
      </div>
    );
  }

  if (loading || data.length === 0) {
    return (
      <div className="tactical-card rounded-xl p-5 h-96 flex items-center justify-center">
        <div style={{ color: 'var(--text-secondary)' }}>Loading serving live matrix...</div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const utilization = snapshot.utilization_pct || latest.cpu_util_pct || 0;

  return (
    <div className="tactical-card rounded-xl p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70" style={{ color: 'var(--text-primary)' }}>Hardware Matrix // CPU</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>% Total System Utilization</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: 'var(--text-primary)', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 0.9 }}>{utilization.toFixed(0)}%</div>
          <div className="mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', opacity: 0.6 }}>{cpuModel}</div>
        </div>
      </div>

      <div style={{ height: 300, background: 'var(--background)', borderRadius: '12px', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={true} horizontal={true} />
            <XAxis dataKey="label" tick={false} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={false} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--background)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => {
                const numeric = typeof value === 'number' ? value : Number(value || 0);
                if (name === 'cpu_util_pct') return [`${numeric.toFixed(1)}%`, 'CPU'];
                return [numeric.toFixed(2), String(name)];
              }}
              labelFormatter={(label) => `SITREP Time: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="cpu_util_pct"
              stroke="var(--metric-accent)"
              fill="var(--metric-accent-gradient)"
              strokeWidth={3}
              isAnimationActive={true}
              animationDuration={250}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
        <span>30 minutes</span>
        <span>0</span>
      </div>

      <div className="grid grid-cols-2 gap-8 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid grid-cols-2 gap-y-3">
          <div className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>Utilization</div>
          <div className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>{utilization.toFixed(1)}%</div>

          <div className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>Clock Speed</div>
          <div className="text-xl font-black" style={{ color: 'var(--metric-2-text)' }}>{snapshot.speed_ghz.toFixed(2)} GHz</div>

          <div className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>System Uptime</div>
          <div className="text-xl font-black" style={{ color: 'var(--accent-emerald)' }}>{formatUptime(snapshot.uptime_seconds)}</div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>Throughput:</span> <span className="font-black" style={{ color: 'var(--metric-2-text)' }}>{latest.requests_per_min.toFixed(1)} RPM</span></div>
          <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>Latency:</span> <span className="font-black" style={{ color: 'var(--accent-amber)' }}>{latest.latency_ms.toFixed(1)} MS</span></div>
          <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>Error Rate:</span> <span className="font-black" style={{ color: 'var(--accent-crimson)' }}>{latest.error_rate_pct.toFixed(3)}%</span></div>
          <div className="flex justify-between items-center"><span className="text-[10px] uppercase font-bold opacity-50" style={{ color: 'var(--text-secondary)' }}>SLA Status:</span> <span className="font-black" style={{ color: 'var(--accent-emerald)' }}>{latest.uptime_pct.toFixed(3)}%</span></div>
        </div>
      </div>
    </div>
  );
}
