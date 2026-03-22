'use client';

import TopBar from '@/components/TopBar';
import GeospatialHeatmap from '@/app/components/GeospatialHeatmap';
import { Filter, RefreshCw, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useKnowledgeGraphMetrics } from '@/app/hooks/useKnowledgeGraphMetrics';

type Relationship = {
  source: string;
  target: string;
  relation: string;
  strength: number;
};

function GraphCanvas({
  relationships,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onRefresh,
  onNodeClick,
  highlightedPathChain,
}: {
  relationships: Relationship[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onNodeClick: (nodeId: string) => void;
  highlightedPathChain: string[];
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [isClickingNode, setIsClickingNode] = useState(false);

  const graph = useMemo(() => {
    const nodeMap = new Map<string, { id: string; degree: number }>();

    for (const edge of relationships) {
      if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, { id: edge.source, degree: 0 });
      if (!nodeMap.has(edge.target)) nodeMap.set(edge.target, { id: edge.target, degree: 0 });
      nodeMap.get(edge.source)!.degree += 1;
      nodeMap.get(edge.target)!.degree += 1;
    }

    const nodes = Array.from(nodeMap.values()).slice(0, 40);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = relationships.filter((r) => nodeIds.has(r.source) && nodeIds.has(r.target)).slice(0, 120);

    const w = 900;
    const h = 420;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 150;

    const positioned = nodes.map((n, idx) => {
      const theta = (idx / Math.max(1, nodes.length)) * Math.PI * 2;
      return {
        ...n,
        x: cx + Math.cos(theta) * radius,
        y: cy + Math.sin(theta) * radius,
      };
    });

    const lookup = new Map(positioned.map((n) => [n.id, n]));
    return { positioned, edges, lookup };
  }, [relationships]);

  const highlightedEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < highlightedPathChain.length - 1; i += 1) {
      const a = highlightedPathChain[i]?.toLowerCase();
      const b = highlightedPathChain[i + 1]?.toLowerCase();
      if (a && b) {
        set.add(`${a}=>${b}`);
      }
    }
    return set;
  }, [highlightedPathChain]);

  const highlightedNodeKeys = useMemo(() => {
    return new Set(highlightedPathChain.map((n) => n.toLowerCase()));
  }, [highlightedPathChain]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as Element;
    
    // Don't start panning if clicking on a button
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    
    // Don't start panning if clicking on an SVG element (node or edge)
    if (target.tagName === 'g' || target.tagName === 'circle' || target.tagName === 'text') {
      setIsClickingNode(true);
      return;
    }
    
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragRef.current.active || isClickingNode) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    dragRef.current.active = false;
    setIsPanning(false);
    setIsClickingNode(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="relative w-full h-full rounded-xl overflow-hidden"
      style={{ background: 'rgba(2,8,23,0.8)', border: '1px solid #1e3a5f', cursor: isPanning ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox="0 0 900 420" 
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Detect if a node was clicked
          if ((e.target as Element).closest('g')?.getAttribute('data-node-id')) {
            const nodeId = (e.target as Element).closest('g')?.getAttribute('data-node-id');
            if (nodeId) {
              onNodeClick(nodeId);
              e.stopPropagation();
            }
          }
        }}
      >
        <g transform={`translate(${pan.x} ${pan.y}) translate(450 210) scale(${zoom}) translate(-450 -210)`}>
          {graph.edges.map((edge, i) => {
            const s = graph.lookup.get(edge.source);
            const t = graph.lookup.get(edge.target);
            if (!s || !t) return null;

            const edgeKey = `${edge.source.toLowerCase()}=>${edge.target.toLowerCase()}`;
            const isHighlighted = highlightedEdgeKeys.has(edgeKey);
            return (
              <line
                key={`${edge.source}-${edge.target}-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={isHighlighted ? '#00ff88' : edge.strength >= 80 ? '#ef4444' : edge.strength >= 60 ? '#f59e0b' : '#00d4ff'}
                strokeOpacity={isHighlighted ? 0.95 : 0.45}
                strokeWidth={isHighlighted ? 2.6 : 1.2}
              />
            );
          })}

          {graph.positioned.map((node) => (
            <g 
              key={node.id} 
              data-node-id={node.id}
              style={{ cursor: 'pointer' }} 
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {highlightedNodeKeys.has(node.id.toLowerCase()) && (
                <circle cx={node.x} cy={node.y} r={16} fill="rgba(0,255,136,0.15)" stroke="#00ff88" strokeWidth={1.5} />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={Math.max(4, Math.min(12, 4 + node.degree * 0.6))}
                fill={highlightedNodeKeys.has(node.id.toLowerCase()) ? 'rgba(0,255,136,0.28)' : 'rgba(0,212,255,0.2)'}
                stroke={highlightedNodeKeys.has(node.id.toLowerCase()) ? '#00ff88' : '#00d4ff'}
                strokeWidth={highlightedNodeKeys.has(node.id.toLowerCase()) ? 1.6 : 1.1}
                style={{ transition: 'all 0.2s ease', pointerEvents: 'auto' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as SVGCircleElement).setAttribute('r', String(Math.max(6, Math.min(14, 6 + node.degree * 0.6))));
                  (e.currentTarget as SVGCircleElement).setAttribute('stroke-width', '2');
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as SVGCircleElement).setAttribute('r', String(Math.max(4, Math.min(12, 4 + node.degree * 0.6))));
                  (e.currentTarget as SVGCircleElement).setAttribute('stroke-width', highlightedNodeKeys.has(node.id.toLowerCase()) ? '1.6' : '1.1');
                }}
              />
              <text x={node.x} y={node.y + 18} textAnchor="middle" fill="#94a3b8" fontSize={9} style={{ pointerEvents: 'none' }}>
                {node.id.length > 14 ? `${node.id.slice(0, 12)}...` : node.id}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 50, pointerEvents: 'auto' }}>
        <button 
          type="button"
          onClick={onZoomIn} 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95" 
          style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f', cursor: 'pointer', pointerEvents: 'auto' }}
          title="Zoom In (⌘+)"
        >
          <ZoomIn size={13} style={{ color: '#00d4ff' }} />
        </button>
        <button 
          type="button"
          onClick={onZoomOut} 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95" 
          style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f', cursor: 'pointer', pointerEvents: 'auto' }}
          title="Zoom Out (⌘-)"
        >
          <ZoomOut size={13} style={{ color: '#00d4ff' }} />
        </button>
        <button 
          type="button"
          onClick={onReset} 
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95" 
          style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f', cursor: 'pointer', pointerEvents: 'auto' }}
          title="Reset Zoom (⌘0)"
        >
          <RefreshCw size={13} style={{ color: '#00d4ff' }} />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.9)', border: '1px solid #1e3a5f' }}>
        <div className="text-xs font-mono" style={{ color: '#00d4ff' }}>
          {graph.positioned.length.toLocaleString()} nodes · {graph.edges.length.toLocaleString()} edges
        </div>
      </div>
    </div>
  );
}

export default function KnowledgeGraphPage() {
  const [queryInput, setQueryInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceInput, setSourceInput] = useState('Russia');
  const [targetInput, setTargetInput] = useState('EU');
  const [source, setSource] = useState('Russia');
  const [target, setTarget] = useState('EU');
  const [minStrength, setMinStrength] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number>(-1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Entity category system
  const entityCategories = [
    {
      emoji: '🌍',
      label: 'Geopolitical',
      color: '#00d4ff',
      entities: ['Country', 'State/Region', 'City', 'Territory'],
    },
    {
      emoji: '👤',
      label: 'Actors',
      color: '#8b5cf6',
      entities: ['Leaders', 'Organizations', 'Governments', 'NGOs'],
    },
    {
      emoji: '📜',
      label: 'Governance',
      color: '#00ff88',
      entities: ['Policies', 'Schemes', 'Treaties', 'Laws'],
    },
    {
      emoji: '📊',
      label: 'Economy',
      color: '#f59e0b',
      entities: ['GDP', 'Trade', 'Industry', 'Inflation'],
    },
    {
      emoji: '🌦️',
      label: 'Environment',
      color: '#06b6d4',
      entities: ['Flood', 'Cyclone', 'Climate Events', 'Disasters'],
    },
    {
      emoji: '⚡',
      label: 'Events',
      color: '#ef4444',
      entities: ['News', 'Agreements', 'Conflicts', 'Incidents'],
    },
    {
      emoji: '🧠',
      label: 'Social',
      color: '#ec4899',
      entities: ['Sentiment', 'Population', 'Public Opinion', 'Culture'],
    },
  ];

  // Relationship types - most important connections 🔥
  const relationshipTypes = [
    {
      icon: '💼',
      type: 'trades_with',
      description: 'Commercial exchange',
      color: '#f59e0b',
      strength: 'economic',
    },
    {
      icon: '🤝',
      type: 'allies_with',
      description: 'Political alliance',
      color: '#00ff88',
      strength: 'diplomatic',
    },
    {
      icon: '⚔️',
      type: 'conflicts_with',
      description: 'Active conflict',
      color: '#ef4444',
      strength: 'critical',
    },
    {
      icon: '🔄',
      type: 'affects',
      description: 'Direct influence',
      color: '#8b5cf6',
      strength: 'high',
    },
    {
      icon: '📈',
      type: 'impacts',
      description: 'Cascading effect',
      color: '#06b6d4',
      strength: 'medium',
    },
    {
      icon: '📍',
      type: 'located_in',
      description: 'Geographic relation',
      color: '#00d4ff',
      strength: 'structural',
    },
    {
      icon: '🏛️',
      type: 'belongs_to',
      description: 'Organizational membership',
      color: '#8b5cf6',
      strength: 'structural',
    },
    {
      icon: '💰',
      type: 'invests_in',
      description: 'Financial investment',
      color: '#f59e0b',
      strength: 'economic',
    },
  ];

  // Handle keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          setZoom((z) => Math.min(2.2, z + 0.12));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom((z) => Math.max(0.5, z - 0.12));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { data, loading, error, reload } = useKnowledgeGraphMetrics({
    source,
    target,
    searchQuery,
    minStrength,
    relationshipLimit: 120,
    depth: 5,
    maxPaths: 4,
  });

  const totalNodes = data.nodeTypes.reduce((acc, n) => acc + n.count, 0);
  const graphDepth = data.paths.length ? Math.max(...data.paths.map((p) => p.hops ?? Math.max(0, p.chain.length - 1))) : 0;
  const highlightedPathChain = selectedPathIndex >= 0 ? (data.paths[selectedPathIndex]?.chain ?? []) : [];

  // Get relationships for selected node
  const selectedNodeRelationships = selectedNodeId 
    ? data.relationships.filter(
        (rel) => rel.source.toLowerCase() === selectedNodeId.toLowerCase() || rel.target.toLowerCase() === selectedNodeId.toLowerCase()
      )
    : [];

  const selectedNodeStats = selectedNodeId
    ? {
        incomingConnections: data.relationships.filter((rel) => rel.target.toLowerCase() === selectedNodeId.toLowerCase()).length,
        outgoingConnections: data.relationships.filter((rel) => rel.source.toLowerCase() === selectedNodeId.toLowerCase()).length,
        avgStrength: selectedNodeRelationships.length > 0 ? (selectedNodeRelationships.reduce((acc, r) => acc + r.strength, 0) / selectedNodeRelationships.length).toFixed(1) : '0',
      }
    : null;

  useEffect(() => {
    if (data.paths.length === 0) {
      setSelectedPathIndex(-1);
      return;
    }
    if (selectedPathIndex >= data.paths.length) {
      setSelectedPathIndex(0);
    }
  }, [data.paths, selectedPathIndex]);

  const applyQuery = () => {
    setSearchQuery(queryInput.trim());
    setSource(sourceInput.trim() || 'Russia');
    setTarget(targetInput.trim() || 'EU');
    setSelectedPathIndex(-1);
  };

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Knowledge Graph" subtitle="Interactive explorer with live pathing, SHACL summaries, and relationship filtering" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}>
            Live knowledge graph data unavailable: {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
              <Search size={13} style={{ color: '#475569' }} />
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search source/target/relation"
                className="bg-transparent text-xs outline-none w-48"
                style={{ color: '#94a3b8' }}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
              <input value={sourceInput} onChange={(e) => setSourceInput(e.target.value)} placeholder="Path source" className="bg-transparent text-xs outline-none w-28" style={{ color: '#94a3b8' }} />
              <span className="text-xs" style={{ color: '#334155' }}>{'->'}</span>
              <input value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="Path target" className="bg-transparent text-xs outline-none w-28" style={{ color: '#94a3b8' }} />
            </div>
            <button onClick={applyQuery} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
              Run Query
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
              <Filter size={12} style={{ color: '#64748b' }} />
              <label className="text-xs" style={{ color: '#64748b' }}>Min Strength</label>
              <select value={minStrength} onChange={(e) => setMinStrength(Number(e.target.value))} className="bg-transparent text-xs outline-none" style={{ color: '#94a3b8' }}>
                <option value={0}>0</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={80}>80</option>
              </select>
            </div>
            <button onClick={reload} className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Nodes', value: totalNodes.toLocaleString(), color: '#00d4ff' },
            { label: 'Loaded Relationships', value: data.relationships.length.toLocaleString(), color: '#8b5cf6' },
            { label: 'SHACL Violations', value: data.shaclSummary.total_violations.toLocaleString(), color: data.shaclSummary.total_violations > 0 ? '#f59e0b' : '#00ff88' },
            { label: 'Conflict Risk Ratio', value: `${data.conflict.risk_ratio}%`, color: '#ef4444' },
            { label: 'Path Depth', value: graphDepth.toString(), color: '#00d4ff' },
          ].map((card) => (
            <div key={card.label} className="glass-card rounded-xl px-4 py-4 text-center">
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6" style={{ height: '460px' }}>
          <div className="col-span-2 h-full">
            <GraphCanvas
              relationships={data.relationships}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.12))}
              onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.12))}
              onReset={() => setZoom(1)}
              onRefresh={reload}
              onNodeClick={setSelectedNodeId}
              highlightedPathChain={highlightedPathChain}
            />
          </div>

          <div className="glass-card rounded-xl p-5 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Active Relationships</h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {data.relationships.map((rel, idx) => (
                <button
                  key={`${rel.source}-${rel.target}-${idx}`}
                  onClick={() => {
                    setSourceInput(rel.source);
                    setTargetInput(rel.target);
                    setSource(rel.source);
                    setTarget(rel.target);
                    setSelectedPathIndex(-1);
                  }}
                  className="w-full text-left p-3 rounded-lg"
                  style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}
                >
                  <div className="text-xs" style={{ color: '#e2e8f0' }}>{`${rel.source} -> ${rel.target}`}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#00d4ff' }}>{rel.relation}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Strength: {rel.strength}%</div>
                </button>
              ))}
              {!loading && data.relationships.length === 0 && (
                <div className="text-xs" style={{ color: '#64748b' }}>No relationships for the current filter/query.</div>
              )}
            </div>
          </div>
        </div>

        {/* Geospatial Heatmap Section */}
        <div className="glass-card rounded-xl overflow-hidden flex flex-col" style={{ height: '600px', border: '2px solid rgba(0,212,255,0.2)' }}>
          <GeospatialHeatmap onRegionClick={(region) => {
            console.log('Region clicked:', region);
          }} />
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Entity Categories</h3>
            <span className="text-xs" style={{ color: '#64748b' }}>{entityCategories.length} categories</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {entityCategories.map((category, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg text-center cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: `rgba(${parseInt(category.color.slice(1, 3), 16)}, ${parseInt(category.color.slice(3, 5), 16)}, ${parseInt(category.color.slice(5, 7), 16)}, 0.08)`,
                  border: `1px solid ${category.color}33`,
                }}
              >
                <div className="text-2xl mb-2">{category.emoji}</div>
                <div className="text-xs font-semibold mb-2" style={{ color: category.color }}>
                  {category.label}
                </div>
                <div className="text-2xs space-y-1">
                  {category.entities.map((entity, eidx) => (
                    <div key={eidx} style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                      {entity}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {data.nodeTypes.length > 0 && (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Node Type Distribution</h3>
              <span className="text-xs" style={{ color: '#64748b' }}>Current graph composition</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {data.nodeTypes.map((nodeType, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg"
                  style={{
                    background: `rgba(${parseInt(nodeType.color.slice(1, 3), 16)}, ${parseInt(nodeType.color.slice(3, 5), 16)}, ${parseInt(nodeType.color.slice(5, 7), 16)}, 0.08)`,
                    border: `1px solid ${nodeType.color}33`,
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: nodeType.color }}>
                    {nodeType.type}
                  </div>
                  <div className="text-2xl font-bold mt-2" style={{ color: nodeType.color }}>
                    {nodeType.count}
                  </div>
                  <div className="text-2xs mt-2" style={{ color: '#94a3b8' }}>
                    {((nodeType.count / totalNodes) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}> Entity Relationships</h3>
            <span className="text-xs" style={{ color: '#64748b' }}>Most important connections</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
            {relationshipTypes.map((rel, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  background: `${rel.color}08`,
                  border: `1px solid ${rel.color}40`,
                }}
              >
                <div className="text-2xl mb-2">{rel.icon}</div>
                <div className="text-xs font-semibold mb-1" style={{ color: rel.color }}>
                  {rel.type}
                </div>
                <div className="text-2xs mb-2" style={{ color: '#94a3b8' }}>
                  {rel.description}
                </div>
                <div
                  className="text-2xs px-2 py-1 rounded-full text-center"
                  style={{
                    background: `${rel.color}20`,
                    color: rel.color,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                  }}
                >
                  {rel.strength}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{`Discovered Paths (${source} -> ${target})`}</h3>
            <span className="text-xs" style={{ color: '#64748b' }}>{data.paths.length} path(s) · click to highlight</span>
          </div>
          <div className="space-y-3">
            {data.paths.map((path, i) => (
              <button
                key={i}
                onClick={() => setSelectedPathIndex(i)}
                className="w-full text-left p-3 rounded-lg"
                style={{
                  background: selectedPathIndex === i ? 'rgba(0,255,136,0.08)' : 'rgba(2,8,23,0.5)',
                  border: selectedPathIndex === i ? '1px solid rgba(0,255,136,0.45)' : '1px solid rgba(30,58,95,0.4)',
                }}
              >
                <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>Strength {path.strength}% · Hops {path.hops ?? Math.max(0, path.chain.length - 1)}</div>
                <div className="text-xs" style={{ color: selectedPathIndex === i ? '#00ff88' : '#00d4ff' }}>{path.chain.join(' -> ')}</div>
              </button>
            ))}
            {!loading && data.paths.length === 0 && (
              <div className="text-xs" style={{ color: '#64748b' }}>No path found for this source/target in current graph sample.</div>
            )}
          </div>
        </div>

        {selectedNodeId && (
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>📊 Node Analysis: {selectedNodeId}</h3>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>Detailed node and relationship breakdown</p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>

            {/* Node Properties */}
            <div className="mb-5 p-4 rounded-lg" style={{ background: 'rgba(30,58,95,0.3)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <h4 className="font-semibold text-xs mb-3" style={{ color: '#00d4ff' }}>🔍 Node Properties</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-2xs">
                <div>
                  <div style={{ color: '#94a3b8' }}>Name</div>
                  <div className="font-mono" style={{ color: '#e2e8f0' }}>{selectedNodeId}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Type</div>
                  <div className="font-mono" style={{ color: '#8b5cf6' }}>Entity</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Timestamp</div>
                  <div className="font-mono" style={{ color: '#00ff88' }}>2026-03-22</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Source</div>
                  <div className="font-mono" style={{ color: '#f59e0b' }}>Knowledge Graph</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8' }}>Confidence</div>
                  <div className="font-mono" style={{ color: '#06b6d4' }}>95%</div>
                </div>
              </div>
            </div>

            {selectedNodeStats && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>Incoming Connections</div>
                  <div className="text-lg font-bold" style={{ color: '#00d4ff' }}>{selectedNodeStats.incomingConnections}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>Outgoing Connections</div>
                  <div className="text-lg font-bold" style={{ color: '#8b5cf6' }}>{selectedNodeStats.outgoingConnections}</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>Avg Connection Strength</div>
                  <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{selectedNodeStats.avgStrength}%</div>
                </div>
              </div>
            )}

            <h4 className="font-semibold text-xs mb-3" style={{ color: '#c4cdd8' }}>🔥 Connected Relationships</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedNodeRelationships.length > 0 ? (
                selectedNodeRelationships.map((rel, idx) => {
                  const relType = relationshipTypes.find(rt => rt.type.toLowerCase() === rel.relation.toLowerCase());
                  return (
                    <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.6)', border: '1px solid rgba(30,58,95,0.5)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-xs font-medium" style={{ color: '#e2e8f0' }}>
                            {rel.source} → {rel.target}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs font-semibold" style={{ color: relType?.color || '#00d4ff' }}>
                              {relType?.icon || '🔗'} {rel.relation}
                            </div>
                            {relType && (
                              <div
                                className="text-2xs px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: `${relType.color}20`,
                                  color: relType.color,
                                  fontWeight: 600,
                                }}
                              >
                                {relType.strength}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono" style={{ color: rel.strength >= 80 ? '#ef4444' : rel.strength >= 60 ? '#f59e0b' : '#00ff88' }}>
                            {rel.strength}%
                          </div>
                          <div className="w-16 h-1 rounded-full mt-1" style={{ background: 'rgba(30,58,95,0.5)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${rel.strength}%`,
                                background: rel.strength >= 80 ? '#ef4444' : rel.strength >= 60 ? '#f59e0b' : '#00ff88',
                                opacity: 0.7,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Edge Properties */}
                      <div className="grid grid-cols-3 gap-2 text-2xs mt-2 pt-2 border-t border-rgba(30,58,95,0.3)">
                        <div>
                          <div style={{ color: '#94a3b8' }}>Strength</div>
                          <div className="font-mono" style={{ color: '#f59e0b' }}>{rel.strength}%</div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8' }}>Date</div>
                          <div className="font-mono" style={{ color: '#06b6d4' }}>
                            {rel.date || '2026-03-22'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8' }}>Impact</div>
                          <div className="font-mono" style={{ color: '#ec4899' }}>
                            {rel.impact || 'High'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs" style={{ color: '#64748b' }}>No relationships found for this node.</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
