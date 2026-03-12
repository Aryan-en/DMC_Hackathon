'use client';

import TopBar from '@/components/TopBar';
import { Activity, Database, Server, Cpu, HardDrive, Layers, Radio, GitMerge } from 'lucide-react';
import { ThroughputChart } from '@/components/Charts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const KAFKA_TOPICS = [
  { topic: 'news.articles.global', partitions: 48, lag: 0, throughput: '42K/s', status: 'healthy' },
  { topic: 'social.sentiment.twitter', partitions: 32, lag: 14, throughput: '28K/s', status: 'healthy' },
  { topic: 'markets.realtime.feeds', partitions: 16, lag: 2, throughput: '8.4K/s', status: 'healthy' },
  { topic: 'satellite.imagery.events', partitions: 12, lag: 0, throughput: '1.2K/s', status: 'healthy' },
  { topic: 'geopolitical.events.stream', partitions: 24, lag: 7, throughput: '5.1K/s', status: 'warning' },
  { topic: 'climate.sensor.readings', partitions: 8, lag: 0, throughput: '3.8K/s', status: 'healthy' },
  { topic: 'economic.indicators.batch', partitions: 6, lag: 0, throughput: '840/s', status: 'healthy' },
  { topic: 'cyber.threat.feeds', partitions: 16, lag: 31, throughput: '2.1K/s', status: 'warning' },
];

const PIPELINES = [
  { name: 'News Ingestion → NLP → Graph', stages: ['Kafka', 'Flink', 'spaCy NER', 'Neo4j Write'], status: 'running', throughput: '42K docs/hr', latency: '1.8s' },
  { name: 'Social Media → Sentiment', stages: ['Kafka', 'Spark Streaming', 'BERT', 'TimescaleDB'], status: 'running', throughput: '84K posts/hr', latency: '2.4s' },
  { name: 'Satellite Feed → PostGIS', stages: ['API Pull', 'Flink', 'GeoPandas', 'PostGIS'], status: 'running', throughput: '1.2K images/hr', latency: '8.2s' },
  { name: 'Market Data → Prediction', stages: ['WebSocket', 'Kafka', 'Flink', 'Prophet'], status: 'running', throughput: '8.4K ticks/s', latency: '0.3s' },
  { name: 'Batch ETL → Delta Lake', stages: ['S3 Trigger', 'Spark', 'Delta Lake', 'Snowflake'], status: 'running', throughput: '847GB/hr', latency: '24min' },
  { name: 'Graph ML → Predictions', stages: ['Neo4j', 'PyG', 'PyTorch', 'Pinecone'], status: 'degraded', throughput: '1.8K graphs/hr', latency: '18.4s' },
];

const lagData = Array.from({ length: 20 }, (_, i) => ({
  t: `${i * 3}m`,
  lag: Math.max(0, Math.floor(Math.sin(i * 0.5) * 30 + Math.random() * 15)),
}));

const customTooltipStyle = {
  backgroundColor: '#0d1e35',
  border: '1px solid #1e3a5f',
  borderRadius: '8px',
  padding: '10px 14px',
};

const STORAGE_LAYERS = [
  { name: 'Bronze Layer (Raw)', size: '24.7TB', format: 'Parquet / JSON', location: 'S3 + GCS', color: '#f59e0b', pct: 68 },
  { name: 'Silver Layer (Processed)', size: '8.2TB', format: 'Delta Lake', location: 'S3', color: '#94a3b8', pct: 23 },
  { name: 'Gold Layer (Analytics)', size: '1.4TB', format: 'Iceberg / Parquet', location: 'Snowflake', color: '#fbbf24', pct: 9 },
];

