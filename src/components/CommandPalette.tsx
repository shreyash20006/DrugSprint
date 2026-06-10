import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Search, X, FileText, Calendar, Trophy, Users, ArrowRight,
  Loader2, Command, Hash
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'notice' | 'event' | 'achievement' | 'member';
  title: string;
  subtitle?: string;
  badge?: string;
  path: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  notice:      { icon: FileText,  label: 'Notice',      color: 'text-blue-400',    path: '/notices' },
  event:       { icon: Calendar,  label: 'Event',       color: 'text-emerald-400', path: '/events' },
  achievement: { icon: Trophy,    label: 'Achievement', color: 'text-gold-accent', path: '/achievements' },
  member:      { icon: Users,     label: 'Member',      color: 'text-purple-400',  path: '/council' },
};

const QUICK_LINKS = [
  { label: 'Notice Board',   path: '/notices',      icon: FileText,  hint: 'Official announcements' },
  { label: 'Events',         path: '/events',        icon: Calendar,  hint: 'Campus happenings' },
  { label: 'Leaderboard',    path: '/leaderboard',   icon: Trophy,    hint: 'Top achievers' },
  { label: 'Message Board',  path: '/board',         icon: Hash,      hint: 'Community discussion' },
  { label: 'My Calendar',    path: '/calendar',      icon: Calendar,  hint: 'Your event schedule' },
  { label: 'Council',        path: '/council',       icon: Users,     hint: 'Meet the team' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(() => runSearch(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const pattern = `%${q}%`;
      const [noticesRes, eventsRes, achievementsRes, membersRes] = await Promise.all([
        supabase.from('notices').select('id,title,category').ilike('title', pattern).limit(4),
        supabase.from('events').select('id,name,type,deadline').ilike('name', pattern).limit(4),
        supabase.from('achievements').select('id,student_name,title,category').ilike('student_name', pattern).limit(3),
        supabase.from('council_members').select('id,name,role').ilike('name', pattern).limit(3),
      ]);

      const combined: SearchResult[] = [
        ...(noticesRes.data || []).map((n: any) => ({
          id: n.id, type: 'notice' as const,
          title: n.title, badge: n.category, path: '/notices',
        })),
        ...(eventsRes.data || []).map((e: any) => ({
          id: e.id, type: 'event' as const,
          title: e.name,
          subtitle: e.deadline ? new Date(e.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
          badge: e.type, path: '/events',
        })),
        ...(achievementsRes.data || []).map((a: any) => ({
          id: a.id, type: 'achievement' as const,
          title: a.student_name, subtitle: a.title, badge: a.category, path: '/achievements',
        })),
        ...(membersRes.data || []).map((m: any) => ({
          id: m.id, type: 'member' as const,
          title: m.name, subtitle: m.role, path: '/council',
        })),
      ];
      setResults(combined);
      setSelectedIdx(0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const items = query.trim() ? results : QUICK_LINKS;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, items.length)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter')     { 
        e.preventDefault(); 
        if (selectedIdx === items.length && query.trim()) {
          handleSelect(`/search?q=${encodeURIComponent(query)}`);
        } else if (items[selectedIdx]) {
          handleSelect(items[selectedIdx].path); 
        }
      }
      if (e.key === 'Escape')    { onClose(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, results, selectedIdx, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-[12%] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-[9999]"
          >
            <div
              style={{ background: 'var(--bg-dropdown)', borderColor: 'var(--border-mid)' }}
              className="rounded-2xl shadow-2xl border overflow-hidden"
            >
              {/* Search Input */}
              <div style={{ borderBottomColor: 'var(--border-subtle)' }} className="flex items-center px-4 py-4 border-b gap-3">
                {isLoading
                  ? <Loader2 className="w-5 h-5 text-orange-burnt animate-spin shrink-0" />
                  : <Search className="w-5 h-5 text-orange-burnt shrink-0" />
                }
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search notices, events, achievements, members..."
                  style={{ color: 'var(--text-primary)', background: 'transparent' }}
                  className="flex-grow text-sm font-sans outline-none placeholder:opacity-40"
                />
                <div className="flex items-center space-x-2 shrink-0">
                  <kbd style={{ color: 'var(--text-muted)', borderColor: 'var(--border-mid)' }} className="hidden sm:flex items-center space-x-1 text-[10px] border rounded px-1.5 py-0.5">
                    <span>ESC</span>
                  </kbd>
                  <button onClick={onClose} className="p-1 rounded-lg hover:bg-orange-burnt/10 transition-colors">
                    <X className="w-4 h-4 text-orange-burnt" />
                  </button>
                </div>
              </div>

              {/* Results / Quick Links */}
              <div className="max-h-[420px] overflow-y-auto py-2">
                {!query.trim() ? (
                  // Quick Links
                  <div className="px-3 pb-2">
                    <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest px-2 py-2">Quick Navigate</p>
                    {QUICK_LINKS.map((link, idx) => {
                      const Icon = link.icon;
                      return (
                        <button
                          key={link.path}
                          onClick={() => handleSelect(link.path)}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                            selectedIdx === idx ? 'bg-orange-burnt/10' : 'hover:bg-orange-burnt/5'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-burnt/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-orange-burnt" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span style={{ color: 'var(--text-primary)' }} className="block text-sm font-display font-semibold">{link.label}</span>
                            <span style={{ color: 'var(--text-muted)' }} className="block text-[11px] font-sans">{link.hint}</span>
                          </div>
                          <ArrowRight className={`w-4 h-4 transition-colors ${selectedIdx === idx ? 'text-orange-burnt' : 'opacity-0'}`} />
                        </button>
                      );
                    })}
                  </div>
                ) : results.length === 0 && !isLoading ? (
                  <div className="text-center py-12">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p style={{ color: 'var(--text-muted)' }} className="text-sm font-sans">No results found for "{query}"</p>
                  </div>
                ) : (
                  // Search Results
                  <div className="px-3 pb-2">
                    {/* Group by type */}
                    {(['notice', 'event', 'achievement', 'member'] as const).map(type => {
                      const typeResults = results.filter(r => r.type === type);
                      if (!typeResults.length) return null;
                      const cfg = TYPE_CONFIG[type];
                      const Icon = cfg.icon;
                      let globalOffset = results.findIndex(r => r.type === type);

                      return (
                        <div key={type} className="mb-2">
                          <p style={{ color: 'var(--text-muted)' }} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5">{cfg.label}s</p>
                          {typeResults.map((result, i) => {
                            const absIdx = globalOffset + i;
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleSelect(result.path)}
                                onMouseEnter={() => setSelectedIdx(absIdx)}
                                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                                  selectedIdx === absIdx ? 'bg-orange-burnt/10' : 'hover:bg-orange-burnt/5'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-orange-burnt/8 flex items-center justify-center shrink-0">
                                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <span style={{ color: 'var(--text-primary)' }} className="block text-sm font-display font-semibold truncate">{result.title}</span>
                                  {result.subtitle && (
                                    <span style={{ color: 'var(--text-muted)' }} className="block text-[11px] font-sans truncate">{result.subtitle}</span>
                                  )}
                                </div>
                                {result.badge && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/20 shrink-0">
                                    {result.badge}
                                  </span>
                                )}
                                <ArrowRight className={`w-4 h-4 transition-colors shrink-0 ${selectedIdx === absIdx ? 'text-orange-burnt' : 'opacity-0'}`} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                    
                    {/* View All Results Button */}
                    <div className="mt-2 pt-2 border-t border-orange-burnt/10">
                      <button
                        onClick={() => handleSelect(`/search?q=${encodeURIComponent(query)}`)}
                        onMouseEnter={() => setSelectedIdx(results.length)}
                        className={`w-full flex items-center justify-center space-x-2 px-3 py-3 rounded-xl transition-all text-center ${
                          selectedIdx === results.length ? 'bg-orange-burnt text-white shadow-lg shadow-orange-burnt/20' : 'bg-orange-burnt/10 text-orange-burnt hover:bg-orange-burnt hover:text-white'
                        }`}
                      >
                        <Search className="w-4 h-4" />
                        <span className="text-sm font-display font-bold">See all results for "{query}"</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div style={{ borderTopColor: 'var(--border-subtle)', color: 'var(--text-muted)' }} className="flex items-center justify-between px-4 py-2.5 border-t text-[10px] font-sans">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <kbd style={{ borderColor: 'var(--border-mid)' }} className="border rounded px-1 py-0.5">↑↓</kbd>
                    <span>Navigate</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <kbd style={{ borderColor: 'var(--border-mid)' }} className="border rounded px-1 py-0.5">↵</kbd>
                    <span>Open</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 opacity-60">
                  <Command className="w-3 h-3" />
                  <span>K to search</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
