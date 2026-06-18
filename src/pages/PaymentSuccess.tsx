import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { DNALoader } from '../components/DNALoader';
import { ScienceBackground } from '../components/ScienceBackground';
import { Home, Printer, Mail } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paymentRecordId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<any>(null);
  const [confetti, setConfetti] = useState<{ id: number; left: string; color: string; delay: string; size: string }[]>([]);

  useEffect(() => {
    // Generate CSS confetti particles on mount
    const colors = ['#C84B0E', '#F5A623', '#22C55E', '#3B82F6', '#EC4899'];
    const particles = Array.from({ length: 45 }).map((_, idx) => ({
      id: idx,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2.5}s`,
      size: `${Math.random() * 8 + 6}px`,
    }));
    setConfetti(particles);
  }, []);

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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <DNALoader />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-white px-4">
        <div className="bg-red-500/10 border border-red-500/25 p-8 rounded-2xl text-center max-w-md shadow-2xl backdrop-blur-md">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="font-display font-extrabold text-xl mb-2 text-red-400">Payment Reference Not Found</h2>
          <p className="text-white/60 text-sm font-sans mb-6">
            The transaction reference is invalid or could not be fetched. If you paid and money was deducted, please check your mailbox for receipt.
          </p>
          <Link
            to="/"
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-display font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4 text-orange-burnt" />
            <span>Return to Home</span>
          </Link>
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden py-16 px-4 flex flex-col justify-center items-center select-none print:bg-white print:text-black print:min-h-0 print:py-0">
      {/* Background Molecular Vector Layer */}
      <div className="print:hidden">
        <ScienceBackground />
        <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full ambient-orb-orange z-0 pointer-events-none opacity-40" />
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full ambient-orb-gold z-0 pointer-events-none opacity-40" />
        <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />
      </div>

      {/* Confetti container */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 print:hidden">
        <style>{`
          @keyframes fall {
            0% { transform: translateY(-50px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
          }
          .confetti-particle {
            position: absolute;
            top: -20px;
            animation: fall 4s linear infinite;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
        `}</style>
        {confetti.map((c) => (
          <div
            key={c.id}
            className="confetti-particle rounded-xs"
            style={{
              left: c.left,
              backgroundColor: c.color,
              animationDelay: c.delay,
              width: c.size,
              height: c.size,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 w-full max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Checkmark and Confirmation Title */}
        <div className="text-center space-y-4 print:hidden">
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-emerald-500/10 border border-emerald-500/35 rounded-full shadow-2xl">
            <style>{`
              @keyframes drawCheckmark {
                to { stroke-dashoffset: 0; }
              }
              .checkmark-path {
                stroke-dasharray: 80;
                stroke-dashoffset: 80;
                animation: drawCheckmark 0.8s ease-out forwards 0.2s;
              }
            `}</style>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" className="checkmark-path" />
            </svg>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-wider">
            Payment Successful!
          </h2>
          <p className="text-white/60 text-xs sm:text-sm font-sans flex items-center justify-center space-x-1.5 bg-emerald-500/5 py-2 px-4 rounded-xl border border-emerald-500/10 max-w-sm mx-auto">
            <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Receipt has been sent to your registered email.</span>
          </p>
        </div>

        {/* Digital Receipt Card Container */}
        <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl shadow-2xl p-6 sm:p-8 select-none print:border-none print:bg-white print:shadow-none print:p-0 print:text-black">
          
          {/* Header branding in receipt */}
          <div className="text-center mb-6 pb-6 border-b border-white/10 print:border-black/10">
            <img
              src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg"
              alt="TGPCOP Logo"
              className="w-14 h-14 object-cover mx-auto rounded-xl border border-white/10 shadow-lg mb-2 print:border-black/10"
            />
            <h3 className="font-display font-extrabold text-base text-white uppercase tracking-wider print:text-black">
              TGPCOP Student Council
            </h3>
            <p className="text-[10px] text-white/50 font-sans tracking-widest uppercase mt-0.5 print:text-black/50">
              Official Transaction Receipt
            </p>
          </div>

          {/* Details Table */}
          <div className="space-y-4 font-sans text-sm">
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Student Name:</span>
              <span className="text-white print:text-black font-extrabold">{payment.student_name}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Year / Branch:</span>
              <span className="text-white print:text-black font-bold">{payment.student_year}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Purpose:</span>
              <span className="text-white print:text-black font-bold">{payment.purpose}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Date & Time:</span>
              <span className="text-white print:text-black font-bold">{formattedDate}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Payment ID:</span>
              <span className="text-white print:text-black font-mono text-xs">{payment.payment_id || 'N/A'}</span>
            </div>
            
            <hr className="border-white/10 my-4 print:border-black/10" />

            <div className="flex justify-between items-center py-1 font-display">
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 print:text-black/70">Amount Paid:</span>
              <span className="text-xl font-extrabold text-orange-burnt">₹{payment.amount}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-white/50 print:text-black/60 font-semibold">Status:</span>
              <span className="bg-emerald-500/15 text-emerald-400 px-3 py-1 rounded-full text-xs font-extrabold border border-emerald-500/20 print:bg-green-100 print:text-green-800">
                ✅ PAID
              </span>
            </div>
          </div>
        </div>

        {/* Foot Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden no-print">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0D1B3E]/85 hover:bg-white/5 border border-white/10 text-xs font-display font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4 text-orange-burnt" />
            <span>Back to Home</span>
          </Link>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-xs font-display font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10 flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-orange-burnt/15 hover:shadow-orange-burnt/25"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
