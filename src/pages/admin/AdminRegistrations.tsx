import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { ClipboardList, Loader2, Download, Users, Search, Calendar } from 'lucide-react';

export const AdminRegistrations: React.FC = () => {
  const toast = useToast();
  const showToast = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') toast.success(msg);
    else toast.error(msg);
  };
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('events').select('id, name, capacity, registered_count').order('created_at', { ascending: false });
      setEvents(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setRegistrations([]); return; }
    const fetch = async () => {
      setIsLoadingRegs(true);
      const { data } = await supabase.from('event_registrations').select('*').eq('event_id', selectedEventId).order('created_at', { ascending: false });
      setRegistrations(data || []);
      setIsLoadingRegs(false);
    };
    fetch();
  }, [selectedEventId]);

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const filteredRegs = search
    ? registrations.filter(r =>
        r.full_name.toLowerCase().includes(search.toLowerCase()) ||
        r.email.toLowerCase().includes(search.toLowerCase())
      )
    : registrations;

  const exportCSV = () => {
    if (filteredRegs.length === 0) return;
    const headers = ['Name', 'Email', 'WhatsApp', 'Year', 'Registered On'];
    const rows = filteredRegs.map(r => [r.full_name, r.email, r.whatsapp || '-', r.year, new Date(r.created_at).toLocaleDateString()]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `registrations_${selectedEvent?.name || 'event'}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!', 'success');
  };

  const fillPercent = selectedEvent
    ? Math.min(100, Math.round((registrations.length / (selectedEvent.capacity || registrations.length || 1)) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
          <ClipboardList className="w-5 h-5 text-orange-burnt" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-xl text-white">Event Registrations</h2>
          <p className="text-xs text-white/40 font-sans mt-0.5">View and export registrations per event</p>
        </div>
      </div>

      {/* Event Selector Card */}
      <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-4">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
          <Calendar className="w-3 h-3 inline mr-1.5" />Select Event
        </label>
        {isLoading ? (
          <div className="flex items-center space-x-2 text-white/40">
            <Loader2 className="w-4 h-4 animate-spin text-orange-burnt" />
            <span className="text-xs font-sans">Loading events...</span>
          </div>
        ) : (
          <select
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm font-sans outline-none focus:border-orange-burnt/50 focus:bg-white/[0.06] transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#0A1428]">— Choose an event —</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id} className="bg-[#0A1428]">
                {ev.name} ({ev.registered_count || 0}/{ev.capacity || '∞'})
              </option>
            ))}
          </select>
        )}

        {/* Stats Bar */}
        {selectedEvent && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/20">
                <p className="text-xl font-display font-extrabold text-emerald-400">{registrations.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 mt-0.5">Registered</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-3 text-center border border-blue-500/20">
                <p className="text-xl font-display font-extrabold text-blue-400">{selectedEvent.capacity || '∞'}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400/70 mt-0.5">Capacity</p>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-3 text-center border border-amber-500/20">
                <p className="text-xl font-display font-extrabold text-amber-400">
                  {Math.max(0, (selectedEvent.capacity || 100) - registrations.length)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70 mt-0.5">Seats Left</p>
              </div>
            </div>
            {/* Capacity Fill Bar */}
            <div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Capacity utilization</span>
                <span className="text-orange-burnt font-bold">{fillPercent}%</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-burnt to-amber-400 transition-all duration-700 shadow-[0_0_8px_rgba(214,90,30,0.5)]"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registrations Table */}
      {selectedEventId && (
        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm outline-none focus:border-orange-burnt/50 transition-all placeholder-white/30 w-64"
              />
            </div>
            <button
              onClick={exportCSV}
              disabled={filteredRegs.length === 0}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {isLoadingRegs ? (
            <div className="p-12 flex flex-col items-center justify-center text-white/40">
              <Loader2 className="w-7 h-7 animate-spin text-orange-burnt mb-3" />
              <p className="text-xs font-sans">Loading registrations...</p>
            </div>
          ) : filteredRegs.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                <Users className="w-7 h-7 text-white/20" />
              </div>
              <p className="text-white/50 text-sm font-display font-bold">No registrations yet</p>
              <p className="text-white/25 text-xs font-sans mt-1">Students haven't registered for this event</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <th className="text-left px-5 py-4">#</th>
                    <th className="text-left px-5 py-4">Name</th>
                    <th className="text-left px-5 py-4">Email</th>
                    <th className="text-left px-5 py-4">WhatsApp</th>
                    <th className="text-left px-5 py-4">Year</th>
                    <th className="text-left px-5 py-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredRegs.map((r, i) => (
                    <tr key={r.id} className="hover:bg-white/[0.025] transition-colors group/row">
                      <td className="px-5 py-4 text-white/30 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-4">
                        <span className="font-display font-bold text-sm text-white group-hover/row:text-orange-100 transition-colors">
                          {r.full_name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/60 font-sans">{r.email}</td>
                      <td className="px-5 py-4 text-xs text-white/50 font-sans">{r.whatsapp || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                          {r.year}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-white/40 font-sans">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRegistrations;
