import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Trophy, GraduationCap, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Academic', 'Sports', 'Cultural', 'Research', 'Competition'];

const CATEGORY_COLORS: Record<string, string> = {
  academic: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  sports: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cultural: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  competition: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const Achievements: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });
      setItems(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (activeCategory === 'All') setFiltered(items);
    else setFiltered(items.filter(a => a.category.toLowerCase() === activeCategory.toLowerCase()));
  }, [items, activeCategory]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Hall of Fame
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Student Achievements
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Celebrating outstanding academic milestones, sports medals, research publications, and cultural achievements of TGPCOP students.
        </p>
      </section>

      {/* Categories Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full font-display text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                isActive
                  ? 'bg-orange-burnt text-white'
                  : 'bg-[#0F1E42]/80 text-white/60 border border-white/5'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Loading Achievements...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <Trophy className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Achievements</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            No milestones registered in the "{activeCategory}" category currently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-lg"
            >
              {item.image_url ? (
                <div className="h-40 overflow-hidden relative border-b border-white/5">
                  <img src={item.image_url} alt={item.student_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-24 bg-white/5 flex items-center justify-center border-b border-white/5">
                  <Trophy className="w-8 h-8 text-orange-burnt/40" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    CATEGORY_COLORS[item.category?.toLowerCase()] || 'bg-white/5 text-white/50 border-white/10'
                  }`}>
                    {item.category}
                  </span>
                  <div className="flex items-center gap-1 text-white/45 text-[10px] font-sans">
                    <GraduationCap className="w-3.5 h-3.5 text-orange-burnt" />
                    <span>{item.year}</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">{item.student_name}</h3>
                  <p className="text-[11px] font-display font-bold text-orange-burnt mt-0.5">{item.title}</p>
                </div>
                {item.description && (
                  <p className="text-[11px] text-white/60 leading-relaxed font-sans pt-1 border-t border-white/5">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Achievements;
