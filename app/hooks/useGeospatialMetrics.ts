'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type Hotspot = {
  name: string;
  lat: number;
  lng: number;
  type: string;
  severity: string;
  value: number;
  region?: string;
};

type ClimateRegion = {
  region: string;
  temp: string;
  drought: string;
  flood: string;
  cropRisk: number;
};

type Incident = {
  name: string;
  lat: number;
  lng: number;
  type: string;
  date: string;
};

type GeospatialMetrics = {
  hotspots: Hotspot[];
  climateRegions: ClimateRegion[];
  incidents: Incident[];
};

export function useGeospatialMetrics() {
  const [data, setData] = useState<GeospatialMetrics>({ hotspots: [], climateRegions: [], incidents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [hotspotsRes, climateRes, incidentsRes] = await Promise.all([
          apiGet<{ hotspots: Hotspot[] }>('/api/geospatial/hotspots'),
          apiGet<{ regions: ClimateRegion[] }>('/api/geospatial/climate-indicators'),
          apiGet<{ incidents: Incident[] }>('/api/geospatial/incidents/global'),
        ]);

        if (!active) return;
        setData({
          hotspots: hotspotsRes.hotspots,
          climateRegions: climateRes.regions,
          incidents: incidentsRes.incidents,
        });
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load geospatial metrics');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