export default function DataStreamsPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Streams" subtitle="Apache Kafka · Apache Flink · Spark · Delta Lake · Iceberg" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Throughput', value: '142K/s', sub: 'events per second', color: '#00d4ff', icon: Activity },
            { label: 'Active Kafka Topics', value: '48', sub: '284 partitions', color: '#f59e0b', icon: Radio },
            { label: 'Flink Jobs Running', value: '23', sub: '2 degraded, 21 healthy', color: '#00ff88', icon: Cpu },
            { label: 'Data Storage', value: '34.3TB', sub: 'Bronze + Silver + Gold', color: '#8b5cf6', icon: HardDrive },
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

        {/* Throughput chart + lag chart */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Event Ingestion Throughput — 24h</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Events ingested vs processed (per hour)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-px inline-block" style={{ background: '#00d4ff' }} /><span className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>Ingested</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-px inline-block border-t-2 border-dashed" style={{ borderColor: '#00ff88' }} /><span className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>Processed</span></div>
              </div>
            </div>
            <ThroughputChart />
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Consumer Group Lag — Last 60min</h3>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Message offset lag (lower is better)</p>
              </div>
              <div className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88', fontSize: '0.65rem' }}>NOMINAL</div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={lagData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="lag-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} />
                <XAxis dataKey="t" tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} labelStyle={{ color: '#94a3b8', fontSize: 11 }} />
                <Area type="monotone" dataKey="lag" stroke="#f59e0b" strokeWidth={1.5} fill="url(#lag-grad)" name="Lag (msgs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Kafka topics */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Kafka Topic Status</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: '#00ff88' }} />
              <span className="text-xs" style={{ color: '#64748b', fontSize: '0.68rem' }}>Healthy</span>
              <span className="w-2 h-2 rounded-full ml-2" style={{ background: '#f59e0b' }} />
              <span className="text-xs" style={{ color: '#64748b', fontSize: '0.68rem' }}>Warning</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Topic</th>
                  <th className="text-left">Partitions</th>
                  <th className="text-left">Consumer Lag</th>
                  <th className="text-left">Throughput</th>
                  <th className="text-left">Health</th>
                </tr>
              </thead>
              <tbody>
                {KAFKA_TOPICS.map(t => (
                  <tr key={t.topic}>
                    <td className="font-mono" style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{t.topic}</td>
                    <td style={{ color: '#94a3b8' }}>{t.partitions}</td>
                    <td>
                      <span className="font-mono font-bold" style={{ color: t.lag > 10 ? '#f59e0b' : '#00ff88' }}>
                        {t.lag}
                      </span>
                    </td>
                    <td className="font-mono" style={{ color: '#64748b' }}>{t.throughput}</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'healthy' ? 'status-online' : 'status-warning'}`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Processing pipelines */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-5" style={{ color: '#e2e8f0' }}>Active Processing Pipelines</h3>
          <div className="space-y-4">
            {PIPELINES.map((p, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(2,8,23,0.6)', border: `1px solid ${p.status === 'degraded' ? 'rgba(245,158,11,0.3)' : 'rgba(30,58,95,0.5)'}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.status === 'degraded' ? '#f59e0b' : '#00ff88' }} />
                    <span className="font-semibold text-sm" style={{ color: '#e2e8f0', fontSize: '0.78rem' }}>{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>Throughput</div>
                      <div className="text-xs font-mono font-bold" style={{ color: '#00d4ff', fontSize: '0.72rem' }}>{p.throughput}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>Avg Latency</div>
                      <div className="text-xs font-mono font-bold" style={{ color: '#f59e0b', fontSize: '0.72rem' }}>{p.latency}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.stages.map((stage, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg text-xs" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff', fontSize: '0.65rem' }}>
                        {stage}
                      </div>
                      {j < p.stages.length - 1 && (
                        <span style={{ color: '#1e3a5f', fontSize: '0.7rem' }}>→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage layers */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-5" style={{ color: '#e2e8f0' }}>Data Lake Architecture</h3>
            <div className="space-y-4">
              {STORAGE_LAYERS.map(layer => (
                <div key={layer.name} className="p-4 rounded-xl" style={{ background: 'rgba(2,8,23,0.5)', border: `1px solid ${layer.color}30` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm" style={{ color: layer.color, fontSize: '0.78rem' }}>{layer.name}</span>
                    <span className="text-lg font-bold font-mono" style={{ color: '#e2e8f0' }}>{layer.size}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xs" style={{ color: '#475569', fontSize: '0.68rem' }}>Format: <span style={{ color: '#64748b' }}>{layer.format}</span></span>
                    <span className="text-xs" style={{ color: '#475569', fontSize: '0.68rem' }}>Location: <span style={{ color: '#64748b' }}>{layer.location}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                    <div className="h-full rounded-full" style={{ width: `${layer.pct}%`, background: layer.color, opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Cluster Node Status</h3>
            <div className="space-y-2.5">
              {Array.from({ length: 8 }, (_, i) => {
                const cpu = Math.floor(Math.random() * 40 + 50);
                const mem = Math.floor(Math.random() * 30 + 55);
                const status = i === 5 ? 'warning' : 'online';
                return (
                  <div key={i} className="p-3 rounded-lg flex items-center gap-4" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                    <div className="flex items-center gap-2 w-28">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: status === 'warning' ? '#f59e0b' : '#00ff88' }} />
                      <span className="text-xs font-mono" style={{ color: '#64748b', fontSize: '0.68rem' }}>kafka-node-{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs" style={{ color: '#334155', fontSize: '0.6rem' }}>CPU</span>
                        <span className="text-xs font-mono" style={{ color: '#00d4ff', fontSize: '0.6rem' }}>{cpu}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                        <div className="h-full rounded-full" style={{ width: `${cpu}%`, background: '#00d4ff', opacity: 0.6 }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs" style={{ color: '#334155', fontSize: '0.6rem' }}>MEM</span>
                        <span className="text-xs font-mono" style={{ color: '#8b5cf6', fontSize: '0.6rem' }}>{mem}%</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                        <div className="h-full rounded-full" style={{ width: `${mem}%`, background: '#8b5cf6', opacity: 0.6 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
