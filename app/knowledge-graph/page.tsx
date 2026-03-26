'use client';

import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import { getSafeExternalUrl } from '@/app/lib/source-links';
import { AlertTriangle, Filter, GitBranch, Network, RefreshCw, Route, Search, ShieldAlert, ZoomIn, ZoomOut } from 'lucide-react';
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

type PathEntry = {
  chain: string[];
  strength: number;
  hops?: number;
};

type NodeStats = {
  incomingConnections: number;
  outgoingConnections: number;
  avgStrength: string;
};

type Category = {
  label: string;
  color: string;
  entities: string[];
};

type RelationshipType = {
  type: string;
  description: string;
  color: string;
  strength: string;
};

type QuerySuggestion = {
  value: string;
  score: number;
};

const ENTITY_CATEGORIES: Category[] = [
  { label: 'Geopolitical', color: '#14b8ff', entities: ['Country', 'State/Region', 'City', 'Territory'] },
  { label: 'Actors', color: '#6ea8ff', entities: ['Leaders', 'Organizations', 'Governments', 'NGOs'] },
  { label: 'Governance', color: '#2ed7b3', entities: ['Policies', 'Schemes', 'Treaties', 'Laws'] },
  { label: 'Economy', color: '#ffb662', entities: ['GDP', 'Trade', 'Industry', 'Inflation'] },
  { label: 'Environment', color: '#53d3ff', entities: ['Flood', 'Cyclone', 'Climate Events', 'Disasters'] },
  { label: 'Events', color: '#ff8a8a', entities: ['News', 'Agreements', 'Conflicts', 'Incidents'] },
  { label: 'Social', color: '#7dc4ff', entities: ['Sentiment', 'Population', 'Public Opinion', 'Culture'] },
];

const RELATIONSHIP_TYPES: RelationshipType[] = [
  { type: 'trades_with', description: 'Commercial exchange', color: '#ffb662', strength: 'economic' },
  { type: 'allies_with', description: 'Political alliance', color: '#2ed7b3', strength: 'diplomatic' },
  { type: 'conflicts_with', description: 'Active conflict', color: '#ff8a8a', strength: 'critical' },
  { type: 'affects', description: 'Direct influence', color: '#7dc4ff', strength: 'high' },
  { type: 'impacts', description: 'Cascading effect', color: '#53d3ff', strength: 'medium' },
  { type: 'located_in', description: 'Geographic relation', color: '#14b8ff', strength: 'structural' },
  { type: 'belongs_to', description: 'Organizational membership', color: '#6ea8ff', strength: 'structural' },
  { type: 'invests_in', description: 'Financial investment', color: '#ffb662', strength: 'economic' },
];

function buildNGramVector(input: string, n = 3): Map<string, number> {
  const normalized = input.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const value = ` ${normalized} `;
  const vector = new Map<string, number>();

  if (!normalized) return vector;
  if (value.length <= n) {
    vector.set(value, 1);
    return vector;
  }

  for (let i = 0; i <= value.length - n; i += 1) {
    const gram = value.slice(i, i + n);
    vector.set(gram, (vector.get(gram) ?? 0) + 1);
  }

  return vector;
}

