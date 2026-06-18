import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { ShieldAlert, Loader2, Search, MessageSquare, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  received:     { label: 'Received',     classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    dot: 'bg-amber-400' },
  investigating:{ label: 'Investigating',classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',       dot: 'bg-blue-400' },
  resolved:     { label: 'Resolved',     classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
};

export const AdminComplaints: React.FC = () => {
  const toast = useToast();
  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };
  const { email } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notes modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
    setComplaints(data || []);
    setIsLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from('complaints').update({ status: newStatus }).eq('id', id);
    await logActivity(email, 'complaint_status', `Changed complaint ${id.slice(0, 8)} to ${newStatus}`);
    showToast(`Status → ${newStatus}`, 'success');
    fetchAll();
  };

  const saveNotes = async () => {
    if (!selectedId) return;
    setIsSaving(true);
    await supabase.from('complaints').update({ admin_notes: adminNotes, status: 'resolved' }).eq('id', selectedId);
    await logActivity(email, 'complaint_resolve', `Resolved complaint ${selectedId.slice(0, 8)}`);
    showToast('Complaint resolved with notes', 'success');
    setSelectedId(null); setAdminNotes('');
    setIsSaving(false);
    fetchAll();
  };

  const filtered = complaints.filter(c => {
    const matchSearch = !search || c.description.toLowerCase().includes(search.toLowerCase()) || c.incident_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    received: complaints.filter(c => c.status === 'received').length,
    investigating: complaints.filter(c => c.status === 'investigating').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
          <ShieldAlert className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl text-white">Anonymous Complaints</h2>
          <p className="text-xs text-white/40 font-sans mt-0.5">Manage and resolve student complaints confidentially</p>
        </div>
      </div>

      {/* Status Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { key: 'received',      icon: <Clock className="w-4 h-4" />,       label: 'Received',      count: counts.received },
          { key: 'investigating', icon: <AlertTriangle className="w-4 h-4" />, label: 'Investigating', count: counts.investigating },
          { key: 'resolved',      icon: <CheckCircle className="w-4 h-4" />,  label: 'Resolved',      count: counts.resolved },
        ].map(({ key, icon, label, count }) => {
          const cfg = STATUS_CONFIG[key];
          const isActive = statusFilter === key;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(isActive ? 'all' : key)}
              className={`rounded-xl border p-4 text-center transition-all duration-200 ${cfg.classes} ${isActive ? 'ring-2 ring-orange-burnt/50 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </div>
              <p className="font-display font-extrabold text-2xl">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search complaints by description or type..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm text-sm text-white placeholder-white/30 outline-none focus:border-orange-burnt/50 focus:bg-white/[0.05] transition-all"
        />
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading complaints...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
          <ShieldAlert className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No complaints found</p>
          <p className="text-white/25 text-xs font-sans mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG['received'];
            return (
              <div key={c.id} className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 group">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                      {c.incident_type}
                    </span>
                    <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg capitalize border ${cfg.classes}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      <span>{cfg.label}</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-white/35 font-sans">
                    {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {c.location && ` • ${c.location}`}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-white/70 font-sans leading-relaxed mb-4">{c.description}</p>

                {/* Admin Notes if resolved */}
                {c.admin_notes && (
                  <div className="bg-emerald-500/5 rounded-xl p-3 mb-4 border border-emerald-500/20">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Admin Resolution Notes</p>
                    <p className="text-xs text-emerald-300/80 font-sans">{c.admin_notes}</p>
                  </div>
                )}

                {/* Actions */}
                {c.status !== 'resolved' && (
                  <div className="flex space-x-2 pt-2 border-t border-white/5">
                    {c.status === 'received' && (
                      <button
                        onClick={() => updateStatus(c.id, 'investigating')}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-colors"
                      >
                        Mark Investigating
                      </button>
                    )}
                    <button
                      onClick={() => { setSelectedId(c.id); setAdminNotes(c.admin_notes || ''); }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
                    >
                      Resolve with Notes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Notes Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div onClick={() => setSelectedId(null)} className="absolute inset-0" />
          <div className="relative bg-[#0A1428] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10">
            <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/20 px-6 py-4 flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="font-display font-extrabold text-sm text-white">Resolution Notes</h4>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Describe the actions taken to resolve this complaint..."
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm resize-none placeholder-white/30 outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] transition-all"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveNotes}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display text-xs font-bold shadow-lg disabled:opacity-50 flex items-center justify-center hover:shadow-emerald-500/25 hover:-translate-y-px transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Mark Resolved</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminComplaints;
