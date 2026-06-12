import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/admin/StatsCard';
import { 
  Calendar, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  ArrowRight,
  Plus,
  BadgeCheck,
  Sparkles
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 relative z-10">
      
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center text-white/50">
          <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
          <p className="font-display text-sm tracking-wider uppercase">Fetching console metrics...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards Grid (4 columns) */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants}>
              <StatsCard
                label="Total Questions"
                value={stats.totalQuestions}
                icon={<HelpCircle className="w-5 h-5" />}
                trendColor="navy"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatsCard
                label="Pending Reply"
                value={stats.pendingQuestions}
                icon={<AlertCircle className="w-5 h-5" />}
                trendColor={stats.pendingQuestions > 0 ? 'orange' : 'green'}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                label="Verified Students"
                value={`${stats.verifiedPercentage}%`}
                icon={<BadgeCheck className="w-5 h-5" />}
                trendColor="green"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StatsCard
                label="Active Events"
                value={stats.activeEventsCount}
                icon={<Calendar className="w-5 h-5" />}
                trendColor="amber"
              />
            </motion.div>
          </motion.div>

          {/* Bottom Grid: Recent Questions + Quick Actions Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Recent Questions Table panel (lg:span-8) */}
            <div className="lg:col-span-8 bg-[#0A1428]/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 space-y-5 relative overflow-hidden group">
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-orange-burnt/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-orange-burnt/20 transition-colors" />
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
                <h3 className="font-display font-extrabold text-lg text-white flex items-center space-x-2">
                  <div className="p-2 bg-orange-burnt/10 rounded-lg border border-orange-burnt/20 shadow-inner">
                    <Clock className="w-4 h-4 text-orange-burnt" />
                  </div>
                  <span>Recent Inquiries</span>
                </h3>
                <Link
                  to="/admin/questions"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-display font-extrabold text-orange-400 hover:text-orange-300 transition-all group/link"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/40 bg-black/20">
                      <th className="px-5 py-4 pl-6 rounded-tl-xl">Student</th>
                      <th className="px-5 py-4">To</th>
                      <th className="px-5 py-4">Question Summary</th>
                      <th className="px-5 py-4 pr-6 text-right rounded-tr-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentQuestions.map((q, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03] transition-colors group/row">
                        <td className="px-5 py-4 pl-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-display font-bold text-sm text-white group-hover/row:text-orange-100 transition-colors">{q.student_name}</span>
                            <span className="text-[10px] text-white/50 font-sans mt-1">{q.student_year || 'Unknown Year'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs font-bold text-orange-burnt">
                          <span className="bg-orange-burnt/10 border border-orange-burnt/20 px-2.5 py-1 rounded-md">{q.directed_to}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-white/70 max-w-[200px] truncate font-sans">
                          "{q.question_text}"
                        </td>
                        <td className="px-5 py-4 pr-6 whitespace-nowrap text-right">
                          <span className={`inline-block text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded border shadow-sm ${
                            q.status === 'answered' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' 
                              : q.status === 'seen'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'
                          }`}>
                            {q.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {recentQuestions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-16">
                          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-lg">
                            <HelpCircle className="w-8 h-8 text-white/20" />
                          </div>
                          <p className="text-sm text-white font-display font-bold mb-1">No questions yet</p>
                          <p className="text-xs text-white/40 font-sans">Students haven't submitted any inquiries.</p>
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
              <div className="bg-[#0A1428]/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-amber-500/20 group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-300" />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/20 transition-colors" />
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BadgeCheck className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="font-display font-extrabold text-base text-amber-500 mb-2 flex items-center relative z-10">
                  <BadgeCheck className="w-4 h-4 mr-2" /> PRN Verification
                </h3>
                <div className="mt-4 relative z-10">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-3xl font-display font-extrabold text-white">{stats.verifiedPercentage}%</span>
                    <span className="text-[10px] uppercase font-bold text-amber-500/70 tracking-wider">Verified</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]" style={{ width: `${stats.verifiedPercentage}%` }}></div>
                  </div>
                  <p className="text-[10px] text-white/40 mt-3 font-sans leading-relaxed">
                    Live database linking active. Verifying student accounts automatically.
                  </p>
                </div>
              </div>

              {/* Quick Actions Shortcuts panel */}
              <div className="bg-[#0A1428]/60 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden border border-white/10 space-y-5">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-burnt/5 to-transparent pointer-events-none" />
                
                <div className="border-b border-white/10 pb-3 z-10 relative">
                  <h3 className="font-display font-extrabold text-base text-orange-burnt flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" /> Quick Tasks
                  </h3>
                  <p className="text-[10px] text-white/45 font-sans mt-0.5">
                    Publish updates and portfolio photos live to the college portal.
                  </p>
                </div>

                <div className="space-y-3.5 z-10 relative">
                  <Link
                    to="/admin/notices"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-inner border border-white/5 hover:border-transparent hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-white/20 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      </div>
                      <span className="text-white/80 group-hover:text-white">Add Announcement</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/admin/events"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-inner border border-white/5 hover:border-transparent hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-white/20 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      </div>
                      <span className="text-white/80 group-hover:text-white">Add Live Event</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </Link>

                  <Link
                    to="/admin/gallery"
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 group shadow-inner border border-white/5 hover:border-transparent hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-0.5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 bg-white/5 rounded-md group-hover:bg-white/20 transition-colors">
                        <Plus className="w-3.5 h-3.5 text-orange-burnt group-hover:text-white transition-colors shrink-0" />
                      </div>
                      <span className="text-white/80 group-hover:text-white">Upload Gallery Image</span>
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
