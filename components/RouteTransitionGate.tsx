'use client';

import { useEffect, useState } from 'react';
import RouteLoadingScreen from '@/components/RouteLoadingScreen';

const MIN_ROUTE_SPLASH_MS = 2300;

export default function RouteTransitionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), MIN_ROUTE_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return <RouteLoadingScreen />;
  }

  return <>{children}</>;
}
