'use client';

import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import AlertFeed from '@/components/AlertFeed';
import { GlobalRiskChart, EntityBarChart, SentimentChart } from '@/components/Charts';
import { useStrategicMetrics } from '@/app/hooks/useStrategicMetrics';
import { useProcessingLog } from '@/app/hooks/useProcessingLog';
import {
  Globe, Activity, Share2, Brain, AlertTriangle,
  Database, Shield, Zap, Radio, Server
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  DOC: '#8a78c8',
  MEA: '#5b8db8',
  NEWS: '#c8a84a',
  SOCIAL: '#3eb87a',
  METRIC: '#4a6070',
};

function formatRelativeTs(isoTs: string) {
  const parsed = new Date(isoTs).getTime();
  if (!Number.isFinite(parsed)) return 'T-unknown';
  const diffMs = Date.now() - parsed;
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) {
    const secs = Math.max(0, Math.floor((diffMs % 60000) / 1000));
    return `T-${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `T-${String(hrs).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export default function Home() {
  const { data, loading, error } = useStrategicMetrics();
  const { events } = useProcessingLog();

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Strategic Overview" subtitle="Global Intelligence Command Dashboard — CLASSIFICATION: TS/SCI" />
      <main className="flex-1 px-6 py-6 space-y-6">

        {error && (
          <div
            className="px-4 py-2 rounded-xl"
            style={{ background: 'rgba(184,74,74,0.08)', border: '1px solid rgba(184,74,74,0.2)', color: '#b84a4a', fontSize: '0.72rem' }}
          >
            Live backend metrics unavailable: {error}. Displaying latest available live-response state.
          </div>
        )}

        {/* Mission brief banner */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-2xl"
          style={{ background: 'rgba(200,168,74,0.04)', border: '1px solid rgba(200,168,74,0.12)' }}
        >
          <div className="flex items-center gap-3">
            <Radio size={14} style={{ color: '#c8a84a' }} className="live-indicator" />
            <span style={{ color: '#4a6070', fontSize: '0.75rem' }}>
              <span style={{ color: '#c8a84a', fontWeight: 600 }}>SYSTEM BRIEF:</span>{' '}
              Ontora operating at 99.7% uptime — 216 nations monitored, 48 active threat threads, 3 critical assessments pending review
            </span>
          </div>
          <button
            className="px-3 py-1.5 rounded-xl transition-colors"
            style={{
              background: 'rgba(200,168,74,0.08)',
              border: '1px solid rgba(200,168,74,0.2)',
              color: '#c8a84a',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            View Briefing
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Entities Tracked"
            value={data.globalEntities.total >= 1000000 ? `${(data.globalEntities.total / 1000000).toFixed(2)}M` : data.globalEntities.total.toLocaleString()}
            subValue="Nations, orgs, individuals, events"
            change={12.4}
            changeLabel="this month"
            icon={Share2}
            accentColor="#c8a84a"
            glowClass="glow-cyan"
          />
          <StatCard
            label="Active Threat Threads"
            value={data.threatThreads.total.toLocaleString()}
            subValue={`${data.threatThreads.critical} critical, ${data.threatThreads.high} high, ${data.threatThreads.monitor} monitor`}
            change={-8.2}
            changeLabel="vs last week"
            icon={AlertTriangle}
            accentColor="#b84a4a"
            glowClass="glow-red"
          />
          <StatCard
            label="Daily Data Ingested"
            value={`${data.dailyIngestion.total_gb.toFixed(2)}TB`}
            subValue={`${data.dailyIngestion.realtime_processed_gb.toFixed(3)}TB processed in real-time`}
            change={6.1}
            changeLabel="above baseline"
            icon={Database}
            accentColor="#3eb87a"
            glowClass="glow-green"
          />
          <StatCard
            label="Prediction Accuracy"
            value={`${data.predictionAccuracy.accuracy.toFixed(1)}%`}
            subValue="7-day geopolitical forecast"
            change={2.8}
            changeLabel="vs Q4 baseline"
            icon={Zap}
            accentColor="#c8822a"
            glowClass="glow-amber"
          />
        </div>

        {/* Sub-stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Knowledge Graph Nodes', value: data.globalEntities.total.toLocaleString(), icon: Share2, color: '#8a78c8' },
            { label: 'Kafka Events/sec', value: '142K', icon: Activity, color: '#5b8db8' },
            { label: 'Model Inferences Today', value: '8.4M', icon: Brain, color: '#3eb87a' },
            { label: 'Nations Monitored', value: (data.globalEntities.breakdown.nations || 216).toString(), icon: Globe, color: '#c8a84a' },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${s.color}18 0%, ${s.color}08 100%)`,
                  border: `1px solid ${s.color}28`,
                }}
              >
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ color: '#dce4ee', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ color: '#3a4e62', fontSize: '0.67rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Global Risk Trend */}
          <div className="col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem' }}>Global Risk Index — 7-Month Trend</h3>
                <p style={{ color: '#3a4e62', fontSize: '0.68rem', marginTop: '3px' }}>Composite cross-domain risk scoring (0–100)</p>
              </div>
              <div className="flex items-center gap-4">
                {[{ label: 'Geopolitical', color: '#b84a4a' }, { label: 'Economic', color: '#c8a84a' }, { label: 'Climate', color: '#3eb87a' }, { label: 'Cyber', color: '#8a78c8' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-px inline-block" style={{ background: l.color }} />
                    <span style={{ color: '#3a4e62', fontSize: '0.67rem' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <GlobalRiskChart />
          </div>

          {/* Regional Risk Matrix */}
          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>Regional Risk Matrix</h3>
            <div className="space-y-3">
              {data.regions.map(r => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ color: '#7a8fa8', fontSize: '0.71rem' }}>{r.name}</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: r.color, background: `${r.color}12`, fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px' }}
                    >
                      {r.risk}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(200,168,74,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.risk}%`, background: `linear-gradient(90deg, ${r.color}90, ${r.color}60)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2"><AlertFeed /></div>
          <div className="space-y-5">
            <div className="glass-card rounded-2xl p-5">
              <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Ontology Entity Distribution</h3>
              <EntityBarChart />
            </div>
            <div className="glass-card rounded-2xl p-5">
              <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>Infrastructure Health</h3>
              <div className="space-y-3">
                {data.infraHealth.components.map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: '#4a6070', fontSize: '0.7rem' }}>{s.label}</span>
                      <span style={{ color: s.color, fontSize: '0.68rem', fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>{s.value}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(200,168,74,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}90, ${s.color}60)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem' }}>Global Media Sentiment — 7 Days</h3>
              <div className="flex items-center gap-3">
                {[{ label: 'Positive', color: '#3eb87a' }, { label: 'Neutral', color: '#4a6070' }, { label: 'Negative', color: '#b84a4a' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm inline-block" style={{ background: l.color }} />
                    <span style={{ color: '#3a4e62', fontSize: '0.67rem' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <SentimentChart />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>System Processing Log</h3>
            <div className="space-y-1">
              {events.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-2"
                  style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(200,168,74,0.05)' : 'none' }}
                >
                  <span
                    className="font-mono shrink-0"
                    style={{ color: '#2a3d52', fontSize: '0.62rem', minWidth: '52px' }}
                  >
                    {formatRelativeTs(entry.timestamp)}
                  </span>
                  <span
                    className="rounded font-bold shrink-0"
                    style={{
                      background: `${(TYPE_COLORS[entry.type] || '#6a8a9a')}14`,
                      color: TYPE_COLORS[entry.type] || '#6a8a9a',
                      fontSize: '0.58rem',
                      minWidth: '44px',
                      textAlign: 'center',
                      padding: '1px 5px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {entry.type}
                  </span>
                  <span style={{ color: '#4a6070', fontSize: '0.71rem', lineHeight: '1.4' }}>{entry.event}</span>
                </div>
              ))}
              {events.length === 0 && (
                <div style={{ color: '#4a6070', fontSize: '0.71rem' }}>
                  No recent processing events available.
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between py-4"
          style={{ borderTop: '1px solid rgba(200,168,74,0.06)' }}
        >
          <span style={{ color: '#1e2e3e', fontSize: '0.62rem', letterSpacing: '0.04em' }}>
            ONTORA v4.2.1 — CLASSIFICATION: TOP SECRET // SCI // ORCON // NOFORN {loading ? '(SYNCING)' : '(LIVE)'}
          </span>
          <div className="flex items-center gap-2">
            <Server size={10} style={{ color: '#1e2e3e' }} />
            <span style={{ color: '#1e2e3e', fontSize: '0.62rem' }}>Cluster: us-east-1 | Nodes: 48 | Uptime: 99.97%</span>
          </div>
        </div>
      </main>
    </div>
  );
}
