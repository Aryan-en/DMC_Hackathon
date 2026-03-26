'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/TopBar';

const DecisionHeatmapLeaflet = dynamic(() => import('@/app/components/DecisionHeatmapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="glass-card rounded-xl p-4" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
      Loading geospatial heatmap engine...
    </div>
  ),
});

export default function HeatmapPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Multi-Layer Geospatial Heatmap" subtitle="Climate, population, economy, and sentiment decision intelligence" />

      <main className="flex-1 px-6 py-6 space-y-6">
        <DecisionHeatmapLeaflet />
      </main>
    </div>
  );
}
