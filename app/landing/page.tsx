'use client';

import { useRouter } from 'next/navigation';
import {
  Globe,
  Activity,
  Share2,
  Brain,
  AlertTriangle,
  Database,
  Shield,
  Zap,
  Radio,
  Map,
  BarChart3,
  Lightbulb,
  TrendingUp,
  Network,
  Waves,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import OntoraLogo from '@/components/OntoraLogo';

interface FeatureCard {
  icon: any;
  title: string;
  description: string;
  color: string;
  features: string[];
}

const features: FeatureCard[] = [
  {
    icon: Globe,
    title: 'Geospatial Intelligence',
    description: 'Real-time geographic analysis and hotspot detection across global regions',
    color: '#00d4ff',
    features: [
      'Climate Impact Indicators',
      'Incident Mapping & Visualization',
      'Economic Activity Tracking',
      'Hotspot Detection & Alerts',
      'Multi-layer Geographic Analysis',
    ],
  },
  {
    icon: Activity,
    title: 'Metrics & Analytics',
    description: 'Comprehensive dashboard for monitoring global risk metrics and performance',
    color: '#3eb87a',
    features: [
      'Regional Risk Assessment',
      'Global Entity Tracking (16M+)',
      'Threat Thread Analysis',
      'Daily Ingestion Reports',
      'Infrastructure Health Monitoring',
      'Prediction Accuracy Metrics',
    ],
  },
  {
    icon: Brain,
    title: 'Intelligence Processing',
    description: 'Advanced NLP and entity extraction from global intelligence sources',
    color: '#8a78c8',
    features: [
      'Document Processing (News, Official, Social)',
      'AI Entity Extraction',
      'Language Distribution Analysis',
      'Trending Keywords Detection',
      'Sentiment Analysis Radar',
      'Strategic Briefs Generation',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Conflict Prediction Models',
    description: 'ML-powered prediction engine for identifying emerging conflict risks',
    color: '#b84a4a',
    features: [
      'Conflict Risk Forecasting',
      'Model Performance Monitoring',
      'Model Drift Detection',
      'Training Status Tracking',
      'PyG-GCN Integration',
      'Real-time Predictions',
    ],
  },
  {
    icon: Network,
    title: 'Knowledge Graph Engine',
    description: 'Neo4j-based ontology for entity relationships and connections',
    color: '#c8822a',
    features: [
      'Node Management & Relationships',
      'SHACL Validation Rules',
      'Conflict Detection in Graphs',
      'Centrality Analytics',
      'Entity Relationship Visualization',
      'Ontology Management',
    ],
  },
  {
    icon: Database,
    title: 'Data Lake Integration',
    description: 'Centralized repository for raw and processed intelligence data',
    color: '#5b8db8',
    features: [
      'Data Repository Management',
      'Dataset Organization',
      'Historical Data Access',
      'Data Lineage Tracking',
      'Query & Analytics',
      'Version Control',
    ],
  },
  {
    icon: Waves,
    title: 'Real-Time Data Streams',
    description: 'Kafka-based real-time streaming and processing of intelligence feeds',
    color: '#67e8f9',
    features: [
      'Kafka Topic Management (9092-9094)',
      'Stream Pipeline Orchestration',
      'Real-time Monitoring',
      'High-Throughput Processing',
      'Event Streaming',
      'Pipeline Health Tracking',
    ],
  },
  {
    icon: FileText,
    title: 'Bill & Document Analysis',
    description: 'Automated legislative bill analysis and document processing',
    color: '#3eb87a',
    features: [
      'Legislative Bill Processing',
      'Automated Analysis Engine',
      'Bill Status Tracking',
      'Analysis History & Reports',
      'Impact Assessment',
      'Document Classification',
    ],
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Comprehensive security monitoring and compliance audit trails',
    color: '#b84a4a',
    features: [
      'Security Monitoring Dashboard',
      'Comprehensive Audit Logging',
      'Violation Tracking & Alerts',
      'Compliance Reporting',
      'Access Control Management',
      'FIPS-Compliant Architecture',
    ],
  },
];

interface DashboardItem {
  name: string;
  path: string;
  icon: any;
  description: string;
  color: string;
}

const dashboards: DashboardItem[] = [
  {
    name: 'Strategic Overview',
    path: '/',
    icon: Globe,
    description: 'Main intelligence command dashboard',
    color: '#00d4ff',
  },
  {
    name: 'Geospatial Analytics',
    path: '/geospatial',
    icon: Map,
    description: 'Geographic analysis and incident mapping',
    color: '#00d4ff',
  },
  {
    name: 'Knowledge Graph',
    path: '/knowledge-graph',
    icon: Network,
    description: 'Entity relationships and connections',
    color: '#c8822a',
  },
  {
    name: 'Intelligence Processing',
    path: '/intelligence',
    icon: Brain,
    description: 'NLP and entity extraction analysis',
    color: '#8a78c8',
  },
  {
    name: 'Conflict Predictions',
    path: '/predictions',
    icon: TrendingUp,
    description: 'ML-powered conflict forecasting',
    color: '#b84a4a',
  },
  {
    name: 'Data Lake',
    path: '/data-lake',
    icon: Database,
    description: 'Centralized data repository',
    color: '#5b8db8',
  },
  {
    name: 'Data Streams & Pipelines',
    path: '/data-streams',
    icon: Waves,
    description: 'Real-time data processing',
    color: '#67e8f9',
  },
  {
    name: 'Bill Analysis',
    path: '/bill-analysis',
    icon: FileText,
    description: 'Legislative document analysis',
    color: '#3eb87a',
  },
  {
    name: 'Security Monitoring',
    path: '/security',
    icon: Shield,
    description: 'Security and compliance tracking',
    color: '#b84a4a',
  },
];

export default function LandingPage() {
  const router = useRouter();

  const handleLogin = () => {
    // Redirect to login page
    router.push('/login');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'radial-gradient(circle at 15% 10%, rgba(138,120,200,0.18) 0%, transparent 35%), radial-gradient(circle at 85% 85%, rgba(91,70,160,0.16) 0%, transparent 38%), linear-gradient(180deg, #0b0a18 0%, #120f2a 45%, #1a1538 100%)',
      }}
    >
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md" style={{ borderBottom: '1px solid rgba(200,168,74,0.16)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push('/landing')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="p-1 rounded-lg">
              <OntoraLogo size={32} />
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: '#dce4ee', letterSpacing: '0.05em' }}>
                ONTORA
              </h1>
              <p className="text-xs" style={{ color: '#9a8d72' }}>
                Intelligence Platform
              </p>
            </div>
          </button>
          <button
            onClick={handleLogin}
            className="px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #12315b 0%, #0b1e3d 100%)',
              color: '#d6b985',
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              border: '1px solid rgba(200,168,74,0.35)',
            }}
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(200,168,74,0.1)', border: '1px solid rgba(200,168,74,0.28)' }}>
            <span className="w-2 h-2 rounded-full live-indicator" style={{ background: '#3eb87a' }} />
            <span style={{ color: '#d6b985', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
              SECURE • OPERATIONAL
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: '#dce4ee' }}>
            Global Intelligence &<br/><span style={{ background: 'linear-gradient(135deg, #e4c98e, #c8a84a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ontology Analysis</span>
          </h1>

          <p className="text-lg mb-10" style={{ color: '#7a8fa8', maxWidth: '600px', lineHeight: 1.6 }}>
            Enterprise intelligence platform for geospatial analysis, entity extraction, conflict prediction, and real-time knowledge graph processing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={handleLogin}
              className="px-8 py-3.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #12315b 0%, #0b1e3d 100%)',
                color: '#d6b985',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
                border: '1px solid rgba(200,168,74,0.35)',
              }}
            >
              Access Platform
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3.5 rounded-lg font-semibold transition-all"
              style={{
                background: 'rgba(16, 43, 81, 0.9)',
                border: '1px solid rgba(200,168,74,0.35)',
                color: '#d6b985',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
              }}
            >
              Learn More
            </button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: '16M+', value: 'Entities' },
              { label: '216', value: 'Nations' },
              { label: '99.7%', value: 'Uptime' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-4"
                style={{ borderBottom: '1px solid rgba(200,168,74,0.22)' }}
              >
                <div className="text-2xl font-bold" style={{ color: '#d6b985', marginBottom: '4px' }}>
                  {stat.label}
                </div>
                <div style={{ color: '#7a8fa8', fontSize: '0.875rem' }}>{stat.value} Tracked</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6" style={{ borderTop: '1px solid rgba(200,168,74,0.16)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-3" style={{ color: '#dce4ee' }}>
              Core Capabilities
            </h2>
            <p style={{ color: '#7a8fa8', fontSize: '1rem' }}>
              Nine integrated modules for comprehensive intelligence analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-lg transition-all glass-card"
                  style={{
                    border: `1px solid ${feature.color}22`,
                  }}
                >
                  <div className="mb-4 inline-block p-2 rounded-lg" style={{ background: `${feature.color}15` }}>
                    <Icon size={24} style={{ color: feature.color }} />
                  </div>

                  <h3 className="text-lg font-semibold mb-2" style={{ color: '#dce4ee' }}>
                    {feature.title}
                  </h3>

                  <p className="mb-4 text-sm" style={{ color: '#7a8fa8', lineHeight: 1.5 }}>
                    {feature.description}
                  </p>

                  <div className="space-y-1.5 pt-4" style={{ borderTop: '1px solid rgba(200,168,74,0.14)' }}>
                    {feature.features.slice(0, 3).map((feat, fidx) => (
                      <div key={fidx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ background: feature.color, flexShrink: 0 }} />
                        <span style={{ color: '#7a8fa8', fontSize: '0.8rem' }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dashboards Section */}
      <section className="py-20 px-6" style={{ background: 'rgba(200,168,74,0.04)', borderTop: '1px solid rgba(200,168,74,0.16)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-3" style={{ color: '#dce4ee' }}>
              Available Dashboards
            </h2>
            <p style={{ color: '#7a8fa8', fontSize: '1rem' }}>
              Access specialized views for each intelligence module
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboards.map((dashboard, idx) => {
              const Icon = dashboard.icon;
              return (
                <button
                  key={idx}
                  onClick={() => router.push(dashboard.path)}
                  className="p-5 rounded-lg transition-all text-left glass-card"
                  style={{
                    border: `1px solid ${dashboard.color}22`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg" style={{ background: `${dashboard.color}15` }}>
                      <Icon size={20} style={{ color: dashboard.color }} />
                    </div>
                  </div>

                  <h3 className="font-semibold mb-1" style={{ color: '#dce4ee', fontSize: '0.95rem' }}>
                    {dashboard.name}
                  </h3>

                  <p style={{ color: '#7a8fa8', fontSize: '0.8rem' }}>
                    {dashboard.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(200,168,74,0.16)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold" style={{ color: '#dce4ee' }}>
              Why ONTARA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'AI-Powered', description: 'Advanced entity extraction and threat analysis', icon: Brain, color: '#60a5fa' },
              { title: 'Real-Time', description: 'Immediate insights on global intelligence', icon: Zap, color: '#60a5fa' },
              { title: 'Knowledge Graph', description: 'Neo4j-based entity relationships', icon: Network, color: '#3b82f6' },
              { title: 'Geospatial', description: 'Multi-layer geographic analysis', icon: Globe, color: '#60a5fa' },
              { title: 'Predictive', description: 'ML-based conflict forecasting', icon: TrendingUp, color: '#3b82f6' },
              { title: 'Enterprise Security', description: 'FIPS-compliant with audit trails', icon: Shield, color: '#3b82f6' },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex gap-4 p-5 rounded-lg glass-card" style={{ border: '1px solid rgba(0,212,255,0.12)' }}>
                  <div className="shrink-0">
                    <div className="p-2 rounded-lg" style={{ background: `${item.color}15` }}>
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1" style={{ color: '#dce4ee', fontSize: '0.95rem' }}>
                      {item.title}
                    </h3>
                    <p style={{ color: '#7a8fa8', fontSize: '0.85rem' }}>{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6" style={{ borderTop: '1px solid rgba(200,168,74,0.16)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4" style={{ color: '#dce4ee' }}>
            Ready to Begin?
          </h2>

          <p className="mb-8" style={{ color: '#7a8fa8', fontSize: '1rem', lineHeight: 1.6 }}>
            Access all nine intelligence dashboards and start monitoring global threats in real time.
          </p>

          <button
            onClick={handleLogin}
            className="px-10 py-4 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #12315b 0%, #0b1e3d 100%)',
              color: '#d6b985',
              fontSize: '0.95rem',
              letterSpacing: '0.04em',
              border: '1px solid rgba(200,168,74,0.35)',
            }}
          >
            Sign In to Platform
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(200,168,74,0.16)', background: 'rgba(200,168,74,0.04)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#dce4ee', fontSize: '0.9rem' }}>
                Platform
              </h4>
              <ul className="space-y-2">
                {dashboards.slice(0, 2).map((d, i) => (
                  <li key={i}>
                    <button
                      onClick={() => router.push(d.path)}
                      style={{ color: '#7a8fa8' }}
                      className="hover:text-white transition-colors text-sm"
                    >
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#dce4ee', fontSize: '0.9rem' }}>
                Analysis
              </h4>
              <ul className="space-y-2">
                {dashboards.slice(2, 4).map((d, i) => (
                  <li key={i}>
                    <button
                      onClick={() => router.push(d.path)}
                      style={{ color: '#7a8fa8' }}
                      className="hover:text-white transition-colors text-sm"
                    >
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#dce4ee', fontSize: '0.9rem' }}>
                Infrastructure
              </h4>
              <ul className="space-y-2">
                {dashboards.slice(4, 6).map((d, i) => (
                  <li key={i}>
                    <button
                      onClick={() => router.push(d.path)}
                      style={{ color: '#7a8fa8' }}
                      className="hover:text-white transition-colors text-sm"
                    >
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: '#dce4ee', fontSize: '0.9rem' }}>
                Security
              </h4>
              <ul className="space-y-2">
                {dashboards.slice(6).map((d, i) => (
                  <li key={i}>
                    <button
                      onClick={() => router.push(d.path)}
                      style={{ color: '#7a8fa8' }}
                      className="hover:text-white transition-colors text-sm"
                    >
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-8 text-center"
            style={{
              borderTop: '1px solid rgba(200,168,74,0.16)',
              color: '#7a8fa8',
              fontSize: '0.8rem',
            }}
          >
            <p>© 2026 ONTORA Intelligence Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
