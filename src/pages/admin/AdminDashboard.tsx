import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StatsCard } from '../../components/admin/StatsCard';
import {
  Calendar, HelpCircle, AlertCircle, Loader2, Clock, ArrowUpRight,
  BadgeCheck, Sparkles, Image as ImageIcon, Megaphone, FileText, TrendingUp,
} from 'lucide-react';

type RecentQuestion = {
  status?: string;
  created_at?: string;
  student_name?: string;
  student_year?: string;
  directed_to?: string;
  question_text?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 280, damping: 24 } },
};

const quickActions = [
  { path: '/admin/notices', label: 'Add Announcement', icon: Megaphone, color: 'orange' as const },
  { path: '/admin/events', label: 'Create New Event', icon: Calendar, color: 'gold' as const },
  { path: '/admin/gallery', label: 'Upload Gallery Image', icon: ImageIcon, color: 'orange' as const },
  { path: '/admin/stories', label: 'Post a Story', icon: Sparkles, color: 'gold' as const },
];

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingQuestions: 0,
    noticesCount: 0,
    activeEventsCount: 0,
    verifiedPercentage: 0,
    verifiedCount: 0,
    totalVerifications: 0,
  });
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatsAndRecent = async () => {
    setIsLoading(true);
    try {
      const [qRes, nRes, eRes, vRes] = await Promise.all([
        supabase.from('questions').select('status, created_at, student_name, student_year, directed_to, question_text'),
        supabase.from('notices').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('student_verifications').select('verification_status'),
      ]);

      const questions = qRes.data || [];
      const totalQ = questions.length;
      const pendingQ = questions.filter((q: any) => q.status === 'pending').length;

      let verifiedPercentage = 0;
      const verifications = vRes.data || [];
      const verifiedCount = verifications.filter((v: any) => v.verification_status === 'verified').length;
      const totalVerifications = verifications.length;
      if (totalVerifications > 0) {
        verifiedPercentage = Math.round((verifiedCount / totalVerifications) * 100);
      }

      setStats({
        totalQuestions: totalQ,
        pendingQuestions: pendingQ,
        noticesCount: nRes.count || 0,
        activeEventsCount: eRes.count || 0,
        verifiedPercentage,
        verifiedCount,
        totalVerifications,
      });

      const sortedQ = questions.sort(
        (a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at)
      );
      setRecentQuestions(sortedQ.slice(0, 6));
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
  }, []);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-white/55">
        <Loader2 className="w-9 h-9 text-orange-burnt animate-spin mb-4" strokeWidth={2.2} />
        <p className="font-display text-xs tracking-[0.22em] uppercase font-bold">Fetching console metrics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative z-10" data-testid="admin-dashboard">
      {/* Greeting + summary chip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:items-end md:justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-burnt text-[10px] font-extrabold tracking-[0.22em] uppercase font-display">
            <span className="w-5 h-[1.5px] bg-orange-burnt" />
            <span>Live Overview</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">command center</span>.
          </h1>
          <p className="text-white/60 text-sm font-sans">
            Quick pulse of the council — manage, monitor and engage students from one place.
          </p>
        </div>
        {stats.pendingQuestions > 0 && (
          <Link
            to="/admin/questions"
            data-testid="pending-pulse-chip"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-orange-burnt/12 border border-orange-burnt/30 text-orange-burnt text-xs font-display font-bold uppercase tracking-[0.18em] hover:bg-orange-burnt/20 transition group"
          >
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" strokeWidth={2.4} />
            {stats.pendingQuestions} pending reply
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.4} />
          </Link>
        )}
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            label="Total Questions"
            value={stats.totalQuestions}
            icon={<HelpCircle className="w-5 h-5" strokeWidth={2.2} />}
            trendColor="navy"
            hint="All inquiries received"
            testId="stat-total-questions"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            label="Pending Reply"
            value={stats.pendingQuestions}
            icon={<AlertCircle className="w-5 h-5" strokeWidth={2.2} />}
            trendColor={stats.pendingQuestions > 0 ? 'orange' : 'green'}
            hint={stats.pendingQuestions > 0 ? 'Awaiting response' : 'All clear'}
            testId="stat-pending"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            label="Verified Students"
            value={`${stats.verifiedPercentage}%`}
            icon={<BadgeCheck className="w-5 h-5" strokeWidth={2.2} />}
            trendColor="green"
            hint={`${stats.verifiedCount} / ${stats.totalVerifications} approved`}
            testId="stat-verified"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            label="Active Events"
            value={stats.activeEventsCount}
            icon={<Calendar className="w-5 h-5" strokeWidth={2.2} />}
            trendColor="amber"
            hint="Currently live"
            testId="stat-events"
          />
        </motion.div>
      </motion.div>

      {/* Bottom: Recent Questions (8) + Side widgets (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Questions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-8 rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-burnt/12 border border-orange-burnt/25 flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm text-white tracking-tight">Recent Inquiries</h3>
                <p className="text-[10px] text-white/40 font-sans">Latest student questions</p>
              </div>
            </div>
            <Link
              to="/admin/questions"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-display font-bold text-orange-burnt hover:text-gold-accent uppercase tracking-[0.16em] transition-all group"
            >
              Manage
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.4} />
            </Link>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {recentQuestions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                  <HelpCircle className="w-7 h-7 text-white/25" strokeWidth={1.6} />
                </div>
                <p className="text-sm font-display font-bold text-white/70 mb-1">No questions yet</p>
                <p className="text-xs text-white/40 font-sans">Students haven't submitted any inquiries.</p>
              </div>
            ) : (
              recentQuestions.map((q, idx) => (
                <Link
                  key={idx}
                  to="/admin/questions"
                  className="block px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt font-display font-extrabold text-[10px] shrink-0 mt-0.5">
                        {(q.student_name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-display font-bold text-sm text-white group-hover:text-orange-burnt transition-colors truncate">
                            {q.student_name || 'Anonymous'}
                          </span>
                          <span className="text-[9px] text-white/35 font-sans font-medium">·</span>
                          <span className="text-[9px] text-white/45 font-sans font-medium uppercase tracking-wider">
                            {q.student_year || 'unknown year'}
                          </span>
                          {q.directed_to && (
                            <>
                              <span className="text-[9px] text-white/35 font-sans">→</span>
                              <span className="text-[9px] text-orange-burnt font-sans font-bold uppercase tracking-wider truncate">
                                {q.directed_to}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-white/65 font-sans leading-relaxed line-clamp-1">
                          "{q.question_text}"
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-block text-[9px] font-extrabold uppercase tracking-[0.16em] px-2 py-1 rounded-md border shrink-0 ${
                        q.status === 'answered'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : q.status === 'seen'
                          ? 'bg-white/[0.04] text-white/60 border-white/12'
                          : 'bg-gold-accent/10 text-gold-accent border-gold-accent/25'
                      }`}
                    >
                      {q.status || 'new'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Right widgets */}
        <div className="lg:col-span-4 space-y-5">
          {/* Verification widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl bg-gradient-to-br from-[#0D1B3E]/75 to-[#0A1428]/85 border border-gold-accent/25 backdrop-blur-md p-6 overflow-hidden relative"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 ambient-orb-gold rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-gold-accent" strokeWidth={2.4} />
                  <h3 className="font-display font-extrabold text-[11px] text-gold-accent uppercase tracking-[0.2em]">
                    PRN Verification
                  </h3>
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-gold-accent/55" strokeWidth={2.4} />
              </div>

              <div className="flex items-baseline justify-between mb-3">
                <span className="font-display font-extrabold text-4xl text-white tracking-tight leading-none">
                  {stats.verifiedPercentage}%
                </span>
                <span className="text-[10px] text-white/50 font-sans font-bold uppercase tracking-wider">
                  {stats.verifiedCount} / {stats.totalVerifications}
                </span>
              </div>

              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.verifiedPercentage}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                  className="h-full bg-gradient-to-r from-gold-accent to-orange-burnt rounded-full"
                />
              </div>
              <p className="text-[10px] text-white/45 mt-3 font-sans leading-relaxed">
                Live database linking active. Auto-verifying student accounts.
              </p>
            </div>
          </motion.div>

          {/* Quick Actions widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />
              <h3 className="font-display font-extrabold text-[11px] text-orange-burnt uppercase tracking-[0.2em]">
                Quick Actions
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.path}
                    to={action.path}
                    data-testid={`quick-action-${action.path.split('/').pop()}`}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.04] transition-all group"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          action.color === 'gold'
                            ? 'bg-gold-accent/12 border border-gold-accent/25 text-gold-accent'
                            : 'bg-orange-burnt/12 border border-orange-burnt/25 text-orange-burnt'
                        } group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                      </span>
                      <span className="text-xs font-display font-bold truncate">{action.label}</span>
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-white/25 group-hover:text-orange-burnt group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={2.4} />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Mini content stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="grid grid-cols-2 gap-3"
          >
            <Link
              to="/admin/notices"
              className="rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md p-4 hover:border-orange-burnt/25 transition group"
            >
              <FileText className="w-4 h-4 text-orange-burnt mb-2" strokeWidth={2.4} />
              <p className="font-display font-extrabold text-xl text-white tracking-tight">{stats.noticesCount}</p>
              <p className="text-[9px] text-white/45 font-bold uppercase tracking-wider mt-1 group-hover:text-orange-burnt transition-colors">
                Notices
              </p>
            </Link>
            <Link
              to="/admin/events"
              className="rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md p-4 hover:border-gold-accent/25 transition group"
            >
              <Calendar className="w-4 h-4 text-gold-accent mb-2" strokeWidth={2.4} />
              <p className="font-display font-extrabold text-xl text-white tracking-tight">{stats.activeEventsCount}</p>
              <p className="text-[9px] text-white/45 font-bold uppercase tracking-wider mt-1 group-hover:text-gold-accent transition-colors">
                Live Events
              </p>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
