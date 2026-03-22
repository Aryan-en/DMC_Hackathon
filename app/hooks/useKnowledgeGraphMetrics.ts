'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type NodeType = {
  type: string;
  count: number;
  color: string;
};

type Relationship = {
  source: string;
  target: string;
  relation: string;
  strength: number;
  date?: string;
  impact?: string;
};

type Path = {
  chain: string[];
  strength: number;
  hops?: number;
};

type ShaclShape = {
  shape: string;
  target: string;
  constraints: number;
  target_nodes: number;
  violations: number;
  status: string;
};

type ShaclSummary = {
  shapes_total: number;
  shapes_passed: number;
  shapes_warn: number;
  total_violations: number;
};

type ConflictHotspot = {
  entity: string;
  hits: number;
};

type ConflictMetrics = {
  total_edges: number;
  high_risk_edges: number;
  risk_ratio: number;
  hotspots: ConflictHotspot[];
};

type CentralityNode = {
  entity: string;
  degree: number;
  centrality: number;
};

type CentralityStats = {
  node_count: number;
  edge_count: number;
  avg_degree: number;
  density: number;
  top_central_nodes: CentralityNode[];
};

type KnowledgeGraphMetrics = {
  nodeTypes: NodeType[];
  relationships: Relationship[];
  paths: Path[];
  shaclSummary: ShaclSummary;
  shaclShapes: ShaclShape[];
  conflict: ConflictMetrics;
  centrality: CentralityStats;
};

type HookOptions = {
  source?: string;
  target?: string;
  searchQuery?: string;
  relationshipLimit?: number;
  minStrength?: number;
  depth?: number;
  maxPaths?: number;
};

// Fallback sample data
const SAMPLE_NODE_TYPES: NodeType[] = [
  { type: 'Country', count: 195, color: '#3b82f6' },
  { type: 'Organization', count: 342, color: '#10b981' },
  { type: 'Person', count: 1205, color: '#f59e0b' },
  { type: 'Event', count: 876, color: '#ef4444' },
  { type: 'Treaty', count: 128, color: '#8b5cf6' },
  { type: 'Resource', count: 94, color: '#06b6d4' },
];

const SAMPLE_RELATIONSHIPS: Relationship[] = [
  { source: 'Russia', target: 'EU', relation: 'SANCTIONS', strength: 0.92, date: '2026-03-15', impact: 'high' },
  { source: 'China', target: 'USA', relation: 'TRADE_PARTNER', strength: 0.85, date: '2026-03-14' },
  { source: 'India', target: 'Russia', relation: 'DEFENSE_AGREEMENT', strength: 0.78, date: '2026-03-12' },
  { source: 'NATO', target: 'Ukraine', relation: 'MILITARY_SUPPORT', strength: 0.88, date: '2026-03-10', impact: 'critical' },
  { source: 'OPEC', target: 'Global Markets', relation: 'PRICE_INFLUENCE', strength: 0.81, date: '2026-03-08' },
  { source: 'EU', target: 'China', relation: 'DIPLOMATIC_TENSION', strength: 0.67, date: '2026-03-05' },
];

const SAMPLE_PATHS: Path[] = [
  { chain: ['Russia', 'SANCTIONS', 'EU', 'TRADE_PARTNER', 'China'], strength: 0.74, hops: 2 },
  { chain: ['Russia', 'DEFENSE_AGREEMENT', 'India', 'TRADE_PARTNER', 'EU'], strength: 0.68, hops: 2 },
  { chain: ['Russia', 'ENERGY_SUPPLIER', 'Europe', 'NATO_MEMBER', 'EU'], strength: 0.71, hops: 2 },
];

const SAMPLE_SHACL_SUMMARY: ShaclSummary = {
  shapes_total: 12,
  shapes_passed: 9,
  shapes_warn: 2,
  total_violations: 3,
};

const SAMPLE_SHACL_SHAPES: ShaclShape[] = [
  { shape: 'CountryShape', target: 'Country', constraints: 8, target_nodes: 195, violations: 0, status: 'passed' },
  { shape: 'OrganizationShape', target: 'Organization', constraints: 6, target_nodes: 342, violations: 2, status: 'warning' },
  { shape: 'PersonShape', target: 'Person', constraints: 5, target_nodes: 1205, violations: 1, status: 'warning' },
  { shape: 'EventShape', target: 'Event', constraints: 7, target_nodes: 876, violations: 0, status: 'passed' },
];

