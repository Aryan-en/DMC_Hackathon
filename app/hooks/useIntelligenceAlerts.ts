import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

export interface IntelligenceAlert {
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  region: string;
  title: string;
  confidence: number;
}

export interface AlertsData {
  alerts: IntelligenceAlert[];
  total_count: number;
  critical_count: number;
  high_count: number;
}

const DEFAULT_ALERTS_DATA: AlertsData = {
  alerts: [],
  total_count: 0,
  critical_count: 0,
  high_count: 0,
};

export function useIntelligenceAlerts() {
  const [data, setData] = useState<AlertsData>(DEFAULT_ALERTS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const result = await apiGet<any>('/api/intelligence/live-alerts');
        if (result && result.success && result.data) {
          setData(result.data);
        } else if (result && result.data) {
          setData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        setData(DEFAULT_ALERTS_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    
    // Refresh alerts every 10 seconds for live updates
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
