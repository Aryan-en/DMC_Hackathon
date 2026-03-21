'use client';

import TopBar from '@/components/TopBar';
import { AlertTriangle } from 'lucide-react';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';

export default function GeospatialPage() {
  const { data, loading, error } = useGeospatialMetrics();
  const criticalHotspots = data.hotspots.filter((h) => (h.severity || '').toLowerCase() === 'critical').length;

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Geospatial Intelligence" subtitle="Live geospatial feeds from backend endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live geospatial data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>Hotspots</div>
            <div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>{data.hotspots.length}</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>Critical Hotspots</div>
            <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{criticalHotspots}</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>Climate Regions</div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{data.climateRegions.length}</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Live Hotspots</h3>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Name</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Severity</th>
                  <th className="text-left">Score</th>
                  <th className="text-left">Coordinates</th>
                </tr>
              </thead>
              <tbody>
                {data.hotspots.map((h, idx) => (
                  <tr key={`hotspot-${idx}-${h.name}`}>
                    <td style={{ color: '#e2e8f0' }}>{h.name}</td>
                    <td style={{ color: '#94a3b8' }}>{h.type}</td>
                    <td style={{ color: '#f59e0b' }}>{h.severity}</td>
                    <td style={{ color: '#00d4ff' }}>{h.value}</td>
                    <td style={{ color: '#64748b' }}>{h.lat}, {h.lng}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.hotspots.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live hotspots returned by API.</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Climate Indicators</h3>
            <div className="space-y-2">
              {data.climateRegions.map((r) => (
                <div key={r.region} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{r.region}</span>
                    <span style={{ color: '#ef4444', fontSize: '0.72rem' }}>{r.temp}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>Drought: {r.drought} | Flood: {r.flood} | Crop risk: {r.cropRisk}</div>
                </div>
              ))}
            </div>
            {!loading && data.climateRegions.length === 0 && <p className="text-xs" style={{ color: '#64748b' }}>No live climate indicators returned by API.</p>}
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Recent Incidents</h3>
            <div className="space-y-2">
              {data.incidents.map((i) => (
                <div key={`${i.name}-${i.date}`} className="flex items-center gap-3 p-2 rounded" style={{ background: 'rgba(2,8,23,0.5)' }}>
                  <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                  <div>
                    <div className="text-xs" style={{ color: '#e2e8f0' }}>{i.name}</div>
                    <div className="text-xs" style={{ color: '#64748b' }}>{i.type} · {i.date}</div>
                  </div>
                </div>
              ))}
            </div>
            {!loading && data.incidents.length === 0 && <p className="text-xs" style={{ color: '#64748b' }}>No live incidents returned by API.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
