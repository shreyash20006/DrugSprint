import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Newspaper, Download, ChevronDown, ChevronUp, Calendar, Loader2 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('newsletters')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      setNewsletters(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Campus Digests
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Council Newsletters
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Monthly pharmaceutical news, research summaries, student achievements, and council updates published officially.
        </p>
      </section>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Loading Newsletters...</span>
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <Newspaper className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Newsletters</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            Check back later for active newsletter publications.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsletters.map((nl) => {
            const sections: { heading: string; content: string }[] = 
              typeof nl.sections === 'string' ? JSON.parse(nl.sections) : (nl.sections || []);
            const isExpanded = expandedId === nl.id;

            return (
              <div
                key={nl.id}
                className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg"
              >
                <div className="p-4 flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1 font-sans">
                        <Calendar className="w-3.5 h-3.5 text-orange-burnt" />
                        <span>{nl.month}</span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-white leading-snug">{nl.title}</h3>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {nl.pdf_url && (
                        <a
                          href={nl.pdf_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center p-2 rounded-xl bg-orange-burnt text-white active:scale-95 transition-transform"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : nl.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-orange-burnt" /> : <ChevronDown className="w-3.5 h-3.5 text-orange-burnt" />}
                        <span>{isExpanded ? 'Hide' : 'Read'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && sections.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-white/5 bg-[#050B18]/30"
                    >
                      <div className="p-4 space-y-4">
                        {sections.map((sec, idx) => (
                          <div key={idx} className="space-y-1">
                            <h4 className="font-display font-bold text-xs text-orange-burnt">{sec.heading}</h4>
                            <p className="text-[11px] text-white/70 font-sans leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Newsletter;
