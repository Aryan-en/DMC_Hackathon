'use client';

import * as React from 'react';
import TopBar from '@/components/TopBar';
import { FileText, Link as LinkIcon, ExternalLink, Calendar, Clock, Database, Search, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

type Document = {
  id: string;
  title: string;
  source: string;
  url: string | null;
  published_date: string | null;
  created_at: string | null;
  content_preview: string;
  metadata: any;
};

export default function DataSourcesPage() {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/data-lake/documents?limit=50`);
      const data = await res.json();
      if (data?.status === 'success') {
        setDocuments(data.data.documents || []);
      } else {
        throw new Error(data?.error?.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content_preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen grid-bg">
      <TopBar title="Data Sources" subtitle="Global Ingestion Feed & Document Lake" />
      
      <main className="flex-1 px-6 py-6 space-y-6">
        <div className="flex items-center justify-between gap-4 glass-card p-4 rounded-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search across ingested news, PDFs, and diplomatic relations..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDocuments}
              className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all"
            >
              Refresh Feed
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs shadow-lg">
            System Alert: {error} - Check backend connectivity.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
               <p className="text-slate-500 text-xs font-mono animate-pulse">Scanning Data Lake...</p>
             </div>
          ) : filteredDocs.length === 0 ? (
            <div className="glass-card p-12 rounded-xl text-center space-y-3">
              <Database size={40} className="mx-auto text-slate-700" />
              <div className="text-slate-300 font-semibold">No documents found</div>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Try running a re-sync from the dashboard to populate the data lake with diplomatic briefings and global news.
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div key={doc.id} className="glass-card hover:border-slate-700/50 transition-all group rounded-xl overflow-hidden flex flex-col md:flex-row">
                <div className="p-5 flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {doc.url?.endsWith('.pdf') ? (
                          <FileText size={16} className="text-red-400" />
                        ) : (
                          <LinkIcon size={16} className="text-cyan-400" />
                        )}
                        <h3 className="text-slate-200 font-bold group-hover:text-cyan-400 transition-colors">
                          {doc.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-2xs font-mono uppercase tracking-widest text-slate-500">
                        <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-green-500" /> {doc.source}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> {doc.published_date ? new Date(doc.published_date).toLocaleDateString('en-US') : 'N/A'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {doc.created_at ? new Date(doc.created_at).toLocaleTimeString('en-US') : 'N/A'}</span>
                      </div>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 bg-slate-800/50 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  
                  <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-serif italic">
                    {doc.content_preview}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-400 font-medium">RANK: CLASSIFIED</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950/30 border border-cyan-800/30 text-cyan-500 font-medium">VECTORIZED</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/30 border border-emerald-800/30 text-emerald-500 font-medium">KG_LINKED</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
