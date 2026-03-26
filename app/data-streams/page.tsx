'use client';

import * as React from 'react';
import TopBar from '@/components/TopBar';
import StatCard from '@/components/StatCard';
import { useStreamsMetrics } from '@/app/hooks/useStreamsMetrics';
import { 
  Activity, 
  Database, 
  Search, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ExternalLink, 
  FileText, 
  Link as LinkIcon, 
  Zap, 
  Layers, 
  BarChart3,
  RefreshCw,
  Server,
  Filter
} from 'lucide-react';
import { API_BASE_URL, apiGet } from '@/app/lib/api';
import { getSafeExternalUrl } from '@/app/lib/source-links';

type Document = {
  id: string;
  title: string;
  source: string;
  url: string | null;
  published_date: string | null;
  created_at: string | null;
  content_preview: string;
  metadata: any;
};

type TabType = 'infrastructure' | 'intelligence';

export default function CombinedDataStreamsPage() {
  // Streams Data
  const { data: streamData, loading: streamsLoading, error: streamsError } = useStreamsMetrics(5000);
  const [refreshTime, setRefreshTime] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabType>('infrastructure');

  // Documents Data
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Clock effect
  React.useEffect(() => {
    const updateTime = () => setRefreshTime(new Date().toLocaleTimeString('en-US'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await apiGet<any>('/api/data-lake/documents?limit=50');
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('FETCH_DOCUMENTS_ERROR:', err);
      setDocsError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setDocsLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'intelligence' && documents.length === 0) {
      fetchDocuments();
    }
  }, [activeTab]);

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content_preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats Calculations
  const totalLag = streamData.topics.reduce((acc, t) => acc + (t.lag || 0), 0);
  const totalThroughput = streamData.topics.reduce((acc, t) => acc + (t.throughput || 0), 0);

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar 
        title="Data Streams & Intelligence" 
        subtitle="Unified tactical ingestion and data lake ecosystem" 
      />

      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Header Summary Cards - Standardized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Streams"
            value={(streamData.topics.length + streamData.pipelines.length).toString()}
            subValue="Status monitoring"
            icon={Activity}
            bgColor="var(--metric-1)"
            textColor="var(--metric-1-text)"
          />
          <StatCard
            label="Throughput"
            value={`${(totalThroughput / 1000).toFixed(1)}K`}
            subValue="msg/s current"
            icon={Zap}
            bgColor="var(--metric-2)"
            textColor="var(--metric-2-text)"
          />
          <StatCard
            label="System Lag"
            value={totalLag.toLocaleString()}
            subValue="Total message delay"
            icon={Layers}
            bgColor="var(--metric-3)"
            textColor="var(--metric-3-text)"
          />
          <StatCard
            label="Intelligence Lake"
            value={documents.length > 0 ? documents.length.toString() : '---'}
            subValue="Document count"
            icon={Database}
            bgColor="var(--accent-gold-dim)"
            textColor="var(--accent-gold)"
          />
        </div>

        {/* Tab Selection */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex p-1.5 bg-[var(--nested-surface)] backdrop-blur-xl border border-[var(--border-color)] rounded-2xl shadow-inner">
            <button 
              onClick={() => setActiveTab('infrastructure')}
              className={`flex items-center gap-2.5 px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                activeTab === 'infrastructure' 
                  ? 'text-white dark:text-black shadow-[0_4px_12px_rgba(214,185,133,0.3)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--nested-surface-hover)] scale-95'
              }`}
              style={{
                background: activeTab === 'infrastructure' ? 'var(--tactical-gradient-gold)' : 'transparent',
              }}
            >
              <Server size={14} />
              TACTICAL INFRASTRUCTURE
            </button>
            <button 
              onClick={() => setActiveTab('intelligence')}
              className={`flex items-center gap-2.5 px-8 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${
                activeTab === 'intelligence' 
                  ? 'text-white dark:text-black shadow-[0_4px_12px_rgba(214,185,133,0.3)]' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--nested-surface-hover)] scale-95'
              }`}
              style={{
                background: activeTab === 'intelligence' ? 'var(--tactical-gradient-gold)' : 'transparent',
              }}
            >
              <FileText size={14} />
              INTELLIGENCE FEED
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-emerald)]" />
              LIVE UPDATE: {refreshTime}
            </span>
            <button 
              onClick={activeTab === 'intelligence' ? fetchDocuments : () => window.location.reload()}
              className="p-2 bg-[var(--nested-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors shadow-sm"
            >
              <RefreshCw size={14} className={streamsLoading || docsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[60vh]">
          {activeTab === 'infrastructure' ? (
            <div className="space-y-6">
              {/* Streams Section */}
              <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-color)] shadow-2xl">
                <div className="bg-[var(--nested-surface)] px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[var(--accent-gold-dim)] rounded-lg">
                      <BarChart3 size={18} className="text-[var(--accent-gold)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Kafka Streaming Topics</h3>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">REAL-TIME DATA BUS</p>
                    </div>
                  </div>
                  {streamsError && (
                    <span className="text-2xs text-[var(--accent-amber)] bg-[var(--accent-amber)]/5 px-3 py-1 rounded-full border border-[var(--accent-amber)]/10">
                      {streamsError}
                    </span>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[var(--nested-surface)] text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest border-b border-[var(--border-color)]">
                        <th className="px-6 py-4">Topic Path</th>
                        <th className="px-6 py-4 text-center">Nodes</th>
                        <th className="px-6 py-4 text-center">Lag</th>
                        <th className="px-6 py-4">Throughput</th>
                        <th className="px-6 py-4">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {streamData.topics.map((t) => (
                        <tr key={t.topic} className="hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs text-[var(--text-secondary)] group-hover:text-cyan-400 transition-colors">{t.topic}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs text-[var(--text-muted)] font-mono">{t.partitions}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-mono font-bold ${
                              t.lag > 1000 ? 'text-red-400' : t.lag > 500 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {t.lag.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden max-w-[80px]">
                                <div 
                                  className="h-full bg-cyan-500/50 dark:bg-cyan-500/50" 
                                  style={{ width: `${Math.min(100, (t.throughput / 10000) * 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">{(t.throughput / 1000).toFixed(1)}K msg/s</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold tracking-tighter uppercase ${
                              t.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                              t.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              ● {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Flink Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamData.pipelines.map((p) => (
                  <div key={p.name} className="glass-card rounded-xl p-5 border border-[var(--border-color)] hover:border-cyan-500/30 transition-all flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="p-2.5 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                          <Zap size={18} className="text-cyan-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)]">{p.name}</h4>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{p.throughput} @ {p.latency}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.status === 'healthy' ? 'text-[var(--accent-emerald)]' : p.status === 'warning' ? 'text-[var(--accent-amber)]' : 'text-[var(--accent-crimson)]'
                      }`}>
                         {p.status}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-widest">
                        <span>Cluster Health</span>
                        <span>{p.health_score || 98}%</span>
                      </div>
                      <div className="h-1.5 bg-[var(--nested-surface)] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${
                            (p.health_score || 98) > 80 ? 'bg-[var(--accent-emerald)]' : (p.health_score || 98) > 50 ? 'bg-[var(--accent-amber)]' : 'bg-[var(--accent-crimson)]'
                          }`}
                          style={{ width: `${p.health_score || 98}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Filters & Search */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-gold)] transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Filter global intelligence documents, diplomatic reports, news feeds..."
                    className="w-full bg-[var(--nested-surface)] border border-[var(--border-color)] rounded-xl py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]/50 transition-all placeholder:text-[var(--text-dim)] shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-6 py-3 bg-[var(--nested-surface)] border border-[var(--border-color)] rounded-xl text-xs font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-gold)]/30 transition-all shadow-sm">
                    <Filter size={14} />
                    ALL SOURCES
                  </button>
                </div>
              </div>

              {docsError && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                  <ShieldCheck size={16} />
                  System Alert: {docsError} - Sync engine connection interrupted.
                </div>
              )}

              {/* Documents List */}
              <div className="grid grid-cols-1 gap-4">
                {docsLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6 glass-card rounded-2xl border-dashed">
                  <div className="relative">
                    <div className="rounded-full h-10 w-10 border-t-2 border-b-2 border-[#d6b985] relative" />
                  </div>
                    <div className="flex flex-col items-center gap-1">
                      <p className="text-[var(--text-primary)] text-sm font-bold tracking-widest uppercase">Deep Scanning Data Lake</p>
                      <p className="text-[var(--text-muted)] text-2xs font-mono">RETRIEVING ENCRYPTED ASSETS...</p>
                    </div>
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="glass-card p-20 rounded-2xl text-center space-y-4 border-dashed bg-transparent">
                    <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-800">
                      <Database size={32} className="text-slate-700" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-[var(--text-secondary)] font-bold">Zero Intelligence Matches</h3>
                      <p className="text-[var(--text-muted)] text-xs max-w-sm mx-auto font-medium">
                        Your query returned no segments from the classified data lake. Try broadening your filter parameters.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredDocs.map((doc) => {
                    const safeDocUrl = getSafeExternalUrl(doc.url);
                    return (
                    <div key={doc.id} className="glass-card hover:bg-[var(--nested-surface-hover)] hover:border-[var(--accent-gold)]/30 transition-all group rounded-2xl overflow-hidden border border-[var(--border-color)] p-5 flex flex-col gap-4 relative">
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-gold)]" />
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${safeDocUrl?.toLowerCase().endsWith('.pdf') ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                              {safeDocUrl?.toLowerCase().endsWith('.pdf') ? <FileText size={16} /> : <LinkIcon size={16} />}
                            </div>
                            <h3 className="text-[var(--text-primary)] font-bold text-base leading-tight group-hover:text-[#d6b985] transition-colors">
                              {doc.title}
                            </h3>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] pl-11">
                            <span className="flex items-center gap-1.5"><ShieldCheck size={12} className="text-[#d6b985]" /> {doc.source}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> {doc.published_date ? new Date(doc.published_date).toLocaleDateString('en-US') : 'INDETERMINATE'}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {doc.created_at ? new Date(doc.created_at).toLocaleTimeString('en-US') : 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pl-11 md:pl-0">
                          {safeDocUrl && (
                            <a 
                              href={safeDocUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-4 py-2 bg-[var(--nested-surface)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--accent-gold)]/10 hover:border-[var(--accent-gold)]/30 transition-all text-[var(--text-muted)] hover:text-[var(--accent-gold)] flex items-center gap-2 text-[10px] font-bold"
                            >
                              SOURCE INTEL
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="pl-11 pr-2">
                        <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed italic font-serif opacity-80 group-hover:opacity-100 transition-opacity line-clamp-2">
                          "{doc.content_preview}"
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1 pl-11">
                        <span className="px-2.5 py-1 rounded-md text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-muted)] font-black tracking-widest uppercase group-hover:border-[var(--accent-gold)] transition-colors">RANK: CLASSIFIED_S1</span>
                        <span className="px-2.5 py-1 rounded-md text-[9px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-black tracking-widest uppercase">VECTORIZED</span>
                        <span className="px-2.5 py-1 rounded-md text-[9px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black tracking-widest uppercase">KG_LINKED</span>
                        <span className="px-2.5 py-1 rounded-md text-[9px] bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 text-[var(--accent-gold)] font-black tracking-widest uppercase">SYD_READY</span>
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
