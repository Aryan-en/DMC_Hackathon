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
      
      // Also trigger metrics simulation for immediate UI feedback
      await fetch(`${API_BASE_URL}/api/tasks/simulate-metrics`, { method: 'POST' });

      if (data?.data?.task_id) {
        setLastTask({ id: data.data.task_id, status: 'QUEUED' });
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
    <div className="glass-card rounded-xl p-5 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Ingestion Pipeline</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Automated task orchestration for global data discovery</p>
        </div>
        <button
          onClick={handleTriggerAll}
          disabled={triggering || (lastTask?.status !== 'SUCCESS' && lastTask?.status !== 'FAILURE' && lastTask !== null)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all"
          style={{
            background: 'rgba(200,168,74,0.15)',
            border: '1px solid rgba(200,168,74,0.25)',
            color: '#c8a84a',
            fontSize: '0.62rem',
            fontWeight: 700,
            cursor: triggering ? 'not-allowed' : 'pointer'
          }}
        >
          {triggering ? <Loader2 size={12} className="animate-spin" /> : <Play size={10} fill="#c8a84a" />}
          FORCE RE-SYNC
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {ingestors.map((ing) => (
          <div 
            key={ing.id} 
            className="flex items-center justify-between p-2.5 rounded-lg"
            style={{ background: 'rgba(10, 21, 37, 0.4)', border: '1px solid rgba(200,168,74,0.05)' }}
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                {ing.id === 'mea' ? <Globe size={13} className="text-[#00d4ff]" /> : ing.id === 'worldbank' ? <Database size={13} className="text-[#3eb87a]" /> : <Network size={13} className="text-[#8b5cf6]" />}
              </div>
              <div>
                <div style={{ color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600 }}>{ing.name}</div>
                <div style={{ color: '#4a6070', fontSize: '0.6rem' }}>{ing.type} • Active</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-[#3eb87a]" />
              <div className="text-[0.58rem] font-mono text-[#3eb87a] tracking-tight">STABLE</div>
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

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <RotateCcw size={10} className="text-[#4a6070]" />
          <span style={{ color: '#4a6070', fontSize: '0.6rem' }}>Next scheduled sync: approx 15m</span>
        </div>
        <div 
          className="text-[0.6rem] font-bold px-2 py-0.5 rounded"
          style={{ background: 'rgba(62,184,122,0.1)', color: '#3eb87a', border: '1px solid rgba(62,184,122,0.2)' }}
        >
          ORD. OPERATIONAL
        </div>
      </div>
    </div>
  );
}
