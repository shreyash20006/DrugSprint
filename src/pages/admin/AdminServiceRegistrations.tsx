import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { downloadCsv } from '../../lib/exportCsv';
import { logAction } from '../../lib/logger';
import {
  Users, Search, Download, Eye, Trash2,
  CheckCircle, XCircle, Clock, Filter, Loader2
} from 'lucide-react';

export const AdminServiceRegistrations: React.FC = () => {
  const toast = useToast();
  const { role } = useAuth();
  const canDelete = ['super_admin', 'developer'].includes(role || '');

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedReg, setSelectedReg] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regsRes, servicesRes] = await Promise.all([
        supabase.from('registrations').select('*, service:services(name,category,price)').order('created_at', { ascending: false }),
        supabase.from('services').select('id, name').order('name'),
      ]);
      if (regsRes.error) throw regsRes.error;
      setRegistrations(regsRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load registrations: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!canDelete) { toast.error('Super Admin or Developer role required'); return; }
    if (!window.confirm('Permanently delete this registration? Cannot be undone.')) return;
    try {
      const { error } = await supabase.from('registrations').delete().eq('id', id);
      if (error) throw error;
      await logAction('DELETED_SERVICE_REGISTRATION', `ID: ${id}`);
      toast.success('Registration deleted');
      fetchData();
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleExportCsv = () => {
    if (filtered.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Registration ID', 'Service', 'Name', 'Email', 'Phone', 'Year', 'PRN', 'Amount Paid', 'Payment Status', 'Date'];
    const rows = filtered.map(r => [
      r.registration_id, r.service?.name || 'N/A', r.full_name, r.email,
      r.phone || '-', r.year || '-', r.prn || '-',
      r.amount_paid ? `₹${r.amount_paid}` : 'Free',
      r.payment_status?.toUpperCase() || 'N/A',
      new Date(r.created_at).toLocaleString('en-IN'),
    ]);
    downloadCsv(`registrations_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
    toast.success('CSV exported!');
  };

  const filtered = registrations.filter(r => {
    const matchSearch = !searchQuery ||
      r.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.registration_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchService = serviceFilter === 'all' || r.service_id === serviceFilter;
    const matchPayment = paymentFilter === 'all' || r.payment_status === paymentFilter;
    return matchSearch && matchService && matchPayment;
  });

  const stats = {
    total: registrations.length,
    paid: registrations.filter(r => r.payment_status === 'completed').length,
    free: registrations.filter(r => !r.amount_paid || r.amount_paid === 0).length,
    revenue: registrations.filter(r => r.payment_status === 'completed').reduce((sum, r) => sum + (r.amount_paid || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-orange-burnt animate-pulse" />
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Service Registrations</h2>
            <p className="text-white/40 text-xs">All student service registrations and payment records</p>
          </div>
        </div>
        <button onClick={handleExportCsv} disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold rounded-xl shadow-md hover:-translate-y-px transition-all disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-400' },
          { label: 'Paid', value: stats.paid, color: 'text-emerald-400' },
          { label: 'Free', value: stats.free, color: 'text-purple-400' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString('en-IN')}`, color: 'text-orange-burnt' },
        ].map(s => (
          <div key={s.label} className="bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">{s.label}</p>
            <h3 className={`text-2xl font-display font-extrabold ${s.color}`}>{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, registration ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-orange-burnt transition-all" />
        </div>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          className="px-3 py-2.5 bg-[#0D1B3E] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-orange-burnt">
          <option value="all">All Services</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
          className="px-3 py-2.5 bg-[#0D1B3E] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-orange-burnt">
          <option value="all">All Payments</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0D1B3E]/30 border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-burnt animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-white/40">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p>No registrations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <th className="text-left px-5 py-3.5">Reg. ID</th>
                  <th className="text-left px-5 py-3.5">Student</th>
                  <th className="text-left px-5 py-3.5">Service</th>
                  <th className="text-left px-5 py-3.5">Year</th>
                  <th className="text-right px-5 py-3.5">Amount</th>
                  <th className="text-center px-5 py-3.5">Payment</th>
                  <th className="text-left px-5 py-3.5">Date</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(reg => (
                  <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-white/60">{reg.registration_id}</td>
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-white">{reg.full_name}</span>
                      <span className="text-xs text-white/40">{reg.email}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-white/80">{reg.service?.name || '—'}</span>
                      {reg.service?.category && (
                        <span className="block text-[9px] text-white/40">{reg.service.category}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/60">{reg.year || '—'}</td>
                    <td className="px-5 py-3.5 text-right font-display font-bold text-white">
                      {reg.amount_paid ? `₹${reg.amount_paid}` : 'Free'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {reg.payment_status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                          <CheckCircle className="w-2.5 h-2.5" /> Paid
                        </span>
                      )}
                      {reg.payment_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      )}
                      {reg.payment_status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold">
                          <XCircle className="w-2.5 h-2.5" /> Failed
                        </span>
                      )}
                      {(!reg.payment_status || reg.payment_status === 'completed' && !reg.amount_paid) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-white/40">
                      {new Date(reg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedReg(reg)} title="View details"
                        className="w-8 h-8 rounded-lg border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button onClick={() => handleDelete(reg.id)} title="Delete"
                          className="w-8 h-8 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 flex items-center justify-center transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white">
            <h3 className="font-display font-extrabold text-lg mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
              <Users className="w-5 h-5 text-orange-burnt" /> Registration Details
            </h3>
            <div className="space-y-3 text-sm">
              {[
                ['Registration ID', selectedReg.registration_id],
                ['Service', selectedReg.service?.name],
                ['Full Name', selectedReg.full_name],
                ['Email', selectedReg.email],
                ['Phone', selectedReg.phone || '—'],
                ['Year', selectedReg.year || '—'],
                ['PRN', selectedReg.prn || '—'],
                ['College', selectedReg.college || '—'],
                ['Amount Paid', selectedReg.amount_paid ? `₹${selectedReg.amount_paid}` : 'Free'],
                ['Payment ID', selectedReg.payment_id || '—'],
                ['Payment Status', selectedReg.payment_status?.toUpperCase() || 'N/A'],
                ['Registered On', new Date(selectedReg.created_at).toLocaleString('en-IN')],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider shrink-0">{label}</span>
                  <span className="text-xs font-semibold text-white text-right break-all">{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedReg(null)}
              className="mt-6 w-full py-2.5 border border-white/10 text-white/60 font-display text-xs font-bold rounded-xl hover:bg-white/5 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceRegistrations;
