'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Terminal as TerminalIcon, ShieldCheck, Zap, X } from 'lucide-react';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface ServiceTerminalProps {
  serviceId?: string;
  serviceName: string;
  logs?: LogEntry[];
  loading?: boolean;
  onClose?: () => void;
}

export default function ServiceTerminal({ serviceId, serviceName, logs: externalLogs, loading: externalLoading, onClose }: ServiceTerminalProps) {
  const [internalLogs, setInternalLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const logs = externalLogs || internalLogs;
  const isLoading = externalLoading !== undefined ? externalLoading : (externalLogs ? false : (loading && internalLogs.length === 0));

  useEffect(() => {
    if (externalLogs || !serviceId) return;

    let intervalId: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/services/${serviceId}/logs`);
        const data = await res.json();
        if (data.status === 'success') {
          setInternalLogs(data.data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    intervalId = setInterval(fetchLogs, 3000);

    return () => clearInterval(intervalId);
  }, [serviceId, externalLogs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--background)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between bg-[var(--nested-surface)] px-5 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 grayscale opacity-50">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="h-4 w-px bg-[var(--border-subtle)] mx-1" />
          <div className="flex items-center gap-2">
            <TerminalIcon size={14} className="text-[var(--accent-gold)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              {serviceName || 'Global_Mesh'} <span className="opacity-40 ml-1">// Forensic_Stream</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.4)]" />
            <span className="text-[9px] font-bold text-[var(--accent-emerald)] uppercase tracking-tight">LIVE</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-[var(--accent-gold)] outline-none focus:outline-none focus:ring-0"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 font-mono text-[10px] leading-relaxed scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent bg-black/[0.02]"
      >
        {isLoading ? (
          <div className="flex items-center gap-3 text-[var(--text-muted)] animate-pulse">
            <ChevronRight size={14} />
            <span className="tracking-widest uppercase text-[8px] font-bold">Synchronizing forensic downlink...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 group hover:bg-[var(--accent-gold-dim)] -mx-3 px-3 py-0.5 rounded transition-colors">
                <span className="text-[9px] text-[var(--text-muted)] shrink-0 font-mono opacity-60 tabular-nums">
                  {log.timestamp.split(' ')[1] || log.timestamp}
                </span>
                <span className={`shrink-0 font-bold text-[8px] min-w-[45px] px-1 rounded bg-[var(--background)] border border-[var(--border-subtle)] text-center ${
                  log.level === 'WARNING' || log.level === 'warn' ? 'text-[var(--accent-amber)]' : 
                  log.level === 'ERROR' || log.level === 'error' ? 'text-[var(--accent-crimson)]' : 
                  'text-[var(--text-secondary)] opacity-80'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-[var(--text-primary)] whitespace-pre-wrap break-words flex-1 tracking-tight">
                  <span className="text-[var(--accent-gold)] opacity-40 mr-2">»</span>
                  {log.message}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-[var(--accent-emerald)] opacity-50 pt-4">
              <ChevronRight size={14} className="animate-bounce" />
              <div className="w-1.5 h-3 bg-[var(--accent-emerald)]/30 rounded-sm" />
            </div>
          </div>
        )}
      </div>
      
      {/* Terminal Footer */}
      <div className="bg-[var(--nested-surface)] px-5 py-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-6 opacity-60">
          <div className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            <ShieldCheck size={12} className="text-[var(--accent-emerald)]" />
            Secure_Link
          </div>
          <div className="flex items-center gap-1.5 text-[8px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            <Zap size={12} className="text-[var(--accent-gold)]" />
            FTL_V4
          </div>
        </div>
        <div className="text-[8px] font-mono text-[var(--text-muted)] uppercase tracking-tighter">
          Vanguard_Forensics
        </div>
      </div>
    </div>
  );
}
