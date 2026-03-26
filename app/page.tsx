'use client';

import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import AlertFeed from '@/components/AlertFeed';
import { GlobalRiskChart, EntityBarChart, SentimentChart } from '@/components/Charts';
import { useStrategicMetrics } from '@/app/hooks/useStrategicMetrics';
import { useProcessingLog } from '@/app/hooks/useProcessingLog';
import { useRelativeTime } from '@/app/hooks/useRelativeTime';
import { useState } from 'react';
import {
  Globe, Activity, Share2, Brain, AlertTriangle,
  Database, Shield, Zap, Radio, Server, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Zap as Lightning
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  DOC: '#8a78c8',
  MEA: '#5b8db8',
  NEWS: '#00d4ff',
  SOCIAL: '#3eb87a',
  METRIC: '#4a6070',
};

/**
 * Component that safely renders timestamp without hydration mismatch
 */
function RelativeTimestamp({ timestamp }: { timestamp: string }) {
  const relativeTime = useRelativeTime(timestamp);
  return <span>{relativeTime}</span>;
}

export default function Home() {
  const { data, loading, error } = useStrategicMetrics();
  const { events } = useProcessingLog();
  const [showBriefing, setShowBriefing] = useState(false);

  // Platform statistics
  const platformStats = {
    totalUsers: 1247,
    activeUsers24h: 342,
    avgResponseTime: '145ms',
    systemUptime: 99.97,
    databases: 12,
    apiEndpoints: 84,
    modules: 18,
    dataVolumePB: 2.8,
  };

  // Module performance
  const modulePerformance = [
    { name: 'Intelligence Hub', users: 342, avgTime: '1.2s', status: 'optimal' },
    { name: 'Knowledge Graph', users: 298, avgTime: '890ms', status: 'optimal' },
    { name: 'Bill Analysis', users: 156, avgTime: '2.1s', status: 'optimal' },
    { name: 'Geospatial Intel', users: 124, avgTime: '1.8s', status: 'optimal' },
    { name: 'Predictions Engine', users: 89, avgTime: '3.4s', status: 'slow' },
    { name: 'Data Lake', users: 201, avgTime: '756ms', status: 'optimal' },
  ];

  // Global coverage
  const globalCoverage = [
    { region: 'Americas', countries: 35, threats: 12 },
    { region: 'Europe', countries: 44, threats: 18 },
    { region: 'Africa', countries: 54, threats: 24 },
    { region: 'Asia-Pacific', countries: 57, threats: 31 },
    { region: 'Middle East', countries: 18, threats: 28 },
  ];

  // Key insights
  const keyInsights = [
    { title: 'Geopolitical Escalation', severity: 'high', regions: 3, trend: 'up' },
    { title: 'Economic Volatility', severity: 'high', regions: 8, trend: 'up' },
    { title: 'Cyber Incidents', severity: 'critical', regions: 5, trend: 'stable' },
    { title: 'Climate Migration Pressure', severity: 'moderate', regions: 12, trend: 'down' },
  ];

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
          style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}
        >
          <div className="flex items-center gap-3">
            <Radio size={14} style={{ color: '#00d4ff' }} className="live-indicator" />
            <span style={{ color: '#4a6070', fontSize: '0.75rem' }}>
              <span style={{ color: '#00d4ff', fontWeight: 600 }}>SYSTEM BRIEF:</span>{' '}
              Ontora operating at {platformStats.systemUptime}% uptime — 216 nations monitored, 48 active threat threads, 3 critical assessments pending review
            </span>
          </div>
          <button
            onClick={() => setShowBriefing(!showBriefing)}
            className="px-3 py-1.5 rounded-xl transition-colors"
            style={{
              background: showBriefing ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            {showBriefing ? 'Hide Briefing' : 'View Briefing'}
          </button>
        </div>

        {/* DETAILED BRIEFING PANEL */}
        {showBriefing && (
          <div className="glass-card rounded-2xl p-6 space-y-6" style={{ border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.02)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 700 }}>[BRIEFING] Classified Briefing Package</h2>
              <button
                onClick={() => setShowBriefing(false)}
                className="px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: '0.72rem',
                }}
              >
                Close Briefing
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Executive Summary */}
              <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '8px' }}>Executive Summary</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: '8px' }}>
                  Ontora global intelligence feeds are operating at optimal capacity with 99.97% system uptime. Across 216 monitored nations, 48 active threat threads are currently under surveillance with 3 escalated to critical assessment status requiring immediate high-level review.
                </p>
                <p style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '8px', fontStyle: 'italic' }}>
                  CLASSIFICATION: TOP SECRET // SCI // ORCON // NOFORN
                </p>
              </div>

              {/* Key Metrics Summary */}
              <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,212,255,0.1)' }}>
                <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>Operational Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>System Uptime:</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>{platformStats.systemUptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Active Threat Threads:</span>
                    <span style={{ color: '#b84a4a', fontWeight: 700 }}>48</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Nations Monitored:</span>
                    <span style={{ color: '#00d4ff', fontWeight: 700 }}>216</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Critical Assessments:</span>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>3 pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Threat Assessment */}
            <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(239,68,68,0.1)' }}>
              <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>[ALERT] Critical Threat Assessment</h3>
              <div className="space-y-3">
                {[
                  { name: 'Cyber Warfare Operations', regions: 'EU, APAC', level: 'CRITICAL', details: 'Advanced persistent threat campaign targeting infrastructure' },
                  { name: 'Geopolitical Escalation', regions: 'MEA, APAC', level: 'HIGH', details: 'Military posturing and diplomatic tensions increasing' },
                  { name: 'Economic Volatility', regions: 'Global', level: 'HIGH', details: 'Market instability and currency fluctuations detected' },
                ].map((threat, i) => (
                  <div key={i} className="p-3 rounded" style={{ background: 'rgba(15,23,42,0.8)', border: `1px solid ${threat.level === 'CRITICAL' ? 'rgba(184,74,74,0.3)' : 'rgba(245,158,11,0.2)'}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div style={{ color: threat.level === 'CRITICAL' ? '#fca5a5' : '#fbbf24', fontWeight: 700, fontSize: '0.78rem' }}>{threat.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>Regions: {threat.regions}</div>
                      </div>
                      <div style={{ background: threat.level === 'CRITICAL' ? 'rgba(184,74,74,0.2)' : 'rgba(245,158,11,0.2)', color: threat.level === 'CRITICAL' ? '#fca5a5' : '#fbbf24', padding: '2px 8px', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 700 }}>
                        {threat.level}
                      </div>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>{threat.details}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Intelligence */}
            <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>[GLOBAL] Regional Intelligence Summary</h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { region: 'Americas', coverage: '98%', threats: 12, status: 'Stable' },
                  { region: 'Europe', coverage: '99%', threats: 18, status: 'Elevated' },
                  { region: 'Africa', coverage: '94%', threats: 24, status: 'Volatile' },
                  { region: 'Asia-Pacific', coverage: '97%', threats: 31, status: 'High Alert' },
                  { region: 'Middle East', coverage: '96%', threats: 28, status: 'Critical' },
                ].map(r => (
                  <div key={r.region} className="p-3 rounded" style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)' }}>
                    <div style={{ color: '#cbd5e1', fontWeight: 700, fontSize: '0.75rem', marginBottom: '6px' }}>{r.region}</div>
                    <div style={{ color: '#22c55e', fontSize: '0.7rem', marginBottom: '4px' }}>Coverage: {r.coverage}</div>
                    <div style={{ color: '#f59e0b', fontSize: '0.7rem', marginBottom: '4px' }}>Threats: {r.threats}</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.68rem', background: 'rgba(0,212,255,0.1)', padding: '2px 4px', borderRadius: '2px', textAlign: 'center' }}>{r.status}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health Dashboard */}
            <div className="p-4 rounded-lg" style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(0,212,255,0.1)' }}>
              <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>[SYSTEM] System Health & Infrastructure</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>Processing Capacity</div>
                  <div style={{ color: '#22c55e', fontSize: '1.2rem', fontWeight: 700 }}>142K</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Kafka events/sec</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>Data Ingestion</div>
                  <div style={{ color: '#3eb87a', fontSize: '1.2rem', fontWeight: 700 }}>8.4M</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>inferences/day</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px' }}>Infrastructure</div>
                  <div style={{ color: '#00d4ff', fontSize: '1.2rem', fontWeight: 700 }}>48</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>cluster nodes</div>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <h3 style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>[ACTION] Recommended Actions</h3>
              <ul className="space-y-2">
                {[
                  'Review 3 pending critical assessments immediately',
                  'Escalate MEA cyber operations to executive command',
                  'Deploy additional monitoring assets to Asia-Pacific region',
                  'Schedule briefing with inter-agency partners on threats',
                  'Initiate real-time monitoring dashboard updates',
                ].map((action, i) => (
                  <li key={i} style={{ color: '#cbd5e1', fontSize: '0.75rem', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,212,255,0.1)', paddingTop: '12px' }}>
              <div style={{ color: '#1e2e3e', fontSize: '0.65rem', textAlign: 'center' }}>
                BRIEFING GENERATED: {new Date().toLocaleString()} | NEXT UPDATE: {new Date(Date.now() + 3600000).toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY METRICS - Main KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Entities Tracked"
            value={data.globalEntities.total >= 1000000 ? `${(data.globalEntities.total / 1000000).toFixed(2)}M` : data.globalEntities.total.toLocaleString()}
            subValue="Nations, orgs, individuals, events"
            change={12.4}
            changeLabel="this month"
            icon={Share2}
            accentColor="#00d4ff"
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

        {/* PLATFORM HEALTH - Extended Sub-stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Knowledge Graph Nodes', value: data.globalEntities.total.toLocaleString(), icon: Share2, color: '#8a78c8' },
            { label: 'Kafka Events/sec', value: '142K', icon: Activity, color: '#5b8db8' },
            { label: 'Model Inferences Today', value: '8.4M', icon: Brain, color: '#3eb87a' },
            { label: 'Nations Monitored', value: (data.globalEntities.breakdown.nations || 216).toString(), icon: Globe, color: '#00d4ff' },
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

        {/* SYSTEM ARCHITECTURE OVERVIEW */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { metric: 'Active Users', value: platformStats.activeUsers24h, total: platformStats.totalUsers, icon: Users, color: '#00d4ff' },
            { metric: 'Avg Response', value: platformStats.avgResponseTime, unit: 'ms', icon: Clock, color: '#3eb87a' },
            { metric: 'API Endpoints', value: platformStats.apiEndpoints, unit: 'live', icon: Zap, color: '#8a78c8' },
            { metric: 'Databases', value: platformStats.databases, unit: 'active', icon: Database, color: '#5b8db8' },
            { metric: 'System Uptime', value: platformStats.systemUptime, unit: '%', icon: Shield, color: '#3eb87a' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(0,212,255,0.1)' }}>
              <div className="flex items-start justify-between mb-3">
                <div style={{ color: '#4a6070', fontSize: '0.7rem', fontWeight: 600 }}>{stat.metric}</div>
                <div style={{ background: `${stat.color}15`, padding: '4px 8px', borderRadius: '4px' }}>
                  <stat.icon size={12} style={{ color: stat.color }} />
                </div>
              </div>
              <div style={{ color: '#e2e8f0', fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
              {stat.total && <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '2px' }}>of {stat.total} total</div>}
              {stat.unit && <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '2px' }}>{stat.unit}</div>}
            </div>
          ))}
        </div>

        {/* MAIN ANALYTICS GRID */}
        <div className="grid grid-cols-3 gap-6">
          {/* Global Risk Trend */}
          <div className="col-span-2 glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem' }}>Global Risk Index — 7-Month Trend</h3>
                <p style={{ color: '#3a4e62', fontSize: '0.68rem', marginTop: '3px' }}>Composite cross-domain risk scoring (0–100)</p>
              </div>
              <div className="flex items-center gap-4">
                {[{ label: 'Geopolitical', color: '#b84a4a' }, { label: 'Economic', color: '#00d4ff' }, { label: 'Climate', color: '#3eb87a' }, { label: 'Cyber', color: '#8a78c8' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-3 h-px inline-block" style={{ background: l.color }} />
                    <span style={{ color: '#3a4e62', fontSize: '0.67rem' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <GlobalRiskChart />
          </div>

          {/* Key Insights */}
          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Critical Insights</h3>
            <div className="space-y-2">
              {keyInsights.map((insight, i) => (
                <div key={i} className="p-2.5 rounded-lg" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="flex items-start gap-2">
                    {insight.severity === 'critical' ? (
                      <AlertTriangle size={13} style={{ color: '#b84a4a', marginTop: '2px' }} />
                    ) : (
                      <AlertCircle size={13} style={{ color: insight.severity === 'high' ? '#f59e0b' : '#3eb87a', marginTop: '2px' }} />
                    )}
                    <div className="flex-1">
                      <div style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600 }}>{insight.title}</div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '1px' }}>{insight.regions} regions affected</div>
                    </div>
                    <div style={{ color: insight.trend === 'up' ? '#b84a4a' : insight.trend === 'down' ? '#3eb87a' : '#94a3b8', fontWeight: 700, fontSize: '0.7rem' }}>
                      {insight.trend === 'up' ? 'UP' : insight.trend === 'down' ? 'DOWN' : 'STABLE'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REGIONAL RISK & COVERAGE */}
        <div className="grid grid-cols-2 gap-6">
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
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.06)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.risk}%`, background: `linear-gradient(90deg, ${r.color}90, ${r.color}60)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Global Coverage */}
          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>Global Coverage — 208 Nations</h3>
            <div className="space-y-2">
              {globalCoverage.map(c => (
                <div key={c.region} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.05)' }}>
                  <div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600 }}>{c.region}</div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{c.countries} countries</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#3eb87a', fontSize: '0.75rem', fontWeight: 700 }}>{c.threats}</div>
                    <div style={{ color: '#64748b', fontSize: '0.65rem' }}>active threats</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODULE PERFORMANCE */}
        <div className="glass-card rounded-2xl p-5">
          <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '16px' }}>Module Performance Dashboard (24h)</h3>
          <div className="grid grid-cols-6 gap-3">
            {modulePerformance.map(m => (
              <div key={m.name} className="p-3 rounded-lg" style={{ background: 'rgba(15,23,42,0.7)', border: `1px solid ${m.status === 'optimal' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: m.status === 'optimal' ? '#22c55e' : '#f59e0b' }} />
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 700 }}>{m.users}</div>
                <div style={{ color: '#64748b', fontSize: '0.65rem' }}>users active</div>
                <div style={{ color: '#3eb87a', fontSize: '0.7rem', marginTop: '4px', fontWeight: 600 }}>{m.avgTime} avg</div>
              </div>
            ))}
          </div>
        </div>

        {/* ANALYTICS & FEED */}
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
                    <div className="h-1 rounded-full" style={{ background: 'rgba(0,212,255,0.05)' }}>
                      <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}90, ${s.color}60)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SENTIMENT & LOGS */}
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
                  style={{ borderBottom: i < events.length - 1 ? '1px solid rgba(0,212,255,0.05)' : 'none' }}
                >
                  <span
                    className="font-mono shrink-0"
                    style={{ color: '#2a3d52', fontSize: '0.62rem', minWidth: '52px' }}
                  >
                    <RelativeTimestamp timestamp={entry.timestamp} />
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

        {/* DATA PIPELINE & SYSTEM STATS */}
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Data Pipeline Status</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Ingestion', value: 98, status: 'healthy' },
                { name: 'Processing', value: 96, status: 'healthy' },
                { name: 'ML Pipeline', value: 94, status: 'healthy' },
                { name: 'Cache Layer', value: 99, status: 'healthy' },
              ].map(p => (
                <div key={p.name}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{p.name}</span>
                    <span style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 700 }}>{p.value}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(0,212,255,0.06)' }}>
                    <div style={{ width: `${p.value}%`, height: '100%', borderRadius: '999px', background: '#22c55e' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Feature Adoption</h3>
            <div className="space-y-2.5">
              {[
                { feature: 'Intelligence Hub', adoption: 87 },
                { feature: 'Bill Analysis', adoption: 62 },
                { feature: 'Predictions', adoption: 48 },
                { feature: 'Knowledge Graph', adoption: 79 },
              ].map(f => (
                <div key={f.feature}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{f.feature}</span>
                    <span style={{ color: '#00d4ff', fontSize: '0.7rem', fontWeight: 700 }}>{f.adoption}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(0,212,255,0.06)' }}>
                    <div style={{ width: `${f.adoption}%`, height: '100%', borderRadius: '999px', background: '#00d4ff' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 style={{ color: '#c4cdd8', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>Resource Utilization</h3>
            <div className="space-y-2.5">
              {[
                { resource: 'CPU', value: 62 },
                { resource: 'Memory', value: 78 },
                { resource: 'Storage', value: 71 },
                { resource: 'Network', value: 44 },
              ].map(r => (
                <div key={r.resource}>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{r.resource}</span>
                    <span style={{ color: r.value > 80 ? '#f59e0b' : r.value > 70 ? '#3eb87a' : '#22c55e', fontSize: '0.7rem', fontWeight: 700 }}>{r.value}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(0,212,255,0.06)' }}>
                    <div style={{ width: `${r.value}%`, height: '100%', borderRadius: '999px', background: r.value > 80 ? '#f59e0b' : r.value > 70 ? '#3eb87a' : '#22c55e' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="flex items-center justify-between py-4"
          style={{ borderTop: '1px solid rgba(0,212,255,0.06)' }}
        >
          <span style={{ color: '#1e2e3e', fontSize: '0.62rem', letterSpacing: '0.04em' }}>
            ONTORA v4.2.1 — CLASSIFICATION: TOP SECRET // SCI // ORCON // NOFORN {loading ? '(SYNCING)' : '(LIVE)'} | {platformStats.totalUsers} registered users | {platformStats.modules} active modules
          </span>
          <div className="flex items-center gap-2">
            <Server size={10} style={{ color: '#1e2e3e' }} />
            <span style={{ color: '#1e2e3e', fontSize: '0.62rem' }}>Cluster: us-east-1 | Nodes: 48 | Uptime: {platformStats.systemUptime}%</span>
          </div>
        </div>
      </main>
    </div>
  );
}
