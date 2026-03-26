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
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
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
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-7">
          {groups.map((group, groupIdx) => {
            const items = navItems.filter(i => i.group === group);
            return (
              <div key={group} className="relative">
                {groupIdx > 0 && (
                  <div className="absolute -top-3.5 left-3 right-3 h-[1px] bg-[var(--border-color)] opacity-40" />
                )}
                <div
                  className="px-3 mb-3 font-black tracking-[0.2em] uppercase"
                  style={{ color: 'var(--text-dim)', fontSize: '0.6rem', opacity: 0.7 }}
                >
                  {group}
                </div>
                <div className="space-y-1">
                  {items.map(item => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`sidebar-link relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive ? 'active shadow-sm' : 'hover:bg-[var(--nested-surface-hover)]'}`}
                        style={{
                          background: isActive
                            ? 'var(--accent-gold-dim)'
                            : 'transparent',
                          color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        }}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--accent-gold)] rounded-r-full shadow-[0_0_8px_var(--accent-gold)]" />
                        )}
                        <Icon
                          size={16}
                          className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}
                          style={{ color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: '0.78rem',
                            letterSpacing: '0.01em',
                            fontWeight: isActive ? 750 : 500,
                          }}
                        >
                          {item.label}
                        </span>
                        {isActive && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)] animate-pulse" />
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer / User */}
        <div className="px-4 py-6 border-t border-[var(--border-color)] bg-[var(--nested-surface)]/30">
          <div className="flex items-center gap-3 p-2 group cursor-pointer">
            <div className="w-9 h-9 rounded-full bg-[var(--accent-gold-dim)] border border-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)] font-black text-xs">
              JD
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[11px] font-bold text-[var(--text-primary)] truncate uppercase tracking-widest">Operator-01</div>
              <div className="text-[9px] text-[var(--text-muted)] font-mono truncate">SYSTEM_ADMIN_AUTH</div>
            </div>
            <Settings size={14} className="text-[var(--text-muted)] group-hover:rotate-90 transition-transform duration-500" />
          </div>
        </div>

      </aside>
    </>
  );
}
