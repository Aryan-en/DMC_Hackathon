'use client';

import TopBar from '@/components/TopBar';
import { Filter, RefreshCw, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useKnowledgeGraphMetrics } from '@/app/hooks/useKnowledgeGraphMetrics';

type Relationship = {
  source: string;
  target: string;
  relation: string;
  strength: number;
  url?: string;
  subject_properties?: any;
  object_properties?: any;
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
  layoutType = 'force',
}: {
  relationships: Relationship[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onRefresh: () => void;
  onNodeClick: (nodeId: string) => void;
  highlightedPathChain: string[];
  layoutType?: 'force' | 'circular';
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

    const nodes = Array.from(nodeMap.values()).slice(0, 150);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = relationships.filter((r) => nodeIds.has(r.source) && nodeIds.has(r.target)).slice(0, 300);

    const w = 900;
    const h = 420;
    const cx = w / 2;
    const cy = h / 2;

    const positions = new Map<string, { x: number; y: number }>();
    
    if (layoutType === 'circular') {
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const radius = 175;
        positions.set(n.id, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      });
    } else {
      // Force-directed layout
      nodes.forEach((n, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        positions.set(n.id, {
          x: cx + Math.cos(angle) * 160 + (Math.random() - 0.5) * 40,
          y: cy + Math.sin(angle) * 160 + (Math.random() - 0.5) * 40
        });
      });

      for (let iter = 0; iter < 50; iter++) {
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const p1 = positions.get(nodes[i].id)!;
            const p2 = positions.get(nodes[j].id)!;
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy || 1;
            const force = (iter < 20 ? 8000 : 4000) / distSq;
            const fx = (dx / Math.sqrt(distSq)) * force;
            const fy = (dy / Math.sqrt(distSq)) * force;
            positions.set(nodes[i].id, { x: p1.x + fx, y: p1.y + fy });
            positions.set(nodes[j].id, { x: p2.x - fx, y: p2.y - fy });
          }
        }
        for (const edge of edges) {
          const p1 = positions.get(edge.source)!;
          const p2 = positions.get(edge.target)!;
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.08;
          positions.set(edge.source, { x: p1.x - (dx/dist)*force, y: p1.y - (dy/dist)*force });
          positions.set(edge.target, { x: p2.x + (dx/dist)*force, y: p2.y + (dy/dist)*force });
        }
        for (const n of nodes) {
          const p = positions.get(n.id)!;
          positions.set(n.id, { x: p.x + (cx - p.x) * 0.05, y: p.y + (cy - p.y) * 0.05 });
        }
      }
    }

    const positioned = nodes.map((n) => ({
      ...n,
      ...(positions.get(n.id) || { x: cx, y: cy })
    }));

    const lookup = new Map(positioned.map((n) => [n.id, n]));
    return { positioned, edges, lookup };
  }, [relationships, layoutType]);

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
      className="relative w-full h-full rounded-xl overflow-hidden glass-card"
      style={{ border: '1px solid var(--border-color)', cursor: isPanning ? 'grabbing' : 'grab' }}
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
               <text x={node.x} y={node.y + 18} textAnchor="middle" fill="var(--text-muted)" fontSize={9} style={{ pointerEvents: 'none', fontWeight: 600 }}>
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
  const [layoutType, setLayoutType] = useState<'force' | 'circular'>('force');
  const [isMounted, setIsMounted] = useState(false);
  const nodeAnalysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Entity category system
  const entityCategories = [
    {
      emoji: '',
      label: 'Geopolitical',
      color: '#00d4ff',
      entities: ['Country', 'State/Region', 'City', 'Territory'],
    },
    {
      emoji: '',
      label: 'Actors',
      color: '#8b5cf6',
      entities: ['Leaders', 'Organizations', 'Governments', 'NGOs'],
    },
    {
      emoji: '',
      label: 'Governance',
      color: '#00ff88',
      entities: ['Policies', 'Schemes', 'Treaties', 'Laws'],
    },
    {
      emoji: '',
      label: 'Economy',
      color: '#f59e0b',
      entities: ['GDP', 'Trade', 'Industry', 'Inflation'],
    },
    {
      emoji: '',
      label: 'Environment',
      color: '#06b6d4',
      entities: ['Flood', 'Cyclone', 'Climate Events', 'Disasters'],
    },
    {
      emoji: '',
      label: 'Events',
      color: '#ef4444',
      entities: ['News', 'Agreements', 'Conflicts', 'Incidents'],
    },
    {
      emoji: '',
      label: 'Social',
      color: '#ec4899',
      entities: ['Sentiment', 'Population', 'Public Opinion', 'Culture'],
    },
  ];

  // Relationship types - most important connections
  const relationshipTypes = [
    {
      icon: '',
      type: 'trades_with',
      description: 'Commercial exchange',
      color: '#f59e0b',
      strength: 'economic',
    },
    {
      icon: '',
      type: 'allies_with',
      description: 'Political alliance',
      color: '#00ff88',
      strength: 'diplomatic',
    },
    {
      icon: '',
      type: 'conflicts_with',
      description: 'Active conflict',
      color: '#ef4444',
      strength: 'critical',
    },
    {
      icon: '',
      type: 'affects',
      description: 'Direct influence',
      color: '#8b5cf6',
      strength: 'high',
    },
    {
      icon: '',
      type: 'impacts',
      description: 'Cascading effect',
      color: '#06b6d4',
      strength: 'medium',
    },
    {
      icon: '',
      type: 'located_in',
      description: 'Geographic relation',
      color: '#00d4ff',
      strength: 'structural',
    },
    {
      icon: '',
      type: 'belongs_to',
      description: 'Organizational membership',
      color: '#8b5cf6',
      strength: 'structural',
    },
    {
      icon: '',
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

  // Scroll to Node Analysis section when a node is clicked
  useEffect(() => {
    if (selectedNodeId && nodeAnalysisRef.current) {
      nodeAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedNodeId]);

  const { data, loading, error, reload } = useKnowledgeGraphMetrics({
    source,
    target,
    searchQuery,
    minStrength,
    relationshipLimit: 300,
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
    // Trigger reload to fetch new data with updated query
    reload();
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

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
              <Search size={13} style={{ color: '#475569' }} />
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Search source/target/relation"
                className="bg-transparent text-xs outline-none w-48"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <input value={sourceInput} onChange={(e) => setSourceInput(e.target.value)} placeholder="Path source" className="bg-transparent text-xs outline-none w-28" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{'->'}</span>
              <input value={targetInput} onChange={(e) => setTargetInput(e.target.value)} placeholder="Path target" className="bg-transparent text-xs outline-none w-28" style={{ color: 'var(--text-muted)' }} />
            </div>
            <button 
              onClick={applyQuery} 
              disabled={loading}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all"
              style={{ 
                background: loading ? 'var(--accent-gold-dim)' : 'var(--accent-gold)', 
                border: '1px solid var(--border-color)',
                color: loading ? 'var(--text-muted)' : 'white',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'RUNNING...' : 'EXECUTE INTEL QUERY'}
            </button>
            
            {/* Layout Toggle */}
            <div className="flex p-1 bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-lg">
              <button 
                onClick={() => setLayoutType('force')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${layoutType === 'force' ? 'bg-[#d6b985] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                ORB
              </button>
              <button 
                onClick={() => setLayoutType('circular')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${layoutType === 'circular' ? 'bg-[#d6b985] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                RADIUS
              </button>
            </div>
          </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
              <Filter size={12} style={{ color: 'var(--text-dim)' }} />
              <label className="text-xs" style={{ color: 'var(--text-dim)' }}>Min Strength</label>
              <select 
                value={minStrength} 
                onChange={(e) => {
                  const newValue = Number(e.target.value);
                  setMinStrength(newValue);
                  // Auto-trigger reload when filter changes
                  setTimeout(() => reload(), 50);
                }} 
                className="bg-transparent text-xs outline-none" 
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <option value={0}>0</option>
                <option value={40}>40</option>
                <option value={60}>60</option>
                <option value={80}>80</option>
              </select>
            </div>
            <button 
              onClick={reload}
              disabled={loading}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${loading ? 'animate-spin' : ''}`}
              style={{ 
                background: loading ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)', 
                border: loading ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(139,92,246,0.3)',
                color: '#8b5cf6',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformOrigin: 'center',
              }}
            >
              {loading ? '↻' : '↻ Refresh'}
            </button>
          </div>
        </div>

        {/* Active Query Status */}
        {(source !== 'Russia' || target !== 'EU' || queryInput || minStrength > 0) && (
          <div className="px-4 py-3 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="text-xs" style={{ color: '#00d4ff', fontWeight: 600, marginBottom: '0.25rem' }}>
              Active Query:
            </div>
            <div className="text-xs space-y-1" style={{ color: '#cbd5e1' }}>
              {source && target && (
                <div>
                  <span style={{ color: '#94a3b8' }}>Paths:</span> {source} → {target}
                </div>
              )}
              {queryInput && (
                <div>
                  <span style={{ color: '#94a3b8' }}>Search:</span> {queryInput}
                </div>
              )}
              {minStrength > 0 && (
                <div>
                  <span style={{ color: '#94a3b8' }}>Min Strength:</span> {minStrength}%
                </div>
              )}
              <div style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: '0.5rem' }}>
                Found {data.relationships.length} relationships • {data.paths.length} path(s)
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Nodes', value: totalNodes.toLocaleString(), color: 'var(--accent-steel)' },
            { label: 'Loaded Relationships', value: data.relationships.length.toLocaleString(), color: 'var(--accent-lavender)' },
            { label: 'SHACL Violations', value: data.shaclSummary.total_violations.toLocaleString(), color: data.shaclSummary.total_violations > 0 ? 'var(--accent-orange)' : 'var(--accent-emerald)' },
            { label: 'Conflict Risk Ratio', value: `${data.conflict.risk_ratio}%`, color: 'var(--accent-maroon)' },
            { label: 'Path Depth', value: graphDepth.toString(), color: 'var(--accent-gold)' },
          ].map((card) => (
            <div key={card.label} className="glass-card rounded-xl px-4 py-4 text-center">
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[460px]">
          <div className="lg:col-span-2 h-[400px] lg:h-full">
            {isMounted ? (
              <GraphCanvas
                relationships={data.relationships}
                zoom={zoom}
                onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.12))}
                onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.12))}
                onReset={() => setZoom(1)}
                onRefresh={reload}
                onNodeClick={setSelectedNodeId}
                highlightedPathChain={highlightedPathChain}
                layoutType={layoutType}
              />
            ) : (
              <div className="relative w-full h-full rounded-xl flex items-center justify-center glass-card" style={{ border: '1px solid var(--border-color)' }}>
                <span className="text-xs text-[var(--text-muted)] font-mono animate-pulse">Initializing Neural Overlays...</span>
              </div>
            )}
          </div>

          <div className="glass-card rounded-xl p-5 overflow-hidden flex flex-col">
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Active Relationships</h3>
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
                  className="w-full text-left p-3 rounded-lg group hover:border-[var(--accent-gold)]/40 transition-all"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{`${rel.source} -> ${rel.target}`}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--accent-gold)' }}>{rel.relation}</div>
                    </div>
                    {rel.url && (
                      <a href={rel.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="p-1 hover:text-[var(--accent-gold)]">
                        <ZoomIn size={12} />
                      </a>
                    )}
                  </div>
                  <div className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Strength: {rel.strength}%</div>
                </button>
              ))}
              {!loading && data.relationships.length === 0 && (
                <div className="text-xs" style={{ color: '#64748b' }}>No relationships for the current filter/query.</div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{`Discovered Paths (${source} -> ${target})`}</h3>
            <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{data.paths.length} path(s) · click to highlight</span>
          </div>
          <div className="space-y-3">
            {data.paths.map((path, i) => (
              <button
                key={i}
                onClick={() => setSelectedPathIndex(i)}
                className="w-full text-left p-3 rounded-lg"
                style={{
                  background: selectedPathIndex === i ? 'var(--accent-emerald-dim)' : 'var(--card-bg)',
                  border: selectedPathIndex === i ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                }}
              >
                <div className="text-[10px] mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>Strength {path.strength}% · Hops {path.hops ?? Math.max(0, path.chain.length - 1)}</div>
                <div className="text-xs font-bold" style={{ color: selectedPathIndex === i ? 'var(--accent-emerald)' : 'var(--accent-gold)' }}>{path.chain.join(' -> ')}</div>
              </button>
            ))}
            {!loading && data.paths.length === 0 && (
              <div className="text-xs" style={{ color: '#64748b' }}>No path found for this source/target in current graph sample.</div>
            )}
          </div>
        </div>

        {selectedNodeId && (
          <div ref={nodeAnalysisRef} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Node Analysis: {selectedNodeId}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Detailed node and relationship breakdown</p>
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
              <h4 className="font-semibold text-xs mb-3" style={{ color: '#00d4ff' }}>Node Properties</h4>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-2xs">
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Name</div>
                  <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{selectedNodeId}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Actor Code</div>
                  <div className="font-mono" style={{ color: 'var(--accent-lavender)' }}>
                    {data.relationships.find(r => r.source === selectedNodeId)?.subject_properties?.actor_code || 
                     data.relationships.find(r => r.target === selectedNodeId)?.object_properties?.actor_code || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Confidence</div>
                  <div className="font-mono" style={{ color: 'var(--accent-emerald)' }}>92.4%</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Source Doc</div>
                  <div className="font-mono uppercase" style={{ color: 'var(--accent-gold)' }}>GDELT 2.0</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Trace URL</div>
                  <div className="truncate">
                    {data.relationships.find(r => r.source === selectedNodeId || r.target === selectedNodeId)?.url ? (
                      <a 
                        href={data.relationships.find(r => r.source === selectedNodeId || r.target === selectedNodeId)?.url || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-cyan-500 hover:underline font-mono"
                      >
                        LINK
                      </a>
                    ) : 'NONE'}
                  </div>
                </div>
              </div>
            </div>

            {selectedNodeStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
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

            <h4 className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: 'var(--accent-gold)' }}>Connected Relationships</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedNodeRelationships.length > 0 ? (
                selectedNodeRelationships.map((rel, idx) => {
                  const relType = relationshipTypes.find(rt => rt.type.toLowerCase() === rel.relation.toLowerCase());
                  return (
                    <div key={idx} className="p-3 rounded-lg bg-slate-100/30 dark:bg-slate-900/40" style={{ border: '1px solid var(--border-color)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {rel.source} → {rel.target}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-xs font-semibold" style={{ color: relType?.color || 'var(--accent-steel)' }}>
                              {relType?.icon || '🔗'} {rel.relation}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold" style={{ color: rel.strength >= 80 ? 'var(--accent-maroon)' : rel.strength >= 60 ? 'var(--accent-orange)' : 'var(--accent-emerald)' }}>
                            {rel.strength}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Edge Properties */}
                      <div className="grid grid-cols-3 gap-2 text-[10px] mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Strength</div>
                          <div className="font-mono font-bold" style={{ color: 'var(--accent-orange)' }}>{rel.strength}%</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Source</div>
                          <div className="font-mono truncate uppercase" style={{ color: 'var(--accent-gold)' }}>GDELT 2.0</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)' }}>Trace</div>
                          <div>{rel.url ? <a href={rel.url} target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline">DOC</a> : 'N/A'}</div>
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
