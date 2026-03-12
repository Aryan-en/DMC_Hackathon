'use client';

import TopBar from '@/components/TopBar';
import { Map, Thermometer, CloudRain, Wind, AlertTriangle, TrendingUp, Layers, Crosshair } from 'lucide-react';

const HOTSPOTS = [
  { id: 1, name: 'Strait of Hormuz', lat: 26.5, lng: 56.2, type: 'Military', severity: 'critical', value: 94 },
  { id: 2, name: 'Jakarta Basin', lat: -6.2, lng: 106.8, type: 'Social Unrest', severity: 'high', value: 67 },
  { id: 3, name: 'Sahel Region', lat: 14.0, lng: 2.0, type: 'Climate', severity: 'critical', value: 88 },
  { id: 4, name: 'Taiwan Strait', lat: 24.0, lng: 120.5, type: 'Geopolitical', severity: 'critical', value: 91 },
  { id: 5, name: 'Ukraine-Russia Border', lat: 49.5, lng: 36.0, type: 'Conflict', severity: 'critical', value: 96 },
  { id: 6, name: 'Amazon Basin', lat: -3.5, lng: -62.0, type: 'Climate', severity: 'high', value: 72 },
  { id: 7, name: 'Horn of Africa', lat: 10.0, lng: 44.0, type: 'Famine Risk', severity: 'high', value: 78 },
  { id: 8, name: 'South China Sea', lat: 15.0, lng: 114.0, type: 'Maritime', severity: 'high', value: 74 },
  { id: 9, name: 'Kashmir Region', lat: 34.0, lng: 76.0, type: 'Conflict', severity: 'medium', value: 61 },
  { id: 10, name: 'Venezuela', lat: 8.0, lng: -66.0, type: 'Political', severity: 'medium', value: 55 },
];

const CLIMATE_INDICATORS = [
  { region: 'Sub-Saharan Africa', temp: '+2.4°C', drought: 'CRITICAL', flood: 'MODERATE', cropRisk: 84 },
  { region: 'Southeast Asia', temp: '+1.9°C', drought: 'HIGH', flood: 'HIGH', cropRisk: 71 },
  { region: 'Middle East', temp: '+3.1°C', drought: 'CRITICAL', flood: 'LOW', cropRisk: 91 },
  { region: 'Central America', temp: '+1.7°C', drought: 'MODERATE', flood: 'HIGH', cropRisk: 63 },
  { region: 'South Asia', temp: '+2.2°C', drought: 'HIGH', flood: 'CRITICAL', cropRisk: 78 },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#00d4ff',
  low: '#00ff88',
};

