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

type Industry = {
  name: string;
  percentage: number;
  value_usd_billion: number;
};

type AgriculturalZone = {
  zone: string;
  countries: string[];
  crops: string[];
  production_million_tons: number;
  employment_percent: number;
};

type EconomicRegion = {
  name: string;
  gdp_usd_trillion: number;
  gdp_growth_percent: number;
  population_billion: number;
  employment_rate: number;
  unemployment_rate: number;
  major_industries: Industry[];
  agriculture_zones: AgriculturalZone[];
};

type GeospatialMetrics = {
  hotspots: Hotspot[];
  climateRegions: ClimateRegion[];
  incidents: Incident[];
  economicRegions?: EconomicRegion[];
};

export function useGeospatialMetrics() {
  const [data, setData] = useState<GeospatialMetrics>({ hotspots: [], climateRegions: [], incidents: [], economicRegions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [hotspotsRes, climateRes, incidentsRes, economicRes] = await Promise.all([
          apiGet<{ hotspots: Hotspot[] }>('/api/geospatial/hotspots'),
          apiGet<{ regions: ClimateRegion[] }>('/api/geospatial/climate-indicators'),
          apiGet<{ incidents: Incident[] }>('/api/geospatial/incidents/global'),
          apiGet<{ regions: EconomicRegion[] }>('/api/geospatial/economic-activity'),
        ]);

        if (!active) return;
        setData({
          hotspots: hotspotsRes.hotspots,
          climateRegions: climateRes.regions,
          incidents: incidentsRes.incidents,
          economicRegions: economicRes.regions,
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
