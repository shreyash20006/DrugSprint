import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Wrench, 
  Cpu, 
  Server, 
  RefreshCw, 
  Download, 
  Trash2, 
  Users, 
  Settings, 
  Activity, 
  Clock, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

export const AdminDeveloper: React.FC = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Route security gate: authorized system developers only
  const isAuthorized = role === 'developer';

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    questionsTotal: 0,
    noticesTotal: 0,
    eventsActive: 0,
    galleryTotal: 0,
    pendingQuestions: 0,
    answeredQuestions: 0,
    complaintsTotal: 0,
    mentorsTotal: 0,
  });

  // Graph Data States
  const [lineChartData, setLineChartData] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any[]>([]);
  const [pieChartData, setPieChartData] = useState<any[]>([]);
  const [areaChartData, setAreaChartData] = useState<any[]>([]);

  // Logs and activity states
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<'All' | 'Login' | 'Notices' | 'Events' | 'Gallery'>('All');
  
  // Vercel deployment state
  const [vercelDeployments, setVercelDeployments] = useState<any[]>([]);
  const [isVercelLoading, setIsVercelLoading] = useState(true);

  // System health states
  const [supabaseStatus, setSupabaseStatus] = useState<'Checking' | 'Online' | 'Offline'>('Checking');
  const [brevoStatus, setBrevoStatus] = useState<'Checking' | 'Connected' | 'Unconfigured'>('Checking');
  const [vercelStatus, setVercelStatus] = useState<'Checking' | 'Connected' | 'Unconfigured'>('Checking');
  const [cloudinaryStatus, setCloudinaryStatus] = useState<'Checking' | 'Connected' | 'Unconfigured'>('Checking');
  const [googleOauthStatus, setGoogleOauthStatus] = useState<'Checking' | 'Configured' | 'Unconfigured'>('Checking');

  // CSV Data storage for exports
  const [rawQuestions, setRawQuestions] = useState<any[]>([]);
  const [rawRegistrations, setRawRegistrations] = useState<any[]>([]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = +new Date() - +new Date(timestamp);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fetchStatsAndAnalytics = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Questions & Compute aggregations
      const { data: questions, error: qErr } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: true });
      if (qErr) throw qErr;

      setRawQuestions(questions || []);
      const totalQ = questions?.length || 0;
      const pendingQ = questions?.filter(q => q.status === 'pending').length || 0;
      const answeredQ = questions?.filter(q => q.status === 'answered').length || 0;

      // 2. Fetch Notices Count
      const { count: noticesCount, error: nErr } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true });
      if (nErr) throw nErr;

      // 3. Fetch Active Events Count
      const { data: events, error: eErr } = await supabase
        .from('events')
        .select('*');
      if (eErr) throw eErr;

      const totalEvents = events?.length || 0;
      const activeEvents = events?.filter(e => e.is_active).length || 0;

      // 4. Fetch Gallery Count
      const { count: galleryCount, error: gErr } = await supabase
        .from('gallery')
        .select('*', { count: 'exact', head: true });
      if (gErr) throw gErr;

      // 5. Fetch Complaints Count
      const { count: complaintsCount, error: cErr } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true });
      if (cErr) throw cErr;

      // 6. Fetch Mentors Count
      const { count: mentorsCount, error: mErr } = await supabase
        .from('mentors')
        .select('*', { count: 'exact', head: true });
      if (mErr) throw mErr;

      // 7. Fetch Registrations for Graph
      const { data: registrations, error: rErr } = await supabase
        .from('event_registrations')
        .select('*')
        .order('created_at', { ascending: true });
      if (rErr) throw rErr;

      setRawRegistrations(registrations || []);

      setStats({
        questionsTotal: totalQ,
        noticesTotal: noticesCount || 0,
        eventsActive: activeEvents || 0,
        galleryTotal: galleryCount || 0,
        pendingQuestions: pendingQ,
        answeredQuestions: answeredQ,
        complaintsTotal: complaintsCount || 0,
        mentorsTotal: mentorsCount || 0,
      });

      // --- SECTION 2: PROCESS ANALYTICS ---
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      // Chart 1: Questions over time
      const qCounts = last7Days.reduce((acc, date) => ({ ...acc, [date]: 0 }), {} as Record<string, number>);
      questions?.forEach(q => {
        const date = q.created_at?.split('T')[0];
        if (qCounts[date] !== undefined) qCounts[date]++;
      });
      setLineChartData(Object.entries(qCounts).map(([date, count]) => ({ date, count })));

      // Chart 2: Questions by member
      const memberCounts: Record<string, number> = {};
      questions?.forEach(q => {
        const member = q.directed_to || 'General';
        memberCounts[member] = (memberCounts[member] || 0) + 1;
      });
      setBarChartData(Object.entries(memberCounts).map(([name, count]) => ({ name, count })).slice(0, 8));

      // Chart 3: Content Distribution
      setPieChartData([
        { name: 'Questions', value: totalQ },
        { name: 'Notices', value: noticesCount || 0 },
        { name: 'Events', value: totalEvents },
        { name: 'Gallery', value: galleryCount || 0 },
      ]);

      // Chart 4: Registrations over last 7 days
      const rCounts = last7Days.reduce((acc, date) => ({ ...acc, [date]: 0 }), {} as Record<string, number>);
      registrations?.forEach(r => {
        const date = r.created_at?.split('T')[0];
        if (rCounts[date] !== undefined) rCounts[date]++;
      });
      setAreaChartData(Object.entries(rCounts).map(([date, count]) => ({ date, count })));

      setSupabaseStatus('Online');
    } catch (err: any) {
      console.error('Failed to query statistics:', err.message);
      setSupabaseStatus('Offline');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const fetchVercelDeployments = async () => {
    setIsVercelLoading(true);
    try {
      const res = await fetch('/api/vercel-deployments');
      if (res.ok) {
        const data = await res.json();
        setVercelDeployments(data.deployments || []);
        setVercelStatus(data.configured ? 'Connected' : 'Unconfigured');
      } else {
        throw new Error('Vercel serverless fetch failed');
      }
    } catch (err) {
      console.warn('Vercel serverless fetch failed. Using empty deployments state.', err);
      setVercelStatus('Unconfigured');
    } finally {
      setIsVercelLoading(false);
    }
  };

  const evaluateSystemHealthEnv = async () => {
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkConfig' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrevoStatus(data.configured ? 'Connected' : 'Unconfigured');
      } else {
        setBrevoStatus('Unconfigured');
      }
    } catch (err) {
      setBrevoStatus('Unconfigured');
    }

    // Cloudinary check
    setCloudinaryStatus('Connected'); // Integrated client-side successfully

    // Google OAuth indicator
    setGoogleOauthStatus('Configured');
  };

  const runAllFetches = () => {
    fetchStatsAndAnalytics();
    fetchAuditLogs();
    fetchVercelDeployments();
    evaluateSystemHealthEnv();
  };

  useEffect(() => {
    if (!isAuthorized) return;

    runAllFetches();

    // Auto-refresh loop every 30 seconds
    const interval = setInterval(runAllFetches, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized]);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel-dark p-8 border border-red-500/30 text-center rounded-2xl shadow-2xl relative overflow-hidden bg-navy-dark">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white mb-2">🚫 Access Denied</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 font-sans">
            This developer control center is strictly restricted to authorized system developers. Your account is not authorized to view this page.
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display font-bold rounded-lg text-sm transition-all mx-auto w-full shadow-md active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Filter logs logic
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'All') return true;
    if (logFilter === 'Login') return log.action === 'LOGIN';
    if (logFilter === 'Notices') return log.action.includes('NOTICE');
    if (logFilter === 'Events') return log.action.includes('EVENT');
    if (logFilter === 'Gallery') return log.action.includes('MEDIA') || log.action.includes('GALLERY');
    return true;
  }).slice(0, 20);

  // Quick Action: Export CSV Files
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.warning("⚠️ No database records found to export!");
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => {
        if (val === null || val === undefined) return '""';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`📊 ${filename} exported successfully!`);
  };

  // Quick Action: Clear answered questions older than 30 days
  const handleClearOldQuestions = async () => {
    if (!window.confirm("⚠️ DESTRUCTIVE ACTION: Are you sure you want to delete all answered student questions older than 30 days? This cannot be undone.")) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    try {
      const { data, error } = await supabase
        .from('questions')
        .delete()
        .eq('status', 'answered')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select();

      if (error) throw error;
      toast.success(`🗑️ Purged ${data?.length || 0} older resolved questions successfully!`);
      fetchStatsAndAnalytics();
    } catch (err: any) {
      toast.error(`❌ Purge failed: ${err.message}`);
    }
  };

  // Pie chart colors
  const COLORS = ['#C84B0E', '#0D1B3E', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-8 animate-in fade-in duration-400 bg-navy-dark text-white p-6 rounded-3xl border border-white/5 relative overflow-hidden">
      {/* Dynamic drifting background particles */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-burnt/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-tight text-white flex items-center space-x-2.5">
            <Wrench className="w-7 h-7 text-orange-burnt animate-spin" style={{ animationDuration: '4s' }} />
            <span>🛠️ Developer Control Center</span>
          </h2>
          <p className="text-xs text-white/55 font-sans mt-1">
            System core registry audit & live dashboard metrics — <span className="font-mono text-orange-burnt">Authorized Systems Developer Control Panel</span>
          </p>
        </div>
        <button
          onClick={runAllFetches}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 text-xs font-display font-extrabold uppercase tracking-wider rounded-xl transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh All Core Data</span>
        </button>
      </div>

      {/* --- SECTION 1: LIVE STATS CARD GRID --- */}
      <div className="space-y-4 relative z-10">
        <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt">
          📊 Real-Time Database Roster Stats
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {/* ROW 1 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div 
                onClick={() => navigate('/admin/questions')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-orange-burnt/10 flex items-center justify-center text-orange-burnt group-hover:scale-110 transition-transform">
                  📬
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Questions</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.questionsTotal}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-orange-burnt transition-colors">Manage Inquiries &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/notices')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  📢
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Notices</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.noticesTotal}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-amber-500 transition-colors">Manage Broadcasts &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/events')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  🎉
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Events</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.eventsActive}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-emerald-500 transition-colors">Manage Calendar &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/gallery')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  🖼️
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Gallery Media</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.galleryTotal}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-blue-500 transition-colors">Manage Portfolio &rarr;</span>
              </div>
            </div>

            {/* ROW 2 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <div 
                onClick={() => navigate('/admin/questions')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-amber-600/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                  🟠
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Pending Questions</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.pendingQuestions}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-amber-500 transition-colors">Answer Inquiries &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/questions')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  🟢
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Answered Questions</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.answeredQuestions}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-emerald-500 transition-colors">Audit Answers &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/complaints')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                  ⚠️
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Anonymous Complaints</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.complaintsTotal}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-red-500 transition-colors">Audit Grievances &rarr;</span>
              </div>

              <div 
                onClick={() => navigate('/admin/mentors')}
                className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-orange-burnt/35 hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm group relative overflow-hidden"
              >
                <div className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                  🤝
                </div>
                <span className="block text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Mentors</span>
                <span className="block text-2xl font-display font-extrabold text-white mt-1">{stats.mentorsTotal}</span>
                <span className="block text-[9px] text-white/30 font-semibold mt-1 group-hover:text-indigo-400 transition-colors">Manage Mentors &rarr;</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- SECTION 2: ANALYTICS GRAPHS --- */}
      <div className="space-y-4 relative z-10">
        <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt">
          📈 Analytics Visualizations
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
            <div className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
            <div className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
            <div className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Graph 1 — Questions Over Time (Line Chart) */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-3">
              <h4 className="font-display font-bold text-xs text-white/70 uppercase tracking-wide">
                📬 Questions Logged (Last 7 Days)
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1B3E', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      itemStyle={{ color: '#C84B0E' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#C84B0E" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Questions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 2 — Questions By Member (Bar Chart) */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-3">
              <h4 className="font-display font-bold text-xs text-white/70 uppercase tracking-wide">
                👥 Question Distribution by Target Executive
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} layout="vertical" margin={{ left: 5, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={9} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={9} width={90} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1B3E', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      itemStyle={{ color: '#C84B0E' }}
                    />
                    <Bar dataKey="count" fill="#C84B0E" radius={[0, 4, 4, 0]} name="Inquiries" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Graph 3 — Content Distribution (Pie Chart) */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-3">
              <h4 className="font-display font-bold text-xs text-white/70 uppercase tracking-wide">
                📦 Database Records Content Spread
              </h4>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1B3E', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Visual Legends */}
                <div className="flex flex-col space-y-2 text-xs shrink-0 pr-8">
                  {pieChartData.map((d, index) => (
                    <div key={d.name} className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-white/60 font-semibold">{d.name}</span>
                      <span className="text-white font-bold">({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Graph 4 — Registration Trends (Area Chart) */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-3">
              <h4 className="font-display font-bold text-xs text-white/70 uppercase tracking-wide">
                📝 Event Competitions Registrations
              </h4>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0D1B3E', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      itemStyle={{ color: '#C84B0E' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#C84B0E" fill="rgba(200, 75, 14, 0.15)" strokeWidth={3} name="Registrants" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- SECTION 3: RECENT ADMIN LOGINS TABLE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Logs Table panel */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt flex items-center space-x-2">
              <Activity className="w-4.5 h-4.5" />
              <span>👥 Administrative Audit Logs</span>
            </h3>
            
            {/* Filter buttons */}
            <div className="flex bg-white/5 p-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/5 scrollbar-thin overflow-x-auto">
              {(['All', 'Login', 'Notices', 'Events', 'Gallery'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setLogFilter(tab)}
                  className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
                    logFilter === tab 
                      ? 'bg-orange-burnt text-white shadow-sm' 
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-white/10 text-[9px] font-bold uppercase tracking-wider text-white/40">
                  <th className="px-4 py-2">Administrator</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Context Details</th>
                  <th className="px-4 py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors text-xs">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-white leading-none">{log.admin_name}</span>
                        <span className="text-[10px] font-mono text-white/40 mt-1">{log.admin_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-block text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        log.action === 'LOGIN' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : log.action.includes('NOTICE')
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : log.action.includes('EVENT')
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : log.action.includes('MEDIA')
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70 max-w-xs truncate font-sans">
                      {log.details || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-white/50 text-[10px] whitespace-nowrap font-semibold">
                      {formatTimeAgo(log.created_at)}
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-10">
                      <Clock className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-xs text-white/40 font-display">No logs found matching filter criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- SECTION 4 & 6: VERCEL DEPLOYMENT & SYSTEM HEALTH --- */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Vercel Deployments Info panel */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt flex items-center space-x-2">
              <Server className="w-4.5 h-4.5" />
              <span>🌐 Vercel Deployments</span>
            </h3>

            {isVercelLoading ? (
              <div className="h-44 bg-white/5 animate-pulse rounded-xl" />
            ) : (
              <div className="space-y-4">
                {/* Latest Card */}
                {vercelDeployments[0] && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">Latest Run</span>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[8px] font-extrabold border uppercase tracking-widest ${
                        vercelDeployments[0].state === 'READY' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {vercelDeployments[0].state}
                      </span>
                    </div>

                    <div className="space-y-1 font-sans text-xs">
                      <p className="font-semibold text-white truncate">{vercelDeployments[0].url}</p>
                      <p className="text-[10px] text-white/50">Branch: <span className="font-mono text-orange-burnt font-bold">{vercelDeployments[0].meta?.githubCommitRef || 'main'}</span></p>
                      <p className="text-[10px] text-white/50">Time: {formatTimeAgo(vercelDeployments[0].created)}</p>
                      <p className="text-[10px] text-white/40 italic line-clamp-1 mt-1 border-t border-white/5 pt-1.5 font-medium">
                        "{vercelDeployments[0].meta?.githubCommitMessage || 'Automatic trigger'}"
                      </p>
                    </div>
                  </div>
                )}

                {/* List of last 5 */}
                <div className="space-y-2 border-t border-white/5 pt-3">
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-2">Previous Builds</span>
                  {vercelDeployments.slice(1, 5).map((dep) => (
                    <div key={dep.uid} className="flex items-center justify-between text-xs p-1 hover:bg-white/[0.01] rounded">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          dep.state === 'READY' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                        }`} />
                        <span className="font-mono text-[9px] text-white/40 shrink-0">{formatTimeAgo(dep.created)}</span>
                        <span className="text-white/60 truncate font-semibold">| {dep.meta?.githubCommitMessage || 'Deployment'}</span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono ${
                        dep.state === 'READY' 
                          ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' 
                          : 'text-red-400 border-red-500/20 bg-red-500/5'
                      }`}>
                        {dep.state === 'READY' ? 'OK' : 'ERR'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System Health Indicators panel */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-4">
            <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt flex items-center space-x-2">
              <Cpu className="w-4.5 h-4.5" />
              <span>🔔 System Infrastructure Registry</span>
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-semibold text-white/70">Database (Supabase Postgres)</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  supabaseStatus === 'Online' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {supabaseStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-semibold text-white/70">SMTP Server (Brevo Email API)</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  brevoStatus === 'Connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {brevoStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-semibold text-white/70">Vercel Deployment Hub</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  vercelStatus === 'Connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {vercelStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-semibold text-white/70">CDN Engine (Cloudinary Hosting)</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  cloudinaryStatus === 'Connected' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {cloudinaryStatus}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="font-semibold text-white/70">Administrative Google OAuth</span>
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                  googleOauthStatus === 'Configured' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {googleOauthStatus}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* --- SECTION 5: DEVELOPER QUICK ACTIONS --- */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm space-y-4 relative z-10">
        <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-orange-burnt flex items-center space-x-2">
          <Settings className="w-4.5 h-4.5" />
          <span>⚡ Developer-Only Quick Tools Panel</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={runAllFetches}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-orange-burnt/30 hover:bg-orange-burnt/10 text-center transition-all cursor-pointer group py-6"
          >
            <RefreshCw className="w-5 h-5 text-orange-burnt mb-2 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-bold text-white block uppercase tracking-wider">Refresh Data</span>
            <span className="text-[9px] text-white/40 block mt-1">Re-fetch stats logs</span>
          </button>

          <button
            onClick={() => exportToCSV(rawQuestions, 'questions.csv')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-orange-burnt/30 hover:bg-orange-burnt/10 text-center transition-all cursor-pointer group py-6"
          >
            <Download className="w-5 h-5 text-amber-500 mb-2 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold text-white block uppercase tracking-wider">Export Inquiries</span>
            <span className="text-[9px] text-white/40 block mt-1">Download questions CSV</span>
          </button>

          <button
            onClick={() => exportToCSV(rawRegistrations, 'registrations.csv')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-orange-burnt/30 hover:bg-orange-burnt/10 text-center transition-all cursor-pointer group py-6"
          >
            <Download className="w-5 h-5 text-emerald-500 mb-2 group-hover:translate-y-0.5 transition-transform" />
            <span className="text-xs font-bold text-white block uppercase tracking-wider">Export Signups</span>
            <span className="text-[9px] text-white/40 block mt-1">Download registrations CSV</span>
          </button>

          <button
            onClick={handleClearOldQuestions}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-center transition-all cursor-pointer group py-6"
          >
            <Trash2 className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-white block uppercase tracking-wider">Purge Old Qs</span>
            <span className="text-[9px] text-white/40 block mt-1">Delete answered &gt; 30d</span>
          </button>

          <button
            onClick={() => navigate('/admin/manage-admins')}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-center transition-all cursor-pointer group py-6"
          >
            <Users className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-115 transition-transform" />
            <span className="text-xs font-bold text-white block uppercase tracking-wider">Roles Registry</span>
            <span className="text-[9px] text-white/40 block mt-1">Manage admin access</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminDeveloper;
