import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Medal, ShieldAlert, Search, Loader2 } from 'lucide-react';

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

  const filteredByCategory = activeCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category && a.category.toLowerCase() === activeCategory.toLowerCase());

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

  const rankedStudents = Object.values(studentGroups)
    .sort((a, b) => b.count - a.count || a.student_name.localeCompare(b.student_name))
    .filter(s => s.student_name.toLowerCase().includes(searchQuery.toLowerCase()));

  const podiumStudents = rankedStudents.slice(0, 3);

  const categories = [
    { id: 'all', label: 'All Fields' },
    { id: 'academic', label: 'Academic' },
    { id: 'sports', label: 'Sports' },
    { id: 'cultural', label: 'Cultural' },
    { id: 'research', label: 'Research' },
    { id: 'competition', label: 'Contests' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Leaderboard
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Campus Achievers
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Ranks are computed live based on total approved academic honors, sports accolades, research publications, and fests.
        </p>
      </section>

      {/* Filters */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-lg space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            placeholder="Search achiever name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-[#050B18]/60 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-colors placeholder-white/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[9px] font-display font-bold uppercase tracking-wider shrink-0 transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-burnt text-white'
                  : 'bg-white/5 border border-white/5 text-white/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Computing Leaderboard...</span>
        </div>
      ) : rankedStudents.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <ShieldAlert className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Achievers Found</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            Try changing the search query or category filters.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Podium Layout */}
          {podiumStudents.length > 0 && (
            <div className="flex items-end justify-center gap-3 pt-4 px-2">
              {/* Rank 2 */}
              {podiumStudents[1] && (
                <div className="bg-[#0F1E42]/80 border border-white/10 p-3 rounded-2xl flex-1 text-center flex flex-col items-center justify-between h-36 relative shadow-md">
                  <span className="absolute top-1.5 left-2 text-[7px] font-bold text-white/30 tracking-wider">#2</span>
                  <div className="w-9 h-9 rounded-full bg-slate-400/10 border border-slate-400 flex items-center justify-center text-slate-300">
                    <Medal className="w-5 h-5" />
                  </div>
                  <h4 className="font-display font-bold text-[10px] text-white line-clamp-1 mt-1.5">{podiumStudents[1].student_name}</h4>
                  <div className="mt-1">
                    <span className="text-sm font-display font-extrabold text-slate-300">{podiumStudents[1].count}</span>
                    <span className="text-[7px] text-white/40 uppercase block leading-none mt-0.5">Awards</span>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {podiumStudents[0] && (
                <div className="bg-gradient-to-b from-[#1E2E5D]/90 to-[#0F1E42]/95 border border-orange-burnt/40 p-3 rounded-2xl flex-1 text-center flex flex-col items-center justify-between h-40 relative shadow-lg">
                  <span className="absolute top-1.5 left-2 text-[7px] font-bold text-orange-burnt tracking-wider">#1</span>
                  <div className="w-11 h-11 rounded-full bg-gold-accent/15 border-2 border-gold-accent flex items-center justify-center text-gold-accent shadow-md">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-xs text-white line-clamp-1 mt-1.5">{podiumStudents[0].student_name}</h4>
                  <div className="mt-1">
                    <span className="text-base font-display font-extrabold text-gold-accent">{podiumStudents[0].count}</span>
                    <span className="text-[7px] text-white/40 uppercase block leading-none mt-0.5">Awards</span>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {podiumStudents[2] && (
                <div className="bg-[#0F1E42]/80 border border-white/10 p-3 rounded-2xl flex-1 text-center flex flex-col items-center justify-between h-32 relative shadow-md">
                  <span className="absolute top-1.5 left-2 text-[7px] font-bold text-white/30 tracking-wider">#3</span>
                  <div className="w-8 h-8 rounded-full bg-amber-600/10 border border-amber-600 flex items-center justify-center text-amber-500">
                    <Medal className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="font-display font-bold text-[10px] text-white line-clamp-1 mt-1.5">{podiumStudents[2].student_name}</h4>
                  <div className="mt-1">
                    <span className="text-sm font-display font-extrabold text-amber-500">{podiumStudents[2].count}</span>
                    <span className="text-[7px] text-white/40 uppercase block leading-none mt-0.5">Awards</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Ranks List */}
          <div className="bg-[#0F1E42]/50 border border-white/5 rounded-2xl p-4 shadow-lg space-y-2">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-2 border-b border-white/5 pb-2">
              Hall of Fame Rankings
            </span>

            <div className="space-y-2">
              {rankedStudents.map((student, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={student.student_name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#050B18]/40 border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg font-display font-bold text-[10px] flex items-center justify-center border ${
                        rank === 1 ? 'bg-gold-accent/15 border-gold-accent text-gold-accent' :
                        rank === 2 ? 'bg-slate-300/15 border-slate-300 text-slate-300' :
                        rank === 3 ? 'bg-amber-600/15 border-amber-600 text-amber-500' :
                        'bg-white/5 border-white/5 text-white/50'
                      }`}>
                        #{rank}
                      </div>
                      <div>
                        <span className="block font-display font-bold text-xs text-white leading-tight">{student.student_name}</span>
                        <span className="block text-[8px] text-white/40 mt-0.5">{student.year}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-display font-bold text-xs text-orange-burnt">{student.count}</span>
                      <span className="block text-[7px] font-bold text-white/30 uppercase tracking-wider">Milestones</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
