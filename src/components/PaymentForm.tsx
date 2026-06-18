import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { initiatePayment } from '../lib/cashfree';
import { sendPaymentReceiptEmail, sendAdminPaymentNotification } from '../lib/brevo';
import { generateUploadAndDownloadReceipt } from '../lib/receiptPdf';
import { DNALoader } from './DNALoader';
import { useToast } from './admin/Toast';
import { Lock, CreditCard, ChevronDown, UserCheck } from 'lucide-react';

const FALLBACK_PURPOSES = [
  { name: 'NSS Fee', defaultAmount: 20 },
  { name: 'DBATU Registration', defaultAmount: 10 },
  { name: 'MSBTE Registration', defaultAmount: 10 },
  { name: 'Blood Donation Camp', defaultAmount: 0 },
  { name: 'Cultural Event', defaultAmount: 50 },
  { name: 'Industrial Visit', defaultAmount: 100 },
  { name: 'Custom (Other Payments)', defaultAmount: 10 },
];

const YEARS = [
  'B.Pharm I Year',
  'B.Pharm II Year',
  'B.Pharm III Year',
  'B.Pharm IV Year',
  'M.Pharm I Year',
  'M.Pharm II Year',
  'D.Pharm I Year',
  'D.Pharm II Year',
];

export const PaymentForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentYear, setStudentYear] = useState(YEARS[0]);
  const [purposesList, setPurposesList] = useState<any[]>(FALLBACK_PURPOSES);
  const [purpose, setPurpose] = useState(FALLBACK_PURPOSES[0].name);
  const [amount, setAmount] = useState<number>(FALLBACK_PURPOSES[0].defaultAmount);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isEmailFromAuth, setIsEmailFromAuth] = useState(false);

  const [isLocked, setIsLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from Supabase Auth user
  useEffect(() => {
    const autoFillFromAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUserId(user.id);
        const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const email = user.email || '';
        if (name) setStudentName(name);
        if (email) {
          setStudentEmail(email);
          setIsEmailFromAuth(true);
        }
      }
    };
    autoFillFromAuth();
  }, []);

  // Load predefined purposes from Supabase with fallback
  useEffect(() => {
    const loadDynamicPurposes = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_purposes')
          .select('name, amount')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map((item: any) => ({
            name: item.name,
            defaultAmount: item.amount
          }));
          mapped.push({ name: 'Custom (Other Payments)', defaultAmount: 10 });
          setPurposesList(mapped);

          // Update initial purpose and amount if URL is empty
          const urlPurpose = searchParams.get('purpose');
          const urlAmount = searchParams.get('amount');
          if (!urlPurpose && !urlAmount) {
            setPurpose(mapped[0].name);
            setAmount(mapped[0].defaultAmount);
          }
        }
      } catch (err) {
        console.warn('Using payment purposes hardcoded fallback:', err);
      }
    };
    loadDynamicPurposes();
  }, [searchParams]);

  // Prefill from URL query parameters if present
  useEffect(() => {
    const urlPurpose = searchParams.get('purpose');
    const urlAmount = searchParams.get('amount');

    if (urlPurpose) {
      // Find matching standard purpose or set custom
      const matched = purposesList.find(p => p.name.toLowerCase() === urlPurpose.toLowerCase());
      if (matched) {
        setPurpose(matched.name);
      } else {
        setPurpose('Custom (Other Payments)');
      }
      setIsLocked(true);
    }

    if (urlAmount !== null) {
      const parsedAmount = parseInt(urlAmount, 10);
      if (!isNaN(parsedAmount) && parsedAmount >= 0) {
        setAmount(parsedAmount);
      }
      setIsLocked(true);
    }
  }, [searchParams, purposesList]);

  const handlePurposeChange = (selectedPurpose: string) => {
    setPurpose(selectedPurpose);
    const matched = purposesList.find(p => p.name === selectedPurpose);
    if (matched && selectedPurpose !== 'Custom (Other Payments)') {
      setAmount(matched.defaultAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim() || !studentPhone.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (amount < 0) {
      toast.error('Amount cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insert pending payment record into Supabase
      const { data: record, error: dbError } = await supabase
        .from('payments')
        .insert({
          student_name:  studentName,
          student_email: studentEmail,
          student_phone: studentPhone,
          student_year:  studentYear,
          purpose:       purpose,
          amount:        amount,
          status:        'pending',
          user_id:       authUserId || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      if (!record) throw new Error('Failed to create payment reference.');

      // If amount is zero (e.g. Free Blood Donation registration / fee), complete immediately without Razorpay
      if (amount === 0) {
        const fakePaymentId = `pay_free_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
        const formattedDate = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Generate & upload receipt PDF
        const receiptUrl = await generateUploadAndDownloadReceipt({
          paymentId:   fakePaymentId,
          studentName,
          studentEmail,
          studentYear,
          purpose,
          amount,
          status:      'completed',
          date:        formattedDate,
        });

        // Update record
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            payment_id:   fakePaymentId,
            status:       'completed',
            receipt_sent: true,
            receipt_url:  receiptUrl || null,
          })
          .eq('id', record.id);

        if (updateError) throw updateError;

        // Dispatch receipt and notification email
        await sendPaymentReceiptEmail({
          studentName,
          studentEmail,
          studentYear,
          purpose,
          amount,
          paymentId: fakePaymentId,
          formattedDate,
        });

        await sendAdminPaymentNotification({
          studentName,
          purpose,
          amount,
        });

        toast.success('Registration successful!');
        navigate(`/payment-success?id=${record.id}`);
        return;
      }

      // 2. Launch Cashfree dynamic modal checkout
      let rzpResponse: any;
      try {
        rzpResponse = await initiatePayment({
          studentName,
          studentEmail,
          studentPhone,
          amount,
          purpose,
          description: `Fee: ${purpose}`,
          recordId: record.id
        });
      } catch (payError: any) {
        // Update payment record to failed
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', record.id);

        toast.error(payError.message || 'Payment was cancelled or failed.');
        setIsSubmitting(false);
        return;
      }

      if (rzpResponse && rzpResponse.razorpay_payment_id) {
        const formattedDate = new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        // 3. Generate & upload receipt PDF
        const receiptUrl = await generateUploadAndDownloadReceipt({
          paymentId:   rzpResponse.razorpay_payment_id,
          orderId:     rzpResponse.cfOrderId,
          studentName,
          studentEmail,
          studentYear,
          purpose,
          amount,
          status:      'completed',
          date:        formattedDate,
        });

        // 4. Update Supabase record as completed
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            payment_id:   rzpResponse.razorpay_payment_id,
            order_id:     rzpResponse.cfOrderId || null,
            status:       'completed',
            receipt_sent: true,
            receipt_url:  receiptUrl || null,
          })
          .eq('id', record.id);

        if (updateError) throw updateError;

        // 5. Send Brevo Receipt & Notification
        await sendPaymentReceiptEmail({
          studentName,
          studentEmail,
          studentYear,
          purpose,
          amount,
          paymentId: rzpResponse.razorpay_payment_id,
          formattedDate,
        });

        await sendAdminPaymentNotification({
          studentName,
          purpose,
          amount,
        });

        toast.success('Payment successful! Receipt sent to your email.');
        navigate(`/payment-success?id=${record.id}`);
      } else {
        throw new Error('No transaction ID received from payment gateway.');
      }
    } catch (err: any) {
      console.error('Payment Error Flow:', err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl shadow-2xl p-6 sm:p-8 select-none text-white">
      <div className="flex items-center space-x-3 mb-6 border-b border-white/10 pb-4">
        <CreditCard className="w-6 h-6 text-orange-burnt animate-pulse" />
        <h2 className="font-display font-extrabold text-lg sm:text-xl uppercase tracking-wide">
          💳 Payment Details
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Purpose Dropdown selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt">
            Payment Purpose*
          </label>
          <div className="relative">
            <select
              value={purpose}
              disabled={isLocked || isSubmitting}
              onChange={(e) => handlePurposeChange(e.target.value)}
              className="w-full bg-[#070F25]/90 border border-white/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt appearance-none cursor-pointer disabled:opacity-65"
            >
              {purposesList.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#070F25]">
                  {p.name} {p.name !== 'Custom (Other Payments)' ? `— ₹${p.defaultAmount}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt">
            Amount (INR)*
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-extrabold text-white/70">
              ₹
            </span>
            <input
              type="number"
              value={amount}
              disabled={isLocked || purpose !== 'Custom (Other Payments)' || isSubmitting}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="Enter custom amount"
              className="w-full bg-[#070F25]/90 border border-white/15 rounded-xl pl-8 pr-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt disabled:opacity-65"
              required
              min="0"
            />
          </div>
          {isLocked && (
            <p className="text-[10px] text-white/40 font-semibold italic flex items-center space-x-1">
              <span>🔒 Amount and Purpose are pre-filled and secured.</span>
            </p>
          )}
        </div>

        <hr className="border-white/10 my-4" />

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt">
            Your Full Name*
          </label>
          <input
            type="text"
            value={studentName}
            disabled={isSubmitting}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Rahul Singh"
            className="w-full bg-[#070F25]/90 border border-white/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt"
            required
          />
        </div>

        {/* Email — readonly if logged in */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt flex items-center space-x-1.5">
            <span>Your Email*</span>
            {isEmailFromAuth && (
              <span className="flex items-center space-x-1 text-emerald-400 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full normal-case tracking-normal">
                <UserCheck className="w-3 h-3" />
                <span>Auto-filled from your account</span>
              </span>
            )}
          </label>
          <input
            type="email"
            value={studentEmail}
            disabled={isSubmitting}
            readOnly={isEmailFromAuth}
            onChange={(e) => !isEmailFromAuth && setStudentEmail(e.target.value)}
            placeholder="rahul.singh@gmail.com"
            className={`w-full bg-[#070F25]/90 border border-white/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt ${
              isEmailFromAuth ? 'opacity-70 cursor-not-allowed select-none' : ''
            }`}
            required
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt">
            WhatsApp Number*
          </label>
          <input
            type="tel"
            value={studentPhone}
            disabled={isSubmitting}
            onChange={(e) => setStudentPhone(e.target.value)}
            placeholder="9876543210"
            className="w-full bg-[#070F25]/90 border border-white/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt"
            required
          />
        </div>

        {/* Year Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-display font-bold uppercase tracking-wider text-orange-burnt">
            Your Year*
          </label>
          <div className="relative">
            <select
              value={studentYear}
              disabled={isSubmitting}
              onChange={(e) => setStudentYear(e.target.value)}
              className="w-full bg-[#070F25]/90 border border-white/15 rounded-xl px-4 py-3 text-sm font-sans focus:outline-none focus:border-orange-burnt appearance-none cursor-pointer"
            >
              {YEARS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#070F25]">
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>
        </div>

        <hr className="border-white/10 my-4" />

        {/* Total Summary Row */}
        <div className="flex items-center justify-between py-1 font-display">
          <span className="text-sm font-bold uppercase tracking-wider text-white/70">Total Amount:</span>
          <span className="text-2xl font-extrabold text-orange-burnt">₹{amount}</span>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative py-3.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-xs font-display font-extrabold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-lg shadow-orange-burnt/15 border border-white/10 hover:shadow-orange-burnt/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="h-5 flex items-center justify-center scale-50">
              <DNALoader />
            </div>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>{amount === 0 ? '🔒 Register For Free →' : `🔒 Pay Securely ₹${amount} →`}</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-white/40 text-center font-semibold">
          Powered by Cashfree • Secure 256-bit SSL Encrypted Connection
        </p>
      </form>
    </div>
  );
};
