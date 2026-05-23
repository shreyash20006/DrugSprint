import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { Modal } from '../../components/admin/Modal';
import { useToast } from '../../components/admin/Toast';
import { parseJsonArray } from '../../lib/parseJson';
import { Vote, Plus, Trash2 } from 'lucide-react';

export const AdminPolls: React.FC = () => {
  const toast = useToast();
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    options: ['', ''],
    end_date: '',
    is_active: true,
  });

  const load = async () => {
    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from('polls').select('*').order('created_at', { ascending: false }),
      supabase.from('votes').select('*'),
    ]);
    setPolls(p || []);
    setVotes(v || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    const options = form.options.filter((o) => o.trim());
    if (!form.title || options.length < 2) {
      toast.error('Title and at least 2 options required');
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      options,
      end_date: form.end_date || null,
      is_active: form.is_active,
    };
    if (edit) {
      await supabase.from('polls').update(payload).eq('id', edit.id);
    } else {
      await supabase.from('polls').insert([payload]);
    }
    toast.success('Poll saved');
    setOpen(false);
    setEdit(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete poll?')) return;
    await supabase.from('polls').delete().eq('id', id);
    load();
  };

  const counts = (pollId: string, len: number) => {
    const c = Array(len).fill(0);
    votes.filter((v) => v.poll_id === pollId).forEach((v) => {
      if (v.option_index >= 0 && v.option_index < len) c[v.option_index]++;
    });
    return c;
  };

  return (
    <RequirePermission permission="manage_polls">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl border">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Vote className="w-5 h-5 text-orange-burnt" /> 🗳️ Polls
          </h3>
          <button
            onClick={() => {
              setEdit(null);
              setForm({ title: '', description: '', options: ['', ''], end_date: '', is_active: true });
              setOpen(true);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg"
          >
            <Plus className="w-4 h-4" /> Create Poll
          </button>
        </div>
        {polls.map((poll) => {
          const options = parseJsonArray<string>(poll.options);
          const c = counts(poll.id, options.length);
          const total = c.reduce((a, b) => a + b, 0);
          return (
            <div key={poll.id} className="bg-white rounded-2xl border p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-display font-bold">{poll.title}</h4>
                  <p className="text-xs text-navy-dark/50">{poll.description}</p>
                  <span className={`text-[10px] font-bold uppercase ${poll.is_active ? 'text-emerald-600' : 'text-navy-dark/40'}`}>
                    {poll.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEdit(poll);
                      setForm({
                        title: poll.title,
                        description: poll.description || '',
                        options: [...options, ''],
                        end_date: poll.end_date?.slice(0, 16) || '',
                        is_active: poll.is_active,
                      });
                      setOpen(true);
                    }}
                    className="text-xs font-bold text-orange-burnt"
                  >
                    Edit
                  </button>
                  <button onClick={() => remove(poll.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {options.map((opt, i) => {
                const pct = total ? Math.round((c[i] / total) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span>{opt}</span>
                      <span>{pct}% ({c[i]})</span>
                    </div>
                    <div className="h-2 bg-navy-dark/10 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-burnt" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-navy-dark/40">Total voters: {total}</p>
            </div>
          );
        })}
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={edit ? 'Edit Poll' : 'Create Poll'} icon={<Vote className="w-5 h-5" />}>
        <div className="space-y-3">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
          {form.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = e.target.value;
                  setForm({ ...form, options: opts });
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
              />
              {form.options.length > 2 && (
                <button type="button" onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })}>×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setForm({ ...form, options: [...form.options, ''] })} className="text-xs font-bold text-orange-burnt">+ Add option</button>
          <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
          <button onClick={save} className="w-full py-2.5 bg-orange-burnt text-white font-bold rounded-lg">Save</button>
        </div>
      </Modal>
    </RequirePermission>
  );
};

export default AdminPolls;