// SVG world map placeholder with hotspot markers
function WorldMapSVG() {
  // Simplified map with hotspot dots positioned approximately
  const mapHotspots = [
    { x: 52, y: 38, sev: 'critical', name: 'Ukraine' },
    { x: 56, y: 47, sev: 'critical', name: 'Hormuz' },
    { x: 77, y: 46, sev: 'critical', name: 'Taiwan' },
    { x: 72, y: 46, sev: 'high', name: 'S. China Sea' },
    { x: 46, y: 53, sev: 'critical', name: 'Sahel' },
    { x: 51, y: 52, sev: 'high', name: 'Horn of Africa' },
    { x: 70, y: 58, sev: 'high', name: 'Jakarta' },
    { x: 71, y: 50, sev: 'medium', name: 'Kashmir' },
    { x: 33, y: 57, sev: 'high', name: 'Amazon' },
    { x: 30, y: 47, sev: 'medium', name: 'Venezuela' },
  ];

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: 'rgba(2,8,23,0.9)', border: '1px solid #1e3a5f' }}>
      {/* Stylized map background */}
      <svg viewBox="0 0 100 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="bg-grad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a1628" />
            <stop offset="100%" stopColor="#020817" />
          </radialGradient>
          <filter id="blur-glow">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="100" height="70" fill="url(#bg-grad)" />

        {/* Grid lines (latitude/longitude) */}
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
          <line key={`v${x}`} x1={x} y1={0} x2={x} y2={70} stroke="#1e3a5f" strokeWidth="0.2" strokeOpacity="0.4" />
        ))}
        {[10, 20, 30, 40, 50, 60].map(y => (
          <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke="#1e3a5f" strokeWidth="0.2" strokeOpacity="0.4" />
        ))}

        {/* Equator line */}
        <line x1={0} y1={37} x2={100} y2={37} stroke="#1e3a5f" strokeWidth="0.4" strokeOpacity="0.7" strokeDasharray="2,1" />

        {/* Continent outlines (simplified) */}
        {/* North America */}
        <path d="M 8 15 L 30 12 L 35 25 L 28 38 L 20 42 L 12 35 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />
        {/* South America */}
        <path d="M 25 42 L 35 40 L 38 58 L 30 65 L 22 58 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />
        {/* Europe */}
        <path d="M 44 14 L 56 12 L 58 24 L 50 28 L 44 22 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />
        {/* Africa */}
        <path d="M 44 30 L 56 28 L 58 55 L 50 62 L 44 55 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />
        {/* Asia */}
        <path d="M 56 10 L 85 10 L 88 32 L 78 50 L 62 48 L 56 30 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />
        {/* Australia */}
        <path d="M 74 52 L 86 50 L 88 62 L 80 66 L 72 62 Z" fill="#0d2040" stroke="#1e3a5f" strokeWidth="0.4" />

        {/* Hotspot markers */}
        {mapHotspots.map((h, i) => (
          <g key={i} filter="url(#blur-glow)">
            <circle cx={h.x} cy={h.y} r={2.5} fill={`${SEV_COLORS[h.sev]}30`} />
            <circle cx={h.x} cy={h.y} r={1.2} fill={SEV_COLORS[h.sev]} opacity={0.9} />
            <circle cx={h.x} cy={h.y} r={3.5} fill="none" stroke={SEV_COLORS[h.sev]} strokeWidth="0.3" opacity={0.4} />
          </g>
        ))}

        {/* Crosshair for active region */}
        <g opacity={0.6}>
          <line x1={52} y1={34} x2={52} y2={42} stroke="#ef4444" strokeWidth="0.3" />
          <line x1={48} y1={38} x2={56} y2={38} stroke="#ef4444" strokeWidth="0.3" />
          <circle cx={52} cy={38} r={1.8} fill="none" stroke="#ef4444" strokeWidth="0.4" />
        </g>
      </svg>

      {/* Overlay info */}
      <div className="absolute top-3 left-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f' }}>
        <div className="text-xs font-mono font-bold" style={{ color: '#00d4ff', fontSize: '0.65rem' }}>PostGIS · Leaflet · Kepler.gl</div>
        <div className="text-xs mt-0.5" style={{ color: '#334155', fontSize: '0.6rem' }}>Zoom: Global · Projection: Mercator</div>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        {Object.entries(SEV_COLORS).map(([sev, color]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-xs capitalize" style={{ color: '#64748b', fontSize: '0.6rem' }}>{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GeospatialPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Geospatial Intelligence" subtitle="PostGIS · GeoPandas · Kepler.gl · Mapbox — Live Satellite Integration" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Active Hotspots', value: '10', sub: '3 critical, 5 high', color: '#ef4444', icon: AlertTriangle },
            { label: 'Coordinates Indexed', value: '2.1M', sub: 'Updated 31 min ago', color: '#00d4ff', icon: Crosshair },
            { label: 'Climate Risk Zones', value: '847', sub: 'Tier-1 through Tier-4', color: '#f59e0b', icon: Thermometer },
            { label: 'Satellite Feeds', value: '24', sub: '3 constellations active', color: '#00ff88', icon: Layers },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{s.label}</div>
                <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6" style={{ height: '420px' }}>
          {/* Map */}
          <div className="col-span-2 h-full">
            <WorldMapSVG />
          </div>

          {/* Hotspot list */}
          <div className="glass-card rounded-xl p-5 flex flex-col overflow-hidden">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Priority Hotspots</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {HOTSPOTS.map(h => (
                <div
                  key={h.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-white/3"
                  style={{ background: 'rgba(2,8,23,0.5)', border: `1px solid ${SEV_COLORS[h.severity]}30` }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 pulse-dot" style={{ background: SEV_COLORS[h.severity] }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: '#e2e8f0', fontSize: '0.72rem' }}>{h.name}</div>
                    <div className="text-xs" style={{ color: '#475569', fontSize: '0.65rem' }}>{h.type}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold" style={{ color: SEV_COLORS[h.severity] }}>{h.value}</div>
                    <div className="text-xs uppercase font-bold" style={{ color: SEV_COLORS[h.severity], fontSize: '0.58rem', opacity: 0.7 }}>{h.severity}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Climate intelligence */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Climate Intelligence Matrix</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                Climate event → district → crop impact → GDP shift pathway analysis
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Region</th>
                  <th className="text-left">Temp Anomaly</th>
                  <th className="text-left">Drought Index</th>
                  <th className="text-left">Flood Risk</th>
                  <th className="text-left">Crop Risk Score</th>
                  <th className="text-left">GDP Impact Est.</th>
                </tr>
              </thead>
              <tbody>
                {CLIMATE_INDICATORS.map(row => {
                  const riskColor = row.cropRisk > 80 ? '#ef4444' : row.cropRisk > 65 ? '#f59e0b' : '#00d4ff';
                  const gdpImpact = `-${(row.cropRisk * 0.08).toFixed(1)}%`;
                  return (
                    <tr key={row.region}>
                      <td style={{ color: '#e2e8f0' }}>{row.region}</td>
                      <td style={{ color: '#ef4444' }}>{row.temp}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs ${row.drought === 'CRITICAL' ? 'status-critical' : row.drought === 'HIGH' ? 'status-warning' : 'status-online'}`}>
                          {row.drought}
                        </span>
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs ${row.flood === 'CRITICAL' ? 'status-critical' : row.flood === 'HIGH' ? 'status-warning' : 'status-online'}`}>
                          {row.flood}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                            <div className="h-full rounded-full" style={{ width: `${row.cropRisk}%`, background: riskColor, opacity: 0.8 }} />
                          </div>
                          <span className="font-mono text-xs font-bold" style={{ color: riskColor }}>{row.cropRisk}</span>
                        </div>
                      </td>
                      <td className="font-mono font-bold" style={{ color: '#ef4444' }}>{gdpImpact}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom: Layer controls + satellite feeds */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Map Layer Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Conflict Zones', active: true, color: '#ef4444' },
                { label: 'Climate Overlays', active: true, color: '#00ff88' },
                { label: 'Trade Routes', active: false, color: '#00d4ff' },
                { label: 'Migration Flows', active: true, color: '#f59e0b' },
                { label: 'Economic Zones', active: false, color: '#8b5cf6' },
                { label: 'Infrastructure', active: true, color: '#00d4ff' },
                { label: 'Satellite Imagery', active: true, color: '#64748b' },
                { label: 'Population Density', active: false, color: '#f59e0b' },
              ].map(layer => (
                <div key={layer.label} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{ background: layer.active ? `${layer.color}20` : 'transparent', border: `1px solid ${layer.active ? layer.color : '#334155'}` }}
                  >
                    {layer.active && <span style={{ color: layer.color, fontSize: '0.6rem' }}>✓</span>}
                  </div>
                  <span className="text-xs" style={{ color: layer.active ? '#94a3b8' : '#475569', fontSize: '0.7rem' }}>{layer.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Satellite Feed Status</h3>
            <div className="space-y-3">
              {[
                { name: 'Sentinel-2 (ESA)', coverage: 'Global', res: '10m', status: 'LIVE', lat: '12h' },
                { name: 'Landsat-9 (USGS)', coverage: 'Global', res: '30m', status: 'LIVE', lat: '8h' },
                { name: 'Planet Labs', coverage: 'Priority zones', res: '3m', status: 'LIVE', lat: '2h' },
                { name: 'Maxar WorldView-4', coverage: 'Hotspots', res: '0.31m', status: 'LIVE', lat: '45m' },
                { name: 'GOES-18 (NOAA)', coverage: 'Americas', res: '500m', status: 'LIVE', lat: '15m' },
              ].map(sat => (
                <div key={sat.name} className="flex items-center gap-4 py-2" style={{ borderBottom: '1px solid rgba(30,58,95,0.3)' }}>
                  <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#00ff88' }} />
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{sat.name}</div>
                    <div className="text-xs" style={{ color: '#475569', fontSize: '0.65rem' }}>{sat.coverage} · {sat.res} resolution</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold" style={{ color: '#00ff88', fontSize: '0.65rem' }}>{sat.status}</div>
                    <div className="text-xs font-mono" style={{ color: '#334155', fontSize: '0.62rem' }}>LAT: {sat.lat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
