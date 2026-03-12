'use client';

import TopBar from '@/components/TopBar';
import { Shield, Lock, Eye, FileText, AlertTriangle, CheckCircle, XCircle, Clock, User, Key } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const AUDIT_LOG = [
  { time: '09:47:33', user: 'Admin', action: 'QUERY', resource: 'kg.entity.embeddings', classification: 'TS/SCI', status: 'ALLOW', ip: '10.4.2.18' },
  { time: '09:45:02', user: 'ANALYST.PARK', action: 'EXPORT', resource: 'economic.indicators.curated', classification: 'SECRET', status: 'ALLOW', ip: '10.4.2.31' },
  { time: '09:43:18', user: 'SYS.KAFKA', action: 'WRITE', resource: 'news.global.raw', classification: 'UNCLASS', status: 'ALLOW', ip: '10.2.0.12' },
  { time: '09:41:55', user: 'EXT.PORTAL-7', action: 'READ', resource: 'public.briefs.analyst', classification: 'FOUO', status: 'DENY', ip: '203.142.8.77' },
  { time: '09:38:20', user: 'ML.PIPELINE', action: 'READ', resource: 'social.sentiment.silver', classification: 'SECRET', status: 'ALLOW', ip: '10.3.0.5' },
  { time: '09:35:44', user: 'ADMIN.SVC', action: 'CONFIG_CHANGE', resource: 'neo4j.cluster.config', classification: 'TS', status: 'ALLOW', ip: '10.1.0.1' },
];

const POLICY_VIOLATIONS_WEEK = [
  { day: 'Mon', violations: 2, warnings: 8 },
  { day: 'Tue', violations: 0, warnings: 5 },
  { day: 'Wed', violations: 1, warnings: 7 },
  { day: 'Thu', violations: 3, warnings: 11 },
  { day: 'Fri', violations: 0, warnings: 4 },
  { day: 'Sat', violations: 0, warnings: 2 },
  { day: 'Sun', violations: 1, warnings: 6 },
];

const DATA_LINEAGE = [
  { dataset: 'news.global.raw', source: 'Reuters API · AP Wire · Bloomberg', transforms: 3, consumers: ['NLP Pipeline', 'Graph Ingestion'], classification: 'UNCLASS' },
  { dataset: 'economic.curated', source: 'IMF · World Bank · Fed FRED', transforms: 5, consumers: ['Predictions Engine', 'Dashboard'], classification: 'SECRET' },
  { dataset: 'kg.entity.embeddings', source: 'Neo4j Graph · NLP Extraction', transforms: 2, consumers: ['Vector Search', 'AI Briefs'], classification: 'TS/SCI' },
  { dataset: 'conflict.risk.scores', source: 'PyG Model · Satellite · OSINT', transforms: 4, consumers: ['Dashboard', 'Predictions', 'Reports'], classification: 'TS' },
];

const COMPLIANCE_CHECKS = [
  { control: 'Data Encryption at Rest', standard: 'FIPS 140-2', status: 'PASS', last: '2 hr ago' },
  { control: 'TLS 1.3 in Transit', standard: 'NIST SP 800-52', status: 'PASS', last: '15 min ago' },
  { control: 'RBAC Policy Enforcement', standard: 'NIST AC-2', status: 'PASS', last: '5 min ago' },
  { control: 'Audit Log Integrity', standard: 'NIST AU-9', status: 'PASS', last: '1 min ago' },
  { control: 'Differential Privacy', standard: 'Internal Policy', status: 'PASS', last: '1 hr ago' },
  { control: 'PII Data Masking', standard: 'GDPR Art. 25', status: 'WARN', last: '12 hr ago' },
  { control: 'Key Rotation Schedule', standard: 'NIST SP 800-57', status: 'PASS', last: '24 hr ago' },
  { control: 'Zero Trust Verification', standard: 'CISA ZT Model', status: 'PASS', last: '3 min ago' },
];

