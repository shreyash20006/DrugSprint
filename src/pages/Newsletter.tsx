import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Newspaper, Download, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { DNALoader } from '../components/DNALoader';

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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<Newspaper className="w-6 h-6 animate-pulse" />}
        title="Council Newsletter"
        subtitle="Monthly pharmaceutical digests, student updates, anti-ragging forums, and scientific week roundups"
        breadcrumb="Newsletters"
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 mt-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <DNALoader />
            <span className="text-xs font-bold font-display uppercase tracking-widest text-white/50 mt-4 animate-pulse">Loading Newsletters...</span>
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl flex flex-col items-center p-6 shadow-2xl">
            <Newspaper className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/70 mb-1">No Newsletters Published</h3>
            <p className="text-white/50 text-sm font-sans">Check back later for active newsletter publications.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {newsletters.map((nl, i) => {
              const sections: { heading: string; content: string }[] = typeof nl.sections === 'string' ? JSON.parse(nl.sections) : (nl.sections || []);
              const isExpanded = expandedId === nl.id;

              return (
                <motion.div
                  key={nl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)] overflow-hidden transition-all duration-300"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 text-white/40 text-xs mb-1.5 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-orange-burnt" />
                          <span>{nl.month}</span>
                        </div>
                        <h3 className="font-display font-extrabold text-lg text-white">{nl.title}</h3>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        {nl.pdf_url && (
                          <a
                            href={nl.pdf_url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-orange-burnt/10 border border-white/5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : nl.id)}
                          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/5 transition-all"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3.5 h-3.5 text-orange-burnt" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3.5 h-3.5 text-orange-burnt" />
                              <span>Read</span>
                            </>
                          )}
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
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pb-6 pt-2 space-y-5 border-t border-orange-burnt/15 bg-[#0F1E42]/30">
                          {sections.map((sec, j) => (
                            <div key={j}>
                              <h4 className="font-display font-bold text-sm text-gold-accent mb-2">{sec.heading}</h4>
                              <p className="text-white/70 text-sm font-sans leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Newsletter;
