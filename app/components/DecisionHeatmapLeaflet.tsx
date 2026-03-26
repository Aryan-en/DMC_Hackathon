'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, Tooltip, ZoomControl, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layers, RefreshCcw, Brain, Network, ShieldAlert, TrendingUp, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { apiGet } from '@/app/lib/api';
import { HeatmapPoint, useDecisionHeatmapData } from '@/app/hooks/useDecisionHeatmapData';

type LayerId = 'climate' | 'population' | 'economy' | 'sentiment';

type LayerState = Record<LayerId, boolean>;

type WeightState = Record<LayerId, number>;

type KnowledgeGraphDetails = {
  summary?: {
    connection_count?: number;
    strongest_connection_strength?: number;
  };
  centrality?: {
    degree_centrality?: number;
    pagerank_score?: number;
  };
  risk?: {
    risk_edge_count?: number;
    risk_edges?: Array<{
      source: string;
      target: string;
      relationship: string;
      risk: number;
    }>;
  };
  relationships?: Array<{
    source: string;
    target: string;
    relationship: string;
    strength: number;
  }>;
};

type CompositeHeatmapPoint = HeatmapPoint & { composite: number };

const mapBounds: [[number, number], [number, number]] = [[-85, -180], [85, 180]];

// Country centroids for labeling
const COUNTRY_LABELS = [
  { name: 'Canada', lat: 56.1304, lng: -106.3468 },
  { name: 'USA', lat: 37.0902, lng: -95.7129 },
  { name: 'Mexico', lat: 23.6345, lng: -102.5528 },
  { name: 'Brazil', lat: -14.2350, lng: -51.9253 },
  { name: 'Peru', lat: -9.1900, lng: -75.0152 },
  { name: 'Colombia', lat: 4.5709, lng: -74.2973 },
  { name: 'Argentina', lat: -38.4161, lng: -63.6167 },
  { name: 'Chile', lat: -35.6751, lng: -71.5430 },
  { name: 'UK', lat: 55.3781, lng: -3.4360 },
  { name: 'France', lat: 46.2276, lng: 2.2137 },
  { name: 'Germany', lat: 51.1657, lng: 10.4515 },
  { name: 'Spain', lat: 40.4637, lng: -3.7492 },
  { name: 'Italy', lat: 41.8719, lng: 12.5674 },
  { name: 'Russia', lat: 61.5240, lng: 105.3188 },
  { name: 'Turkey', lat: 38.9637, lng: 35.2433 },
  { name: 'Saudi Arabia', lat: 23.8859, lng: 45.0792 },
  { name: 'Iran', lat: 32.4279, lng: 53.6880 },
  { name: 'India', lat: 20.5937, lng: 78.9629 },
  { name: 'China', lat: 35.8617, lng: 104.1954 },
  { name: 'Japan', lat: 36.2048, lng: 138.2529 },
  { name: 'Australia', lat: -25.2744, lng: 133.7751 },
  { name: 'South Africa', lat: -30.5595, lng: 22.9375 },
  { name: 'Egypt', lat: 26.8206, lng: 30.8025 },
  { name: 'Nigeria', lat: 9.0820, lng: 8.6753 },
  { name: 'Indonesia', lat: -0.7893, lng: 113.9213 },
  { name: 'Thailand', lat: 15.8700, lng: 100.9925 },
  { name: 'Vietnam', lat: 14.0583, lng: 108.2772 },
  { name: 'Pakistan', lat: 30.3753, lng: 69.3451 },
  { name: 'Bangladesh', lat: 23.6850, lng: 90.3563 },
  { name: 'Philippines', lat: 12.8797, lng: 121.7740 },
  { name: 'Kenya', lat: -0.0236, lng: 37.9062 },
  { name: 'Ethiopia', lat: 9.1450, lng: 40.4897 },
  { name: 'Ghana', lat: 7.3697, lng: -5.7874 },
];

