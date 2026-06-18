import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import {
  ClipboardList, Search, Loader2, RefreshCw,
  LogIn, FileText, Trash2, Edit, UserPlus, UserX,
  ImageIcon, Bell, Bug, AlertTriangle
} from 'lucide-react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login_success: <LogIn className="w-3.5 h-3.5 text-emerald-400" />,
  login_fail: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  notice_create: <FileText className="w-3.5 h-3.5 text-blue-400" />,
  notice_edit: <Edit className="w-3.5 h-3.5 text-amber-400" />,
  notice_delete: <Trash2 className="w-3.5 h-3.5 text-red-400" />,
  logo_change: <ImageIcon className="w-3.5 h-3.5 text-purple-400" />,
  banner_change: <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />,
  user_create: <UserPlus className="w-3.5 h-3.5 text-emerald-400" />,
  user_delete: <UserX className="w-3.5 h-3.5 text-red-400" />,
  user_suspend: <Bell className="w-3.5 h-3.5 text-amber-400" />,
  user_pw_reset: <Bell className="w-3.5 h-3.5 text-blue-400" />,
  user_role_change: <Bell className="w-3.5 h-3.5 text-cyan-400" />,
  bug_reported: <Bug className="w-3.5 h-3.5 text-orange-400" />,
};

const ACTION_COLORS: Record<string, string> = {
  login_success:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  login_fail:     'bg-red-500/10 text-red-400 border-red-500/20',
  notice_create:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  notice_edit:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  notice_delete:  'bg-red-500/10 text-red-400 border-red-500/20',
  logo_change:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  banner_change:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  user_create:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  user_delete:    'bg-red-500/10 text-red-400 border-red-500/20',
  user_suspend:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  user_pw_reset:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  user_role_change: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  bug_reported:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const ACTION_LABELS: Record<string, string> = {
  login_success: 'Login Success',
  login_fail: 'Login Failed',
  notice_create: 'Notice Created',
  notice_edit: 'Notice Edited',
  notice_delete: 'Notice Deleted',
  logo_change: 'Logo Changed',
  banner_change: 'Banner Changed',
  user_create: 'User Created',
  user_delete: 'User Deleted',
  user_suspend: 'User Suspended',
  user_pw_reset: 'Password Reset',
  user_role_change: 'Role Changed',
  bug_reported: 'Bug Reported',
};

const ACTION_TYPES = Object.keys(ACTION_LABELS);

export const AdminLogs: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchEmail, setSearchEmail] = useState('');
  const [actionType, setActionType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error('❌ Failed to load activity logs: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    let result = [...logs];
    if (searchEmail.trim()) {
      result = result.filter(l => l.user_email.toLowerCase().includes(searchEmail.toLowerCase()));
    }
    if (actionType !== 'all') {
      result = result.filter(l => l.action_type === actionType);
    }
    if (dateFrom) {
      result = result.filter(l => new Date(l.created_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      result = result.filter(l => new Date(l.created_at) <= new Date(dateTo + 'T23:59:59'));
    }
    setFiltered(result);
  }, [logs, searchEmail, actionType, dateFrom, dateTo]);

  const hasFilters = searchEmail || actionType !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Security Audit Trail</h2>
            <p className="text-[10px] text-white/40 font-sans mt-0.5">
              {filtered.length} of {logs.length} records shown
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/[0.05] hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by email */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="Filter by email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-sans outline-none focus:border-indigo-500/50 transition-all placeholder-white/30"
            />
          </div>
          {/* Action type */}
          <select
            value={actionType}
            onChange={e => setActionType(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-sans outline-none focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="all" className="bg-[#0A1428]">All Action Types</option>
            {ACTION_TYPES.map(t => <option key={t} value={t} className="bg-[#0A1428]">{ACTION_LABELS[t]}</option>)}
          </select>
          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-xs font-sans outline-none focus:border-indigo-500/50 transition-all"
          />
          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 text-xs font-sans outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => { setSearchEmail(''); setActionType('all'); setDateFrom(''); setDateTo(''); }}
            className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* Log Entries */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-400" />
            <span className="font-display text-sm">Loading audit logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <ClipboardList className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/50 text-sm font-display font-bold">No activity logs found</p>
            <p className="text-white/25 text-xs font-sans mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map(log => (
              <div key={log.id} className="px-5 py-4 flex items-start space-x-4 hover:bg-white/[0.02] transition-colors group">
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center shrink-0 mt-0.5 border border-white/5">
                  {ACTION_ICONS[log.action_type] || <Bell className="w-3.5 h-3.5 text-white/30" />}
                </div>
                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg border ${ACTION_COLORS[log.action_type] || 'bg-white/5 text-white/40 border-white/10'}`}>
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {log.user_email}
                    </span>
                  </div>
                  <p className="text-xs text-white/55 font-sans leading-relaxed truncate">{log.details}</p>
                </div>
                {/* Timestamp */}
                <div className="text-[10px] text-white/30 font-mono shrink-0 pt-0.5 text-right">
                  {new Date(log.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
