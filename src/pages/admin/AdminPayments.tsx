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
    totalPayments: 0,
    todayCollected: 0,
    totalAmount: 0
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
    
    // Total Payments
    const totalPayments = completedPayments.length;

    // Total Amount Collected
    const totalAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Today Collected (Asia/Kolkata timezone)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayCollected = completedPayments
      .filter(p => {
        const paymentDate = new Date(p.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        return paymentDate === today;
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    setStats({
      totalPayments,
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
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-navy-dark/10 pb-4">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-orange-burnt animate-pulse" />
          <h2 className="font-display font-extrabold text-xl text-navy-dark">
            Payments & Collections Ledger
          </h2>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredPayments.length === 0}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-navy-dark text-white font-display text-xs font-bold hover:bg-orange-burnt transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* Stats Summary Widgets Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/40 mb-1">
              Total Payments
            </p>
            <h3 className="text-2xl font-display font-extrabold text-navy-dark">
              {stats.totalPayments}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/40 mb-1">
              Today Collected
            </p>
            <h3 className="text-2xl font-display font-extrabold text-orange-burnt">
              ₹{stats.todayCollected}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-burnt flex items-center justify-center border border-orange-100">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/40 mb-1">
              Total Collected Amount
            </p>
            <h3 className="text-2xl font-display font-extrabold text-indigo-600">
              ₹{stats.totalAmount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panel: Filters, Purpose & Search */}
      <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Status Tabs */}
          <div className="flex border border-navy-dark/10 rounded-xl p-1 w-full md:w-auto bg-gray-50 shrink-0">
            {(['all', 'completed', 'pending', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-navy-dark text-white shadow-sm'
                    : 'text-navy-dark/60 hover:text-navy-dark'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Input bar */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-dark/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or payment ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans"
            />
          </div>
        </div>

        {/* Purpose Filter dropdown */}
        <div className="flex items-center space-x-2 pt-2 border-t border-navy-dark/5">
          <Filter className="w-4 h-4 text-navy-dark/40" />
          <span className="text-xs font-bold text-navy-dark/50">Filter by Purpose:</span>
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="px-3 py-1 text-xs font-sans font-bold border border-navy-dark/15 rounded-lg bg-white focus:outline-none focus:border-orange-burnt cursor-pointer"
          >
            {PURPOSES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Records Table */}
      <div className="bg-white rounded-xl border border-navy-dark/10 shadow-sm overflow-hidden select-none">
        {loading ? (
          <div className="p-16 text-center text-navy-dark/50">
            <div className="w-8 h-8 rounded-full border-2 border-orange-burnt border-t-transparent animate-spin mx-auto mb-3" />
            <span>Loading transaction ledger...</span>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-16 text-center text-navy-dark/40">
            <CreditCard className="w-10 h-10 text-navy-dark/15 mx-auto mb-3" />
            <p className="font-semibold">No transactions match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy-dark/[0.02]">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50 border-b border-navy-dark/5">
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
              <tbody className="divide-y divide-navy-dark/5">
                {filteredPayments.map((payment) => (
                  <tr 
                    key={payment.id} 
                    className="hover:bg-orange-burnt/[0.02] transition-colors"
                  >
                    {/* Name / Email */}
                    <td className="px-5 py-3.5">
                      <span className="block font-semibold text-navy-dark leading-tight">
                        {payment.student_name}
                      </span>
                      <span className="block text-xs text-navy-dark/50 leading-relaxed">
                        {payment.student_email}
                      </span>
                    </td>

                    {/* Year badge */}
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold">
                        {payment.student_year}
                      </span>
                    </td>

                    {/* Purpose */}
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-navy-dark/80 text-xs">
                        {payment.purpose}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-display font-extrabold text-navy-dark">
                      ₹{payment.amount}
                    </td>

                    {/* Transaction ID */}
                    <td className="px-5 py-3.5 font-mono text-xs text-navy-dark/65">
                      {payment.payment_id || '—'}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-3.5 text-center">
                      {payment.status === 'completed' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                          <span>✅</span>
                          <span>Completed</span>
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">
                          <span>⏳</span>
                          <span>Pending</span>
                        </span>
                      )}
                      {payment.status === 'failed' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">
                          <span>❌</span>
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-navy-dark/50">
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
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-navy-dark/10 hover:border-orange-burnt hover:bg-orange-burnt/5 text-navy-dark/50 hover:text-orange-burnt transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Resend Receipt */}
                      <button
                        onClick={() => handleResendReceipt(payment)}
                        disabled={payment.status !== 'completed' || resendingId === payment.id}
                        title="Resend Receipt Email"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-navy-dark/10 hover:border-orange-burnt hover:bg-orange-burnt/5 text-navy-dark/50 hover:text-orange-burnt transition-all cursor-pointer disabled:opacity-35"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      {/* Super Admin Delete */}
                      {(role === 'super_admin' || role === 'developer') && (
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          title="Delete Permanently"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/10 hover:border-red-500 hover:bg-red-500/5 text-red-500/50 hover:text-red-500 transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setSelectedPayment(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Modal Container */}
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 sm:p-8 relative border border-navy-dark/10 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-lg text-navy-dark border-b border-navy-dark/10 pb-3 mb-5 uppercase tracking-wide flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-orange-burnt" />
              <span>Full Transaction Details</span>
            </h3>

            <div className="space-y-4 text-sm text-navy-dark">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Student Name</span>
                <span className="font-semibold text-navy-dark text-base">{selectedPayment.student_name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Email</span>
                  <span className="font-semibold break-all text-xs">{selectedPayment.student_email}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">WhatsApp Phone</span>
                  <span className="font-semibold text-xs">{selectedPayment.student_phone || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Year / branch</span>
                  <span className="px-2.5 py-0.5 inline-block rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold mt-1">
                    {selectedPayment.student_year}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Status</span>
                  <div className="mt-1">
                    {selectedPayment.status === 'completed' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold">
                        <span>✅ Completed</span>
                      </span>
                    )}
                    {selectedPayment.status === 'pending' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold">
                        <span>⏳ Pending</span>
                      </span>
                    )}
                    {selectedPayment.status === 'failed' && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">
                        <span>❌ Failed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Purpose</span>
                  <span className="font-bold text-xs">{selectedPayment.purpose}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Amount Paid</span>
                  <span className="font-extrabold text-orange-burnt text-base">₹{selectedPayment.amount}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Payment ID</span>
                  <span className="font-mono text-xs font-semibold">{selectedPayment.payment_id || '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Receipt Sent</span>
                  <span className="font-semibold text-xs">{selectedPayment.receipt_sent ? '📧 Resent Successfully' : '❌ Not Sent'}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/45 mb-0.5">Created Date & Time</span>
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
              className="mt-6 w-full py-2.5 rounded-xl border border-navy-dark/15 hover:bg-navy-dark hover:text-white text-navy-dark font-display text-xs font-bold transition-all uppercase tracking-widest cursor-pointer"
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
