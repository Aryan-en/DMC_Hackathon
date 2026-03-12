'use client';

import TopBar from '@/components/TopBar';
import { Brain, MessageSquare, Eye, Tag, Search, Cpu, Layers, BarChart2, Globe2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const ENTITY_EXTRACTION = [
  { entity: 'United States Federal Reserve', type: 'ORG', confidence: 0.97, mentions: 1847, sentiment: 'neutral' },
  { entity: 'Xi Jinping', type: 'PERSON', confidence: 0.99, mentions: 3241, sentiment: 'negative' },
  { entity: 'Taiwan Strait', type: 'LOC', confidence: 0.98, mentions: 2108, sentiment: 'negative' },
  { entity: 'NATO', type: 'ORG', confidence: 0.98, mentions: 4512, sentiment: 'mixed' },
  { entity: 'BRICS Alliance', type: 'ORG', confidence: 0.96, mentions: 1624, sentiment: 'neutral' },
  { entity: 'Federal Interest Rate', type: 'CONCEPT', confidence: 0.94, mentions: 5847, sentiment: 'negative' },
  { entity: 'Volodymyr Zelensky', type: 'PERSON', confidence: 0.99, mentions: 2893, sentiment: 'positive' },
  { entity: 'South China Sea', type: 'LOC', confidence: 0.97, mentions: 1931, sentiment: 'negative' },
];

const SENTIMENT_RADAR = [
  { subject: 'Geopolitical', score: 72, fullMark: 100 },
  { subject: 'Economic', score: 58, fullMark: 100 },
  { subject: 'Climate', score: 81, fullMark: 100 },
  { subject: 'Social', score: 45, fullMark: 100 },
  { subject: 'Cyber', score: 69, fullMark: 100 },
  { subject: 'Military', score: 88, fullMark: 100 },
];

const LANGUAGE_DATA = [
  { lang: 'English', docs: 42, color: '#00d4ff' },
  { lang: 'Arabic', docs: 18, color: '#f59e0b' },
  { lang: 'Chinese', docs: 15, color: '#ef4444' },
  { lang: 'Russian', docs: 9, color: '#8b5cf6' },
  { lang: 'French', docs: 7, color: '#00ff88' },
  { lang: 'Spanish', docs: 5, color: '#64748b' },
  { lang: 'Other', docs: 4, color: '#475569' },
];

const TREND_KEYWORDS = [
  { keyword: 'semiconductor shortage', velocity: 94, delta: '+47%', type: 'ECON' },
  { keyword: 'Taiwan independence', velocity: 88, delta: '+31%', type: 'GEOPOL' },
  { keyword: 'central bank digital currency', velocity: 76, delta: '+22%', type: 'FIN' },
  { keyword: 'AI governance regulation', velocity: 71, delta: '+68%', type: 'TECH' },
  { keyword: 'Arctic militarization', velocity: 65, delta: '+19%', type: 'MIL' },
  { keyword: 'food price inflation', velocity: 82, delta: '+28%', type: 'ECON' },
  { keyword: 'rare earth embargo', velocity: 79, delta: '+41%', type: 'TRADE' },
  { keyword: 'nuclear deterrence', velocity: 68, delta: '+15%', type: 'MIL' },
];

const TYPE_C: Record<string, string> = {
  ECON: '#f59e0b', GEOPOL: '#ef4444', FIN: '#00d4ff', TECH: '#8b5cf6', MIL: '#ef4444', TRADE: '#f59e0b',
};

const customTooltipStyle = {
  backgroundColor: '#0d1e35',
  border: '1px solid #1e3a5f',
  borderRadius: '8px',
  padding: '10px 14px',
};

const BRIEFS = [
  {
    title: 'Escalating Semiconductor Geopolitics',
    summary: 'AI analysis of 14,200 documents reveals a 31% increase in diplomatic tension signals between US-allied nations and China regarding advanced chip export controls. Confidence: 89%. Recommended action: Monitor TSMC supply chain dependencies.',
    classification: 'SECRET',
    model: 'GPT-4o',
    confidence: 89,
    dateGen: '2026-03-12 09:31 UTC',
  },
  {
    title: 'MENA Conflict Probability Assessment',
    summary: 'Cross-correlation of satellite data, social media sentiment (-40% negative shift), and economic indicators suggests 74% probability of increased military activity near Strait of Hormuz within 30 days. Three nation-state actors show elevated readiness signals.',
    classification: 'TOP SECRET',
    model: 'LLaMA-3-70B',
    confidence: 74,
    dateGen: '2026-03-12 08:47 UTC',
  },
  {
    title: 'Global Food Security — Q2 2026 Forecast',
    summary: 'Prophet time-series model combining climate index, trade route disruption, and currency valuations forecasts a 12.4% increase in food commodity prices. Sub-Saharan Africa and South Asia face elevated malnutrition vectors.',
    classification: 'SECRET//REL',
    model: 'Mistral-8x7B',
    confidence: 91,
    dateGen: '2026-03-12 07:15 UTC',
  },
];

const CLSF_COLORS: Record<string, string> = {
  'SECRET': '#f59e0b',
  'TOP SECRET': '#ef4444',
  'SECRET//REL': '#8b5cf6',
};

export default function IntelligencePage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="AI Intelligence" subtitle="HuggingFace · spaCy · LLaMA · GPT · Pinecone Vector Search" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Documents Processed Today', value: '847K', sub: '14 languages', color: '#00d4ff', icon: Layers },
            { label: 'NER Entities Extracted', value: '2.3M', sub: 'spaCy + custom models', color: '#8b5cf6', icon: Tag },
            { label: 'Sentiment Analyses', value: '5.1M', sub: 'Global media & social', color: '#f59e0b', icon: MessageSquare },
            { label: 'Vector Similarity Searches', value: '18.4M', sub: 'Pinecone / Qdrant', color: '#00ff88', icon: Search },
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

        <div className="grid grid-cols-3 gap-6">
          {/* Entity extraction table */}
          <div className="col-span-2 glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Named Entity Recognition — Top Entities</h3>
              <div className="flex items-center gap-2">
                {['ORG', 'PERSON', 'LOC', 'CONCEPT'].map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(30,58,95,0.5)', color: '#64748b', fontSize: '0.65rem' }}>{t}</span>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">Entity</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Mentions</th>
                    <th className="text-left">Confidence</th>
                    <th className="text-left">Sentiment</th>
                  </tr>
                </thead>
                <tbody>
                  {ENTITY_EXTRACTION.map(e => {
                    const sentColor = e.sentiment === 'positive' ? '#00ff88' : e.sentiment === 'negative' ? '#ef4444' : '#64748b';
                    return (
                      <tr key={e.entity}>
                        <td style={{ color: '#e2e8f0' }}>{e.entity}</td>
                        <td>
                          <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                            style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', fontSize: '0.65rem' }}
                          >{e.type}</span>
                        </td>
                        <td className="font-mono" style={{ color: '#94a3b8' }}>{e.mentions.toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                              <div className="h-full rounded-full" style={{ width: `${e.confidence * 100}%`, background: '#00ff88', opacity: 0.7 }} />
                            </div>
                            <span className="font-mono text-xs" style={{ color: '#00ff88', fontSize: '0.68rem' }}>{(e.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td style={{ color: sentColor, fontSize: '0.72rem', textTransform: 'capitalize' }}>{e.sentiment}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sentiment radar + language distribution */}
          <div className="space-y-5">
            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-2" style={{ color: '#e2e8f0' }}>Global Tension Radar</h3>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={SENTIMENT_RADAR}>
                  <PolarGrid stroke="#1e3a5f" strokeOpacity={0.6} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10 }} />
                  <Radar name="Tension" dataKey="score" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#e2e8f0' }}>Doc Language Distribution</h3>
              <div className="space-y-2">
                {LANGUAGE_DATA.map(l => (
                  <div key={l.lang}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-xs" style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{l.lang}</span>
                      <span className="text-xs font-mono" style={{ color: l.color, fontSize: '0.68rem' }}>{l.docs}%</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                      <div className="h-full rounded-full" style={{ width: `${l.docs}%`, background: l.color, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trend keywords */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Emerging Trend Detection — Real-time NLP</h3>
            <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff60', fontSize: '0.65rem' }}>
              Updated 2 min ago
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {TREND_KEYWORDS.map(kw => (
              <div key={kw.keyword} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.6)', border: '1px solid rgba(30,58,95,0.5)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: `${TYPE_C[kw.type]}15`, color: TYPE_C[kw.type], fontSize: '0.6rem' }}>{kw.type}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: '#00ff88', fontSize: '0.65rem' }}>{kw.delta}</span>
                </div>
                <p className="text-xs font-medium mb-2" style={{ color: '#94a3b8', fontSize: '0.7rem', lineHeight: 1.4 }}>{kw.keyword}</p>
                <div className="h-1 rounded-full" style={{ background: 'rgba(30,58,95,0.5)' }}>
                  <div className="h-full rounded-full" style={{ width: `${kw.velocity}%`, background: TYPE_C[kw.type], opacity: 0.7 }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs" style={{ color: '#334155', fontSize: '0.6rem' }}>velocity</span>
                  <span className="text-xs font-mono" style={{ color: '#64748b', fontSize: '0.6rem' }}>{kw.velocity}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI-generated strategic briefs */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>AI-Generated Strategic Briefs</h3>
              <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Generated by LLM ensemble — GPT-4o · LLaMA-3 · Mistral</p>
            </div>
            <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}>
              <Brain size={13} />
              Generate New Brief
            </button>
          </div>
          <div className="space-y-4">
            {BRIEFS.map((brief, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(2,8,23,0.6)', border: '1px solid rgba(30,58,95,0.5)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded font-bold"
                      style={{ background: `${CLSF_COLORS[brief.classification]}15`, border: `1px solid ${CLSF_COLORS[brief.classification]}30`, color: CLSF_COLORS[brief.classification], fontSize: '0.62rem' }}
                    >
                      {brief.classification}
                    </span>
                    <h4 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{brief.title}</h4>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs font-mono" style={{ color: '#334155', fontSize: '0.65rem' }}>{brief.dateGen}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontSize: '0.65rem' }}>{brief.model}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs" style={{ color: '#64748b', fontSize: '0.65rem' }}>Conf:</span>
                      <span className="font-mono text-xs font-bold" style={{ color: brief.confidence > 85 ? '#00ff88' : '#f59e0b' }}>{brief.confidence}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#64748b', lineHeight: 1.7 }}>{brief.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Model pipeline status */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>NLP/AI Model Pipeline Status</h3>
          <div className="grid grid-cols-5 gap-3">
            {[
              { name: 'spaCy NER', version: 'v3.7.2', status: 'RUNNING', infer: '12K/min', gpu: 'A100×4' },
              { name: 'LLaMA-3 70B', version: 'Q4_K_M', status: 'RUNNING', infer: '180/min', gpu: 'H100×8' },
              { name: 'Mistral 8×7B', version: 'MoE', status: 'RUNNING', infer: '310/min', gpu: 'H100×4' },
              { name: 'Sentence-BERT', version: 'mpnet-v2', status: 'RUNNING', infer: '8K/min', gpu: 'A100×2' },
              { name: 'Whisper-Large', version: 'v3', status: 'IDLE', infer: '0/min', gpu: 'A100×2' },
            ].map(m => (
              <div key={m.name} className="p-3 rounded-xl" style={{ background: 'rgba(2,8,23,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: m.status === 'RUNNING' ? '#00ff88' : '#475569' }} />
                  <span className="text-xs font-bold" style={{ color: m.status === 'RUNNING' ? '#00ff88' : '#475569', fontSize: '0.62rem' }}>{m.status}</span>
                </div>
                <div className="font-semibold text-xs mb-1" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{m.name}</div>
                <div className="text-xs mb-2" style={{ color: '#334155', fontSize: '0.65rem' }}>{m.version}</div>
                <div className="text-xs font-mono font-bold" style={{ color: '#00d4ff', fontSize: '0.68rem' }}>{m.infer}</div>
                <div className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>{m.gpu}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
