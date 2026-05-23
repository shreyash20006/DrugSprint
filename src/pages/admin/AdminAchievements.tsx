import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { Modal } from '../../components/admin/Modal';
import { useToast } from '../../components/admin/Toast';
import { ACHIEVEMENT_CATEGORIES } from '../../constants/formOptions';
import { Trophy, Plus, Trash2 } from 'lucide-react';

export const AdminAchievements: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [form, setForm] = useState({
    student_name: '',
    year: '',
    title: '',
    description: '',
    category: 'Academic',
    image_url: '',
  });

  const load = () =>
    supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setItems(data || []));

  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form };
    if (edit) await supabase.from('achievements').update(payload).eq('id', edit.id);
    else await supabase.from('achievements').insert([payload]);
    toast.success('Achievement saved');
    setOpen(false);
    load();
  };

  return (
    <RequirePermission permission="manage_achievements">
      <div className="space-y-6">
        <div className="flex justify-between bg-white p-5 rounded-2xl border">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-burnt" /> 🏅 Achievements
          </h3>
          <button
            onClick={() => {
              setEdit(null);
              setForm({ student_name: '', year: '', title: '', description: '', category: 'Academic', image_url: '' });
              setOpen(true);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg"
          >
            <Plus className="w-4 h-4" /> Add Achievement
          </button>
        </div>
        <div className="grid gap-4">
          {items.map((a) => (
            <div key={a.id} className="bg-white p-4 rounded-xl border flex justify-between items-start gap-4">
              <div>
                <p className="font-bold">{a.student_name} — {a.title}</p>
                <p className="text-xs text-navy-dark/50">{a.year} · {a.category}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setEdit(a); setForm(a); setOpen(true); }} className="text-xs font-bold text-orange-burnt">Edit</button>
                <button onClick={() => supabase.from('achievements').delete().eq('id', a.id).then(load)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Achievement" icon={<Trophy className="w-5 h-5" />}>
        <div className="space-y-2">
          {(['student_name', 'year', 'title', 'description', 'image_url'] as const).map((k) => (
            <input key={k} placeholder={k.replace('_', ' ')} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
          ))}
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
            {ACHIEVEMENT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button onClick={save} className="w-full py-2.5 bg-orange-burnt text-white font-bold rounded-lg">Save</button>
        </div>
      </Modal>
    </RequirePermission>
  );
};

export default AdminAchievements;
