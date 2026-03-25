'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe, LayoutDashboard, Share2, Map, Brain,
  Database, Shield, Layers, Activity, Zap, FileText, Settings, X
} from 'lucide-react';
import { useUI } from './UIContext';
import OntoraLogo from './OntoraLogo';

const navItems = [
  { href: '/', label: 'Strategic Overview', icon: LayoutDashboard, group: 'COMMAND' },
  { href: '/intelligence', label: 'AI Intelligence', icon: Brain, group: 'COMMAND' },
  { href: '/bill-analysis', label: 'Bill Amendment', icon: FileText, group: 'COMMAND' },
  { href: '/knowledge-graph', label: 'Knowledge Graph', icon: Share2, group: 'ANALYSIS' },
  { href: '/geospatial', label: 'Geospatial Intel', icon: Map, group: 'ANALYSIS' },
  { href: '/heatmap', label: 'Heatmap', icon: Layers, group: 'ANALYSIS' },
  { href: '/predictions', label: 'Predictions Engine', icon: Zap, group: 'ANALYSIS' },
  { href: '/data-streams', label: 'Data Streams', icon: Activity, group: 'INFRASTRUCTURE' },
  { href: '/control-panel', label: 'Control Panel', icon: Settings, group: 'INFRASTRUCTURE' },
  { href: '/security', label: 'Security & Governance', icon: Shield, group: 'INFRASTRUCTURE' },
];

const groups = ['COMMAND', 'ANALYSIS', 'INFRASTRUCTURE'];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUI();

  return (
    <>
      {/* Scrim */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed left-0 top-0 h-screen w-64 flex flex-col z-50 transition-all duration-300 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-color)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.05)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 py-5"
        >
          <div className="flex items-center gap-4">
            <div
              className="relative flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background: 'var(--accent-gold-dim)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 0 20px rgba(201,168,106,0.05)',
              }}
            >
              <OntoraLogo size={24} />
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full live-indicator"
                style={{ background: 'var(--accent-emerald)' }}
              />
            </div>
            <div>
              <div
                className="font-bold tracking-widest text-nowrap"
                style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', letterSpacing: '0.22em' }}
              >
                ONTORA
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                Engine
              </div>
            </div>
          </div>
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(false)}>
            <X size={20} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {groups.map(group => {
            const items = navItems.filter(i => i.group === group);
            return (
              <div key={group}>
                <div
                  className="px-3 mb-2 font-semibold tracking-widest"
                  style={{ color: 'var(--text-dim)', fontSize: '0.58rem', letterSpacing: '0.18em' }}
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
                        onClick={() => setSidebarOpen(false)}
                        className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'active' : ''}`}
                        style={{
                          background: isActive
                            ? 'var(--accent-gold-dim)'
                            : 'transparent',
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        }}
                      >
                        <Icon
                          size={15}
                          style={{ color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)', flexShrink: 0 }}
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
                            style={{ background: 'var(--accent-gold)', opacity: 0.9 }}
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

      </aside>
    </>
  );
}
