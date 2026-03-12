'use client';

import { Bell, Search, Wifi, User } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: 'rgba(3, 8, 16, 0.97)',
        borderBottom: '1px solid rgba(200,168,74,0.1)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 rgba(200,168,74,0.05)',
      }}
    >
      {/* Left: breadcrumb */}
      <div>
        <div
          className="flex items-center gap-2 mb-0.5"
          style={{ fontSize: '0.7rem' }}
        >
          <span style={{ color: '#3a4e62', letterSpacing: '0.08em' }}>Ontora</span>
          <span style={{ color: 'rgba(200,168,74,0.25)', fontSize: '0.6rem' }}>›</span>
          <span style={{ color: '#8a9aaa', letterSpacing: '0.04em' }}>{title}</span>
        </div>
        {subtitle && (
          <div style={{ color: '#2a3d52', fontSize: '0.6rem', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Center: search */}
      <div
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
        style={{
          background: 'rgba(10, 21, 37, 0.8)',
          border: '1px solid rgba(200,168,74,0.1)',
          width: '340px',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => {}}
      >
        <Search size={12} style={{ color: '#3a4e62' }} />
        <input
          type="text"
          placeholder="Search entities, events, intelligence..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: '#7a8fa8', fontSize: '0.75rem', letterSpacing: '0.01em' }}
        />
        <kbd
          className="px-1.5 py-0.5 rounded"
          style={{
            background: 'rgba(200,168,74,0.06)',
            border: '1px solid rgba(200,168,74,0.14)',
            color: '#4a6070',
            fontSize: '0.58rem',
            fontFamily: 'var(--font-geist-mono)',
            letterSpacing: '0.05em',
          }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Right: status + clock */}
      <div className="flex items-center gap-5">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full live-indicator" style={{ background: '#3eb87a' }} />
          <span
            className="font-mono"
            style={{ color: '#3eb87a', fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}
          >
            LIVE
          </span>
        </div>

        {/* Thin divider */}
        <div className="w-px h-6" style={{ background: 'rgba(200,168,74,0.08)' }} />

        {/* Clock */}
        <div className="text-right">
          <div
            className="font-mono font-bold"
            style={{ color: '#c8a84a', fontSize: '0.82rem', letterSpacing: '0.08em' }}
          >
            {time}
          </div>
          <div style={{ color: '#2a3d52', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{date}</div>
        </div>

        {/* Thin divider */}
        <div className="w-px h-6" style={{ background: 'rgba(200,168,74,0.08)' }} />

        {/* Notifications */}
        <button
          className="relative p-1.5 rounded-lg transition-colors"
          style={{ color: '#3a4e62' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,168,74,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Bell size={14} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: '#b84a4a' }}
          />
        </button>

        {/* User */}
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
          style={{ border: '1px solid rgba(200,168,74,0.1)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,168,74,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(200,168,74,0.2) 0%, rgba(200,168,74,0.08) 100%)',
              border: '1px solid rgba(200,168,74,0.2)',
            }}
          >
            <User size={11} style={{ color: '#c8a84a' }} />
          </div>
          <div>
            <div
              style={{ color: '#8a9aaa', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em' }}
            >
              Admin
            </div>
            <div style={{ color: '#2a3d52', fontSize: '0.58rem', letterSpacing: '0.08em' }}>Officer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
