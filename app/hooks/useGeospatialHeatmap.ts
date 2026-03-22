'use client';

import { useEffect, useState } from 'react';

type RegionData = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  riskScore: number;
  climateEvents: number;
  economicIndicator: number;
  populationDensity: number;
  lastUpdate: string;
};

type HeatmapOptions = {
  enableRealtime?: boolean;
  updateInterval?: number;
};

export function useGeospatialHeatmap(options: HeatmapOptions = {}) {
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { enableRealtime = false, updateInterval = 3000 } = options;

  // Initial data fetch
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        // This would normally call an API endpoint like /api/knowledge-graph/geospatial-data
        // For now, we'll use the sample data from the component
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    const interval = setInterval(() => {
      setRegions((prev) =>
        prev.map((region) => ({
          ...region,
          riskScore: Math.max(0, Math.min(100, region.riskScore + (Math.random() - 0.5) * 3)),
          climateEvents: Math.max(0, region.climateEvents + (Math.random() > 0.85 ? 1 : 0)),
          economicIndicator: Math.max(0, Math.min(100, region.economicIndicator + (Math.random() - 0.5) * 1.5)),
          lastUpdate: new Date().toISOString(), // Safe: only in useEffect, client-side only
        }))
      );
    }, updateInterval);

    return () => clearInterval(interval);
  }, [enableRealtime, updateInterval]);

  // Connect with knowledge graph
  const getConnectedEntities = (regionId: string) => {
    // This would normally query the knowledge graph for entities related to this region
    return [];
  };

  const getRiskCategory = (riskScore: number): 'low' | 'moderate' | 'high' | 'critical' => {
    if (riskScore < 25) return 'low';
    if (riskScore < 50) return 'moderate';
    if (riskScore < 75) return 'high';
    return 'critical';
  };

  return {
    regions,
    loading,
    error,
    getConnectedEntities,
    getRiskCategory,
    setRegions,
  };
}
