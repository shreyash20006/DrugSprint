import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { Vote, Plus, Loader2, Trash2, X, Edit, Power, BarChart2 } from 'lucide-react';

export const AdminPolls: React.FC = () => {
  const toast = useToast();
  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };
  const { email } = useAuth();
  const [polls, setPolls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Create/Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Vote results
  const [pollResults, setPollResults] = useState<Record<string, Record<string, number>>>({});

  const fetchPolls = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false });
    setPolls(data || []);

    // Fetch vote counts for each poll
    const results: Record<string, Record<string, number>> = {};
    for (const p of (data || [])) {
      const { data: votes } = await supabase.from('votes').select('selected_option').eq('poll_id', p.id);
      const counts: Record<string, number> = {};
      const opts: string[] = typeof p.options === 'string' ? JSON.parse(p.options) : (p.options || []);
      opts.forEach(o => { counts[o] = 0; });
      (votes || []).forEach(v => { counts[v.selected_option] = (counts[v.selected_option] || 0) + 1; });
      results[p.id] = counts;
    }
    setPollResults(results);
    setIsLoading(false);
  };

  useEffect(() => { fetchPolls(); }, []);

  const openCreate = () => {
    setEditId(null); setTitle(''); setDescription(''); setOptions(['', '']); setEndDate(''); setIsActive(true);
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditId(p.id); setTitle(p.title); setDescription(p.description || '');
    setOptions(typeof p.options === 'string' ? JSON.parse(p.options) : (p.options || ['', '']));
    setEndDate(p.end_date ? new Date(p.end_date).toISOString().split('T')[0] : '');
    setIsActive(p.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!title || validOptions.length < 2) { showToast('Title and at least 2 options required', 'error'); return; }
    setIsSaving(true);
    try {
      const payload = { title, description, options: validOptions, end_date: endDate || null, is_active: isActive };
      if (editId) {
        const { error } = await supabase.from('polls').update(payload).eq('id', editId);
        if (error) throw error;
        await logActivity(email, 'poll_update', `Updated poll: ${title}`);
        showToast('Poll updated!', 'success');
      } else {
        const { error } = await supabase.from('polls').insert(payload);
        if (error) throw error;
        await logActivity(email, 'poll_create', `Created poll: ${title}`);
        showToast('Poll created!', 'success');
      }
      setShowModal(false); fetchPolls();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p: any) => {
    if (!confirm(`Delete poll "${p.title}"?`)) return;
    await supabase.from('polls').delete().eq('id', p.id);
    await logActivity(email, 'poll_delete', `Deleted poll: ${p.title}`);
    showToast('Poll deleted', 'success');
    fetchPolls();
  };

  const toggleActive = async (p: any) => {
    await supabase.from('polls').update({ is_active: !p.is_active }).eq('id', p.id);
    showToast(p.is_active ? 'Poll closed' : 'Poll activated', 'success');
    fetchPolls();
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 focus:bg-white/[0.06] transition-all";
  const labelCls = "block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <Vote className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Polls & Voting</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">Create and manage student polls</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Poll</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading polls...</p>
        </div>
      ) : polls.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5">
          <Vote className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No polls yet</p>
          <p className="text-white/25 text-xs font-sans mt-1">Create your first poll to get students voting</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map(p => {
            const opts: string[] = typeof p.options === 'string' ? JSON.parse(p.options) : (p.options || []);
            const results = pollResults[p.id] || {};
            const totalVotes = Object.values(results).reduce((a: number, b: number) => a + b, 0);

            return (
              <div key={p.id} className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200 group">
                {/* Poll Header */}
                <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-display font-bold text-base text-white">{p.title}</h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${p.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {p.is_active ? '● Active' : '● Closed'}
                      </span>
                    </div>
                    {p.description && <p className="text-white/45 text-xs font-sans">{p.description}</p>}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`p-2 rounded-xl transition-all ${p.is_active ? 'hover:bg-red-500/10 text-red-400/70 hover:text-red-400' : 'hover:bg-emerald-500/10 text-emerald-500/70 hover:text-emerald-400'}`}
                      title={p.is_active ? 'Close Poll' : 'Activate Poll'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p)} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vote Results */}
                <div className="space-y-2.5">
                  {opts.map(opt => {
                    const count = results[opt] || 0;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    return (
                      <div key={opt}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-sans text-white/70 truncate max-w-[60%]">{opt}</span>
                          <span className="text-[10px] font-mono text-white/40">{pct}% ({count})</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-orange-burnt to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(214,90,30,0.4)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center space-x-1.5 mt-3 pt-3 border-t border-white/[0.05]">
                    <BarChart2 className="w-3 h-3 text-white/25" />
                    <p className="text-[10px] text-white/35 font-mono">{totalVotes} total votes</p>
                    {p.end_date && (
                      <span className="text-[10px] text-white/25 font-sans ml-auto">
                        Ends {new Date(p.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div onClick={() => setShowModal(false)} className="absolute inset-0" />
          <div className="relative bg-[#0A1428] w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden border border-white/10">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-burnt/20 to-transparent border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-burnt/20 rounded-lg">
                  <Vote className="w-4 h-4 text-orange-burnt" />
                </div>
                <h4 className="font-display font-extrabold text-sm text-white">
                  {editId ? 'Edit Poll' : 'Create New Poll'}
                </h4>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className={labelCls}>Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Poll title" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Options *</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                        placeholder={`Option ${i + 1}`}
                        className={inputCls}
                      />
                      {options.length > 2 && (
                        <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setOptions([...options, ''])} className="text-orange-burnt text-xs font-bold font-display hover:text-orange-300 transition-colors">
                    + Add Option
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-orange-burnt w-4 h-4" />
                    <span className="text-sm font-sans text-white/70 font-medium">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center space-x-1.5 hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editId ? 'Update' : 'Create'} Poll</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPolls;
