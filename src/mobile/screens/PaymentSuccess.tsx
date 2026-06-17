import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DNALoader } from '../../components/DNALoader';
import { Home, Printer, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentRecordId = searchParams.get('id');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);

  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentRecordId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentRecordId)
          .maybeSingle();

        if (error) throw error;
        setPayment(data);
      } catch (err) {
        console.error('Error fetching completed payment record:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentRecordId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <DNALoader />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-white px-6 text-center space-y-4">
        <div className="bg-red-500/10 border border-red-500/25 p-6 rounded-2xl max-w-sm">
          <p className="text-3xl mb-2">⚠️</p>
          <h2 className="font-display font-extrabold text-lg mb-2 text-red-400">Reference Not Found</h2>
          <p className="text-white/60 text-xs font-sans mb-6">
            The transaction reference is invalid or could not be fetched. If you paid and money was deducted, please check your email for receipt.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-display font-bold uppercase tracking-wider text-white transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4 text-orange-burnt" />
            <span>Return to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(payment.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#050B18] text-white px-4 pt-6 pb-12 overflow-y-auto space-y-6 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')} 
          className="inline-flex items-center space-x-1.5 text-white/50 hover:text-orange-burnt font-display text-xs font-bold transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /><span>Home</span>
        </button>

        {/* Confirmation Status */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-emerald-500/10 border border-emerald-500/25 rounded-full">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-white uppercase tracking-wider">
            Payment Success!
          </h2>
          <div className="flex items-center justify-center space-x-1.5 bg-emerald-500/5 py-2 px-3 rounded-xl border border-emerald-500/10 max-w-xs mx-auto text-[10px] text-white/70 font-sans">
            <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Receipt has been sent to your email.</span>
          </div>
        </div>

        {/* Digital Receipt Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <div className="text-center pb-4 border-b border-white/5">
            <div className="w-10 h-10 rounded-full bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center overflow-hidden mx-auto mb-2">
              <img 
                alt="Council Logo" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjyoTFvyEFR975TtIY9lyKfrLHfAXGGF7JVgRdFBnE3cjc_gdwumA6XC0MYZ8tDiGPAd-05hNEfr_es_OMw0IXeZI0U3ByOSbo7Aw6AWqidd0bijT8_gmtzYoRal4igXr20dWvPdxxXpI6MAorWCQbO3ZWGMqvhJ1-k2d_VLPgdNUj20x2iOPW87FxHEiITNw-wgKgekzPjPx8DckrX8giHDyjcoz5gw-mLAv8it8EbMsQEgTAoAXLylFsQjS52NE90FdsyerwVJc"
              />
            </div>
            <h3 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
              TGPCOP Student Council
            </h3>
            <p className="text-[9px] text-white/40 font-sans tracking-widest uppercase mt-0.5">
              Official Transaction Receipt
            </p>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="flex justify-between items-center">
              <span className="text-white/50">Student Name:</span>
              <span className="text-white font-extrabold">{payment.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Year / Branch:</span>
              <span className="text-white font-bold">{payment.student_year}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Purpose:</span>
              <span className="text-white font-bold text-right max-w-[180px] truncate">{payment.purpose}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Date & Time:</span>
              <span className="text-white font-bold">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Payment ID:</span>
              <span className="text-white font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">{payment.payment_id || 'N/A'}</span>
            </div>
            
            <hr className="border-white/5 my-3" />

            <div className="flex justify-between items-center font-display">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Amount Paid:</span>
              <span className="text-lg font-extrabold text-orange-burnt">₹{payment.amount}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/50">Status:</span>
              <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border border-emerald-500/20">
                ✅ PAID
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Actions */}
      <div className="space-y-2 pt-6">
        <button
          onClick={() => window.print()}
          className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-[0.98] border border-white/10 flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full py-3.5 bg-white/5 border border-white/10 text-xs font-display font-bold uppercase tracking-wider text-white transition-all active:scale-[0.98] rounded-xl flex items-center justify-center space-x-1.5"
        >
          <Home className="w-4 h-4 text-orange-burnt" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
