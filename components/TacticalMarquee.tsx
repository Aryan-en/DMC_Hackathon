'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TacticalMarqueeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * TacticalMarquee - A smart overflow reveal component.
 * Only applies the "slide-on-hover" marquee effect if the content
 * actually overflows the parent container's width.
 */
export const TacticalMarquee: React.FC<TacticalMarqueeProps> = ({ children, className = '' }) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      const el = containerRef.current;
      if (el) {
        const textEl = el.querySelector('.tactical-marquee-content') as HTMLElement;
        if (textEl) {
          const diff = textEl.scrollWidth - el.clientWidth;
          const overflow = diff > 2;
          setIsOverflowing(overflow);
          
          if (overflow) {
            el.style.setProperty('--scroll-dist', `${diff + 24}px`);
            // Speed: ~40px per second, min 6s, max 15s
            const duration = Math.min(15, Math.max(6, (diff + 20) / 40));
            el.style.setProperty('--marquee-duration', `${duration}s`);
          }
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timer);
    };
  }, [children]);

  return (
    <div 
      ref={containerRef}
      className={`tactical-marquee-container ${isOverflowing ? 'is-overflowing' : ''} ${className}`}
    >
      <span className="tactical-marquee-content">
        {children}
      </span>
    </div>
  );
};

export default TacticalMarquee;
