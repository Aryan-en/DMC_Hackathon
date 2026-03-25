'use client';

import { Search, Globe, Link, ExternalLink, Hash, Clock, History } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '@/app/lib/api';

type SearchResult = {
  type: 'news' | 'entity' | 'hotspot';
  title: string;
  subtitle: string;
  url: string;
  id?: string;
  timestamp?: string;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Command-K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // API Call for global search
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data?.data?.results || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    window.location.href = result.url;
    setOpen(false);
  }, []);

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) {
        handleSelect(results[activeIndex]);
      }
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{ background: 'rgba(0, 5, 12, 0.72)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        ref={paletteRef}
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in duration-200"
        style={{
          background: 'rgba(10, 21, 37, 0.98)',
          borderColor: 'rgba(200, 168, 74, 0.15)',
          boxShadow: '0 0 60px rgba(0,0,0,0.8), 0 0 1px rgba(200, 168, 74, 0.1)'
        }}
      >
        {/* Search header */}
        <div className="flex items-center px-5 py-4 gap-4 border-b border-white/5">
          <Search size={20} className="text-[#3a4e62]" />
          <input
            autoFocus
            type="text"
            placeholder="Search the global intelligence ontology..."
            className="flex-1 bg-transparent border-none outline-none text-lg text-white font-medium placeholder-[#3a4e62]"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyNavigation}
          />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[0.62rem] text-[#4a6070] font-mono">
            ESC
          </div>
        </div>

        {/* Results area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="px-5 py-10 text-center text-[#4a6070] text-sm animate-pulse">
              Scanning intelligence data lake...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex flex-col gap-0.5 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                    activeIndex === idx ? 'bg-[#c8a84a]/10 border-[#c8a84a]/20' : 'bg-transparent border-transparent'
                  }`}
                  style={{ border: '1px solid transparent' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#c8a84a]/5 border border-[#c8a84a]/10">
                        {result.type === 'news' ? <Globe size={13} className="text-[#c8a84a]" /> : result.type === 'entity' ? <Hash size={13} className="text-[#c8a84a]" /> : <Search size={13} className="text-[#3eb87a]" />}
                      </div>
                      <span className="text-sm font-semibold text-white/90">{result.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {result.timestamp && (
                        <span className="text-[0.65rem] text-[#4a6070] flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(result.timestamp).toLocaleDateString()}
                        </span>
                      )}
                      <ExternalLink size={12} className={activeIndex === idx ? 'text-[#c8a84a]' : 'text-[#2a3d52]'} />
                    </div>
                  </div>
                  <span className="text-[0.72rem] text-[#6c8298] ml-9">{result.subtitle}</span>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="px-5 py-10 text-center text-[#4a6070] text-sm">
              No entities or reports found matching "{query}"
            </div>
          ) : (
            <div className="p-4">
              <div className="text-[0.68rem] text-[#3a4e62] font-semibold uppercase tracking-wider mb-3 px-3">Recent Searches</div>
              <div className="grid grid-cols-2 gap-2">
                {['Drought in India', 'Bilateral relations UK', 'Conflict risk Asia', 'Oil prices shift'].map((recent, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-[#c8a84a]/20 cursor-pointer"
                    onClick={() => setQuery(recent)}
                  >
                    <History size={12} className="text-[#3a4e62]" />
                    <span className="text-[0.78rem] text-[#6c8298]">{recent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4 text-[0.65rem] text-[#4a6070]">
            <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[0.55rem]">↵</kbd> Select</div>
            <div className="flex items-center gap-1.5"><kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-[0.55rem]">↑↓</kbd> Navigate</div>
          </div>
          <div className="text-[0.62rem] text-[#2a3d52] flex items-center gap-1">
            <Globe size={10} />
            Ontora Intelligence Search
          </div>
        </div>
      </div>
    </div>
  );
}
