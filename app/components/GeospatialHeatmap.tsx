'use client';

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

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
  bounds?: { n: number; s: number; e: number; w: number };
};

type RegionHeatmapProps = {
  onRegionClick?: (region: RegionData) => void;
  selectedRegionId?: string | null;
};

const sampleRegions: RegionData[] = [
  {
    id: 'na',
    name: 'North America',
    lat: 45,
    lng: -100,
    riskScore: 62,
    climateEvents: 8,
    economicIndicator: 85,
    populationDensity: 25,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 83, s: 15, e: -50, w: -170 },
  },
  {
    id: 'sa',
    name: 'South America',
    lat: -15,
    lng: -60,
    riskScore: 75,
    climateEvents: 12,
    economicIndicator: 55,
    populationDensity: 22,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 12, s: -56, e: -35, w: -82 },
  },
  {
    id: 'eu',
    name: 'Europe',
    lat: 50,
    lng: 10,
    riskScore: 45,
    climateEvents: 5,
    economicIndicator: 80,
    populationDensity: 70,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 71, s: 36, e: 40, w: -10 },
  },
  {
    id: 'af',
    name: 'Africa',
    lat: 0,
    lng: 20,
    riskScore: 85,
    climateEvents: 18,
    economicIndicator: 40,
    populationDensity: 35,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 37, s: -35, e: 55, w: -20 },
  },
  {
    id: 'me',
    name: 'Middle East',
    lat: 25,
    lng: 45,
    riskScore: 80,
    climateEvents: 10,
    economicIndicator: 65,
    populationDensity: 55,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 42, s: 12, e: 65, w: 25 },
  },
  {
    id: 'as',
    name: 'Asia',
    lat: 34,
    lng: 100,
    riskScore: 72,
    climateEvents: 22,
    economicIndicator: 75,
    populationDensity: 120,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: 77, s: -10, e: 180, w: 55 },
  },
  {
    id: 'au',
    name: 'Australia/Oceania',
    lat: -25,
    lng: 135,
    riskScore: 58,
    climateEvents: 6,
    economicIndicator: 82,
    populationDensity: 3,
    lastUpdate: '2026-03-22T12:00:00Z',
    bounds: { n: -10, s: -47, e: 180, w: 113 },
  },
];

// Gaussian kernel for ultra-smooth interpolation (zoom.earth style)
const gaussianKernel = (distance: number, sigma: number = 32): number => {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
};

