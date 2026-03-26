'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import ServiceTerminal, { LogEntry } from '@/components/ServiceTerminal';
import { 
  Activity, 
  Terminal,
  Database, 
  Settings, 
  Power, 
  RotateCcw, 
  ShieldCheck,
  Zap, 
  Wifi, 
  ChevronRight,
  Clock,
  X,
  Play,
  Square,
  AlertCircle,
  CheckCircle,
  Server,
  Layers,
  Search,
  Filter
} from 'lucide-react';

type SystemStatus = 'online' | 'degraded' | 'offline' | 'restarting' | 'stopping';

interface Service {
  id: string;
  name: string;
  status: SystemStatus;
  uptime: number;
  responseTime: number;
  description: string;
  icon: string;
  lastHeartbeat: number;
}

interface ServiceCardProps {
  service: Service;
  onAction: (action: 'start' | 'restart' | 'stop') => void;
  onOpenTerminal: () => void;
  isSelected: boolean;
  getStatusColor: (status: SystemStatus) => string;
  getIcon: (iconName: string, color: string) => React.ReactNode;
}

function ServiceCard({ service, onAction, onOpenTerminal, isSelected, getStatusColor, getIcon }: ServiceCardProps) {
  const statusColor = getStatusColor(service.status);
  const isOffline = service.status === 'offline';

  return (
    <div
      className={`group p-4 rounded-xl transition-all border ${isSelected ? 'border-[var(--accent-gold)] bg-[var(--accent-gold-dim)] shadow-sm' : 'border-[var(--border-subtle)] bg-[var(--card-bg)] hover:shadow-md'} ${isOffline ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-[var(--nested-surface)] border border-[var(--border-subtle)] shadow-sm">
          {getIcon(service.icon, statusColor)}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.55rem] font-black border select-none" 
             style={{ borderColor: `${statusColor}20`, color: statusColor, background: `${statusColor}05` }}>
          <span className={`w-1.5 h-1.5 rounded-full ${['restarting', 'stopping'].includes(service.status) ? 'animate-ping' : ''}`} style={{ background: statusColor }} />
          {service.status.toUpperCase()}
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-xs font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight truncate">{service.name}</h3>
        <p className="text-[var(--text-secondary)] text-[0.65rem] leading-tight opacity-70 line-clamp-2 min-h-[1.3rem]">{service.description}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
        <div className="flex gap-1.5">
          <button 
            title="Terminal"
            onClick={onOpenTerminal}
            className="p-1.5 rounded-md bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--accent-gold)] border border-[var(--border-subtle)] transition-all active:scale-95 outline-none focus:outline-none focus:ring-0"
          >
            <Terminal size={14} />
          </button>
          
          {isOffline ? (
            <button 
              title="Start"
              onClick={() => onAction('start')}
              className="px-2.5 py-1.5 rounded-md bg-[var(--accent-emerald)] text-white text-[0.55rem] font-black tracking-widest active:scale-95 shadow-sm outline-none focus:outline-none focus:ring-0"
            >
              <Play size={10} fill="currentColor" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button 
                title="Restart"
                onClick={() => onAction('restart')}
                disabled={['restarting', 'stopping'].includes(service.status)}
                className="p-1.5 rounded-md bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--accent-lavender)] border border-[var(--border-subtle)] transition-all disabled:opacity-30 active:scale-90 outline-none focus:outline-none focus:ring-0"
              >
                <RotateCcw size={14} />
              </button>
              <button 
                title="Stop"
                onClick={() => onAction('stop')}
                disabled={['restarting', 'stopping', 'offline'].includes(service.status)}
                className="p-1.5 rounded-md bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--accent-crimson)] border border-[var(--border-subtle)] transition-all disabled:opacity-30 active:scale-90 outline-none focus:outline-none focus:ring-0"
              >
                <Square size={14} />
              </button>
            </div>
          )}
        </div>
        
        {!isOffline && (
          <div className="text-right">
            <div className="text-[0.65rem] font-mono font-bold text-[var(--accent-emerald)]">{service.responseTime}ms</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ControlPanelPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mesh' | 'diagnostics'>('mesh');
  const [initializing, setInitializing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchServices = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.status === 'success') {
        setServices(data.data.services);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const fetchApiHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/services/api-health');
      const data = await response.json();
      if (data.status === 'success') {
        setApiEndpoints(data.data.endpoints);
      }
    } catch (error) {
      console.error('Error fetching health:', error);
    }
  }, []);

  const fetchLogs = useCallback(async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/logs`);
      const data = await response.json();
      if (data.status === 'success') {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchServices();
    fetchApiHealth();

    const interval = setInterval(() => {
      fetchServices(true);
      if (activeTab === 'diagnostics') fetchApiHealth();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchServices, fetchApiHealth, activeTab]);

  useEffect(() => {
    if (!isLogModalOpen || !selectedService) return;
    fetchLogs(selectedService);
    const interval = setInterval(() => fetchLogs(selectedService), 3000);
    return () => clearInterval(interval);
  }, [isLogModalOpen, selectedService, fetchLogs]);

  const handleOpenTerminal = (serviceId: string) => {
    setSelectedService(serviceId);
    setIsLogModalOpen(true);
  };

  const handleServiceAction = async (serviceId: string, action: 'start' | 'restart' | 'stop') => {
    try {
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: action === 'stop' ? 'stopping' : 'restarting' } : s
      ));
      const res = await fetch(`/api/services/${serviceId}/${action}`, { method: 'POST' });
      if (res.ok) setTimeout(() => fetchServices(true), 2000);
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
      fetchServices(true);
    }
  };

  const getStatusColor = (status: SystemStatus) => {
    const colors = {
      online: 'var(--accent-emerald)',
      degraded: 'var(--accent-amber)',
      offline: 'var(--text-muted)',
      restarting: 'var(--accent-lavender)',
      stopping: 'var(--accent-crimson)'
    };
    return colors[status as keyof typeof colors] || 'var(--text-dim)';
  };

  const getIcon = (iconName: string, color: string): React.ReactNode => {
    const props = { size: 16, style: { color } };
    switch (iconName) {
      case 'Database': return <Database {...props} />;
      case 'Network': return <Wifi {...props} />;
      case 'Shield': return <ShieldCheck {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Layers': return <Layers {...props} />;
      default: return <Server {...props} />;
    }
  };

  if (!mounted) return null;

  const onlineCount = services.filter(s => s.status === 'online').length;
  const allOffline = services.filter(s => s.id !== 'backend').every(s => s.status === 'offline');

  return (
    <main className="flex-1 flex flex-col bg-[var(--background)] min-h-screen">
      <TopBar title="Control Panel" subtitle="System Orchestration v4.2.1" />

      <div className="flex-1 p-5 space-y-6 max-w-[1600px] mx-auto w-full outline-none">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-[var(--accent-gold-dim)] rounded-xl text-[var(--accent-gold)] shadow-sm">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none mb-1">Infrastructure Control</h1>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[0.65rem] font-bold text-[var(--text-muted)] tracking-widest uppercase opacity-70">Forensic Mesh Active</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {allOffline && (
              <button 
                onClick={() => setInitializing(true)} 
                className="px-4 py-2 bg-[var(--accent-emerald)] text-white text-[0.6rem] font-black rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all outline-none focus:outline-none focus:ring-0"
              >
                INITIALIZE MESH
              </button>
            )}
            <button className="p-2 bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--nested-surface)] transition-all outline-none focus:outline-none focus:ring-0" onClick={() => fetchServices()}>
              <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dense Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Cluster Online', val: `${onlineCount}/${services.length}`, icon: CheckCircle, color: 'emerald' },
            { label: 'System Uptime', val: onlineCount > 1 ? "99.98%" : "0.00%", icon: Activity, color: 'lavender' },
            { label: 'Load Factor', val: onlineCount > 1 ? "2.4M" : "0", icon: Zap, color: 'gold' },
            { label: 'Sec Integrity', val: onlineCount > 0 ? "SECURE" : "BOOTING", icon: ShieldCheck, color: 'emerald' },
          ].map((s, i) => (
            <div key={i} className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border-subtle)] flex items-center gap-4 shadow-sm">
              <div className="p-2.5 rounded-lg bg-[var(--nested-surface)]" style={{ color: `var(--accent-${s.color})` }}>
                <s.icon size={18} />
              </div>
              <div>
                <div className="text-[0.6rem] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-0.5">{s.label}</div>
                <div className="text-sm font-black text-[var(--text-primary)] font-mono">{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[var(--nested-surface)] p-1 rounded-xl w-fit border border-[var(--border-subtle)]">
          <button 
            onClick={() => setActiveTab('mesh')}
            className={`px-6 py-2 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all outline-none focus:outline-none focus:ring-0 ${activeTab === 'mesh' ? 'bg-[var(--card-bg)] text-[var(--accent-gold)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Infrastructure
          </button>
          <button 
            onClick={() => setActiveTab('diagnostics')}
            className={`px-6 py-2 rounded-lg text-[0.6rem] font-black uppercase tracking-widest transition-all outline-none focus:outline-none focus:ring-0 ${activeTab === 'diagnostics' ? 'bg-[var(--card-bg)] text-[var(--accent-gold)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
          >
            Diagnostics
          </button>
        </div>

        {activeTab === 'mesh' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-in fade-in duration-500">
            {services.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onAction={(a) => handleServiceAction(service.id, a)}
                onOpenTerminal={() => handleOpenTerminal(service.id)}
                isSelected={selectedService === service.id}
                getStatusColor={getStatusColor}
                getIcon={getIcon}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 outline-none ring-0">
            <div className="p-4 bg-[var(--nested-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h2 className="text-[0.65rem] font-black text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-[var(--accent-gold)]" />
                Live System Nodes
              </h2>
              <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--background)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                {apiEndpoints.length} ACTIVE ENDPOINTS
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--nested-surface)] text-[0.55rem] text-[var(--text-muted)] uppercase tracking-widest font-black border-b border-[var(--border-subtle)]">
                  <tr>
                    <th className="px-5 py-3">Module Identity</th>
                    <th className="px-5 py-3">Protocol</th>
                    <th className="px-5 py-3">Latency Delta</th>
                    <th className="px-5 py-3 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--card-bg)]">
                   {apiEndpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-[var(--nested-surface)] transition-all font-mono group border-l-2 border-l-transparent hover:border-l-[var(--accent-gold)]">
                      <td className="px-5 py-3">
                        <a 
                          href={`http://localhost:8000${ep.path}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block outline-none focus:outline-none focus:ring-0"
                        >
                          <div className="text-[0.65rem] font-black text-[var(--text-primary)] truncate max-w-[240px] uppercase tracking-tighter group-hover:text-[var(--accent-gold)] transition-colors">{ep.name}</div>
                          <div className="text-[0.55rem] text-[var(--text-muted)] font-bold mt-0.5 opacity-60 truncate max-w-[240px] lowercase">{ep.path}</div>
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[0.55rem] font-black bg-[var(--nested-surface)] text-[var(--accent-lavender)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)] uppercase">{ep.method}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1 bg-[var(--nested-surface)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
                            <div 
                              className={`h-full transition-all duration-1000 ${ep.latency < 50 ? 'bg-[var(--accent-emerald)]' : ep.latency < 200 ? 'bg-[var(--accent-gold)]' : 'bg-[var(--accent-crimson)]'}`}
                              style={{ width: `${Math.min(100, Math.max(10, ep.latency / 2))}%` }}
                            />
                          </div>
                          <span className="text-[0.6rem] text-[var(--text-muted)] font-black uppercase">{ep.latency}ms</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end">
                          <span className={`w-1.5 h-1.5 rounded-full ${ep.status === 'operational' ? 'bg-[var(--accent-emerald)] shadow-[0_0_8px_var(--accent-emerald)]' : 'bg-[var(--accent-crimson)]'}`} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )  }
      </div>

      {/* Compact Terminal Modal - Single Window Implementation */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl h-[75vh] bg-[#05070a] rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col border border-white/10 animate-in zoom-in-95 duration-300">
            <ServiceTerminal 
              serviceId={selectedService || undefined}
              serviceName={selectedService ? (services.find(s => s.id === selectedService)?.name || '') : 'Mesh'} 
              logs={logs} 
              onClose={() => setIsLogModalOpen(false)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
