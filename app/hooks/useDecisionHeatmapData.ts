'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';

type Severity = 'low' | 'medium' | 'high' | 'critical';

type Hotspot = {
  name: string;
  lat: number;
  lng: number;
  severity: string;
  value: number;
  region?: string;
};

type ClimateRegion = {
  region: string;
  drought: string;
  flood: string;
  cropRisk: number;
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

type SentimentPoint = {
  subject: string;
  score: number;
};

export type HeatmapPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  populationDensity: number;
  climateRisk: number;
  economicRisk: number;
  sentimentRisk: number;
  populationBillion?: number;
  gdpTrillion?: number;
  unemploymentRate?: number;
  agricultureDependency?: number;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function severityToScore(severity: string): number {
  const normalized = severity.toLowerCase() as Severity;
  if (normalized === 'critical') return 95;
  if (normalized === 'high') return 78;
  if (normalized === 'medium') return 58;
  return 35;
}

function riskLabelToScore(label: string): number {
  const normalized = label.toLowerCase();
  if (normalized.includes('critical')) return 95;
  if (normalized.includes('high')) return 78;
  if (normalized.includes('moderate') || normalized.includes('medium')) return 58;
  return 35;
}

function getCoordByLabel(label: string): { lat: number; lng: number } {
  const v = label.toLowerCase();
  if (v.includes('north america')) return { lat: 45, lng: -100 };
  if (v.includes('south america')) return { lat: -15, lng: -60 };
  if (v.includes('europe') || v.includes('balkan') || v.includes('mediterranean')) return { lat: 50, lng: 12 };
  if (v.includes('africa') || v.includes('sahel') || v.includes('sahara') || v.includes('nile')) return { lat: 8, lng: 20 };
  if (v.includes('middle east') || v.includes('persian') || v.includes('arab')) return { lat: 26, lng: 46 };
  if (v.includes('asia') || v.includes('india') || v.includes('china') || v.includes('himalaya') || v.includes('korean') || v.includes('japan')) return { lat: 31, lng: 100 };
  if (v.includes('australia') || v.includes('oceania') || v.includes('pacific') || v.includes('new zealand')) return { lat: -24, lng: 135 };
  if (v.includes('central america') || v.includes('caribbean')) return { lat: 17, lng: -83 };
  if (v.includes('amazon') || v.includes('andes') || v.includes('pampas')) return { lat: -9, lng: -63 };
  if (v.includes('central asia') || v.includes('caspian')) return { lat: 43, lng: 66 };
  return { lat: 10, lng: 10 };
}

function distance(aLat: number, aLng: number, bLat: number, bLng: number): number {
  return Math.hypot(aLat - bLat, aLng - bLng);
}

function averageAgricultureDependency(region: EconomicRegion): number {
  if (!region.agriculture_zones?.length) return 30;
  const total = region.agriculture_zones.reduce((sum, z) => sum + (z.employment_percent || 0), 0);
  return total / region.agriculture_zones.length;
}

function buildHeatmapPoints(
  hotspots: Hotspot[],
  climateRegions: ClimateRegion[],
  economicRegions: EconomicRegion[],
  sentimentRiskBaseline: number,
): HeatmapPoint[] {
  const climateWithCoords = climateRegions.map((region) => ({
    ...region,
    ...getCoordByLabel(region.region),
  }));

  const economicWithCoords = economicRegions.map((region) => ({
    ...region,
    ...getCoordByLabel(region.name),
    agricultureDependency: averageAgricultureDependency(region),
  }));

  const pointsFromHotspots: HeatmapPoint[] = hotspots.map((hotspot, index) => {
    const nearestClimate = climateWithCoords
      .slice()
      .sort((a, b) => distance(hotspot.lat, hotspot.lng, a.lat, a.lng) - distance(hotspot.lat, hotspot.lng, b.lat, b.lng))[0];

    const nearestEconomy = economicWithCoords
      .slice()
      .sort((a, b) => distance(hotspot.lat, hotspot.lng, a.lat, a.lng) - distance(hotspot.lat, hotspot.lng, b.lat, b.lng))[0];

    const severityScore = severityToScore(hotspot.severity);
    const climateScore = clamp(
      (nearestClimate?.cropRisk || 50) * 0.62 +
        riskLabelToScore(nearestClimate?.drought || 'moderate') * 0.2 +
        riskLabelToScore(nearestClimate?.flood || 'moderate') * 0.18,
    );

    const economyScore = clamp(
      (100 - (nearestEconomy?.gdp_growth_percent || 2) * 8) * 0.32 +
        (nearestEconomy?.unemployment_rate || 6) * 4.2 +
        (nearestEconomy?.agricultureDependency || 30) * 0.52,
    );

    const populationScore = clamp((hotspot.value || 45) * 0.45 + severityScore * 0.25 + (nearestEconomy?.population_billion || 0.5) * 20);

    const sentimentScore = clamp(sentimentRiskBaseline * 0.6 + severityScore * 0.4);

    return {
      id: `hotspot-${index}`,
      name: hotspot.region || hotspot.name,
      lat: hotspot.lat,
      lng: hotspot.lng,
      populationDensity: populationScore,
      climateRisk: climateScore,
      economicRisk: economyScore,
      sentimentRisk: sentimentScore,
      populationBillion: nearestEconomy?.population_billion,
      gdpTrillion: nearestEconomy?.gdp_usd_trillion,
      unemploymentRate: nearestEconomy?.unemployment_rate,
      agricultureDependency: nearestEconomy?.agricultureDependency,
    };
  });

  const pointsFromEconomy: HeatmapPoint[] = economicWithCoords.map((region, index) => ({
    id: `economy-${index}`,
    name: region.name,
    lat: region.lat,
    lng: region.lng,
    populationDensity: clamp(region.population_billion * 26),
    climateRisk: clamp(55 + region.agricultureDependency * 0.35),
    economicRisk: clamp((100 - region.gdp_growth_percent * 10) * 0.35 + region.unemployment_rate * 4 + region.agricultureDependency * 0.45),
    sentimentRisk: clamp(sentimentRiskBaseline),
    populationBillion: region.population_billion,
    gdpTrillion: region.gdp_usd_trillion,
    unemploymentRate: region.unemployment_rate,
    agricultureDependency: region.agricultureDependency,
  }));

  const pointsFromClimate: HeatmapPoint[] = climateWithCoords.map((region, index) => ({
    id: `climate-${index}`,
    name: region.region,
    lat: region.lat,
    lng: region.lng,
    populationDensity: clamp(region.cropRisk * 0.7),
    climateRisk: clamp(region.cropRisk * 0.65 + riskLabelToScore(region.drought) * 0.2 + riskLabelToScore(region.flood) * 0.15),
    economicRisk: clamp(region.cropRisk * 0.58),
    sentimentRisk: clamp(sentimentRiskBaseline * 0.85),
  }));

  const all = [...pointsFromHotspots, ...pointsFromEconomy, ...pointsFromClimate];
  const uniqueByNameCell = new Map<string, HeatmapPoint>();

  all.forEach((point) => {
    const cell = `${point.name.toLowerCase()}-${Math.round(point.lat * 2)}-${Math.round(point.lng * 2)}`;
    if (!uniqueByNameCell.has(cell)) {
      uniqueByNameCell.set(cell, point);
      return;
    }

    const current = uniqueByNameCell.get(cell)!;
    uniqueByNameCell.set(cell, {
      ...current,
      populationDensity: (current.populationDensity + point.populationDensity) / 2,
      climateRisk: (current.climateRisk + point.climateRisk) / 2,
      economicRisk: (current.economicRisk + point.economicRisk) / 2,
      sentimentRisk: (current.sentimentRisk + point.sentimentRisk) / 2,
      populationBillion: current.populationBillion || point.populationBillion,
      gdpTrillion: current.gdpTrillion || point.gdpTrillion,
      unemploymentRate: current.unemploymentRate || point.unemploymentRate,
      agricultureDependency: current.agricultureDependency || point.agricultureDependency,
    });
  });

  return Array.from(uniqueByNameCell.values()).slice(0, 220);
}

export function useDecisionHeatmapData() {
  const { data, loading, error } = useGeospatialMetrics({ refreshIntervalMs: 30000 });
  const [sentimentRadar, setSentimentRadar] = useState<SentimentPoint[]>([]);

  useEffect(() => {
    let active = true;

    const loadSentiment = async () => {
      try {
        const response = await apiGet<{ radar: SentimentPoint[] }>('/api/intelligence/sentiment-radar');
        if (active) {
          setSentimentRadar(response.radar || []);
        }
      } catch {
        if (active) {
          setSentimentRadar([
            { subject: 'Geopolitical', score: 54 },
            { subject: 'Economic', score: 58 },
            { subject: 'Climate', score: 52 },
            { subject: 'Social', score: 49 },
          ]);
        }
      }
    };

    loadSentiment();
    const interval = window.setInterval(loadSentiment, 60000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const sentimentRiskBaseline = useMemo(() => {
    if (!sentimentRadar.length) return 55;
    const avgSentiment = sentimentRadar.reduce((sum, point) => sum + point.score, 0) / sentimentRadar.length;
    return clamp(100 - avgSentiment);
  }, [sentimentRadar]);

  const points = useMemo(
    () =>
      buildHeatmapPoints(
        (data.hotspots || []) as Hotspot[],
        (data.climateRegions || []) as ClimateRegion[],
        (data.economicRegions || []) as EconomicRegion[],
        sentimentRiskBaseline,
      ),
    [data, sentimentRiskBaseline],
  );

  return {
    points,
    sentimentRiskBaseline,
    loading,
    error,
    rawData: data,
    updatedAt: new Date().toISOString(),
  };
}
