'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#020817' }}>
      <div className="glass-card rounded-xl p-6 max-w-xl">
        <h2 className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>Dashboard runtime error</h2>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>{error?.message || 'Unexpected rendering error.'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg"
          style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
