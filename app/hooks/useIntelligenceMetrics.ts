'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import { canonicalizeEntityLabel } from '@/app/lib/entity-canonical';

type ExtractedEntity = {
  entity: string;
  type: string;
  confidence: number;
  mentions: number;
  url?: string | null;
};

type LanguageDistribution = {
  lang: string;
  doc_count: number;
  percentage: number;
};

type TrendingKeyword = {
  keyword: string;
  velocity: number;
  delta: string;
  type: string;
};

type SentimentRadarPoint = {
  subject: string;
  score: number;
  fullMark: number;
  documents?: number;
  sources?: number;
};

type RadarIntegrity = {
  window_hours: number;
  dimensions: string[];
  debiased: boolean;
};

type StrategicBrief = {
  title: string;
  summary: string;
  classification: string;
  model: string;
  confidence: number;
  dateGen: string | null;
  url?: string | null;
};

type PipelineModel = {
  name: string;
  version: string;
  status: string;
  infer: string;
  gpu: string;
};

type MEARelation = {
  country_pair: string;
  status: string;
  key_issues: string[];
  confidence: number;
  intelligence_priority: string;
  url?: string | null;
};

type RegionalHotspot = {
  region: string;
  countries_involved: string[];
  tension_level: string;
  intelligence_assessment: string;
  strategic_importance: string;
  url?: string | null;
};

type StrategicSummary = {
  total_bilateral_relations: number;
  mea_documents_ingested: number;
  countries_covered: number;
  data_classification: string;
  primary_source: string;
  analysis_confidence: number;
};

type ClimateRegion = {
  region: string;
  risk_level: string;
  temp_change: number;
  drought_threat: string;
  flood_threat: string;
  crop_risk: number;
  geopolitical_impact: string;
  strategic_concern: string;
};

type IntelligenceMetrics = {
  entities: ExtractedEntity[];
  languages: LanguageDistribution[];
  keywords: TrendingKeyword[];
  sentimentRadar: SentimentRadarPoint[];
  briefs: StrategicBrief[];
  models: PipelineModel[];
  climateRegions: ClimateRegion[];
  radarIntegrity?: RadarIntegrity;
  meaSummary?: StrategicSummary;
  meaRelations?: MEARelation[];
  regionalHotspots?: RegionalHotspot[];
};

