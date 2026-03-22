'use client';

import TopBar from '@/components/TopBar';
import { Upload, AlertCircle, TrendingUp, TrendingDown, Globe, Users, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { useState, useRef, useEffect } from 'react';

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
}

export default function BillAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when they update
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

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
      const result = await fetch('http://localhost:8000/api/bill-analysis/analyze', {
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
        setAnalysis(response.data);
        setProgress(100);
        setLogs(prev => [...prev, '✓ Analysis completed successfully']);
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

  const riskColor = analysis?.risk_assessment.risk_level === 'HIGH' ? '#ef4444' : 
                    analysis?.risk_assessment.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Bill Amendment Analysis" subtitle="AI-Powered Legislative Impact Assessment & Risk Evaluation" />
      
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Upload Section */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Upload Bill Document</h3>
          
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all hover:border-opacity-80"
            style={{ borderColor: 'rgba(200,168,74,0.3)' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={32} style={{ color: '#c8a84a', margin: '0 auto mb-3' }} />
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
              background: file && !loading ? 'rgba(200,168,74,0.2)' : 'rgba(200,168,74,0.08)',
              color: file && !loading ? '#c8a84a' : '#4a6070',
              border: `1px solid rgba(200,168,74,${file && !loading ? '0.3' : '0.1'})`,
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
                <span style={{ color: '#c8a84a', fontSize: '0.85rem', fontWeight: 'bold' }}>{progress}%</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(200,168,74,0.1)' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #c8a84a, #e2c561)',
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
              <h4 className="font-bold mb-2" style={{ color: '#c8a84a', fontSize: '1.1rem' }}>
                {analysis.bill_title}
              </h4>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '12px' }}>
                {analysis.bill_summary}
              </p>
              <p style={{ color: '#4a6070', fontSize: '0.8rem' }}>
                <strong style={{ color: '#c8a84a' }}>Country:</strong> {analysis.country}
              </p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
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
                  <Bar dataKey="impact" fill="#c8a84a" />
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
                  <Radar name="Impact Score" dataKey="value" stroke="#c8a84a" fill="#c8a84a" fillOpacity={0.3} />
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
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Global Impact</h3>
              
              <div className="grid grid-cols-2 gap-6">
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

            {/* Implementation Timeline */}
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold mb-4" style={{ color: '#e2e8f0' }}>Implementation Timeline</h3>
              <div className="space-y-4">
                {analysis.implementation_timeline.map((phase, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'rgba(200,168,74,0.2)', color: '#c8a84a' }}
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
      </main>
    </div>
  );
}
