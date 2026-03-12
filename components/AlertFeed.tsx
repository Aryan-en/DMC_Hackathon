'use client';
import { useEffect, useRef } from 'react';

interface Alert {
  id: number;
  time: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  region: string;
  message: string;
  source: string;
}

const SEVERITY_COLORS = {
  critical: '#b84a4a',
  high: '#c8822a',
  medium: '#5b8db8',
  low: '#3eb87a',
};

const SEVERITY_BG = {
  critical: 'rgba(184,74,74,0.07)',
  high: 'rgba(200,130,42,0.07)',
  medium: 'rgba(91,141,184,0.07)',
  low: 'rgba(62,184,122,0.07)',
};

const alerts: Alert[] = [
  { id: 1, time: '09:47:33', severity: 'critical', region: 'MENA', message: 'Unusual military deployment detected near Strait of Hormuz', source: 'SAT-FEED' },
  { id: 2, time: '09:45:12', severity: 'high', region: 'EU', message: 'Commodity price volatility exceeds 3σ threshold — natural gas', source: 'MARKET' },
  { id: 3, time: '09:41:05', severity: 'medium', region: 'APAC', message: 'Social unrest probability model: 67% confidence — Jakarta', source: 'NLP-AI' },
  { id: 4, time: '09:38:44', severity: 'high', region: 'LATAM', message: 'Election interference narrative detected across 14 platforms', source: 'OSINT' },
  { id: 5, time: '09:31:19', severity: 'medium', region: 'SSA', message: 'Drought index critical: 3 provinces at risk — food security impact', source: 'CLIMATE' },
  { id: 6, time: '09:28:07', severity: 'low', region: 'NA', message: 'Federal Reserve language model signals 82% rate hold probability', source: 'ECON-AI' },
  { id: 7, time: '09:21:54', severity: 'high', region: 'APAC', message: 'Rare earth supply chain disruption — semiconductor dependency mapping updated', source: 'TRADE' },
  { id: 8, time: '09:14:30', severity: 'critical', region: 'EEU', message: 'Cyber intrusion pattern: APT-41 signature on critical infrastructure nodes', source: 'CYBER' },
];

export default function AlertFeed() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid rgba(200,168,74,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: '#c4cdd8', fontSize: '0.82rem', fontWeight: 600 }}>Intelligence Alerts</span>
          <span
            className="px-2 py-0.5 rounded live-indicator"
            style={{
              background: 'rgba(184,74,74,0.08)',
              border: '1px solid rgba(184,74,74,0.2)',
              color: '#b84a4a',
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
            }}
          >
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
            <div key={sev} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
              <span style={{ color: '#3a4e62', fontSize: '0.62rem', textTransform: 'capitalize' }}>{sev}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '340px' }}>
        {alerts.map((alert, i) => (
        <div
            key={alert.id}
            className="flex items-start gap-4 px-5 py-3 transition-colors cursor-pointer"
            style={{
              borderBottom: i < alerts.length - 1 ? '1px solid rgba(200,168,74,0.05)' : 'none',
              borderLeft: `2px solid ${SEVERITY_COLORS[alert.severity]}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,168,74,0.02)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="shrink-0 pt-0.5">
              <span
                className="font-mono"
                style={{ color: '#2a3d52', fontSize: '0.62rem' }}
              >
                {alert.time}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="px-1.5 py-0.5 rounded font-bold uppercase"
                  style={{
                    background: SEVERITY_BG[alert.severity],
                    color: SEVERITY_COLORS[alert.severity],
                    fontSize: '0.58rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  {alert.severity}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'rgba(200,168,74,0.05)', color: 'rgba(200,168,74,0.4)', fontSize: '0.58rem' }}
                >
                  {alert.region}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded ml-auto"
                  style={{ color: '#2a3d52', fontSize: '0.58rem' }}
                >
                  [{alert.source}]
                </span>
              </div>
              <p style={{ color: '#6a7e92', fontSize: '0.75rem', lineHeight: '1.5' }}>
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-5 py-3 text-center"
        style={{ borderTop: '1px solid rgba(200,168,74,0.07)' }}
      >
        <button style={{ color: 'rgba(200,168,74,0.3)', fontSize: '0.68rem' }} className="hover:underline">
          View all 2,847 alerts →
        </button>
      </div>
    </div>
  );
}
