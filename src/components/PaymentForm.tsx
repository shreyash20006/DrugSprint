import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { initiatePayment } from '../lib/cashfree';
import { sendPaymentReceiptEmail, sendAdminPaymentNotification } from '../lib/brevo';
import { generateUploadAndDownloadReceipt } from '../lib/receiptPdf';
import { DNALoader } from './DNALoader';
import { useToast } from './admin/Toast';
import { Lock, CreditCard, ChevronDown, User, Mail, Phone } from 'lucide-react';
import { InputField } from './ui/InputField';

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

export interface PaymentFormSummary {
  studentName: string;
  studentEmail: string;
  studentYear: string;
  purpose: string;
  amount: number;
  isSubmitting: boolean;
}

interface PaymentFormProps {
  /** Called whenever form state changes — used by SummaryCard etc. */
  onStateChange?: (state: PaymentFormSummary) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onStateChange }) => {
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

  // Notify parent of current state (for SummaryCard live updates)
  useEffect(() => {
    onStateChange?.({ studentName, studentEmail, studentYear, purpose, amount, isSubmitting });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentName, studentEmail, studentYear, purpose, amount, isSubmitting]);

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
    <div className="relative rounded-3xl bg-[#0D1B3E]/55 border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8 text-white shadow-2xl">
      {/* Decorative corner accents */}
      <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-[#C84B0E]/45 rounded-tl-3xl pointer-events-none" />
      <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-[#FFB338]/35 rounded-br-3xl pointer-events-none" />
      <div className="noise-overlay noise-soft" />

      <div className="relative flex items-center space-x-3 mb-6 border-b border-white/[0.06] pb-4">
        <div className="w-10 h-10 rounded-xl bg-[#C84B0E]/12 border border-[#C84B0E]/25 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-[#C84B0E]" />
        </div>
        <div>
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight leading-none">
            Payment Details
          </h2>
          <p className="text-[10px] text-[#C84B0E] font-bold tracking-[0.2em] uppercase mt-1.5 leading-none">
            SECURE CHECKOUT GATEWAY
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-5" data-testid="payment-form-actual">
        {/* Purpose Dropdown selector */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-display font-bold uppercase tracking-[0.18em] text-white/55">
            Payment Purpose*
          </label>
          <div className="relative group rounded-xl border border-white/[0.08] bg-[#050B18]/55 hover:border-white/15 backdrop-blur-md focus-within:border-[#C84B0E]/80 focus-within:bg-[#050B18]/85 focus-within:ring-2 focus-within:ring-[#C84B0E]/40 transition-all duration-300">
            <select
              value={purpose}
              disabled={isLocked || isSubmitting}
              onChange={(e) => handlePurposeChange(e.target.value)}
              className="w-full bg-transparent text-white font-sans placeholder:text-white/25 focus:outline-none py-3 px-4 pr-10 text-sm appearance-none cursor-pointer disabled:opacity-65"
            >
              {purposesList.map((p) => (
                <option key={p.name} value={p.name} className="bg-[#080F25] text-white">
                  {p.name} {p.name !== 'Custom (Other Payments)' ? `— ₹${p.defaultAmount}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none group-focus-within:text-[#C84B0E] transition-colors" />
          </div>
        </div>

        {/* Amount Input */}
        <InputField
          label="Amount (INR)"
          icon={CreditCard}
          type="number"
          value={amount}
          disabled={isLocked || purpose !== 'Custom (Other Payments)' || isSubmitting}
          locked={isLocked || purpose !== 'Custom (Other Payments)'}
          onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
          placeholder="Enter custom amount"
          required
          min="0"
          hint={isLocked ? "🔒 Pre-filled and locked for this transaction reference." : undefined}
        />

        <hr className="border-white/[0.06] my-4" />

        {/* Full Name */}
        <InputField
          label="Your Full Name"
          icon={User}
          type="text"
          value={studentName}
          disabled={isSubmitting}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Rahul Singh"
          required
        />

        {/* Email */}
        <InputField
          label="Your Email"
          icon={Mail}
          type="email"
          value={studentEmail}
          disabled={isSubmitting}
          locked={isEmailFromAuth}
          onChange={(e) => !isEmailFromAuth && setStudentEmail(e.target.value)}
          placeholder="rahul.singh@gmail.com"
          required
          hint={isEmailFromAuth ? "Auto-filled from your logged-in account." : undefined}
        />

        {/* Phone Number */}
        <InputField
          label="WhatsApp Number"
          icon={Phone}
          type="tel"
          value={studentPhone}
          disabled={isSubmitting}
          onChange={(e) => setStudentPhone(e.target.value)}
          placeholder="9876543210"
          required
        />

        {/* Year Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-display font-bold uppercase tracking-[0.18em] text-white/55">
            Your Year*
          </label>
          <div className="relative group rounded-xl border border-white/[0.08] bg-[#050B18]/55 hover:border-white/15 backdrop-blur-md focus-within:border-[#C84B0E]/80 focus-within:bg-[#050B18]/85 focus-within:ring-2 focus-within:ring-[#C84B0E]/40 transition-all duration-300">
            <select
              value={studentYear}
              disabled={isSubmitting}
              onChange={(e) => setStudentYear(e.target.value)}
              className="w-full bg-transparent text-white font-sans placeholder:text-white/25 focus:outline-none py-3 px-4 pr-10 text-sm appearance-none cursor-pointer disabled:opacity-65"
            >
              {YEARS.map((yr) => (
                <option key={yr} value={yr} className="bg-[#080F25] text-white">
                  {yr}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none group-focus-within:text-[#C84B0E] transition-colors" />
          </div>
        </div>

        <hr className="border-white/[0.06] my-4" />

        {/* Total Summary Row */}
        <div className="flex items-center justify-between py-2 border-t border-dashed border-white/[0.08] font-display">
          <span className="text-sm font-bold uppercase tracking-wider text-white/55">Total Amount:</span>
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#C84B0E] to-[#FFB338]">
            ₹{amount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full relative group py-4 rounded-xl bg-gradient-to-r from-[#C84B0E] to-[#E06D2B] text-xs font-display font-extrabold uppercase tracking-widest text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shrink-0 shadow-lg shadow-[#C84B0E]/15 border border-white/10 hover:shadow-[#C84B0E]/25 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {isSubmitting ? (
            <div className="h-5 flex items-center justify-center scale-50">
              <DNALoader />
            </div>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>{amount === 0 ? 'Register For Free →' : `Pay Securely ₹${amount.toLocaleString('en-IN')} →`}</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-white/40 text-center font-medium">
          Powered by Cashfree • Secure 256-bit SSL Encrypted Connection
        </p>
      </form>
    </div>
  );
};
