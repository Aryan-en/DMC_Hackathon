'use client';

import TopBar from '@/components/TopBar';
import { useStreamsMetrics } from '@/app/hooks/useStreamsMetrics';
import { useEffect, useState } from 'react';

export default function DataStreamsPage() {
  const { data, loading, error } = useStreamsMetrics(5000);
  const [refreshTime, setRefreshTime] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setRefreshTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalLag = data.topics.reduce((acc, t) => acc + (t.lag || 0), 0);
  const healthyTopics = data.topics.filter((t) => t.status === 'healthy').length;
  const totalThroughput = data.topics.reduce((acc, t) => acc + (t.throughput || 0), 0);
  const avgLatency = data.pipelines.length > 0
    ? data.pipelines.reduce((acc, p) => {
        const ms = parseFloat(p.latency);
        return Number.isNaN(ms) ? acc : acc + ms;
      }, 0) / data.pipelines.length
    : 0;

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar
        title="Data Streams"
        subtitle="Live Kafka/Flink streaming infrastructure & real-time metrics"
      />
      <main className="flex-1 px-6 py-6 space-y-6">
        {error && (
          <div
            className="px-4 py-2 rounded-xl text-xs"
            style={{
              background: 'rgba(184,74,74,0.08)',
              border: '1px solid rgba(184,74,74,0.2)',
              color: '#b84a4a',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Header Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              Topics
            </div>
            <div className="text-2xl font-bold" style={{ color: '#00d4ff' }}>
              {data.topics.length}
            </div>
            <div className="text-2xs mt-2" style={{ color: '#64748b' }}>
              {healthyTopics} healthy
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              Pipelines
            </div>
            <div className="text-2xl font-bold" style={{ color: '#00ff88' }}>
              {data.pipelines.length}
            </div>
            <div className="text-2xs mt-2" style={{ color: '#64748b' }}>
              Running
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              Total Throughput
            </div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {(totalThroughput / 1000).toFixed(0)}K
            </div>
            <div className="text-2xs mt-2" style={{ color: '#64748b' }}>
              msg/sec
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              Aggregate Lag
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: totalLag > 1000 ? '#ef4444' : totalLag > 500 ? '#f59e0b' : '#00ff88' }}
            >
              {totalLag.toLocaleString()}
            </div>
            <div className="text-2xs mt-2" style={{ color: '#64748b' }}>
              messages
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs" style={{ color: '#94a3b8' }}>
              Avg Latency
            </div>
            <div className="text-2xl font-bold" style={{ color: '#a78bfa' }}>
              {avgLatency.toFixed(0)}ms
            </div>
            <div className="text-2xs mt-2" style={{ color: '#64748b' }}>
              {refreshTime ? `updated ${refreshTime}` : 'updating...'}
            </div>
          </div>
        </div>

        {/* Topics Table */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
              📊 Kafka Topics
            </h3>
            <span className="text-2xs" style={{ color: '#64748b' }}>
              {loading ? 'Loading...' : 'Live'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(30,58,95,0.5)' }}>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Topic
                  </th>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Partitions
                  </th>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Lag
                  </th>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Throughput
                  </th>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Status
                  </th>
                  <th className="text-left py-2 px-3" style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                    Health
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topics.map((t) => (
                  <tr
                    key={t.topic}
                    style={{
                      borderBottom: '1px solid rgba(30,58,95,0.3)',
                      background: t.status === 'degraded' ? 'rgba(184,74,74,0.05)' : 'transparent',
                    }}
                  >
                    <td style={{ color: '#e2e8f0', fontSize: '0.75rem', padding: '0.75rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{t.topic}</span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.75rem', padding: '0.75rem' }}>
                      {t.partitions}
                    </td>
                    <td
                      style={{
                        color: t.lag > 1000 ? '#ef4444' : t.lag > 500 ? '#f59e0b' : '#00ff88',
                        fontSize: '0.75rem',
                        padding: '0.75rem',
                      }}
                    >
                      {t.lag.toLocaleString()}
                    </td>
                    <td style={{ color: '#00d4ff', fontSize: '0.75rem', padding: '0.75rem' }}>
                      {(t.throughput / 1000).toFixed(1)}K msg/s
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          background:
                            t.status === 'healthy'
                              ? 'rgba(0,255,136,0.2)'
                              : t.status === 'warning'
                              ? 'rgba(245,158,11,0.2)'
                              : 'rgba(239,68,68,0.2)',
                          color:
                            t.status === 'healthy'
                              ? '#00ff88'
                              : t.status === 'warning'
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'rgba(30,58,95,0.5)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, (100 - (t.lag / 2000) * 100))}%`,
                            height: '100%',
                            background:
                              t.lag > 1000 ? '#ef4444' : t.lag > 500 ? '#f59e0b' : '#00ff88',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && data.topics.length === 0 && (
            <p className="text-xs mt-3" style={{ color: '#64748b' }}>
              No topics available
            </p>
          )}
        </div>

        {/* Pipelines */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>
              ⚙️ Flink Pipelines
            </h3>
            <span className="text-2xs" style={{ color: '#64748b' }}>
              Real-time aggregations
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {data.pipelines.map((p) => (
              <div
                key={p.name}
                className="p-4 rounded-lg"
                style={{
                  background: 'rgba(2,8,23,0.5)',
                  border: '1px solid rgba(30,58,95,0.4)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: '600' }}>
                      {p.name}
                    </span>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                      {p.throughput} · latency {p.latency}
                    </div>
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      background:
                        p.status === 'healthy'
                          ? 'rgba(0,212,255,0.2)'
                          : p.status === 'warning'
                          ? 'rgba(245,158,11,0.2)'
                          : 'rgba(239,68,68,0.2)',
                      color:
                        p.status === 'healthy'
                          ? '#00d4ff'
                          : p.status === 'warning'
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(30,58,95,0.6)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width:
                        p.status === 'healthy'
                          ? '100%'
                          : p.status === 'warning'
                          ? '70%'
                          : '40%',
                      height: '100%',
                      background:
                        p.status === 'healthy'
                          ? '#00ff88'
                          : p.status === 'warning'
                          ? '#f59e0b'
                          : '#ef4444',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {!loading && data.pipelines.length === 0 && (
            <p className="text-xs mt-3" style={{ color: '#64748b' }}>
              No pipelines available
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
