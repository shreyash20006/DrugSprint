import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, FileText, Calendar, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

interface SearchResult {
  id: string;
  type: 'notice' | 'event' | 'member' | 'store' | 'faq' | 'gallery';
  title: string;
  description: string;
  path: string;
  date?: string;
}

const TABS = [
  { id: 'all', label: 'All Results' },
  { id: 'notice', label: 'Notices', icon: FileText },
  { id: 'event', label: 'Events', icon: Calendar },
  { id: 'member', label: 'Council', icon: Users },
];

// Highlight text component
const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-orange-burnt/30 text-orange-burnt font-bold px-1 rounded">
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      <ScienceBackground />
      <PageHeader 
        icon={<SearchIcon className="w-6 h-6 text-orange-burnt" />}
        title="Global Search"
        subtitle="Find notices, events, council members and resources instantly."
        breadcrumb="Search"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-6 w-6 text-white/40" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-5 bg-[#0D1B3E]/80 border border-orange-burnt/30 rounded-2xl text-lg text-white placeholder-white/40 focus:ring-2 focus:ring-orange-burnt focus:border-transparent transition-all backdrop-blur-md shadow-xl"
            placeholder="Search for anything..."
          />
          <button 
            type="submit"
            className="absolute right-3 top-3 bottom-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white px-6 rounded-xl font-display font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-orange-burnt/30 transition-all active:scale-95"
          >
            Search
          </button>
        </form>

        {/* Tabs */}
        {results.length > 0 && (
          <div className="flex overflow-x-auto hide-scrollbar space-x-2 mb-8 bg-[#0D1B3E]/50 p-2 rounded-2xl backdrop-blur-md border border-white/5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-display text-sm font-bold tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-orange-burnt text-white shadow-md shadow-orange-burnt/25'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span>{tab.label}</span>
                <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px]">
                  {tab.id === 'all' ? results.length : results.filter(r => r.type === tab.id).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
            <p className="text-white/60 font-sans">Searching database...</p>
          </div>
        ) : results.length === 0 && initialQuery ? (
          <div className="text-center py-20 bg-[#0D1B3E]/40 rounded-3xl border border-white/5 backdrop-blur-sm">
            <SearchIcon className="w-16 h-16 text-white/10 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white/80 text-xl mb-2">No results found for "{initialQuery}"</h3>
            <p className="text-white/50">Try checking for typos or using different keywords.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result, idx) => (
              <motion.div
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Link 
                  to={result.path}
                  className="block bg-[#0D1B3E]/70 border border-orange-burnt/15 hover:border-orange-burnt/40 rounded-2xl p-6 transition-all hover:bg-[#0D1B3E] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-burnt/10 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-burnt bg-orange-burnt/10 px-2.5 py-1 rounded-md border border-orange-burnt/20">
                          {result.type}
                        </span>
                        {result.date && (
                          <span className="text-xs text-white/40 font-sans">
                            {new Date(result.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-display font-bold text-white group-hover:text-orange-burnt transition-colors mb-2">
                        <Highlight text={result.title} highlight={initialQuery} />
                      </h3>
                      <p className="text-sm text-white/60 font-sans line-clamp-2">
                        <Highlight text={result.description || ''} highlight={initialQuery} />
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
