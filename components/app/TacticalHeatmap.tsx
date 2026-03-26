'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Layers, Target, Zap, RotateCcw, Plus, Minus } from 'lucide-react';

interface Point {
  name: string;
  lat: number;
  lng: number;
  type: string;
  severity: string;
  value: number;
  region: string;
  layer: 'hotspot' | 'incident';
  [key: string]: any;
}

interface TacticalHeatmapProps {
  hotspots: any[];
  climateRegions: any[];
  incidents: any[];
}

// RESTORED: Standard Miller Projection Approximation (Visual baseline user liked)
function geoToCanvas(lat: number, lng: number, width: number, height: number, zoom: number, pan: { x: number; y: number }) {
  const x0 = (lng + 180) / 360;
  const latRad = (lat * Math.PI) / 180;
  const y0 = 0.5 - (0.5 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latRad))) / Math.PI;

  const x = (x0 * width * zoom) + pan.x;
  const y = (y0 * height * zoom) + pan.y;
  return { x, y };
}

// INVERSE: For accurate hit-testing
function canvasToGeo(x: number, y: number, width: number, height: number, zoom: number, pan: { x: number; y: number }) {
  const lng = ((x - pan.x) / (width * zoom)) * 360 - 180;
  const yNorm = (y - pan.y) / (height * zoom);
  const t = Math.exp((0.5 - yNorm) * Math.PI * 2);
  const latRad = (Math.atan(t) - Math.PI / 4) / 0.4;
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

export default function TacticalHeatmap({ hotspots, climateRegions, incidents }: TacticalHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<Point | null>(null);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [pulse, setPulse] = useState(0);

  // PRESERVED: Dynamic Canvas Resizing (Targeting Fix)
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({ 
          width: entry.contentRect.width, 
          height: entry.contentRect.height 
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // PRESERVED: Pulse Animation
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPulse(p => (p + 0.05) % (Math.PI * 2));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    fetch('/countries.json')
      .then(r => r.json())
      .then(data => setGeoData(data))
      .catch(e => console.error("Failed to load map data", e));
  }, []);

  const allPoints = useMemo(() => {
    const pts: Point[] = [];
    if (showHotspots) hotspots.forEach(h => pts.push({ ...h, layer: 'hotspot' }));
    if (showIncidents) incidents.forEach(i => pts.push({ ...i, layer: 'incident' }));
    return pts;
  }, [hotspots, incidents, showHotspots, showIncidents]);

  const activeRegions = useMemo(() => {
    return new Set(allPoints.map(p => p.region).filter(Boolean));
  }, [allPoints]);

  const isPointInPoly = (point: [number, number], vs: [number, number][]) => {
    let x = point[0], y = point[1], inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !geoData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimensions.width;
    const h = dimensions.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');
    
    const defaultFill = isDark ? '#ffffff' : '#000000'; // White (Dark Mode) / Black (Light Mode)
    const selectionColor = isDark ? '#a855f7' : '#c8a84a'; // Purple (Dark) / Gold (Light)
    const hoverColor = selectionColor; 
    const accentColor = selectionColor; 
    const defaultStroke = `${selectionColor}66`; // 40% alpha for definition

    ctx.clearRect(0, 0, w, h);

    // 1. Tactical Grid
    ctx.strokeStyle = 'var(--border-subtle)';
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 1;
    for (let i = -180; i <= 180; i += 30) {
      const { x } = geoToCanvas(0, i, w, h, zoom, pan);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let j = -60; j <= 60; j += 30) {
      const { y } = geoToCanvas(j, 0, w, h, zoom, pan);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 2. Borders
    ctx.lineWidth = 1.5; // Thicker boundaries for visibility
    ctx.lineJoin = 'round';
    geoData.features.forEach((feature: any) => {
      const name = feature.properties.name;
      const isHovered = name === hoveredCountry;
      const isSelected = name === selectedCountry;
      const isActiveRegion = activeRegions.has(name);
      
      ctx.beginPath();
      // Use theme accent for the border
      ctx.strokeStyle = isSelected ? selectionColor : isHovered ? hoverColor : defaultStroke; 
      
      ctx.fillStyle = isSelected 
        ? `color-mix(in srgb, ${selectionColor}, transparent 55%)` 
        : isHovered 
          ? `color-mix(in srgb, ${hoverColor}, transparent 70%)` 
          : isActiveRegion
            ? `color-mix(in srgb, ${selectionColor}, transparent 82%)` // Soft active shade (18% opacity)
            : defaultFill;

      ctx.globalAlpha = isSelected ? 1.0 : isHovered ? 0.95 : isActiveRegion ? 0.95 : 0.9;
      
      const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      coords.forEach((poly: any) => {
        poly.forEach((ring: any) => {
          ring.forEach((coord: [number, number], idx: number) => {
            const { x, y } = geoToCanvas(coord[1], coord[0], w, h, zoom, pan);
            if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          });
        });
      });
      ctx.fill(); ctx.stroke();
    });

    // 3. Connectivity Lines (linked ones)
    ctx.globalAlpha = 0.4; // Boosted for visibility
    ctx.strokeStyle = accentColor;
    const groups: Record<string, Point[]> = {};
    allPoints.forEach(p => { if (p.region) (groups[p.region] = groups[p.region] || []).push(p); });
    Object.values(groups).forEach(g => {
      if (g.length < 2) return;
      ctx.beginPath();
      for (let i = 0; i < g.length - 1; i++) {
        const p1 = geoToCanvas(g[i].lat, g[i].lng, w, h, zoom, pan);
        const p2 = geoToCanvas(g[i+1].lat, g[i+1].lng, w, h, zoom, pan);
        ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    });

    // 4. Strategic Risk Zones (Clipped to Land)
    const riskyPoints = allPoints.filter(p => p.severity === 'critical' || p.severity === 'high');
    if (riskyPoints.length > 0) {
      ctx.save();
      // Use land for clipping
      ctx.beginPath();
      geoData.features.forEach((feature: any) => {
        const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        coords.forEach((poly: any) => {
          poly.forEach((ring: any) => {
            ring.forEach((coord: [number, number], idx: number) => {
              const { x, y } = geoToCanvas(coord[1], coord[0], w, h, zoom, pan);
              if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
          });
        });
      });
      ctx.clip();

      // Now draw gradients over land
      riskyPoints.forEach(p => {
        const { x, y } = geoToCanvas(p.lat, p.lng, w, h, zoom, pan);
        const color = selectionColor; // Sync with theme (Purple or Gold)
        const rad = (p.severity === 'critical' ? 70 : 45) / Math.sqrt(zoom); // Larger for critical
        const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
        grad.addColorStop(0, `color-mix(in srgb, ${color}, transparent 60%)`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 5. Activity Points (Theme Aware)
    const pointColor = selectionColor; 
    ctx.globalAlpha = 0.8;
    allPoints.forEach((p: Point) => {
      const { x, y } = geoToCanvas(p.lat, p.lng, w, h, zoom, pan);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = pointColor;
      ctx.fill();
    });

    // 6. Tactical Tracks (Details & Labels)
    const pulseScale = (Math.sin(pulse) + 1) / 2;
    allPoints.forEach(pt => {
      const { x, y } = geoToCanvas(pt.lat, pt.lng, w, h, zoom, pan);
      const color = pt.severity === 'critical' ? 'var(--accent-crimson)' : pt.severity === 'high' ? 'var(--accent-amber)' : 'var(--accent-steel)';
      
      if (pt.severity === 'critical') {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.globalAlpha = 0.2;
        ctx.lineWidth = 1.5;
        ctx.arc(x, y, 12 / Math.sqrt(zoom), 0, Math.PI * 2); ctx.stroke();
      }

      ctx.globalAlpha = 1; ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 3 / Math.sqrt(zoom), 0, Math.PI * 2); ctx.fill();

      if (Math.hypot(x - mousePos.x, y - mousePos.y) < 10) {
        ctx.shadowBlur = 15; ctx.shadowColor = color;
        ctx.beginPath(); ctx.arc(x, y, 4 / Math.sqrt(zoom), 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // 5. HUD 
    ctx.strokeStyle = accentColor; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
    const cx = w - 60, cy = 60;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 35); ctx.lineTo(cx, cy + 35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 35, cy); ctx.lineTo(cx + 35, cy); ctx.stroke();
    ctx.font = 'bold 9px Inter'; ctx.fillStyle = accentColor; ctx.fillText('N', cx - 3, cy - 38);

    ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(mousePos.x - 10, mousePos.y); ctx.lineTo(mousePos.x + 10, mousePos.y);
    ctx.moveTo(mousePos.x, mousePos.y - 10); ctx.lineTo(mousePos.x, mousePos.y + 10);
    ctx.stroke();

  }, [geoData, dimensions, zoom, pan, hoveredCountry, selectedCountry, allPoints, pulse, mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isDragging) {
      setPan(prev => ({ x: prev.x + (e.clientX - lastMouse.x), y: prev.y + (e.clientY - lastMouse.y) }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }

    if (geoData) {
      const { lat, lng } = canvasToGeo(x, y, dimensions.width, dimensions.height, zoom, pan);
      let foundCountry: string | null = null;
      let foundPoint: Point | null = null;

      for (const feature of geoData.features) {
        const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        let match = false;
        for (const poly of coords) if (isPointInPoly([lng, lat], poly[0])) { match = true; break; }
        if (match) { foundCountry = feature.properties.name; break; }
      }
      setHoveredCountry(foundCountry);

      for (const pt of allPoints) {
        const { x: px, y: py } = geoToCanvas(pt.lat, pt.lng, dimensions.width, dimensions.height, zoom, pan);
        if (Math.hypot(px - x, py - y) < 15) { foundPoint = pt; break; }
      }
      setActivePoint(foundPoint);
    }
  };

  const handleMouseClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (geoData) {
      const { lat, lng } = canvasToGeo(x, y, dimensions.width, dimensions.height, zoom, pan);
      let foundCountry: string | null = null;
      for (const feature of geoData.features) {
        const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
        let match = false;
        for (const poly of coords) if (isPointInPoly([lng, lat], poly[0])) { match = true; break; }
        if (match) { foundCountry = feature.properties.name; break; }
      }
      setSelectedCountry(foundCountry);
    }
  };

  const handleSelectCountry = (name: string) => {
    if (!geoData) return;
    const feature = geoData.features.find((f: any) => 
      f.properties.name.toLowerCase() === name.toLowerCase()
    );
    if (feature) {
      setSelectedCountry(feature.properties.name);
      
      // Calculate Centroid
      let sumLat = 0, sumLng = 0, count = 0;
      const coords = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      coords.forEach((poly: any) => {
        poly[0].forEach((coord: [number, number]) => {
          sumLng += coord[0]; sumLat += coord[1]; count++;
        });
      });
      
      const avgLat = sumLat / count;
      const avgLng = sumLng / count;
      
      // Auto-Pan
      const zoomLevel = 2.5;
      setZoom(zoomLevel);
      const w = dimensions.width;
      const h = dimensions.height;
      
      // Miller logic reversed for panning
      const x0 = (avgLng + 180) / 360;
      const latRad = (avgLat * Math.PI) / 180;
      const y0 = 0.5 - (0.5 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latRad))) / Math.PI;
      
      setPan({
        x: (w / 2) - (x0 * w * zoomLevel),
        y: (h / 2) - (y0 * h * zoomLevel)
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="tactical-card rounded-xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-widest text-primary">Tactical Geography Overhaul</h3>
            <p className="text-[11px] opacity-60 mt-1">Refined GeoJSON mapping with hardware-synced tactical crosshair.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-60">
              <Layers size={13} /> <span>{allPoints.length} Live Tracks</span>
            </div>
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
              <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-1.5 rounded hover:bg-white/5"><Minus size={14} /></button>
              <span className="text-[10px] font-mono px-2 text-primary">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(10, z + 0.5))} className="p-1.5 rounded hover:bg-white/5"><Plus size={14} /></button>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded hover:bg-white/5 ml-1"><RotateCcw size={14} /></button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          {/* Main Map Canvas */}
          <div 
            ref={containerRef}
            className="relative rounded-xl overflow-hidden cursor-none"
            style={{ background: 'var(--bg-grid)', border: '1px solid var(--border-color)', height: '740px' }}
            onMouseDown={(e) => { setIsDragging(true); setLastMouse({ x: e.clientX, y: e.clientY }); }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => { setIsDragging(false); setHoveredCountry(null); setActivePoint(null); }}
            onClick={handleMouseClick}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {/* HUD Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ 
              background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
              backgroundSize: '100% 4px, 3px 100%'
            }} />

            {(hoveredCountry || activePoint) && (
              <div 
                className="absolute pointer-events-none"
                style={{ transform: `translate(${mousePos.x + 20}px, ${mousePos.y + 20}px)`, zIndex: 100 }}
              >
                <div className="rounded border bg-black/90 p-2 flex flex-col gap-1 shadow-2xl" style={{ borderColor: 'var(--metric-accent)', minWidth: '130px' }}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Signal_ID</span>
                    <span className="text-[7px] font-mono text-emerald-400">ACTIVE_L0</span>
                  </div>
                  <div className="text-[11px] font-black uppercase text-white">
                    {activePoint ? activePoint.name : hoveredCountry}
                  </div>
                  <div className="text-[7px] font-mono opacity-60" style={{ color: 'var(--metric-accent)' }}>
                    {activePoint ? `COORD: ${activePoint.lat.toFixed(3)}N ${activePoint.lng.toFixed(3)}E` : 'REGION_SCAN: 100%'}
                  </div>
                </div>
              </div>
            )}

            <div className="absolute left-4 bottom-4 flex gap-2">
              <button 
                onClick={() => setShowHotspots(!showHotspots)} 
                className="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                style={{ background: showHotspots ? 'color-mix(in srgb, var(--accent-crimson), transparent 90%)' : 'var(--card-bg)', borderColor: showHotspots ? 'var(--accent-crimson)' : 'var(--border-color)', color: showHotspots ? 'var(--accent-crimson)' : 'var(--text-muted)' }}
              >
                <Target size={12} /> Hotspots
              </button>
              <button 
                onClick={() => setShowIncidents(!showIncidents)} 
                className="px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                style={{ background: showIncidents ? 'color-mix(in srgb, var(--accent-amber), transparent 90%)' : 'var(--card-bg)', borderColor: showIncidents ? 'var(--accent-amber)' : 'var(--border-color)', color: showIncidents ? 'var(--accent-amber)' : 'var(--text-muted)' }}
              >
                <Zap size={12} /> Incidents
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-4" style={{ height: '740px' }}>
            <div className="rounded-xl p-4 border border-white/5 flex-1 flex flex-col" style={{ background: 'var(--metric-1)' }}>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-3">Priority Targets</div>
              <div className="space-y-2 overflow-y-auto pr-1 flex-1">
                {hotspots.filter(h => h.severity === 'critical').map((h, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleSelectCountry(h.name)}
                    className="p-3 rounded bg-black/20 border border-white/5 transition-all cursor-pointer group"
                    style={{ 
                      borderColor: selectedCountry === h.name ? '#a855f7' : 'transparent',
                      background: selectedCountry === h.name ? 'color-mix(in srgb, #a855f7, transparent 90%)' : ''
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black break-words group-hover:text-primary transition-colors" style={{ color: selectedCountry === h.name ? '#a855f7' : '' }}>{h.name}</span>
                      <span className="text-[9px] font-black uppercase" style={{ color: 'var(--accent-crimson)' }}>CRIT</span>
                    </div>
                    <div className="text-[9px] opacity-40 font-mono uppercase truncate">{h.lat.toFixed(2)}N // {h.lng.toFixed(2)}E</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 border border-white/5" style={{ background: 'var(--metric-1)' }}>
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Stability Data</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-black text-primary">84.2</span>
                <span className="text-[9px] uppercase font-bold text-amber-500">-1.2% Risk</span>
              </div>
              <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[84%]" style={{ backgroundColor: 'var(--accent-amber)' }} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
