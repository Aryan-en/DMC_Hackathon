'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Layers, Flame, Users, LineChart, Plus, Minus, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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

type EconomicRegion = {
  name: string;
  gdp_usd_trillion: number;
  gdp_growth_percent: number;
  population_billion: number;
  employment_rate: number;
  unemployment_rate: number;
};

type HeatPoint = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  populationScore: number;
  climateScore: number;
  economyScore: number;
};

type Props = {
  hotspots: Hotspot[];
  climateRegions: ClimateRegion[];
  economicRegions?: EconomicRegion[];
};

type CountryPin = {
  name: string;
  lat: number;
  lng: number;
  continent: string;
  region?: string;
};

const continentLabels = [
  { name: 'NORTH AMERICA', x: 0.16, y: 0.24 },
  { name: 'SOUTH AMERICA', x: 0.26, y: 0.57 },
  { name: 'EUROPE', x: 0.50, y: 0.20 },
  { name: 'AFRICA', x: 0.56, y: 0.39 },
  { name: 'ASIA', x: 0.72, y: 0.29 },
  { name: 'OCEANIA', x: 0.84, y: 0.60 },
  { name: 'ANTARCTICA', x: 0.50, y: 0.84 },
];

const countryPins: CountryPin[] = [
  { name: 'Russia', lat: 61.5, lng: 105.3, continent: 'ASIA', region: 'North Asia' },
  { name: 'United Kingdom', lat: 55.4, lng: -3.4, continent: 'EUROPE' },
  { name: 'Spain', lat: 40.5, lng: -3.7, continent: 'EUROPE' },
  { name: 'Italy', lat: 41.9, lng: 12.5, continent: 'EUROPE' },
  { name: 'Poland', lat: 52.0, lng: 19.1, continent: 'EUROPE' },
  { name: 'Ukraine', lat: 48.3, lng: 31.2, continent: 'EUROPE' },
  { name: 'Sweden', lat: 62.0, lng: 15.0, continent: 'EUROPE' },
  { name: 'China', lat: 35, lng: 105, continent: 'ASIA' },
  { name: 'India', lat: 20, lng: 78, continent: 'ASIA' },
  { name: 'Pakistan', lat: 30, lng: 69, continent: 'ASIA' },
  { name: 'Bangladesh', lat: 23.7, lng: 90.4, continent: 'ASIA' },
  { name: 'Nepal', lat: 28, lng: 84, continent: 'ASIA' },
  { name: 'Saudi Arabia', lat: 24, lng: 45, continent: 'ASIA' },
  { name: 'Iran', lat: 32, lng: 53.7, continent: 'ASIA' },
  { name: 'Iraq', lat: 33.3, lng: 44.4, continent: 'ASIA' },
  { name: 'Turkey', lat: 38.9, lng: 35.2, continent: 'ASIA' },
  { name: 'Kazakhstan', lat: 48, lng: 68, continent: 'ASIA' },
  { name: 'Mongolia', lat: 46, lng: 103.8, continent: 'ASIA' },
  { name: 'Thailand', lat: 15, lng: 101, continent: 'ASIA' },
  { name: 'Vietnam', lat: 14, lng: 108, continent: 'ASIA' },
  { name: 'Indonesia', lat: -2, lng: 113, continent: 'ASIA' },
  { name: 'Philippines', lat: 12, lng: 122, continent: 'ASIA' },
  { name: 'South Korea', lat: 37, lng: 127.7, continent: 'ASIA' },
  { name: 'Japan', lat: 36.2, lng: 138.2, continent: 'ASIA' },
  { name: 'Malaysia', lat: 4.2, lng: 102.0, continent: 'ASIA' },
  { name: 'Singapore', lat: 1.3, lng: 103.8, continent: 'ASIA' },
  { name: 'Sri Lanka', lat: 7.9, lng: 80.7, continent: 'ASIA' },
  { name: 'Myanmar', lat: 21.9, lng: 95.9, continent: 'ASIA' },
  { name: 'Cambodia', lat: 12.5, lng: 104.9, continent: 'ASIA' },
  { name: 'Laos', lat: 19.8, lng: 102.5, continent: 'ASIA' },
  { name: 'Afghanistan', lat: 33.9, lng: 67.7, continent: 'ASIA' },
  { name: 'UAE', lat: 24.4, lng: 54.4, continent: 'ASIA' },
  { name: 'Qatar', lat: 25.3, lng: 51.2, continent: 'ASIA' },
  { name: 'United States', lat: 37, lng: -95, continent: 'NORTH AMERICA' },
  { name: 'Canada', lat: 56, lng: -106, continent: 'NORTH AMERICA' },
  { name: 'Mexico', lat: 23, lng: -102, continent: 'NORTH AMERICA' },
  { name: 'Guatemala', lat: 15.8, lng: -90.2, continent: 'NORTH AMERICA' },
  { name: 'Cuba', lat: 21.5, lng: -77.8, continent: 'NORTH AMERICA' },
  { name: 'Panama', lat: 8.5, lng: -80.8, continent: 'NORTH AMERICA' },
  { name: 'Jamaica', lat: 18.1, lng: -77.3, continent: 'NORTH AMERICA' },
  { name: 'Brazil', lat: -10, lng: -51.9, continent: 'SOUTH AMERICA' },
  { name: 'Argentina', lat: -38.4, lng: -63.6, continent: 'SOUTH AMERICA' },
  { name: 'Chile', lat: -35.7, lng: -71.5, continent: 'SOUTH AMERICA' },
  { name: 'Peru', lat: -9.2, lng: -75.0, continent: 'SOUTH AMERICA' },
  { name: 'Colombia', lat: 4.6, lng: -74.1, continent: 'SOUTH AMERICA' },
  { name: 'Venezuela', lat: 7.0, lng: -66.2, continent: 'SOUTH AMERICA' },
  { name: 'Ecuador', lat: -1.8, lng: -78.2, continent: 'SOUTH AMERICA' },
  { name: 'Egypt', lat: 26, lng: 29, continent: 'AFRICA' },
  { name: 'Nigeria', lat: 9.1, lng: 8.7, continent: 'AFRICA' },
  { name: 'South Africa', lat: -30.6, lng: 22.9, continent: 'AFRICA' },
  { name: 'Ethiopia', lat: 9.1, lng: 40.5, continent: 'AFRICA' },
  { name: 'Kenya', lat: -0.1, lng: 37.9, continent: 'AFRICA' },
  { name: 'Tanzania', lat: -6.4, lng: 34.9, continent: 'AFRICA' },
  { name: 'Algeria', lat: 28.0, lng: 1.7, continent: 'AFRICA' },
  { name: 'Morocco', lat: 31.8, lng: -7.1, continent: 'AFRICA' },
  { name: 'Ghana', lat: 7.9, lng: -1.0, continent: 'AFRICA' },
  { name: 'Australia', lat: -25.3, lng: 133.8, continent: 'OCEANIA' },
  { name: 'New Zealand', lat: -40.9, lng: 174.9, continent: 'OCEANIA' },
  { name: 'Papua New Guinea', lat: -6.3, lng: 147.0, continent: 'OCEANIA' },
  { name: 'Fiji', lat: -17.7, lng: 178.1, continent: 'OCEANIA' },
  { name: 'Norway', lat: 60.4, lng: 8.4, continent: 'EUROPE' },
  { name: 'Germany', lat: 51.2, lng: 10.4, continent: 'EUROPE' },
  { name: 'France', lat: 46.2, lng: 2.2, continent: 'EUROPE' },
];