function cosineSimilarity(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0;

  const va = buildNGramVector(a);
  const vb = buildNGramVector(b);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  va.forEach((countA, gram) => {
    normA += countA * countA;
    dot += countA * (vb.get(gram) ?? 0);
  });

  vb.forEach((countB) => {
    normB += countB * countB;
  });

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

function GraphCanvas({
  relationships,
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onNodeClick,
  highlightedPathChain,
  layoutType = 'force',
}: {
  relationships: Relationship[];
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onNodeClick: (nodeId: string) => void;
  highlightedPathChain: string[];
  layoutType?: 'force' | 'circular';
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [isClickingNode, setIsClickingNode] = useState(false);
  const viewWidth = 900;
  const viewHeight = 420;
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;

  const graph = useMemo(() => {
    const nodeMap = new Map<string, { id: string; degree: number }>();

    for (const edge of relationships) {
      if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, { id: edge.source, degree: 0 });
      if (!nodeMap.has(edge.target)) nodeMap.set(edge.target, { id: edge.target, degree: 0 });
      nodeMap.get(edge.source)!.degree += 1;
      nodeMap.get(edge.target)!.degree += 1;
    }

    const nodes = Array.from(nodeMap.values())
      .sort((a, b) => b.degree - a.degree)
      .slice(0, layoutType === 'circular' ? 70 : 110);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = relationships.filter((r) => nodeIds.has(r.source) && nodeIds.has(r.target)).slice(0, 300);

    const w = viewWidth;
    const h = viewHeight;
    const cx = w / 2;
    const cy = h / 2;
    const paddingX = layoutType === 'circular' ? 150 : 40;
    const paddingY = layoutType === 'circular' ? 120 : 32;

    const positions = new Map<string, { x: number; y: number }>();

    if (layoutType === 'circular') {
      const radius = Math.max(110, Math.min(w / 2 - paddingX, h / 2 - paddingY));
      nodes.forEach((n, i) => {
        const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
        positions.set(n.id, {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        });
      });
    } else {
      nodes.forEach((n, i) => {
        const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
        positions.set(n.id, {
          x: cx + Math.cos(angle) * (160 - paddingX) + (Math.random() - 0.5) * 40,
          y: cy + Math.sin(angle) * (160 - paddingY) + (Math.random() - 0.5) * 40,
        });
      });

      for (let iter = 0; iter < 50; iter += 1) {
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
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
          positions.set(edge.source, { x: p1.x - (dx / dist) * force, y: p1.y - (dy / dist) * force });
          positions.set(edge.target, { x: p2.x + (dx / dist) * force, y: p2.y + (dy / dist) * force });
        }

        for (const n of nodes) {
          const p = positions.get(n.id)!;
          positions.set(n.id, { x: p.x + (cx - p.x) * 0.05, y: p.y + (cy - p.y) * 0.05 });
        }
      }
    }

    const positioned = nodes.map((n) => ({
      ...n,
      ...(positions.get(n.id) || { x: cx, y: cy }),
    }));

    const lookup = new Map(positioned.map((n) => [n.id, n]));
    return { positioned, edges, lookup };
  }, [relationships, layoutType, viewWidth, viewHeight]);

  const highlightedEdgeKeys = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < highlightedPathChain.length - 1; i += 1) {
      const a = highlightedPathChain[i]?.toLowerCase();
      const b = highlightedPathChain[i + 1]?.toLowerCase();
      if (a && b) set.add(`${a}=>${b}`);
    }
    return set;
  }, [highlightedPathChain]);

  const highlightedNodeKeys = useMemo(() => new Set(highlightedPathChain.map((n) => n.toLowerCase())), [highlightedPathChain]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as Element;

    if (target.tagName === 'BUTTON' || target.closest('button')) return;

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
      className="relative w-full h-full rounded-xl overflow-hidden kg-canvas"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 900 420"
        preserveAspectRatio="xMidYMid meet"
        style={{ pointerEvents: 'auto', background: 'var(--card-bg)' }}
      >
        <g transform={`translate(${pan.x} ${pan.y}) translate(450 210) scale(${zoom}) translate(-450 -210)`}>
          {graph.edges.map((edge, i) => {
            const s = graph.lookup.get(edge.source);
            const t = graph.lookup.get(edge.target);
            if (!s || !t) return null;

            const edgeKey = `${edge.source.toLowerCase()}=>${edge.target.toLowerCase()}`;
            const isHighlighted = highlightedEdgeKeys.has(edgeKey);

            // Use accent variables for edge colors
            let edgeColor = 'var(--accent-steel)';
            if (isHighlighted) edgeColor = 'var(--accent-emerald)';
            else if (edge.strength >= 80) edgeColor = 'var(--accent-crimson)';
            else if (edge.strength >= 60) edgeColor = 'var(--accent-gold)';
            else edgeColor = 'var(--accent-steel)';
            return (
              <line
                key={`${edge.source}-${edge.target}-${i}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={edgeColor}
                strokeOpacity={isHighlighted ? 0.95 : 0.44}
                strokeWidth={isHighlighted ? 2.6 : 1.2}
              />
            );
          })}

          {graph.positioned.map((node) => {
            const isHighlighted = highlightedNodeKeys.has(node.id.toLowerCase());
            const defaultR = Math.max(4, Math.min(12, 4 + node.degree * 0.6));
            const hoverR = Math.max(6, Math.min(14, 6 + node.degree * 0.6));
            const shouldShowLabel = true;
            const angle = Math.atan2(node.y - centerY, node.x - centerX);
            const labelOffset = layoutType === 'circular' ? 18 : 18;
            const labelX = layoutType === 'circular' ? node.x + Math.cos(angle) * labelOffset : node.x;
            const labelY = layoutType === 'circular' ? node.y + Math.sin(angle) * labelOffset : node.y + 18;
            const angleDeg = (angle * 180) / Math.PI;
            const flipLabel = angleDeg > 90 || angleDeg < -90;
            const labelRotation = flipLabel ? angleDeg + 180 : angleDeg;
            const labelAnchor = layoutType === 'circular' ? (flipLabel ? 'end' : 'start') : 'middle';
            const labelDx = layoutType === 'circular' ? (flipLabel ? -6 : 6) : 0;
            const labelText = layoutType === 'circular' ? node.id : node.id.length > 14 ? `${node.id.slice(0, 12)}...` : node.id;

            return (
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
                {isHighlighted && (
                  <circle cx={node.x} cy={node.y} r={16} fill="var(--accent-emerald)" fillOpacity={0.14} stroke="var(--accent-emerald)" strokeWidth={1.5} />
                )}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={defaultR}
                  fill={isHighlighted ? 'var(--accent-emerald)' : 'var(--accent-steel)'}
                  fillOpacity={isHighlighted ? 0.26 : 0.18}
                  stroke={isHighlighted ? 'var(--accent-emerald)' : 'var(--accent-steel)'}
                  strokeWidth={isHighlighted ? 1.6 : 1.1}
                  style={{ transition: 'all 0.2s ease', pointerEvents: 'auto' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.setAttribute('r', String(hoverR));
                    e.currentTarget.setAttribute('stroke-width', '2');
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.setAttribute('r', String(defaultR));
                    e.currentTarget.setAttribute('stroke-width', isHighlighted ? '1.6' : '1.1');
                  }}
                />
                {shouldShowLabel && (
                  <text
                    x={labelX}
                    y={labelY}
                    dx={labelDx}
                    dy={layoutType === 'circular' ? 3 : 0}
                    textAnchor={labelAnchor}
                    fill="var(--text-primary)"
                    fontSize={layoutType === 'circular' ? 7.2 : 9}
                    transform={layoutType === 'circular' ? `rotate(${labelRotation} ${labelX} ${labelY})` : undefined}
                    style={{
                      pointerEvents: 'none',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      paintOrder: 'stroke',
                      stroke: 'var(--card-bg)',
                      strokeWidth: 2.8,
                      strokeLinecap: 'round',
                      strokeLinejoin: 'round',
                    }}
                  >
                    {labelText}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-2" style={{ zIndex: 50, pointerEvents: 'auto' }}>
        <button type="button" onClick={onZoomIn} className="kg-canvas-btn" title="Zoom In (Ctrl+)">
          <ZoomIn size={13} />
        </button>
        <button type="button" onClick={onZoomOut} className="kg-canvas-btn" title="Zoom Out (Ctrl-)">
          <ZoomOut size={13} />
        </button>
        <button type="button" onClick={onReset} className="kg-canvas-btn" title="Reset Zoom (Ctrl+0)">
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="absolute bottom-3 left-3 px-3 py-2 rounded-lg kg-chip">
        <div className="text-xs font-mono" style={{ color: 'var(--kg-cyan)' }}>
          {graph.positioned.length.toLocaleString()} nodes · {graph.edges.length.toLocaleString()} edges
        </div>
      </div>
    </div>
  );
}

function QueryControls({
  queryInput,
  setQueryInput,
  sourceInput,
  setSourceInput,
  targetInput,
  setTargetInput,
  minStrength,
  setMinStrength,
  layoutType,
  setLayoutType,
  loading,
  suggestions,
  onSelectSuggestion,
  onApply,
  onReload,
  source,
  target,
  relationshipCount,
  pathCount,
  isFallback,
  error,
}: {
  queryInput: string;
  setQueryInput: (value: string) => void;
  sourceInput: string;
  setSourceInput: (value: string) => void;
  targetInput: string;
  setTargetInput: (value: string) => void;
  minStrength: number;
  setMinStrength: (value: number) => void;
  layoutType: 'force' | 'circular';
  setLayoutType: (value: 'force' | 'circular') => void;
  loading: boolean;
  suggestions: QuerySuggestion[];
  onSelectSuggestion: (value: string) => void;
  onApply: () => void;
  onReload: () => void;
  source: string;
  target: string;
  relationshipCount: number;
  pathCount: number;
  isFallback: boolean;
  error: string | null;
}) {
  const hasCustomQuery = source !== 'Russia' || target !== 'EU' || queryInput.length > 0 || minStrength > 0;
  return (
    <section className="glass-card rounded-xl animate-in overflow-hidden kg-command-shell" style={{ animationDelay: '0ms' }}>
      <div className="kg-query-shell flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-4 lg:p-5" style={{ background: 'var(--card-bg)' }}>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 h-10 rounded-lg kg-input-shell kg-query-input min-w-[240px] flex-1 md:flex-none" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
            <Search size={14} style={{ color: 'var(--accent-steel)' }} />
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApply();
              }}
              placeholder="Search source/target/relation"
              className="bg-transparent text-sm outline-none w-full kg-query-input-field"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex items-center gap-2 px-3 h-10 rounded-lg kg-input-shell kg-query-input kg-query-route" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
            <input
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApply();
              }}
              placeholder="Source"
              className="bg-transparent text-sm outline-none w-24 kg-query-input-field"
              style={{ color: 'var(--kg-title)' }}
            />
            <span className="text-sm font-bold" style={{ color: 'var(--accent-gold)' }}>{'->'}</span>
            <input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApply();
              }}
              placeholder="Target"
              className="bg-transparent text-sm outline-none w-24 kg-query-input-field"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          <button
            onClick={onApply}
            disabled={loading}
            className="px-4 h-10 rounded-lg text-xs font-bold transition-all kg-cta whitespace-nowrap"
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--accent-gold)',
              color: 'var(--background)',
              border: 'none',
            }}
          >
            {loading ? 'LOADING...' : 'APPLY QUERY'}
          </button>

          <div className="flex p-1 h-10 rounded-lg kg-layout-toggle items-center" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setLayoutType('force')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${layoutType === 'force' ? '' : ''}`}
              style={{
                background: layoutType === 'force' ? 'var(--accent-steel)' : 'transparent',
                color: layoutType === 'force' ? 'var(--background)' : 'var(--text-primary)',
                border: layoutType === 'force' ? '1.5px solid var(--accent-steel)' : '1px solid var(--border-color)',
              }}
            >
              ORB
            </button>
            <button
              onClick={() => setLayoutType('circular')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${layoutType === 'circular' ? '' : ''}`}
              style={{
                background: layoutType === 'circular' ? 'var(--accent-gold)' : 'transparent',
                color: layoutType === 'circular' ? 'var(--background)' : 'var(--text-primary)',
                border: layoutType === 'circular' ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-color)',
              }}
            >
              RADIUS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end xl:self-auto">
          <div className="flex items-center gap-2 px-3 h-10 rounded-lg kg-input-shell kg-query-input kg-query-filter" style={{ background: 'var(--background)', border: '1px solid var(--border-color)' }}>
            <Filter size={12} style={{ color: 'var(--accent-steel)' }} />
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent-steel)' }}>Min Strength</label>
            <select
              value={minStrength}
              onChange={(e) => setMinStrength(Number(e.target.value))}
              className="bg-transparent text-sm outline-none kg-query-select"
              style={{ color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value={0}>0</option>
              <option value={40}>40</option>
              <option value={60}>60</option>
              <option value={80}>80</option>
            </select>
          </div>

          <button
            onClick={onReload}
            disabled={loading}
            className="kg-refresh-btn px-3 h-10 rounded-lg text-sm font-semibold transition-all"
            style={{
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--accent-steel)',
              color: 'var(--background)',
              border: 'none',
            }}
          >
            {loading ? 'SYNCING...' : 'Refresh'}
          </button>
        </div>
      </div>

      {(hasCustomQuery || (queryInput.trim().length > 0 && suggestions.length > 0)) && (
        <div className="px-4 lg:px-5 pb-4 pt-1 flex flex-col gap-3 kg-command-footer">
          {hasCustomQuery && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--kg-cyan)' }}>
                Active Query
              </span>
              <span className="kg-command-pill">Path: {source} {'->'} {target}</span>
              {minStrength > 0 && <span className="kg-command-pill">Min Strength: {minStrength}%</span>}
              <span className="kg-command-pill">{relationshipCount} links</span>
              <span className="kg-command-pill">{pathCount} paths</span>
            </div>
          )}

          {queryInput.trim().length > 0 && suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--kg-muted)' }}>
                Similar Suggestions
              </span>
              {suggestions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onSelectSuggestion(item.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all kg-command-pill kg-command-suggestion"
                >
                  {item.value} ({Math.round(item.score * 100)}%)
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function QueryStatus({
  source,
  target,
  queryInput,
  minStrength,
  relationshipCount,
  pathCount,
}: {
  source: string;
  target: string;
  queryInput: string;
  minStrength: number;
  relationshipCount: number;
  pathCount: number;
}) {
  const hasCustomQuery = source !== 'Russia' || target !== 'EU' || queryInput.length > 0 || minStrength > 0;
  if (!hasCustomQuery) return null;

  return (
    <div className="px-4 py-3 rounded-lg mt-4" style={{ background: 'var(--kg-surface-soft)', border: '1px solid var(--kg-border)' }}>
      <div className="text-xs" style={{ color: 'var(--kg-cyan)', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
        ACTIVE QUERY
      </div>
      <div className="text-xs space-y-1" style={{ color: 'var(--kg-text-soft)' }}>
        <div>
          <span style={{ color: 'var(--kg-muted)' }}>Paths:</span> {source} {'->'} {target}
        </div>
        {queryInput && (
          <div>
            <span style={{ color: 'var(--kg-muted)' }}>Search:</span> {queryInput}
          </div>
        )}
        {minStrength > 0 && (
          <div>
            <span style={{ color: 'var(--kg-muted)' }}>Min Strength:</span> {minStrength}%
          </div>
        )}
        <div style={{ color: 'var(--kg-muted)', fontSize: '0.65rem', marginTop: '0.5rem' }}>
          Found {relationshipCount} relationships • {pathCount} path(s)
        </div>
      </div>
    </div>
  );
}

function DataSourceBanner({
  loading,
  isFallback,
  error,
}: {
  loading: boolean;
  isFallback: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-primary text-[10px] font-black uppercase tracking-widest">Graph Feed Status</div>
          <div className="text-secondary text-xs mt-1">Loading knowledge graph endpoints and relation metrics...</div>
        </div>
        <span className="status-warning">SYNCING</span>
      </div>
    );
  }

  if (isFallback) {
    return (
      <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-primary text-[10px] font-black uppercase tracking-widest">Sample Data Active</div>
          <div className="text-secondary text-xs mt-1">
            Live knowledge graph API unavailable{error ? `: ${error}` : ''}. Current nodes, paths, and relationships are mock fallback data.
          </div>
        </div>
        <span className="status-critical">SAMPLE</span>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-primary text-[10px] font-black uppercase tracking-widest">Graph Status</div>
        <div className="text-secondary text-xs mt-1">Knowledge graph metrics, paths, and relationships are coming from backend APIs.</div>
      </div>
      <span className="status-online">LIVE</span>
    </div>
  );
}

function MetricsStrip({
  totalNodes,
  relationshipCount,
  shaclViolations,
  conflictRatio,
  graphDepth,
}: {
  totalNodes: number;
  relationshipCount: number;
  shaclViolations: number;
  conflictRatio: number | string;
  graphDepth: number;
}) {
  const cards = [
    { label: 'Total Nodes', value: totalNodes.toLocaleString(), subValue: 'Entity graph footprint', bgColor: '#bfdbfe', textColor: '#1e3a8a', icon: Network },
    { label: 'Loaded Relationships', value: relationshipCount.toLocaleString(), subValue: 'Current edge slice', bgColor: '#ddd6fe', textColor: '#4c1d95', icon: GitBranch },
    { label: 'SHACL Violations', value: shaclViolations.toLocaleString(), subValue: 'Schema quality alerts', bgColor: shaclViolations > 0 ? '#fde68a' : '#bbf7d0', textColor: shaclViolations > 0 ? '#78350f' : '#166534', icon: ShieldAlert },
    { label: 'Conflict Risk Ratio', value: `${conflictRatio}%`, subValue: 'High-risk edges', bgColor: '#fecaca', textColor: '#991b1b', icon: AlertTriangle },
    { label: 'Path Depth', value: graphDepth.toString(), subValue: 'Resolved traversal hops', bgColor: '#a7f3d0', textColor: '#064e3b', icon: Route },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in" style={{ animationDelay: '80ms' }}>
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          subValue={card.subValue}
          icon={card.icon}
          bgColor={card.bgColor}
          textColor={card.textColor}
        />
      ))}
    </section>
  );
}

function GraphPanel({
  relationships,
  zoom,
  setZoom,
  onNodeClick,
  highlightedPathChain,
  layoutType,
  isMounted,
}: {
  relationships: Relationship[];
  zoom: number;
  setZoom: (value: number | ((prev: number) => number)) => void;
  onNodeClick: (nodeId: string) => void;
  highlightedPathChain: string[];
  layoutType: 'force' | 'circular';
  isMounted: boolean;
}) {
  return (
    <div className="lg:col-span-8 glass-card rounded-xl p-0 overflow-hidden h-[430px] lg:h-[520px]">
      <div className="p-4 flex items-center justify-between bg-black/[0.04]">
        <h3 className="font-bold text-sm text-primary uppercase">Interactive Network Surface</h3>
        <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--kg-muted)' }}>click node to inspect</div>
      </div>
      <div className="h-[374px] lg:h-[458px] rounded-xl overflow-hidden kg-graph-wrap m-4 mt-0">
        {isMounted ? (
          <GraphCanvas
            relationships={relationships}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(2.2, z + 0.12))}
            onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.12))}
            onReset={() => setZoom(1)}
            onNodeClick={onNodeClick}
            highlightedPathChain={highlightedPathChain}
            layoutType={layoutType}
          />
        ) : (
          <div className="relative w-full h-full rounded-xl flex items-center justify-center" style={{ border: '1px solid var(--kg-border)' }}>
            <span className="text-xs font-mono animate-pulse" style={{ color: 'var(--kg-cyan)' }}>Initializing Neural Overlays...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RelationshipPanel({
  relationships,
  loading,
  onSelectRelationship,
  className = 'lg:col-span-4',
}: {
  relationships: Relationship[];
  loading: boolean;
  onSelectRelationship: (relationship: Relationship) => void;
  className?: string;
}) {
  return (
    <div className={`${className} glass-card rounded-xl p-0 overflow-hidden flex flex-col h-[430px] lg:h-[520px]`}>
      <div className="p-4 flex items-center justify-between bg-black/[0.04]">
        <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Active Relationships</h3>
        <span className="text-[10px] font-black uppercase text-secondary">{relationships.length}</span>
      </div>
      <div className="flex-1 overflow-hidden p-4 pt-3">
        <div className="table-scroll-container rounded-lg" style={{ border: '1px solid var(--kg-border)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Link</th>
                <th style={{ textAlign: 'left' }}>Type</th>
                <th style={{ textAlign: 'left' }}>Strength</th>
                <th style={{ textAlign: 'left' }}>Source Link</th>
                <th style={{ textAlign: 'left' }}>Trace</th>
              </tr>
            </thead>
            <tbody>
              {relationships.map((rel, idx) => {
                const safeRelUrl = getSafeExternalUrl(rel.url);
                return (
                <tr
                  key={`${rel.source}-${rel.target}-${idx}`}
                  onClick={() => onSelectRelationship(rel)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="font-semibold text-xs" style={{ color: 'var(--kg-text)' }}>{rel.source} {'->'} {rel.target}</div>
                  </td>
                  <td>
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--kg-cyan)' }}>{rel.relation}</span>
                  </td>
                  <td>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: rel.strength >= 80 ? '#ff8a8a' : rel.strength >= 60 ? '#ffb662' : '#2ed7b3' }}
                    >
                      {rel.strength}%
                    </span>
                  </td>
                  <td>
                    {safeRelUrl ? (
                      <a
                        href={safeRelUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-semibold hover:underline"
                        style={{ color: 'var(--kg-cyan)' }}
                      >
                        OPEN
                      </a>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--kg-muted)' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    {safeRelUrl ? (
                      <a href={safeRelUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--kg-cyan)' }}>
                        <ZoomIn size={12} />
                      </a>
                    ) : (
                      <span className="text-[11px]" style={{ color: 'var(--kg-muted)' }}>N/A</span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>

        {!loading && relationships.length === 0 && (
          <div className="text-xs mt-3" style={{ color: 'var(--kg-muted)' }}>No relationships for the current filter/query.</div>
        )}
      </div>
    </div>
  );
}

function PathsPanel({
  paths,
  source,
  target,
  selectedPathIndex,
  setSelectedPathIndex,
  loading,
  className = 'xl:col-span-2',
}: {
  paths: PathEntry[];
  source: string;
  target: string;
  selectedPathIndex: number;
  setSelectedPathIndex: (value: number) => void;
  loading: boolean;
  className?: string;
}) {
  return (
    <div className={`${className} glass-card rounded-xl p-0 overflow-hidden`}>
      <div className="flex items-center justify-between p-4 bg-black/[0.04]">
        <h3 className="font-bold text-sm text-primary uppercase">{`Discovered Paths (${source} -> ${target})`}</h3>
        <span className="text-xs" style={{ color: 'var(--kg-muted)' }}>{paths.length} path(s) • click to highlight</span>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto p-4 pt-3">
        {paths.map((path, i) => {
          const selected = selectedPathIndex === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedPathIndex(i)}
              className="w-full text-left p-3 rounded-lg transition-all"
              style={{
                background: selected ? 'var(--kg-path-selected-bg)' : 'var(--kg-path-bg)',
                border: selected ? '1px solid var(--kg-path-selected-border)' : '1px solid var(--kg-border)',
              }}
            >
              <div className="text-[10px] mb-1 font-bold" style={{ color: 'var(--kg-muted)' }}>
                Strength {path.strength}% · Hops {path.hops ?? Math.max(0, path.chain.length - 1)}
              </div>
              <div className="text-xs font-bold" style={{ color: selected ? '#1cb896' : 'var(--kg-cyan)' }}>
                {path.chain.join(' -> ')}
              </div>
            </button>
          );
        })}

        {!loading && paths.length === 0 && (
          <div className="text-xs mt-3" style={{ color: 'var(--kg-muted)' }}>No path found for this source/target in current graph sample.</div>
        )}
      </div>
    </div>
  );
}

function LegendPanel() {
  return (
    <div className="glass-card rounded-xl p-0 overflow-hidden">
      <div className="p-4 bg-black/[0.04]">
        <h3 className="font-bold text-sm text-primary uppercase">Entity/Edge Legend</h3>
      </div>
      <div className="space-y-3 max-h-[420px] overflow-y-auto p-4 pt-3">
        {ENTITY_CATEGORIES.map((cat) => (
          <div key={cat.label} className="rounded-lg p-3" style={{ background: 'var(--kg-panel-bg)', border: '1px solid var(--kg-border)' }}>
            <div className="text-xs font-bold mb-1" style={{ color: cat.color }}>{cat.label}</div>
            <div className="text-[10px] leading-relaxed" style={{ color: 'var(--kg-muted)' }}>{cat.entities.join(' • ')}</div>
          </div>
        ))}

        <div className="table-scroll-container rounded-lg" style={{ border: '1px solid var(--kg-border)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Relation Type</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th style={{ textAlign: 'left' }}>Class</th>
              </tr>
            </thead>
            <tbody>
              {RELATIONSHIP_TYPES.slice(0, 6).map((rel) => (
                <tr key={rel.type}>
                  <td>
                    <span className="text-xs font-semibold" style={{ color: rel.color }}>{rel.type}</span>
                  </td>
                  <td>
                    <span className="text-[11px]" style={{ color: 'var(--kg-muted)' }}>{rel.description}</span>
                  </td>
                  <td>
                    <span className="text-[11px] uppercase" style={{ color: 'var(--kg-text)' }}>{rel.strength}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NodeAnalysisPanel({
  selectedNodeId,
  selectedNodeStats,
  selectedNodeRelationships,
  dataRelationships,
  selectedRelationship,
  onClose,
}: {
  selectedNodeId: string;
  selectedNodeStats: NodeStats | null;
  selectedNodeRelationships: Relationship[];
  dataRelationships: Relationship[];
  selectedRelationship: Relationship | null;
  onClose: () => void;
}) {
  const selectedNodeTraceUrl = getSafeExternalUrl(
    dataRelationships.find((r) => r.source === selectedNodeId || r.target === selectedNodeId)?.url
  );
  return (
    <section className="glass-card kg-analysis-shell rounded-xl overflow-hidden animate-in w-full" style={{ animationDelay: '260ms' }}>
      <div className="p-5 flex items-center justify-between bg-black/[0.04] kg-analysis-header">
        <div>
          <h3 className="font-bold text-sm text-primary uppercase">Node Analysis</h3>
          <p className="text-xs mt-1 text-secondary">
            {selectedRelationship
              ? `${selectedRelationship.source} -> ${selectedRelationship.target} (${selectedRelationship.relation})`
              : `${selectedNodeId} relationship drilldown`}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-5 pt-4 kg-analysis-content">
        <div className="xl:col-span-1 space-y-3">
          <div className="rounded-xl p-4 kg-analysis-block" style={{ background: 'var(--kg-panel-bg)', border: '1px solid var(--kg-border)' }}>
            <h4 className="font-bold text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--kg-cyan)' }}>Node Properties</h4>
            <div className="table-scroll-container rounded-lg" style={{ border: '1px solid var(--kg-border)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Property</th>
                    <th style={{ textAlign: 'left' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="text-xs" style={{ color: 'var(--kg-muted)' }}>Name</span></td>
                    <td><span className="text-xs font-semibold" style={{ color: 'var(--kg-text)' }}>{selectedNodeId}</span></td>
                  </tr>
                  <tr>
                    <td><span className="text-xs" style={{ color: 'var(--kg-muted)' }}>Actor Code</span></td>
                    <td>
                      <span className="text-xs font-mono" style={{ color: '#9ecbff' }}>
                        {dataRelationships.find((r) => r.source === selectedNodeId)?.subject_properties?.actor_code ||
                          dataRelationships.find((r) => r.target === selectedNodeId)?.object_properties?.actor_code ||
                          'N/A'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><span className="text-xs" style={{ color: 'var(--kg-muted)' }}>Confidence</span></td>
                    <td><span className="text-xs font-mono" style={{ color: '#2ed7b3' }}>92.4%</span></td>
                  </tr>
                  <tr>
                    <td><span className="text-xs" style={{ color: 'var(--kg-muted)' }}>Source Doc</span></td>
                    <td><span className="text-xs font-mono uppercase" style={{ color: '#ffb662' }}>GDELT 2.0</span></td>
                  </tr>
                  <tr>
                    <td><span className="text-xs" style={{ color: 'var(--kg-muted)' }}>Trace URL</span></td>
                    <td>
                      {selectedNodeTraceUrl ? (
                        <a
                          href={selectedNodeTraceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-xs font-mono"
                          style={{ color: 'var(--kg-cyan)' }}
                        >
                          LINK
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--kg-muted)' }}>NONE</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {selectedNodeStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
              <div className="p-3 rounded-lg kg-analysis-block" style={{ background: 'var(--kg-panel-bg)', border: '1px solid var(--kg-border)' }}>
                <div className="text-xs" style={{ color: 'var(--kg-muted)' }}>Incoming Connections</div>
                <div className="text-lg font-bold" style={{ color: '#37c9ff' }}>{selectedNodeStats.incomingConnections}</div>
              </div>
              <div className="p-3 rounded-lg kg-analysis-block" style={{ background: 'var(--kg-panel-bg)', border: '1px solid var(--kg-border)' }}>
                <div className="text-xs" style={{ color: 'var(--kg-muted)' }}>Outgoing Connections</div>
                <div className="text-lg font-bold" style={{ color: '#6ea8ff' }}>{selectedNodeStats.outgoingConnections}</div>
              </div>
              <div className="p-3 rounded-lg kg-analysis-block" style={{ background: 'var(--kg-panel-bg)', border: '1px solid var(--kg-border)' }}>
                <div className="text-xs" style={{ color: 'var(--kg-muted)' }}>Avg Connection Strength</div>
                <div className="text-lg font-bold" style={{ color: '#ffb662' }}>{selectedNodeStats.avgStrength}%</div>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-2">
          <h4 className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: 'var(--kg-cyan)' }}>Connected Relationships</h4>
          <div className="max-h-[560px] overflow-hidden">
            <div className="table-scroll-container rounded-lg kg-analysis-block" style={{ border: '1px solid var(--kg-border)', maxHeight: '100%' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Link</th>
                    <th style={{ textAlign: 'left' }}>Type</th>
                    <th style={{ textAlign: 'left' }}>Strength</th>
                    <th style={{ textAlign: 'left' }}>Source</th>
                    <th style={{ textAlign: 'left' }}>Trace</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedNodeRelationships.map((rel, idx) => {
                    const safeRelUrl = getSafeExternalUrl(rel.url);
                    const relType = RELATIONSHIP_TYPES.find((rt) => rt.type.toLowerCase() === rel.relation.toLowerCase());
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="text-xs font-semibold" style={{ color: 'var(--kg-text)' }}>
                            {rel.source} {'->'} {rel.target}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-semibold" style={{ color: relType?.color || '#6ea8ff' }}>{rel.relation}</span>
                        </td>
                        <td>
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: rel.strength >= 80 ? '#ff8a8a' : rel.strength >= 60 ? '#ffb662' : '#2ed7b3' }}
                          >
                            {rel.strength}%
                          </span>
                        </td>
                        <td>
                          <span className="text-xs font-mono uppercase" style={{ color: '#6ea8ff' }}>GDELT 2.0</span>
                        </td>
                        <td>
                          {safeRelUrl ? (
                            <a href={safeRelUrl} target="_blank" rel="noreferrer" className="hover:underline text-xs" style={{ color: 'var(--kg-cyan)' }}>
                              DOC
                            </a>
                          ) : (
                            <span className="text-xs" style={{ color: 'var(--kg-muted)' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

        {selectedNodeRelationships.length === 0 && (
          <div className="text-xs mt-3" style={{ color: 'var(--kg-muted)' }}>No relationships found for this node.</div>
        )}
          </div>
        </div>
      </div>
    </section>
  );
}

function KnowledgeGraphThemeStyles() {
  return (
    <style jsx>{`
      .kg-shell {
        --kg-text: var(--text-primary);
        --kg-text-soft: var(--text-secondary);
        --kg-title: var(--text-primary);
        --kg-muted: var(--text-muted);
        --kg-label: var(--text-primary);
        --kg-blue: color-mix(in srgb, var(--accent-steel) 70%, #3b82f6 30%);
        --kg-cyan: var(--accent-gold);
        --kg-border: var(--border-color);
        --kg-surface: var(--card-bg);
        --kg-surface-soft: color-mix(in srgb, var(--card-bg) 92%, var(--accent-gold-dim));
        --kg-panel-bg: color-mix(in srgb, var(--card-bg) 88%, var(--accent-gold-dim));
        --kg-input-bg: color-mix(in srgb, var(--card-bg) 84%, var(--accent-gold-dim));
        --kg-refresh-bg: color-mix(in srgb, var(--accent-gold-dim) 80%, transparent);
        --kg-refresh-border: color-mix(in srgb, var(--accent-gold) 30%, transparent);
        --kg-path-bg: color-mix(in srgb, var(--card-bg) 86%, var(--accent-gold-dim));
        --kg-path-selected-bg: color-mix(in srgb, var(--accent-emerald) 16%, var(--card-bg));
        --kg-path-selected-border: color-mix(in srgb, var(--accent-emerald) 42%, var(--border-color));
        background: transparent;
      }

      .kg-shell :global(.text-primary) {
        color: var(--kg-title) !important;
      }

      .kg-shell :global(.text-secondary) {
        color: var(--kg-text-soft) !important;
      }

      .kg-main {
        color: var(--kg-text);
      }

      .kg-card {
        background: var(--kg-surface);
        border: 1px solid color-mix(in srgb, var(--accent-gold) 35%, var(--kg-border));
        box-shadow: 0 4px 12px rgba(178, 144, 79, 0.15);
        transition: all 0.2s ease;
      }

      .kg-analysis-shell {
        background:
          linear-gradient(180deg, color-mix(in srgb, var(--card-bg) 98%, #000), color-mix(in srgb, var(--card-bg) 92%, var(--accent-gold-dim))),
          radial-gradient(420px 180px at 18% 0%, color-mix(in srgb, var(--accent-gold-dim) 80%, transparent), transparent 72%);
        border: 1px solid color-mix(in srgb, var(--accent-gold) 24%, var(--border-color));
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.26), 0 0 0 1px color-mix(in srgb, var(--accent-gold) 8%, transparent) inset;
      }

      .kg-analysis-header {
        border-bottom: 1px solid color-mix(in srgb, var(--accent-gold) 22%, var(--kg-border));
      }

      .kg-analysis-content {
        align-items: start;
      }

      .kg-analysis-block {
        background: color-mix(in srgb, var(--kg-panel-bg) 88%, #000);
      }

      .kg-hero {
        position: relative;
        overflow: hidden;
      }

      .kg-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(120deg, transparent 0%, color-mix(in srgb, var(--accent-gold-dim) 65%, transparent) 45%, transparent 100%);
      }

      .kg-input-shell {
        background: var(--kg-input-bg);
        border: 1px solid var(--kg-border);
      }

      .kg-query-shell {
        background: transparent;
        border-top: 1px solid var(--kg-border);
      }

      .kg-query-input {
        border: 1px solid var(--kg-border);
        background: transparent;
        box-shadow: none;
      }

      .kg-query-input:focus-within {
        border-color: color-mix(in srgb, var(--accent-gold) 70%, white 10%);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-gold) 20%, transparent);
      }

      .kg-query-input-field::placeholder {
        color: var(--kg-muted);
      }

      .kg-query-select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        padding-right: 0.2rem;
        font-weight: 700;
        color: var(--kg-text) !important;
      }

      .kg-refresh-btn {
        background: transparent;
        border: 1px solid var(--kg-border);
        color: var(--kg-blue);
      }

      .kg-refresh-btn:hover {
        transform: translateY(-1px);
        border-color: color-mix(in srgb, var(--accent-gold) 75%, white 10%);
        box-shadow: 0 8px 16px rgba(178, 144, 79, 0.2);
      }

      .kg-cta {
        background: var(--accent-gold);
        color: #0f0a00;
        border: 1px solid var(--accent-gold);
        letter-spacing: 0.06em;
        box-shadow: none;
      }

      :global(html.light) .kg-cta {
        color: #1b1305;
      }

      .kg-cta:hover {
        transform: translateY(-1px);
      }

      .kg-layout-toggle {
        background: transparent;
        border: 1px solid var(--kg-border);
      }

      .kg-layout-active {
        background: var(--accent-gold);
        color: #1b1305;
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent-gold) 72%, white);
      }

      .kg-layout-inactive {
        color: var(--kg-blue);
      }

      .kg-layout-inactive:hover {
        color: var(--kg-text);
      }

      .kg-graph-wrap {
        border: 1px solid color-mix(in srgb, var(--accent-gold) 35%, var(--kg-border));
        background:
          radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--accent-gold-dim) 75%, transparent), transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(69, 124, 196, 0.1), transparent 72%),
          linear-gradient(180deg, #081121, #040914);
      }

      .kg-canvas {
        border: 1px solid color-mix(in srgb, var(--accent-gold) 35%, var(--kg-border));
        background: transparent;
      }

      .kg-canvas-btn {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--kg-cyan);
        background: var(--kg-input-bg);
        border: 1px solid var(--kg-border);
        transition: all 0.2s ease;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
      }

      .kg-canvas-btn:hover {
        transform: translateY(-1px);
        border-color: var(--accent-gold);
      }

      .kg-chip {
        background: var(--kg-input-bg);
        border: 1px solid var(--kg-border);
      }

      .kg-command-shell {
        border: 1px solid var(--kg-border);
        box-shadow: none;
      }

      .kg-command-hero {
        background: transparent;
      }

      .kg-command-footer {
        border-top: 1px solid var(--kg-border);
      }

      .kg-command-pill {
        padding: 0.38rem 0.7rem;
        border-radius: 999px;
        border: 1px solid var(--kg-border);
        background: transparent;
        color: var(--kg-text-soft);
        font-size: 0.76rem;
        font-weight: 600;
      }

      .kg-command-suggestion:hover {
        border-color: var(--accent-gold);
        color: var(--kg-title);
      }

      .kg-rel-item {
        background: var(--kg-panel-bg);
        border: 1px solid var(--kg-border);
      }

      .kg-rel-item:hover {
        background: var(--table-row-hover);
        border-color: color-mix(in srgb, var(--accent-gold) 45%, transparent);
        transform: translateX(2px);
      }

      .kg-metric-value {
        text-shadow: none;
      }

      .animate-in {
        opacity: 0;
        transform: translateY(8px);
        animation: kgFadeIn 0.5s ease forwards;
      }

      @keyframes kgFadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .kg-main {
          padding-left: 0.9rem;
          padding-right: 0.9rem;
        }
      }
    `}</style>
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
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [layoutType, setLayoutType] = useState<'force' | 'circular'>('force');
  const [isMounted, setIsMounted] = useState(false);
  const nodeAnalysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Live query mode: automatically apply search/source/target as user types.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(queryInput.trim());
      setSource(sourceInput.trim() || 'Russia');
      setTarget(targetInput.trim() || 'EU');
      setSelectedPathIndex(-1);
    }, 350);

    return () => clearTimeout(timer);
  }, [queryInput, sourceInput, targetInput]);

  const { data, loading, error, reload, isFallback } = useKnowledgeGraphMetrics({
    source,
    target,
    searchQuery,
    minStrength,
    relationshipLimit: 300,
    depth: 5,
    maxPaths: 4,
  });

  useEffect(() => {
    if (selectedNodeId && nodeAnalysisRef.current) {
      nodeAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedNodeId]);

  const relationships = useMemo(() => {
    const map = new Map<string, Relationship>();

    data.relationships.forEach((rel) => {
      const key = [
        rel.source.trim().toLowerCase(),
        rel.target.trim().toLowerCase(),
        rel.relation.trim().toLowerCase(),
      ].join('|');

      const existing = map.get(key);
      if (!existing) {
        map.set(key, rel);
        return;
      }

      const next: Relationship =
        rel.strength > existing.strength
          ? { ...rel, url: rel.url ?? existing.url }
          : { ...existing, url: existing.url ?? rel.url };

      map.set(key, next);
    });

    return Array.from(map.values());
  }, [data.relationships]);

  const paths = useMemo(() => {
    const seen = new Set<string>();
    return (data.paths as PathEntry[]).filter((path) => {
      const key = [
        path.chain.map((node) => node.trim().toLowerCase()).join('>'),
        String(path.hops ?? Math.max(0, path.chain.length - 1)),
        String(path.strength),
      ].join('|');

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [data.paths]);

  const querySuggestions = useMemo(() => {
    const q = queryInput.trim();
    if (!q) return [];

    const pool = new Set<string>();
    relationships.forEach((rel) => {
      pool.add(rel.source);
      pool.add(rel.target);
      pool.add(rel.relation);
    });

    return Array.from(pool)
      .map((value) => ({ value, score: cosineSimilarity(q, value) }))
      .filter((item) => item.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);
  }, [queryInput, relationships]);

  useEffect(() => {
    if (paths.length === 0) {
      setSelectedPathIndex(-1);
      return;
    }
    if (selectedPathIndex >= paths.length) {
      setSelectedPathIndex(0);
    }
  }, [paths, selectedPathIndex]);

  const totalNodes = data.nodeTypes.reduce((acc, n) => acc + n.count, 0);
  const graphDepth = paths.length ? Math.max(...paths.map((p) => p.hops ?? Math.max(0, p.chain.length - 1))) : 0;
  const highlightedPathChain = selectedPathIndex >= 0 ? (paths[selectedPathIndex]?.chain ?? []) : [];

  const selectedNodeRelationships: Relationship[] = selectedNodeId
    ? relationships.filter(
        (rel) => rel.source.toLowerCase() === selectedNodeId.toLowerCase() || rel.target.toLowerCase() === selectedNodeId.toLowerCase()
      )
    : [];

  const selectedNodeStats: NodeStats | null = selectedNodeId
    ? {
        incomingConnections: relationships.filter((rel) => rel.target.toLowerCase() === selectedNodeId.toLowerCase()).length,
        outgoingConnections: relationships.filter((rel) => rel.source.toLowerCase() === selectedNodeId.toLowerCase()).length,
        avgStrength:
          selectedNodeRelationships.length > 0
            ? (selectedNodeRelationships.reduce((acc, r) => acc + r.strength, 0) / selectedNodeRelationships.length).toFixed(1)
            : '0',
      }
    : null;

  const applyQuery = () => {
    setSearchQuery(queryInput.trim());
    setSource(sourceInput.trim() || 'Russia');
    setTarget(targetInput.trim() || 'EU');
    setSelectedPathIndex(-1);
    reload();
  };

  return (
    <div className="kg-shell flex flex-col min-h-screen grid-bg">
      <TopBar title="Knowledge Graph" subtitle="Interactive relation intelligence with live pathing and SHACL compliance overlays" />

      <main className="kg-main flex-1 px-4 md:px-6 py-3 space-y-4">
        <MetricsStrip
          totalNodes={totalNodes}
          relationshipCount={relationships.length}
          shaclViolations={data.shaclSummary.total_violations}
          conflictRatio={data.conflict.risk_ratio}
          graphDepth={graphDepth}
        />

        <QueryControls
          queryInput={queryInput}
          setQueryInput={setQueryInput}
          sourceInput={sourceInput}
          setSourceInput={setSourceInput}
          targetInput={targetInput}
          setTargetInput={setTargetInput}
          minStrength={minStrength}
          setMinStrength={setMinStrength}
          layoutType={layoutType}
          setLayoutType={setLayoutType}
          loading={loading}
          suggestions={querySuggestions}
          onSelectSuggestion={(value) => {
            setQueryInput(value);
            setSearchQuery(value);
          }}
          onApply={applyQuery}
          onReload={reload}
          source={source}
          target={target}
          relationshipCount={relationships.length}
          pathCount={paths.length}
          isFallback={isFallback}
          error={error}
        />

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in" style={{ animationDelay: '140ms' }}>
          <GraphPanel
            relationships={relationships}
            zoom={zoom}
            setZoom={setZoom}
            onNodeClick={(nodeId) => {
              setSelectedNodeId(nodeId);
              setSelectedRelationship(null);
            }}
            highlightedPathChain={highlightedPathChain}
            layoutType={layoutType}
            isMounted={isMounted}
          />

          <PathsPanel
            className="lg:col-span-4"
            paths={paths}
            source={source}
            target={target}
            selectedPathIndex={selectedPathIndex}
            setSelectedPathIndex={setSelectedPathIndex}
            loading={loading}
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in" style={{ animationDelay: '220ms' }}>
          <RelationshipPanel
            className="xl:col-span-2"
            relationships={relationships}
            loading={loading}
            onSelectRelationship={(rel) => {
              setSelectedRelationship(rel);
              setSelectedNodeId(rel.target || rel.source);
              setSourceInput(rel.source);
              setTargetInput(rel.target);
              setSource(rel.source);
              setTarget(rel.target);
              setSelectedPathIndex(-1);
            }}
          />
          <LegendPanel />
        </section>

        {selectedNodeId && (
          <div ref={nodeAnalysisRef} className="pt-1">
            <NodeAnalysisPanel
              selectedNodeId={selectedNodeId}
              selectedNodeStats={selectedNodeStats}
              selectedNodeRelationships={selectedNodeRelationships}
              dataRelationships={relationships}
              selectedRelationship={selectedRelationship}
              onClose={() => {
                setSelectedNodeId(null);
                setSelectedRelationship(null);
              }}
            />
          </div>
        )}
      </main>

      <KnowledgeGraphThemeStyles />
    </div>
  );
}
