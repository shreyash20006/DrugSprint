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

const STATUS_CONFIG: Record<BugStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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

  // Summary counts
  const pendingCount = bugs.filter(b => b.status === 'pending').length;
  const inProgressCount = bugs.filter(b => b.status === 'in_progress').length;
  const resolvedCount = bugs.filter(b => b.status === 'resolved').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-navy-dark">Glitch & Issue Reports</h3>
            <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5">Review and resolve problems submitted by students & users.</p>
          </div>
        </div>
        <button onClick={fetchBugs} className="flex items-center space-x-1.5 px-4 py-2 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', count: pendingCount, color: 'amber', icon: <Clock className="w-5 h-5" />, filter: 'pending' as BugStatus },
          { label: 'In Progress', count: inProgressCount, color: 'blue', icon: <AlertTriangle className="w-5 h-5" />, filter: 'in_progress' as BugStatus },
          { label: 'Resolved', count: resolvedCount, color: 'emerald', icon: <CheckCircle2 className="w-5 h-5" />, filter: 'resolved' as BugStatus },
        ].map(card => (
          <button
            key={card.filter}
            onClick={() => setStatusFilter(statusFilter === card.filter ? 'all' : card.filter)}
            className={`bg-white border rounded-2xl p-4 text-left transition-all hover:shadow-md ${
              statusFilter === card.filter ? `border-${card.color}-400 shadow-md shadow-${card.color}-100` : 'border-navy-dark/10'
            }`}
          >
            <div className={`w-8 h-8 rounded-full bg-${card.color}-500/10 text-${card.color}-600 flex items-center justify-center mb-3`}>
              {card.icon}
            </div>
            <p className="font-display font-extrabold text-2xl text-navy-dark">{card.count}</p>
            <p className="text-[10px] text-navy-dark/50 font-bold uppercase tracking-widest mt-0.5">{card.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-navy-dark/30" />
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, description, email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-navy-dark/15 focus:border-red-400 outline-none text-xs font-sans text-navy-dark transition-colors"
          />
        </div>
        <select
          value={statusFilter} onChange={e => setStatusFilter(e.target.value as BugStatus | 'all')}
          className="px-4 py-2 rounded-lg border border-navy-dark/15 focus:border-red-400 outline-none text-xs font-sans text-navy-dark bg-white transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Bug List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 bg-white border border-navy-dark/10 rounded-2xl text-navy-dark/40">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-red-400" />
            <span className="font-display text-sm">Loading reports...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-navy-dark/10 rounded-2xl text-navy-dark/40">
            <Bug className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-display">No bug reports found.</p>
          </div>
        ) : (
          filtered.map(bug => (
            <div key={bug.id} className={`bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-sm ${bug.status === 'resolved' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-grow min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className={`inline-flex items-center space-x-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_CONFIG[bug.status as BugStatus]?.color}`}>
                      {STATUS_CONFIG[bug.status as BugStatus]?.icon}
                      <span className="ml-1">{STATUS_CONFIG[bug.status as BugStatus]?.label}</span>
                    </span>
                    <span className="text-[10px] text-navy-dark/40 font-medium">{bug.reporter_email}</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-navy-dark mb-1">{bug.issue_title}</h4>
                  <p className="text-xs text-navy-dark/60 font-sans leading-relaxed mb-2">{bug.issue_description}</p>
                  <p className="text-[10px] text-navy-dark/35 font-mono">
                    Submitted: {new Date(bug.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                  {bug.status === 'resolved' && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <p className="text-[10px] font-bold text-emerald-700 mb-0.5">Resolved by: {bug.resolved_by}</p>
                      {bug.resolution_notes && (
                        <p className="text-xs text-emerald-800 font-sans">{bug.resolution_notes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Status change actions */}
                {bug.status !== 'resolved' && (
                  <div className="flex items-center space-x-2 shrink-0">
                    {bug.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(bug, 'in_progress')}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        → In Progress
                      </button>
                    )}
                    <button
                      onClick={() => { setResolvingBug(bug); setResolutionNotes(''); }}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Resolve</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Resolve Modal ─────────────────────────────────────────────────── */}
      {resolvingBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-navy-dark/10 overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <h4 className="font-display font-extrabold text-sm">✅ Resolve Bug Report</h4>
              <button onClick={() => setResolvingBug(null)} className="p-1 rounded-lg hover:bg-white/10 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResolve} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-xs font-bold text-emerald-700">{resolvingBug.issue_title}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe how the issue was resolved, what was fixed, etc..."
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-emerald-400 outline-none text-sm font-sans text-navy-dark transition-colors resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <button type="button" onClick={() => setResolvingBug(null)} className="flex-1 py-2.5 rounded-lg border border-navy-dark/15 text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors">Cancel</button>
                <button type="submit" disabled={isResolving} className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-display text-xs font-bold shadow-md transition-colors flex items-center justify-center space-x-1.5">
                  {isResolving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Resolving...</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Mark Resolved</span></>}
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
