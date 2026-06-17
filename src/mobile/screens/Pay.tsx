import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { initiatePayment } from '../../lib/cashfree';
import { sendPaymentReceiptEmail, sendAdminPaymentNotification } from '../../lib/brevo';
import { generateUploadAndDownloadReceipt } from '../../lib/receiptPdf';
import { DNALoader } from '../../components/DNALoader';
import { useToast } from '../../components/admin/Toast';
import { Lock, CreditCard, ChevronDown, ShieldCheck, ArrowLeft } from 'lucide-react';

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

export const Pay: React.FC = () => {
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

          const urlPurpose = searchParams.get('purpose');
          const urlAmount = searchParams.get('amount');
          if (!urlPurpose && !urlAmount) {
            setPurpose(mapped[0].name);
            setAmount(mapped[0].defaultAmount);
          }
        }
      } catch (err) {
        console.warn('Using payment purposes fallback:', err);
      }
    };
    loadDynamicPurposes();
  }, [searchParams]);

  useEffect(() => {
    const urlPurpose = searchParams.get('purpose');
    const urlAmount = searchParams.get('amount');

    if (urlPurpose) {
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
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', record.id);
        toast.error(payError.message || 'Payment failed.');
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

        toast.success('Payment successful! Receipt sent to email.');
        navigate(`/payment-success?id=${record.id}`);
      } else {
        throw new Error('No transaction ID received from gateway.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 pt-4 px-2">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-white/50 hover:text-orange-burnt font-display text-xs font-bold"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header */}
      <section className="space-y-1.5">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Payment Gateway
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Pay College Fees
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Official secure dynamic payment system for fests, IVs, registrations, and council charges.
        </p>
      </section>

      {/* Security alert */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-2.5 backdrop-blur-md">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-xs">🔒 Secured Collection Gateway</p>
          <p className="text-white/60 text-[10px] font-sans mt-0.5">
            This is the official payment portal for TGP College of Pharmacy Nagpur. All transactions are encrypted.
          </p>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              Payment Purpose *
            </label>
            <div className="relative">
              <select
                value={purpose}
                disabled={isLocked || isSubmitting}
                onChange={(e) => handlePurposeChange(e.target.value)}
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer"
              >
                {purposesList.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} {p.name !== 'Custom (Other Payments)' ? `— ₹${p.defaultAmount}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              Amount (INR) *
            </label>
            <input
              type="number"
              value={amount}
              disabled={isLocked || purpose !== 'Custom (Other Payments)' || isSubmitting}
              onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              placeholder="Enter amount"
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              Your Full Name *
            </label>
            <input
              type="text"
              value={studentName}
              disabled={isSubmitting}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Full Name"
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              Your Email Address *
            </label>
            <input
              type="email"
              value={studentEmail}
              disabled={isSubmitting}
              readOnly={isEmailFromAuth}
              onChange={(e) => !isEmailFromAuth && setStudentEmail(e.target.value)}
              placeholder="your.email@example.com"
              className={`w-full border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none placeholder-white/20 ${
                isEmailFromAuth ? 'bg-white/5 cursor-not-allowed text-white/45' : 'bg-[#050B18]/60 focus:border-orange-burnt'
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              WhatsApp Number *
            </label>
            <input
              type="tel"
              value={studentPhone}
              disabled={isSubmitting}
              onChange={(e) => setStudentPhone(e.target.value)}
              placeholder="WhatsApp mobile number"
              className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
              Your Year *
            </label>
            <div className="relative">
              <select
                value={studentYear}
                disabled={isSubmitting}
                onChange={(e) => setStudentYear(e.target.value)}
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer"
              >
                {YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-white/5 mt-4">
            <span className="text-xs font-bold text-white/70 uppercase">Total:</span>
            <span className="text-xl font-display font-extrabold text-orange-burnt">₹{amount}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="scale-75">
                <DNALoader />
              </div>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>{amount === 0 ? 'Register for Free' : `Pay ₹${amount}`}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Pay;
