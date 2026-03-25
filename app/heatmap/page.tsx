'use client';

import TopBar from '@/components/TopBar';
import MultiLayerGeoHeatmap from '@/components/app/MultiLayerGeoHeatmap';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';

export default function HeatmapPage() {
  const { data: geospatialData, loading: heatmapLoading, error: heatmapError } = useGeospatialMetrics();

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Heatmap Analysis" subtitle="Population, climate, and economic intensity visualization" />
      
      <main className="flex-1 px-6 py-6 space-y-6">
        {heatmapError && (
          <div
            className="px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(184,74,74,0.08)',
              border: '1px solid rgba(184,74,74,0.2)',
              color: '#b84a4a',
              fontSize: '0.72rem',
            }}
          >
            Live heatmap data unavailable: {heatmapError}
          </div>
        )}

        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Interactive Heatmap</h3>
            <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '4px' }}>
              Blend and explore population pressure, climate stress, and economic intensity across regions. Toggle layers to focus on specific dimensions and hover over regions for detailed metrics.
            </p>
          </div>

          {heatmapLoading ? (
            <div className="glass-card rounded-xl p-4" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              Loading heatmap data...
            </div>
          ) : (
            <MultiLayerGeoHeatmap
              hotspots={geospatialData.hotspots}
              climateRegions={geospatialData.climateRegions}
              economicRegions={geospatialData.economicRegions}
            />
          )}
        </div>
      </main>
    </div>
  );
}
