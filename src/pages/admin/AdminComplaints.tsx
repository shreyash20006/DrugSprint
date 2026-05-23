import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { useToast } from '../../components/admin/Toast';
import { AlertTriangle } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  received: 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/20',
  investigating: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export const AdminComplaints: React.FC = () => {
  const toast = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () =>
    supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        const n: Record<string, string> = {};
        (data || []).forEach((c) => { n[c.id] = c.internal_notes || ''; });
        setNotes(n);
      });

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('complaints').update({ status }).eq('id', id);
    toast.success('Status updated');
    load();
  };

  const saveNotes = async (id: string) => {
    await supabase.from('complaints').update({ internal_notes: notes[id] }).eq('id', id);
    toast.success('Notes saved');
  };

  return (
    <RequirePermission permission="view_complaints">
      <div className="space-y-6">
        <h3 className="font-display font-bold flex items-center gap-2 bg-white p-5 rounded-2xl border">
          <AlertTriangle className="w-5 h-5 text-orange-burnt" /> ⚠️ Complaints
        </h3>
        <div className="bg-white rounded-2xl border overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-[10px] uppercase font-bold text-navy-dark/40">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold">{c.incident_type}</td>
                  <td className="px-4 py-3 max-w-xs text-xs">{c.description}</td>
                  <td className="px-4 py-3 text-xs">{c.incident_date || '—'}</td>
                  <td className="px-4 py-3 text-xs">{c.location || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_STYLES[c.status] || STATUS_STYLES.received}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-y-2">
                    <select
                      value={c.status}
                      onChange={(e) => updateStatus(c.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="received">received</option>
                      <option value="investigating">investigating</option>
                      <option value="resolved">resolved</option>
                    </select>
                    <textarea
                      rows={2}
                      placeholder="Internal notes"
                      value={notes[c.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                      className="w-full text-xs border rounded p-1"
                    />
                    <button onClick={() => saveNotes(c.id)} className="text-[10px] font-bold text-orange-burnt block">Save notes</button>
                    {c.status !== 'resolved' && (
                      <button onClick={() => updateStatus(c.id, 'resolved')} className="text-[10px] font-bold text-emerald-600 block">
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequirePermission>
  );
};

export default AdminComplaints;
