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

export function useKnowledgeGraphMetrics(options: HookOptions = {}) {
  const [data, setData] = useState<KnowledgeGraphMetrics>({
    nodeTypes: [],
    relationships: [],
    paths: [],
    shaclSummary: { shapes_total: 0, shapes_passed: 0, shapes_warn: 0, total_violations: 0 },
    shaclShapes: [],
    conflict: { total_edges: 0, high_risk_edges: 0, risk_ratio: 0, hotspots: [] },
    centrality: { node_count: 0, edge_count: 0, avg_degree: 0, density: 0, top_central_nodes: [] },
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
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load knowledge graph metrics');
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
