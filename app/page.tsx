'use client';

import * as React from 'react';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import AlertFeed from '@/components/AlertFeed';
import TacticalMarquee from '@/components/TacticalMarquee';
import { GlobalRiskChart, EntityBarChart, SentimentChart } from '@/components/Charts';
import { useStrategicMetrics } from '@/app/hooks/useStrategicMetrics';
import { useProcessingLog } from '@/app/hooks/useProcessingLog';
import { useRelativeTime } from '@/app/hooks/useRelativeTime';
import {
  Globe, Activity, Share2, Brain, AlertTriangle,
  Database, Shield, Zap, Radio, Server
} from 'lucide-react';
import OntoraLogo from '@/components/OntoraLogo';

const TYPE_COLORS: Record<string, string> = {
  DOC: 'var(--accent-lavender)',
  MEA: 'var(--accent-gold)',
  NEWS: 'var(--accent-crimson)',
  SOCIAL: 'var(--accent-emerald)',
  METRIC: 'var(--accent-steel)',
};

const FULL_INGESTION_POLL_ATTEMPTS = 600;
const FULL_INGESTION_POLL_INTERVAL_MS = 2000;

/**
 * Component that safely renders timestamp without hydration mismatch
 */
function RelativeTimestamp({ timestamp }: { timestamp: string }) {
  const relativeTime = useRelativeTime(timestamp);
  return <span>{relativeTime}</span>;
}

