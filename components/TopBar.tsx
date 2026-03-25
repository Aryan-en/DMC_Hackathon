'use client';

import { Search, User, Sun, Moon, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUI } from './UIContext';
import { API_BASE_URL } from '@/app/lib/api';
import CommandPalette from './CommandPalette';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { toggleSidebar } = useUI();
  const [time, setTime] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState('Operator');
  const [loggedIn, setLoggedIn] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      // Ignore failures
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
      className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 flex-shrink-0 transition-all duration-300"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ border: '1px solid var(--border-color)' }}
        >
          <Menu size={18} style={{ color: 'var(--accent-gold)' }} />
        </button>
        
        <div>
          <div
            className="flex items-center gap-2 mb-0.5"
            style={{ fontSize: '0.7rem' }}
          >
            <span style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Ontora</span>
            <span style={{ color: 'var(--accent-gold)', opacity: 0.25, fontSize: '0.6rem' }}>›</span>
            <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{title}</span>
          </div>
          {subtitle && (
            <div className="hidden sm:block" style={{ color: 'var(--text-dim)', fontSize: '0.6rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Center: Search (Desktop only) */}
      <div
        className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-xl group hover:border-[#c8a84a]/30 cursor-pointer"
        style={{
          background: 'var(--accent-gold-dim)',
          border: '1px solid var(--border-color)',
          width: '280px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => setShowSearch(true)}
      >
        <Search size={12} style={{ color: 'var(--text-dim)' }} />
        <input
          type="text"
          placeholder="Search..."
          className="flex-1 bg-transparent outline-none"
          style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', letterSpacing: '0.01em' }}
        />
        <CommandPalette />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl transition-all hover:bg-[var(--accent-gold-dim)]"
          style={{ border: '1px solid var(--border-color)' }}
        >
          {mounted ? (
            theme === 'dark' ? <Sun size={14} style={{ color: 'var(--accent-gold)' }} /> : <Moon size={14} style={{ color: 'var(--accent-gold)' }} />
          ) : (
            <div className="w-[14px] h-[14px]" />
          )}
        </button>

        {/* Live Indicator (Icon only on mobile) */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full live-indicator" style={{ background: 'var(--accent-emerald)' }} />
          <span
            className="hidden sm:inline font-mono"
            style={{ color: 'var(--accent-emerald)', fontSize: '0.65rem', letterSpacing: '0.1em', fontWeight: 700 }}
          >
            LIVE
          </span>
        </div>

        {/* Clock (Hidden on very small mobile) */}
        {time && date && (
          <div className="hidden md:block text-right">
            <div
              className="font-mono font-bold"
              style={{ color: 'var(--accent-gold)', fontSize: '0.82rem', letterSpacing: '0.08em' }}
            >
              {time}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.6rem', letterSpacing: '0.05em' }}>{date}</div>
          </div>
        )}

        {/* User */}
        <button
          onClick={() => { window.location.href = 'http://localhost:3002'; }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-[var(--border-color)] hover:bg-[var(--accent-gold-dim)] transition-colors"
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[var(--accent-gold-dim)] border border-[var(--accent-gold-dim)]">
            <User size={11} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <span className="hidden sm:inline" style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600 }}>{activeUser}</span>
        </button>
      </div>
    </header>
  );
}
