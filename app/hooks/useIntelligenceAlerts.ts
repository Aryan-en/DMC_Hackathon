import { useEffect, useState } from 'react';

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
        const response = await fetch('/api/intelligence/live-alerts');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        if (result.success && result.data) {
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
