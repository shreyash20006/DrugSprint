import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Eye, ExternalLink, RefreshCw, FileText, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCache, setCache } from '../../lib/cache';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface Notice {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  views?: number;
  is_pinned?: boolean;
  pdf_url?: string;
  external_link?: string;
  linkUrl?: string;
  linkText?: string;
}

const CACHE_KEY = 'news';

export const News: React.FC = () => {
  const [news, setNews] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);

  const fetchNews = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .in('category', ['General', 'News'])
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const items = data || [];
      setNews(items);
      setCache<Notice[]>(CACHE_KEY, items, 60);
    } catch {
      // Fallback to cache silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cache immediately, then fetch fresh in background
  useEffect(() => {
    const cached = getCache<Notice[]>(CACHE_KEY);
    if (cached) {
      setNews(cached);
      setIsLoading(false);
      fetchNews(false); // background refresh
    } else {
      fetchNews(true);
    }
  }, [fetchNews]);

  const { isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: () => fetchNews(false),
  });

  const incrementViews = async (id: string) => {
    try {
      await supabase.rpc('increment_notice_views', { notice_id: id });
      setNews((prev) =>
        prev.map((n) => (n.id === id ? { ...n, views: (n.views || 0) + 1 } : n))
      );
    } catch { /* silent */ }
  };

  const visible = news.slice(0, visibleCount);

  return (
    <div className="space-y-5 pb-6 pt-4">
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

      {/* Header */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Latest Updates
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight flex items-center gap-2">
          Council News 📰
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          General announcements, institutional news, and updates from the student council.
        </p>
      </section>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl p-5 space-y-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="h-5 bg-white/5 w-3/4 rounded" />
              <div className="h-4 bg-white/5 w-full rounded" />
              <div className="h-4 bg-white/5 w-5/6 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((item) => {
              const isExpanded = expandedId === item.id;
              const pdfUrl =
                item.pdf_url ||
                (item.linkUrl?.toLowerCase().endsWith('.pdf') ? item.linkUrl : null);
              const externalLink =
                item.external_link ||
                (!item.linkUrl?.toLowerCase().endsWith('.pdf') ? item.linkUrl : null);

              const formattedDate = item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'No Date';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 relative overflow-hidden shadow-md active:scale-[0.99] transition-transform"
                >
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-2xl" />

                  <div className="pl-2">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Newspaper className="w-3.5 h-3.5 text-orange-400" />
                        <span className="px-2.5 py-0.5 rounded-full font-display text-[9px] uppercase font-bold tracking-widest bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          News
                        </span>
                        {item.is_pinned && (
                          <span className="px-2 py-0.5 rounded-full font-display text-[9px] uppercase font-bold tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-white/40 font-sans text-[10px] font-semibold">
                        {formattedDate}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-extrabold text-sm text-white leading-snug tracking-wide mb-2">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`font-sans text-xs text-white/70 leading-relaxed whitespace-pre-wrap ${
                        !isExpanded ? 'line-clamp-3' : ''
                      }`}
                    >
                      {item.description}
                    </p>
                    {(item.description?.length ?? 0) > 120 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="text-orange-burnt text-[10px] font-display font-bold uppercase tracking-wider mt-1.5"
                      >
                        {isExpanded ? 'Show Less' : 'Read More...'}
                      </button>
                    )}

                    {/* Actions */}
                    {(pdfUrl || externalLink) && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                        {pdfUrl && (
                          <a
                            href={pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => incrementViews(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt font-display text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                          >
                            <FileText className="w-3 h-3" />
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                        {externalLink && !pdfUrl && (
                          <a
                            href={externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => incrementViews(item.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-display text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                          >
                            {item.linkText || 'Open'} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {item.views !== undefined && (
                          <span className="text-white/40 font-sans text-[10px] flex items-center gap-1 ml-auto">
                            <Eye className="w-3 h-3" /> {item.views}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {news.length === 0 && (
            <div className="text-center py-14 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center">
              <Newspaper className="w-10 h-10 text-white/10 mb-3 animate-pulse" />
              <h3 className="font-display font-bold text-white/60 text-sm">No News Yet</h3>
              <p className="text-white/40 text-xs mt-1">
                General council announcements will appear here.
              </p>
            </div>
          )}

          {news.length > visibleCount && (
            <button
              onClick={() => setVisibleCount((v) => v + 6)}
              className="w-full py-3 rounded-xl border border-white/10 hover:border-orange-burnt bg-white/5 hover:bg-orange-burnt/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.98]"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default News;