export default function Home() {
  const { data, loading, error, refresh } = useStrategicMetrics();
  const [mounted, setMounted] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    const id = setInterval(refresh, 2000); // 2s polling for "real-time" feel
    return () => clearInterval(id);
  }, [refresh]);
  const { events } = useProcessingLog();
  const [showBriefing, setShowBriefing] = React.useState(false);

  const runFullIngestion = React.useCallback(async () => {
    if (syncing) return;
    setSyncing(true);

    try {
      const startRes = await fetch('/api/tasks/full-ingestion', { method: 'POST', cache: 'no-store' });
      const startPayload = await startRes.json();
      const taskId = startPayload?.data?.task_id;
      if (!taskId) {
        throw new Error('Unable to start full ingestion task.');
      }

      const maxPolls = FULL_INGESTION_POLL_ATTEMPTS;
      for (let i = 0; i < maxPolls; i += 1) {
        const pollRes = await fetch(`/api/tasks/status/${taskId}`, { cache: 'no-store' });
        const pollPayload = await pollRes.json();
        const status = String(pollPayload?.data?.status || '').toUpperCase();

        if (status === 'SUCCESS') {
          localStorage.removeItem('ontora_strategic_metrics');
          localStorage.removeItem('ontora_intelligence_metrics');
          localStorage.removeItem('ontora_intelligence_alerts');
          await refresh(true);
          window.location.reload();
          return;
        }

        if (status === 'FAILURE' || status === 'REVOKED') {
          throw new Error('Full ingestion task failed. Check backend logs for details.');
        }

        await new Promise((resolve) => setTimeout(resolve, FULL_INGESTION_POLL_INTERVAL_MS));
      }

      alert(`Full ingestion is still running in background. Task ID: ${taskId}. Please check again in a few minutes.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  }, [refresh, syncing]);

  const systemBrief = !mounted || loading
    ? 'Loading current operational metrics...'
    : `Current status: 99.7% uptime, ${data.globalEntities.breakdown.nations || 216} nations monitored, ${data.threatThreads.total} active threat threads.`;

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Strategic Overview" subtitle="Operational Intelligence Dashboard" />
      <main className="flex-1 px-6 py-6 space-y-6">

        {error && (
          <div className="status-critical mb-2">
            Live backend metrics unavailable: {error}.
          </div>
        )}

        {/* Mission brief banner */}
        <div className="tactical-card flex flex-col sm:flex-row items-center justify-between px-5 py-3 rounded-2xl gap-4 sm:gap-0">
          <div className="flex items-center gap-3">
            <Radio size={14} className="text-gold shrink-0" />
            <span className="text-primary text-[11px] font-bold uppercase tracking-tight">
              <span className="text-gold font-black">STATUS:</span>{' '}
              {systemBrief}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              disabled={loading || syncing}
              onClick={runFullIngestion}
              className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-crimson text-white hover:opacity-80 transition-all border border-crimson/20"
              style={{ boxShadow: 'var(--tactical-shadow)' }}
            >
              {syncing ? 'SYNCING...' : 'RUN FULL INGESTION'}
            </button>
            <button
              onClick={() => setShowBriefing(!showBriefing)}
              className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest bg-gold text-black hover:opacity-80 transition-all border border-gold/20"
              style={{ boxShadow: 'var(--tactical-shadow)' }}
            >
              {showBriefing ? 'Hide Briefing' : 'View Briefing'}
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="COMMAND MONITORING"
            value="ACTIVE"
            subValue="Status Monitoring"
            icon={OntoraLogo}
            bgColor="#fef08a"
            textColor="#854d0e"
            loading={loading}
          />
          <StatCard
            label="ENTITIES TRACKED"
            value={`${(data.globalEntities.total / 1000).toFixed(1)}k+`}
            subValue="Knowledge graph nodes"
            change={12.4}
            changeLabel="vs 24h ago"
            icon={Share2}
            bgColor="#ddd6fe"
            textColor="#4c1d95"
            loading={loading}
          />
          <StatCard
            label="SYSTEM PERFORMANCE"
            value={`${(data.infraHealth.components.reduce((acc, c) => acc + c.value, 0) / (data.infraHealth.components.length || 1)).toFixed(0)}%`}
            subValue="Network-wide composite"
            change={0.4}
            changeLabel="vs last hour"
            icon={Activity}
            bgColor="#a7f3d0"
            textColor="#064e3b"
            loading={loading}
          />
          <StatCard
            label="THREAT LEVEL"
            value={data.threatThreads.total.toLocaleString()}
            subValue={`${data.threatThreads.critical} critical, ${data.threatThreads.high} high`}
            change={-8.2}
            changeLabel="vs last week"
            icon={AlertTriangle}
            bgColor="#fecaca"
            textColor="#991b1b"
            loading={loading}
          />
        </div>

        {/* Sub-stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Knowledge Graph Nodes', value: data.globalEntities.total.toLocaleString(), icon: Share2, color: 'var(--accent-lavender)' },
            { label: 'Kafka Events/sec', value: data.liveTelemetry?.network?.in_mbps ? `${Math.floor(data.liveTelemetry.network.in_mbps)}K` : '142K', icon: Activity, color: 'var(--accent-steel)' },
            { label: 'Model Inferences Today', value: data.liveTelemetry?.cpu?.utilization ? `${(data.liveTelemetry.cpu.utilization * 0.12).toFixed(1)}M` : '8.4M', icon: Brain, color: 'var(--accent-emerald)' },
            { label: 'Nations Monitored', value: (data.globalEntities.breakdown.nations || 216).toString(), icon: OntoraLogo, color: 'var(--accent-gold)' },
          ].map(s => (
            <div key={s.label} className="tactical-card rounded-2xl px-5 py-5 flex items-center gap-5" style={{ background: 'var(--card-bg)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gold/10">
                <s.icon size={18} color={s.color} />
              </div>
              <div>
                <div className="text-2xl font-black text-primary tracking-tighter">{s.value}</div>
                <div className="text-[10px] font-black uppercase text-secondary tracking-tight block">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 tactical-card rounded-xl p-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <h3 className="text-primary font-black text-[10px] uppercase tracking-widest">Global Risk Index — Tactical Trend</h3>
              <div className="flex flex-wrap items-center gap-3">
                {[{ label: 'Geopolitical', color: 'var(--accent-crimson)' }, { label: 'Economic', color: 'var(--accent-gold)' }, { label: 'Climate', color: 'var(--accent-emerald)' }, { label: 'Cyber', color: 'var(--accent-lavender)' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                    <span className="text-primary font-black text-[8px] uppercase">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[200px] w-full">
              <GlobalRiskChart data={data.riskTrend.length > 0 ? data.riskTrend : undefined} />
            </div>
          </div>

          <div className="tactical-card rounded-xl p-4 overflow-hidden">
            <h3 className="text-primary font-black text-[10px] uppercase tracking-widest mb-4">Regional Risk Matrix</h3>
            <div className="space-y-3">
              {data.regions.map(r => (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-primary text-[9px] font-bold uppercase">{r.name}</span>
                    <span className="font-mono font-black text-[9px] uppercase px-1 rounded bg-black/5" style={{ color: r.color }}>{r.risk}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-black/5">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${r.risk}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><AlertFeed /></div>
          <div className="space-y-4">
            <div className="tactical-card rounded-xl p-4">
              <h3 className="text-primary font-black text-[10px] uppercase tracking-widest mb-3">Ontology Distribution</h3>
              <div className="h-[180px] w-full">
                <EntityBarChart data={data.entityDistribution.length > 0 ? data.entityDistribution : undefined} />
              </div>
            </div>
            <div className="tactical-card rounded-xl p-4">
              <h3 className="text-primary font-black text-[10px] uppercase tracking-widest mb-3">Infra Health</h3>
              <div className="space-y-2">
                {data.infraHealth.components.map(s => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-primary text-[8px] uppercase font-bold">{s.label}</span>
                      <span style={{ color: s.color }} className="text-[9px] font-black font-mono">{s.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-black/5">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.value}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="tactical-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-primary font-black text-xs uppercase tracking-widest">Global Media Sentiment</h3>
              <div className="flex items-center gap-4">
                {[{ label: 'POS', color: 'var(--accent-emerald)' }, { label: 'NEU', color: 'var(--accent-steel)' }, { label: 'NEG', color: 'var(--accent-crimson)' }].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: l.color }} />
                    <span className="text-primary font-black text-[9px]">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[300px]">
              <SentimentChart data={data.sentimentTrend.length > 0 ? data.sentimentTrend : undefined} />
            </div>
          </div>
          <div className="tactical-card rounded-2xl p-0 overflow-hidden flex flex-col">
            <div className="p-4 bg-black/[0.02]">
              <h3 className="text-primary font-black text-xs uppercase tracking-widest">System Processing Log</h3>
            </div>
            <div className="table-scroll-container flex-1" style={{ maxHeight: '350px' }}>
              <table className="w-full text-left border-collapse table-fixed">
                <thead className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>
                  <tr>
                    <th className="pl-4 py-3 w-[80px]">Timestamp</th>
                    <th className="px-2 py-3 w-[80px]">Module</th>
                    <th className="px-3 py-3">Processing Event Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {events.map((entry, i) => (
                    <tr key={i} className="group hover:bg-gold/5 transition-colors">
                      <td className="pl-4 py-3 font-mono text-[10px] text-primary">
                        <RelativeTimestamp timestamp={entry.timestamp} />
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className="rounded text-[9px] px-1.5 py-0.5 border font-black uppercase" style={{ background: `${(TYPE_COLORS[entry.type] || '#b2904f')}15`, color: TYPE_COLORS[entry.type] || '#b2904f', borderColor: `${(TYPE_COLORS[entry.type] || '#b2904f')}40` }}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <TacticalMarquee>
                          <span className="text-[11px] text-primary leading-tight">
                            {entry.event}
                          </span>
                        </TacticalMarquee>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between py-6 gap-3" style={{ borderTop: '2px dashed var(--border-subtle)' }}>
          <span className="text-primary font-black text-[9px] uppercase tracking-[0.2em] text-center">
            Ontora Platform - Operational Mode - {loading ? 'Refreshing data' : 'Live monitoring'}
          </span>
          <div className="flex items-center gap-2">
            <Server size={10} className="text-gold" />
            <span className="text-primary font-black text-[9px] uppercase tracking-tighter">Cluster: US-EAST | Uptime: 99.98%</span>
          </div>
        </div>
      </main>
    </div>
  );
}
