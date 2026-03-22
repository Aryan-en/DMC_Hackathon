'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

type ExtractedEntity = {
  entity: string;
  type: string;
  confidence: number;
  mentions: number;
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
};

type StrategicBrief = {
  title: string;
  summary: string;
  classification: string;
  model: string;
  confidence: number;
  dateGen: string | null;
};

type PipelineModel = {
  name: string;
  version: string;
  status: string;
  infer: string;
  gpu: string;
};

type IntelligenceMetrics = {
  entities: ExtractedEntity[];
  languages: LanguageDistribution[];
  keywords: TrendingKeyword[];
  sentimentRadar: SentimentRadarPoint[];
  briefs: StrategicBrief[];
  models: PipelineModel[];
};

// Fallback sample data
const SAMPLE_ENTITIES: ExtractedEntity[] = [
  { entity: 'United Nations', type: 'ORG', confidence: 0.97, mentions: 1842 },
  { entity: 'European Union', type: 'ORG', confidence: 0.96, mentions: 1567 },
  { entity: 'South China Sea', type: 'LOC', confidence: 0.94, mentions: 1203 },
  { entity: 'NATO', type: 'ORG', confidence: 0.95, mentions: 1089 },
  { entity: 'Vladimir Putin', type: 'PER', confidence: 0.98, mentions: 956 },
  { entity: 'Belt and Road Initiative', type: 'EVENT', confidence: 0.91, mentions: 823 },
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

export function useIntelligenceMetrics() {
  const [data, setData] = useState<IntelligenceMetrics>({
    entities: SAMPLE_ENTITIES,
    languages: SAMPLE_LANGUAGES,
    keywords: SAMPLE_KEYWORDS,
    sentimentRadar: SAMPLE_SENTIMENT_RADAR,
    briefs: SAMPLE_BRIEFS,
    models: SAMPLE_MODELS,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [entityRes, languageRes, keywordRes, sentimentRes, briefsRes, modelsRes] = await Promise.all([
          apiGet<{ entities: ExtractedEntity[] }>('/api/intelligence/entity-extraction'),
          apiGet<{ languages: LanguageDistribution[] }>('/api/intelligence/language-distribution'),
          apiGet<{ keywords: TrendingKeyword[] }>('/api/intelligence/trending-keywords'),
          apiGet<{ radar: SentimentRadarPoint[] }>('/api/intelligence/sentiment-radar'),
          apiGet<{ briefs: StrategicBrief[] }>('/api/intelligence/strategic-briefs'),
          apiGet<{ models: PipelineModel[] }>('/api/intelligence/pipeline-status'),
        ]);

        if (!active) return;
        setData({
          entities: entityRes.entities,
          languages: languageRes.languages,
          keywords: keywordRes.keywords,
          sentimentRadar: sentimentRes.radar,
          briefs: briefsRes.briefs,
          models: modelsRes.models,
        });
        setError(null);
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
  }, []);

  return { data, loading, error };
}
