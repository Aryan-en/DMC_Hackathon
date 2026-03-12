'use client';

import TopBar from '@/components/TopBar';
import { Share2, GitBranch, Cpu, Search, Filter, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const NODE_TYPES = [
  { type: 'Country', color: '#00d4ff', count: 216 },
  { type: 'Policy', color: '#8b5cf6', count: 1204 },
  { type: 'Event', color: '#ef4444', count: 5621 },
  { type: 'Sector', color: '#f59e0b', count: 342 },
  { type: 'Actor', color: '#00ff88', count: 3892 },
  { type: 'Concept', color: '#64748b', count: 9841 },
];

const RELATIONSHIPS = [
  { source: 'Iran', target: 'Oil Supply Chain', relation: 'CONTROLS', strength: 94 },
  { source: 'NATO', target: 'European Defense Policy', relation: 'GOVERNS', strength: 88 },
  { source: 'Fed Policy', target: 'USD Index', relation: 'INFLUENCES', strength: 97 },
  { source: 'Climate Event', target: 'Crop Yield', relation: 'IMPACTS', strength: 76 },
  { source: 'Social Unrest', target: 'Election Outcome', relation: 'CORRELATES', strength: 71 },
  { source: 'Semiconductor Embargo', target: 'GDP Growth', relation: 'RESTRICTS', strength: 83 },
  { source: 'Central Bank Rate', target: 'Inflation Index', relation: 'REGULATES', strength: 91 },
  { source: 'Migration Policy', target: 'Labor Market', relation: 'SHAPES', strength: 68 },
];

const ONTOLOGY_PATHS = [
  {
    chain: ['Russia', 'Energy Export', 'EU Energy Dependency', 'Industrial Output', 'GDP Contraction'],
    colors: ['#ef4444', '#f59e0b', '#f59e0b', '#00d4ff', '#8b5cf6'],
  },
  {
    chain: ['Fed Rate Hike', 'USD Appreciation', 'EM Capital Flight', 'Currency Crisis', 'IMF Intervention'],
    colors: ['#00d4ff', '#00d4ff', '#f59e0b', '#ef4444', '#8b5cf6'],
  },
  {
    chain: ['Drought', 'Water Scarcity', 'Food Insecurity', 'Social Unrest', 'Political Instability'],
    colors: ['#00ff88', '#f59e0b', '#f59e0b', '#ef4444', '#ef4444'],
  },
];

// Animated graph visualization using SVG
function GraphCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const nodes = [
    { id: 'country', x: 400, y: 160, r: 22, color: '#00d4ff', label: 'Country', count: '216' },
    { id: 'policy', x: 620, y: 100, r: 16, color: '#8b5cf6', label: 'Policy', count: '1.2K' },
    { id: 'event', x: 700, y: 260, r: 20, color: '#ef4444', label: 'Event', count: '5.6K' },
    { id: 'sector', x: 540, y: 320, r: 14, color: '#f59e0b', label: 'Sector', count: '342' },
    { id: 'actor', x: 260, y: 280, r: 18, color: '#00ff88', label: 'Actor', count: '3.9K' },
    { id: 'concept', x: 200, y: 140, r: 12, color: '#64748b', label: 'Concept', count: '9.8K' },
    { id: 'geo', x: 480, y: 230, r: 10, color: '#00d4ff', label: 'Region', count: '847' },
    { id: 'impact', x: 350, y: 350, r: 13, color: '#f59e0b', label: 'Impact', count: '2.1K' },
    { id: 'sentiment', x: 650, y: 380, r: 11, color: '#00ff88', label: 'Sentiment', count: '4.5K' },
    { id: 'treaty', x: 160, y: 340, r: 9, color: '#8b5cf6', label: 'Treaty', count: '318' },
  ];

  const edges = [
    ['country', 'policy'], ['country', 'event'], ['country', 'actor'],
    ['policy', 'event'], ['event', 'sector'], ['event', 'impact'],
    ['actor', 'impact'], ['actor', 'geo'], ['geo', 'sector'],
    ['sector', 'sentiment'], ['concept', 'country'], ['concept', 'actor'],
    ['impact', 'sentiment'], ['treaty', 'actor'], ['treaty', 'country'],
    ['country', 'geo'], ['policy', 'concept'],
  ];

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ background: 'rgba(2,8,23,0.8)', border: '1px solid #1e3a5f' }}>
      {/* Grid background */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
        <defs>
          <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a5f" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#smallGrid)" />
      </svg>

      <svg ref={svgRef} className="absolute inset-0 w-full h-full">
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 z" fill="#1e3a5f" />
          </marker>
          {nodes.map(n => (
            <radialGradient key={n.id} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={n.color} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>

        {/* Edges */}
        {edges.map(([s, t], i) => {
          const src = getNode(s);
          const tgt = getNode(t);
          const isActive = tick % edges.length === i || (tick - 1) % edges.length === i;
          return (
            <g key={`${s}-${t}`}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={isActive ? '#00d4ff' : '#1e3a5f'}
                strokeWidth={isActive ? 1.5 : 0.8}
                strokeOpacity={isActive ? 0.8 : 0.4}
                strokeDasharray={isActive ? '4 3' : 'none'}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map(n => (
          <g key={n.id} className="cursor-pointer">
            {/* Glow halo */}
            <circle cx={n.x} cy={n.y} r={n.r * 2.5} fill={`url(#glow-${n.id})`} />
            {/* Main circle */}
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={`${n.color}22`}
              stroke={n.color}
              strokeWidth={1.5}
              strokeOpacity={0.8}
            />
            {/* Inner dot */}
            <circle cx={n.x} cy={n.y} r={n.r * 0.35} fill={n.color} opacity={0.9} />
            {/* Label */}
            <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="monospace">
              {n.label}
            </text>
            <text x={n.x} y={n.y + n.r + 24} textAnchor="middle" fill={n.color} fontSize={9} fontFamily="monospace" opacity={0.7}>
              {n.count}
            </text>
          </g>
        ))}
      </svg>

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {[ZoomIn, ZoomOut, Maximize2, RefreshCw].map((Icon, i) => (
          <button
            key={i}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}
          >
            <Icon size={13} style={{ color: '#475569' }} />
          </button>
        ))}
      </div>

      {/* Node count overlay */}
      <div
        className="absolute bottom-4 left-4 px-3 py-2 rounded-lg"
        style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f' }}
      >
        <div className="text-xs font-mono" style={{ color: '#00d4ff', fontSize: '0.65rem' }}>
          3,821,402 nodes · 14,294,871 edges
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#334155', fontSize: '0.6rem' }}>
          Viewport: cluster-7 / central-hub
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeGraphPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Knowledge Graph" subtitle="Ontology Core — Neo4j Cluster · RDF/OWL · SHACL Validation" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
              <Search size={13} style={{ color: '#475569' }} />
              <input placeholder="Query entity, relationship, path..." className="bg-transparent text-xs outline-none w-56" style={{ color: '#94a3b8' }} />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f', color: '#64748b' }}>
              <Filter size={12} />
              Filter Ontology
            </button>
          </div>
          <div className="flex items-center gap-4">
            {NODE_TYPES.map(n => (
              <div key={n.type} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: n.color }} />
                <span className="text-xs" style={{ color: '#64748b', fontSize: '0.68rem' }}>{n.type}</span>
                <span className="text-xs font-mono" style={{ color: n.color, fontSize: '0.65rem' }}>({n.count.toLocaleString()})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Nodes', value: '3.82M', color: '#00d4ff', sub: '+14,291 today' },
            { label: 'Relationships', value: '14.29M', color: '#8b5cf6', sub: '+47,832 today' },
            { label: 'Ontology Classes', value: '2,847', color: '#f59e0b', sub: 'RDF/OWL' },
            { label: 'SHACL Violations', value: '0', color: '#00ff88', sub: 'All valid' },
            { label: 'Graph Depth', value: '12', color: '#00d4ff', sub: 'Max traversal' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl px-4 py-4 text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-semibold mb-1" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{s.label}</div>
              <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6" style={{ height: '440px' }}>
          {/* Graph canvas */}
          <div className="col-span-2 h-full">
            <GraphCanvas />
          </div>

          {/* Relationship panel */}
          <div className="glass-card rounded-xl p-5 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Active Relationships</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {RELATIONSHIPS.map((rel, i) => (
                <div key={i} className="p-3 rounded-lg cursor-pointer hover:bg-white/3 transition-colors" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold" style={{ color: '#e2e8f0', fontSize: '0.7rem' }}>{rel.source}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', fontSize: '0.58rem' }}>
                      {rel.relation}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#e2e8f0', fontSize: '0.7rem' }}>{rel.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                      <div className="h-full rounded-full" style={{ width: `${rel.strength}%`, background: rel.strength > 85 ? '#ef4444' : rel.strength > 70 ? '#f59e0b' : '#00d4ff', opacity: 0.7 }} />
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color: '#475569', fontSize: '0.65rem' }}>{rel.strength}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ontology causal paths */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Causal Pathways — Automated Reasoning</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Apache Jena semantic reasoning · Graph traversal depth: 5</p>
            </div>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', fontSize: '0.68rem' }}>
              OWL/RDF Inferred
            </span>
          </div>
          <div className="space-y-4">
            {ONTOLOGY_PATHS.map((path, i) => (
              <div key={i}>
                <div className="flex items-center gap-0">
                  {path.chain.map((node, j) => (
                    <div key={j} className="flex items-center">
                      <div
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                          background: `${path.colors[j]}12`,
                          border: `1px solid ${path.colors[j]}40`,
                          color: path.colors[j],
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {node}
                      </div>
                      {j < path.chain.length - 1 && (
                        <div className="flex items-center mx-1" style={{ color: '#1e3a5f' }}>
                          <div className="w-4 h-px" style={{ background: '#1e3a5f' }} />
                          <span style={{ color: '#334155', fontSize: '0.6rem' }}>▶</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schema validation */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>SHACL Schema Validation</h3>
            <div className="space-y-2 data-table">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left">Shape</th>
                    <th className="text-left">Target Class</th>
                    <th className="text-left">Constraints</th>
                    <th className="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { shape: 'CountryShape', target: 'geo:Country', constraints: 12, status: 'PASS' },
                    { shape: 'PolicyShape', target: 'gov:Policy', constraints: 8, status: 'PASS' },
                    { shape: 'EventShape', target: 'evt:Event', constraints: 15, status: 'PASS' },
                    { shape: 'ActorShape', target: 'act:Actor', constraints: 11, status: 'PASS' },
                    { shape: 'ImpactShape', target: 'imp:Impact', constraints: 7, status: 'PASS' },
                  ].map(row => (
                    <tr key={row.shape}>
                      <td className="font-mono" style={{ color: '#8b5cf6' }}>{row.shape}</td>
                      <td style={{ color: '#64748b' }}>{row.target}</td>
                      <td style={{ color: '#94a3b8' }}>{row.constraints}</td>
                      <td><span className="status-online px-2 py-0.5 rounded text-xs">{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Semantic Reasoning Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Inference Rules Active', value: '847', color: '#00d4ff' },
                { label: 'OWL Axioms', value: '12,441', color: '#8b5cf6' },
                { label: 'Materialized Triples', value: '291M', color: '#f59e0b' },
                { label: 'Query Avg (ms)', value: '14ms', color: '#00ff88' },
                { label: 'Cache Hit Rate', value: '94.2%', color: '#00ff88' },
                { label: 'Daily Inferences', value: '48M', color: '#00d4ff' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#475569', fontSize: '0.68rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
