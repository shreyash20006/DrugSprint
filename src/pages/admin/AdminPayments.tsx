import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { sendPaymentReceiptEmail } from '../../lib/brevo';
import { downloadCsv } from '../../lib/exportCsv';
import { 
  CreditCard, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Mail, 
  CheckCircle, 
  Calendar,
  Filter
} from 'lucide-react';

const PURPOSES = [
  'All Purposes',
  'NSS Fee',
  'DBATU Registration',
  'MSBTE Registration',
  'Blood Donation Camp',
  'Cultural Event',
  'Industrial Visit',
  'Custom (Other Payments)',
];

export const AdminPayments: React.FC = () => {
  const toast = useToast();
  const { role } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [purposeFilter, setPurposeFilter] = useState('All Purposes');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Statistics State
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalFailed:    0,
    totalPending:   0,
    todayCollected: 0,
    totalAmount:    0
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      calculateStats(data || []);
    } catch (err: any) {
      console.error('Error fetching admin payments:', err);
      toast.error('Failed to load payments ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const calculateStats = (data: any[]) => {
    const completedPayments = data.filter(p => p.status === 'completed');
    const failedPayments    = data.filter(p => p.status === 'failed');
    const pendingPayments   = data.filter(p => p.status === 'pending');

    const totalAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayCollected = completedPayments
      .filter(p => {
        const paymentDate = new Date(p.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        return paymentDate === today;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      totalCompleted: completedPayments.length,
      totalFailed:    failedPayments.length,
      totalPending:   pendingPayments.length,
      todayCollected,
      totalAmount
    });
  };

  const handleResendReceipt = async (payment: any) => {
    if (payment.status !== 'completed') {
      toast.error('Receipt can only be sent for completed payments.');
      return;
    }

    setResendingId(payment.id);
    try {
      const formattedDate = new Date(payment.created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      await sendPaymentReceiptEmail({
        studentName: payment.student_name,
        studentEmail: payment.student_email,
        studentYear: payment.student_year,
        purpose: payment.purpose,
        amount: payment.amount,
        paymentId: payment.payment_id || 'N/A',
        formattedDate,
      });

      // Update in Supabase that receipt was resent
      await supabase
        .from('payments')
        .update({ receipt_sent: true })
        .eq('id', payment.id);

      toast.success('Receipt email successfully resent to student!');
      fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to resend receipt email.');
    } finally {
      setResendingId(null);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (role !== 'super_admin' && role !== 'developer') {
      toast.error('Permission denied. Super Admin role required to delete payments.');
      return;
    }

    if (!window.confirm('Are you sure you want to permanently delete this payment record? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Payment record successfully deleted.');
      fetchPayments();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete payment record.');
    }
  };

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error('No payments to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Year', 'Purpose', 'Amount', 'Payment ID', 'Status', 'Date'];
    const rows = filteredPayments.map(p => [
      p.student_name,
      p.student_email,
      p.student_phone || '-',
      p.student_year,
      p.purpose,
      `₹${p.amount}`,
      p.payment_id || '-',
      p.status.toUpperCase(),
      new Date(p.created_at).toLocaleString('en-IN')
    ]);

    downloadCsv(`tgpcop_payments_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
    toast.success('CSV report downloaded successfully!');
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = 
      p.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.payment_id && p.payment_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPurpose = purposeFilter === 'All Purposes' || p.purpose === purposeFilter;

    return matchesSearch && matchesStatus && matchesPurpose;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-orange-burnt animate-pulse" />
          <h2 className="font-display font-extrabold text-xl text-white">
            Payments & Collections Ledger
          </h2>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredPayments.length === 0}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold shadow-md hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Stats Summary Widgets Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {/* Successful */}
        <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Successful</p>
            <h3 className="text-2xl font-display font-extrabold text-emerald-400">{stats.totalCompleted}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Failed */}
        <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Failed</p>
            <h3 className="text-2xl font-display font-extrabold text-red-400">{stats.totalFailed}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
            <span className="text-base">❌</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Pending</p>
            <h3 className="text-2xl font-display font-extrabold text-amber-400">{stats.totalPending}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <span className="text-base">⏳</span>
          </div>
        </div>

        {/* Today */}
        <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Today</p>
            <h3 className="text-2xl font-display font-extrabold text-orange-burnt">₹{stats.todayCollected}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-burnt flex items-center justify-center border border-orange-500/20">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        {/* Total */}
        <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-4 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Total Collected</p>
            <h3 className="text-2xl font-display font-extrabold text-indigo-400">₹{stats.totalAmount}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-450 flex items-center justify-center border border-indigo-500/20">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Purpose & Search */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md rounded-xl border border-white/10 p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex border border-white/10 rounded-xl p-1 w-full md:w-auto bg-white/5 shrink-0">
            {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#0D1B3E] text-white shadow-sm border border-white/10'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Input bar */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or payment ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-orange-burnt/50 outline-none text-sm font-sans transition-all"
            />
          </div>
        </div>

        {/* Purpose Filter dropdown */}
        <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="text-xs font-bold text-white/40">Filter by Purpose:</span>
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3 py-1 text-xs font-sans font-bold border border-white/10 rounded-lg bg-[#0D1B3E] text-white focus:outline-none focus:border-orange-burnt/50 cursor-pointer"
          >
            {PURPOSES.map(p => (
              <option key={p} value={p} className="bg-[#0D1B3E] text-white">{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Records Table */}
      <div className="bg-[#0D1B3E]/30 backdrop-blur-md rounded-xl border border-white/10 shadow-lg overflow-hidden select-none">
        {loading ? (
          <div className="p-16 text-center text-white/40">
            <div className="w-8 h-8 rounded-full border-2 border-orange-burnt border-t-transparent animate-spin mx-auto mb-3" />
            <span>Loading transaction ledger...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-white/40">
            <CreditCard className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="font-semibold">No transactions match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40 border-b border-white/10">
                  <th className="text-left px-5 py-3.5">Student</th>
                  <th className="text-left px-5 py-3.5">Year</th>
                  <th className="text-left px-5 py-3.5">Purpose</th>
                  <th className="text-left px-5 py-3.5">Amount</th>
                  <th className="text-left px-5 py-3.5">Payment ID</th>
                  <th className="text-center px-5 py-3.5">Status</th>
                  <th className="text-left px-5 py-3.5">Date</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Name / Email */}
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-white leading-tight">
                        {payment.student_name}
                      </span>
                      <span className="block text-xs text-white/40 leading-relaxed">
                        {payment.student_email}
                      </span>
                    </td>

                    {/* Year badge */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                        {payment.student_year}
                      </span>
                    </td>

                    {/* Purpose */}
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-white/80 text-xs">
                        {payment.purpose}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-display font-extrabold text-white">
                      ₹{payment.amount}
                    </td>

                    {/* Transaction ID */}
                    <td className="px-5 py-3.5 font-mono text-xs text-white/50">
                      {payment.payment_id || '—'}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5 text-center">
                      {payment.status === 'completed' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <span>✅</span>
                          <span>Completed</span>
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          <span>⏳</span>
                          <span>Pending</span>
                        </span>
                      )}
                      {payment.status === 'failed' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                          <span>❌</span>
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-white/40">
                      {new Date(payment.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Action Panel */}
                    <td className="px-5 py-3.5 text-right space-x-2 shrink-0">
                      {/* View Details */}
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        title="View Full Ledger Details"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Resend Receipt */}
                      <button
                        onClick={() => handleResendReceipt(payment)}
                        disabled={payment.status !== 'completed' || resendingId === payment.id}
                        title="Resend Receipt Email"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white transition-all cursor-pointer disabled:opacity-35"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {/* Super Admin Delete */}
                      {(role === 'super_admin' || role === 'developer') && (
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          title="Delete Permanently"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* View Full details Modal panel */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">

          {/* Modal Container */}
          <div className="bg-[#0D1B3E] rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-8 relative border border-white/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-white">
            <h3 className="font-display font-extrabold text-lg text-white border-b border-white/10 pb-3 mb-5 uppercase tracking-wide flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-orange-burnt" />
              <span>Full Transaction Details</span>
            </h3>

            <div className="space-y-4 text-sm text-white/80">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Student Name</span>
                <span className="font-semibold text-white text-base">{selectedPayment.student_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Email</span>
                  <span className="font-semibold break-all text-xs">{selectedPayment.student_email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">WhatsApp Phone</span>
                  <span className="font-semibold text-xs">{selectedPayment.student_phone || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Year / branch</span>
                  <span className="px-2.5 py-0.5 inline-block rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold mt-1">
                    {selectedPayment.student_year}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Status</span>
                  <div className="mt-1">
                    {selectedPayment.status === 'completed' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <span>✅ Completed</span>
                      </span>
                    )}
                    {selectedPayment.status === 'pending' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                        <span>⏳ Pending</span>
                      </span>
                    )}
                    {selectedPayment.status === 'failed' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold">
                        <span>❌ Failed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Purpose</span>
                  <span className="font-bold text-xs">{selectedPayment.purpose}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Amount Paid</span>
                  <span className="font-extrabold text-orange-burnt text-base">₹{selectedPayment.amount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Payment ID</span>
                  <span className="font-mono text-xs font-semibold">{selectedPayment.payment_id || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Receipt Sent</span>
                  <span className="font-semibold text-xs">{selectedPayment.receipt_sent ? '📧 Resent Successfully' : '❌ Not Sent'}</span>
                </div>

                {selectedPayment.receipt_url && (
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Receipt PDF</span>
                    <a
                      href={selectedPayment.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 mt-1 rounded-lg bg-orange-burnt/10 hover:bg-orange-burnt/20 border border-orange-burnt/20 text-orange-burnt text-xs font-display font-bold uppercase tracking-wider transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Receipt PDF</span>
                    </a>
                  </div>
                )}
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-0.5">Created Date & Time</span>
                <span className="font-semibold text-xs">
                  {new Date(selectedPayment.created_at).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPayment(null)}
              className="mt-6 w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/60 font-display text-xs font-bold transition-all uppercase tracking-widest cursor-pointer"
            >
              Close details
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPayments;
