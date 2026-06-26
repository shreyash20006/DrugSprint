import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Eye, Download, 
  ExternalLink, FileText, AlertTriangle, X, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DNALoader } from '../../components/DNALoader';
import { getCache, setCache } from '../../lib/cache';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

export const Notices: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Academic' | 'Event' | 'Alert' | 'General'>('All');
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);
  
  // PDF Preview State
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedNoticeTitle, setSelectedNoticeTitle] = useState('');
  const [embedFailed, setEmbedFailed] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(4);

  const CACHE_KEY = 'notices';

  const fetchNotices = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const items = data || [];
      setNotices(items);
      setCache(CACHE_KEY, items, 30);
    } catch (err: any) {
      console.error('Error fetching notices:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cache immediately, then refresh in background
  useEffect(() => {
    const cached = getCache<any[]>(CACHE_KEY);
    if (cached) {
      setNotices(cached);
      setIsLoading(false);
      fetchNotices(false);
    } else {
      fetchNotices(true);
    }
  }, [fetchNotices]);

  // Supabase Realtime — live sync when admin publishes a new notice
  useEffect(() => {
    const channel = supabase
      .channel('notices_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => {
        fetchNotices(false);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchNotices]);

  const { isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: () => fetchNotices(false),
  });

  const filteredNotices = useMemo(() => {
    return notices.filter(
      (n) => activeFilter === 'All' || n.category === activeFilter
    );
  }, [notices, activeFilter]);

  const handleFilter = useCallback((filter: 'All' | 'Academic' | 'Event' | 'Alert' | 'General') => {
    setActiveFilter(filter);
    setVisibleCount(4); // Reset pagination on filter change
  }, []);

  const getIndicatorColor = (category: string) => {
    switch (category) {
      case 'Academic': return 'bg-blue-500';
      case 'General':  return 'bg-orange-500';
      case 'Event':    return 'bg-emerald-500';
      case 'Alert':    return 'bg-amber-500';
      default:         return 'bg-slate-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    if (category === 'Event') return 'Events';
    if (category === 'Alert') return 'Alerts';
    return category;
  };

  const incrementViews = async (noticeId: string) => {
    try {
      await supabase.rpc('increment_notice_views', { notice_id: noticeId });
      // Update local state views count
      setNotices(prev => 
        prev.map(n => n.id === noticeId ? { ...n, views: (n.views || 0) + 1 } : n)
      );
    } catch (err) {
      // Ignore views increment errors silently
    }
  };

  const openPdfPreview = (url: string, title: string, id: string) => {
    setSelectedPdfUrl(url);
    setSelectedNoticeTitle(title);
    setEmbedFailed(false);
    setIsPdfLoading(true);
    incrementViews(id);
  };

  return (
    <div className="space-y-6 pb-6 pt-4">
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(isRefreshing || pullProgress > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center"
          >
            <RefreshCw
              className={`w-5 h-5 text-orange-burnt ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullProgress * 360}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header Section */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Official Updates
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight flex items-center gap-2">
          Trending Notices 🔥
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Stay informed with the latest academic announcements, event circulars, and administrative updates from your council.
        </p>
      </section>

      {/* Filter Categories Horizontal Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {(['All', 'Academic', 'Event', 'Alert', 'General'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => handleFilter(filter)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-display text-xs font-bold transition-all duration-200 ${
              activeFilter === filter
                ? 'bg-orange-burnt text-white shadow-md shadow-orange-burnt/15'
                : 'bg-white/5 border border-white/5 text-white/60 hover:text-white'
            }`}
          >
            {getCategoryLabel(filter)}
          </button>
        ))}
      </div>

      {/* Notices Bento/List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((skeletonIdx) => (
            <div
              key={skeletonIdx}
              className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden"
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="flex justify-between items-center">
                <div className="h-5 bg-white/5 w-20 rounded-full" />
                <div className="h-4 bg-white/5 w-16 rounded" />
              </div>
              <div className="h-5 bg-white/5 w-3/4 rounded" />
              <div className="h-4 bg-white/5 w-full rounded" />
              <div className="h-4 bg-white/5 w-5/6 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotices.slice(0, visibleCount).map((notice) => {
              const pdfUrl = notice.pdf_url || (notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);
              const externalLink = notice.external_link || (!notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);
              const isExpanded = expandedNoticeId === notice.id;
              
              const formattedDate = notice.created_at
                ? new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : notice.date || 'No Date';

              return (
                <motion.div
                  key={notice.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 relative rounded-2xl p-5 transition-all active:scale-[0.99] group overflow-hidden shadow-md"
                >
                  {/* Left indicator bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getIndicatorColor(notice.category)}`} />

                  <div className="flex items-start justify-between mb-3.5 pl-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full font-display text-[9px] uppercase font-bold tracking-widest ${
                        notice.category === 'Academic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        notice.category === 'General' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        notice.category === 'Event' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {getCategoryLabel(notice.category)}
                      </span>
                      {notice.views !== undefined && (
                        <span className="text-white/40 font-sans text-[10px] font-semibold flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-orange-burnt/75" /> {notice.views}
                        </span>
                      )}
                    </div>
                    <span className="text-white/40 font-sans text-[10px] font-semibold">{formattedDate}</span>
                  </div>

                  <h3 className="font-display font-extrabold text-sm text-white pl-1.5 leading-snug tracking-wide">
                    {notice.title}
                  </h3>
                  
                  <div className="pl-1.5 mt-2">
                    <p className={`font-sans text-xs text-white/70 leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {notice.description}
                    </p>
                    {notice.description?.length > 100 && (
                      <button 
                        onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                        className="text-orange-burnt text-[10px] font-display font-bold uppercase tracking-wider mt-1.5"
                      >
                        {isExpanded ? 'Show Less' : 'Read More...'}
                      </button>
                    )}
                  </div>

                  {/* Actions Area */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4 pl-1.5">
                    <span className="text-white/30 font-sans text-[10px] italic">
                      {notice.category === 'Academic' ? 'By Academic Dean' : 'By Council Principal'}
                    </span>
                    
                    <div className="flex gap-2">
                      {pdfUrl && (
                        <button 
                          onClick={() => openPdfPreview(pdfUrl, notice.title, notice.id)}
                          className="text-orange-burnt font-display text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 bg-orange-burnt/10 hover:bg-orange-burnt/20 border border-orange-burnt/20 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        >
                          Attachment <Download className="w-3 h-3" />
                        </button>
                      )}
                      
                      {externalLink && !pdfUrl && (
                        <a 
                          href={externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => incrementViews(notice.id)}
                          className="text-orange-burnt font-display text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
                        >
                          {notice.linkText || 'Open Link'} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredNotices.length === 0 && (
            <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
              <Megaphone className="w-10 h-10 text-white/10 mb-3 animate-pulse" />
              <h3 className="font-display font-bold text-white/60 text-sm">Notice Board is Empty</h3>
              <p className="text-white/40 text-xs mt-1">No updates are currently active in this category.</p>
            </div>
          )}

          {/* Load More Pagination */}
          {filteredNotices.length > visibleCount && (
            <div className="mt-8 flex flex-col items-center gap-2 pt-2">
              <button 
                onClick={() => setVisibleCount(prev => prev + 4)}
                className="w-full py-3 rounded-xl border border-white/10 hover:border-orange-burnt bg-white/5 hover:bg-orange-burnt/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.98]"
              >
                Load More Updates
              </button>
              <p className="text-white/40 font-sans text-[10px] font-semibold">
                Showing {Math.min(visibleCount, filteredNotices.length)} of {filteredNotices.length} latest updates
              </p>
            </div>
          )}
        </div>
      )}

      {/* PDF View Modal Overlay */}
      <AnimatePresence>
        {selectedPdfUrl && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div onClick={() => setSelectedPdfUrl(null)} className="absolute inset-0" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-[#080F25] w-full max-w-lg h-[75vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 border border-white/10"
            >
              {/* Modal Header */}
              <div className="bg-[#050B18] text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-white/5">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="w-4 h-4 text-orange-burnt shrink-0" />
                  <h4 className="font-display font-bold text-xs truncate max-w-[200px]">{selectedNoticeTitle}</h4>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <a
                    href={selectedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setSelectedPdfUrl(null)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/70 hover:text-white"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer Body */}
              <div className="flex-grow relative bg-[#050B18] overflow-hidden">
                {isPdfLoading && !embedFailed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050B18] z-10">
                    <DNALoader />
                    <span className="text-[10px] font-bold tracking-widest font-display uppercase text-white/40 mt-3">
                      Loading Attachment...
                    </span>
                  </div>
                )}

                {!embedFailed ? (
                  <embed
                    key={selectedPdfUrl}
                    src={selectedPdfUrl}
                    type="application/pdf"
                    className="w-full h-full border-none"
                    onLoad={() => setIsPdfLoading(false)}
                    onError={() => { setEmbedFailed(true); setIsPdfLoading(false); }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-[#050B18]">
                    <AlertTriangle className="w-10 h-10 text-orange-burnt mb-3 animate-bounce" />
                    <h4 className="font-display font-bold text-white text-sm">Preview Blocked</h4>
                    <p className="text-white/50 text-xs font-sans max-w-xs leading-relaxed mb-4">
                      Capacitor sandbox requires opening PDF documents outside the frame.
                    </p>
                    <a
                      href={selectedPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Open Document
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notices;
