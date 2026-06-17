import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, FileText, Calendar, Users, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SearchResult {
  id: string;
  type: 'notice' | 'event' | 'member';
  title: string;
  description: string;
  path: string;
  date?: string;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'notice', label: 'Notices', icon: FileText },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'member', label: 'Council', icon: Users },
];

const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-orange-burnt/35 text-orange-burnt font-bold px-0.5 rounded">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const pattern = `%${searchQuery}%`;
      
      const [noticesRes, eventsRes, membersRes] = await Promise.all([
        supabase.from('notices').select('*').ilike('title', pattern),
        supabase.from('events').select('*').ilike('name', pattern),
        supabase.from('council_members').select('*').ilike('name', pattern),
      ]);

      const combined: SearchResult[] = [
        ...(noticesRes.data || []).map((n: any) => ({
          id: n.id,
          type: 'notice' as const,
          title: n.title,
          description: n.content || n.category,
          path: '/notices',
          date: n.created_at
        })),
        ...(eventsRes.data || []).map((e: any) => ({
          id: e.id,
          type: 'event' as const,
          title: e.name,
          description: e.description || e.type,
          path: '/events',
          date: e.deadline || e.date
        })),
        ...(membersRes.data || []).map((m: any) => ({
          id: m.id,
          type: 'member' as const,
          title: m.name,
          description: m.role,
          path: '/council'
        })),
      ];

      setResults(combined);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab);

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Global Search
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Find Council Data
        </h2>
      </section>

      {/* Input Form */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <SearchIcon className="h-4.5 w-4.5 text-white/30" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-10 pr-24 py-3 bg-[#0F1E42]/85 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-orange-burnt transition-all"
          placeholder="Search notices, events, council..."
        />
        <button 
          type="submit"
          className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white px-4 rounded-lg font-display text-xs font-bold uppercase tracking-wider active:scale-95 transition-transform"
        >
          Search
        </button>
      </form>

      {/* Tabs */}
      {results.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-full font-display text-xs font-bold tracking-wider shrink-0 transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-burnt text-white'
                  : 'bg-[#0F1E42]/80 text-white/50 border border-white/5'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
              <span className="bg-black/30 px-1.5 py-0.5 rounded-full text-[9px] font-mono">
                {tab.id === 'all' ? results.length : results.filter(r => r.type === tab.id).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold font-display">Searching database...</span>
        </div>
      ) : results.length === 0 && initialQuery ? (
        <div className="text-center py-12 bg-[#0F1E42]/40 rounded-2xl border border-white/5 px-6">
          <SearchIcon className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No results found for "{initialQuery}"</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            Try checking for typos or using different keywords to query our tables.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((result, idx) => (
            <motion.div
              key={`${result.type}-${result.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Link 
                to={result.path}
                className="block bg-[#0F1E42]/80 border border-white/5 active:border-orange-burnt/35 rounded-2xl p-4 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-orange-burnt bg-orange-burnt/10 px-2 py-0.5 rounded border border-orange-burnt/25">
                      {result.type}
                    </span>
                    {result.date && (
                      <span className="text-[10px] text-white/40 font-sans">
                        {new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-display font-bold text-white leading-snug">
                    <Highlight text={result.title} highlight={initialQuery} />
                  </h3>
                  <p className="text-[11px] text-white/60 font-sans line-clamp-2 leading-relaxed">
                    <Highlight text={result.description || ''} highlight={initialQuery} />
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
