'use client';

import TopBar from '@/components/TopBar';
import { Upload, AlertCircle, TrendingUp, TrendingDown, Sparkles, Gauge, ShieldCheck, Flag, Lightbulb, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '@/app/lib/api';

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
    affected_countries?: { country: string; impact_description: string; sentiment: string }[];
  };
  amendments?: {
    title: string;
    original_flaw: string;
    powerful_tweak: string;
    impact_before: string;
    impact_after: string;
  }[];
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
  analysis_provider?: string;
  analysis_model?: string;
  provider?: string;
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
    setLogs(['Initiating bill analysis engine...']);

    const formData = new FormData();
    formData.append('file', file);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.floor(Math.random() * 5) + 2;
      });
    }, 800);

    const defaultLogs = [
      '[DONE] Creating secure transmission channel...',
      '[DONE] Parsing PDF internal structure...',
      '[DONE] Extracting text from document...',
      '[DONE] Initiating parallel LLM processing...',
      '[DONE] Analyzing economic and global impact...',
      '[DONE] Synthesizing risk assessments...',
      '[DONE] Compiling powerful amendments...',
      '[DONE] Preparing final visual delivery...'
    ];

    let logIndex = 0;
    const logsInterval = setInterval(() => {
      setLogs((prev) => {
        if (logIndex < defaultLogs.length) {
          const nextLog = defaultLogs[logIndex];
          logIndex++;
          return [...prev, nextLog];
        }
        return prev;
      });
    }, 2000);

    try {
      const result = await fetch(`${API_BASE_URL}/api/bill-analysis/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      clearInterval(logsInterval);

      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error?.message || 'Analysis failed');
      }
      
      const response = await result.json();
      
      // Update progress and logs from the definitive server response
      if (response.progress !== undefined) {
        setProgress(response.progress);
      }
      if (response.logs && Array.isArray(response.logs)) {
        setLogs(response.logs);
      }
      
      if (response.data) {
        const data = response.data as BillAnalysis;
        
        // Ensure deeply nested properties are defined to prevent rendering crashes
        const safeData = {
          ...data,
          pros: data.pros || [],
          cons: data.cons || [],
          national_impact: {
            gdp_impact: data.national_impact?.gdp_impact || 0,
            employment_impact: data.national_impact?.employment_impact || 0,
            inflation_impact: data.national_impact?.inflation_impact || 0,
            sector_effects: data.national_impact?.sector_effects || []
          },
          global_impact: {
            trade_relations: data.global_impact?.trade_relations || [],
            geopolitical_influence: data.global_impact?.geopolitical_influence || 0,
            affected_regions: data.global_impact?.affected_regions || [],
            affected_countries: data.global_impact?.affected_countries || []
          },
          risk_assessment: {
            risk_level: data.risk_assessment?.risk_level || 'UNKNOWN',
            probability: data.risk_assessment?.probability || 0,
            mitigation_strategies: data.risk_assessment?.mitigation_strategies || []
          },
          stakeholder_analysis: data.stakeholder_analysis || [],
          implementation_timeline: data.implementation_timeline || [],
          comparative_analysis: data.comparative_analysis || [],
          amendments: data.amendments || []
        };

        setAnalysis(safeData);
        setAnalysisProvider((safeData.provider || safeData.analysis_provider || analyzerStatus?.provider || 'N/A').toUpperCase());
        setAnalysisModel(safeData.analysis_model || analyzerStatus?.model || 'N/A');
        setProgress(100);
        setLogs(prev => [...prev, '[DONE] Analysis completed successfully']);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(logsInterval);
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      setLogs(prev => [...prev, `✗ Error: ${errorMsg}`]);
    } finally {
      clearInterval(progressInterval);
      clearInterval(logsInterval);
      setLoading(false);
    }
  };

  const handleExportPolicyBrief = () => {
    window.print();
  };

  const sectorChartData = analysis?.national_impact.sector_effects || [];
  
  const impactRadarData = [
    { subject: 'GDP Impact', value: Math.abs((analysis?.national_impact.gdp_impact || 0) * 100), fullMark: 100 },
    { subject: 'Employment', value: Math.abs((analysis?.national_impact.employment_impact || 0) * 100), fullMark: 100 },
    { subject: 'Inflation', value: Math.abs((analysis?.national_impact.inflation_impact || 0) * 100), fullMark: 100 },
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
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} style={{ color: '#00d4ff' }} />
                <span style={{ color: '#8ab4d9', fontSize: '0.78rem', letterSpacing: '0.08em', fontWeight: 700 }}>
                  LEGISLATIVE IMPACT LAB
                </span>
              </div>
              <h2 style={{ color: '#e2e8f0', fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px' }}>
                Upload. Analyze. Simulate National and Global Outcomes.
              </h2>
              <p style={{ color: '#6c8298', fontSize: '0.82rem' }}>
                Live AI analysis with sector impact charts, stakeholder influence mapping, and implementation timeline intelligence.
              </p>
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
                        <span style={{ color: log.includes('[DONE]') ? '#10b981' : log.includes('[ERROR]') ? '#ef4444' : '#8ab4d9' }}>
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
                      <span style={{ color: '#10b981', marginRight: '8px' }}>+</span>
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
              
              <div className="grid grid-cols-3 gap-4 mb-6">
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
              
              <div className="grid grid-cols-2 gap-6">
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
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Global Impact Analysis</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '8px' }}>Trade Relations & Regions</h4>
                  <ul className="space-y-2 mb-4">
                    {analysis.global_impact.trade_relations.map((relation, idx) => (
                      <li key={idx} style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                        • {relation}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {analysis.global_impact.affected_regions.map((region, idx) => (
                      <span key={idx} className="px-2 py-1 rounded bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
                        {region}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-lg bg-emerald-900/10 border border-emerald-500/20">
                    <p style={{ color: '#4a6070', fontSize: '0.75rem' }}>Geopolitical Influence Map</p>
                    <div className="flex items-end gap-3 mt-2">
                       <p className="text-3xl font-bold" style={{ color: '#3eb87a' }}>
                         {(analysis.global_impact.geopolitical_influence * 100).toFixed(0)}%
                       </p>
                       <p className="mb-1 text-xs text-slate-400">Sphere of Influence</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {analysis.global_impact.affected_countries && analysis.global_impact.affected_countries.length > 0 && (
                <div className="mt-6">
                  <h4 style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '12px' }}>Specific National Impacts</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.global_impact.affected_countries.map((country, idx) => {
                      const sentimentColor = country.sentiment === 'POSITIVE' ? '#10b981' : country.sentiment === 'NEGATIVE' ? '#ef4444' : '#f59e0b';
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-slate-200">{country.country}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: sentimentColor, backgroundColor: `${sentimentColor}15`, border: `1px solid ${sentimentColor}30` }}>
                              {country.sentiment}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{country.impact_description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Powerful Amendment Tweaks */}
            {analysis.amendments && analysis.amendments.length > 0 && (
              <div className="glass-card rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
                
                <div className="flex items-center gap-2 mb-6">
                  <Lightbulb size={20} className="text-fuchsia-400" />
                  <h3 className="text-base font-bold text-slate-100 font-display tracking-wide">Powerful Amendment Tweaks</h3>
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                    AI SUGGESTION
                  </span>
                </div>
                
                <div className="space-y-4">
                  {analysis.amendments.map((amendment, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-slate-900/40 border border-fuchsia-500/15 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: 'linear-gradient(to bottom, rgb(217, 70, 239), rgb(147, 51, 234))' }}></div>
                      
                      <h4 className="text-sm font-bold text-fuchsia-300 mb-3 ml-2">{amendment.title}</h4>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 ml-2">
                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Original Flaw</p>
                            <p className="text-xs text-slate-300 leading-relaxed p-2.5 rounded bg-slate-800/50 border border-slate-700/50">
                              {amendment.original_flaw}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">Tweak Proposal</p>
                            <p className="text-xs text-fuchsia-200 leading-relaxed p-2.5 rounded bg-fuchsia-900/10 border border-fuchsia-500/20 font-medium">
                              ★ {amendment.powerful_tweak}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col justify-center space-y-2">
                          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                            <p className="text-[10px] uppercase tracking-wider text-rose-400/70 mb-1 font-semibold">Impact Before</p>
                            <p className="text-xs text-slate-300">{amendment.impact_before}</p>
                          </div>
                          
                          <div className="flex justify-center -my-3 relative z-10">
                            <div className="bg-slate-800 rounded-full p-1 border border-slate-700">
                              <TrendingUp size={14} className="text-fuchsia-400" />
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1 font-semibold">Impact After Mitigation</p>
                            <p className="text-xs text-emerald-300 font-medium">{amendment.impact_after}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          </>
        )}
      </main>
    </div>
  );
}
