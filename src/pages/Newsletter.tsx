import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { parseJsonArray } from '../lib/parseJson';
import { Newspaper, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface NewsletterSection {
  heading: string;
  content: string;
}

export const Newsletter: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('newsletters')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <PublicPageShell
      title="📰 Council Newsletter"
      subtitle="Monthly updates from Student Council"
      icon={<Newspaper className="w-6 h-6" />}
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-navy-dark/50 py-16">No newsletters published yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((n) => {
            const sections = parseJsonArray<NewsletterSection>(n.content);
            const isOpen = expanded === n.id;
            return (
              <div key={n.id} className="bg-white rounded-2xl border border-navy-dark/10 overflow-hidden shadow-sm">
                <div className="p-5">
                  <h3 className="font-display font-bold text-lg text-navy-dark">
                    📰 {n.month || n.title}
                  </h3>
                  <p className="text-sm text-navy-dark/60 mt-1 line-clamp-2">
                    {sections[0]?.content?.slice(0, 120) || n.title}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : n.id)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg"
                    >
                      Read Online
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                    {n.pdf_url && (
                      <a
                        href={n.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-4 py-2 border border-navy-dark/15 text-xs font-bold rounded-lg text-navy-dark"
                      >
                        Download PDF <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-navy-dark/10 px-5 pb-5 space-y-4"
                    >
                      {sections.map((s, i) => (
                        <div key={i}>
                          <h4 className="font-display font-bold text-sm text-orange-burnt">{s.heading}</h4>
                          <p className="text-sm text-navy-dark/70 mt-1 whitespace-pre-line leading-relaxed">
                            {s.content}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </PublicPageShell>
  );
};

export default Newsletter;
