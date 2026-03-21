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

export function useIntelligenceMetrics() {
  const [data, setData] = useState<IntelligenceMetrics>({
    entities: [],
    languages: [],
    keywords: [],
    sentimentRadar: [],
    briefs: [],
    models: [],
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
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load intelligence metrics');
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
