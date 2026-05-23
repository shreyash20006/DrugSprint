import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ACHIEVEMENT_CATEGORIES } from '../constants/formOptions';
import { Trophy, Loader2 } from 'lucide-react';

export const Achievements: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [tab, setTab] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const filtered =
    tab === 'All' ? items : items.filter((a) => a.category?.toLowerCase() === tab.toLowerCase());

  const badgeColor = (cat: string) => {
    const c = cat?.toLowerCase();
    if (c === 'academic') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (c === 'sports') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (c === 'cultural') return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    if (c === 'research') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20';
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="w-12 h-12 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt mx-auto mb-4">
            <Trophy className="w-6 h-6" />
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-dark">🏆 Hall of Fame</h1>
          <p className="text-navy-dark/60 text-sm mt-2">Celebrating TGPCOP&apos;s Finest</p>
        </motion.div>
        <div>
          <div className="flex flex-wrap gap-2 justify-center mb-8 -mt-4">
            {ACHIEVEMENT_CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === c ? 'bg-orange-burnt text-white' : 'bg-white text-navy-dark/70 border border-navy-dark/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-navy-dark/50 py-16">No achievements yet.</p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6"
            >
              {filtered.map((a) => (
                <motion.div
                  key={a.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                  className="break-inside-avoid bg-white rounded-2xl border border-navy-dark/10 overflow-hidden shadow-sm"
                >
                  {a.image_url && (
                    <img src={a.image_url} alt={a.student_name} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5 space-y-2">
                    <Trophy className="w-5 h-5 text-orange-burnt" />
                    <h3 className="font-display font-bold text-navy-dark">{a.student_name}</h3>
                    <p className="text-xs text-navy-dark/50">{a.year}</p>
                    <hr className="border-navy-dark/10" />
                    <p className="font-display font-semibold text-sm text-navy-dark">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-navy-dark/60 leading-relaxed">{a.description}</p>
                    )}
                    <span
                      className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${badgeColor(a.category)}`}
                    >
                      {a.category}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
