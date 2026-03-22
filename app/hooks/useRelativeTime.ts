'use client';

import { useState, useEffect } from 'react';

/**
 * Hook that safely formats relative timestamps without hydration mismatches.
 * Returns the placeholder during SSR and updates to actual time on client only.
 */
export function useRelativeTime(isoTs: string, placeholder: string = 'T-00:00') {
  const [mounted, setMounted] = useState(false);
  const [relativeTime, setRelativeTime] = useState(placeholder);

  useEffect(() => {
    setMounted(true);

    const calculateRelative = () => {
      const parsed = new Date(isoTs).getTime();
      if (!Number.isFinite(parsed)) {
        setRelativeTime('T-unknown');
        return;
      }

      const diffMs = Date.now() - parsed;
      const mins = Math.max(0, Math.floor(diffMs / 60000));

      if (mins < 60) {
        const secs = Math.max(0, Math.floor((diffMs % 60000) / 1000));
        setRelativeTime(`T-${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        const hrs = Math.floor(mins / 60);
        const rem = mins % 60;
        setRelativeTime(`T-${String(hrs).padStart(2, '0')}:${String(rem).padStart(2, '0')}`);
      }
    };

    // Calculate immediately
    calculateRelative();

    // Update every second
    const interval = setInterval(calculateRelative, 1000);
    return () => clearInterval(interval);
  }, [isoTs]);

  return relativeTime;
}
