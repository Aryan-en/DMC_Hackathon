'use client';

import TopBar from '@/components/TopBar';
import MultiLayerGeoHeatmap from '@/components/app/MultiLayerGeoHeatmap';
import { 
  Upload, AlertCircle, TrendingUp, TrendingDown, Sparkles, Gauge, 
  ShieldCheck, Flag, Lightbulb, Target, BookOpen, Scale, Leaf, History, FileText
} from 'lucide-react';
import OntoraLogo from '@/components/OntoraLogo';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/app/lib/api';
import { useGeospatialMetrics } from '@/app/hooks/useGeospatialMetrics';

interface BillAnalysis {
  bill_title: string;
  country: string;
  bill_summary: string;
  pros: string[];
  cons: string[];
  national_impact: {
    gdp_impact: number;
    employment_impact: number;
    inflation_impact: number;
    sector_effects: { sector: string; impact: number }[];
  };
  global_impact: {
    trade_relations: string[];
    geopolitical_influence: number;
    affected_regions: string[];
  };
  risk_assessment: {
    risk_level: string;
    probability: number;
    mitigation_strategies: string[];
  };
  implementation_timeline: { phase: string; duration: string; milestones: string[] }[];
  stakeholder_analysis: { stakeholder: string; sentiment: string; influence: number }[];
  comparative_analysis: { country: string; similar_bill: string; outcome: string }[];
  india_impact?: {
    regional_signal_strength: number;
    india_mentions: number;
    south_asia_mentions: number;
    inflation_pressure: number;
    employment_momentum: number;
    readiness_score: number;
    opportunity_index: number;
  };
  recommendations?: {
    title: string;
    detail: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  policy_brief?: {
    executive_summary: string;
    core_metrics: {
      gdp_impact: number;
      employment_impact: number;
      inflation_impact: number;
      risk_level: string;
      risk_probability: number;
      geopolitical_influence: number;
      india_readiness: number;
    };
    top_recommendations: string[];
    next_90_days: string[];
  };
  esg_impact?: {
    esg_score: number;
    environmental: string;
    social: string;
    governance: string;
    sustainability_metrics: string[];
  };
  compliance_burden?: {
    complexity_score: number;
    estimated_cost_level: string;
    burdensome_provisions: string[];
    required_resources: string[];
  };
  legal_precedents?: {
    precedents: { act_name: string; outcome: string; relevance: string }[];
    legal_challenges_risk: string;
  };
  analysis_provider?: string;
  analysis_model?: string;
  provider?: string;
}

interface AnalysisHistory {
  id: string;
  bill_title: string;
  country: string;
  analyzed_at: string;
  status: string;
  pages: number;
  provider: string;
  model: string;
}

interface AnalyzerStatus {
  analysis_enabled: boolean;
  provider: string;
  model: string;
  gemini_enabled: boolean;
  grok_enabled: boolean;
}

export default function BillAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [analyzerStatus, setAnalyzerStatus] = useState<AnalyzerStatus | null>(null);
  const [analysisProvider, setAnalysisProvider] = useState<string>('N/A');
  const [analysisModel, setAnalysisModel] = useState<string>('N/A');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const { data: geospatialData, loading: heatmapLoading, error: heatmapError } = useGeospatialMetrics();
  
