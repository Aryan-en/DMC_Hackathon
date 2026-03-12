'use client';

import TopBar from '@/components/TopBar';
import { Database, HardDrive, Archive, Search, Table, RefreshCw, CloudSnow } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const INGESTION_HISTORY = [
  { date: '03/06', bronze: 22.1, silver: 7.4, gold: 1.2 },
  { date: '03/07', bronze: 24.8, silver: 8.1, gold: 1.3 },
  { date: '03/08', bronze: 21.3, silver: 7.0, gold: 1.1 },
  { date: '03/09', bronze: 26.7, silver: 8.8, gold: 1.4 },
  { date: '03/10', bronze: 25.4, silver: 8.4, gold: 1.3 },
  { date: '03/11', bronze: 28.2, silver: 9.2, gold: 1.5 },
  { date: '03/12', bronze: 29.7, silver: 9.8, gold: 1.6 },
];

const QUERY_TRENDS = [
  { hour: '00:00', queries: 1240 }, { hour: '02:00', queries: 840 }, { hour: '04:00', queries: 620 },
  { hour: '06:00', queries: 1890 }, { hour: '08:00', queries: 4210 }, { hour: '10:00', queries: 6840 },
  { hour: '12:00', queries: 7200 }, { hour: '14:00', queries: 6500 }, { hour: '16:00', queries: 7800 },
  { hour: '18:00', queries: 5200 }, { hour: '20:00', queries: 3400 }, { hour: '22:00', queries: 2100 },
];

const DATASETS = [
  { name: 'news.global.processed', format: 'Delta Lake', records: '847M', size: '2.4TB', updated: '12 min ago', tier: 'Silver' },
  { name: 'social.sentiment.timeseries', format: 'TimescaleDB', records: '4.2B', size: '8.7TB', updated: '2 min ago', tier: 'Silver' },
  { name: 'geopolitical.events.raw', format: 'Parquet', records: '124M', size: '680GB', updated: '1 hr ago', tier: 'Bronze' },
  { name: 'economic.indicators.curated', format: 'Iceberg', records: '18M', size: '94GB', updated: '6 hr ago', tier: 'Gold' },
  { name: 'satellite.imagery.index', format: 'Parquet', records: '2.1M', size: '847GB', updated: '31 min ago', tier: 'Bronze' },
  { name: 'kg.entity.embeddings', format: 'Parquet', records: '3.8M', size: '124GB', updated: '45 min ago', tier: 'Gold' },
  { name: 'climate.sensor.archive', format: 'Delta Lake', records: '12.4B', size: '5.6TB', updated: '4 hr ago', tier: 'Bronze' },
  { name: 'trade.flows.aggregated', format: 'Snowflake', records: '84M', size: '210GB', updated: '1 hr ago', tier: 'Gold' },
];

const TIER_COLORS: Record<string, string> = {
  Bronze: '#f59e0b',
  Silver: '#94a3b8',
  Gold: '#fbbf24',
};

const customTooltipStyle = {
  backgroundColor: '#0d1e35',
  border: '1px solid #1e3a5f',
  borderRadius: '8px',
  padding: '10px 14px',
};

