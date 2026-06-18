import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Trophy, GraduationCap } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { DNALoader } from '../components/DNALoader';

const CATEGORIES = ['All', 'Academic', 'Sports', 'Cultural', 'Research', 'Competition'];

const CATEGORY_COLORS: Record<string, string> = {
  academic: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  sports: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  cultural: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
  research: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  competition: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

export const Achievements: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('achievements').select('*').order('created_at', { ascending: false });
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<Trophy className="w-6 h-6 animate-pulse" />}
        title="Hall of Fame"
        subtitle="Celebrating TGPCOP's finest pharmacy students and their outstanding milestones inside & outside Nagpur"
        breadcrumb="Achievements"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Category Tabs */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl font-display text-xs font-bold tracking-wider transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15 scale-102'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <DNALoader />
            <span className="text-xs font-bold font-display uppercase tracking-widest text-white/50 mt-4 animate-pulse">Loading Hall of Fame...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl max-w-lg mx-auto flex flex-col items-center p-6 shadow-2xl">
            <Trophy className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/70 mb-1">No Achievements Recorded</h3>
            <p className="text-white/50 text-sm font-sans">No entries match the "{activeCategory}" category currently.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filtered.map(item => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.2)' }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)] overflow-hidden flex flex-col hover:border-orange-burnt/40 transition-all duration-300"
              >
                {item.image_url ? (
                  <div className="h-48 overflow-hidden relative border-b border-orange-burnt/10">
                    <img src={item.image_url} alt={item.student_name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                ) : (
                  <div className="h-36 bg-gradient-to-br from-white/5 to-orange-burnt/10 flex items-center justify-center border-b border-orange-burnt/10">
                    <Trophy className="w-12 h-12 text-orange-burnt/40" />
                  </div>
                )}
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[item.category?.toLowerCase()] || 'bg-white/5 text-white/60 border-white/10'}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white mb-1">{item.student_name}</h3>
                  <div className="flex items-center space-x-1.5 text-white/50 text-xs mb-2">
                    <GraduationCap className="w-4 h-4 text-orange-burnt" />
                    <span>{item.year}</span>
                  </div>
                  <p className="text-xs sm:text-sm font-display font-semibold text-orange-burnt mb-2">{item.title}</p>
                  {item.description && <p className="text-xs text-white/60 font-sans leading-relaxed flex-grow">{item.description}</p>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Achievements;
