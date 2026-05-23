import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { 
  Megaphone, 
  Calendar, 
  HelpCircle, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingQuestions: 0,
    noticesCount: 0,
    activeEventsCount: 0,
  });
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch questions counts
      const { data: questions, error: qErr } = await supabase.from('questions').select('status, created_at, student_name, directed_to, question_text');
      if (qErr) throw qErr;

      const totalQ = questions?.length || 0;
      const pendingQ = questions?.filter((q) => q.status === 'pending').length || 0;

      // 2. Fetch notices count
      const { count: noticesCount, error: nErr } = await supabase.from('notices').select('*', { count: 'exact', head: true });
      if (nErr) throw nErr;

      // 3. Fetch active events count
      const { count: activeEventsCount, error: eErr } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (eErr) throw eErr;

      setStats({
        totalQuestions: totalQ,
        pendingQuestions: pendingQ,
        noticesCount: noticesCount || 0,
        activeEventsCount: activeEventsCount || 0,
      });

      // Set 3 most recent questions for quick overview
      const sortedQ = questions?.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)) || [];
      setRecentQuestions(sortedQ.slice(0, 3));
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-light w-full">
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar activeTab="dashboard" pendingQuestionsCount={stats.pendingQuestions} />

      {/* 2. MAIN CONTENT VIEW */}
      <div className="flex-grow flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-navy-dark/5 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-display font-extrabold text-2xl text-navy-dark uppercase flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-orange-burnt" />
              <span>Dashboard Overview</span>
            </h1>
            <p className="text-xs text-navy-dark/60 mt-0.5">
              Rapid statistics and updates check for Gaikwad Patil Student Council.
            </p>
          </div>

          <button
            onClick={fetchStats}
            className="flex items-center space-x-1.5 px-4 py-2 border border-navy-dark/15 hover:bg-navy-dark hover:text-white rounded-lg font-display text-xs font-semibold transition-colors"
          >
            <span>Refresh Stats</span>
          </button>
        </header>

        {/* Dashboard Panels */}
        <div className="flex-grow overflow-y-auto p-8 space-y-8">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-navy-dark/40">
              <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
              <p className="font-display text-sm tracking-wider uppercase">Loading stats...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards Grid (4 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Total Questions */}
                <div className="bg-white border border-navy-dark/5 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-navy-dark/[0.01] rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-1">
                      Total Inquiries
                    </span>
                    <span className="font-display font-extrabold text-3xl text-navy-dark block">
                      {stats.totalQuestions}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-navy-dark/5 text-navy-dark flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Pending Questions */}
                <div className="bg-white border border-navy-dark/5 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-burnt/[0.02] rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-1">
                      Pending Review
                    </span>
                    <span className="font-display font-extrabold text-3xl text-orange-burnt block">
                      {stats.pendingQuestions}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-burnt/10 text-orange-burnt flex items-center justify-center group-hover:scale-105 transition-transform">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                {/* Notices Published */}
                <div className="bg-white border border-navy-dark/5 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-orange-burnt/[0.01] rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-1">
                      Notices Active
                    </span>
                    <span className="font-display font-extrabold text-3xl text-navy-dark block">
                      {stats.noticesCount}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-burnt/10 text-orange-burnt flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Megaphone className="w-6 h-6" />
                  </div>
                </div>

                {/* Active Events */}
                <div className="bg-white border border-navy-dark/5 p-6 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/[0.02] rounded-bl-full pointer-events-none" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy-dark/40 block mb-1">
                      Events Live
                    </span>
                    <span className="font-display font-extrabold text-3xl text-emerald-500 block">
                      {stats.activeEventsCount}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Bottom Layout: Recent Questions & Quick Navigation panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Recent Student Inquiries (lg:span-8) */}
                <div className="lg:col-span-8 bg-white border border-navy-dark/5 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-navy-dark/5 pb-4">
                    <h3 className="font-display font-bold text-lg text-navy-dark flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-orange-burnt" />
                      <span>Recent Student Inquiries</span>
                    </h3>
                    <Link
                      to="/admin/questions"
                      className="inline-flex items-center space-x-1 text-xs font-display font-bold text-orange-burnt hover:text-navy-dark transition-colors group"
                    >
                      <span>Manage All</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>

                  <div className="divide-y divide-navy-dark/5">
                    {recentQuestions.map((q, idx) => (
                      <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between space-x-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-bold text-sm text-navy-dark">{q.student_name}</span>
                            <span className="text-[10px] font-semibold text-orange-burnt uppercase tracking-wide">→ {q.directed_to}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-navy-dark/70 font-sans line-clamp-2">
                            "{q.question_text}"
                          </p>
                        </div>
                        <span className={`inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 ${
                          q.status === 'answered' 
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                            : q.status === 'seen'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                    ))}

                    {recentQuestions.length === 0 && (
                      <div className="text-center py-10">
                        <HelpCircle className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" />
                        <p className="text-xs text-navy-dark/40 font-display">No questions have been submitted yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations Guidelines Card (lg:span-4) */}
                <div className="lg:col-span-4 bg-navy-dark text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:20px_20px] opacity-15 pointer-events-none" />
                  <h3 className="font-display font-bold text-lg text-orange-burnt mb-3 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Quick Tasks</span>
                  </h3>
                  <p className="text-xs text-white/70 leading-relaxed mb-6 font-sans">
                    As a council administrator, you are tasked with resolving queries within 3-5 days. Ensure all notices regarding mid-sems or events are pinned to maintain student visibility.
                  </p>
                  
                  <div className="space-y-2">
                    <Link
                      to="/admin/notices"
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-orange-burnt text-xs font-semibold font-display tracking-wide transition-all duration-300"
                    >
                      <span>📢 Add Notice Board Announcement</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      to="/admin/events"
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-orange-burnt text-xs font-semibold font-display tracking-wide transition-all duration-300"
                    >
                      <span>🎉 Add Timeline Event or Contest</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
