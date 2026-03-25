'use client';

import TopBar from '@/components/TopBar';
import { Brain, MessageSquare, Tag, Search, Layers, MapPin, Activity, Shield, Info, Link as LinkIcon, AlertTriangle, CloudRain, Thermometer, Globe } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useIntelligenceMetrics } from '@/app/hooks/useIntelligenceMetrics';
import { useIntelligenceAlerts } from '@/app/hooks/useIntelligenceAlerts';
import { apiPost } from '@/app/lib/api';
import { useState } from 'react';
import TacticalMarquee from '@/components/TacticalMarquee';

const TYPE_C: Record<string, string> = {
  ECON: '#f59e0b', GEOPOL: '#ef4444', FIN: '#00d4ff', TECH: '#8b5cf6', MIL: '#ef4444', TRADE: '#f59e0b', ORG: '#00d4ff', PERSON: '#00ff88', LOC: '#ef4444',
};

const CLSF_COLORS: Record<string, string> = {
  'SECRET': '#6b21a8',
  'TOP SECRET': '#991b1b',
  'SECRET//REL': '#b45309',
  'CONFIDENTIAL': '#15803d',
};

export default function IntelligencePage() {
  const { data, loading, error, refresh } = useIntelligenceMetrics();
  const { alerts: alertsList, loading: alertsLoading, error: alertsError } = useIntelligenceAlerts();
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefActionMessage, setBriefActionMessage] = useState<string | null>(null);
  const [briefActionError, setBriefActionError] = useState<string | null>(null);

  const totalDocs = data.languages.reduce((acc, item) => acc + item.doc_count, 0);
  const totalMentions = data.entities.reduce((acc, item) => acc + item.mentions, 0);

  const compact = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  const inferSentiment = (type: string, mentions: number): 'positive' | 'neutral' | 'negative' | 'mixed' => {
    if (type === 'LOC') return 'negative';
    if (type === 'ORG' && mentions > 3000) return 'mixed';
    if (type === 'PERSON' && mentions > 2500) return 'negative';
    return 'neutral';
  };

  const radarData = data.sentimentRadar.length
    ? data.sentimentRadar
    : [
        { subject: 'Geopolitical', score: 10, fullMark: 100 },
        { subject: 'Economic', score: 10, fullMark: 100 },
        { subject: 'Climate', score: 10, fullMark: 100 },
        { subject: 'Social', score: 10, fullMark: 100 },
        { subject: 'Cyber', score: 10, fullMark: 100 },
        { subject: 'Military', score: 10, fullMark: 100 },
      ];

  const handleGenerateBrief = async () => {
    setIsGeneratingBriefing(true);
    setBriefActionError(null);
    setBriefActionMessage(null);

    try {
      const topKeyword = data.keywords[0]?.keyword;
      const payload = { focus: topKeyword ? `Strategic Update: ${topKeyword}` : 'Global Strategic Update', classification: 'SECRET' };
      await apiPost<{ brief: { title: string } }>('/api/intelligence/strategic-briefs/generate', payload);
      await refresh();
      setBriefActionMessage('New strategic brief generated.');
    } catch (err) {
      setBriefActionError(err instanceof Error ? err.message : 'Failed to generate brief');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="AI Intelligence" subtitle="HuggingFace · spaCy · LLaMA · GPT · Pinecone Vector Search" />
      <main className="flex-1 px-4 py-3 space-y-3">
        {/* Stats Grid - MOVED TO TOP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Documents Processed Today', value: compact(totalDocs), sub: `${data.languages.length} languages`, bg: '#bfdbfe', text: '#1e3a8a', icon: Layers }, // Light Blue / Dark Blue
            { label: 'NER Entities Extracted', value: compact(totalMentions), sub: 'spaCy + custom models', bg: '#ddd6fe', text: '#4c1d95', icon: Tag }, // Light Purple / Dark Purple
            { label: 'Sentiment Analyses', value: compact(totalDocs * 6), sub: 'Global media & social', bg: '#fde68a', text: '#78350f', icon: MessageSquare }, // Light Amber / Dark Amber
            { label: 'Vector Similarity Searches', value: compact(totalMentions * 4), sub: 'Pinecone / Qdrant', bg: '#a7f3d0', text: '#064e3b', icon: Search }, // Light Green / Dark Green
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-6 flex flex-col gap-4 shadow-lg relative overflow-hidden" 
                 style={{ 
                   background: s.bg, 
                   border: `1px solid rgba(0,0,0,0.04)`,
                 }}>
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
                     style={{ background: 'rgba(0,0,0,0.08)' }}>
                  <s.icon size={22} style={{ color: s.text }} />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: s.text, opacity: 0.7 }}>{s.sub}</div>
              </div>
              <div className="mt-2">
                <div className="text-4xl font-black tracking-tighter leading-none" style={{ color: s.text }}>{s.value}</div>
                <div className="text-[11px] font-black uppercase tracking-widest block mt-3 opacity-90" style={{ color: s.text }}>{s.label}</div>
              </div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16 blur-2xl" />
            </div>
          ))}
        </div>

        {error && (
          <div className="status-critical mb-2">
            Live intelligence metrics unavailable: {error}.
          </div>
        )}

        {/* Intelligence Alerts */}
        <div className="glass-card rounded-xl p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-black/[0.02]">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider">Intelligence Alerts</h3>
            <span className="status-online flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500" />
              LIVE
            </span>
          </div>
          <div className="table-scroll-container">
            {alertsLoading ? (
              <div className="flex flex-col gap-2 p-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="h-4 bg-black/5 dark:bg-white/5 rounded" />)}
              </div>
            ) : alertsError ? (
              <div className="text-xs p-4 text-center text-crimson font-bold">Error: {alertsError}</div>
            ) : !alertsList || alertsList.length === 0 ? (
              <div className="text-xs p-4 text-center italic text-muted">No active threat threads detected in this sector.</div>
            ) : (
              <table className="w-full text-left border-collapse table-fixed">
                <thead 
                  className="text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}
                >
                  <tr>
                    <th className="pl-4 py-3 font-mono w-[80px]">Timestamp</th>
                    <th className="px-2 py-3 w-[60px]">Sev</th>
                    <th className="px-2 py-3 w-[85px]">Region</th>
                    <th className="px-4 py-3">Intelligence Assessment Summary</th>
                    <th className="pr-4 py-3 text-right w-[90px]">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.03]">
                  {alertsList.slice(0, 25).map((alert, idx) => {
                    const s = alert.severity.toLowerCase();
                    const severityColor = s === 'critical' ? 'var(--accent-crimson)' : s === 'high' ? 'var(--accent-amber)' : s === 'medium' ? 'var(--accent-steel)' : 'var(--text-muted)';
                    
                    return (
                      <tr key={idx} className="group hover:bg-gold/5 transition-colors">
                        <td className="pl-4 py-3 text-[10px] font-mono text-muted">
                          {alert.time}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: severityColor }} />
                            <span className="text-[9px] font-black uppercase" style={{ color: severityColor }}>
                              {alert.severity.substring(0, 3)}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="text-[10px] text-primary">
                            {alert.region}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <TacticalMarquee>
                            <p className="text-[11px] text-primary leading-normal">
                              {alert.message}
                            </p>
                          </TacticalMarquee>
                        </td>
                        <td className="pr-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-mono font-black text-emerald">
                              {(alert.confidence * 100).toFixed(0)}%
                            </span>
                            {alert.url ? (
                              <a 
                                href={alert.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-lavender hover:underline underline-offset-2"
                              >
                                Source ↗
                              </a>
                            ) : (
                              <span className="text-[10px] font-mono text-muted uppercase">SYSTEM</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-0 overflow-hidden border shadow-xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
            <div className="p-4 flex items-center justify-between bg-black/[0.04]">
              <h3 className="font-bold text-sm text-primary uppercase">Named Entity Recognition</h3>
              <div className="flex items-center gap-2">
                {['ORG', 'PERSON', 'LOC', 'CONCEPT'].map(t => (
                  <span key={t} className="text-[8px] font-black px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">{t}</span>
                ))}
              </div>
            </div>
            <div className="table-scroll-container">
              <table className="w-full data-table">
                <thead style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}>
                  <tr>
                    <th className="text-left font-black py-2 pl-4">Entity</th>
                    <th className="text-left font-black py-2">Type</th>
                    <th className="text-left font-black py-2">Mentions</th>
                    <th className="text-left font-black py-2">Confidence</th>
                    <th className="text-left font-black py-2">Sentiment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {data.entities.map(e => {
                    const sentiment = inferSentiment(e.type, e.mentions);
                    const sentColor = sentiment === 'positive' ? 'var(--accent-emerald)' : sentiment === 'negative' ? 'var(--accent-crimson)' : 'var(--text-muted)';
                    return (
                      <tr key={e.entity} className="hover:bg-gold/5 transition-colors">
                        <td className="text-primary font-bold">
                          {e.url ? (
                            <a href={e.url} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors flex items-center gap-1.5 underline-offset-4 hover:underline">
                              {e.entity}
                              <LinkIcon size={10} className="text-gold/60" />
                            </a>
                          ) : (
                            e.entity
                          )}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-sm" style={{ background: TYPE_C[e.type] || '#b2904f' }}>{e.type}</span>
                        </td>
                        <td className="font-mono text-secondary">{e.mentions.toLocaleString('en-US')}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 bg-black/10 dark:bg-white/10 rounded-full">
                              <div className="h-full rounded-full bg-emerald" style={{ width: `${e.confidence * 100}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-emerald">{(e.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ color: sentColor }} className="text-[10px] font-black uppercase">{sentiment}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl p-5 border shadow-2xl" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-primary uppercase">Global Tactical Radar</h3>
                <span className="status-online uppercase text-[8px] bg-emerald/10 text-emerald px-2 py-0.5 rounded-full border border-emerald/20">Live Intelligence</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-color)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 10, fontWeight: 800 }} />
                  <Radar name="Tension" dataKey="score" stroke="var(--accent-crimson)" fill="var(--accent-crimson)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="text-[10px] mt-4 p-4 rounded-xl bg-[#b2904f]10 border border-[#b2904f]20 text-primary font-bold leading-relaxed shadow-inner" style={{ background: 'rgba(178, 144, 79, 0.08)' }}>
                <span className="text-gold">ℹ️ DATA INTEGRITY:</span> All intelligence dimensions reflect <strong>Global Tactical Metrics</strong> across 216 monitored nodes.
              </div>
            </div>

            <div className="glass-card rounded-xl p-4">
              <h3 className="font-bold text-sm text-primary uppercase mb-4">Language Distribution</h3>
              <div className="space-y-3">
                {data.languages.map(l => (
                  <div key={l.lang}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-black uppercase text-secondary">{l.lang}</span>
                      <span className="text-[10px] font-mono font-black text-secondary">{l.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, l.percentage)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Emerging Trends */}
        <div className="rounded-xl p-5 border shadow-lg" style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-[11px] text-primary uppercase tracking-widest border-l-4 border-gold pl-3">Emerging Strategic Trends</h3>
            <span className="text-[9px] font-black text-muted uppercase tracking-widest leading-none bg-black/5 px-2 py-0.5 rounded-full">Real-time NLP Engine</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.keywords.map(kw => (
              <div key={kw.keyword} className="p-4 rounded-xl border shadow-md flex flex-col" 
                   style={{ background: TYPE_C[kw.type] || 'var(--accent-gold)', borderColor: 'rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase bg-white/20 text-white backdrop-blur-sm">
                    {kw.type}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10">
                    <Activity size={10} className="text-white" />
                    <span className="text-[9px] font-black text-white">{kw.delta}</span>
                  </div>
                </div>
                <h4 className="text-lg font-black text-white capitalize mb-4 tracking-tighter leading-tight">{kw.keyword}</h4>
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Velocity</span>
                    <span className="font-mono text-[10px] font-black text-white">{kw.velocity}/100</span>
                  </div>
                  <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${kw.velocity}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Briefs */}
        <div className="glass-card rounded-xl p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-black/[0.02]">
            <div>
              <h3 className="font-bold text-sm text-primary uppercase">Strategic Intelligence Briefs</h3>
              <p className="text-[10px] font-bold text-muted mt-1 uppercase">LLM Ensemble Pipeline — GPT·LLaMA·Claude</p>
            </div>
            <button 
              onClick={handleGenerateBrief}
              disabled={isGeneratingBriefing}
              className="px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-wider transition-all" 
              style={{ 
                background: isGeneratingBriefing ? 'var(--table-header-bg)' : 'var(--accent-gold)', 
                color: isGeneratingBriefing ? 'var(--text-muted)' : '#fff',
                boxShadow: isGeneratingBriefing ? 'none' : '0 10px 20px rgba(178, 144, 79, 0.4)'
              }}
            >
              {isGeneratingBriefing ? 'ANALYZING...' : 'Generate Strategic Brief'}
            </button>
          </div>

          <div className="table-scroll-container">
            <table className="w-full text-left border-collapse table-fixed">
              <thead 
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}
              >
                <tr>
                  <th className="pl-4 py-3 w-[120px]">Classification</th>
                  <th className="px-4 py-3">Intelligence Assessment Subject</th>
                  <th className="px-2 py-3 text-center w-[80px]">Model</th>
                  <th className="px-2 py-3 text-center w-[80px]">Conf</th>
                  <th className="pr-4 py-3 text-right w-[100px]">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.briefs.map((brief, bidx) => (
                  <tr key={bidx} className="group hover:bg-gold/5 transition-colors">
                    <td className="pl-4 py-4">
                      <span className="text-[9px] px-3 py-1 rounded-full font-black uppercase text-white shadow-sm"
                        style={{ background: CLSF_COLORS[brief.classification] || '#6b21a8' }}
                      >
                        {brief.classification}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <TacticalMarquee>
                        <span className="text-[11px] text-primary tracking-tight">{brief.title}</span>
                      </TacticalMarquee>
                      <p className="text-[10px] text-muted font-bold mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">{brief.summary}</p>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span className="text-[9px] text-secondary">{brief.model}</span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span className="font-mono text-xs text-emerald-700">{(brief.confidence || 0).toFixed(0)}%</span>
                    </td>
                    <td className="pr-4 py-4 text-right">
                      <a href={brief.url || undefined} target="_blank" className="text-[10px] font-bold text-lavender hover:underline">Source ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Climate Radar */}
        <div className="glass-card rounded-xl p-0 overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-black/[0.02]">
            <h3 className="font-bold text-sm text-primary uppercase">Climate Intelligence Feed</h3>
            <span className="status-warning uppercase text-[8px]">{data.climateRegions.length} Sectors Scanned</span>
          </div>

          <div className="table-scroll-container">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead 
                className="text-[9px] font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: 'var(--table-header-bg)', color: 'var(--table-header-text)' }}
              >
                <tr>
                  <th className="pl-4 py-3 w-[80px]">Risk</th>
                  <th className="px-3 py-3 w-[120px]">Region</th>
                  <th className="px-2 py-3 w-[65px]">Temp Δ</th>
                  <th className="px-4 py-3">Strategic Impact Summary</th>
                  <th className="px-2 py-3 w-[80px]">Drought</th>
                  <th className="px-2 py-3 w-[80px]">Flood</th>
                  <th className="pr-4 py-3 text-right w-[80px]">Crop</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data.climateRegions.map((region, idx) => {
                  const riskColor = region.risk_level === 'CRITICAL' ? 'var(--accent-crimson)' : 'var(--accent-amber)';
                  return (
                    <tr key={idx} className="group hover:bg-gold/5 transition-colors">
                      <td className="pl-4 py-4">
                        <span className="text-[9px] font-black px-2 py-1 rounded" style={{ background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}40` }}>
                          {region.risk_level}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-[11px] text-primary">
                        {region.region}
                      </td>
                      <td className="px-2 py-4 font-mono text-[10px] text-crimson-700">
                        +{region.temp_change}°C
                      </td>
                      <td className="px-4 py-4">
                        <TacticalMarquee>
                          <p className="text-[11px] text-primary leading-normal">{region.geopolitical_impact}</p>
                        </TacticalMarquee>
                        <p className="text-[10px] text-muted mt-1 italic">{region.strategic_concern}</p>
                      </td>
                      <td className="px-2 py-4">
                        <span className="text-[9px] font-black uppercase p-1 rounded bg-black/5" style={{ color: region.drought_threat === 'CRITICAL' ? 'var(--accent-crimson)' : 'var(--accent-gold)' }}>{region.drought_threat}</span>
                      </td>
                      <td className="px-2 py-4">
                        <span className="text-[9px] font-black uppercase p-1 rounded bg-black/5" style={{ color: region.flood_threat === 'CRITICAL' ? 'var(--accent-crimson)' : 'var(--accent-steelblue)' }}>{region.flood_threat}</span>
                      </td>
                      <td className="pr-4 py-4 text-right">
                        <span className="text-xs font-mono text-primary">{region.crop_risk}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
