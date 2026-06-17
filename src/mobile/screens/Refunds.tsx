import React from 'react';
import { RotateCcw, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const Refunds: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Refund Rules
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Cancellations & Refunds
        </h2>
      </section>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5 shadow-lg text-white/70 text-xs leading-relaxed font-sans"
      >
        <div>
          <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-orange-burnt" />
            <span>1. Cancellation Windows</span>
          </h3>
          <p>
            If you want to cancel your slot for fests, quizzes, or industrial visits, email a request to <a href="mailto:president@tgpcop.com" className="text-orange-burnt hover:underline">president@tgpcop.com</a> at least **48 Hours** prior to the event schedule.
          </p>
        </div>

        <div>
          <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-orange-burnt" />
            <span>2. Fee Refunds</span>
          </h3>
          <p>
            Approved cancellations will trigger standard reversals to the source payment method (card, UPI, net banking) minus gateway charges.
          </p>
        </div>

        <div>
          <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-orange-burnt" />
            <span>3. Study Store Materials</span>
          </h3>
          <p>
            Printout files, handbooks, and study modules are non-refundable. Damaged materials will be replaced at the council desk within 2 working days.
          </p>
        </div>

        <div>
          <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5">4. Timelines</h3>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Card transactions: 5-7 working days.</li>
            <li>UPI transfers: 2-3 working days.</li>
            <li>Net Banking: 4-5 working days.</li>
          </ul>
        </div>

        <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] text-white/40 italic">
          <span>Effective: June 2026</span>
          <span>Accounts Desk Desk</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Refunds;
