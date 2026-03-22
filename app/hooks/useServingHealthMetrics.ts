import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';

interface ServingHealthDataPoint {
  timestamp: string;
  latency_ms: number;
  requests_per_min: number;
  error_rate_pct: number;
  uptime_pct: number;
}

interface ServingHealthHistory {
  data: ServingHealthDataPoint[];
}

const MAX_DATA_POINTS = 24; // Keep last 2 minutes of data (24 * 5 sec)

export function useServingHealthMetrics() {
  const [history, setHistory] = useState<ServingHealthHistory>({ data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndUpdateHistory = async () => {
      try {
        const result = await apiGet<any>('/api/predictions/serving-health');

        if (!isMounted) return;

        console.log('Serving health response:', result);

        if (result && typeof result === 'object') {
          const newPoint: ServingHealthDataPoint = {
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            latency_ms: result.latency_ms || 0,
            requests_per_min: result.requests_per_min || 0,
            error_rate_pct: result.error_rate_pct || 0,
            uptime_pct: result.uptime_pct || 0,
          };

          // Add new point and keep only the latest MAX_DATA_POINTS
          setHistory((prev) => {
            const updated = [...prev.data, newPoint];
            if (updated.length > MAX_DATA_POINTS) {
              updated.shift();
            }
            console.log('Updated history:', updated);
            return { data: updated };
          });

          setLoading(false);
          setError(null);
        } else {
          setError('Invalid response format');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching serving health:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch serving health data');
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchAndUpdateHistory();

    // Set up polling interval (every 5 seconds to match predictions hook)
    const interval = setInterval(fetchAndUpdateHistory, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { history, loading, error };
}
