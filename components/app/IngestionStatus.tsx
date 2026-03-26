'use client';

import { Play, RotateCcw, CheckCircle2, AlertCircle, Loader2, Database, Globe, Network } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/app/lib/api';

type Ingestor = {
  id: string;
  name: string;
  type: string;
  status: string;
  lastRun?: string;
};

const FULL_INGESTION_POLL_ATTEMPTS = 600;
const FULL_INGESTION_POLL_INTERVAL_MS = 2000;

export default function IngestionStatus() {
  const [ingestors, setIngestors] = useState<Ingestor[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [lastTask, setLastTask] = useState<{ id: string; status: string } | null>(null);

  const fetchIngestors = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/active-ingestors`);
      const data = await res.json();
      setIngestors(data?.data?.ingestors || []);
    } catch (e) {
      console.error('Failed to fetch ingestors', e);
    }
  };

  useEffect(() => {
    fetchIngestors();
    const id = setInterval(fetchIngestors, 30000);
    return () => clearInterval(id);
  }, []);

  const handleTriggerAll = async () => {
    setTriggering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/ingestion/trigger-all`, { method: 'POST' });
      const data = await res.json();

      if (data?.data?.task_id) {
        const taskId = data.data.task_id as string;
        setLastTask({ id: taskId, status: 'QUEUED' });

        // Wait for completion so visible metrics are refreshed with ingested data.
        for (let i = 0; i < FULL_INGESTION_POLL_ATTEMPTS; i += 1) {
          const statusRes = await fetch(`${API_BASE_URL}/api/tasks/status/${taskId}`, { cache: 'no-store' });
          const statusData = await statusRes.json();
          const status = String(statusData?.data?.status || '').toUpperCase();
          setLastTask({ id: taskId, status: status || 'PENDING' });

          if (status === 'SUCCESS') {
            localStorage.removeItem('ontora_strategic_metrics');
            localStorage.removeItem('ontora_intelligence_metrics');
            localStorage.removeItem('ontora_intelligence_alerts');
            window.location.reload();
            return;
          }

          if (status === 'FAILURE' || status === 'REVOKED') {
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, FULL_INGESTION_POLL_INTERVAL_MS));
        }

        setLastTask({ id: taskId, status: 'RUNNING' });
        alert(`Full ingestion is still running in background. Task ID: ${taskId}.`);
      }
    } catch (e) {
      console.error('Trigger failed', e);
    } finally {
      setTriggering(false);
    }
  };

  // Poll for task status if one is active
  useEffect(() => {
    if (!lastTask || lastTask.status === 'SUCCESS' || lastTask.status === 'FAILURE') return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/status/${lastTask.id}`);
        const data = await res.json();
        const status = data?.data?.status;
        if (status) {
          setLastTask(prev => prev ? { ...prev, status } : null);
        }
      } catch (e) {
        setLastTask(null);
      }
    };

    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [lastTask]);

  return (
    <div className="tactical-card rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-black opacity-70" style={{ color: 'var(--text-primary)' }}>Ingestion Pipeline // Task Orchestrator</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>Automated global data discovery & fusion</p>
        </div>
        <button
          onClick={handleTriggerAll}
          disabled={triggering || (lastTask?.status !== 'SUCCESS' && lastTask?.status !== 'FAILURE' && lastTask !== null)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-black text-[10px] uppercase tracking-wider"
          style={{
            background: 'var(--metric-accent-gradient)',
            border: '1px solid var(--metric-accent)',
            color: 'var(--background)',
            cursor: triggering ? 'not-allowed' : 'pointer',
            opacity: triggering ? 0.5 : 1
          }}
        >
          {triggering ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
          FORCE RE-SYNC
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {ingestors.map((ing) => (
          <div 
            key={ing.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] transition-colors hover:bg-white/[0.06]"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-white/[0.05]">
                {ing.id === 'mea' ? <Globe size={13} style={{ color: 'var(--metric-2-text)' }} /> : ing.id === 'worldbank' ? <Database size={13} style={{ color: 'var(--accent-emerald)' }} /> : <Network size={13} style={{ color: 'var(--accent-lavender)' }} />}
              </div>
              <div>
                <div className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '0.75rem' }}>{ing.name}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.6 }}>{ing.type} • Active</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} style={{ color: 'var(--accent-emerald)' }} />
              <div className="text-[11px] font-black tracking-tighter" style={{ color: 'var(--accent-emerald)' }}>STABLE</div>
            </div>
          </div>
        ))}

        {lastTask && (
          <div className="mt-4 p-3 rounded-lg border border-[#c8a84a]/20 bg-[#c8a84a]/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.62rem] text-[#94a3b8] uppercase tracking-wider font-bold">Live Task Status</span>
              <span className={`text-[0.62rem] font-bold px-1.5 py-0.5 rounded ${
                lastTask.status === 'SUCCESS' ? 'bg-[#3eb87a]/20 text-[#3eb87a]' : 
                lastTask.status === 'FAILURE' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#c8a84a]/20 text-[#c8a84a]'
              }`}>
                {lastTask.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[0.65rem] text-[#8a9aaa]">
              {lastTask.status !== 'SUCCESS' && lastTask.status !== 'FAILURE' ? (
                <Loader2 size={12} className="animate-spin text-[#c8a84a]" />
              ) : lastTask.status === 'SUCCESS' ? (
                <CheckCircle2 size={12} className="text-[#3eb87a]" />
              ) : (
                <AlertCircle size={12} className="text-[#ef4444]" />
              )}
              <span className="font-mono truncate">{lastTask.id}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <RotateCcw size={10} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', opacity: 0.7 }}>Next sync: +15m</span>
        </div>
        <div 
          className="text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter"
          style={{ background: 'var(--accent-emerald-gradient)', color: 'var(--background)', border: '1px solid var(--accent-emerald)' }}
        >
          ORD. OPERATIONAL
        </div>
      </div>
    </div>
  );
}
