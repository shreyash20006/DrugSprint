import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import {
  ClipboardList, Search, Loader2, RefreshCw,
  LogIn, FileText, Trash2, Edit, UserPlus, UserX,
  ImageIcon, Bell, Bug, AlertTriangle
} from 'lucide-react';

const ACTION_ICONS: Record<string, React.ReactNode> = {
  login_success: <LogIn className="w-3.5 h-3.5 text-emerald-500" />,
  login_fail: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
  notice_create: <FileText className="w-3.5 h-3.5 text-blue-500" />,
  notice_edit: <Edit className="w-3.5 h-3.5 text-amber-500" />,
  notice_delete: <Trash2 className="w-3.5 h-3.5 text-red-500" />,
  logo_change: <ImageIcon className="w-3.5 h-3.5 text-purple-500" />,
  banner_change: <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />,
  user_create: <UserPlus className="w-3.5 h-3.5 text-emerald-500" />,
  user_delete: <UserX className="w-3.5 h-3.5 text-red-500" />,
  user_suspend: <Bell className="w-3.5 h-3.5 text-amber-500" />,
  user_pw_reset: <Bell className="w-3.5 h-3.5 text-blue-500" />,
  user_role_change: <Bell className="w-3.5 h-3.5 text-cyan-500" />,
  bug_reported: <Bug className="w-3.5 h-3.5 text-orange-500" />,
};

const ACTION_COLORS: Record<string, string> = {
  login_success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  login_fail: 'bg-red-50 text-red-700 border-red-200',
  notice_create: 'bg-blue-50 text-blue-700 border-blue-200',
  notice_edit: 'bg-amber-50 text-amber-700 border-amber-200',
  notice_delete: 'bg-red-50 text-red-700 border-red-200',
  logo_change: 'bg-purple-50 text-purple-700 border-purple-200',
  banner_change: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  user_create: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  user_delete: 'bg-red-50 text-red-700 border-red-200',
  user_suspend: 'bg-amber-50 text-amber-700 border-amber-200',
  user_pw_reset: 'bg-blue-50 text-blue-700 border-blue-200',
  user_role_change: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  bug_reported: 'bg-orange-50 text-orange-700 border-orange-200',
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark">Security Audit Trail</h3>
            <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5">{filtered.length} of {logs.length} records shown</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center space-x-1.5 px-4 py-2 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by email */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-dark/30" />
            <input
              type="text" value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              placeholder="Filter by email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-navy-dark/15 focus:border-indigo-400 outline-none text-xs font-sans text-navy-dark transition-colors"
            />
          </div>
          {/* Action type */}
          <select
            value={actionType} onChange={e => setActionType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-navy-dark/15 focus:border-indigo-400 outline-none text-xs font-sans text-navy-dark transition-colors bg-white"
          >
            <option value="all">All Action Types</option>
            {ACTION_TYPES.map(t => <option key={t} value={t}>{ACTION_LABELS[t]}</option>)}
          </select>
          {/* Date from */}
          <input
            type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-4 py-2 rounded-lg border border-navy-dark/15 focus:border-indigo-400 outline-none text-xs font-sans text-navy-dark transition-colors bg-white"
          />
          {/* Date to */}
          <input
            type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-4 py-2 rounded-lg border border-navy-dark/15 focus:border-indigo-400 outline-none text-xs font-sans text-navy-dark transition-colors bg-white"
          />
        </div>
        {(searchEmail || actionType !== 'all' || dateFrom || dateTo) && (
          <button
            onClick={() => { setSearchEmail(''); setActionType('all'); setDateFrom(''); setDateTo(''); }}
            className="mt-3 text-[10px] text-indigo-500 font-bold hover:underline"
          >
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* Log Entries */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-navy-dark/40">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-indigo-500" />
            <span className="font-display text-sm">Loading audit logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-navy-dark/40">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-display">No activity logs found matching your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-navy-dark/5">
            {filtered.map(log => (
              <div key={log.id} className="px-5 py-4 flex items-start space-x-4 hover:bg-navy-dark/[0.01] transition-colors">
                {/* Icon */}
                <div className="w-8 h-8 rounded-full bg-navy-dark/5 flex items-center justify-center shrink-0 mt-0.5">
                  {ACTION_ICONS[log.action_type] || <Bell className="w-3.5 h-3.5 text-navy-dark/30" />}
                </div>
                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ACTION_COLORS[log.action_type] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      {ACTION_LABELS[log.action_type] || log.action_type}
                    </span>
                    <span className="text-[10px] text-navy-dark/40 font-medium font-display">
                      {log.user_email}
                    </span>
                  </div>
                  <p className="text-xs text-navy-dark/65 font-sans leading-relaxed truncate">{log.details}</p>
                </div>
                {/* Timestamp */}
                <div className="text-[10px] text-navy-dark/35 font-mono shrink-0 pt-0.5">
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