export default function DataLakePage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Lake" subtitle="AWS S3 · Delta Lake · Apache Iceberg · Snowflake · BigQuery · PostgreSQL" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Storage', value: '34.3TB', sub: 'Bronze + Silver + Gold', color: '#8b5cf6', icon: HardDrive },
            { label: 'Total Records', value: '21.7B', sub: 'Across all datasets', color: '#00d4ff', icon: Database },
            { label: 'Active Datasets', value: '847', sub: '124 updated today', color: '#00ff88', icon: Archive },
            { label: 'Query Performance', value: '94ms', sub: 'Avg Snowflake query', color: '#f59e0b', icon: Search },
          ].map(s => (
            <div key={s.label} className="glass-card rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{s.label}</div>
                <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Architecture diagram */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="font-semibold text-sm mb-5" style={{ color: '#e2e8f0' }}>Medallion Architecture — Data Flow</h3>
          <div className="flex items-center justify-between gap-4">
            {/* Sources */}
            <div className="flex flex-col gap-2" style={{ minWidth: '130px' }}>
              <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#334155', fontSize: '0.6rem' }}>SOURCES</div>
              {['News APIs', 'Social Media', 'Satellite', 'Markets', 'Gov APIs', 'Climate'].map(s => (
                <div key={s} className="px-3 py-1.5 rounded text-xs text-center" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: '#64748b', fontSize: '0.68rem' }}>{s}</div>
              ))}
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>Kafka/Flink</div>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #1e3a5f, #00d4ff40)' }} />
              <span style={{ color: '#00d4ff', fontSize: '0.8rem' }}>→</span>
            </div>

            {/* Bronze */}
            <div className="flex-1 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-xs font-bold mb-2" style={{ color: '#f59e0b', fontSize: '0.68rem' }}>BRONZE LAYER</div>
              <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>Raw / Unprocessed</div>
              <div className="text-xs mb-2" style={{ color: '#475569', fontSize: '0.65rem' }}>AWS S3 · GCP Cloud Storage</div>
              <div className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>24.7 TB</div>
              <div className="text-xs mt-1" style={{ color: '#334155', fontSize: '0.62rem' }}>Parquet · JSON · Raw</div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>Spark ETL</div>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #f59e0b40, #94a3b840)' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>
            </div>

            {/* Silver */}
            <div className="flex-1 p-4 rounded-xl" style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.2)' }}>
              <div className="text-xs font-bold mb-2" style={{ color: '#94a3b8', fontSize: '0.68rem' }}>SILVER LAYER</div>
              <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>Cleaned / Enriched</div>
              <div className="text-xs mb-2" style={{ color: '#475569', fontSize: '0.65rem' }}>Delta Lake · Apache Iceberg</div>
              <div className="text-sm font-bold font-mono" style={{ color: '#94a3b8' }}>8.2 TB</div>
              <div className="text-xs mt-1" style={{ color: '#334155', fontSize: '0.62rem' }}>Delta · ACID Transactions</div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>dbt · SQL</div>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #94a3b840, #fbbf2440)' }} />
              <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>→</span>
            </div>

            {/* Gold */}
            <div className="flex-1 p-4 rounded-xl" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div className="text-xs font-bold mb-2" style={{ color: '#fbbf24', fontSize: '0.68rem' }}>GOLD LAYER</div>
              <div className="text-xs mb-1" style={{ color: '#94a3b8' }}>Analytics-Ready</div>
              <div className="text-xs mb-2" style={{ color: '#475569', fontSize: '0.65rem' }}>Snowflake · BigQuery</div>
              <div className="text-sm font-bold font-mono" style={{ color: '#fbbf24' }}>1.4 TB</div>
              <div className="text-xs mt-1" style={{ color: '#334155', fontSize: '0.62rem' }}>Aggregated · BI-Ready</div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs" style={{ color: '#334155', fontSize: '0.65rem' }}>API · BI</div>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #fbbf2440, #00d4ff40)' }} />
              <span style={{ color: '#00d4ff', fontSize: '0.8rem' }}>→</span>
            </div>

            {/* Consumers */}
            <div className="flex flex-col gap-2" style={{ minWidth: '120px' }}>
              <div className="text-xs font-semibold tracking-widest mb-2" style={{ color: '#334155', fontSize: '0.6rem' }}>CONSUMERS</div>
              {['Dashboard', 'ML Models', 'Reports', 'APIs', 'Graph'].map(s => (
                <div key={s} className="px-3 py-1.5 rounded text-xs text-center" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: '#64748b', fontSize: '0.68rem' }}>{s}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Daily Ingestion by tier */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Daily Ingestion by Layer (TB)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={INGESTION_HISTORY} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} labelStyle={{ color: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="bronze" fill="#f59e0b" opacity={0.7} name="Bronze (TB)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="silver" fill="#94a3b8" opacity={0.7} name="Silver (TB)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="gold" fill="#fbbf24" opacity={0.7} name="Gold (TB)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Query volume */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Query Volume — Today (24h)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={QUERY_TRENDS} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} />
                <XAxis dataKey="hour" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} labelStyle={{ color: '#94a3b8', fontSize: 11 }} />
                <Line type="monotone" dataKey="queries" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Queries" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dataset catalog */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Dataset Catalog</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(13,30,53,0.8)', border: '1px solid #1e3a5f' }}>
                <Search size={11} style={{ color: '#475569' }} />
                <input placeholder="Search datasets..." className="bg-transparent text-xs outline-none w-40" style={{ color: '#94a3b8' }} />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
                <RefreshCw size={11} />
                Refresh
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Dataset Name</th>
                  <th className="text-left">Format</th>
                  <th className="text-left">Records</th>
                  <th className="text-left">Size</th>
                  <th className="text-left">Last Updated</th>
                  <th className="text-left">Tier</th>
                </tr>
              </thead>
              <tbody>
                {DATASETS.map(d => (
                  <tr key={d.name} className="cursor-pointer">
                    <td className="font-mono" style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{d.name}</td>
                    <td style={{ color: '#64748b' }}>{d.format}</td>
                    <td className="font-mono" style={{ color: '#94a3b8' }}>{d.records}</td>
                    <td className="font-mono font-bold" style={{ color: '#e2e8f0' }}>{d.size}</td>
                    <td style={{ color: '#475569' }}>{d.updated}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${TIER_COLORS[d.tier]}15`, border: `1px solid ${TIER_COLORS[d.tier]}30`, color: TIER_COLORS[d.tier] }}>
                        {d.tier}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