function createCountryLabelIcon(name: string) {
  return L.divIcon({
    html: `<div style="
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-shadow: 0 0 3px rgba(2,6,23,0.9);
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
    ">${name}</div>`,
    className: '',
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });
}

const defaultLayers: LayerState = {
  climate: true,
  population: true,
  economy: true,
  sentiment: true,
};

const defaultWeights: WeightState = {
  climate: 0.34,
  population: 0.25,
  economy: 0.27,
  sentiment: 0.14,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function getRiskColor(score: number): string {
  if (score >= 85) return '#7f1d1d';
  if (score >= 70) return '#dc2626';
  if (score >= 50) return '#facc15';
  return '#22c55e';
}

function getRiskLabel(score: number): string {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

function weightNormalize(weights: WeightState): WeightState {
  const total = Math.max(0.0001, Object.values(weights).reduce((sum, w) => sum + w, 0));
  return {
    climate: weights.climate / total,
    population: weights.population / total,
    economy: weights.economy / total,
    sentiment: weights.sentiment / total,
  };
}

function generateAiInsight(point: HeatmapPoint, compositeRisk: number): string {
  const riskBand = getRiskLabel(compositeRisk).toLowerCase();
  const highestDriver = [
    { name: 'climate stress', value: point.climateRisk },
    { name: 'population pressure', value: point.populationDensity },
    { name: 'economic fragility', value: point.economicRisk },
    { name: 'public sentiment volatility', value: point.sentimentRisk },
  ].sort((a, b) => b.value - a.value)[0];

  return `${point.name} is currently in a ${riskBand} composite risk band. The dominant pressure is ${highestDriver.name} (${Math.round(highestDriver.value)}/100), indicating a likely cascade impact across governance, service delivery, and local economic stability if no intervention is taken in the next operational window.`;
}

function buildRecommendations(point: HeatmapPoint, compositeRisk: number): string[] {
  const recommendations: string[] = [];

  if (point.climateRisk >= 70) {
    recommendations.push('Pre-position flood and drought response assets and activate district-level climate contingency cells.');
  }
  if (point.populationDensity >= 70) {
    recommendations.push('Scale social protection and critical supply logistics in high-density corridors to prevent service strain.');
  }
  if (point.economicRisk >= 70) {
    recommendations.push('Prioritize rapid fiscal mitigation for agriculture-exposed sectors and tighten food price monitoring.');
  }
  if (point.sentimentRisk >= 65) {
    recommendations.push('Run proactive public communication with local-language advisory channels to reduce rumor amplification.');
  }
  if (compositeRisk >= 80) {
    recommendations.push('Escalate to inter-ministerial command review with 72-hour risk posture refresh cadence.');
  }

  if (!recommendations.length) {
    recommendations.push('Maintain steady monitoring and keep adaptive response teams on standby for fast risk escalation.');
  }

  return recommendations;
}

function DetailedInsightPanel({
  point,
  onClose,
  kgDetails,
  kgLoading,
}: {
  point: CompositeHeatmapPoint;
  onClose: () => void;
  kgDetails: KnowledgeGraphDetails | null;
  kgLoading: boolean;
}) {
  const compositeRisk = point.composite || 0;
  const riskData = [
    { name: 'Population', value: point.populationDensity, color: '#3b82f6' },
    { name: 'Climate', value: point.climateRisk, color: '#ef4444' },
    { name: 'Economy', value: point.economicRisk, color: '#f59e0b' },
    { name: 'Sentiment', value: point.sentimentRisk, color: '#8b5cf6' },
  ];

  const metricIndicators = [
    { label: 'Population Density', value: point.populationDensity, threshold: 70 },
    { label: 'Climate Risk', value: point.climateRisk, threshold: 70 },
    { label: 'Economic Risk', value: point.economicRisk, threshold: 70 },
    { label: 'Sentiment Volatility', value: point.sentimentRisk, threshold: 65 },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-auto rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(2,8,23,0.95) 0%, rgba(15,23,42,0.9) 100%)', border: '1px solid rgba(30,58,95,0.5)' }}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>{point.name}</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>Comprehensive Risk Analysis & Decision Intelligence</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-500/10"
              style={{ color: '#ef4444' }}
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Risk Score Card */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '8px' }}>Composite Risk Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: getRiskColor(compositeRisk), marginBottom: '4px' }}>
                {compositeRisk.toFixed(1)}/100
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}>{getRiskLabel(compositeRisk)}</div>
              <div style={{ marginTop: '12px', height: '6px', background: 'rgba(148,163,184,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(compositeRisk, 100)}%`,
                    background: getRiskColor(compositeRisk),
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Risk Composition Pie Chart */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '12px' }}>Risk Composition</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-3" style={{ fontSize: '0.72rem' }}>
                {riskData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                      <span style={{ color: '#cbd5e1' }}>{item.name}</span>
                    </div>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Threat Indicators */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '12px' }}>Threat Indicators</div>
              <div className="space-y-2">
                {metricIndicators.map((metric) => {
                  const isHigh = metric.value >= metric.threshold;
                  return (
                    <div key={metric.label} className="flex items-center gap-2">
                      {isHigh ? (
                        <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                      ) : (
                        <CheckCircle size={16} style={{ color: '#22c55e' }} />
                      )}
                      <div className="flex-1">
                        <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>{metric.label}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{metric.value.toFixed(1)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} style={{ color: '#22d3ee' }} />
              <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700 }}>AI Situation Insight</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6 }}>{generateAiInsight(point, compositeRisk)}</p>
          </div>

          {/* Detailed Metrics Bar Chart */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
            <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Risk Components Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '0.75rem' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '0.75rem' }} domain={[0, 100]} />
                <RechartsTooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(56,189,248,0.24)',
                    borderRadius: '6px',
                    color: '#cbd5e1',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
              <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700 }}>Recommended Actions</h3>
            </div>
            <ul className="space-y-2">
              {buildRecommendations(point, compositeRisk).map((recommendation, idx) => (
                <li key={`rec-${idx}`} className="flex gap-3 p-2 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', borderLeft: `3px solid ${idx < 2 ? '#ef4444' : '#f59e0b'}` }}>
                  <div style={{ color: '#f59e0b', marginTop: '2px' }}>•</div>
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Knowledge Graph Context */}
          {kgDetails && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.65)', border: '1px solid rgba(30,58,95,0.55)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Network size={16} style={{ color: '#22d3ee' }} />
                <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700 }}>Knowledge Graph Context</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Connections</div>
                  <div style={{ color: '#93c5fd', fontSize: '1.2rem', fontWeight: 700 }}>{kgDetails?.summary?.connection_count || 0}</div>
                </div>
                <div className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Degree Centrality</div>
                  <div style={{ color: '#93c5fd', fontSize: '1.2rem', fontWeight: 700 }}>{(kgDetails?.centrality?.degree_centrality || 0).toFixed(2)}</div>
                </div>
                <div className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(148,163,184,0.1)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>PageRank</div>
                  <div style={{ color: '#93c5fd', fontSize: '1.2rem', fontWeight: 700 }}>{(kgDetails?.centrality?.pagerank_score || 0).toFixed(3)}</div>
                </div>
              </div>
              {kgDetails?.risk?.risk_edges && kgDetails.risk.risk_edges.length > 0 && (
                <>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px' }}>Top Risk Edges</div>
                  <div className="space-y-2">
                    {kgDetails.risk.risk_edges.slice(0, 5).map((edge, idx) => (
                      <div key={`edge-${idx}`} className="rounded p-2" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 700 }}>{edge.relationship}</div>
                        <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: '2px' }}>{edge.source} ↔ {edge.target}</div>
                        <div style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '2px' }}>Risk Factor: {edge.risk}%</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DecisionHeatmapLeaflet() {
  const { points, loading, error, updatedAt } = useDecisionHeatmapData();

  const [layers, setLayers] = useState<LayerState>(defaultLayers);
  const [weights, setWeights] = useState<WeightState>(defaultWeights);
  const [selectedPoint, setSelectedPoint] = useState<CompositeHeatmapPoint | null>(null);
  const [kgDetails, setKgDetails] = useState<KnowledgeGraphDetails | null>(null);
  const [kgLoading, setKgLoading] = useState(false);
  const [kgError, setKgError] = useState<string | null>(null);

  const normalizedWeights = useMemo(() => weightNormalize(weights), [weights]);

  const activeLayerIds = useMemo(
    () => (Object.entries(layers).filter(([, enabled]) => enabled).map(([id]) => id) as LayerId[]),
    [layers],
  );

  const pointsWithComposite = useMemo(() => {
    const activeWeights = {
      climate: layers.climate ? normalizedWeights.climate : 0,
      population: layers.population ? normalizedWeights.population : 0,
      economy: layers.economy ? normalizedWeights.economy : 0,
      sentiment: layers.sentiment ? normalizedWeights.sentiment : 0,
    };

    const total = Math.max(0.0001, Object.values(activeWeights).reduce((sum, value) => sum + value, 0));

    return points.map((point) => {
      const composite = clamp(
        (point.climateRisk * activeWeights.climate +
          point.populationDensity * activeWeights.population +
          point.economicRisk * activeWeights.economy +
          point.sentimentRisk * activeWeights.sentiment) /
          total,
      );

      return {
        ...point,
        composite,
      };
    });
  }, [points, layers, normalizedWeights]);

  const topRiskPoints = useMemo(
    () => [...pointsWithComposite].sort((a, b) => b.composite - a.composite).slice(0, 8),
    [pointsWithComposite],
  );

  useEffect(() => {
    if (!selectedPoint) {
      setKgDetails(null);
      setKgError(null);
      return;
    }

    let active = true;

    const loadKnowledgeGraphContext = async () => {
      try {
        setKgLoading(true);
        setKgError(null);
        const details = await apiGet<KnowledgeGraphDetails>(`/api/knowledge-graph/node-details?name=${encodeURIComponent(selectedPoint.name)}`);
        if (active) setKgDetails(details);
      } catch (e) {
        if (active) {
          setKgDetails(null);
          setKgError(e instanceof Error ? e.message : 'Failed to load graph context');
        }
      } finally {
        if (active) setKgLoading(false);
      }
    };

    loadKnowledgeGraphContext();
    return () => {
      active = false;
    };
  }, [selectedPoint]);

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(30,58,95,0.45)' }}>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Decision Heatmap</h3>
            <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '4px' }}>
              Multi-layer climate, population, economy, and sentiment risk fusion with geospatial intelligence.
            </p>
          </div>
          <div className="flex items-center gap-2" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
            <RefreshCcw size={13} />
            <span>Real-time refresh: 30s</span>
            <span style={{ color: '#64748b' }}>Updated {new Date(updatedAt).toLocaleTimeString()}</span>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.24)', color: '#fda4af', fontSize: '0.75rem' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-4">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(30,58,95,0.55)', minHeight: '620px' }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={7}
              maxBounds={mapBounds}
              maxBoundsViscosity={0.85}
              style={{ height: '620px', width: '100%', background: '#020617' }}
              zoomControl={false}
            >
              <ZoomControl position="topright" />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />

              {COUNTRY_LABELS.map((country) => (
                <Marker
                  key={country.name}
                  position={[country.lat, country.lng]}
                  icon={createCountryLabelIcon(country.name)}
                  interactive={false}
                  zIndexOffset={-1000}
                />
              ))}

              {pointsWithComposite.map((point) => {
                const riskColor = getRiskColor(point.composite);
                const radius = 6 + point.composite * 0.18;
                return (
                  <CircleMarker
                    key={point.id}
                    center={[point.lat, point.lng]}
                    radius={radius}
                    pathOptions={{
                      color: riskColor,
                      weight: selectedPoint?.id === point.id ? 2 : 1,
                      fillColor: riskColor,
                      fillOpacity: 0.28,
                    }}
                    eventHandlers={{ click: () => setSelectedPoint(point) }}
                  >
                    <Tooltip direction="top" opacity={0.97}>
                      <div style={{ minWidth: '210px' }}>
                        <div style={{ fontWeight: 700 }}>{point.name}</div>
                        <div>Composite Risk: {point.composite.toFixed(1)} ({getRiskLabel(point.composite)})</div>
                        <div>Population Score: {point.populationDensity.toFixed(1)}</div>
                        <div>Climate Score: {point.climateRisk.toFixed(1)}</div>
                        <div>Economic Score: {point.economicRisk.toFixed(1)}</div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: '220px', color: '#0f172a' }}>
                        <div style={{ fontWeight: 700 }}>{point.name}</div>
                        <div>Composite Risk: {point.composite.toFixed(1)}</div>
                        <div>Population: {point.populationBillion ? `${point.populationBillion.toFixed(2)}B` : 'N/A'}</div>
                        <div>GDP: {point.gdpTrillion ? `$${point.gdpTrillion.toFixed(2)}T` : 'N/A'}</div>
                        <div>Unemployment: {point.unemploymentRate ? `${point.unemploymentRate.toFixed(1)}%` : 'N/A'}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          <aside className="space-y-3">
            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.55)', border: '1px solid rgba(30,58,95,0.5)' }}>
              <div className="flex items-center gap-2 mb-3" style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 700 }}>
                <Layers size={14} /> Active Layers
              </div>
              {(['climate', 'population', 'economy', 'sentiment'] as LayerId[]).map((layer) => (
                <label key={layer} className="flex items-center justify-between py-1.5" style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{layer}</span>
                  <input
                    type="checkbox"
                    checked={layers[layer]}
                    onChange={(e) => setLayers((prev) => ({ ...prev, [layer]: e.target.checked }))}
                  />
                </label>
              ))}
              <div className="mt-2" style={{ color: '#64748b', fontSize: '0.7rem' }}>
                Enabled: {activeLayerIds.length}/4
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.55)', border: '1px solid rgba(30,58,95,0.5)' }}>
              <div className="mb-2" style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 700 }}>Composite Weights</div>
              {(['climate', 'population', 'economy', 'sentiment'] as LayerId[]).map((layer) => (
                <div key={`weight-${layer}`} className="mb-2.5">
                  <div className="flex items-center justify-between" style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                    <span>{layer}</span>
                    <span>{(normalizedWeights[layer] * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.7}
                    step={0.01}
                    value={weights[layer]}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [layer]: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(2,8,23,0.55)', border: '1px solid rgba(30,58,95,0.5)' }}>
              <div className="mb-2" style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 700 }}>Top Composite Risks</div>
              <div className="space-y-1.5" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {topRiskPoints.map((point) => (
                  <button
                    key={`rank-${point.id}`}
                    type="button"
                    onClick={() => setSelectedPoint(point)}
                    className="w-full text-left px-2 py-1 rounded"
                    style={{
                      background: selectedPoint?.id === point.id ? 'rgba(56,189,248,0.14)' : 'rgba(15,23,42,0.7)',
                      border: `1px solid ${selectedPoint?.id === point.id ? 'rgba(56,189,248,0.4)' : 'rgba(148,163,184,0.16)'}`,
                    }}
                  >
                    <div style={{ color: '#dbeafe', fontSize: '0.74rem', fontWeight: 600 }}>{point.name}</div>
                    <div style={{ color: '#93c5fd', fontSize: '0.68rem' }}>Score {point.composite.toFixed(1)} • {getRiskLabel(point.composite)}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {selectedPoint && (
        <DetailedInsightPanel
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
          kgDetails={kgDetails}
          kgLoading={kgLoading}
        />
      )}

      {loading && (
        <div className="glass-card rounded-xl p-4" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
          Building geospatial layers and refreshing live risk feeds...
        </div>
      )}
    </div>
  );
}