// Enhanced interpolation with Gaussian weighting for seamless gradients
const interpolateRisk = (
  x: number,
  y: number,
  regions: RegionData[],
  canvasWidth: number,
  canvasHeight: number
): number => {
  const lng = (x / canvasWidth) * 360 - 180;
  const lat = 90 - (y / canvasHeight) * 180;

  let totalWeight = 0;
  let weightedRisk = 0;

  regions.forEach((region) => {
    const dx = lng - region.lng;
    const dy = lat - region.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const weight = gaussianKernel(distance, 32);

    if (weight > 0.0001) {
      weightedRisk += region.riskScore * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? weightedRisk / totalWeight : 12;
};

// Apply Gaussian blur for ultra-smooth thermal gradients
const applyGaussianBlur = (imageData: ImageData, radius: number = 4): void => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const tempData = new Uint8ClampedArray(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        weight = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = Math.min(height - 1, Math.max(0, y + dy));
          const nx = Math.min(width - 1, Math.max(0, x + dx));
          const dist = Math.sqrt(dx * dx + dy * dy);
          const w = Math.exp(-(dist * dist) / (2 * radius * radius));

          const idx = (ny * width + nx) * 4;
          r += tempData[idx] * w;
          g += tempData[idx + 1] * w;
          b += tempData[idx + 2] * w;
          weight += w;
        }
      }

      const idx = (y * width + x) * 4;
      data[idx] = Math.round(r / weight);
      data[idx + 1] = Math.round(g / weight);
      data[idx + 2] = Math.round(b / weight);
    }
  }
};

  // Draw country borders on canvas
  const drawCountryBorders = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const latLngToCanvas = (lat: number, lng: number) => {
      const x = ((lng + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      return [x, y];
    };

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;

    // Simplified world borders - major countries and coastlines
    const borders = [
      // North America - Canada/USA border
      {
        points: [
          [49.0, -141.0],
          [49.0, -95.0],
          [49.37, -85.0],
        ],
      },
      // USA general outline (simplified)
      {
        points: [
          [49.4, -125.0],
          [49.0, -125.0],
          [31.0, -117.0],
          [25.9, -97.0],
          [29.6, -93.5],
          [31.0, -81.0],
          [40.0, -71.0],
          [45.0, -67.0],
          [49.4, -125.0],
        ],
      },
      // Mexico
      {
        points: [
          [31.8, -117.1],
          [31.8, -86.7],
          [14.5, -92.0],
          [14.5, -117.1],
          [31.8, -117.1],
        ],
      },
      // Central America & Caribbean markers
      {
        points: [
          [17.0, -92.0],
          [9.0, -79.0],
        ],
      },
      // South America - Peru/Brazil border
      {
        points: [
          [-5.0, -68.0],
          [-23.0, -56.0],
        ],
      },
      // Brazil outline (simplified)
      {
        points: [
          [5.3, -60.0],
          [2.8, -40.3],
          [-33.7, -40.3],
          [-33.7, -59.0],
          [-5.0, -68.0],
          [5.3, -60.0],
        ],
      },
      // Europe - Mediterranean
      {
        points: [
          [43.0, -5.0],
          [35.0, 5.0],
        ],
      },
      // European borders (simplified)
      {
        points: [
          [70.0, 20.0],
          [65.0, 30.0],
          [60.0, 25.0],
          [50.0, 15.0],
          [40.0, -10.0],
          [35.0, -5.0],
          [43.0, 5.0],
          [46.0, 15.0],
          [48.0, 21.0],
          [50.0, 25.0],
          [70.0, 20.0],
        ],
      },
      // Africa - Cairo to Cape
      {
        points: [
          [31.0, 30.0],
          [0.0, 33.0],
          [-25.0, 33.0],
        ],
      },
      // Africa - West coast
      {
        points: [
          [27.0, -13.0],
          [0.0, -15.0],
          [-34.0, 18.0],
        ],
      },
      // Middle East borders
      {
        points: [
          [37.0, 26.0],
          [32.0, 35.0],
          [25.0, 55.0],
        ],
      },
      // Arabian Peninsula
      {
        points: [
          [32.0, 34.0],
          [12.0, 42.0],
          [2.0, 40.0],
        ],
      },
      // India/South Asia
      {
        points: [
          [35.0, 75.0],
          [28.0, 85.0],
          [8.0, 77.0],
        ],
      },
      // Southeast Asia
      {
        points: [
          [20.0, 100.0],
          [13.0, 104.0],
          [1.0, 103.0],
        ],
      },
      // East Asia - China/Russia border
      {
        points: [
          [53.0, 120.0],
          [42.0, 110.0],
          [35.0, 105.0],
        ],
      },
      // Japan/Korea area
      {
        points: [
          [45.0, 142.0],
          [34.0, 132.0],
        ],
      },
      // Australia
      {
        points: [
          [-10.0, 113.0],
          [-44.0, 113.0],
          [-44.0, 154.0],
          [-10.0, 154.0],
          [-10.0, 113.0],
        ],
      },
      // New Zealand
      {
        points: [
          [-34.0, 166.0],
          [-47.0, 166.0],
        ],
      },
    ];

    borders.forEach((border) => {
      if (border.points.length < 2) return;

      ctx.beginPath();
      const [x, y] = latLngToCanvas(border.points[0][0], border.points[0][1]);
      ctx.moveTo(x, y);

      for (let i = 1; i < border.points.length; i++) {
        const [px, py] = latLngToCanvas(
          border.points[i][0],
          border.points[i][1]
        );
        ctx.lineTo(px, py);
      }

      ctx.stroke();
    });
  };

export default function GeospatialHeatmap({
  onRegionClick,
  selectedRegionId,
}: RegionHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<RegionData[]>(sampleRegions);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const [isRealtime, setIsRealtime] = useState(false);

  // Thermal gradient color mapping (cool blue -> hot red like zoom.earth)
  const getRiskColor = (riskScore: number): { r: number; g: number; b: number } => {
    // Enhanced thermal gradient for smooth appearance
    let r = 0,
      g = 0,
      b = 0;

    if (riskScore < 15) {
      // Deep ocean blue
      const t = riskScore / 15;
      r = Math.round(10 + t * 25);
      g = Math.round(60 + t * 80);
      b = Math.round(160 + t * 95);
    } else if (riskScore < 30) {
      // Blue to cyan
      const t = (riskScore - 15) / 15;
      r = Math.round(35 + t * 115);
      g = Math.round(140 + t * 115);
      b = Math.round(255);
    } else if (riskScore < 45) {
      // Cyan to green
      const t = (riskScore - 30) / 15;
      r = Math.round(150 - t * 120);
      g = Math.round(255);
      b = Math.round(255 - t * 220);
    } else if (riskScore < 60) {
      // Green to yellow
      const t = (riskScore - 45) / 15;
      r = Math.round(30 + t * 225);
      g = Math.round(255);
      b = Math.round(35 - t * 35);
    } else if (riskScore < 75) {
      // Yellow to orange
      const t = (riskScore - 60) / 15;
      r = Math.round(255);
      g = Math.round(255 - t * 100);
      b = Math.round(0);
    } else if (riskScore < 90) {
      // Orange to red
      const t = (riskScore - 75) / 15;
      r = Math.round(255);
      g = Math.round(155 - t * 105);
      b = Math.round(0);
    } else {
      // Deep red (critical)
      r = Math.round(255);
      g = Math.round(50);
      b = Math.round(0);
    }

    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
    };
  };

  // Main heatmap rendering with advanced Gaussian blur for zoom.earth-style smoothness
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create image data for heatmap
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Render smooth gradient heatmap with enhanced interpolation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const risk = interpolateRisk(x, y, regions, width, height);
        const color = getRiskColor(risk);

        const index = (y * width + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }

    // Apply multiple passes of Gaussian blur for ultra-smooth thermal gradient
    applyGaussianBlur(imageData, 4);

    ctx.putImageData(imageData, 0, 0);

    // Draw country borders
    drawCountryBorders(ctx, width, height);

    // Draw subtle latitude/longitude grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;

    // Latitude lines (horizontal)
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Longitude lines (vertical)
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }, [regions]);

  // Handle canvas click to select nearest region
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const lng = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;

    // Find nearest region to clicked location
    let nearestRegion: RegionData | null = null;
    let minDistance = Infinity;

    regions.forEach((region) => {
      const dx = lng - region.lng;
      const dy = lat - region.lat;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance && distance < 28) {
        minDistance = distance;
        nearestRegion = region;
      }
    });

    if (nearestRegion) {
      setSelectedRegion(nearestRegion);
      onRegionClick?.(nearestRegion);
    }
  };

  // Real-time data simulation with smooth updates
  useEffect(() => {
    if (!isRealtime) return;

    const interval = setInterval(() => {
      setRegions((prev) =>
        prev.map((region) => ({
          ...region,
          riskScore: Math.max(
            0,
            Math.min(100, region.riskScore + (Math.random() - 0.5) * 2.5)
          ),
          climateEvents: Math.max(
            0,
            region.climateEvents + (Math.random() > 0.87 ? 1 : 0)
          ),
          economicIndicator: Math.max(
            0,
            Math.min(
              100,
              region.economicIndicator + (Math.random() - 0.5) * 1.2
            )
          ),
          lastUpdate: new Date().toISOString(),
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealtime]);

  useEffect(() => {
    if (selectedRegionId) {
      const region = regions.find((r) => r.id === selectedRegionId);
      if (region) {
        setSelectedRegion(region);
        onRegionClick?.(region);
      }
    }
  }, [selectedRegionId, regions, onRegionClick]);

  const getImpactLevel = (score: number): string => {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Critical';
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'rgba(30,58,95,0.5)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#e2e8f0' }}>
              Global Risk & Impact Heatmap
            </h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              Continuous thermal gradient visualization • Risk data interpolation
            </p>
          </div>
          <button
            onClick={() => setIsRealtime(!isRealtime)}
            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isRealtime
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(30,58,95,0.5)',
              border: isRealtime
                ? '1px solid #22c55e'
                : '1px solid rgba(30,58,95,0.8)',
              color: isRealtime ? '#22c55e' : '#94a3b8',
            }}
          >
            {isRealtime ? '🔴 Live' : '⏸️ Paused'}
          </button>
        </div>

        {/* Gradient Legend (zoom.earth style) */}
        <div className="flex items-center gap-3 text-2xs flex-wrap">
          <span style={{ color: '#94a3b8' }}>Risk Scale:</span>
          <div className="flex items-center gap-0.5 h-5 rounded-sm overflow-hidden" style={{ width: '200px' }}>
            <div style={{ flex: 1, background: '#0a3c8a', height: '100%' }} title="Low Risk" />
            <div style={{ flex: 1, background: '#00b4d8', height: '100%' }} title="Moderate Low" />
            <div style={{ flex: 1, background: '#00ff88', height: '100%' }} title="Moderate" />
            <div style={{ flex: 1, background: '#ffff00', height: '100%' }} title="High" />
            <div style={{ flex: 1, background: '#ff9900', height: '100%' }} title="Very High" />
            <div style={{ flex: 1, background: '#ff0000', height: '100%' }} title="Critical" />
          </div>
          <span style={{ color: '#94a3b8' }}>Critical Risk</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Heatmap Canvas */}
        <div
          className="flex-1 rounded-lg overflow-hidden"
          ref={containerRef}
          style={{
            background: 'linear-gradient(135deg, rgba(10,15,30,0.95) 0%, rgba(15,25,50,0.9) 100%)',
            border: '1px solid rgba(0,212,255,0.25)',
            boxShadow: '0 0 40px rgba(0,212,255,0.1), inset 0 0 30px rgba(0,0,0,0.3)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            onClick={handleCanvasClick}
            style={{
              width: '100%',
              height: '100%',
              cursor: 'crosshair',
              display: 'block',
              backgroundColor: '#0a0f1e',
            }}
          />
        </div>

        {/* Regional Details Sidebar */}
        {selectedRegion && (
          <div
            className="w-96 rounded-lg p-5 flex flex-col overflow-hidden"
            style={{
              background: 'rgba(30,58,95,0.5)',
              border: `2px solid rgb(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b})`,
              boxShadow: `0 0 25px rgba(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b},0.2)`,
            }}
          >
            {/* Region Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <div>
                <h3 className="font-bold text-white text-base">{selectedRegion.name}</h3>
                <p className="text-2xs mt-1" style={{ color: '#94a3b8' }}>
                  Lat {selectedRegion.lat.toFixed(1)}° • Lng {selectedRegion.lng.toFixed(1)}°
                </p>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="p-1 hover:opacity-80 transition"
                style={{ color: '#ef4444', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Risk Score Gauge */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                background: 'rgba(2,8,23,0.7)',
                border: `1px solid rgba(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b},0.3)`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Risk Score
                </span>
                <span
                  style={{
                    color: `rgb(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b})`,
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  {selectedRegion.riskScore.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full" style={{ background: 'rgba(30,58,95,0.6)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${selectedRegion.riskScore}%`,
                    background: `linear-gradient(90deg, #0a3c8a, #00b4d8, #00ff88, #ffff00, #ff9900, #ff0000)`,
                    boxShadow: `0 0 10px rgb(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b})`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-2xs" style={{ color: '#94a3b8' }}>
                  <AlertCircle size={12} className="inline mr-1" />
                  Impact Level
                </p>
                <span
                  style={{
                    background: `rgba(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b},0.2)`,
                    color: `rgb(${getRiskColor(selectedRegion.riskScore).r},${getRiskColor(selectedRegion.riskScore).g},${getRiskColor(selectedRegion.riskScore).b})`,
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                  }}
                >
                  {getImpactLevel(selectedRegion.riskScore)}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(2,8,23,0.6)',
                  border: '1px solid rgba(30,58,95,0.5)',
                }}
              >
                <p className="text-2xs mb-1" style={{ color: '#94a3b8' }}>
                  Climate Events
                </p>
                <p style={{ color: '#00d4ff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {selectedRegion.climateEvents}
                </p>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(2,8,23,0.6)',
                  border: '1px solid rgba(30,58,95,0.5)',
                }}
              >
                <p className="text-2xs mb-1" style={{ color: '#94a3b8' }}>
                  Economy
                </p>
                <p style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {selectedRegion.economicIndicator.toFixed(0)}%
                </p>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(2,8,23,0.6)',
                  border: '1px solid rgba(30,58,95,0.5)',
                }}
              >
                <p className="text-2xs mb-1" style={{ color: '#94a3b8' }}>
                  👥 Population
                </p>
                <p style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {selectedRegion.populationDensity.toFixed(0)}
                </p>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{
                  background: 'rgba(2,8,23,0.6)',
                  border: '1px solid rgba(30,58,95,0.5)',
                }}
              >
                <p className="text-2xs mb-1" style={{ color: '#94a3b8' }}>
                  ⏱️ Updated
                </p>
                <p style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  Just now
                </p>
              </div>
            </div>

            {/* Related Entities */}
            <div
              className="flex-1 rounded-lg p-3 mb-4"
              style={{
                background: 'rgba(2,8,23,0.6)',
                border: '1px solid rgba(30,58,95,0.5)',
              }}
            >
              <h4 className="text-xs font-semibold mb-2" style={{ color: '#00d4ff' }}>
                🔗 Connected Entities
              </h4>
              <div className="text-2xs space-y-1 overflow-y-auto" style={{ maxHeight: '100px', color: '#94a3b8' }}>
                {['Risk Assessment', 'Climate Data', 'Economic Zones', 'Population Center', 'Impact Analysis'].map(
                  (entity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1 rounded"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0,212,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#00d4ff' }}
                      />
                      <span>{entity}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-4 border-t" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
              <button
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  color: '#00d4ff',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,212,255,0.1)';
                }}
              >
                View Details
              </button>
              <button
                className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: 'rgba(147,51,234,0.1)',
                  border: '1px solid rgba(147,51,234,0.3)',
                  color: '#a78bfa',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(147,51,234,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(147,51,234,0.1)';
                }}
              >
                Graph View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Global Statistics Footer */}
      <div
        className="p-4 border-t"
        style={{ background: 'rgba(2,8,23,0.4)', borderColor: 'rgba(30,58,95,0.5)' }}
      >
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
              {regions.reduce((sum, r) => sum + r.climateEvents, 0)}
            </div>
            <p className="text-2xs mt-1" style={{ color: '#94a3b8' }}>Climate Events</p>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {(regions.reduce((sum, r) => sum + r.riskScore, 0) / regions.length).toFixed(0)}%
            </div>
            <p className="text-2xs mt-1" style={{ color: '#94a3b8' }}>Global Risk</p>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>
              {regions.reduce((sum, r) => sum + r.populationDensity, 0).toFixed(0)}
            </div>
            <p className="text-2xs mt-1" style={{ color: '#94a3b8' }}>Pop. Density</p>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
              {regions.filter((r) => r.riskScore > 75).length}
            </div>
            <p className="text-2xs mt-1" style={{ color: '#94a3b8' }}>Critical Zones</p>
          </div>
        </div>
      </div>
    </div>
  );
}