const severityWeight: Record<string, number> = {
  low: 35,
  medium: 55,
  high: 75,
  critical: 95,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function normalizeRiskLabel(label: string): number {
  const upper = label.toUpperCase();
  if (upper === 'CRITICAL') return 95;
  if (upper === 'HIGH') return 75;
  if (upper === 'MODERATE') return 55;
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

function latLngToCanvas(lat: number, lng: number, width: number, height: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function canvasToLatLng(x: number, y: number, width: number, height: number): { lat: number; lng: number } {
  const lng = (x / width) * 360 - 180;
  const lat = 90 - (y / height) * 180;
  return { lat, lng };
}

function inferContinentFromLatLng(lat: number, lng: number): string | null {
  if (lat <= -58) return 'ANTARCTICA';

  if (lat >= 5 && lat <= 83 && lng >= -170 && lng <= -50) return 'NORTH AMERICA';
  if (lat >= -58 && lat <= 16 && lng >= -92 && lng <= -30) return 'SOUTH AMERICA';

  if (lat >= -36 && lat <= 38 && lng >= -20 && lng <= 55) return 'AFRICA';
  if (lat >= 35 && lat <= 72 && lng >= -15 && lng <= 60) return 'EUROPE';

  if (lat >= -12 && lat <= 82 && lng >= 25 && lng <= 180) {
    if (lat <= 7 && lng >= 110) return 'OCEANIA';
    return 'ASIA';
  }

  if (lat >= -50 && lat <= 8 && lng >= 110 && lng <= 180) return 'OCEANIA';

  return null;
}

function drawWorldGuides(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  // Grid lines
  ctx.strokeStyle = 'var(--border-subtle)';
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;

  [30, 60, 90, 120, 150].forEach((segment) => {
    const x = (segment / 180) * (width / 2);
    ctx.beginPath();
    ctx.moveTo(width / 2 + x, 0);
    ctx.lineTo(width / 2 + x, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2 - x, 0);
    ctx.lineTo(width / 2 - x, height);
    ctx.stroke();
  });

  [30, 60].forEach((segment) => {
    const y = (segment / 90) * (height / 2);
    ctx.beginPath();
    ctx.moveTo(0, height / 2 + y);
    ctx.lineTo(width, height / 2 + y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, height / 2 - y);
    ctx.lineTo(width, height / 2 - y);
    ctx.stroke();
  });

  // Equator Line - Using metric accent
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--metric-accent').trim() || '#c8a84a';
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = accentColor;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  ctx.restore();
}

function drawHeatLayer(
  ctx: CanvasRenderingContext2D,
  points: HeatPoint[],
  width: number,
  height: number,
  scoreAccessor: (p: HeatPoint) => number,
  color: { r: number; g: number; b: number },
  opacity: number,
  radius: number,
): void {
  points.forEach((point) => {
    const score = clamp(scoreAccessor(point));
    if (score <= 0) return;

    const { x, y } = latLngToCanvas(point.lat, point.lng, width, height);
    const influence = radius * (0.45 + score / 140);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, influence);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.75, opacity * (score / 100))})`);
    gradient.addColorStop(0.45, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.45, opacity * 0.7)})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, influence, 0, Math.PI * 2);
    ctx.fill();
  });
}

function buildHeatPoints(hotspots: Hotspot[], climateRegions: ClimateRegion[], economicRegions: EconomicRegion[] = []): HeatPoint[] {
  const byKey = new Map<string, HeatPoint>();

  hotspots.forEach((h, idx) => {
    const key = `${(h.region || h.name).toLowerCase()}-${idx}`;
    const scoreFromSeverity = severityWeight[(h.severity || '').toLowerCase()] || 50;
    byKey.set(key, {
      id: `h-${idx}`,
      name: h.region || h.name,
      lat: h.lat,
      lng: h.lng,
      populationScore: clamp((h.value * 0.6 + scoreFromSeverity * 0.4)),
      climateScore: 0,
      economyScore: 0,
    });
  });

  climateRegions.forEach((c, idx) => {
    const coord = getCoordByLabel(c.region);
    const key = `c-${c.region.toLowerCase()}-${idx}`;
    const climate = clamp(c.cropRisk * 0.62 + normalizeRiskLabel(c.drought) * 0.22 + normalizeRiskLabel(c.flood) * 0.16);
    byKey.set(key, {
      id: `c-${idx}`,
      name: c.region,
      lat: coord.lat,
      lng: coord.lng,
      populationScore: 0,
      climateScore: climate,
      economyScore: 0,
    });
  });

  economicRegions?.forEach((e, idx) => {
    const coord = getCoordByLabel(e.name);
    const key = `e-${e.name.toLowerCase()}-${idx}`;
    const population = clamp(e.population_billion * 55 + (100 - e.unemployment_rate * 4));
    const economy = clamp(e.gdp_usd_trillion * 8 + e.gdp_growth_percent * 7 + e.employment_rate * 0.45);
    byKey.set(key, {
      id: `e-${idx}`,
      name: e.name,
      lat: coord.lat,
      lng: coord.lng,
      populationScore: population,
      climateScore: 0,
      economyScore: economy,
    });
  });

  return Array.from(byKey.values());
}

export default function MultiLayerGeoHeatmap({ hotspots, climateRegions, economicRegions }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const landMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const continentHitboxesRef = useRef<Array<{ name: string; left: number; top: number; width: number; height: number }>>([]);
  const dragRef = useRef<{ dragging: boolean; x: number; y: number }>({ dragging: false, x: 0, y: 0 });

  const [size, setSize] = useState({ width: 1000, height: 420 });
  const [showPopulation, setShowPopulation] = useState(true);
  const [showClimate, setShowClimate] = useState(true);
  const [showEconomy, setShowEconomy] = useState(true);
  const [radius, setRadius] = useState(50);
  const [opacity, setOpacity] = useState(0.52);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedContinent, setSelectedContinent] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryPin | null>(null);
  const analysisRef = useRef<HTMLDivElement | null>(null);

  const points = useMemo(
    () => buildHeatPoints(hotspots, climateRegions, economicRegions),
    [hotspots, climateRegions, economicRegions],
  );

  const topBlendedCells = useMemo(() => {
    return [...points]
      .map((p) => ({
        ...p,
        composite: clamp(p.populationScore * 0.34 + p.climateScore * 0.33 + p.economyScore * 0.33),
        blended: Number((clamp(p.populationScore * 0.34 + p.climateScore * 0.33 + p.economyScore * 0.33) / 65).toFixed(2)),
      }))
      .sort((a, b) => b.composite - a.composite)
      .slice(0, 8);
  }, [points]);

  const visibleCountries = useMemo(() => {
    if (!selectedContinent) return [];
    return countryPins
      .filter((c) => c.continent === selectedContinent)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedContinent]);

  const selectedCountryMetrics = useMemo(() => {
    if (!selectedCountry) return null;

    const nearestPoint = [...points]
      .sort((a, b) => {
        const da = Math.hypot(selectedCountry.lat - a.lat, selectedCountry.lng - a.lng);
        const db = Math.hypot(selectedCountry.lat - b.lat, selectedCountry.lng - b.lng);
        return da - db;
      })[0];

    const climateMatch = climateRegions.find((c) => c.region.toLowerCase().includes(selectedCountry.continent.toLowerCase().split(' ')[0])) || climateRegions[0];
    const economyMatch = (economicRegions || []).find((e) => {
      const n = e.name.toLowerCase();
      const cc = selectedCountry.continent.toLowerCase();
      return n.includes(cc) || n.includes(selectedCountry.name.toLowerCase());
    }) || (economicRegions || [])[0];

    return {
      pressure: Math.round((nearestPoint?.populationScore ?? 51) * 10) / 10,
      climate: Math.round((nearestPoint?.climateScore ?? climateMatch?.cropRisk ?? 62) * 10) / 10,
      economy: Math.round((nearestPoint?.economyScore ?? 55) * 10) / 10,
      hotspots: Math.max(0, hotspots.filter((h) => Math.hypot(selectedCountry.lat - h.lat, selectedCountry.lng - h.lng) < 12).length),
      criticalSignals: Math.max(0, hotspots.filter((h) => (h.severity || '').toLowerCase() === 'critical' && Math.hypot(selectedCountry.lat - h.lat, selectedCountry.lng - h.lng) < 14).length),
      climateRegion: climateMatch?.region || 'Regional Cluster',
      drought: climateMatch?.drought || 'moderate',
      flood: climateMatch?.flood || 'moderate',
      gdp: economyMatch?.gdp_usd_trillion || 3.56,
      growth: economyMatch?.gdp_growth_percent || 0.6,
      employment: economyMatch?.employment_rate || 10.9,
    };
  }, [selectedCountry, points, hotspots, climateRegions, economicRegions]);

  function clampPan(nextPan: { x: number; y: number }, nextZoom: number): { x: number; y: number } {
    const drawWidth = size.width * nextZoom;
    const drawHeight = size.height * nextZoom;
    const overflowX = Math.max(0, (drawWidth - size.width) / 2);
    const overflowY = Math.max(0, (drawHeight - size.height) / 2);
    return {
      x: Math.max(-overflowX, Math.min(overflowX, nextPan.x)),
      y: Math.max(-overflowY, Math.min(overflowY, nextPan.y)),
    };
  }

  function getPanForFocus(focusX: number, focusY: number, nextZoom: number): { x: number; y: number } {
    const drawWidth = size.width * nextZoom;
    const drawHeight = size.height * nextZoom;
    const baseOffsetX = (size.width - drawWidth) / 2;
    const baseOffsetY = (size.height - drawHeight) / 2;
    const targetPan = {
      x: size.width / 2 - (baseOffsetX + focusX * nextZoom),
      y: size.height / 2 - (baseOffsetY + focusY * nextZoom),
    };
    return clampPan(targetPan, nextZoom);
  }

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const resize = () => {
      const width = Math.max(640, host.clientWidth - 2);
      const height = Math.max(360, Math.round(width * 0.42));
      setSize({ width, height });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = '/WorldMap.png';
    img.onload = () => {
      mapImageRef.current = img;
      setMapLoaded(true);
    };
    img.onerror = () => {
      console.warn('Failed to load WorldMap.png');
      setMapLoaded(false);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = size.width;
    canvas.height = size.height;

    ctx.clearRect(0, 0, size.width, size.height);

    const sceneCanvas = document.createElement('canvas');
    sceneCanvas.width = size.width;
    sceneCanvas.height = size.height;
    const sceneCtx = sceneCanvas.getContext('2d');
    if (!sceneCtx) return;

    // Draw world map background or gradient
    if (mapLoaded && mapImageRef.current) {
      sceneCtx.drawImage(mapImageRef.current, 0, 0, size.width, size.height);
    } else {
      const bgGradient = sceneCtx.createLinearGradient(0, 0, 0, size.height);
      bgGradient.addColorStop(0, 'rgba(3, 8, 16, 0.95)');
      bgGradient.addColorStop(1, 'rgba(7, 19, 37, 0.95)');
      sceneCtx.fillStyle = bgGradient;
      sceneCtx.fillRect(0, 0, size.width, size.height);
    }

    drawWorldGuides(sceneCtx, size.width, size.height);

    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = size.width;
    heatCanvas.height = size.height;
    const heatCtx = heatCanvas.getContext('2d');

    if (heatCtx) {
      if (showPopulation) {
        drawHeatLayer(
          heatCtx,
          points,
          size.width,
          size.height,
          (p) => p.populationScore,
          { r: 34, g: 197, b: 94 },
          opacity,
          radius,
        );
      }

      if (showClimate) {
        drawHeatLayer(
          heatCtx,
          points,
          size.width,
          size.height,
          (p) => p.climateScore,
          { r: 56, g: 189, b: 248 },
          opacity,
          radius,
        );
      }

      if (showEconomy) {
        drawHeatLayer(
          heatCtx,
          points,
          size.width,
          size.height,
          (p) => p.economyScore,
          { r: 245, g: 158, b: 11 },
          opacity,
          radius,
        );
      }

      if (mapLoaded && mapImageRef.current) {
        const needsMaskBuild =
          !landMaskCanvasRef.current ||
          landMaskCanvasRef.current.width !== size.width ||
          landMaskCanvasRef.current.height !== size.height;

        if (needsMaskBuild) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = size.width;
          maskCanvas.height = size.height;
          const maskCtx = maskCanvas.getContext('2d');

          if (maskCtx) {
            maskCtx.drawImage(mapImageRef.current, 0, 0, size.width, size.height);
            const imageData = maskCtx.getImageData(0, 0, size.width, size.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
              const blueDominant = b > r * 1.12 && b > g * 1.08;
              const isLand = a > 24 && luminance > 82 && !blueDominant;

              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
              data[i + 3] = isLand ? 255 : 0;
            }

            maskCtx.putImageData(imageData, 0, 0);
            landMaskCanvasRef.current = maskCanvas;
          }
        }

        if (landMaskCanvasRef.current) {
          heatCtx.globalCompositeOperation = 'destination-in';
          heatCtx.drawImage(landMaskCanvasRef.current, 0, 0, size.width, size.height);
          heatCtx.globalCompositeOperation = 'source-over';
        }
      }

      sceneCtx.drawImage(heatCanvas, 0, 0);
    }

    // Draw continent labels (countries intentionally hidden)
    const hitboxes: Array<{ name: string; left: number; top: number; width: number; height: number }> = [];
    continentLabels.forEach((label) => {
      const x = label.x * size.width;
      const y = label.y * size.height;

      sceneCtx.save();
      sceneCtx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      sceneCtx.textAlign = 'center';
      sceneCtx.textBaseline = 'middle';

      const text = label.name;
      const textWidth = sceneCtx.measureText(text).width;
      const padX = 8;
      const padY = 5;
      const w = textWidth + padX * 2;
      const h = 20;
      const left = x - w / 2;
      const top = y - h / 2;
      const labelRadius = 6;

      hitboxes.push({ name: label.name, left, top, width: w, height: h });

      sceneCtx.beginPath();
      sceneCtx.moveTo(left + labelRadius, top);
      sceneCtx.lineTo(left + w - labelRadius, top);
      sceneCtx.quadraticCurveTo(left + w, top, left + w, top + labelRadius);
      sceneCtx.lineTo(left + w, top + h - labelRadius);
      sceneCtx.quadraticCurveTo(left + w, top + h, left + w - labelRadius, top + h);
      sceneCtx.lineTo(left + labelRadius, top + h);
      sceneCtx.quadraticCurveTo(left, top + h, left, top + h - labelRadius);
      sceneCtx.lineTo(left, top + labelRadius);
      sceneCtx.quadraticCurveTo(left, top, left + labelRadius, top);
      sceneCtx.closePath();
      // Use metric-accent for selected vs unselected
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--metric-accent').trim() || '#c8a84a';
      sceneCtx.fillStyle = selectedContinent === label.name ? 'rgba(200, 168, 74, 0.25)' : 'rgba(15, 23, 42, 0.78)'; // Keep some base for contrast
      if (selectedContinent === label.name) {
          sceneCtx.fillStyle = `color-mix(in srgb, ${accentColor}, transparent 75%)`;
      }
      sceneCtx.fill();
      sceneCtx.strokeStyle = selectedContinent === label.name ? accentColor : 'var(--border-color)';
      sceneCtx.lineWidth = 1;
      sceneCtx.stroke();

      sceneCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      sceneCtx.fillText(text, x + 1, y + 1);

      sceneCtx.fillStyle = 'var(--text-primary)';
      sceneCtx.fillText(text, x, y);
      sceneCtx.restore();
    });
    continentHitboxesRef.current = hitboxes;

    const drawWidth = size.width * zoom;
    const drawHeight = size.height * zoom;
    const clampedPan = clampPan(pan, zoom);
    const offsetX = (size.width - drawWidth) / 2 + clampedPan.x;
    const offsetY = (size.height - drawHeight) / 2 + clampedPan.y;
    ctx.drawImage(sceneCanvas, offsetX, offsetY, drawWidth, drawHeight);
  }, [points, opacity, radius, showClimate, showEconomy, showPopulation, size.height, size.width, mapLoaded, zoom, pan, selectedContinent]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const drawWidth = size.width * zoom;
    const drawHeight = size.height * zoom;
    const clampedPan = clampPan(pan, zoom);
    const offsetX = (size.width - drawWidth) / 2 + clampedPan.x;
    const offsetY = (size.height - drawHeight) / 2 + clampedPan.y;

    const baseX = (clickX - offsetX) / zoom;
    const baseY = (clickY - offsetY) / zoom;

    const hit = continentHitboxesRef.current.find(
      (box) => baseX >= box.left && baseX <= box.left + box.width && baseY >= box.top && baseY <= box.top + box.height,
    );

    if (hit) {
      const clicked = continentLabels.find((c) => c.name === hit.name);
      const nextZoom = Math.max(2.1, zoom);
      if (clicked) {
        setZoom(nextZoom);
        setPan(getPanForFocus(clicked.x * size.width, clicked.y * size.height, nextZoom));
      }
      setSelectedContinent(hit.name);
      setSelectedCountry(null);
      return;
    }

    const geo = canvasToLatLng(baseX, baseY, size.width, size.height);
    const inferredContinent = inferContinentFromLatLng(geo.lat, geo.lng);

    if (inferredContinent) {
      const clicked = continentLabels.find((c) => c.name === inferredContinent);
      const nextZoom = Math.max(2.1, zoom);
      if (clicked) {
        setZoom(nextZoom);
        setPan(getPanForFocus(clicked.x * size.width, clicked.y * size.height, nextZoom));
      }
      setSelectedContinent(inferredContinent);
      setSelectedCountry(null);
      return;
    }

    setSelectedContinent(null);
    setSelectedCountry(null);
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    dragRef.current = { dragging: true, x: e.clientX, y: e.clientY };
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragRef.current.dragging || zoom <= 1) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { dragging: true, x: e.clientX, y: e.clientY };
    setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }, zoom));
  }

  function handleCanvasMouseUp() {
    dragRef.current.dragging = false;
  }

  function projectToScreen(lat: number, lng: number): { x: number; y: number } {
    const base = latLngToCanvas(lat, lng, size.width, size.height);
    const drawWidth = size.width * zoom;
    const drawHeight = size.height * zoom;
    const clampedPan = clampPan(pan, zoom);
    const offsetX = (size.width - drawWidth) / 2 + clampedPan.x;
    const offsetY = (size.height - drawHeight) / 2 + clampedPan.y;
    return {
      x: offsetX + base.x * zoom,
      y: offsetY + base.y * zoom,
    };
  }

  function snapBasePointToLand(baseX: number, baseY: number): { x: number; y: number } {
    const maskCanvas = landMaskCanvasRef.current;
    if (!maskCanvas) return { x: baseX, y: baseY };

    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return { x: baseX, y: baseY };

    const width = maskCanvas.width;
    const height = maskCanvas.height;

    const imageData = maskCtx.getImageData(0, 0, width, height).data;

    const clampX = Math.max(0, Math.min(width - 1, Math.round(baseX)));
    const clampY = Math.max(0, Math.min(height - 1, Math.round(baseY)));

    const alphaAt = (x: number, y: number) => {
      const i = (y * width + x) * 4 + 3;
      return imageData[i];
    };

    if (alphaAt(clampX, clampY) > 0) {
      return { x: clampX, y: clampY };
    }

    for (let r = 2; r <= 36; r += 2) {
      for (let dx = -r; dx <= r; dx += 2) {
        const dy = Math.round(Math.sqrt(Math.max(0, r * r - dx * dx)));
        const candidates = [
          { x: clampX + dx, y: clampY + dy },
          { x: clampX + dx, y: clampY - dy },
        ];

        for (const p of candidates) {
          if (p.x < 0 || p.x >= width || p.y < 0 || p.y >= height) continue;
          if (alphaAt(p.x, p.y) > 0) {
            return p;
          }
        }
      }
    }

    return { x: clampX, y: clampY };
  }

  function projectCountryToScreen(country: CountryPin): { x: number; y: number } {
    const base = latLngToCanvas(country.lat, country.lng, size.width, size.height);
    const snapped = snapBasePointToLand(base.x, base.y);
    const drawWidth = size.width * zoom;
    const drawHeight = size.height * zoom;
    const clampedPan = clampPan(pan, zoom);
    const offsetX = (size.width - drawWidth) / 2 + clampedPan.x;
    const offsetY = (size.height - drawHeight) / 2 + clampedPan.y;
    return {
      x: offsetX + snapped.x * zoom,
      y: offsetY + snapped.y * zoom,
    };
  }

  function selectCountryAndRedirect(country: CountryPin): void {
    setSelectedCountry(country);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#country-analysis-${country.name.toLowerCase().replace(/\s+/g, '-')}`);
      window.setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 30);
    }
  }

  return (
    <div className="space-y-4">
      <div className="tactical-card rounded-xl p-5" ref={hostRef} style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Multi-Layer Geospatial Heatmap</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '0.4rem' }}>
              Population pressure, climate stress, and economic activity blended on one operational map.
            </p>
          </div>

          <div className="flex items-center gap-2 font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
            <Layers size={13} />
            <span>{points.length} geo-points fused</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div>
            <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--bg-card-elevated)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => setShowPopulation((v) => !v)}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all"
                  style={{
                    border: showPopulation ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    background: showPopulation ? 'color-mix(in srgb, var(--accent-emerald), transparent 85%)' : 'var(--metric-1)',
                    color: showPopulation ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontSize: '9px',
                  }}
                >
                  <Users size={13} /> Population
                </button>

                <button
                  onClick={() => setShowClimate((v) => !v)}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all"
                  style={{
                    border: showClimate ? '1px solid var(--accent-steel)' : '1px solid var(--border-color)',
                    background: showClimate ? 'color-mix(in srgb, var(--accent-steel), transparent 85%)' : 'var(--metric-1)',
                    color: showClimate ? 'var(--accent-steel)' : 'var(--text-muted)',
                    fontSize: '9px',
                  }}
                >
                  <Flame size={13} /> Climate
                </button>

                <button
                  onClick={() => setShowEconomy((v) => !v)}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 font-bold tracking-widest uppercase transition-all"
                  style={{
                    border: showEconomy ? '1px solid var(--accent-amber)' : '1px solid var(--border-color)',
                    background: showEconomy ? 'color-mix(in srgb, var(--accent-amber), transparent 85%)' : 'var(--metric-1)',
                    color: showEconomy ? 'var(--accent-amber)' : 'var(--text-muted)',
                    fontSize: '9px',
                  }}
                >
                  <LineChart size={13} /> Economy
                </button>
              </div>

            </div>

            <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
              <canvas
                ref={canvasRef}
                width={size.width}
                height={size.height}
                style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextZoom = Math.min(3, Number((zoom + 0.25).toFixed(2)));
                    setZoom(nextZoom);
                    setPan((prev) => clampPan(prev, nextZoom));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextZoom = Math.max(1, Number((zoom - 0.25).toFixed(2)));
                    setZoom(nextZoom);
                    setPan((prev) => clampPan(prev, nextZoom));
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  <Minus size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setSelectedContinent(null);
                    setSelectedCountry(null);
                  }}
                  className="px-3 h-8 rounded-lg flex items-center gap-1.5 transition-all hover:bg-white/5 font-bold uppercase tracking-widest"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '9px' }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
                <div className="px-2 h-8 rounded-lg flex items-center border font-mono" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)', fontSize: '10px', fontWeight: 700 }}>
                  {Math.round(zoom * 100)}%
                </div>
              </div>

              <div className="absolute bottom-3 right-3 rounded-lg p-2" style={{ background: 'rgba(2,8,23,0.82)', border: '1px solid rgba(148,163,184,0.35)' }}>
                <div className="grid grid-cols-3 gap-1">
                  <span />
                  <button
                    type="button"
                    onClick={() => setPan((prev) => clampPan({ x: prev.x, y: prev.y - 28 }, zoom))}
                    className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:bg-white/5"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <ArrowUp size={12} />
                  </button>
                  <span />
                  <button
                    type="button"
                    onClick={() => setPan((prev) => clampPan({ x: prev.x - 28, y: prev.y }, zoom))}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.28)', color: '#d1d5db' }}
                  >
                    <ArrowLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPan({ x: 0, y: 0 })}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.28)', color: '#e2e8f0', fontSize: '0.62rem', fontWeight: 700 }}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => setPan((prev) => clampPan({ x: prev.x + 28, y: prev.y }, zoom))}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.28)', color: '#d1d5db' }}
                  >
                    <ArrowRight size={12} />
                  </button>
                  <span />
                  <button
                    type="button"
                    onClick={() => setPan((prev) => clampPan({ x: prev.x, y: prev.y + 28 }, zoom))}
                    className="w-7 h-7 rounded-md flex items-center justify-center"
                    style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.28)', color: '#d1d5db' }}
                  >
                    <ArrowDown size={12} />
                  </button>
                  <span />
                </div>
              </div>

              {selectedContinent && (
                <>
                  {visibleCountries.map((country) => {
                    const pos = projectCountryToScreen(country);
                    const label = country.name;
                    return (
                      <button
                        key={`${country.name}-${country.lat}-${country.lng}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectCountryAndRedirect(country);
                        }}
                        className="absolute px-3 py-1 rounded-xl"
                        style={{
                          left: pos.x,
                          top: pos.y,
                          transform: 'translate(-50%, -50%)',
                          background: 'rgba(15,23,42,0.9)',
                          border: selectedCountry?.name === country.name ? '2px solid rgba(34,197,94,0.8)' : '2px solid rgba(0,177,255,0.55)',
                          color: '#e2e8f0',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          pointerEvents: 'auto',
                          boxShadow: '0 0 0 1px rgba(2,8,23,0.7) inset',
                          zIndex: 7,
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}

                  <div
                    className="absolute left-4 bottom-4 rounded-xl p-3"
                    style={{
                      background: 'rgba(2,8,23,0.78)',
                      border: '1px solid rgba(30,58,95,0.55)',
                      width: '220px',
                    }}
                  >
                    <div style={{ color: '#c8a84a', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.45rem', letterSpacing: '0.06em' }}>
                      {selectedContinent} COUNTRIES
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {visibleCountries.map((country) => (
                        <button
                          key={`${country.name}-chip`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectCountryAndRedirect(country);
                          }}
                          className="px-2 py-1 rounded-md"
                          style={{
                            background: 'rgba(30,41,59,0.95)',
                            border: selectedCountry?.name === country.name ? '1px solid rgba(34,197,94,0.8)' : '1px solid rgba(56,189,248,0.28)',
                            color: '#d6e8ff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            lineHeight: 1,
                          }}
                        >
                          {country.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className="rounded-xl p-4" style={{ background: 'var(--metric-1)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 900, marginBottom: '1rem', letterSpacing: '0.1em' }} className="uppercase">
              Top Blended Signals
            </h4>

            <div className="space-y-2" style={{ maxHeight: '370px', overflowY: 'auto', paddingRight: '2px' }}>
              {topBlendedCells.map((point) => (
                <div key={point.id} className="rounded-lg p-3 transition-all hover:bg-white/5 border border-white/5" style={{ background: 'var(--card-bg)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="uppercase tracking-tight" style={{ color: 'var(--text-primary)', fontSize: '11px', fontWeight: 900 }}>{point.name}</div>
                    <div style={{ color: 'var(--metric-accent)', fontSize: '12px', fontWeight: 900 }}>{point.blended.toFixed(2)}</div>
                  </div>
                  <div className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '0.2rem' }}>
                    {Math.round(point.lat)}°, {Math.round(point.lng)}°
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {selectedCountry && selectedCountryMetrics && (
        <div ref={analysisRef} className="tactical-card rounded-xl p-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div style={{ color: 'var(--metric-accent)', fontSize: '10px', fontWeight: 900, marginBottom: '0.25rem' }} className="uppercase tracking-widest">Country Intelligence Brief</div>
              <div style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>{selectedCountry.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '0.4rem' }} className="font-mono uppercase tracking-widest">{selectedCountry.continent} • {selectedCountry.lat.toFixed(4)}°, {selectedCountry.lng.toFixed(4)}°</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCountry(null)}
              className="px-4 py-2 rounded-lg font-black uppercase tracking-widest transition-all hover:bg-white/5"
              style={{ background: 'var(--metric-1)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '10px' }}
            >
              Close Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl p-4 border-l-4" style={{ background: 'color-mix(in srgb, var(--accent-crimson), transparent 95%)', borderColor: 'var(--accent-crimson)' }}>
              <div style={{ color: 'var(--accent-crimson)', fontSize: '10px', fontWeight: 900, marginBottom: '1rem' }} className="uppercase tracking-widest">Population Pressure</div>
              <div className="space-y-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                <div>Hotspots: <span className="font-black text-lg ml-2">{selectedCountryMetrics.hotspots}</span></div>
                <div>Critical Signals: <span className="font-black text-lg ml-2">{selectedCountryMetrics.criticalSignals}</span></div>
                <div className="pt-2 mt-2 border-t border-white/5 opacity-70">Metric Score: {selectedCountryMetrics.pressure.toFixed(1)}</div>
              </div>
            </div>

            <div className="rounded-xl p-4 border-l-4" style={{ background: 'color-mix(in srgb, var(--accent-emerald), transparent 95%)', borderColor: 'var(--accent-emerald)' }}>
              <div style={{ color: 'var(--accent-emerald)', fontSize: '10px', fontWeight: 900, marginBottom: '1rem' }} className="uppercase tracking-widest">Climate Stress</div>
              <div className="space-y-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                <div>Region: <span className="ml-2">{selectedCountryMetrics.climateRegion}</span></div>
                <div>Anomalies: <span className="ml-2">+{(selectedCountryMetrics.climate / 18).toFixed(1)}°C</span></div>
                <div className="pt-2 mt-2 border-t border-white/5 opacity-70">Stress Index: {selectedCountryMetrics.climate.toFixed(1)}</div>
              </div>
            </div>

            <div className="rounded-xl p-4 border-l-4" style={{ background: 'color-mix(in srgb, var(--accent-amber), transparent 95%)', borderColor: 'var(--accent-amber)' }}>
              <div style={{ color: 'var(--accent-amber)', fontSize: '10px', fontWeight: 900, marginBottom: '1rem' }} className="uppercase tracking-widest">Economic Risk</div>
              <div className="space-y-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                <div>GDP Focus: <span className="ml-2">${selectedCountryMetrics.gdp.toFixed(2)}T</span></div>
                <div>Growth: <span className="ml-2">{selectedCountryMetrics.growth.toFixed(1)}%</span></div>
                <div className="pt-2 mt-2 border-t border-white/5 opacity-70">Resilience: {selectedCountryMetrics.economy.toFixed(1)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
