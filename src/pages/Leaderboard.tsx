import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Star, ShieldAlert, Award, Search, Sparkles } from 'lucide-react';

interface AchievementGroup {
  student_name: string;
  year: string;
  count: number;
  achievements: any[];
}

export const Leaderboard: React.FC = () => {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchAchievements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAchievements(data || []);
      } catch (err: any) {
        console.error('Error loading leaderboard data:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  // Filter achievements by category
  const filteredByCategory = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category && a.category.toLowerCase() === activeCategory.toLowerCase());

  // Group achievements by student name to calculate top leaders
  const studentGroups: Record<string, AchievementGroup> = {};

  filteredByCategory.forEach(a => {
    const name = (a.student_name || 'Anonymous').trim();
    if (!studentGroups[name]) {
      studentGroups[name] = {
        student_name: name,
        year: a.year || 'Unknown Year',
        count: 0,
        achievements: []
      };
    }
    studentGroups[name].count += 1;
    studentGroups[name].achievements.push(a);
  });

  // Convert to array, sort by count (descending)
  const rankedStudents = Object.values(studentGroups)
    .sort((a, b) => b.count - a.count || a.student_name.localeCompare(b.student_name))
    // Filter by search query
    .filter(s => s.student_name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Podium Positions (Top 3 overall)
  const podiumStudents = rankedStudents.slice(0, 3);

  const categories = [
    { id: 'all', label: 'All Fields', icon: Award },
    { id: 'academic', label: 'Academic', icon: Award },
    { id: 'sports', label: 'Sports', icon: Award },
    { id: 'cultural', label: 'Cultural', icon: Award },
    { id: 'research', label: 'Research', icon: Award },
    { id: 'competition', label: 'Competitions', icon: Award },
  ];

  return (
    <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[10%] right-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-xl bg-orange-burnt/10 flex items-center justify-center text-orange-burnt border border-orange-burnt/20 shadow-lg"
          >
            <Trophy className="w-6 h-6" />
          </motion.div>
          
          <span className="text-orange-burnt text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            TGPCOP Student Hall of Fame
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight uppercase">
            Live Leaderboard
          </h1>
          <p className="text-white/60 text-xs sm:text-sm max-w-xl leading-relaxed">
            Ranks are computed live based on total approved academic honors, sports accolades, research publishing, and contest medals.
          </p>
        </div>

        {/* Categories Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-[#080F25]/85 p-3 rounded-2xl border border-white/10 shadow-2xl">
          
          {/* Categories Tab slider */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); }}
                  className={`flex-grow md:flex-grow-0 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wide transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-md shadow-orange-burnt/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-white/35" />
            <input
              type="text"
              placeholder="Search achiever name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#050B18] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-burnt transition-colors"
            />
          </div>
        </div>

        {/* Leaderboard layout (Podium at top, details list below) */}
        {isLoading ? (
          <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-2 border-orange-burnt border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rankedStudents.length === 0 ? (
          <div className="text-center py-20 bg-[#080F25]/90 border border-white/10 rounded-3xl shadow-2xl">
            <ShieldAlert className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white text-base">No Achievers Found</h3>
            <p className="text-xs text-white/40 font-sans mt-1">Try changing the search query or category filters.</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* 🥈🥉🥇 PODIUM DISPLAY */}
            {podiumStudents.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6 px-4">
                
                {/* 2nd Place: Silver Podium */}
                {podiumStudents[1] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="order-2 md:order-1 bg-[#080F25]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden flex flex-col justify-between md:h-[260px]"
                  >
                    <div className="absolute top-2 left-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">RANK #2</div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-slate-300 flex items-center justify-center text-slate-300 shadow-lg mb-3">
                        <Medal className="w-8 h-8" />
                      </div>
                      <h3 className="font-display font-bold text-white text-sm line-clamp-1">{podiumStudents[1].student_name}</h3>
                      <span className="text-[10px] text-white/40 mt-0.5">{podiumStudents[1].year}</span>
                    </div>

                    <div className="mt-4">
                      <span className="text-xl font-display font-extrabold text-slate-300">{podiumStudents[1].count}</span>
                      <span className="text-[10px] font-bold text-slate-400/60 uppercase block">Awards/Achievements</span>
                    </div>
                  </motion.div>
                )}

                {/* 1st Place: Gold Podium */}
                {podiumStudents[0] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 35 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="order-1 md:order-2 bg-gradient-to-b from-[#16203D]/90 to-[#0C1227]/95 backdrop-blur-2xl border border-orange-burnt/30 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden flex flex-col justify-between md:h-[300px]"
                  >
                    {/* Glowing golden rays background effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-burnt/10 to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 text-[9px] font-bold text-orange-burnt uppercase tracking-widest">RANK #1</div>

                    <div className="flex flex-col items-center relative z-10">
                      <div className="relative group mb-3">
                        <div className="absolute inset-0 bg-gold-accent rounded-full blur opacity-45 animate-pulse" />
                        <div className="relative w-16 h-16 rounded-full bg-[#121E3D] border-2 border-gold-accent flex items-center justify-center text-gold-accent shadow-xl">
                          <Trophy className="w-9 h-9" />
                        </div>
                      </div>
                      <h3 className="font-display font-extrabold text-white text-base line-clamp-1">{podiumStudents[0].student_name}</h3>
                      <span className="text-[10px] text-white/40 mt-0.5">{podiumStudents[0].year}</span>
                    </div>

                    <div className="mt-4 relative z-10">
                      <span className="text-2xl font-display font-extrabold text-gold-accent flex items-center justify-center gap-1">
                        {podiumStudents[0].count} <Star className="w-5 h-5 fill-gold-accent text-gold-accent inline" />
                      </span>
                      <span className="text-[10px] font-bold text-white/40 uppercase block">Total Achievements</span>
                    </div>
                  </motion.div>
                )}

                {/* 3rd Place: Bronze Podium */}
                {podiumStudents[2] && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="order-3 bg-[#080F25]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 text-center shadow-xl relative overflow-hidden flex flex-col justify-between md:h-[230px]"
                  >
                    <div className="absolute top-2 left-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">RANK #3</div>

                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 border-2 border-amber-600 flex items-center justify-center text-amber-500 shadow-lg mb-3">
                        <Medal className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-white text-xs line-clamp-1">{podiumStudents[2].student_name}</h3>
                      <span className="text-[10px] text-white/40 mt-0.5">{podiumStudents[2].year}</span>
                    </div>

                    <div className="mt-4">
                      <span className="text-xl font-display font-extrabold text-amber-500">{podiumStudents[2].count}</span>
                      <span className="text-[10px] font-bold text-amber-600/60 uppercase block">Awards/Achievements</span>
                    </div>
                  </motion.div>
                )}

              </div>
            )}

            {/* 🏆 LEADERBOARD RANKINGS DETAILS LIST */}
            <div className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Hall Achievers Rankings</span>
                <span className="text-[10px] text-white/40">{rankedStudents.length} entries registered</span>
              </div>

              <div className="space-y-2">
                {rankedStudents.map((student, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div 
                      key={student.student_name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(index * 0.05, 0.4) }}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/5 hover:border-white/10 transition-all gap-4"
                    >
                      {/* Rank Icon / Number */}
                      <div className="flex items-center space-x-3.5 shrink-0">
                        <div className={`w-8 h-8 rounded-xl font-display font-extrabold text-xs flex items-center justify-center border ${
                          rank === 1 
                            ? 'bg-gold-accent/10 border-gold-accent text-gold-accent' 
                            : rank === 2 
                              ? 'bg-slate-300/10 border-slate-300 text-slate-300' 
                              : rank === 3 
                                ? 'bg-amber-600/10 border-amber-600 text-amber-500' 
                                : 'bg-[#050B18] border-white/5 text-white/60'
                        }`}>
                          #{rank}
                        </div>
                        
                        <div>
                          <span className="block font-display font-bold text-xs text-white leading-tight">{student.student_name}</span>
                          <span className="block text-[9px] text-white/40 mt-0.5">{student.year}</span>
                        </div>
                      </div>

                      {/* Display Progress Bar count indicator */}
                      <div className="hidden sm:flex flex-grow max-w-md items-center space-x-3">
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((student.count / (podiumStudents[0]?.count || 1)) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className={`h-full rounded-full bg-gradient-to-r ${
                              rank === 1 
                                ? 'from-gold-accent to-yellow-500' 
                                : 'from-orange-burnt to-[#E06D2B]'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Count Display */}
                      <div className="text-right shrink-0">
                        <span className="font-display font-extrabold text-white text-sm">{student.count}</span>
                        <span className="block text-[8px] font-bold text-white/40 uppercase tracking-wide">Awards</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Leaderboard;
