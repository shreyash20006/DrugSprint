import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { getEventCapacity } from '../../lib/eventCapacity';
import { downloadCsv } from '../../lib/exportCsv';
import { ClipboardList, Download, Loader2 } from 'lucide-react';

export const AdminRegistrations: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState('');
  const [regs, setRegs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('events').select('*').order('name').then(({ data }) => {
      setEvents(data || []);
      if (data?.[0]) setEventId(data[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRegs(data || []));
  }, [eventId]);

  const event = events.find((e) => e.id === eventId);
  const cap = event ? getEventCapacity(event) : null;

  const exportCsv = () => {
    downloadCsv(`registrations-${event?.name || 'event'}.csv`, [
      ['Name', 'Year', 'Email', 'Phone', 'Date'],
      ...regs.map((r) => [
        r.full_name,
        r.year,
        r.email,
        r.whatsapp || '',
        new Date(r.created_at).toLocaleString(),
      ]),
    ]);
  };

  return (
    <RequirePermission permission="view_registrations">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-navy-dark/10">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-orange-burnt" />
            <h3 className="font-display font-bold text-navy-dark">📋 Registrations</h3>
          </div>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-navy-dark/15 text-sm bg-white min-w-[200px]"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={!regs.length}
            className="flex items-center gap-2 px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        {cap && cap.capacity > 0 && (
          <p className="text-sm font-display font-bold text-orange-burnt">
            Total: {regs.length} | Capacity: {cap.capacity} | {cap.seatsLeft} left
          </p>
        )}
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-orange-burnt mx-auto" />
        ) : (
          <div className="bg-white rounded-2xl border overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold text-navy-dark/40">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {regs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-semibold">{r.full_name}</td>
                    <td className="px-4 py-3">{r.year}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">{r.whatsapp || '—'}</td>
                    <td className="px-4 py-3 text-xs text-navy-dark/50">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </RequirePermission>
  );
};

export default AdminRegistrations;
