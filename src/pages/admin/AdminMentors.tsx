import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { Modal } from '../../components/admin/Modal';
import { useToast } from '../../components/admin/Toast';
import { Users, Plus } from 'lucide-react';

export const AdminMentors: React.FC = () => {
  const toast = useToast();
  const [mentors, setMentors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    year: '',
    specialization: '',
    available_time: '',
    email: '',
    bio: '',
    photo_url: '',
    is_available: true,
  });

  const load = async () => {
    const [{ data: m }, { data: r }] = await Promise.all([
      supabase.from('mentors').select('*').order('name'),
      supabase.from('mentor_requests').select('*, mentors(name)').order('created_at', { ascending: false }),
    ]);
    setMentors(m || []);
    setRequests(r || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await supabase.from('mentors').insert([form]);
    toast.success('Mentor added');
    setOpen(false);
    load();
  };

  return (
    <RequirePermission permission="manage_mentors">
      <div className="space-y-8">
        <div className="flex justify-between bg-white p-5 rounded-2xl border">
          <h3 className="font-display font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-burnt" /> 🤝 Mentors
          </h3>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1 px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg">
            <Plus className="w-4 h-4" /> Add Mentor
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {mentors.map((m) => (
            <div key={m.id} className="bg-white p-4 rounded-xl border">
              <p className="font-bold">{m.name}</p>
              <p className="text-xs text-navy-dark/50">{m.specialization} · {m.is_available ? 'Available' : 'Unavailable'}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <h4 className="p-4 font-bold text-sm border-b">Mentor Requests</h4>
          <table className="w-full text-sm min-w-[500px]">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-navy-dark/40">
              <tr>
                <th className="px-4 py-3">Junior</th>
                <th className="px-4 py-3">Mentor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{r.junior_name}</td>
                  <td className="px-4 py-3">{r.mentors?.name || '—'}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add Mentor" icon={<Users className="w-5 h-5" />}>
        <div className="space-y-2">
          {Object.keys(form).filter((k) => k !== 'is_available').map((k) => (
            <input
              key={k}
              placeholder={k.replace('_', ' ')}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          ))}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Available
          </label>
          <button onClick={save} className="w-full py-2.5 bg-orange-burnt text-white font-bold rounded-lg">Save</button>
        </div>
      </Modal>
    </RequirePermission>
  );
};

export default AdminMentors;
