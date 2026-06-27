import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import {
  computeAttendanceStats,
  resetCheckIn,
  manualCheckIn,
  bulkManualCheckIn,
  markCertificateIssued,
  type LiveCheckIn,
} from '../../lib/checkIn';
import { generateAttendancePdf } from '../../lib/attendancePdf';
import { downloadAttendanceExcel, downloadBulkAttendanceExcel } from '../../lib/attendanceExcel';
import { generateCertificatePdf, generateBulkCertificatesPdf } from '../../lib/certificatePdf';
import { logAction } from '../../lib/logger';
import {
  BarChart3, Users, UserCheck, Clock, IndianRupee, Percent,
  Download, FileSpreadsheet, FileText, Award, RotateCcw, UserPlus,
  Loader2, Radio, CheckSquare, Square, Search,
} from 'lucide-react';

interface RegistrationRow {
  id: string;
  registration_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  year: string | null;
  prn: string | null;
  college: string | null;
  branch: string | null;
  payment_status: string;
  amount_paid: number | null;
  checked_in: boolean;
  checked_in_at: string | null;
  manual_check_in: boolean;
  certificate_issued_at: string | null;
  service_id: string;
  service?: { name: string; category: string } | null;
}

export const AdminAttendance: React.FC = () => {
  const toast = useToast();
  const { role } = useAuth();
  const isSuperAdmin = role === 'super_admin' || role === 'developer';

  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [liveCheckIns, setLiveCheckIns] = useState<LiveCheckIn[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('registrations')
        .select('*, service:services(name, category)')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (serviceFilter !== 'all') {
        query = query.eq('service_id', serviceFilter);
      }

      const [regsRes, servicesRes] = await Promise.all([
        query,
        supabase.from('services').select('id, name').eq('is_active', true).order('name'),
      ]);

      if (regsRes.error) throw regsRes.error;
      setRegistrations(regsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, toast]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Realtime live check-ins
  useEffect(() => {
    const channel = supabase
      .channel('attendance-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'registrations' },
        (payload) => {
          const row = payload.new as RegistrationRow & { service?: { name: string } };
          if (!row.checked_in || !row.checked_in_at) return;
          if (serviceFilter !== 'all' && row.service_id !== serviceFilter) return;

          setRegistrations(prev =>
            prev.map(r => (r.id === row.id ? { ...r, ...row } : r))
          );

          setLiveCheckIns(prev => {
            const entry: LiveCheckIn = {
              id: row.id,
              full_name: row.full_name,
              registration_id: row.registration_id,
              checked_in_at: row.checked_in_at!,
              manual_check_in: row.manual_check_in,
              service_name: row.service?.name,
            };
            return [entry, ...prev.filter(c => c.id !== row.id)].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [serviceFilter]);

  const filtered = useMemo(() => {
    if (!searchQuery) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter(r =>
      r.full_name?.toLowerCase().includes(q) ||
      r.registration_id?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.prn?.toLowerCase().includes(q)
    );
  }, [registrations, searchQuery]);

  const stats = useMemo(() => computeAttendanceStats(registrations), [registrations]);
  const serviceName = serviceFilter === 'all'
    ? 'All Services'
    : (services.find(s => s.id === serviceFilter)?.name || 'Event');

  const toAttendanceRows = () =>
    filtered.map((r, i) => ({
      sr: i + 1,
      registration_id: r.registration_id,
      full_name: r.full_name,
      year: r.year || '',
      prn: r.prn || '',
      college: r.college || '',
      branch: r.branch || '',
      email: r.email,
      phone: r.phone || '',
      amount_paid: r.amount_paid,
      payment_status: r.payment_status,
      checked_in: r.checked_in,
      checked_in_at: r.checked_in_at,
      manual_check_in: r.manual_check_in,
      service_name: r.service?.name,
    }));

  const handleExportPdf = () => {
    const rows = toAttendanceRows();
    if (rows.length === 0) { toast.error('No data to export'); return; }
    generateAttendancePdf(rows, serviceName, stats);
    toast.success('PDF downloaded');
  };

  const handleExportExcel = () => {
    const rows = toAttendanceRows();
    if (rows.length === 0) { toast.error('No data to export'); return; }
    downloadAttendanceExcel(rows, serviceName, stats);
    toast.success('Excel file downloaded');
  };

  const handleBulkExport = () => {
    const rows = registrations.map((r, i) => ({
      sr: i + 1,
      registration_id: r.registration_id,
      full_name: r.full_name,
      year: r.year || '',
      prn: r.prn || '',
      college: r.college || '',
      payment_status: r.payment_status,
      checked_in: r.checked_in,
      checked_in_at: r.checked_in_at,
      service_name: r.service?.name,
      email: r.email,
      amount_paid: r.amount_paid,
    }));
    downloadBulkAttendanceExcel(rows);
    toast.success('Bulk attendance exported');
  };

  const handleReset = async (id: string) => {
    if (!isSuperAdmin) { toast.error('Super Admin access required'); return; }
    if (!window.confirm('Reset check-in for this student? They can scan again.')) return;
    setActionLoading(id);
    const res = await resetCheckIn(id);
    setActionLoading(null);
    if (res.status === 'success') {
      toast.success('Check-in reset');
      await logAction('RESET_CHECKIN', id);
      void fetchData();
    } else {
      toast.error(res.message || 'Reset failed');
    }
  };

  const handleManualCheckIn = async (id: string) => {
    if (!isSuperAdmin) { toast.error('Super Admin access required'); return; }
    setActionLoading(id);
    const res = await manualCheckIn(id);
    setActionLoading(null);
    if (res.status === 'success') {
      toast.success('Manual check-in recorded');
      await logAction('MANUAL_CHECKIN', id);
      void fetchData();
    } else {
      toast.error(res.message || 'Manual check-in failed');
    }
  };

  const handleBulkManual = async () => {
    if (!isSuperAdmin) { toast.error('Super Admin access required'); return; }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { toast.error('Select registrations first'); return; }
    if (!window.confirm(`Mark ${ids.length} students as checked in?`)) return;
    setActionLoading('bulk');
    const res = await bulkManualCheckIn(ids);
    setActionLoading(null);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Updated ${res.updated}, skipped ${res.skipped}`);
      setSelectedIds(new Set());
      void fetchData();
    }
  };

  const handleCertificate = async (reg: RegistrationRow) => {
    if (!reg.checked_in) {
      toast.error('Student must be checked in to receive a certificate');
      return;
    }
    generateCertificatePdf({
      studentName: reg.full_name,
      eventName: reg.service?.name || 'Event',
      registrationId: reg.registration_id,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      year: reg.year || undefined,
      college: reg.college || undefined,
    });
    await markCertificateIssued(reg.id);
    void fetchData();
    toast.success('Certificate downloaded');
  };

  const handleBulkCertificates = () => {
    const checkedIn = filtered.filter(r => r.checked_in);
    if (checkedIn.length === 0) {
      toast.error('No checked-in students for certificates');
      return;
    }
    generateBulkCertificatesPdf(
      checkedIn.map(r => ({
        studentName: r.full_name,
        eventName: r.service?.name || 'Event',
        registrationId: r.registration_id,
        date: r.checked_in_at
          ? new Date(r.checked_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date().toLocaleDateString('en-IN'),
        year: r.year || undefined,
        college: r.college || undefined,
      })),
      serviceName
    );
    toast.success(`${checkedIn.length} certificates downloaded`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pending = filtered.filter(r => !r.checked_in);
    if (selectedIds.size === pending.length && pending.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map(r => r.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-orange-burnt" />
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Attendance Dashboard</h2>
            <p className="text-white/40 text-xs">Live check-ins · exports · Super Admin controls</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg text-xs font-bold hover:bg-emerald-500/25">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/25 rounded-lg text-xs font-bold hover:bg-blue-500/25">
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleBulkExport} className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-lg text-xs font-bold hover:bg-purple-500/25">
            <Download className="w-3.5 h-3.5" /> Bulk Export
          </button>
          <button onClick={handleBulkCertificates} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-lg text-xs font-bold hover:bg-amber-500/25">
            <Award className="w-3.5 h-3.5" /> Certificates
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Registered', value: stats.total, icon: Users, color: 'text-blue-400' },
          { label: 'Checked In', value: stats.checked_in, icon: UserCheck, color: 'text-emerald-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-orange-burnt' },
          { label: 'Attendance %', value: `${stats.attendance_pct}%`, icon: Percent, color: 'text-cyan-400' },
          { label: 'Live Feed', value: liveCheckIns.length, icon: Radio, color: 'text-pink-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">{s.label}</p>
            </div>
            <h3 className={`text-xl font-display font-extrabold ${s.color}`}>{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live check-ins */}
        <div className="xl:col-span-1 bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4">
          <h3 className="flex items-center gap-2 text-sm font-display font-bold text-white mb-4">
            <Radio className="w-4 h-4 text-pink-400 animate-pulse" /> Live Check-ins
          </h3>
          {liveCheckIns.length === 0 ? (
            <p className="text-white/30 text-xs text-center py-8">Waiting for check-ins…</p>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
              {liveCheckIns.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{c.full_name}</p>
                    <p className="text-[10px] text-white/40 truncate">
                      {c.service_name} · {new Date(c.checked_in_at).toLocaleTimeString('en-IN')}
                      {c.manual_check_in ? ' · Manual' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="xl:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-orange-burnt"
              />
            </div>
            <select
              value={serviceFilter}
              onChange={e => setServiceFilter(e.target.value)}
              className="px-3 py-2.5 bg-[#0D1B3E] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-orange-burnt"
            >
              <option value="all">All Events</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {isSuperAdmin && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleBulkManual()}
                disabled={selectedIds.size === 0 || actionLoading === 'bulk'}
                className="flex items-center gap-1.5 px-3 py-2 bg-orange-burnt/15 text-orange-burnt border border-orange-burnt/25 rounded-lg text-xs font-bold disabled:opacity-40"
              >
                {actionLoading === 'bulk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Bulk Manual Attendance ({selectedIds.size})
              </button>
              <button onClick={toggleSelectAll} className="px-3 py-2 text-xs text-white/50 hover:text-white border border-white/10 rounded-lg">
                {selectedIds.size > 0 ? 'Clear Selection' : 'Select Pending'}
              </button>
            </div>
          )}

          <div className="bg-[#0D1B3E]/30 border border-white/10 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 text-orange-burnt animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {isSuperAdmin && <th className="px-3 py-3 w-10"><CheckSquare className="w-3.5 h-3.5 mx-auto" /></th>}
                      <th className="text-left px-4 py-3">Student</th>
                      <th className="text-left px-4 py-3">Event</th>
                      <th className="text-center px-4 py-3">Check-in</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map(reg => (
                      <tr key={reg.id} className="hover:bg-white/[0.02]">
                        {isSuperAdmin && (
                          <td className="px-3 py-3 text-center">
                            {!reg.checked_in && (
                              <button onClick={() => toggleSelect(reg.id)} className="text-white/40 hover:text-orange-burnt">
                                {selectedIds.has(reg.id) ? <CheckSquare className="w-4 h-4 text-orange-burnt" /> : <Square className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <span className="block font-semibold text-white text-xs">{reg.full_name}</span>
                          <span className="text-[10px] text-white/40 font-mono">{reg.registration_id}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/70">{reg.service?.name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          {reg.checked_in ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                              ✓ {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'YES'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-[9px] font-bold">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {reg.checked_in && (
                              <button
                                onClick={() => void handleCertificate(reg)}
                                title="Download certificate"
                                className="w-7 h-7 rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 flex items-center justify-center"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isSuperAdmin && !reg.checked_in && (
                              <button
                                onClick={() => void handleManualCheckIn(reg.id)}
                                disabled={actionLoading === reg.id}
                                title="Manual check-in"
                                className="w-7 h-7 rounded-lg border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 flex items-center justify-center disabled:opacity-50"
                              >
                                {actionLoading === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {isSuperAdmin && reg.checked_in && (
                              <button
                                onClick={() => void handleReset(reg.id)}
                                disabled={actionLoading === reg.id}
                                title="Reset check-in"
                                className="w-7 h-7 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center disabled:opacity-50"
                              >
                                {actionLoading === reg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
