'use client';

import { useState } from 'react';
import TopBar from '@/components/TopBar';
import { Settings, Database, Network, Shield, Zap, AlertCircle, CheckCircle, Clock } from 'lucide-react';

type SystemStatus = 'online' | 'degraded' | 'offline' | 'maintenance';

interface ServiceConfig {
  name: string;
  status: SystemStatus;
  uptime: number;
  responseTime: number;
  description: string;
  icon: React.ReactNode;
}

export default function ControlPanelPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const services: ServiceConfig[] = [
    {
      name: 'PostgreSQL Database',
      status: 'online',
      uptime: 99.9,
      responseTime: 12,
      description: 'Primary data store for entity records and relationships',
      icon: <Database size={18} />,
    },
    {
      name: 'Neo4j Graph DB',
      status: 'online',
      uptime: 99.8,
      responseTime: 8,
      description: 'Knowledge graph and ontology engine',
      icon: <Network size={18} />,
    },
    {
      name: 'API Gateway',
      status: 'online',
      uptime: 100,
      responseTime: 5,
      description: 'FastAPI backend service orchestration',
      icon: <Zap size={18} />,
    },
    {
      name: 'Authentication Service',
      status: 'online',
      uptime: 99.95,
      responseTime: 6,
      description: 'OAuth2 and JWT token management',
      icon: <Shield size={18} />,
    },
    {
      name: 'Redis Cache',
      status: 'online',
      uptime: 99.7,
      responseTime: 2,
      description: 'Distributed caching and session management',
      icon: <Zap size={18} />,
    },
    {
      name: 'Kafka Streams',
      status: 'degraded',
      uptime: 97.5,
      responseTime: 45,
      description: 'Real-time data pipeline and event streaming',
      icon: <AlertCircle size={18} />,
    },
  ];

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case 'online':
        return '#3eb87a';
      case 'degraded':
        return '#c8a84a';
      case 'offline':
        return '#ef4444';
      case 'maintenance':
        return '#5b8db8';
      default:
        return '#6f8096';
    }
  };

  const getStatusLabel = (status: SystemStatus) => {
    switch (status) {
      case 'online':
        return 'OPERATIONAL';
      case 'degraded':
        return 'DEGRADED';
      case 'offline':
        return 'OFFLINE';
      case 'maintenance':
        return 'MAINTENANCE';
      default:
        return 'UNKNOWN';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <main 
      className="min-h-screen cursor-pointer" 
      style={{ background: '#030810' }}
      onClick={() => window.location.href = 'http://localhost:3002/landing'}
    >
      <TopBar title="Control Panel" subtitle="System infrastructure and service management" />

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: '#d6b985', marginBottom: '8px' }}
            >
              Infrastructure Control
            </h1>
            <p style={{ color: '#6f8096', fontSize: '0.9rem' }}>
              Monitor and manage all backend services and infrastructure components
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
            style={{
              background: '#c8a84a',
              color: '#1a1302',
              border: '1px solid #d4b15f',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.06em',
              opacity: refreshing ? 0.7 : 1,
              cursor: refreshing ? 'not-allowed' : 'pointer',
            }}
          >
            {refreshing ? 'REFRESHING...' : 'REFRESH STATUS'}
          </button>
        </div>

        {/* System Overview */}
        <div
          className="mb-8 p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(160deg, rgba(10,21,37,0.6) 0%, rgba(8,16,30,0.4) 100%)',
            border: '1px solid rgba(200,168,74,0.15)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Services Online', value: '5/6', color: '#3eb87a' },
              { label: 'Avg Uptime', value: '99.2%', color: '#00d4ff' },
              { label: 'Total Requests', value: '2.4M', color: '#c8a84a' },
              { label: 'Last Alert', value: '2h 15m ago', color: '#5b8db8' },
            ].map(stat => (
              <div key={stat.label}>
                <div style={{ color: '#6f8096', fontSize: '0.7rem', marginBottom: '6px', letterSpacing: '0.06em' }}>
                  {stat.label}
                </div>
                <div style={{ color: stat.color, fontSize: '1.5rem', fontWeight: 700 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(service => (
            <div
              key={service.name}
              onClick={() => setSelectedService(selectedService === service.name ? null : service.name)}
              className="p-5 rounded-xl transition-all cursor-pointer"
              style={{
                background:
                  selectedService === service.name
                    ? 'linear-gradient(160deg, rgba(50,74,100,0.5) 0%, rgba(30,50,70,0.3) 100%)'
                    : 'linear-gradient(160deg, rgba(10,21,37,0.6) 0%, rgba(8,16,30,0.4) 100%)',
                border: `1px solid ${
                  selectedService === service.name
                    ? 'rgba(200,168,74,0.4)'
                    : 'rgba(200,168,74,0.12)'
                }`,
              }}
            >
              {/* Service Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="p-2.5 rounded-lg"
                  style={{
                    background: `${getStatusColor(service.status)}20`,
                    color: getStatusColor(service.status),
                  }}
                >
                  {service.icon}
                </div>
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold"
                  style={{
                    background: `${getStatusColor(service.status)}15`,
                    color: getStatusColor(service.status),
                    letterSpacing: '0.06em',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: getStatusColor(service.status) }}
                  />
                  {getStatusLabel(service.status)}
                </div>
              </div>

              {/* Service Name */}
              <h3
                className="font-semibold mb-1"
                style={{ color: '#d6b985', fontSize: '0.9rem' }}
              >
                {service.name}
              </h3>
              <p
                className="mb-4"
                style={{ color: '#6f8096', fontSize: '0.75rem', lineHeight: 1.5 }}
              >
                {service.description}
              </p>

              {/* Service Metrics */}
              {selectedService === service.name && (
                <div
                  className="pt-4 border-t space-y-3"
                  style={{ borderColor: 'rgba(200,168,74,0.1)' }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#6f8096', fontSize: '0.75rem' }}>Uptime</span>
                    <span
                      style={{
                        color: '#d6b985',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-geist-mono)',
                      }}
                    >
                      {service.uptime}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(200,168,74,0.1)' }}>
                    <div
                      className="h-full"
                      style={{
                        background: getStatusColor(service.status),
                        width: `${service.uptime}%`,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span style={{ color: '#6f8096', fontSize: '0.75rem' }}>Response Time</span>
                    <span
                      style={{
                        color: '#3eb87a',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-geist-mono)',
                      }}
                    >
                      {service.responseTime}ms
                    </span>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              {selectedService !== service.name && (
                <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(200,168,74,0.1)' }}>
                  <Clock size={12} style={{ color: '#6f8096' }} />
                  <span
                    style={{
                      color: '#6f8096',
                      fontSize: '0.7rem',
                      fontFamily: 'var(--font-geist-mono)',
                    }}
                  >
                    ~{service.responseTime}ms
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Alert Section */}
        <div
          className="mt-8 p-5 rounded-xl border"
          style={{
            background: 'rgba(184,74,74,0.08)',
            borderColor: 'rgba(184,74,74,0.22)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div className="flex-1">
              <h4 style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Active Alert: Kafka Stream Degradation
              </h4>
              <p style={{ color: '#f87171', fontSize: '0.75rem', lineHeight: 1.5 }}>
                Data pipeline experiencing increased latency. Investigating connection pool exhaustion. Estimated recovery: 45 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'View Logs', color: '#00d4ff' },
            { label: 'Configure Cache', color: '#3eb87a' },
            { label: 'Database Backup', color: '#c8a84a' },
            { label: 'System Settings', color: '#5b8db8' },
          ].map(action => (
            <button
              key={action.label}
              className="px-4 py-2.5 rounded-lg transition-all font-semibold text-sm"
              style={{
                background: `${action.color}15`,
                border: `1px solid ${action.color}35`,
                color: action.color,
                letterSpacing: '0.04em',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = `${action.color}25`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = `${action.color}15`;
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
