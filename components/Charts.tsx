'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const globalRiskData = [
  { month: 'Sep', geopolitical: 62, economic: 48, climate: 35, cyber: 71 },
  { month: 'Oct', geopolitical: 58, economic: 52, climate: 38, cyber: 65 },
  { month: 'Nov', geopolitical: 74, economic: 61, climate: 42, cyber: 78 },
  { month: 'Dec', geopolitical: 69, economic: 55, climate: 47, cyber: 82 },
  { month: 'Jan', geopolitical: 83, economic: 67, climate: 52, cyber: 76 },
  { month: 'Feb', geopolitical: 77, economic: 71, climate: 58, cyber: 88 },
  { month: 'Mar', geopolitical: 91, economic: 74, climate: 63, cyber: 84 },
];

const tooltipStyle = {
  backgroundColor: 'rgba(8, 16, 30, 0.97)',
  border: '1px solid rgba(200, 168, 74, 0.15)',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ color: '#7a8fa8', fontSize: '0.7rem', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.06em' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color, flexShrink: 0 }} />
          <span style={{ color: '#3a4e62', fontSize: '0.68rem' }}>{entry.name}:</span>
          <span style={{ color: entry.color, fontSize: '0.68rem', fontFamily: 'var(--font-geist-mono)', fontWeight: 700 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function GlobalRiskChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={globalRiskData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <defs>
          <linearGradient id="geo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#b84a4a" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#b84a4a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="eco" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c8a84a" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#c8a84a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cli" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3eb87a" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3eb87a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="cyb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8a78c8" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#8a78c8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(200,168,74,0.07)" />
        <XAxis dataKey="month" tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="geopolitical" stroke="#b84a4a" strokeWidth={1.5} fill="url(#geo)" name="Geopolitical" />
        <Area type="monotone" dataKey="economic" stroke="#c8a84a" strokeWidth={1.5} fill="url(#eco)" name="Economic" />
        <Area type="monotone" dataKey="climate" stroke="#3eb87a" strokeWidth={1.5} fill="url(#cli)" name="Climate" />
        <Area type="monotone" dataKey="cyber" stroke="#8a78c8" strokeWidth={1.5} fill="url(#cyb)" name="Cyber" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const entityData = [
  { name: 'State Actors', value: 1847 },
  { name: 'NGOs', value: 932 },
  { name: 'Corps', value: 2341 },
  { name: 'Events', value: 5621 },
  { name: 'Policies', value: 1204 },
  { name: 'Persons', value: 3892 },
];

export function EntityBarChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={entityData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(200,168,74,0.07)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#7a8fa8', fontSize: 11 }} itemStyle={{ color: '#c8a84a', fontSize: 11 }} />
        <Bar dataKey="value" fill="#c8a84a" radius={[3, 3, 0, 0]} opacity={0.75} name="Entities" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const sentimentData = [
  { date: '03/06', positive: 42, neutral: 35, negative: 23 },
  { date: '03/07', positive: 38, neutral: 37, negative: 25 },
  { date: '03/08', positive: 44, neutral: 31, negative: 25 },
  { date: '03/09', positive: 35, neutral: 33, negative: 32 },
  { date: '03/10', positive: 29, neutral: 34, negative: 37 },
  { date: '03/11', positive: 31, neutral: 30, negative: 39 },
  { date: '03/12', positive: 28, neutral: 32, negative: 40 },
];

export function SentimentChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={sentimentData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }} stackOffset="expand">
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(200,168,74,0.07)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#3a4e62', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#7a8fa8', fontSize: 11 }}
          formatter={(v: any, name: any) => [`${(v * 100).toFixed(1)}%`, name]}
        />
        <Bar dataKey="positive" stackId="a" fill="#3eb87a" opacity={0.75} name="Positive" />
        <Bar dataKey="neutral" stackId="a" fill="#4a6070" opacity={0.75} name="Neutral" />
        <Bar dataKey="negative" stackId="a" fill="#b84a4a" opacity={0.75} name="Negative" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const throughputData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  events: Math.floor(Math.random() * 80000 + 40000),
  processed: Math.floor(Math.random() * 70000 + 35000),
}));

export function ThroughputChart() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={throughputData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(200,168,74,0.07)" />
        <XAxis dataKey="hour" tick={{ fill: '#2a3d52', fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
        <YAxis tick={{ fill: '#2a3d52', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: '#7a8fa8', fontSize: 11 }}
          formatter={(v: any) => [v.toLocaleString(), '']}
        />
        <Line type="monotone" dataKey="events" stroke="#c8a84a" strokeWidth={1.5} dot={false} name="Ingested" />
        <Line type="monotone" dataKey="processed" stroke="#5b8db8" strokeWidth={1.5} dot={false} name="Processed" strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
