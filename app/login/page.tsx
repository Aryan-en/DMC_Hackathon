'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/app/lib/api';
import { Shield, Lock, User, ArrowRight, AlertTriangle } from 'lucide-react';

type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
    clearance_level: string;
    is_active: boolean;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => username.trim().length >= 3 && password.length >= 6, [username, password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError(null);

    try {
      const payload = await apiPost<LoginResponse>('/auth/login', {
        username: username.trim(),
        password,
      });

      const session = {
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        token_type: payload.token_type,
        expires_in: payload.expires_in,
        user: payload.user,
        login_at: new Date().toISOString(),
      };

      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('ontora.auth.session', JSON.stringify(session));

      if (rememberMe) {
        localStorage.setItem('ontora.auth.user', payload.user.username);
      }

      router.push('/security');
    } catch (submitErr) {
      setError(submitErr instanceof Error ? submitErr.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: '#030810' }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 10%, rgba(0,212,255,0.16) 0%, transparent 36%), radial-gradient(circle at 80% 85%, rgba(62,184,122,0.12) 0%, transparent 40%), linear-gradient(180deg, #030810 0%, #071325 100%)',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.02) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'radial-gradient(circle at center, black 45%, transparent 95%)',
        }}
      />

      <section className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between p-12 border-r" style={{ borderColor: 'rgba(0,212,255,0.15)' }}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.26)' }}>
              <Shield size={14} style={{ color: '#67e8f9' }} />
              <span style={{ color: '#67e8f9', fontSize: '0.72rem', letterSpacing: '0.14em', fontWeight: 700 }}>
                SECURE ACCESS PORTAL
              </span>
            </div>

            <h1 className="mt-8" style={{ color: '#f3f4f6', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Welcome To Ontora Command
            </h1>
            <p className="mt-4 max-w-md" style={{ color: '#9fb0c4', fontSize: '0.95rem', lineHeight: 1.6 }}>
              Authenticate with your analyst credentials to access intelligence workflows. Every sign-in is written to PostgreSQL and reflected in Security and Governance telemetry.
            </p>
          </div>

          <div className="space-y-3 max-w-md">
            {[
              'Tamper-evident login audit trail',
              'Role-aware access with clearance levels',
              'Security dashboard reflects ALLOW and DENY events in real time',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(10,21,37,0.7)', border: '1px solid rgba(0,212,255,0.12)' }}>
                <span className="mt-1 w-2 h-2 rounded-full" style={{ background: '#3eb87a' }} />
                <p style={{ color: '#c9d4e2', fontSize: '0.78rem', lineHeight: 1.45 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md rounded-3xl p-7 sm:p-8" style={{ background: 'linear-gradient(160deg, rgba(10,21,37,0.95) 0%, rgba(8,16,30,0.98) 100%)', border: '1px solid rgba(0,212,255,0.16)', boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}>
            <div className="mb-6">
              <h2 style={{ color: '#e5edf8', fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Sign In</h2>
              <p className="mt-1" style={{ color: '#8fa2ba', fontSize: '0.8rem' }}>
                Use your operational account credentials.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(184,74,74,0.1)', border: '1px solid rgba(184,74,74,0.22)' }}>
                <AlertTriangle size={16} style={{ color: '#ef4444', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ color: '#fca5a5', fontSize: '0.75rem' }}>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="block mb-1.5" style={{ color: '#a9b8ca', fontSize: '0.72rem', letterSpacing: '0.06em' }}>USERNAME</span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'rgba(2,8,23,0.55)' }}>
                  <User size={15} style={{ color: '#00d4ff' }} />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    autoComplete="username"
                    className="w-full bg-transparent outline-none"
                    style={{ color: '#dce4ee', fontSize: '0.86rem' }}
                  />
                </div>
              </label>

              <label className="block">
                <span className="block mb-1.5" style={{ color: '#a9b8ca', fontSize: '0.72rem', letterSpacing: '0.06em' }}>PASSWORD</span>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ border: '1px solid rgba(0,212,255,0.15)', background: 'rgba(2,8,23,0.55)' }}>
                  <Lock size={15} style={{ color: '#00d4ff' }} />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full bg-transparent outline-none"
                    style={{ color: '#dce4ee', fontSize: '0.86rem' }}
                  />
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  type="checkbox"
                  className="accent-yellow-600"
                />
                <span style={{ color: '#90a3bb', fontSize: '0.75rem' }}>Remember this device</span>
              </label>

              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:3002'}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                style={{
                  color: '#1a1302',
                  background: 'linear-gradient(135deg, #67e8f9 0%, #00d4ff 100%)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                SIGN IN
                <ArrowRight size={15} />
              </button>
            </form>

            <p className="mt-5 text-center" style={{ color: '#6f839b', fontSize: '0.68rem', letterSpacing: '0.03em' }}>
              Access attempts are monitored and audited.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
