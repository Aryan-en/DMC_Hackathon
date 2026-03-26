'use client';

import TopBar from '@/components/TopBar';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';
import { useState } from 'react';
import StatCard from '@/components/StatCard';
import TacticalHeatmap from '@/components/app/TacticalHeatmap';
import { Globe, Shield, Thermometer, AlertTriangle, X, Factory, Sprout, Droplets, Sun, Activity, Zap } from 'lucide-react';

export default function GeospatialPage() {
  const { data, loading, error } = useGeospatialMetrics();
  const [selectedClimate, setSelectedClimate] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
  const criticalHotspots = data.hotspots.filter((h: any) => (h.severity || '').toLowerCase() === 'critical').length;

  const formatIncidentTimestamp = (rawDate: string) => {
    const normalized = rawDate.replace(' ', 'T');
    const [datePart, timeRaw] = normalized.split('T');
    const safeDate = datePart || rawDate;
    const safeTime = timeRaw?.replace('Z', '').substring(0, 5) || '00:00';
    return `${safeDate} ${safeTime}`;
  };

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Geospatial Intelligence" subtitle="Live geospatial feeds from backend endpoints" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="status-critical mb-4">
            Live geospatial data unavailable: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            label="Live Hotspots"
            value={data.hotspots.length.toString()}
            subValue="Geopolitical risk points"
            icon={Globe}
            bgColor="var(--metric-1)"
            textColor="var(--metric-1-text)"
            accentColor="var(--metric-1-border)"
            loading={loading}
          />
          <StatCard
            label="Critical Hotspots"
            value={criticalHotspots.toString()}
            subValue="Immediate intervention required"
            icon={Shield}
            bgColor="var(--metric-2)"
            textColor="var(--metric-2-text)"
            accentColor="var(--metric-2-border)"
            loading={loading}
          />
          <StatCard
            label="Climate Regions"
            value={data.climateRegions.length.toString()}
            subValue="Monitored environmental zones"
            icon={Thermometer}
            bgColor="var(--metric-3)"
            textColor="var(--metric-3-text)"
            accentColor="var(--metric-3-border)"
            loading={loading}
          />
        </div>

        {/* Global Situation Map (Tactical Heatmap Overhaul) */}
        {!loading && (
          <TacticalHeatmap 
            hotspots={data.hotspots}
            climateRegions={data.climateRegions}
            incidents={data.incidents}
          />
        )}

        <div className="tactical-card rounded-xl p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Live Hotspots</h3>
          <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
            <div className="space-y-2 pr-2">
              {data.hotspots.map((h: any, idx: number) => {
                const severityColor = h.severity === 'critical' ? 'var(--accent-crimson)' : h.severity === 'high' ? 'var(--accent-amber)' : 'var(--accent-steel)';
                const severityBg = h.severity === 'critical' ? 'var(--accent-crimson)' : h.severity === 'high' ? 'var(--accent-amber)' : 'var(--accent-steel)';
                return (
                  <div
                    key={`hotspot-${idx}-${h.name}`}
                    className="p-3 rounded-xl transition-all cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      background: 'var(--metric-1)',
                      border: `1px solid var(--border-color)`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onClick={() => setSelectedHotspot(h)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{h.name}</span>
                      <span
                        className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest"
                        style={{
                          background: `color-mix(in srgb, ${severityBg}, transparent 85%)`,
                          color: severityColor,
                        }}
                      >
                        {h.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-secondary)' }}>{h.type}</span>
                        <span className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Score: {h.value}</span>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                      {h.lat?.toFixed(2)}, {h.lng?.toFixed(2)} <span className="ml-2" style={{ color: 'var(--text-dim)' }}>Region: {h.region}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {!loading && data.hotspots.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live hotspots returned by API.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="tactical-card rounded-xl p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-black text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Climate Indicators</h3>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <div className="space-y-2 pr-2">
                  {data.climateRegions.map((r: any, idx: number) => {
                    const droughtColor = r.drought === 'CRITICAL' ? 'var(--accent-crimson)' : r.drought === 'HIGH' ? 'var(--accent-amber)' : r.drought === 'MODERATE' ? 'var(--accent-steel)' : 'var(--accent-emerald)';
                    const floodColor = r.flood === 'CRITICAL' ? 'var(--accent-crimson)' : r.flood === 'HIGH' ? 'var(--accent-amber)' : 'var(--accent-steel)';
                    const cropsRiskColor = r.cropRisk >= 80 ? 'var(--accent-crimson)' : r.cropRisk >= 60 ? 'var(--accent-amber)' : r.cropRisk >= 40 ? 'var(--accent-steel)' : 'var(--accent-emerald)';
                    
                    return (
                      <div
                        key={`${r.region}-${idx}`}
                        className="p-3 rounded-xl transition-all cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5"
                        style={{
                          background: 'var(--metric-1)',
                          border: `1px solid var(--border-color)`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                        }}
                        onClick={() => setSelectedClimate(r)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{r.region}</span>
                          <span className="text-[10px] font-black" style={{ color: 'var(--accent-crimson)' }}>{r.temp}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-1" style={{ color: droughtColor }}>
                            <Sun size={10} />
                            <span>{r.drought}</span>
                          </div>
                          <div className="flex items-center gap-1" style={{ color: floodColor }}>
                            <Droplets size={10} />
                            <span>{r.flood}</span>
                          </div>
                          <div className="flex items-center gap-1" style={{ color: cropsRiskColor }}>
                            <Sprout size={10} />
                            <span>RISK: {r.cropRisk}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
            {!loading && data.climateRegions.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live climate indicators returned by API.</p>}
          </div>

          <div className="tactical-card rounded-xl p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-black text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Recent Incidents</h3>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <div className="space-y-2 pr-2">
                {data.incidents.map((i: any, idx: number) => (
                  <div
                    key={`${i.name}-${i.date}-${idx}`}
                    className="flex items-start gap-3 p-3 rounded-xl transition-all cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      background: 'var(--metric-1)',
                      border: '1px solid var(--border-color)',
                    }}
                    onClick={() => setSelectedIncident(i)}
                  >
                    <AlertTriangle size={14} style={{ color: 'var(--accent-crimson)', flexShrink: 0, marginTop: '0.2rem' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{i.name}</div>
                      <div className="text-[9px] font-bold uppercase mt-1" style={{ color: 'var(--text-secondary)' }}>{i.type}</div>
                      <div className="text-[9px] font-bold uppercase mt-1" style={{ color: 'var(--text-dim)' }}>{i.lat?.toFixed(2)}, {i.lng?.toFixed(2)}</div>
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-tight" style={{ color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{formatIncidentTimestamp(i.date)}</div>
                  </div>
                ))}
              </div>
            </div>
            {!loading && data.incidents.length === 0 && <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No live incidents returned by API.</p>}
          </div>
        </div>

        {/* Economic Activity Mapping Section */}
        <div className="tactical-card rounded-xl p-5" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-black text-[10px] uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)' }}>Economic Activity Mapping</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.economicRegions?.map((region: any) => (
              <div
                key={region.name}
                className="p-4 rounded-xl transition-all cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  background: 'var(--metric-1)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="text-sm font-black uppercase tracking-tight" style={{ color: 'var(--metric-3-text)' }}>{region.name}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Score: {region.economic_resilience_score}</div>
                </div>

                <div className="text-[11px] mt-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-muted)' }}>GDP:</span> 
                    <span className="font-black" style={{ color: 'var(--text-primary)' }}>${region.gdp_usd_trillion}T <span style={{ color: 'var(--accent-emerald)' }}>(+{region.gdp_growth_percent}%)</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-muted)' }}>Population:</span> 
                    <span className="font-black" style={{ color: 'var(--text-primary)' }}>{region.population_billion}B</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase text-[9px]" style={{ color: 'var(--text-muted)' }}>Employment:</span> 
                    <span className="font-black" style={{ color: 'var(--accent-crimson)' }}>{region.employment_rate}%</span>
                  </div>
                </div>

                {/* Industries */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--accent-amber)' }}>
                    <Factory size={12} />
                    Major Industries
                  </div>
                  <div className="space-y-2">
                    {region.major_industries.slice(0, 3).map((industry: any) => (
                      <div key={industry.name} className="flex items-center justify-between gap-2">
                        <span className="uppercase font-bold text-[9px]" style={{ color: 'var(--text-muted)' }}>{industry.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                            <div
                              className="h-full"
                              style={{ width: `${industry.percentage}%`, background: 'var(--metric-3-text)' }}
                            />
                          </div>
                          <span className="font-black text-[9px]" style={{ color: 'var(--text-secondary)' }}>{industry.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agriculture Zones */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: 'var(--accent-emerald)' }}>
                    <Sprout size={12} />
                    Key Agricultural Zones
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {region.agriculture_zones.map((zone: any) => (
                      <div key={zone.zone} className="p-2 rounded-lg border" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
                        <div className="text-[10px] font-black uppercase tracking-tight" style={{ color: 'var(--accent-emerald)' }}>{zone.zone}</div>
                        <div className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                           {zone.countries.join(' • ')}
                        </div>
                        <div className="text-[9px] mt-1 flex justify-between" style={{ color: 'var(--text-secondary)' }}>
                          <span className="font-bold">{zone.crops.join(', ')}</span>
                          <span className="font-black" style={{ color: 'var(--metric-accent)' }}>{zone.production_million_tons}MT</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loading && (!data.economicRegions || data.economicRegions.length === 0) && (
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>No economic activity data available.</p>
          )}
        </div>
      </main>

      {/* Climate Indicators Details Modal */}
      {selectedClimate && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all"
          onClick={() => setSelectedClimate(null)}
        >
          <div
            className="tactical-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-4">
              <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--metric-accent)' }}>{selectedClimate.region}</h2>
              <button
                onClick={() => setSelectedClimate(null)}
                style={{ color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Top Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border" style={{ background: 'var(--nested-surface)', borderColor: 'var(--border-color)' }}>
                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Temperature</div>
                    <div className="text-xl font-black mt-1" style={{ color: 'var(--accent-crimson)' }}>{selectedClimate.temp}</div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Drought Intensity</div>
                    <div className="text-sm font-black mt-1 flex items-center gap-2" style={{ color: 'var(--accent-amber)' }}>
                      <Sun size={14} /> {selectedClimate.drought}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-l border-white/10 pl-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Crop Vulnerability</div>
                    <div className="text-xl font-black mt-1" style={{ color: selectedClimate.cropRisk >= 80 ? 'var(--accent-crimson)' : 'var(--accent-amber)' }}>{selectedClimate.cropRisk}%</div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Hydrological Risk</div>
                    <div className="text-sm font-black mt-1 flex items-center gap-2" style={{ color: 'var(--accent-steel)' }}>
                      <Droplets size={14} /> {selectedClimate.flood}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Sections with Left Accents */}
              <div className="space-y-5">
                {/* Summary */}
                <div className="pl-4 border-l-2 border-white/10">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--text-muted)' }}>Situation Summary</div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Region <strong style={{ color: 'var(--metric-accent)' }}>{selectedClimate.region}</strong> is experiencing {selectedClimate.drought.toLowerCase()} drought conditions with {selectedClimate.flood.toLowerCase()} flood risk. 
                    Crop risk is evaluated at <strong style={{ color: 'var(--accent-amber)' }}>{selectedClimate.cropRisk}%</strong> based on current thermal anomalies. 
                  </div>
                </div>

                {/* Risk Classification */}
                <div className="p-4 rounded-r-xl border-l-4 bg-white/[0.02]" style={{ borderColor: 'var(--accent-amber)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60" style={{ color: 'var(--text-muted)' }}>Climatological Risk Index</div>
                  <div className="grid grid-cols-1 gap-3 text-[12px]">
                    <div className="flex gap-3">
                      <span className="font-bold w-24 flex-shrink-0" style={{ color: 'var(--accent-amber)' }}>DROUGHT</span>
                      <span className="opacity-80" style={{ color: 'var(--text-primary)' }}>{selectedClimate.drought === 'CRITICAL' ? 'Severe water stress, agricultural depletion.' : 'Manageable water stress with adaptation.'}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold w-24 flex-shrink-0" style={{ color: 'var(--accent-steel)' }}>FLOOD</span>
                      <span className="opacity-80" style={{ color: 'var(--text-primary)' }}>{selectedClimate.flood === 'CRITICAL' ? 'Severe flooding threat, infrastructure risk.' : 'Low-moderate flooding probability.'}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="pl-4 border-l-2 p-4 rounded-r-xl" style={{ borderColor: 'var(--accent-emerald)', background: 'var(--metric-1)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'var(--accent-emerald)' }}>Response Recommendations</div>
                  <div className="text-[13px] leading-relaxed space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    {selectedClimate.cropRisk >= 60 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider" style={{ color: 'var(--accent-emerald)' }}>
                           <Activity size={12} /> Priority Intervention Required
                        </div>
                        <ul className="list-disc pl-4 space-y-1 opacity-80 pt-1">
                          <li>Emergency food aid distribution</li>
                          <li>Irrigation infrastructure support</li>
                          <li>Crop insurance activation protocols</li>
                        </ul>
                      </div>
                    ) : (
                      <p className="opacity-60 italic text-[11px]">Preventive soil health and water harvesting measures recommended.</p>
                    )}
                  </div>
                </div>

                {/* India Analysis */}
                <div className="p-4 rounded-xl bg-orange-500/[0.02] border border-orange-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🇮🇳</span>
                    <span className="font-black text-[10px] uppercase tracking-widest text-orange-400">Market Intelligence (India)</span>
                  </div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {selectedClimate.cropRisk >= 80 ? (
                      <div className="space-y-2">
                        <div className="font-bold text-orange-400 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                           <Activity size={14} /> Critical Export Opportunity
                        </div>
                        <p className="opacity-80">Global shortages strengthen India's strategic position as an agricultural exporter.</p>
                      </div>
                    ) : (
                      <p className="opacity-60 italic text-[11px]">Monitor regional stability and potential for ag-tech transfer.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Hotspot Details Modal */}
      {selectedHotspot && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all"
          onClick={() => setSelectedHotspot(null)}
        >
          <div
            className="tactical-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              border: selectedHotspot.severity === 'critical' ? '1px solid var(--accent-crimson)' : selectedHotspot.severity === 'high' ? '1px solid var(--accent-amber)' : '1px solid var(--metric-accent)',
            }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{
                    background: selectedHotspot.severity === 'critical' ? 'var(--accent-crimson)' : selectedHotspot.severity === 'high' ? 'var(--accent-amber)' : 'var(--metric-accent)',
                    opacity: 0.1,
                  }}
                ></span>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                  style={{
                    color: selectedHotspot.severity === 'critical' ? 'var(--accent-crimson)' : selectedHotspot.severity === 'high' ? 'var(--accent-amber)' : 'var(--metric-accent)',
                  }}
                >
                  {selectedHotspot.severity}
                </span>
                <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{selectedHotspot.name}</h2>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                style={{ color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Top Metrics Row */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border" style={{ background: 'var(--nested-surface)', borderColor: 'var(--border-color)' }}>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Hotspot Type</div>
                  <div className="text-xl font-black mt-1" style={{ color: 'var(--metric-accent)' }}>{selectedHotspot.type}</div>
                </div>
                <div className="border-l border-white/10 pl-4">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: 'var(--text-muted)' }}>Risk Score</div>
                  <div className="text-3xl font-black mt-1" style={{ color: 'var(--accent-amber)' }}>{selectedHotspot.value}</div>
                </div>
              </div>

              {/* Detail Sections with Left Accents */}
              <div className="space-y-5">
                {/* Location */}
                <div className="pl-4 border-l-2 border-white/10">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--text-muted)' }}>Geospatial Coordinates</div>
                  <div className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                    <span className="opacity-50">LAT</span> <strong style={{ color: 'var(--metric-accent)' }}>{selectedHotspot.lat?.toFixed(6)}</strong>
                    <span className="mx-3 opacity-20">|</span>
                    <span className="opacity-50">LNG</span> <strong style={{ color: 'var(--metric-accent)' }}>{selectedHotspot.lng?.toFixed(6)}</strong>
                  </div>
                </div>

                {/* Analysis */}
                <div className={`p-4 rounded-r-xl border-l-4 bg-white/[0.02]`} 
                     style={{ borderColor: selectedHotspot.severity === 'critical' ? 'var(--accent-crimson)' : 'var(--accent-amber)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60" style={{ color: 'var(--text-muted)' }}>Intelligence Analysis</div>
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    <strong>{selectedHotspot.name}</strong> classification: <span className="font-black" style={{ color: selectedHotspot.severity === 'critical' ? 'var(--accent-crimson)' : 'var(--accent-amber)' }}>{selectedHotspot.severity.toUpperCase()}</span>
                    <div className="mt-3 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" style={{ color: selectedHotspot.severity === 'critical' ? 'var(--accent-crimson)' : 'var(--accent-amber)' }}>
                      <Activity size={14} /> {selectedHotspot.severity === 'critical' ? 'Immediate Intervention Recommended' : 'Ongoing Tactical Monitoring'}
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="pl-4 border-l-2 border-white/10">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--text-muted)' }}>Reasoning & Indicators</div>
                  <div className="text-sm leading-relaxed opacity-90" style={{ color: 'var(--text-primary)' }}>
                    {selectedHotspot.severity === 'critical' ? (
                      'Risk score exceeds 85/100 threshold. Strategic incidents pose immediate threats to stability. Rapid escalation detected.'
                    ) : (
                      'Elevated risk profile with significant regional impact potential. Pattern of recurring incidents indicates systemic instability.'
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pl-4 border-l-2 border-blue-500/30 bg-blue-500/[0.02] p-4 rounded-r-xl">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-3 text-blue-400">Tactical Response Protocol</div>
                  <div className="text-[13px] leading-relaxed space-y-2" style={{ color: 'var(--text-secondary)' }}>
                    {selectedHotspot.severity === 'critical' ? (
                      <>
                        <div className="flex gap-2">
                           <span className="text-blue-400 font-bold">01</span>
                           <span><strong>Escalate</strong> - Activate emergency protocols immediately</span>
                        </div>
                        <div className="flex gap-2">
                           <span className="text-blue-400 font-bold">02</span>
                           <span><strong>Deploy</strong> - Position humanitarian aid or security assets</span>
                        </div>
                        <div className="flex gap-2">
                           <span className="text-blue-400 font-bold">03</span>
                           <span><strong>Engage</strong> - Initiate emergency diplomatic communications</span>
                        </div>
                        <div className="mt-4 p-2 rounded bg-red-500/10 text-red-400 text-[11px] font-bold uppercase tracking-widest text-center">
                          Timeline: Execute within 6-12 hours
                        </div>
                      </>
                    ) : (
                      <div className="opacity-80 italic">Standard elevated response protocols active. Implementation within 24-48 hours.</div>
                    )}
                  </div>
                </div>

                {/* India Impact */}
                <div className="p-4 rounded-xl bg-orange-500/[0.02] border border-orange-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🇮🇳</span>
                    <span className="font-black text-[10px] uppercase tracking-widest text-orange-400">Strategic India Impact</span>
                  </div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {selectedHotspot.region === 'South Asia' || selectedHotspot.region === 'Asia' ? (
                      <div className="space-y-2">
                        <div className="font-bold text-orange-400 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                          <Activity size={14} /> High Relevance - Direct Impact Possible
                        </div>
                        <p className="opacity-80">• Potential disruption to regional trade and maritime security.</p>
                        <p className="opacity-80">• Monitoring border security and humanitarian requirements.</p>
                      </div>
                    ) : (
                      <p className="opacity-60 italic text-[11px]">Peripheral impact. Maintain secondary watch status.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Incidents Details Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-all"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="tactical-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--accent-crimson)',
            }}
          >
            <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} style={{ color: 'var(--accent-crimson)' }} />
                <h2 className="text-lg font-black uppercase tracking-tight" style={{ color: 'var(--accent-crimson)' }}>{selectedIncident.name}</h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                style={{ color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl" style={{ background: 'var(--accent-gold-dim)', border: '1px solid var(--accent-amber)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Incident Type</div>
                  <div className="text-lg font-black mt-1" style={{ color: 'var(--accent-amber)' }}>{selectedIncident.type}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--accent-gold-dim)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Date & Time</div>
                  <div className="text-[11px] font-black mt-1" style={{ color: 'var(--text-primary)' }}>
                    {formatIncidentTimestamp(selectedIncident.date).split(' ')[0]}
                    <br />
                    {formatIncidentTimestamp(selectedIncident.date).split(' ')[1]}
                  </div>
                </div>
              </div>

            <div className="space-y-6">
              {/* Incident Context */}
              <div className="pl-4 border-l-4 border-white/10 p-4 rounded-r-xl" style={{ background: 'var(--nested-surface)' }}>
                <div className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-60" style={{ color: 'var(--text-muted)' }}>Event Intelligence</div>
                <div className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                   <strong>{selectedIncident.name}</strong> - A <strong>{selectedIncident.type}</strong> event recorded on <span className="font-mono text-[12px] opacity-70">{formatIncidentTimestamp(selectedIncident.date).split(' ')[0]}</span>.
                   <div className="mt-3 flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent-crimson)' }}>
                      <Activity size={14} /> Critical Attention Flagged
                   </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="pl-4 border-l-2 border-white/10">
                <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60" style={{ color: 'var(--text-muted)' }}>Incident Geolocation</div>
                <div className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                  <span className="opacity-50">LAT</span> <strong style={{ color: 'var(--metric-accent)' }}>{selectedIncident.lat?.toFixed(6)}</strong>
                  <span className="mx-3 opacity-20">|</span>
                  <span className="opacity-50">LNG</span> <strong style={{ color: 'var(--metric-accent)' }}>{selectedIncident.lng?.toFixed(6)}</strong>
                </div>
              </div>

              {/* India Impact */}
              <div className="p-4 rounded-xl bg-orange-500/[0.02] border border-orange-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🇮🇳</span>
                  <span className="font-black text-[10px] uppercase tracking-widest text-orange-400">Regional Strategic Impact</span>
                </div>
                <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {selectedIncident.lat > 15 && selectedIncident.lat < 35 && selectedIncident.lng > 60 && selectedIncident.lng < 97 ? (
                    <div className="space-y-2">
                      <div className="font-black text-crimson flex items-center gap-1.5 uppercase text-[10px] tracking-widest" style={{ color: 'var(--accent-crimson)' }}>
                        <Activity size={14} /> High Threat - Immediate Border Proximity
                      </div>
                      <p className="opacity-90">Incident detected within strategic proximity to Indian national borders. Recommend immediate escalation to high-level security briefs.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                       <div className="font-bold text-orange-400 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                          <Globe size={14} /> Geopolitical Relevance Identified
                       </div>
                       <p className="opacity-80">Incident affects regional dynamics. Monitor for second-order supply chain or diplomatic shifts.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