const SAMPLE_CONFLICT: ConflictMetrics = {
  total_edges: 4562,
  high_risk_edges: 342,
  risk_ratio: 0.075,
  hotspots: [
    { entity: 'Ukraine', hits: 89 },
    { entity: 'Taiwan', hits: 67 },
    { entity: 'South China Sea', hits: 54 },
    { entity: 'Iran', hits: 48 },
    { entity: 'Sahel', hits: 41 },
  ],
};

const SAMPLE_CENTRALITY: CentralityStats = {
  node_count: 2840,
  edge_count: 4562,
  avg_degree: 3.21,
  density: 0.0011,
  top_central_nodes: [
    { entity: 'United States', degree: 142, centrality: 0.89 },
    { entity: 'China', degree: 128, centrality: 0.84 },
    { entity: 'Russia', degree: 115, centrality: 0.79 },
    { entity: 'European Union', degree: 108, centrality: 0.76 },
    { entity: 'India', degree: 95, centrality: 0.71 },
  ],
};

export function useKnowledgeGraphMetrics(options: HookOptions = {}) {
  const [data, setData] = useState<KnowledgeGraphMetrics>({
    nodeTypes: SAMPLE_NODE_TYPES,
    relationships: SAMPLE_RELATIONSHIPS,
    paths: SAMPLE_PATHS,
    shaclSummary: SAMPLE_SHACL_SUMMARY,
    shaclShapes: SAMPLE_SHACL_SHAPES,
    conflict: SAMPLE_CONFLICT,
    centrality: SAMPLE_CENTRALITY,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const source = options.source ?? 'Russia';
  const target = options.target ?? 'EU';
  const searchQuery = options.searchQuery?.trim() ?? '';
  const relationshipLimit = options.relationshipLimit ?? 60;
  const minStrength = options.minStrength ?? 0;
  const depth = options.depth ?? 5;
  const maxPaths = options.maxPaths ?? 3;

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const path = `/api/knowledge-graph/paths/${encodeURIComponent(source)}/${encodeURIComponent(target)}?depth=${depth}&max_paths=${maxPaths}`;
        const relQuery = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : '';
        const relPath = `/api/knowledge-graph/relationships?limit=${relationshipLimit}&min_strength=${minStrength}${relQuery}`;

        const [nodesRes, relationshipsRes, pathRes, shaclRes, conflictRes, centralityRes] = await Promise.all([
          apiGet<{ node_types: NodeType[] }>('/api/knowledge-graph/nodes'),
          apiGet<{ relationships: Relationship[] }>(relPath),
          apiGet<{ paths: Path[] }>(path),
          apiGet<{ summary: ShaclSummary; shapes: ShaclShape[] }>('/api/knowledge-graph/shacl-validation-summary'),
          apiGet<ConflictMetrics>('/api/knowledge-graph/conflict-detection'),
          apiGet<CentralityStats>('/api/knowledge-graph/centrality-stats'),
        ]);

        if (!active) return;
        setData({
          nodeTypes: nodesRes.node_types,
          relationships: relationshipsRes.relationships,
          paths: pathRes.paths,
          shaclSummary: shaclRes.summary,
          shaclShapes: shaclRes.shapes,
          conflict: conflictRes,
          centrality: centralityRes,
        });
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({
          nodeTypes: SAMPLE_NODE_TYPES,
          relationships: SAMPLE_RELATIONSHIPS,
          paths: SAMPLE_PATHS,
          shaclSummary: SAMPLE_SHACL_SUMMARY,
          shaclShapes: SAMPLE_SHACL_SHAPES,
          conflict: SAMPLE_CONFLICT,
          centrality: SAMPLE_CENTRALITY,
        });
        setError(err instanceof Error ? err.message : 'Failed to load knowledge graph metrics - using sample data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [source, target, searchQuery, relationshipLimit, minStrength, depth, maxPaths, refreshKey]);

  return {
    data,
    loading,
    error,
    reload: () => setRefreshKey((prev) => prev + 1),
  };
}
