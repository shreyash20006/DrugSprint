import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/admin/StatsCard';
import { 
  Megaphone, 
  Calendar, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  ArrowRight,
  Plus,
  BadgeCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingQuestions: 0,
    noticesCount: 0,
    activeEventsCount: 0,
    verifiedPercentage: 0,
  });
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAndRecent = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch total questions & pending questions count
      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('status, created_at, student_name, directed_to, question_text');
      if (qErr) throw qErr;

      const totalQ = questions?.length || 0;
      const pendingQ = questions?.filter((q) => q.status === 'pending').length || 0;

      // 2. Fetch notices count
      const { count: noticesCount, error: nErr } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true });
      if (nErr) throw nErr;

      // 3. Fetch active events count
      const { count: activeEventsCount, error: eErr } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (eErr) throw eErr;

      // 4. Fetch verification stats
      const { data: verifications, error: vErr } = await supabase
        .from('student_verifications')
        .select('verification_status');
      if (vErr) throw vErr;
      
      let verifiedPercentage = 0;
      if (verifications && verifications.length > 0) {
        const verifiedCount = verifications.filter(v => v.verification_status === 'verified').length;
        verifiedPercentage = Math.round((verifiedCount / verifications.length) * 100);
      }

      setStats({
        totalQuestions: totalQ,
        pendingQuestions: pendingQ,
        noticesCount: noticesCount || 0,
        activeEventsCount: activeEventsCount || 0,
        verifiedPercentage,
      });

      // Sort and retrieve last 5 recent questions
      const sortedQ = questions?.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)) || [];
      setRecentQuestions(sortedQ.slice(0, 5));
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative z-10">
      
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-white/50">
          <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
          <p className="font-display text-sm tracking-wider uppercase">Fetching console metrics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Grid (4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              label="Total Questions"
              value={stats.totalQuestions}
              icon={<HelpCircle className="w-5 h-5 text-white" />}
              trendColor="navy"
            />
            <StatsCard
              label="Pending Questions"
              value={stats.pendingQuestions}
              icon={<AlertCircle className="w-5 h-5 text-white" />}
              trendColor="orange"
            />
            <StatsCard
              label="Notices Published"
              value={stats.noticesCount}
              icon={<Megaphone className="w-5 h-5 text-white" />}
              trendColor="amber"
            />
            <StatsCard
              label="Active Events"
              value={stats.activeEventsCount}
              icon={<Calendar className="w-5 h-5 text-white" />}
              trendColor="green"
            />
          </div>

          {/* Bottom Grid: Recent Questions + Quick Actions Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Recent Questions Table panel (lg:span-8) */}
            <div className="lg:col-span-8 glass-panel glow-card rounded-2xl p-6 shadow-2xl border border-white/5 space-y-5 bg-[#0F1E42]/10">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-display font-extrabold text-base text-white flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-orange-burnt animate-pulse" />
                  <span>Recent Student Inquiries</span>
                </h3>
                <Link
                  to="/admin/questions"
                  className="inline-flex items-center space-x-1 text-xs font-display font-extrabold text-orange-burnt hover:text-white transition-colors group"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40 bg-white/5">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">To</th>
                      <th className="px-4 py-3">Question Summary</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentQuestions.map((q, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-display font-bold text-xs text-white">{q.student_name}</span>
                            <span className="text-[9px] text-white/45 font-sans mt-0.5">{q.student_year}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-orange-burnt">
                          {q.directed_to}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-white/70 max-w-xs truncate font-sans">
                          "{q.question_text}"
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <span className={`inline-block text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded border ${
                            q.status === 'answered' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                              : q.status === 'seen'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                              : 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/25'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {recentQuestions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-12">
                          <HelpCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                          <p className="text-xs text-white/40 font-display">No questions submitted yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Widgets (lg:span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Verification Percentage Widget */}
              <div className="glass-panel glow-card rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-amber-500/20 bg-amber-500/5">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BadgeCheck className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="font-display font-extrabold text-base text-amber-500 mb-2 flex items-center">
                  <BadgeCheck className="w-4 h-4 mr-2" /> PRN Verification
                </h3>
                <div className="mt-4 relative z-10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-display font-extrabold text-white">{stats.verifiedPercentage}%</span>
                    <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-wider">Verified</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${stats.verifiedPercentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-white/40 mt-3 font-sans leading-relaxed">
                    Live database linking active. Verifying student accounts automatically.
                  </p>
                </div>
              </div>

              {/* Quick Actions Shortcuts panel */}
              <div className="glass-panel glow-card rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/5 space-y-5 bg-[#0F1E42]/10">
                <div className="absolute inset-0 grid-bg-overlay opacity-10 pointer-events-none" />
                
                <div className="border-b border-white/5 pb-3 z-10 relative">
                  <h3 className="font-display font-extrabold text-base text-orange-burnt">
                    Quick Tasks Panel
                  </h3>
                  <p className="text-[10px] text-white/45 font-sans mt-0.5">
                    Publish updates and portfolio photos live to the college portal.
                  </p>
                </div>

                <div className="space-y-3.5 z-10 relative">
                  <Link
                    to="/admin/notices"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-sm border border-white/5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Plus className="w-4 h-4 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      <span>📢 Add Announcement</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/admin/events"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-sm border border-white/5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Plus className="w-4 h-4 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      <span>🎉 Add Live Event</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/admin/gallery"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-sm border border-white/5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Plus className="w-4 h-4 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      <span>📸 Upload Gallery Image</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default AdminDashboard;
