'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe, LayoutDashboard, Share2, Map, Brain,
  Database, Shield, Layers, Activity, Zap, FileText, Settings
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Strategic Overview', icon: LayoutDashboard, group: 'COMMAND' },
  { href: '/intelligence', label: 'AI Intelligence', icon: Brain, group: 'COMMAND' },
  { href: '/bill-analysis', label: 'Bill Amendment', icon: FileText, group: 'COMMAND' },
  { href: '/knowledge-graph', label: 'Knowledge Graph', icon: Share2, group: 'ANALYSIS' },
  { href: '/geospatial', label: 'Geospatial Intel', icon: Map, group: 'ANALYSIS' },
  { href: '/heatmap', label: 'Heatmap', icon: Layers, group: 'ANALYSIS' },
  { href: '/predictions', label: 'Predictions Engine', icon: Zap, group: 'ANALYSIS' },
  { href: '/data-streams', label: 'Data Streams', icon: Activity, group: 'INFRASTRUCTURE' },
  { href: '/data-lake', label: 'Data Lake', icon: Database, group: 'INFRASTRUCTURE' },
  { href: '/data-sources', label: 'Data Sources', icon: FileText, group: 'INFRASTRUCTURE' },
  { href: '/control-panel', label: 'Control Panel', icon: Settings, group: 'INFRASTRUCTURE' },
  { href: '/security', label: 'Security & Governance', icon: Shield, group: 'INFRASTRUCTURE' },
];

const groups = ['COMMAND', 'ANALYSIS', 'INFRASTRUCTURE'];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{
        background: 'linear-gradient(180deg, #080c14 0%, #0a111b 68%, #111a27 100%)',
        borderRight: '1px solid rgba(201,168,106,0.16)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-4 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(201,168,106,0.12)' }}
      >
        <div
          className="relative flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(200,168,74,0.18) 0%, rgba(200,168,74,0.06) 100%)',
            border: '1px solid rgba(201,168,106,0.30)',
            boxShadow: '0 0 20px rgba(201,168,106,0.12)',
          }}
        >
          <Globe size={18} style={{ color: '#d6b985' }} />
          <span
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full live-indicator"
            style={{ background: '#3eb87a' }}
          />
        </div>
        <div>
          <div
            className="font-bold tracking-widest"
            style={{ color: '#d6b985', fontSize: '0.75rem', letterSpacing: '0.22em' }}
          >
            ONTORA
          </div>
          <div style={{ color: '#3a4e62', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
            Global Ontology Engine
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {groups.map(group => {
          const items = navItems.filter(i => i.group === group);
          return (
            <div key={group}>
              <div
                className="px-3 mb-2 font-semibold tracking-widest"
                style={{ color: '#2a3d52', fontSize: '0.58rem', letterSpacing: '0.18em' }}
              >
                {group}
              </div>
              <div className="space-y-0.5">
                {items.map(item => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'active' : ''}`}
                      style={{
                        background: isActive
                          ? 'linear-gradient(90deg, rgba(201,168,106,0.16) 0%, rgba(201,168,106,0.05) 100%)'
                          : 'transparent',
                        color: isActive ? '#ead5a4' : '#6f8096',
                      }}
                    >
                      <Icon
                        size={15}
                        style={{ color: isActive ? '#d6b985' : '#4f6178', flexShrink: 0 }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: '#d6b985', opacity: 0.9 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* System status */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid rgba(201,168,106,0.12)' }}
      >
        <div
          className="mb-3 font-semibold tracking-widest"
          style={{ color: '#2a3d52', fontSize: '0.58rem', letterSpacing: '0.18em' }}
        >
          SYSTEM STATUS
        </div>
        {[
          { label: 'Data Ingestion', status: 'ONLINE', color: '#3eb87a' },
          { label: 'ML Pipeline', status: 'ONLINE', color: '#3eb87a' },
          { label: 'Neo4j Cluster', status: 'SYNC', color: '#c9a86a' },
        ].map(s => (
          <div key={s.label} className="flex items-center justify-between py-1.5">
            <span style={{ color: '#3a4e62', fontSize: '0.68rem' }}>{s.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: s.color }} />
              <span
                style={{ color: s.color, fontSize: '0.6rem', fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}
              >
                {s.status}
              </span>
            </div>
          </div>
        ))}
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(200,168,74,0.06)' }}>
          <div className="flex items-center justify-between">
            <Layers size={10} style={{ color: '#2a3d52' }} />
            <span style={{ color: '#2a3d52', fontSize: '0.6rem', fontFamily: 'var(--font-geist-mono)' }}>v4.2.1 — CLASSIFIED</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