function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item, index) => {
    const raw = getKey(item).trim();
    const key = raw || `__idx_${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fallback sample data
const SAMPLE_ENTITIES: ExtractedEntity[] = [
  { entity: 'United Nations', type: 'ORG', confidence: 0.97, mentions: 1842, url: null },
  { entity: 'European Union', type: 'ORG', confidence: 0.96, mentions: 1567, url: null },
  { entity: 'South China Sea', type: 'LOC', confidence: 0.94, mentions: 1203, url: null },
  { entity: 'NATO', type: 'ORG', confidence: 0.95, mentions: 1089, url: null },
  { entity: 'Vladimir Putin', type: 'PER', confidence: 0.98, mentions: 956, url: null },
  { entity: 'Belt and Road Initiative', type: 'EVENT', confidence: 0.91, mentions: 823, url: null },
];

const SAMPLE_LANGUAGES: LanguageDistribution[] = [
  { lang: 'English', doc_count: 45200, percentage: 52.3 },
  { lang: 'Mandarin', doc_count: 12800, percentage: 14.8 },
  { lang: 'Arabic', doc_count: 8900, percentage: 10.3 },
  { lang: 'French', doc_count: 6200, percentage: 7.2 },
  { lang: 'Russian', doc_count: 5100, percentage: 5.9 },
  { lang: 'Hindi', doc_count: 4300, percentage: 5.0 },
  { lang: 'Other', doc_count: 3900, percentage: 4.5 },
];

const SAMPLE_KEYWORDS: TrendingKeyword[] = [
  { keyword: 'sanctions', velocity: 2.4, delta: '+18%', type: 'policy' },
  { keyword: 'cybersecurity', velocity: 1.9, delta: '+12%', type: 'security' },
  { keyword: 'energy transition', velocity: 1.7, delta: '+9%', type: 'economic' },
  { keyword: 'AI governance', velocity: 1.5, delta: '+15%', type: 'technology' },
  { keyword: 'climate adaptation', velocity: 1.3, delta: '+7%', type: 'environment' },
];

const SAMPLE_SENTIMENT_RADAR: SentimentRadarPoint[] = [
  { subject: 'Trade Relations', score: 65, fullMark: 100 },
  { subject: 'Military Tensions', score: 78, fullMark: 100 },
  { subject: 'Diplomatic Progress', score: 42, fullMark: 100 },
  { subject: 'Economic Stability', score: 58, fullMark: 100 },
  { subject: 'Humanitarian Issues', score: 71, fullMark: 100 },
  { subject: 'Technology Rivalry', score: 83, fullMark: 100 },
];

const SAMPLE_BRIEFS: StrategicBrief[] = [
  { title: 'Indo-Pacific Security Assessment', summary: 'Comprehensive analysis of shifting power dynamics in the Indo-Pacific region, with focus on maritime disputes and alliance structures.', classification: 'SECRET', model: 'llama3', confidence: 0.89, dateGen: '2026-03-21' },
  { title: 'Global Supply Chain Vulnerabilities', summary: 'Assessment of critical chokepoints in global supply chains with focus on semiconductor and rare earth mineral dependencies.', classification: 'FOUO', model: 'llama3', confidence: 0.92, dateGen: '2026-03-20' },
];

const SAMPLE_MODELS: PipelineModel[] = [
  { name: 'NER-Multilingual', version: 'v3.2', status: 'active', infer: '45ms', gpu: 'A100 40GB' },
  { name: 'Sentiment-BERT', version: 'v2.1', status: 'active', infer: '32ms', gpu: 'A100 40GB' },
  { name: 'Topic-Classifier', version: 'v1.8', status: 'active', infer: '28ms', gpu: 'T4 16GB' },
  { name: 'Translation-Engine', version: 'v4.0', status: 'warming', infer: '120ms', gpu: 'A100 80GB' },
];

const SAMPLE_CLIMATE_REGIONS: ClimateRegion[] = [
  {
    region: 'South Asia Plains',
    risk_level: 'CRITICAL',
    temp_change: 2.5,
    drought_threat: 'HIGH',
    flood_threat: 'CRITICAL',
    crop_risk: 79,
    geopolitical_impact: 'High - Monsoon failures affect food security in India, Bangladesh',
    strategic_concern: 'Agricultural instability leads to migration and regional tensions',
  },
  {
    region: 'Ganges Valley',
    risk_level: 'CRITICAL',
    temp_change: 2.7,
    drought_threat: 'HIGH',
    flood_threat: 'CRITICAL',
    crop_risk: 84,
    geopolitical_impact: 'Critical - Supports 400M+ people across India, Bangladesh, Nepal',
    strategic_concern: 'Water stress conflicts over Ganges river sharing agreements',
  },
  {
    region: 'Himalayan Region',
    risk_level: 'HIGH',
    temp_change: 3.2,
    drought_threat: 'HIGH',
    flood_threat: 'HIGH',
    crop_risk: 78,
    geopolitical_impact: 'High - Glacial melt impacts water supply for 2B+ people',
    strategic_concern: 'Transnational water disputes (India-China, India-Pakistan)',
  },
];

let _cachedIntelData: IntelligenceMetrics | null = null;
let _lastIntelFetch: number = 0;
const INTEL_CACHE_TTL = 30000;

export function useIntelligenceMetrics() {
  const [data, setData] = useState<IntelligenceMetrics>(() => {
    if (_cachedIntelData) return _cachedIntelData;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ontora_intelligence_metrics');
      if (saved) return JSON.parse(saved);
    }
    return {
      entities: SAMPLE_ENTITIES,
      languages: SAMPLE_LANGUAGES,
      keywords: SAMPLE_KEYWORDS,
      sentimentRadar: SAMPLE_SENTIMENT_RADAR,
      briefs: SAMPLE_BRIEFS,
      models: SAMPLE_MODELS,
      climateRegions: SAMPLE_CLIMATE_REGIONS,
    };
  });
  const [loading, setLoading] = useState(!_cachedIntelData && data.entities === SAMPLE_ENTITIES);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;

    async function load(force = false) {
      if (!force && _cachedIntelData && (Date.now() - _lastIntelFetch < INTEL_CACHE_TTL)) {
        if (loading) setLoading(false);
        return;
      }

      const isInitial = data.entities === SAMPLE_ENTITIES;
      if (active && isInitial) setLoading(true);
      try {
        const modeFromUrl =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('pipelineMode')
            : null;
        const modeFromEnv = process.env.NEXT_PUBLIC_PIPELINE_STATUS_MODE || null;
        const pipelineMode =
          modeFromUrl === 'strict-real-metrics' || modeFromUrl === 'force-running'
            ? modeFromUrl
            : modeFromEnv === 'strict-real-metrics' || modeFromEnv === 'force-running'
              ? modeFromEnv
              : 'force-running';

        const [entityRes, languageRes, keywordRes, sentimentRes, briefsRes, modelsRes, climateRes, meaRes] = await Promise.allSettled([
          apiGet<{ entities: ExtractedEntity[] }>('/api/intelligence/entity-extraction'),
          apiGet<{ languages: LanguageDistribution[] }>('/api/intelligence/language-distribution'),
          apiGet<{ keywords: TrendingKeyword[] }>('/api/intelligence/trending-keywords'),
          apiGet<{ radar: SentimentRadarPoint[]; integrity?: RadarIntegrity }>('/api/intelligence/sentiment-radar'),
          apiGet<{ briefs: StrategicBrief[] }>('/api/intelligence/strategic-briefs'),
          apiGet<{ models: PipelineModel[] }>(`/api/intelligence/pipeline-status?mode=${pipelineMode}`),
          apiGet<{ regions: ClimateRegion[] }>('/api/intelligence/climate-intelligence'),
          apiGet<{ summary: StrategicSummary; key_relations: MEARelation[]; regional_hotspots: RegionalHotspot[] }>('/api/intelligence/mea-strategic-relations'),
        ]);

        if (!active) return;

        // Handle each response individually for resilience
        const entitiesRaw = entityRes.status === 'fulfilled' && entityRes.value?.entities ? entityRes.value.entities : SAMPLE_ENTITIES;
        const languagesRaw = languageRes.status === 'fulfilled' && languageRes.value?.languages ? languageRes.value.languages : SAMPLE_LANGUAGES;
        const keywordsRaw = keywordRes.status === 'fulfilled' && keywordRes.value?.keywords ? keywordRes.value.keywords : SAMPLE_KEYWORDS;
        const briefsRaw = briefsRes.status === 'fulfilled' && briefsRes.value?.briefs ? briefsRes.value.briefs : SAMPLE_BRIEFS;
        const modelsRaw = modelsRes.status === 'fulfilled' && modelsRes.value?.models ? modelsRes.value.models : SAMPLE_MODELS;
        const climateRegionsRaw = climateRes.status === 'fulfilled' && climateRes.value?.regions ? climateRes.value.regions : SAMPLE_CLIMATE_REGIONS;

        const newData: IntelligenceMetrics = {
          entities: dedupeByKey(
            entitiesRaw.map((item) => ({ ...item, entity: canonicalizeEntityLabel(item.entity) })),
            (item) => `${item.entity}|${item.type}`
          ),
          languages: dedupeByKey(languagesRaw, (item) => item.lang),
          keywords: dedupeByKey(keywordsRaw, (item) => item.keyword),
          sentimentRadar: sentimentRes.status === 'fulfilled' && sentimentRes.value?.radar ? sentimentRes.value.radar : SAMPLE_SENTIMENT_RADAR,
          briefs: dedupeByKey(briefsRaw, (item) => `${item.title}|${item.dateGen ?? ''}`),
          models: dedupeByKey(modelsRaw, (item) => item.name),
          climateRegions: dedupeByKey(climateRegionsRaw, (item) => item.region),
          radarIntegrity: sentimentRes.status === 'fulfilled' ? sentimentRes.value?.integrity : undefined,
          meaSummary: meaRes.status === 'fulfilled' && meaRes.value?.summary ? meaRes.value.summary : undefined,
          meaRelations: meaRes.status === 'fulfilled' && meaRes.value?.key_relations ? meaRes.value.key_relations : undefined,
          regionalHotspots: meaRes.status === 'fulfilled' && meaRes.value?.regional_hotspots ? meaRes.value.regional_hotspots : undefined,
        };

        _cachedIntelData = newData;
        _lastIntelFetch = Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem('ontora_intelligence_metrics', JSON.stringify(newData));
        }
        setData(newData);

        // Only show error if all endpoints failed
        const allFailed = [entityRes, languageRes, keywordRes, sentimentRes, briefsRes, modelsRes, climateRes, meaRes].every(
          (r) => r.status === 'rejected'
        );
        setError(allFailed ? 'Live intelligence data unavailable - displaying sample data' : null);
      } catch (err) {
        if (!active) return;
        // Use sample data as fallback
        setData({
          entities: SAMPLE_ENTITIES,
          languages: SAMPLE_LANGUAGES,
          keywords: SAMPLE_KEYWORDS,
          sentimentRadar: SAMPLE_SENTIMENT_RADAR,
          briefs: SAMPLE_BRIEFS,
          models: SAMPLE_MODELS,
          climateRegions: SAMPLE_CLIMATE_REGIONS,
          radarIntegrity: undefined,
          meaSummary: undefined,
          meaRelations: undefined,
          regionalHotspots: undefined,
        });
        setError(err instanceof Error ? err.message : 'Failed to load intelligence metrics - using sample data');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadTick]);

  return {
    data,
    loading,
    error,
    refresh: () => setReloadTick((prev) => prev + 1),
  };
}
