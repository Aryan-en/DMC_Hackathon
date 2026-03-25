'use client';

import { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import { 
  Settings, Database, Network, Shield, Zap, AlertCircle, 
  CheckCircle, Clock, Server, Layers, Globe, Activity 
} from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      case 'online': return 'var(--accent-emerald)';
      case 'degraded': return 'var(--accent-gold)';
      case 'offline': return 'var(--accent-crimson)';
      case 'maintenance': return 'var(--accent-steel)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: SystemStatus) => {
    switch (status) {
      case 'online': return 'OPERATIONAL';
      case 'degraded': return 'DEGRADED';
      case 'offline': return 'OFFLINE';
      case 'maintenance': return 'MAINT';
      default: return 'UNKNOWN';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  if (!mounted) return null;

  return (
    <main className="flex-1 flex flex-col grid-bg min-h-screen">
      <TopBar title="Control Panel" subtitle="Core Infrastructure & System Orchestration — CLASSIFICATION: TOP SECRET" />

      <div className="flex-1 p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--border-color)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-[var(--accent-gold)]" />
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">System Control Panel</h1>
            </div>
            <p className="text-[var(--text-secondary)] text-sm max-w-xl">
              Real-time monitoring and configuration interface for Ontora's distributed intelligence mesh.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-gold)] text-[var(--sidebar-bg)] font-bold text-xs tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {refreshing ? 'SYNCHRONIZING...' : 'FORCE SYSTEM AUDIT'}
          </button>
        </div>

        {/* Global Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Services Online', value: '5/6', color: 'var(--accent-emerald)', icon: CheckCircle },
            { label: 'Composite Uptime', value: '99.2%', color: 'var(--accent-steel)', icon: Activity },
            { label: 'Cluster Throughput', value: '2.4M ops', color: 'var(--accent-gold)', icon: Zap },
            { label: 'Security Handshake', value: 'PASS', color: 'var(--accent-emerald)', icon: Shield },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[var(--text-dim)] text-[0.65rem] font-bold tracking-widest uppercase mb-1">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 opacity-20" style={{ color: stat.color }} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Services Grid */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-bold tracking-[0.2em] text-[var(--accent-gold)] uppercase px-1">Active Mesh Components</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map(service => {
                const isSelected = selectedService === service.name;
                const statusColor = getStatusColor(service.status);
                
                return (
                  <div
                    key={service.name}
                    onClick={() => setSelectedService(isSelected ? null : service.name)}
                    className={`p-5 rounded-2xl transition-all cursor-pointer border ${isSelected ? 'scale-[1.02] border-[var(--accent-gold)]' : 'border-[var(--border-color)] hover:border-[var(--accent-gold-dim)]'}`}
                    style={{ background: isSelected ? 'var(--accent-gold-dim)' : 'var(--card-bg)' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-xl border border-[var(--border-color)]" style={{ background: 'var(--background)' }}>
                        <div style={{ color: statusColor }}>{service.icon}</div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[0.6rem] font-black border" 
                           style={{ borderColor: `${statusColor}40`, color: statusColor, background: `${statusColor}10` }}>
                        <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: statusColor }} />
                        {getStatusLabel(service.status)}
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{service.name}</h3>
                    <p className="text-[var(--text-secondary)] text-[0.7rem] line-clamp-2 leading-relaxed mb-4">{service.description}</p>
                    
                    {isSelected ? (
                      <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                        <div className="flex justify-between text-[0.65rem]">
                          <span className="text-[var(--text-dim)]">LATENCY</span>
                          <span className="text-[var(--accent-emerald)] font-mono">{service.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between text-[0.65rem]">
                          <span className="text-[var(--text-dim)]">UPTIME</span>
                          <span className="text-[var(--accent-gold)] font-mono">{service.uptime}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--background)] overflow-hidden">
                          <div className="h-full bg-[var(--accent-emerald)] shadow-[0_0_10px] shadow-[var(--accent-emerald)]" style={{ width: `${service.uptime}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[var(--text-muted)] text-[0.6rem] font-mono">
                        <Clock size={10} />
                        LAST HEARTBEAT: {(Math.random() * 5).toFixed(1)}s AGO
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar - System Health & New Info */}
          <div className="space-y-6">
            {/* The Moved Component: SYSTEM STATUS */}
            <div className="glass-card p-6 rounded-2xl border-l-[3px] border-l-[var(--accent-gold)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-[0.7rem] font-black tracking-[0.2em] text-[var(--text-dim)] uppercase">System Health</h3>
                  <p className="text-[0.6rem] text-[var(--text-muted)] italic">Core Process Verification</p>
                </div>
                <Globe className="w-4 h-4 text-[var(--accent-gold)] opacity-50" />
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Data Ingestion', status: 'ONLINE', color: 'var(--accent-emerald)', load: 45 },
                  { label: 'ML Pipeline', status: 'ONLINE', color: 'var(--accent-emerald)', load: 82 },
                  { label: 'Neo4j Cluster', status: 'SYNCING', color: 'var(--accent-gold)', load: 94 },
                  { label: 'Ollama Inference', status: 'ONLINE', color: 'var(--accent-emerald)', load: 24 },
                ].map(s => (
                  <div key={s.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[0.7rem] text-[var(--text-secondary)] font-medium">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.6rem] font-mono font-bold" style={{ color: s.color }}>{s.status}</span>
                        <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: s.color }} />
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--background)] overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${s.load}%`, background: s.color, opacity: 0.6 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--background)] border border-[var(--border-color)] flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[var(--text-dim)]" />
                  </div>
                  <div>
                    <p className="text-[0.65rem] font-bold text-[var(--text-primary)]">v4.2.1-GOLD</p>
                    <p className="text-[0.55rem] text-[var(--text-muted)] tracking-widest uppercase">Classified Build</p>
                  </div>
                </div>
                <div className="text-[0.55rem] font-mono text-[var(--text-muted)] text-right">
                  NODE: 0x9f22<br/>STABLE
                </div>
              </div>
            </div>

            {/* Critical Alert Card */}
            <div className="p-5 rounded-2xl bg-[var(--accent-crimson)]/[0.08] border border-[var(--accent-crimson)]/[0.2] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertCircle className="w-24 h-24 text-[var(--accent-crimson)]" />
              </div>
              <div className="flex items-start gap-3 relative z-10">
                <AlertCircle className="w-5 h-5 text-[var(--accent-crimson)] shrink-0 mt-1 animate-pulse" />
                <div>
                  <h4 className="text-[0.75rem] font-bold text-[var(--accent-crimson)] mb-1 uppercase tracking-wider">Kafka Stream Degradation</h4>
                  <p className="text-[0.7rem] text-[var(--accent-crimson)] opacity-80 leading-relaxed">
                    Data pipeline experiencing increased latency (45ms). Potential connection pool exhaustion in region: [ASIA-EAST-1].
                  </p>
                  <button className="mt-4 px-3 py-1.5 rounded-lg bg-[var(--accent-crimson)] text-white text-[0.6rem] font-black tracking-widest">
                    PATCH CLUSTER
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Management Actions */}
        <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'View Audit Logs', icon: Clock, color: 'var(--accent-steel)' },
            { label: 'Cache Control', icon: Zap, color: 'var(--accent-emerald)' },
            { label: 'Database Backup', icon: Database, color: 'var(--accent-gold)' },
            { label: 'System Reset', icon: Settings, color: 'var(--accent-crimson)' },
          ].map(action => (
            <button key={action.label} className="glass-card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-[var(--accent-gold)] group">
              <div className="p-2 rounded-xl bg-[var(--background)] group-hover:scale-110 transition-transform">
                <action.icon size={18} style={{ color: action.color }} />
              </div>
              <span className="text-[0.65rem] font-bold text-[var(--text-dim)] uppercase tracking-widest">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
