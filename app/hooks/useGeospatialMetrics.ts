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

// Fallback sample data
const SAMPLE_HOTSPOTS: Hotspot[] = [
  { name: 'Eastern Ukraine', lat: 48.5, lng: 37.8, type: 'conflict', severity: 'critical', value: 92, region: 'Europe' },
  { name: 'Taiwan Strait', lat: 24.0, lng: 119.5, type: 'geopolitical', severity: 'high', value: 78, region: 'Asia-Pacific' },
  { name: 'Horn of Africa', lat: 8.0, lng: 46.0, type: 'humanitarian', severity: 'high', value: 74, region: 'Africa' },
  { name: 'South China Sea', lat: 12.0, lng: 114.0, type: 'territorial', severity: 'medium', value: 65, region: 'Asia-Pacific' },
  { name: 'Sahel Region', lat: 14.5, lng: 1.0, type: 'conflict', severity: 'high', value: 71, region: 'Africa' },
];

const SAMPLE_CLIMATE_REGIONS: ClimateRegion[] = [
  { region: 'South Asia', temp: '+1.8°C', drought: 'High', flood: 'Critical', cropRisk: 82 },
  { region: 'Sub-Saharan Africa', temp: '+1.5°C', drought: 'Critical', flood: 'Medium', cropRisk: 76 },
  { region: 'Southeast Asia', temp: '+1.3°C', drought: 'Medium', flood: 'High', cropRisk: 68 },
  { region: 'Central America', temp: '+1.2°C', drought: 'High', flood: 'Medium', cropRisk: 61 },
];

const SAMPLE_INCIDENTS: Incident[] = [
  { name: 'Border Skirmish', lat: 34.5, lng: 69.1, type: 'military', date: '2026-03-20' },
  { name: 'Cyber Attack', lat: 50.4, lng: 30.5, type: 'cyber', date: '2026-03-19' },
  { name: 'Refugee Crisis', lat: 36.2, lng: 36.6, type: 'humanitarian', date: '2026-03-18' },
  { name: 'Trade Dispute', lat: 35.6, lng: 139.6, type: 'economic', date: '2026-03-17' },
];

const SAMPLE_ECONOMIC_REGIONS: EconomicRegion[] = [
  {
    name: 'Asia-Pacific',
    gdp_usd_trillion: 35.2,
    gdp_growth_percent: 4.8,
    population_billion: 4.3,
    employment_rate: 62.5,
    unemployment_rate: 5.1,
    major_industries: [
      { name: 'Technology', percentage: 28, value_usd_billion: 9856 },
      { name: 'Manufacturing', percentage: 24, value_usd_billion: 8448 },
    ],
    agriculture_zones: [
      { zone: 'Monsoon Belt', countries: ['India', 'Bangladesh'], crops: ['Rice', 'Wheat'], production_million_tons: 450, employment_percent: 42 },
    ],
  },
  {
    name: 'Europe',
    gdp_usd_trillion: 22.8,
    gdp_growth_percent: 1.9,
    population_billion: 0.75,
    employment_rate: 68.2,
    unemployment_rate: 6.3,
    major_industries: [
      { name: 'Services', percentage: 72, value_usd_billion: 16416 },
      { name: 'Manufacturing', percentage: 18, value_usd_billion: 4104 },
    ],
    agriculture_zones: [
      { zone: 'Mediterranean', countries: ['Spain', 'Italy', 'Greece'], crops: ['Olives', 'Wine Grapes'], production_million_tons: 120, employment_percent: 8 },
    ],
  },
];

export function useGeospatialMetrics() {
  const [data, setData] = useState<GeospatialMetrics>({
    hotspots: SAMPLE_HOTSPOTS,
    climateRegions: SAMPLE_CLIMATE_REGIONS,
    incidents: SAMPLE_INCIDENTS,
    economicRegions: SAMPLE_ECONOMIC_REGIONS,
  });
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
        setError(null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({
          hotspots: SAMPLE_HOTSPOTS,
          climateRegions: SAMPLE_CLIMATE_REGIONS,
          incidents: SAMPLE_INCIDENTS,
          economicRegions: SAMPLE_ECONOMIC_REGIONS,
        });
        setError(err instanceof Error ? err.message : 'Failed to load geospatial metrics - using sample data');
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
