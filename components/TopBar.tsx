'use client';

import { Search, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/app/lib/api';
import { useTheme } from '@/app/context/ThemeContext';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [time, setTime] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState('Operator');
  const [loggedIn, setLoggedIn] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);

    const localSession = localStorage.getItem('ontora.auth.session');
    const tempSession = sessionStorage.getItem('ontora.auth.session');
    const savedUser = localStorage.getItem('ontora.auth.user');

    if (localSession || tempSession) {
      setLoggedIn(true);
    }

    if (savedUser) {
      setActiveUser(savedUser);
    } else if (tempSession) {
      try {
        const parsed = JSON.parse(tempSession) as { user?: { username?: string } };
        if (parsed?.user?.username) {
          setActiveUser(parsed.user.username);
        }
      } catch {
        // Ignore malformed session payloads
      }
    }
    return () => clearInterval(id);
  }, []);

  async function handleLogout() {
    if (logoutLoading) return;

    setLogoutLoading(true);

    try {
      const localSessionRaw = localStorage.getItem('ontora.auth.session');
      const tempSessionRaw = sessionStorage.getItem('ontora.auth.session');
      const raw = localSessionRaw || tempSessionRaw;
      const accessToken = raw ? (JSON.parse(raw) as { access_token?: string }).access_token : undefined;

      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    } catch {
      // Logout should always clear local session even if API call fails
    } finally {
      localStorage.removeItem('ontora.auth.session');
      localStorage.removeItem('ontora.auth.user');
      sessionStorage.removeItem('ontora.auth.session');
      setLoggedIn(false);
      setActiveUser('Operator');
      setLogoutLoading(false);
    }
  }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--topbar-border)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 1px 0 color-mix(in srgb, var(--accent-gold) 8%, transparent)',
      }}
    >
      {/* Left: breadcrumb */}
      <div>
        <div
          className="flex items-center gap-2 mb-0.5"
          style={{ fontSize: '0.7rem' }}
        >
          <span style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Ontora</span>
          <span style={{ color: 'color-mix(in srgb, var(--accent-gold) 28%, transparent)', fontSize: '0.6rem' }}>›</span>
          <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{title}</span>
        </div>
        {subtitle && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Center: search */}
      <div
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl"
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          width: '340px',
          transition: 'border-color 0.2s',
        }}
        onFocus={() => {}}
      >
        <Search size={12} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search entities, events, intelligence..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.01em' }}
        />
        <kbd
          className="px-1.5 py-0.5 rounded"
          style={{
            background: 'color-mix(in srgb, var(--accent-gold) 9%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-gold) 18%, transparent)',
            color: 'var(--text-muted)',
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
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{
            border: '1px solid var(--input-border)',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon size={14} style={{ color: 'var(--accent-gold)' }} />
          ) : (
            <Sun size={14} style={{ color: 'var(--accent-gold)' }} />
          )}
        </button>

        {/* Thin divider */}
        <div className="w-px h-6" style={{ background: 'var(--divider-color)' }} />

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
        <div className="w-px h-6" style={{ background: 'var(--divider-color)' }} />

        {/* Clock */}
        {time && date && (
          <div className="text-right">
            <div
              className="font-mono font-bold"
              style={{ color: 'var(--accent-gold)', fontSize: '0.82rem', letterSpacing: '0.08em' }}
            >
              {time}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{date}</div>
          </div>
        )}

        {/* Thin divider */}
        <div className="w-px h-6" style={{ background: 'var(--divider-color)' }} />

        {/* User */}
        <button
          onClick={() => {
            window.location.href = 'http://localhost:3002';
          }}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
          style={{ border: '1px solid var(--input-border)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-gold) 20%, transparent) 0%, color-mix(in srgb, var(--accent-gold) 8%, transparent) 100%)',
              border: '1px solid color-mix(in srgb, var(--accent-gold) 20%, transparent)',
            }}
          >
            <User size={11} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div>
            <div
              style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em' }}
            >
              {activeUser}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', letterSpacing: '0.08em' }}>{loggedIn ? 'Authenticated' : 'Sign in'}</div>
          </div>
        </button>

        {loggedIn && (
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="px-2.5 py-1.5 rounded-lg"
            style={{
              border: '1px solid rgba(184,74,74,0.28)',
              background: 'rgba(184,74,74,0.1)',
              color: '#ef4444',
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              cursor: logoutLoading ? 'not-allowed' : 'pointer',
              opacity: logoutLoading ? 0.7 : 1,
            }}
          >
            {logoutLoading ? 'SIGNING OUT...' : 'SIGN OUT'}
          </button>
        )}
      </div>
    </header>
  );
}
