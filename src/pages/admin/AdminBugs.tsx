import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import {
  Bug, CheckCircle2, Clock, Loader2, RefreshCw, Search,
  AlertTriangle, X
} from 'lucide-react';

type BugStatus = 'pending' | 'in_progress' | 'resolved';

const STATUS_CONFIG: Record<BugStatus, { label: string; classes: string; dot: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    dot: 'bg-amber-400',
    icon: <Clock className="w-3 h-3" />,
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dot: 'bg-blue-400',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

export const AdminBugs: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();

  const [bugs, setBugs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BugStatus | 'all'>('all');

  // Resolve modal
  const [resolvingBug, setResolvingBug] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const fetchBugs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBugs(data || []);
    } catch (err: any) {
      toast.error('❌ Failed to load bug reports: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBugs(); }, []);

  useEffect(() => {
    let result = [...bugs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.issue_title.toLowerCase().includes(q) ||
        b.issue_description.toLowerCase().includes(q) ||
        b.reporter_email.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }
    setFiltered(result);
  }, [bugs, searchQuery, statusFilter]);

  const handleStatusChange = async (bug: any, newStatus: BugStatus) => {
    if (newStatus === 'resolved') {
      setResolvingBug(bug);
      setResolutionNotes('');
      return;
    }
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update({ status: newStatus })
        .eq('id', bug.id);
      if (error) throw error;
      await logActivity(myEmail, 'bug_status_change', `Updated bug "${bug.issue_title}" status to "${newStatus}"`);
      toast.success(`✅ Status updated to "${newStatus}"!`);
      fetchBugs();
    } catch (err: any) {
      toast.error(`❌ Failed to update status: ${err.message}`);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingBug) return;
    setIsResolving(true);
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update({
          status: 'resolved',
          resolved_by: myEmail,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', resolvingBug.id);
      if (error) throw error;
      await logActivity(myEmail, 'bug_resolved', `Resolved bug "${resolvingBug.issue_title}" with notes: "${resolutionNotes}"`);
      toast.success('✅ Bug marked as resolved!');
      setResolvingBug(null);
      setResolutionNotes('');
      fetchBugs();
    } catch (err: any) {
      toast.error(`❌ Failed to resolve: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const pendingCount = bugs.filter(b => b.status === 'pending').length;
  const inProgressCount = bugs.filter(b => b.status === 'in_progress').length;
  const resolvedCount = bugs.filter(b => b.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
            <Bug className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Glitch & Issue Reports</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Review and resolve problems submitted by students & users</p>
          </div>
        </div>
        <button
          onClick={fetchBugs}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/[0.05] hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Pending',     count: pendingCount,    key: 'pending' as BugStatus,     icon: <Clock className="w-4 h-4" />,          cls: STATUS_CONFIG.pending.classes },
          { label: 'In Progress', count: inProgressCount, key: 'in_progress' as BugStatus, icon: <AlertTriangle className="w-4 h-4" />,   cls: STATUS_CONFIG.in_progress.classes },
          { label: 'Resolved',    count: resolvedCount,   key: 'resolved' as BugStatus,    icon: <CheckCircle2 className="w-4 h-4" />,   cls: STATUS_CONFIG.resolved.classes },
        ].map(card => (
          <button
            key={card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? 'all' : card.key)}
            className={`rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.01] ${card.cls} ${statusFilter === card.key ? 'ring-2 ring-orange-burnt/50 scale-[1.02]' : ''}`}
          >
            <div className="flex items-center space-x-1.5 mb-2 text-current opacity-70">
              {card.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="font-display font-extrabold text-2xl">{card.count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-xs font-sans outline-none focus:border-red-400/50 transition-all placeholder-white/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as BugStatus | 'all')}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white text-xs font-sans outline-none focus:border-red-400/50 transition-all appearance-none cursor-pointer"
        >
          <option value="all" className="bg-[#0A1428]">All Statuses</option>
          <option value="pending" className="bg-[#0A1428]">Pending</option>
          <option value="in_progress" className="bg-[#0A1428]">In Progress</option>
          <option value="resolved" className="bg-[#0A1428]">Resolved</option>
        </select>
      </div>

      {/* Bug List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-red-400" />
            <span className="font-display text-sm">Loading reports...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
            <Bug className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <p className="text-white/50 text-sm font-display font-bold">No bug reports found</p>
          </div>
        ) : (
          filtered.map(bug => {
            const cfg = STATUS_CONFIG[bug.status as BugStatus] || STATUS_CONFIG.pending;
            return (
              <div
                key={bug.id}
                className={`bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 ${bug.status === 'resolved' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className={`inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${cfg.classes}`}>
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                      <span className="text-[10px] text-white/35 font-mono">{bug.reporter_email}</span>
                    </div>
                    <h4 className="font-display font-bold text-sm text-white mb-1">{bug.issue_title}</h4>
                    <p className="text-xs text-white/55 font-sans leading-relaxed mb-2">{bug.issue_description}</p>
                    <p className="text-[10px] text-white/30 font-mono">
                      Submitted: {new Date(bug.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                    {bug.status === 'resolved' && (
                      <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <p className="text-[10px] font-bold text-emerald-400 mb-0.5">Resolved by: {bug.resolved_by}</p>
                        {bug.resolution_notes && (
                          <p className="text-xs text-emerald-300/70 font-sans">{bug.resolution_notes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {bug.status !== 'resolved' && (
                    <div className="flex items-center space-x-2 shrink-0">
                      {bug.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(bug, 'in_progress')}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors"
                        >
                          → In Progress
                        </button>
                      )}
                      <button
                        onClick={() => { setResolvingBug(bug); setResolutionNotes(''); }}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0A1428] w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600/20 to-transparent border-b border-emerald-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h4 className="font-display font-extrabold text-sm text-white">Resolve Bug Report</h4>
              </div>
              <button onClick={() => setResolvingBug(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResolve} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <p className="text-xs font-bold text-emerald-400">{resolvingBug.issue_title}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe how the issue was resolved, what was fixed, etc..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm font-sans resize-none outline-none focus:border-emerald-500/50 transition-all placeholder-white/30"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setResolvingBug(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display text-xs font-bold shadow-lg transition-all flex items-center justify-center space-x-1.5 hover:-translate-y-px hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {isResolving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Resolving...</span></>
                  ) : (
                    <><CheckCircle2 className="w-3.5 h-3.5" /><span>Mark Resolved</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBugs;