  const fetchHistory = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/bill-analysis/history?limit=10`);
      const payload = await resp.json();
      if (payload.data?.history) {
        setHistory(payload.data.history);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-scroll logs to bottom when they update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/bill-analysis/status`, { cache: 'no-store' });
        const payload = await response.json();
        const status = payload?.data as AnalyzerStatus | undefined;
        if (status) {
          setAnalyzerStatus(status);
          setAnalysisProvider(status.provider?.toUpperCase() || 'N/A');
          setAnalysisModel(status.model || 'N/A');
        }
      } catch {
        // Non-blocking status check.
      }
    };
    loadStatus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF file');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setProgress(0);
    setLogs([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await fetch(`${API_BASE_URL}/api/bill-analysis/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error?.message || 'Analysis failed');
      }
      
      const response = await result.json();
      
      // Update progress and logs if available
      if (response.progress !== undefined) {
        setProgress(response.progress);
      }
      if (response.logs && Array.isArray(response.logs)) {
        setLogs(response.logs);
      }
      
      if (response.data) {
        const data = response.data as BillAnalysis;
        setAnalysis(data);
        setAnalysisProvider((data.provider || data.analysis_provider || analyzerStatus?.provider || 'N/A').toUpperCase());
        setAnalysisModel(data.analysis_model || analyzerStatus?.model || 'N/A');
        setProgress(100);
        setLogs(prev => [...prev, '✓ Analysis completed successfully']);
        fetchHistory(); // Refresh history
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      setLogs(prev => [...prev, `✗ Error: ${errorMsg}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = (item: AnalysisHistory) => {
    // In a real app we'd fetch the full analysis_data by ID.
    // Since we already have the history object, let's assume we need to fetch full detail.
    const loadDetail = async () => {
      try {
        setLoading(true);
        // We'll simulate fetching full detail if not fully in history payload
        // Actually, let's just use what we have or add a detail endpoint if needed.
        // For now, let's assume we need to fetch.
        const resp = await fetch(`${API_BASE_URL}/api/bill-analysis/history/${item.id}`);
        const payload = await resp.json();
        if (payload.data) {
          setAnalysis(payload.data.analysis_data);
          setAnalysisProvider(payload.data.provider?.toUpperCase() || 'N/A');
          setAnalysisModel(payload.data.model_used || 'N/A');
          setLogs(['✓ Historical analysis restored from archive']);
          setProgress(100);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        setError('Failed to load archived analysis');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  };

  const handleExportPolicyBrief = () => {
    window.print();
  };

  const sectorChartData = analysis?.national_impact.sector_effects || [];
  
  const impactRadarData = [
    { subject: 'GDP Impact', value: Math.abs((analysis?.national_impact.gdp_impact || 0) * 10), fullMark: 100 },
    { subject: 'Employment', value: Math.abs((analysis?.national_impact.employment_impact || 0) * 10), fullMark: 100 },
    { subject: 'Inflation', value: Math.abs((analysis?.national_impact.inflation_impact || 0) * 10), fullMark: 100 },
    { subject: 'Geopolitical', value: (analysis?.global_impact.geopolitical_influence || 0) * 100, fullMark: 100 },
    { subject: 'Risk Level', value: (analysis?.risk_assessment.probability || 0) * 100, fullMark: 100 },
  ];

  const stakeholderData = (analysis?.stakeholder_analysis || []).map(s => ({
    ...s,
    influence: s.influence * 100,
  }));

  const prosConsData = [
    { name: 'Pros', value: analysis?.pros.length || 0, color: '#10b981' },
    { name: 'Cons', value: analysis?.cons.length || 0, color: '#ef4444' },
  ];

  const providerTone = analysisProvider === 'GEMINI' ? '#10b981' : analysisProvider === 'GROK' ? '#00d4ff' : '#f59e0b';
  const providerBadgeText = analysisProvider === 'N/A' ? 'PROVIDER CHECKING' : `${analysisProvider} ACTIVE`;

  const riskColor = analysis?.risk_assessment.risk_level === 'HIGH' ? '#ef4444' : 
                    analysis?.risk_assessment.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  const indiaImpact = analysis?.india_impact;
  const recommendations = analysis?.recommendations || [];
  const policyBrief = analysis?.policy_brief;
  const regionalSignals = Math.round(indiaImpact?.regional_signal_strength || 0);
  const inflationPressure = Math.round(indiaImpact?.inflation_pressure || 0);
  const employmentMomentum = Math.round(indiaImpact?.employment_momentum || 0);
  const readinessScore = Math.round(indiaImpact?.readiness_score || 0);
  const opportunityScore = Math.round(indiaImpact?.opportunity_index || 0);

  const priorityColor = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return '#ef4444';
    if (priority === 'medium') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Bill Amendment Analysis" subtitle="AI-Powered Legislative Impact Assessment & Risk Evaluation" />
      
      <main className="flex-1 px-6 py-6 space-y-6">
        <div className="flex justify-end">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: `${providerTone}1A`,
              border: `1px solid ${providerTone}66`,
              boxShadow: `0 0 14px ${providerTone}33`,
            }}
          >
            <Sparkles size={12} style={{ color: providerTone }} />
            <span style={{ color: providerTone, fontSize: '0.72rem', letterSpacing: '0.08em', fontWeight: 700 }}>
              {providerBadgeText}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 glow-gold">
                <OntoraLogo size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={14} className="text-gold animate-pulse" />
                  <span className="text-secondary text-[10px] font-black uppercase tracking-widest">
                    Legislative Intelligence Cluster
                  </span>
                </div>
                <h2 className="text-primary text-xl font-black tracking-tight leading-none mb-1">
                  Bill Analysis Engine <span className="text-gold/50 text-sm font-normal">v2.4 — DEEP LOGIC ENABLED</span>
                </h2>
                <p className="text-secondary text-xs font-medium">
                  Autonomous synthesis of multi-section legislative documents.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(10,21,37,0.7)', border: `1px solid ${providerTone}55` }}>
                <div style={{ color: '#6c8298', fontSize: '0.68rem' }}>Active Provider</div>
                <div style={{ color: providerTone, fontSize: '0.82rem', fontWeight: 700 }}>
                  {analysisProvider} • {analysisModel}
                </div>
              </div>
              {analyzerStatus && (
                <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(10,21,37,0.7)', border: '1px solid rgba(0,212,255,0.18)' }}>
                  <div style={{ color: '#6c8298', fontSize: '0.68rem' }}>API Keys</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>
                    Gemini: <strong style={{ color: analyzerStatus.gemini_enabled ? '#10b981' : '#ef4444' }}>{analyzerStatus.gemini_enabled ? 'Enabled' : 'Missing'}</strong>
                    {' · '}
                    Grok: <strong style={{ color: analyzerStatus.grok_enabled ? '#10b981' : '#f59e0b' }}>{analyzerStatus.grok_enabled ? 'Enabled' : 'Fallback Off'}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            <div className="rounded-lg p-3" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)' }}>
              <div className="flex items-center gap-2 mb-1"><Gauge size={13} style={{ color: '#00d4ff' }} /><span style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Risk Probability</span></div>
              <div style={{ color: '#00d4ff', fontSize: '1.05rem', fontWeight: 700 }}>{analysis ? `${Math.round((analysis.risk_assessment.probability || 0) * 100)}%` : '--'}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}>
              <div className="flex items-center gap-2 mb-1"><TrendingUp size={13} style={{ color: '#10b981' }} /><span style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Advantages Found</span></div>
              <div style={{ color: '#10b981', fontSize: '1.05rem', fontWeight: 700 }}>{analysis?.pros.length ?? 0}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
              <div className="flex items-center gap-2 mb-1"><TrendingDown size={13} style={{ color: '#ef4444' }} /><span style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Disadvantages Found</span></div>
              <div style={{ color: '#ef4444', fontSize: '1.05rem', fontWeight: 700 }}>{analysis?.cons.length ?? 0}</div>
            </div>
            <div className="rounded-lg p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
              <div className="flex items-center gap-2 mb-1"><ShieldCheck size={13} style={{ color: '#8b5cf6' }} /><span style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Sectors Assessed</span></div>
              <div style={{ color: '#8b5cf6', fontSize: '1.05rem', fontWeight: 700 }}>{analysis?.national_impact.sector_effects.length ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Upload Bill Document</h3>
          
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-opacity-80"
            style={{ borderColor: 'rgba(0,212,255,0.3)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} style={{ color: '#00d4ff', margin: '0 auto mb-3' }} />
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
              {file ? file.name : 'Click or drag PDF to upload'}
            </p>
            <p style={{ color: '#4a6070', fontSize: '0.8rem', marginTop: '8px' }}>
              PDF documents accepted
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            className="mt-4 px-6 py-2 rounded-lg font-medium text-sm transition-all"
            style={{
              background: file && !loading ? 'rgba(0,212,255,0.2)' : 'rgba(0,212,255,0.08)',
              color: file && !loading ? '#00d4ff' : '#4a6070',
              border: `1px solid rgba(0,212,255,${file && !loading ? '0.3' : '0.1'})`,
              cursor: file && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Bill'}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* Progress & Logs Section */}
        {loading && (
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Analysis Progress</h3>
            
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: '#8ab4d9', fontSize: '0.85rem' }}>Progress</span>
                <span style={{ color: '#00d4ff', fontSize: '0.85rem', fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(0,212,255,0.1)' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #00d4ff, #67e8f9)',
                  }}
                />
              </div>
            </div>

            {/* Logs */}
            <div>
              <h4 style={{ color: '#8ab4d9', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 'bold' }}>Activity Log</h4>
              <div
                className="rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-64"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                {logs.length === 0 ? (
                  <div style={{ color: '#4a6070' }}>Initializing analysis...</div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, idx) => (
                      <div key={idx} className="text-xs" style={{ lineHeight: '1.4' }}>
                        <span style={{ color: log.includes('✓') ? '#10b981' : log.includes('✗') ? '#ef4444' : '#8ab4d9' }}>
                          {log}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Summary */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#e2e8f0' }}>Bill Summary</h3>
              <h4 className="font-bold mb-2" style={{ color: '#00d4ff', fontSize: '1.1rem' }}>
                {analysis.bill_title}
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>
                {analysis.bill_summary}
              </p>
              <p style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                <strong style={{ color: '#00d4ff' }}>Country:</strong> {analysis.country}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <span style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Analyzed By:</span>
                <strong style={{ color: '#00d4ff', fontSize: '0.75rem' }}>{analysisProvider}</strong>
                <span style={{ color: '#4a6070', fontSize: '0.72rem' }}>{analysisModel}</span>
              </div>
              <button
                onClick={handleExportPolicyBrief}
                className="no-print mt-3 ml-3 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(0,212,255,0.12)',
                  border: '1px solid rgba(0,212,255,0.35)',
                  color: '#67e8f9',
                }}
              >
                Export Policy Brief (PDF)
              </button>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} style={{ color: '#10b981' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#10b981' }}>Advantages</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.pros.map((pro, idx) => (
                    <li key={idx} style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                      <span style={{ color: '#10b981', marginRight: '8px' }}>✓</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown size={16} style={{ color: '#ef4444' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#ef4444' }}>Disadvantages</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.cons.map((con, idx) => (
                    <li key={idx} style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                      <span style={{ color: '#ef4444', marginRight: '8px' }}>✕</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: '#00d4ff' }} />
                  <h3 className="text-sm font-semibold" style={{ color: '#00d4ff' }}>Pros vs Cons Ratio</h3>
                </div>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={prosConsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {prosConsData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1e35', border: '1px solid #1e3a5f', fontSize: '0.8rem' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* National Impact */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>National Economic Impact</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg" style={{ background: 'rgba(55,65,81,0.3)', borderLeft: `3px solid ${analysis.national_impact.gdp_impact > 0 ? '#10b981' : '#ef4444'}` }}>
                  <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>GDP Impact</p>
                  <p className="text-lg font-bold" style={{ color: analysis.national_impact.gdp_impact > 0 ? '#10b981' : '#ef4444' }}>
                    {analysis.national_impact.gdp_impact > 0 ? '+' : ''}{analysis.national_impact.gdp_impact.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(55,65,81,0.3)', borderLeft: `3px solid ${analysis.national_impact.employment_impact > 0 ? '#10b981' : '#ef4444'}` }}>
                  <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>Employment Impact</p>
                  <p className="text-lg font-bold" style={{ color: analysis.national_impact.employment_impact > 0 ? '#10b981' : '#ef4444' }}>
                    {analysis.national_impact.employment_impact > 0 ? '+' : ''}{analysis.national_impact.employment_impact.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg" style={{ background: 'rgba(55,65,81,0.3)', borderLeft: `3px solid ${analysis.national_impact.inflation_impact > 0 ? '#ef4444' : '#10b981'}` }}>
                  <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>Inflation Change</p>
                  <p className="text-lg font-bold" style={{ color: analysis.national_impact.inflation_impact > 0 ? '#ef4444' : '#10b981' }}>
                    {analysis.national_impact.inflation_impact > 0 ? '+' : ''}{analysis.national_impact.inflation_impact.toFixed(2)}%
                  </p>
                </div>
              </div>

              <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '12px' }}>Sector Effects</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sectorChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="sector" tick={{ fill: '#4a6070', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#4a6070', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#0d1e35', border: '1px solid #1e3a5f' }} />
                  <Bar dataKey="impact" fill="#00d4ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Impact Radar */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Overall Impact Assessment</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={impactRadarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4a6070', fontSize: 12 }} />
                  <Radar name="Impact Score" dataKey="value" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: '#0d1e35', border: '1px solid #1e3a5f' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Risk Assessment */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={18} style={{ color: riskColor }} />
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Risk Assessment</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="p-4 rounded-lg mb-4" style={{ background: `${riskColor}15`, border: `1px solid ${riskColor}30` }}>
                    <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>Risk Level</p>
                    <p className="text-2xl font-bold" style={{ color: riskColor }}>
                      {analysis.risk_assessment.risk_level}
                    </p>
                    <div className="mt-2 bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${analysis.risk_assessment.probability * 100}%`,
                          background: riskColor,
                        }}
                      />
                    </div>
                    <p style={{ color: '#4a6070', fontSize: '0.75rem', marginTop: '4px' }}>
                      Probability: {(analysis.risk_assessment.probability * 100).toFixed(0)}%
                    </p>
                  </div>

                  <div>
                    <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px' }}>Mitigation Strategies</h4>
                    <ul className="space-y-1">
                      {analysis.risk_assessment.mitigation_strategies.map((strategy, idx) => (
                        <li key={idx} style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                          • {strategy}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px' }}>Stakeholder Influence</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stakeholderData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                      <XAxis type="number" tick={{ fill: '#4a6070', fontSize: 10 }} />
                      <YAxis dataKey="stakeholder" type="category" width={80} tick={{ fill: '#4a6070', fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: '#0d1e35', border: '1px solid #1e3a5f', fontSize: '0.8rem' }} />
                      <Bar dataKey="influence" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Global Impact */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Global Impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px' }}>Trade Relations</h4>
                  <ul className="space-y-2">
                    {analysis.global_impact.trade_relations.map((relation, idx) => (
                      <li key={idx} style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                        • {relation}
                      </li>
                    ))}
                  </ul>

                  <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '12px', marginBottom: '8px' }}>Affected Regions</h4>
                  <ul className="space-y-2">
                    {analysis.global_impact.affected_regions.map((region, idx) => (
                      <li key={idx} style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                        • {region}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg" style={{ background: 'rgba(55,65,81,0.3)' }}>
                  <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>Geopolitical Influence</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: '#3eb87a' }}>
                    {(analysis.global_impact.geopolitical_influence * 100).toFixed(0)}%
                  </p>
                  <p style={{ color: '#4a6070', fontSize: '0.75rem', marginTop: '8px' }}>
                    Level of influence on global geopolitical landscape
                  </p>
                </div>
              </div>
            </div>

            {/* Deep Logic Extensions: ESG, Compliance, Legal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ESG Impact */}
              <div className="glass-card rounded-2xl p-6 border-l-4 border-emerald-500/50">
                <div className="flex items-center gap-3 mb-6">
                  <Leaf className="text-emerald-400" size={20} />
                  <h3 className="text-primary font-black text-sm uppercase tracking-widest">ESG Foresight</h3>
                </div>
                {analysis.esg_impact ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary text-xs uppercase font-bold">Sustainability Score</span>
                      <span className="text-emerald-400 font-extrabold text-lg">{Math.round(analysis.esg_impact.esg_score)}/100</span>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <span className="text-[10px] text-emerald-400 font-black uppercase">Environmental</span>
                        <p className="text-primary text-xs mt-1 leading-relaxed">{analysis.esg_impact.environmental}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-lavender-500/5 border border-lavender-500/10">
                        <span className="text-[10px] text-lavender-400 font-black uppercase">Social</span>
                        <p className="text-primary text-xs mt-1 leading-relaxed">{analysis.esg_impact.social}</p>
                      </div>
                    </div>
                  </div>
                ) : <div className="text-secondary text-xs italic">Awaiting AI ESG synthesis...</div>}
              </div>

              {/* Compliance Burden */}
              <div className="glass-card rounded-2xl p-6 border-l-4 border-gold/50">
                <div className="flex items-center gap-3 mb-6">
                  <Scale className="text-gold" size={20} />
                  <h3 className="text-primary font-black text-sm uppercase tracking-widest">Regulatory Burden</h3>
                </div>
                {analysis.compliance_burden ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary text-xs uppercase font-bold">Complexity Level</span>
                      <span className="text-gold font-extrabold text-lg uppercase">{analysis.compliance_burden.estimated_cost_level}</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-secondary font-black uppercase">Resources Required</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.compliance_burden.required_resources.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[9px] text-gold font-bold">{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : <div className="text-secondary text-xs italic">Analyzing compliance matrix...</div>}
              </div>

              {/* Legal Precedents */}
              <div className="glass-card rounded-2xl p-6 border-l-4 border-crimson-500/50">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="text-crimson-400" size={20} />
                  <h3 className="text-primary font-black text-sm uppercase tracking-widest">Legal Resilience</h3>
                </div>
                <div className="space-y-4">
                  {analysis.legal_precedents?.precedents?.slice(0, 2).map((p, i) => (
                    <div key={i} className="p-3 rounded-xl bg-crimson-500/5 border border-crimson-500/10">
                      <span className="text-[10px] text-crimson-400 font-black uppercase">{p.act_name}</span>
                      <p className="text-primary text-[10px] mt-1 italic leading-tight"> outcome: {p.outcome}</p>
                    </div>
                  ))}
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-secondary font-black uppercase">Challenge Risk Assessment</span>
                    <p className="text-primary text-xs mt-1">{analysis.legal_precedents?.legal_challenges_risk}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmap Section */}
            <div className="space-y-3">
              <div className="glass-card rounded-xl p-4">
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Heatmap Analysis</h3>
                <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '4px' }}>
                  Population pressure, climate stress, and economic intensity blended into one interactive map.
                </p>
              </div>
              {heatmapError && (
                <div
                  className="px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(184,74,74,0.08)',
                    border: '1px solid rgba(184,74,74,0.2)',
                    color: '#b84a4a',
                    fontSize: '0.72rem',
                  }}
                >
                  Live heatmap data unavailable: {heatmapError}
                </div>
              )}
              {heatmapLoading ? (
                <div className="glass-card rounded-xl p-4" style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                  Loading exact heatmap...
                </div>
              ) : (
                <MultiLayerGeoHeatmap
                  hotspots={geospatialData.hotspots}
                  climateRegions={geospatialData.climateRegions}
                  economicRegions={geospatialData.economicRegions}
                />
              )}
            </div>

            {/* India Impact Lens */}
            <div className="glass-card rounded-xl p-6 mobile-contrast-card">
              <div className="flex items-center gap-2 mb-4">
                <Flag size={16} style={{ color: '#00d4ff' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>India Impact Lens</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="p-4 rounded-lg mobile-contrast-panel" style={{ background: 'rgba(0,212,255,0.07)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <p style={{ color: '#6c8298', fontSize: '0.72rem', marginBottom: '6px' }}>Regional Signal Strength</p>
                  <p style={{ color: '#00d4ff', fontSize: '1.3rem', fontWeight: 700 }}>{regionalSignals}%</p>
                  <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '6px' }}>
                    India mentions: {indiaImpact?.india_mentions ?? 0} · South Asia mentions: {indiaImpact?.south_asia_mentions ?? 0}
                  </p>
                </div>

                <div className="p-4 rounded-lg mobile-contrast-panel" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p style={{ color: '#6c8298', fontSize: '0.72rem', marginBottom: '6px' }}>Opportunity Index</p>
                  <p style={{ color: '#10b981', fontSize: '1.3rem', fontWeight: 700 }}>{opportunityScore}%</p>
                  <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '6px' }}>
                    Backend-derived score from growth outlook, employment momentum, and pros-cons balance.
                  </p>
                </div>

                <div className="p-4 rounded-lg mobile-contrast-panel" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p style={{ color: '#6c8298', fontSize: '0.72rem', marginBottom: '6px' }}>Implementation Readiness</p>
                  <p style={{ color: '#f59e0b', fontSize: '1.3rem', fontWeight: 700 }}>{readinessScore}%</p>
                  <p style={{ color: '#8ab4d9', fontSize: '0.76rem', marginTop: '6px' }}>
                    Backend-derived from risk probability, inflation pressure, and timeline depth.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#8ab4d9', fontSize: '0.78rem' }}>Inflation Pressure</span>
                    <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>{inflationPressure}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${inflationPressure}%`, background: 'linear-gradient(90deg, #fb7185, #ef4444)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: '#8ab4d9', fontSize: '0.78rem' }}>Employment Momentum</span>
                    <span style={{ color: '#10b981', fontSize: '0.78rem' }}>{employmentMomentum}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <div className="h-full rounded-full" style={{ width: `${employmentMomentum}%`, background: 'linear-gradient(90deg, #34d399, #10b981)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Engine */}
            <div className="glass-card rounded-xl p-6 mobile-contrast-card">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={16} style={{ color: '#8b5cf6' }} />
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Recommendation Engine</h3>
              </div>

              <div className="space-y-3 mb-5">
                {recommendations.length === 0 ? (
                  <div className="p-4 rounded-lg mobile-contrast-panel" style={{ background: 'rgba(55,65,81,0.22)', border: '1px solid rgba(0,212,255,0.25)' }}>
                    <p style={{ color: '#9fb2c4', fontSize: '0.82rem' }}>No backend recommendation payload was returned for this run.</p>
                  </div>
                ) : recommendations.map((item, idx) => {
                  const itemColor = priorityColor(item.priority);
                  return (
                  <div key={idx} className="p-4 rounded-lg mobile-contrast-panel" style={{ background: 'rgba(55,65,81,0.22)', border: `1px solid ${itemColor}33` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p style={{ color: itemColor, fontSize: '0.86rem', fontWeight: 700 }}>{item.title}</p>
                        <p style={{ color: '#9fb2c4', fontSize: '0.78rem', marginTop: '4px' }}>{item.detail}</p>
                      </div>
                      <div className="px-2.5 py-1 rounded-md" style={{ background: `${itemColor}1A`, border: `1px solid ${itemColor}55` }}>
                        <span style={{ color: itemColor, fontSize: '0.72rem', fontWeight: 700 }}>{Math.round(item.confidence)}% confidence</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-lg" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target size={14} style={{ color: '#8b5cf6' }} />
                  <p style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 700 }}>Primary Strategic Focus</p>
                </div>
                <p style={{ color: '#a7b8c8', fontSize: '0.8rem' }}>
                  {readinessScore < 45
                    ? 'Stabilize execution risk first, then accelerate economic upside through phased scaling.'
                    : 'Leverage strong readiness to push growth upside while containing inflation spillovers with guardrail clauses.'}
                </p>
              </div>
            </div>

            {/* Policy Brief (PDF-ready) */}
            <div className="glass-card rounded-xl p-6 policy-brief-block mobile-contrast-card">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Policy Brief</h3>
                <span style={{ color: '#8ab4d9', fontSize: '0.72rem' }}>
                  Generated {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="rounded-lg p-4 mobile-contrast-panel" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.22)' }}>
                <p style={{ color: '#6c8298', fontSize: '0.74rem', letterSpacing: '0.05em' }}>EXECUTIVE SUMMARY</p>
                <p style={{ color: '#d7e2ee', fontSize: '0.86rem', lineHeight: '1.6', marginTop: '8px' }}>
                  {policyBrief?.executive_summary || analysis.bill_summary}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="rounded-lg p-3 mobile-contrast-panel" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
                  <p style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>GDP</p>
                  <p style={{ color: '#10b981', fontWeight: 700 }}>{(policyBrief?.core_metrics.gdp_impact ?? analysis.national_impact.gdp_impact).toFixed(2)}%</p>
                </div>
                <div className="rounded-lg p-3 mobile-contrast-panel" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <p style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Employment</p>
                  <p style={{ color: '#22c55e', fontWeight: 700 }}>{(policyBrief?.core_metrics.employment_impact ?? analysis.national_impact.employment_impact).toFixed(2)}%</p>
                </div>
                <div className="rounded-lg p-3 mobile-contrast-panel" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}>
                  <p style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>Risk</p>
                  <p style={{ color: '#ef4444', fontWeight: 700 }}>{policyBrief?.core_metrics.risk_level || analysis.risk_assessment.risk_level}</p>
                </div>
                <div className="rounded-lg p-3 mobile-contrast-panel" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
                  <p style={{ color: '#7f9bb7', fontSize: '0.72rem' }}>India Readiness</p>
                  <p style={{ color: '#f59e0b', fontWeight: 700 }}>{Math.round(policyBrief?.core_metrics.india_readiness ?? readinessScore)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                <div className="rounded-lg p-4 mobile-contrast-panel" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(0,212,255,0.16)' }}>
                  <p style={{ color: '#8ab4d9', fontSize: '0.74rem', marginBottom: '8px' }}>TOP RECOMMENDATIONS</p>
                  <ul className="space-y-1">
                    {(policyBrief?.top_recommendations || recommendations.map((item) => item.title).slice(0, 3)).map((item, idx) => (
                      <li key={idx} style={{ color: '#d2deea', fontSize: '0.8rem' }}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-4 mobile-contrast-panel" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(16,185,129,0.16)' }}>
                  <p style={{ color: '#8ab4d9', fontSize: '0.74rem', marginBottom: '8px' }}>NEXT 90 DAYS</p>
                  <ul className="space-y-1">
                    {(policyBrief?.next_90_days || []).map((step, idx) => (
                      <li key={idx} style={{ color: '#d2deea', fontSize: '0.8rem' }}>• {step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Implementation Timeline */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Implementation Timeline</h3>
              <div className="space-y-4">
                {analysis.implementation_timeline.map((phase, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                      style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: '600' }}>{phase.phase}</h4>
                      <p style={{ color: '#4a6070', fontSize: '0.8rem' }}>Duration: {phase.duration}</p>
                      <ul className="mt-2 space-y-1">
                        {phase.milestones.map((milestone, mIdx) => (
                          <li key={mIdx} style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                            • {milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparative Analysis */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Similar Bills in Other Countries</h3>
              <div className="space-y-3">
                {analysis.comparative_analysis.map((comparison, idx) => (
                  <div key={idx} className="p-3 rounded-lg" style={{ background: 'rgba(55,65,81,0.3)' }}>
                    <p style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>
                      {comparison.country}: {comparison.similar_bill}
                    </p>
                    <p style={{ color: '#4a6070', fontSize: '0.8rem', marginTop: '4px' }}>
                      Outcome: {comparison.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Analysis Archive */}
        <div className="glass-card rounded-2xl overflow-hidden mt-8">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="text-gold" size={18} />
              <h3 className="text-primary font-black text-xs uppercase tracking-widest">Strategic Analysis Archive</h3>
            </div>
            <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Total Audited: {history.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[9px] font-bold uppercase tracking-[0.2em] bg-black/20">
                <tr>
                  <th className="px-6 py-4 text-secondary">ID & Timestamp</th>
                  <th className="px-6 py-4 text-secondary">Document Title</th>
                  <th className="px-6 py-4 text-secondary">Context</th>
                  <th className="px-6 py-4 text-secondary">Intelligence Tier</th>
                  <th className="px-6 py-4 text-secondary text-right">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((entry) => (
                  <tr 
                    key={entry.id} 
                    onClick={() => handleLoadHistory(entry)}
                    className="group hover:bg-gold/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-primary text-[10px] font-mono font-bold tracking-tighter">
                          {entry.id.substring(0, 8)}...
                        </span>
                        <span className="text-secondary text-[9px] mt-0.5">
                          {new Date(entry.analyzed_at).toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-gold/60" />
                        <span className="text-primary text-[11px] font-bold tracking-tight line-clamp-1">{entry.bill_title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Flag size={10} className="text-secondary" />
                        <span className="text-secondary text-[10px] font-black uppercase">{entry.country}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20 text-gold text-[9px] font-black uppercase">
                          {entry.model}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-secondary text-[10px]">
                      {entry.pages} PAGES
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-secondary text-xs italic">
                      No historical intelligence records found in archive.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
