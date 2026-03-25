'use client';

import { useState } from 'react';
import { useIntelligenceAlerts } from '@/app/hooks/useIntelligenceAlerts';
import TacticalMarquee from './TacticalMarquee';

const SEVERITY_COLORS = {
  critical: 'var(--accent-crimson)',
  high: 'var(--accent-amber)',
  medium: 'var(--accent-steel)',
  low: 'var(--accent-emerald)',
};

const SEVERITY_BG = {
  critical: 'rgba(153, 27, 27, 0.05)',
  high: 'rgba(180, 83, 9, 0.05)',
  medium: 'rgba(0, 0, 0, 0.02)',
  low: 'rgba(21, 128, 61, 0.05)',
};


export default function AlertFeed() {
  const { alerts, loading, error } = useIntelligenceAlerts();
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-5 animate-pulse">
        <div className="h-6 w-32 bg-black/10 dark:bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-black/5 dark:bg-white/5 rounded" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/[0.02]"
      >
        <div className="flex items-center gap-3">
          <span className="text-primary text-sm font-black uppercase tracking-tight">Intelligence Alerts</span>
          <span className="status-online flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
              <span className="text-secondary text-[10px] uppercase font-black">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="table-scroll-container">
        {error ? (
          <div className="text-crimson text-center py-10 font-black uppercase text-xs">
            CONNECTION_TIMEOUT: API Server Unreachable
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-muted text-center py-10 italic">
            No active threat threads detected in this sector.
          </div>
        ) : (
          <table className="w-full text-left border-collapse mb-0 table-fixed min-w-[700px]">
            <thead 
              className="text-[9px] font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}
            >
              <tr>
                <th className="pl-4 py-3 font-mono w-[80px]">Timestamp</th>
                <th className="px-2 py-3 w-[60px]">Sev</th>
                <th className="px-2 py-3 w-[80px]">Region</th>
                <th className="px-4 py-3">Intelligence Summary</th>
                <th className="px-2 py-3 w-[100px]">Source</th>
                <th className="pr-4 py-3 text-right w-[60px]">Conf</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {alerts.map((alert, aidx) => {
                const sevColor = SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS] || 'var(--accent-steel)';
                const sevBg = SEVERITY_BG[alert.severity as keyof typeof SEVERITY_BG] || 'transparent';
                
                return (
                  <tr 
                    key={aidx} 
                    className="group transition-colors hover:bg-gold/5"
                    style={{ backgroundColor: sevBg }}
                  >
                    <td className="pl-4 py-3 text-[10px] font-mono text-primary">
                      {alert.time}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sevColor }} />
                        <span className="text-[9px] font-black uppercase" style={{ color: sevColor }}>
                          {alert.severity.substring(0, 3)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <span className="text-[10px] text-secondary">
                        {alert.region}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TacticalMarquee>
                        <span className="text-[11px] text-primary leading-normal">
                          {alert.message}
                        </span>
                      </TacticalMarquee>
                    </td>
                    <td className="px-2 py-3">
                      {alert.url ? (
                        <a 
                          href={alert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-lavender hover:underline underline-offset-1"
                        >
                          {alert.source} ↗
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted">{alert.source}</span>
                      )}
                    </td>
                    <td className="pr-4 py-3 text-right">
                      <span className="text-[10px] font-mono font-bold text-emerald-700">
                        {(alert.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div
        className="px-4 py-3 text-center bg-black/[0.01]"
      >
        <button 
          onClick={() => setShowAllAlerts(!showAllAlerts)}
          className="text-gold hover:text-black font-black uppercase text-[10px] tracking-widest transition-all"
        >
          {showAllAlerts ? 'Collapse Data Stream' : 'Decrypt Full Intelligence Stream'} →
        </button>
      </div>
    </div>
  );
}