const customTooltipStyle = {
  backgroundColor: '#0d1e35',
  border: '1px solid #1e3a5f',
  borderRadius: '8px',
  padding: '10px 14px',
};

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Security & Governance" subtitle="Zero Trust Architecture · End-to-End Encryption · Audit Logging · Differential Privacy" />
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Classification banner */}
        <div
          className="flex items-center justify-center py-2 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <Lock size={13} style={{ color: '#ef4444' }} />
            <span className="font-bold tracking-widest text-xs" style={{ color: '#ef4444', letterSpacing: '0.2em' }}>
              TOP SECRET // SCI // ORCON // NOFORN — AUTHORIZED ACCESS ONLY
            </span>
            <Lock size={13} style={{ color: '#ef4444' }} />
          </div>
        </div>

        {/* Security stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Threats Blocked (24h)', value: '1,847', sub: '3 critical, 12 high risk', color: '#ef4444', icon: Shield },
            { label: 'Active Sessions', value: '47', sub: '12 analysts, 35 systems', color: '#00d4ff', icon: User },
            { label: 'Encryption Coverage', value: '100%', sub: 'All data at rest & transit', color: '#00ff88', icon: Lock },
            { label: 'Compliance Score', value: '97.2%', sub: '1 warning, 0 failures', color: '#f59e0b', icon: CheckCircle },
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

        {/* Zero trust architecture visualization + compliance */}
        <div className="grid grid-cols-2 gap-6">
          {/* ZTA visualization */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-5" style={{ color: '#e2e8f0' }}>Zero Trust Architecture Status</h3>
            <div className="space-y-3">
              {[
                { label: 'Identity & Access', desc: 'OAuth2 · JWT · MFA enforced', status: 'VERIFIED', color: '#00ff88' },
                { label: 'Device Trust', desc: 'Certificate-based auth on all nodes', status: 'VERIFIED', color: '#00ff88' },
                { label: 'Network Micro-segmentation', desc: 'Kubernetes NetworkPolicy enforced', status: 'VERIFIED', color: '#00ff88' },
                { label: 'Application Security', desc: 'WAF + SAST + DAST scanning', status: 'VERIFIED', color: '#00ff88' },
                { label: 'Data Classification', desc: 'Auto-tagging: UNCLASS → TS/SCI', status: 'ACTIVE', color: '#00ff88' },
                { label: 'Continuous Monitoring', desc: 'Prometheus + Grafana + SIEM', status: 'LIVE', color: '#00ff88' },
                { label: 'Lateral Movement Detection', desc: 'AI behavioral analysis active', status: 'ACTIVE', color: '#00ff88' },
                { label: 'PII Data Masking', desc: 'Differential privacy: ε=0.1', status: 'REVIEW', color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 py-2.5 px-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: `${item.color}15` }}>
                    <CheckCircle size={11} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{item.label}</div>
                    <div className="text-xs" style={{ color: '#475569', fontSize: '0.65rem' }}>{item.desc}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${item.color}10`, color: item.color, fontSize: '0.65rem' }}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance checks */}
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Compliance Control Status</h3>
            <div className="space-y-2.5">
              {COMPLIANCE_CHECKS.map(c => (
                <div key={c.control} className="flex items-center gap-4 py-2.5 px-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  {c.status === 'PASS'
                    ? <CheckCircle size={14} style={{ color: '#00ff88' }} />
                    : <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                  }
                  <div className="flex-1">
                    <div className="text-xs font-semibold" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{c.control}</div>
                    <div className="text-xs" style={{ color: '#475569', fontSize: '0.65rem' }}>{c.standard}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === 'PASS' ? 'status-online' : 'status-warning'}`}>
                      {c.status}
                    </span>
                    <div className="text-xs mt-1" style={{ color: '#334155', fontSize: '0.6rem' }}>{c.last}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Policy violations chart + data lineage */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Policy Violations — Past 7 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={POLICY_VIOLATIONS_WEEK} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" strokeOpacity={0.4} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={customTooltipStyle} labelStyle={{ color: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="violations" fill="#ef4444" opacity={0.8} radius={[3, 3, 0, 0]} name="Violations" />
                <Bar dataKey="warnings" fill="#f59e0b" opacity={0.6} radius={[3, 3, 0, 0]} name="Warnings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4" style={{ color: '#e2e8f0' }}>Data Lineage Tracking</h3>
            <div className="space-y-3">
              {DATA_LINEAGE.map(d => (
                <div key={d.dataset} className="p-3 rounded-lg" style={{ background: 'rgba(2,8,23,0.5)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-semibold" style={{ color: '#00d4ff', fontSize: '0.7rem' }}>{d.dataset}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.6rem' }}>{d.classification}</span>
                  </div>
                  <div className="text-xs mb-1.5" style={{ color: '#475569', fontSize: '0.65rem' }}>Source: {d.source}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {d.consumers.map(c => (
                        <span key={c} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.06)', color: '#00d4ff80', fontSize: '0.62rem' }}>{c}</span>
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: '#334155', fontSize: '0.62rem' }}>{d.transforms} transforms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit log */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Immutable Audit Log</h3>
            <div className="flex items-center gap-2">
              <Eye size={12} style={{ color: '#00ff88' }} />
              <span className="text-xs font-bold live-indicator" style={{ color: '#00ff88', fontSize: '0.68rem' }}>LIVE · TAMPER-EVIDENT</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">Timestamp</th>
                  <th className="text-left">Principal</th>
                  <th className="text-left">Action</th>
                  <th className="text-left">Resource</th>
                  <th className="text-left">Classification</th>
                  <th className="text-left">Source IP</th>
                  <th className="text-left">Decision</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map((entry, i) => (
                  <tr key={i}>
                    <td className="font-mono" style={{ color: '#475569', fontSize: '0.72rem' }}>{entry.time}</td>
                    <td className="font-mono font-semibold" style={{ color: '#00d4ff', fontSize: '0.72rem' }}>{entry.user}</td>
                    <td>
                      <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold" style={{ background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', fontSize: '0.62rem' }}>{entry.action}</span>
                    </td>
                    <td className="font-mono" style={{ color: '#64748b', fontSize: '0.72rem' }}>{entry.resource}</td>
                    <td>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.62rem' }}>{entry.classification}</span>
                    </td>
                    <td className="font-mono" style={{ color: '#475569', fontSize: '0.7rem' }}>{entry.ip}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {entry.status === 'ALLOW'
                          ? <CheckCircle size={12} style={{ color: '#00ff88' }} />
                          : <XCircle size={12} style={{ color: '#ef4444' }} />
                        }
                        <span className="text-xs font-bold" style={{ color: entry.status === 'ALLOW' ? '#00ff88' : '#ef4444', fontSize: '0.65rem' }}>
                          {entry.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-center">
            <button className="text-xs hover:underline" style={{ color: '#00d4ff60', fontSize: '0.7rem' }}>
              View full audit trail (847,291 entries) →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
