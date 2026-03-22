'use client';

import TopBar from '@/components/TopBar';
import { AlertTriangle, X } from 'lucide-react';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';
import { useState } from 'react';

export default function GeospatialPage() {
  const { data, loading, error } = useGeospatialMetrics();
  const [selectedClimate, setSelectedClimate] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);
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
          <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
            <div className="space-y-2 pr-2">
              {data.hotspots.map((h, idx) => {
                const severityColor = h.severity === 'critical' ? '#ef4444' : h.severity === 'high' ? '#f59e0b' : '#00d4ff';
                return (
                  <div
                    key={`hotspot-${idx}-${h.name}`}
                    className="p-3 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: 'rgba(2,8,23,0.5)',
                      border: severityColor === '#ef4444' ? '1px solid rgba(239,68,68,0.3)' : severityColor === '#f59e0b' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(0,212,255,0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.5)')}
                    onClick={() => setSelectedHotspot(h)}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{h.name}</span>
                      <span
                        className="px-2 py-1 rounded text-xs font-bold uppercase"
                        style={{
                          background: h.severity === 'critical' ? 'rgba(239,68,68,0.15)' : h.severity === 'high' ? 'rgba(245,158,11,0.15)' : 'rgba(0,212,255,0.15)',
                          color: severityColor,
                          letterSpacing: '0.05em',
                        }}
                      >
                        {h.severity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-4 flex-1">
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{h.type}</span>
                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Score: {h.value}</span>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: '#64748b' }}>
                      {h.lat?.toFixed(2)}, {h.lng?.toFixed(2)} <span style={{ marginLeft: '0.5rem' }}>Region: {h.region}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {!loading && data.hotspots.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live hotspots returned by API.</p>}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Climate Indicators</h3>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <div className="space-y-2 pr-2">
                {data.climateRegions.map((r) => {
                  const droughtColor = r.drought === 'CRITICAL' ? '#ef4444' : r.drought === 'HIGH' ? '#f59e0b' : r.drought === 'MODERATE' ? '#3b82f6' : '#10b981';
                  const floodColor = r.flood === 'CRITICAL' ? '#ef4444' : r.flood === 'HIGH' ? '#f59e0b' : '#3b82f6';
                  const cropsRiskColor = r.cropRisk >= 80 ? '#ef4444' : r.cropRisk >= 60 ? '#f59e0b' : r.cropRisk >= 40 ? '#3b82f6' : '#10b981';
                  
                  return (
                    <div
                      key={r.region}
                      className="p-3 rounded-lg transition-all cursor-pointer"
                      style={{
                        background: 'rgba(2,8,23,0.5)',
                        border: '1px solid rgba(51,165,224,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.8)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.5)')}
                      onClick={() => setSelectedClimate(r)}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{r.region}</span>
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>{r.temp}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3" style={{ fontSize: '0.7rem' }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: droughtColor, fontWeight: 600 }}>🏜️ {r.drought}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: floodColor, fontWeight: 600 }}>💧 {r.flood}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: cropsRiskColor, fontWeight: 600 }}>🌾 Risk: {r.cropRisk}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {!loading && data.climateRegions.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live climate indicators returned by API.</p>}
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Recent Incidents</h3>
            <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
              <div className="space-y-2 pr-2">
                {data.incidents.map((i) => (
                  <div
                    key={`${i.name}-${i.date}`}
                    className="flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer"
                    style={{
                      background: 'rgba(2,8,23,0.5)',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.8)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.5)')}
                    onClick={() => setSelectedIncident(i)}
                  >
                    <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '0.2rem' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{ color: '#e2e8f0', fontWeight: 600 }}>{i.name}</div>
                      <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{i.type}</div>
                      <div className="text-xs" style={{ color: '#64748b', marginTop: '0.25rem' }}>{i.lat?.toFixed(2)}, {i.lng?.toFixed(2)}</div>
                    </div>
                    <div className="text-xs" style={{ color: '#64748b', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      {new Date(i.date).toISOString().split('T')[0]} {new Date(i.date).toISOString().split('T')[1].substring(0, 5)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {!loading && data.incidents.length === 0 && <p className="text-xs mt-3" style={{ color: '#64748b' }}>No live incidents returned by API.</p>}
          </div>
        </div>

        {/* Economic Activity Mapping Section */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Economic Activity Mapping</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.economicRegions?.map((region) => (
              <div
                key={region.name}
                className="p-4 rounded-lg transition-all cursor-pointer"
                style={{
                  background: 'rgba(2,8,23,0.5)',
                  border: '1px solid rgba(0,212,255,0.3)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.8)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(2,8,23,0.5)')}
              >
                {/* Header */}
                <div className="mb-3">
                  <div className="text-sm font-bold" style={{ color: '#00d4ff' }}>{region.name}</div>
                  <div className="text-xs mt-2 space-y-1">
                    <div style={{ color: '#e2e8f0' }}>
                      <span style={{ color: '#94a3b8' }}>GDP:</span> <strong>${region.gdp_usd_trillion}T</strong> ({region.gdp_growth_percent}% growth)
                    </div>
                    <div style={{ color: '#e2e8f0' }}>
                      <span style={{ color: '#94a3b8' }}>Population:</span> <strong>{region.population_billion}B</strong>
                    </div>
                    <div style={{ color: '#e2e8f0' }}>
                      <span style={{ color: '#94a3b8' }}>Employment:</span> <strong>{region.employment_rate}%</strong> (Unemployment: {region.unemployment_rate}%)
                    </div>
                  </div>
                </div>

                {/* Industries */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(148,163,184,0.2)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>🏭 Major Industries</div>
                  <div className="space-y-1">
                    {region.major_industries.slice(0, 3).map((industry) => (
                      <div key={industry.name} className="flex items-center justify-between gap-2">
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{industry.name}</span>
                        <div className="flex items-center gap-2">
                          <div
                            style={{
                              width: '40px',
                              height: '4px',
                              background: 'rgba(0,212,255,0.2)',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${industry.percentage}%`,
                                height: '100%',
                                background: '#00d4ff',
                              }}
                            />
                          </div>
                          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{industry.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agriculture Zones */}
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(148,163,184,0.2)' }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>🌾 Key Agricultural Zones</div>
                  <div className="space-y-2">
                    {region.agriculture_zones.map((zone) => (
                      <div key={zone.zone} className="p-2 rounded" style={{ background: 'rgba(16,185,129,0.05)' }}>
                        <div className="text-xs font-bold" style={{ color: '#10b981' }}>{zone.zone}</div>
                        <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                          <span>Countries: {zone.countries.join(', ')}</span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                          <span>Crops: {zone.crops.join(', ')}</span>
                        </div>
                        <div className="text-xs mt-1 flex justify-between">
                          <span style={{ color: '#64748b' }}>Production: {zone.production_million_tons}M tons</span>
                          <span style={{ color: '#64748b' }}>Employment: {zone.employment_percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loading && (!data.economicRegions || data.economicRegions.length === 0) && (
            <p className="text-xs mt-3" style={{ color: '#64748b' }}>No economic activity data available.</p>
          )}
        </div>
      </main>

      {/* Climate Indicators Details Modal */}
      {selectedClimate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedClimate(null)}
        >
          <div
            className="glass-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(2,8,23,0.95)',
              border: '1px solid rgba(51,165,224,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: '#00d4ff' }}>{selectedClimate.region}</h2>
              <button
                onClick={() => setSelectedClimate(null)}
                className="p-1 hover:bg-opacity-20 rounded transition-all"
                style={{ color: '#e2e8f0' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Temperature</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: '#ef4444' }}>{selectedClimate.temp}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(51,165,224,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Crop Risk</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: selectedClimate.cropRisk >= 80 ? '#ef4444' : selectedClimate.cropRisk >= 60 ? '#f59e0b' : '#10b981' }}>{selectedClimate.cropRisk}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(123,31,162,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Drought Level</div>
                  <div className="text-lg font-bold mt-2" style={{ color: selectedClimate.drought === 'CRITICAL' ? '#ef4444' : selectedClimate.drought === 'HIGH' ? '#f59e0b' : selectedClimate.drought === 'MODERATE' ? '#3b82f6' : '#10b981' }}>
                    🏜️ {selectedClimate.drought}
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Flood Risk</div>
                  <div className="text-lg font-bold mt-2" style={{ color: selectedClimate.flood === 'CRITICAL' ? '#ef4444' : selectedClimate.flood === 'HIGH' ? '#f59e0b' : '#3b82f6' }}>
                    💧 {selectedClimate.flood}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.3)', border: '1px solid rgba(148,163,184,0.2)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Summary</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  Region <strong>{selectedClimate.region}</strong> is experiencing {selectedClimate.drought === 'CRITICAL' ? 'critical' : selectedClimate.drought === 'HIGH' ? 'high' : 'moderate'} drought conditions with {selectedClimate.flood === 'CRITICAL' ? 'critical' : selectedClimate.flood === 'HIGH' ? 'high' : 'low'} flood risk. 
                  Current temperature is around <strong>{selectedClimate.temp}</strong> with crop risk at <strong>{selectedClimate.cropRisk}%</strong>. 
                  This region requires immediate monitoring and potential intervention.
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>RISK CLASSIFICATION</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <strong>Drought Level: {selectedClimate.drought}</strong><br/>
                  {selectedClimate.drought === 'CRITICAL' && 'Severe water stress with complete depletion risk. Agricultural productivity severely compromised.'}
                  {selectedClimate.drought === 'HIGH' && 'Substantial water deficit. Crop yields expected to decline significantly.'}
                  {selectedClimate.drought === 'MODERATE' && 'Manageable water stress with potential for adaptation measures.'}
                  {selectedClimate.drought === 'LOW' && 'Adequate water availability. No significant agricultural stress expected.'}
                  <br/><br/>
                  <strong>Flood Risk: {selectedClimate.flood}</strong><br/>
                  {selectedClimate.flood === 'CRITICAL' && 'Severe flooding threat with HIGH probability. Infrastructure damage expected.'}
                  {selectedClimate.flood === 'HIGH' && 'Elevated flooding probability. Substantial property and harvest damage potential.'}
                  {selectedClimate.flood === 'MODERATE' && 'Moderate flooding risk. Some localized damage possible.'}
                  {selectedClimate.flood === 'LOW' && 'Low flooding risk. Minimal expectation of flood-related damage.'}
                  <br/><br/>
                  <strong>Crop Risk: {selectedClimate.cropRisk}%</strong><br/>
                  {selectedClimate.cropRisk >= 80 && 'CRITICAL - Significant crop loss expected. Emergency intervention needed.'}
                  {selectedClimate.cropRisk >= 60 && selectedClimate.cropRisk < 80 && 'HIGH - Substantial yield reduction anticipated. Mitigation strategies urgent.'}
                  {selectedClimate.cropRisk >= 40 && selectedClimate.cropRisk < 60 && 'MODERATE - Notable impact on productivity. Adaptive measures recommended.'}
                  {selectedClimate.cropRisk < 40 && 'LOW - Manageable risk with standard agricultural practices.'}
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ color: '#3b82f6', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>RECOMMENDED DECISIONS & ACTIONS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {selectedClimate.cropRisk >= 80 ? (
                    <>
                      <strong>CRITICAL RESPONSE NEEDED:</strong><br/>
                      1. <strong>Emergency Food Aid</strong> - Deploy immediate food assistance<br/>
                      2. <strong>Irrigation Support</strong> - Provide emergency water infrastructure<br/>
                      3. <strong>Crop Insurance Activation</strong> - Expedite farmer compensation<br/>
                      4. <strong>Alternative Livelihoods</strong> - Initiate income support programs<br/>
                      5. <strong>Early Warning System</strong> - Activate disease/pest monitoring<br/><br/>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Priority: IMMEDIATE (within 48 hours)</span>
                    </>
                  ) : selectedClimate.cropRisk >= 60 ? (
                    <>
                      <strong>ELEVATED INTERVENTIONS:</strong><br/>
                      1. <strong>Drought-Resistant Seeds</strong> - Distribute adapted crop varieties<br/>
                      2. <strong>Water Management</strong> - Improve conservation and efficiency<br/>
                      3. <strong>Soil Protection</strong> - Implement moisture retention techniques<br/>
                      4. <strong>Farmer Training</strong> - Enhance adaptive capacity knowledge<br/>
                      5. <strong>Market Links</strong> - Secure fair prices for alternative crops<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Priority: HIGH (within 1 week)</span>
                    </>
                  ) : selectedClimate.cropRisk >= 40 ? (
                    <>
                      <strong>PREVENTIVE MEASURES:</strong><br/>
                      1. <strong>Soil Health Management</strong> - Organic matter enhancement<br/>
                      2. <strong>Water Harvesting</strong> - Build long-term storage capacity<br/>
                      3. <strong>Crop Diversification</strong> - Reduce climate sensitivity<br/>
                      4. <strong>Extension Services</strong> - Provide technical guidance<br/>
                      5. <strong>Climate Information Services</strong> - Regular weather forecasts<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Priority: MODERATE (ongoing)</span>
                    </>
                  ) : (
                    <>
                      <strong>ROUTINE MANAGEMENT:</strong><br/>
                      1. <strong>Monitoring</strong> - Track seasonal climate patterns<br/>
                      2. <strong>Best Practices</strong> - Promote sustainable agriculture<br/>
                      3. <strong>Planning</strong> - Prepare for potential seasonal shifts<br/>
                      4. <strong>Community Resilience</strong> - Build adaptive capacity<br/>
                      5. <strong>Data Collection</strong> - Maintain baseline climate records<br/><br/>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Priority: STANDARD (periodic review)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(51,165,224,0.1)', border: '1px solid rgba(51,165,224,0.4)' }}>
                <div style={{ color: '#00d4ff', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>🇮🇳 INDIA IMPACT ANALYSIS & BENEFITS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <strong>Climate Zone Relevance:</strong> {selectedClimate.region}<br/><br/>
                  
                  {selectedClimate.drought === 'CRITICAL' && (
                    <>
                      <strong style={{ color: '#ef4444' }}>🌾 INDIA AGRICULTURAL IMPACT - CRITICAL</strong><br/>
                      • <strong>Commodity Prices:</strong> Critical drought regions drive grain/oil price increases globally affecting India's import costs<br/>
                      • <strong>Trade Advantage:</strong> If India's agricultural output is better, export opportunities increase (benefits Indian farmers)<br/>
                      • <strong>Food Security:</strong> Global shortages strengthen India's strategic position as agricultural exporter<br/>
                      • <strong>Technology Export:</strong> Drought-resilient crop technology demand increases (benefits Indian agritech)<br/>
                      • <strong>Migration Pressure:</strong> Climate-stressed populations may seek opportunities in India<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Benefit to India:</span> Strengthen domestic agricultural productivity, explore export markets, develop drought-resistant varieties
                    </>
                  )}
                  
                  {selectedClimate.flood === 'CRITICAL' && (
                    <>
                      <strong style={{ color: '#00d4ff' }}>💧 INDIA WATER SECURITY IMPACT - CRITICAL</strong><br/>
                      • <strong>Water Resource Competition:</strong> Critical flood regions compete for seasonal water resources<br/>
                      • <strong>Hydro Power:</strong> Flood management expertise becomes valuable internationally<br/>
                      • <strong>Agricultural Patterns:</strong> Global food production shifts, affecting India's export opportunities<br/>
                      • <strong>Infrastructure Tech:</strong> Demand for flood management solutions India can provide<br/>
                      • <strong>Regional Cooperation:</strong> Opens dialogue on transboundary water management (benefits India's river basin initiatives)<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Benefit to India:</span> Export water management expertise, develop regional water-sharing agreements, strengthen diplomatic ties
                    </>
                  )}
                  
                  {selectedClimate.cropRisk >= 80 && (
                    <>
                      <strong style={{ color: '#ef4444' }}>📉 INDIA EXPORT OPPORTUNITY - VERY HIGH</strong><br/>
                      • <strong>Food Supply Gap:</strong> Regions with 80%+ crop risk create global food shortage potential<br/>
                      • <strong>Indian Export Boom:</strong> India can increase agricultural exports to fill the gap (rice, wheat, spices, pulses)<br/>
                      • <strong>Price Premium:</strong> Higher global prices benefit Indian farmer income and government revenue<br/>
                      • <strong>Soft Power:</strong> India becomes food security provider, enhancing diplomatic influence<br/>
                      • <strong>Strategic Commodity:</strong> Positions India as reliable supplier for vulnerable regions<br/><br/>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Major Benefit to India:</span> Scale up agricultural exports, negotiate favorable trade deals, increase foreign exchange earnings
                    </>
                  )}
                  
                  {selectedClimate.cropRisk >= 60 && selectedClimate.cropRisk < 80 && (
                    <>
                      <strong style={{ color: '#f59e0b' }}>INDIA MODERATE OPPORTUNITY - MEDIUM</strong><br/>
                      • <strong>Supply Stability:</strong> Regions with 60-80% crop risk need diversified suppliers<br/>
                      • <strong>Partnership Potential:</strong> India can offer technical assistance and agricultural partnerships<br/>
                      • <strong>Market Access:</strong> Opportunity to build long-term agricultural trade relationships<br/>
                      • <strong>Technology Transfer:</strong> Demand for Indian agricultural techniques and knowledge<br/>
                      • <strong>Investment Opportunity:</strong> Joint ventures for climate-resilient agriculture in vulnerable regions<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Benefit to India:</span> Build agricultural partnerships, export technology, develop strategic relationships
                    </>
                  )}

                  {selectedClimate.region?.includes('South Asia') || selectedClimate.region?.includes('Asia') ? (
                    <>
                      <br/><strong style={{ color: '#00d4ff' }}>🌏 REGIONAL RELEVANCE - DIRECT IMPACT ON INDIA</strong><br/>
                      This region is in close proximity to India and directly impacts Indian climate patterns, water availability, and agricultural output.
                    </>
                  ) : (
                    <>
                      <br/><strong style={{ color: '#3b82f6' }}>GLOBAL RELEVANCE - INDIRECT IMPACT ON INDIA</strong><br/>
                      Global climate trends in this region contribute to worldwide climate patterns that eventually affect India's monsoon patterns and agricultural cycles.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Hotspot Details Modal */}
      {selectedHotspot && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedHotspot(null)}
        >
          <div
            className="glass-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(2,8,23,0.95)',
              border: selectedHotspot.severity === 'critical' ? '1px solid rgba(239,68,68,0.4)' : selectedHotspot.severity === 'high' ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(0,212,255,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-bold uppercase"
                  style={{
                    background: selectedHotspot.severity === 'critical' ? 'rgba(239,68,68,0.2)' : selectedHotspot.severity === 'high' ? 'rgba(245,158,11,0.2)' : 'rgba(0,212,255,0.2)',
                    color: selectedHotspot.severity === 'critical' ? '#ef4444' : selectedHotspot.severity === 'high' ? '#f59e0b' : '#00d4ff',
                  }}
                >
                  {selectedHotspot.severity}
                </span>
                <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>{selectedHotspot.name}</h2>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="p-1 hover:bg-opacity-20 rounded transition-all"
                style={{ color: '#e2e8f0' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(148,163,184,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Hotspot Type</div>
                  <div className="text-lg font-bold mt-1" style={{ color: '#00d4ff' }}>{selectedHotspot.type}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Risk Score</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: '#f59e0b' }}>{selectedHotspot.value}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Location Coordinates</div>
                <div className="text-sm font-mono mt-2" style={{ color: '#00d4ff' }}>
                  Latitude: <strong>{selectedHotspot.lat?.toFixed(6)}</strong>
                  <br />
                  Longitude: <strong>{selectedHotspot.lng?.toFixed(6)}</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(51,165,224,0.3)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Geographic Region</div>
                <div className="text-lg font-bold mt-2" style={{ color: '#e2e8f0' }}>{selectedHotspot.region}</div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.3)', border: '1px solid rgba(148,163,184,0.2)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Hotspot Analysis</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <strong>{selectedHotspot.name}</strong> has been classified as a <strong style={{ color: selectedHotspot.severity === 'critical' ? '#ef4444' : selectedHotspot.severity === 'high' ? '#f59e0b' : '#00d4ff' }}>{selectedHotspot.severity.toUpperCase()}</strong> severity hotspot.
                  Located at coordinates ({selectedHotspot.lat?.toFixed(4)}, {selectedHotspot.lng?.toFixed(4)}) in the {selectedHotspot.region} region.
                  <br /><br />
                  Risk Score: <strong>{selectedHotspot.value}</strong> ({selectedHotspot.type})
                  <br /><br />
                  <span style={{ color: selectedHotspot.severity === 'critical' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                    {selectedHotspot.severity === 'critical' ? '🔴 CRITICAL - Immediate intervention required' : selectedHotspot.severity === 'high' ? '🟠 HIGH - Close monitoring recommended' : '🔵 MEDIUM - Ongoing assessment needed'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>CLASSIFICATION REASONING</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {selectedHotspot.severity === 'critical' ? (
                    <>
                      <strong>Why CRITICAL:</strong> Risk score exceeds 85/100 threshold. {selectedHotspot.type} incidents pose immediate threats to civilian populations and infrastructure. Rapid escalation or confirmed active hostilities detected.<br/><br/>
                      <strong>Key Factors:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                        <li>• Acute threat level with immediate impact probability</li>
                        <li>• Dense population centers or critical infrastructure at risk</li>
                        <li>• Active escalation indicators present</li>
                      </ul>
                    </>
                  ) : selectedHotspot.severity === 'high' ? (
                    <>
                      <strong>Why HIGH:</strong> Risk score between 70-84/100. {selectedHotspot.type} situation shows elevated potential for escalation. Significant but less immediate threat profile.<br/><br/>
                      <strong>Key Factors:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                        <li>• Substantial escalation risk if left unchecked</li>
                        <li>• Regional impact potential is significant</li>
                        <li>• Established pattern of recurring incidents</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <strong>Why MEDIUM:</strong> Risk score between 50-69/100. {selectedHotspot.type} situation is monitored but relatively stable. Lower immediate threat with manageable risk profile.<br/><br/>
                      <strong>Key Factors:</strong>
                      <ul style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                        <li>• Controlled situation with ongoing tensions</li>
                        <li>• Localized impact with containment possible</li>
                        <li>• Potential for escalation but not imminent</li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ color: '#3b82f6', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>RECOMMENDED DECISION & ACTIONS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {selectedHotspot.severity === 'critical' ? (
                    <>
                      <strong>IMMEDIATE ACTIONS REQUIRED:</strong><br/>
                      1. <strong>Escalate to Crisis Management Team</strong> - Activate emergency protocols immediately<br/>
                      2. <strong>Deploy Resources</strong> - Position humanitarian aid, security forces, or monitoring assets<br/>
                      3. <strong>Diplomatic Intervention</strong> - Initiate emergency communications with stakeholders<br/>
                      4. <strong>Real-time Monitoring</strong> - 24/7 surveillance and intelligence updates<br/>
                      5. <strong>Population Alert</strong> - Issue warnings to residents in affected areas<br/><br/>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Timeline: Execute within next 6-12 hours</span>
                    </>
                  ) : selectedHotspot.severity === 'high' ? (
                    <>
                      <strong>ELEVATED RESPONSE REQUIRED:</strong><br/>
                      1. <strong>Increase Monitoring Frequency</strong> - Daily intelligence briefings and assessments<br/>
                      2. <strong>Prepare Contingency Plans</strong> - Ready response teams and resources<br/>
                      3. <strong>Stakeholder Engagement</strong> - Regular dialogue with key parties<br/>
                      4. <strong>Capacity Building</strong> - Support local institutions and early warning systems<br/>
                      5. <strong>Media & Public Communication</strong> - Transparent updates to prevent misinformation<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Timeline: Implement within 24-48 hours</span>
                    </>
                  ) : (
                    <>
                      <strong>ROUTINE MONITORING:</strong><br/>
                      1. <strong>Maintain Watch Status</strong> - Regular assessment (weekly or bi-weekly)<br/>
                      2. <strong>Capacity Development</strong> - Support preventive measures and peace-building<br/>
                      3. <strong>Community Engagement</strong> - Strengthen local resilience and dialogue mechanisms<br/>
                      4. <strong>Data Collection</strong> - Gather intelligence on underlying drivers<br/>
                      5. <strong>Coordination</strong> - Regular information sharing with partners<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Timeline: Ongoing assessment and prevention</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'rgba(51,165,224,0.1)', border: '1px solid rgba(51,165,224,0.4)' }}>
                <div style={{ color: '#00d4ff', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>🇮🇳 INDIA IMPACT ANALYSIS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <strong>Regional Proximity to India:</strong> {selectedHotspot.region}<br/>
                  <strong>Distance from Indian Border:</strong> Contextual analysis based on location<br/><br/>
                  
                  {selectedHotspot.region === 'South Asia' || selectedHotspot.region === 'Asia' ? (
                    <>
                      <strong style={{ color: '#ef4444' }}>🔴 DIRECT IMPACT - HIGH RELEVANCE TO INDIA</strong><br/>
                      • <strong>Trade Routes:</strong> Disruption to regional commerce and supply chains<br/>
                      • <strong>Security:</strong> Border security implications and cross-border consequences<br/>
                      • <strong>Refugees/Migration:</strong> Potential influx of displaced persons<br/>
                      • <strong>Bilateral Relations:</strong> Impact on India's diplomatic engagement<br/>
                      • <strong>Economic Impact:</strong> Affects bilateral trade and investment<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Recommendation for India:</span> Close monitoring of border security, preparation for humanitarian assistance, diplomatic engagement for de-escalation
                    </>
                  ) : selectedHotspot.region === 'Middle East' ? (
                    <>
                      <strong style={{ color: '#f59e0b' }}>🟠 INDIRECT IMPACT - MODERATE RELEVANCE TO INDIA</strong><br/>
                      • <strong>Energy Security:</strong> Potential impact on oil/gas supplies to India<br/>
                      • <strong>Indian Diaspora:</strong> Safety of Indians working in the region<br/>
                      • <strong>Geopolitical Alignment:</strong> Implications for India's regional strategy<br/>
                      • <strong>Trade Networks:</strong> Disruption to Indian trade in the region<br/>
                      • <strong>Port Operations:</strong> Effects on Indian shipping routes<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Recommendation for India:</span> Monitor energy markets, ensure evacuation protocols, maintain diplomatic channels
                    </>
                  ) : selectedHotspot.region === 'Europe' ? (
                    <>
                      <strong style={{ color: '#3b82f6' }}>🔵 GLOBAL IMPACT - LOW-MODERATE RELEVANCE TO INDIA</strong><br/>
                      • <strong>Global Markets:</strong> Potential economic spillover effects<br/>
                      • <strong>Technology/Supply Chains:</strong> Impact on tech and manufacturing sectors relevant to India<br/>
                      • <strong>Diplomatic Implications:</strong> Shapes broader international relations<br/>
                      •<strong>Investment Climate:</strong> May affect FDI and international cooperation<br/>
                      • <strong>Migration Patterns:</strong> Could influence European immigration policies<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Recommendation for India:</span> Monitor global economic indicators, maintain strategic partnerships
                    </>
                  ) : (
                    <>
                      <strong style={{ color: '#10b981' }}>🟢 PERIPHERAL IMPACT - LIMITED DIRECT RELEVANCE TO INDIA</strong><br/>
                      • <strong>Global Stability:</strong> General implications for international stability<br/>
                      • <strong>Supply Chain Risks:</strong> Potential indirect effects on trade networks<br/>
                      • <strong>International Relations:</strong> Impact on India's international positioning<br/>
                      • <strong>Climate/Resources:</strong> If applicable, long-term environmental impacts<br/>
                      • <strong>Intelligence Value:</strong> Strategic information for understanding global patterns<br/><br/>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Recommendation for India:</span> Maintain awareness for contingency planning
                    </>
                  )}
                </div>
              </div>            </div>
          </div>
        </div>
      )}

      {/* Recent Incidents Details Modal */}
      {selectedIncident && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="glass-card rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(2,8,23,0.95)',
              border: '1px solid rgba(239,68,68,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} style={{ color: '#ef4444' }} />
                <h2 className="text-lg font-bold" style={{ color: '#ef4444' }}>{selectedIncident.name}</h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 hover:bg-opacity-20 rounded transition-all"
                style={{ color: '#e2e8f0' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Incident Type</div>
                  <div className="text-lg font-bold mt-1" style={{ color: '#f59e0b' }}>{selectedIncident.type}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(148,163,184,0.3)' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Date & Time</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: '#e2e8f0' }}>
                    {new Date(selectedIncident.date).toISOString().split('T')[0]}
                    <br />
                    {new Date(selectedIncident.date).toISOString().split('T')[1].substring(0, 5)}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Location Coordinates</div>
                <div className="text-sm font-mono mt-2" style={{ color: '#00d4ff' }}>
                  Latitude: <strong>{selectedIncident.lat?.toFixed(6)}</strong>
                  <br />
                  Longitude: <strong>{selectedIncident.lng?.toFixed(6)}</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.3)', border: '1px solid rgba(148,163,184,0.2)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Incident Details</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.5' }}>
                  <strong>{selectedIncident.name}</strong> - A {selectedIncident.type} incident has been reported. 
                  This event occurred on {new Date(selectedIncident.date).toISOString().split('T')[0]} at {new Date(selectedIncident.date).toISOString().split('T')[1].substring(0, 5)}, 
                  at coordinates ({selectedIncident.lat?.toFixed(4)}, {selectedIncident.lng?.toFixed(4)}).
                  <br /><br />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>This incident requires immediate attention and monitoring.</span>
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>INCIDENT CLASSIFICATION</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <strong>Type: {selectedIncident.type}</strong><br/>
                  {selectedIncident.type === 'Conflict' && 'Armed conflict or violent confrontation. Poses direct threat to civilian populations and infrastructure. Requires immediate crisis management.'}
                  {selectedIncident.type === 'Geopolitical' && 'High-level political tensions or diplomatic crisis. Could escalate to armed conflict. Strategic intervention critical.'}
                  {selectedIncident.type === 'Humanitarian' && 'Humanitarian crisis affecting vulnerable populations. Requires urgent aid delivery and coordination.'}
                  {selectedIncident.type === 'Economic' && 'Economic crisis or resource scarcity incident. May trigger social unrest or migration.'}
                  {selectedIncident.type === 'Environmental' && 'Natural disaster or environmental emergency. Immediate response needed for life safety and recovery.'}
                  {selectedIncident.type === 'Security' && 'Security incident including terrorism, crime, or organized violence. Requires law enforcement and security coordination.'}
                  
                  <br/><br/>
                  <strong>Severity Assessment: HIGH PRIORITY</strong><br/>
                  This incident has been flagged in the live incidents feed, indicating recent occurrence or ongoing status requiring active monitoring.
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.4)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <div style={{ color: '#3b82f6', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>RECOMMENDED DECISION & ACTIONS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  {selectedIncident.type === 'Conflict' && (
                    <>
                      <strong>IMMEDIATE CRISIS RESPONSE:</strong><br/>
                      1. <strong>Activate Crisis Management</strong> - Emergency operations center engagement<br/>
                      2. <strong>Ceasefire Mediation</strong> - Diplomatic intervention and conflict resolution<br/>
                      3. <strong>Humanitarian Access</strong> - Secure safe passages for aid delivery<br/>
                      4. <strong>Casualty Management</strong> - Medical and emergency response coordination<br/>
                      5. <strong>Evidence Preservation</strong> - Document war crimes and violations<br/><br/>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Timeline: IMMEDIATE (within hours)</span>
                    </>
                  )}
                  {selectedIncident.type === 'Geopolitical' && (
                    <>
                      <strong>DIPLOMATIC ENGAGEMENT:</strong><br/>
                      1. <strong>Escalation Prevention</strong> - High-level diplomatic channels activation<br/>
                      2. <strong>Stakeholder Communication</strong> - Urgent dialogues with parties<br/>
                      3. <strong>International Coordination</strong> - UN and regional body involvement<br/>
                      4. <strong>Contingency Planning</strong> - Prepare military/humanitarian response<br/>
                      5. <strong>Media Management</strong> - Strategic communications to prevent misinformation<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Timeline: URGENT (within 24 hours)</span>
                    </>
                  )}
                  {selectedIncident.type === 'Humanitarian' && (
                    <>
                      <strong>EMERGENCY RESPONSE:</strong><br/>
                      1. <strong>Needs Assessment</strong> - Rapid evaluation of affected population<br/>
                      2. <strong>Aid Mobilization</strong> - Deploy food, shelter, medical supplies<br/>
                      3. <strong>Logistics Coordination</strong> - Establish supply chain and distribution<br/>
                      4. <strong>Health Services</strong> - Medical clinics and disease prevention<br/>
                      5. <strong>Protection Measures</strong> - Safeguard vulnerable groups<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>Timeline: URGENT (within 48 hours)</span>
                    </>
                  )}
                  {!['Conflict', 'Geopolitical', 'Humanitarian'].includes(selectedIncident.type) && (
                    <>
                      <strong>RESPONSE PROTOCOLS:</strong><br/>
                      1. <strong>Situation Assessment</strong> - Gather intelligence and confirm details<br/>
                      2. <strong>Activate Response Team</strong> - Deploy appropriate sector specialists<br/>
                      3. <strong>Stakeholder Notification</strong> - Alert relevant authorities and organizations<br/>
                      4. <strong>Mitigation Measures</strong> - Implement risk reduction strategies<br/>
                      5. <strong>Continuous Monitoring</strong> - Track developments in real-time<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>Timeline: HIGH PRIORITY (within 24-48 hours)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg" style={{ background: 'rgba(51,165,224,0.1)', border: '1px solid rgba(51,165,224,0.4)' }}>
                <div style={{ color: '#00d4ff', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>🇮🇳 INDIA STRATEGIC IMPACT ANALYSIS</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', lineHeight: '1.6' }}>
                  <strong>Incident Type:</strong> {selectedIncident.type}<br/>
                  <strong>Location Risk to India:</strong> Evaluate proximity and relevance<br/><br/>
                  
                  {selectedIncident.lat > 15 && selectedIncident.lat < 35 && selectedIncident.lng > 60 && selectedIncident.lng < 97 ? (
                    <>
                      <strong style={{ color: '#ef4444' }}>🔴 CRITICAL PROXIMITY - DIRECT THREAT TO INDIA</strong><br/>
                      • <strong>Border Security:</strong> This incident is near or adjacent to Indian borders (Pakistan, Bangladesh, Myanmar, Nepal regions)<br/>
                      • <strong>Cross-border Spillover:</strong> HIGH risk of impact on Indian border states and security<br/>
                      • <strong>Population Displacement:</strong> Potential refugee/migration crisis affecting Indian states<br/>
                      • <strong>Bilateral Relations:</strong> Directly impacts India's diplomatic engagement with neighboring countries<br/>
                      • <strong>Military Alert:</strong> May require increased border security readiness<br/>
                      • <strong>Intelligence Priority:</strong> CRITICAL for Indian national security agencies to monitor<br/><br/>
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>India Action:</span> ESCALATE to National Security Council, coordinate with border states, prepare humanitarian response, heighten intelligence monitoring
                    </>
                  ) : selectedIncident.lat > 5 && selectedIncident.lat < 40 && selectedIncident.lng > 40 && selectedIncident.lng < 120 ? (
                    <>
                      <strong style={{ color: '#f59e0b' }}>🟠 REGIONAL RELEVANCE - INDIRECT IMPACT ON INDIA</strong><br/>
                      • <strong>Asian Security Impact:</strong> This incident affects broader Asian geopolitical dynamics relevant to India<br/>
                      • <strong>Trade Routes:</strong> May disrupt supply chains and shipping lanes used by India<br/>
                      • <strong>Indian Diaspora:</strong> May affect safety of Indian nationals in the region<br/>
                      • <strong>Regional Alliances:</strong> Impacts India's strategic partnerships and alignments<br/>
                      • <strong>Economic Impact:</strong> Potential effects on oil prices, minerals, and commodities India imports<br/>
                      • <strong>Geopolitical Alignment:</strong> Implications for India's position in Asian power dynamics<br/><br/>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>India Action:</span> Monitor through diplomatic channels, assess Indian nationals' safety, track economic implications, coordinate regional response with allies
                    </>
                  ) : selectedIncident.lat > -40 && selectedIncident.lat < 60 && selectedIncident.lng > -50 && selectedIncident.lng < 150 ? (
                    <>
                      <strong style={{ color: '#3b82f6' }}>🔵 GLOBAL RELEVANCE - MODERATE IMPACT ON INDIA</strong><br/>
                      • <strong>Major Power Dynamics:</strong> This incident affects global power alignments that impact India<br/>
                      • <strong>Oil & Energy:</strong> May influence global energy prices affecting India's imports<br/>
                      • <strong>International Trade:</strong> Global disruptions may affect Indian export markets<br/>
                      • <strong>Diplomatic Relationships:</strong> Shapes India's relationships with major international powers<br/>
                      • <strong>Technology/Supply Chains:</strong> Could impact technology and manufacturing sectors important to India<br/>
                      • <strong>United Nations/Multilateral Impact:</strong> May influence India's voting positions in international bodies<br/><br/>
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>India Action:</span> Track through foreign ministry, assess economic implications, maintain strategic flexibility, engage in international forums
                    </>
                  ) : (
                    <>
                      <strong style={{ color: '#10b981' }}>🟢 GLOBAL MONITORING - LOW DIRECT IMPACT</strong><br/>
                      • <strong>Awareness:</strong> Monitor for situation development and potential escalation<br/>
                      • <strong>Future Risks:</strong> Track for potential impact if situation expands geographically<br/>
                      • <strong>Intelligence Value:</strong> Gather information on global conflict patterns and trends<br/>
                      • <strong>Contingency Planning:</strong> Prepare responses if situation affects India's interests<br/>
                      • <strong>International Standing:</strong> Position India appropriately in international response<br/>
                      • <strong>Long-term Strategy:</strong> Consider implications for India's foreign policy approach<br/><br/>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>India Action:</span> Maintain situational awareness, continue routine monitoring, prepare contingency plans if needed
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
