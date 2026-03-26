'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--background)] min-h-screen">
      <div className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="p-4 bg-[var(--accent-crimson)]/10 rounded-full text-[var(--accent-crimson)]">
            <AlertCircle size={40} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tighter">
              Kernel Runtime Fault
            </h2>
            <div className="h-0.5 w-12 bg-[var(--accent-gold)] mx-auto opacity-50" />
          </div>

          <div className="w-full p-4 bg-[var(--nested-surface)] rounded-xl border border-[var(--border-subtle)]">
            <p className="text-[0.7rem] font-mono text-[var(--accent-lavender)] break-words leading-relaxed">
              {error?.message || 'CRITICAL_UNHANDLED_EXCEPTION_IN_DASHBOARD_CORE'}
            </p>
          </div>

          <p className="text-xs text-[var(--text-muted)] font-medium max-w-[280px]">
            The system encountered an unexpected state. State isolation is active.
          </p>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-gold)] text-[var(--background)] text-[0.65rem] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg outline-none focus:outline-none focus:ring-0"
          >
            <RotateCcw size={14} />
            Initialize Recovery
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-2 opacity-30 select-none">
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Ontora OS 4.2.1</span>
        <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Fail-Safe Active</span>
      </div>
    </div>
  );
}
