import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Lock, BadgeCheck, Sparkles, ArrowUpRight, CreditCard,
  CheckCircle2, FileText, Mail, Loader2,
} from 'lucide-react';

interface SummaryCardProps {
  /** Selected payment purpose (e.g. "Annual Council Fee") */
  purpose: string;
  /** Amount in INR (numeric) */
  amount: number;
  /** Studen / payer's full name */
  studentName?: string;
  /** Year/branch label */
  studentYear?: string;
  /** Disable Pay Now state */
  disabled?: boolean;
  /** Show loading spinner on button */
  loading?: boolean;
  /** Click handler — usually triggers form.requestSubmit() */
  onPayClick?: () => void;
  /** Label on primary button (defaults to "Proceed to Secure Payment") */
  ctaLabel?: string;
}

const trustSignals = [
  { icon: ShieldCheck, label: '256-bit SSL Encryption' },
  { icon: Lock, label: 'PCI-DSS Compliant' },
  { icon: BadgeCheck, label: 'Verified by Cashfree' },
];

const steps = [
  { icon: FileText, title: 'Fill Details', done: false },
  { icon: CreditCard, title: 'Secure Pay', done: false },
  { icon: Mail, title: 'Email Receipt', done: false },
];

/**
 * Premium SummaryCard — sticky right-rail on desktop checkout.
 *
 *  ▸ Hero amount number with currency
 *  ▸ Order line items (purpose, payer)
 *  ▸ Sticky Pay Now button with shadow + hover lift
 *  ▸ 3-step progress timeline (gives confidence)
 *  ▸ Trust signals strip (SSL/PCI/Verified)
 *  ▸ Money-back guarantee chip
 *  ▸ Decorative corner accents (premium feel)
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  purpose,
  amount,
  studentName,
  studentYear,
  disabled = false,
  loading = false,
  onPayClick,
  ctaLabel = 'Proceed to Secure Payment',
}) => {
  const isFree = amount === 0;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="lg:sticky lg:top-28 lg:self-start"
      data-testid="payment-summary-card"
    >
      <div className="relative rounded-3xl bg-gradient-to-br from-[#0D1B3E]/90 to-[#0A1428]/95 border border-[#C84B0E]/25 backdrop-blur-2xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
        {/* Decorative corner accents */}
        <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-[#C84B0E]/55 rounded-tl-3xl pointer-events-none" />
        <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-gold-accent/40 rounded-br-3xl pointer-events-none" />

        {/* Ambient orbs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 ambient-orb-orange rounded-full opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 ambient-orb-gold rounded-full opacity-30 pointer-events-none" />
        <div className="noise-overlay noise-soft" />

        {/* ── HEADER ── */}
        <div className="relative px-7 py-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C84B0E] to-[#E06D2B] flex items-center justify-center shadow-lg shadow-[#C84B0E]/20">
              <Sparkles className="w-4 h-4 text-white" strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm text-white tracking-tight leading-none">
                Order Summary
              </h3>
              <p className="text-[10px] text-[#C84B0E] font-bold tracking-[0.2em] uppercase mt-1 leading-none">
                Secure Checkout
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {/* ── LINE ITEMS ── */}
        <div className="relative px-7 py-5 space-y-4">
          <div className="space-y-3 pb-4 border-b border-dashed border-white/[0.08]">
            {studentName && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 pt-0.5">
                  Payer
                </span>
                <div className="text-right">
                  <p className="font-display font-bold text-sm text-white leading-tight">
                    {studentName}
                  </p>
                  {studentYear && (
                    <p className="text-[10px] text-white/50 font-sans">{studentYear}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45 pt-0.5">
                For
              </span>
              <p className="font-display font-bold text-sm text-white leading-tight text-right max-w-[180px]">
                {purpose || '—'}
              </p>
            </div>
          </div>

          {/* ── AMOUNT HERO ── */}
          <div className="space-y-1.5 py-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C84B0E]">
              {isFree ? 'Free Registration' : 'Total Amount'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-extrabold text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#C84B0E] to-gold-accent leading-none tracking-tight">
                {isFree ? '₹0' : `₹${amount.toLocaleString('en-IN')}`}
              </span>
              {!isFree && (
                <span className="text-[10px] text-white/40 font-sans font-bold uppercase tracking-wider">
                  INR
                </span>
              )}
            </div>
            {!isFree && (
              <p className="text-[10px] text-white/45 font-sans pt-1">
                Inclusive of all charges · No hidden fees
              </p>
            )}
          </div>

          {/* ── PAY NOW BUTTON ── */}
          <motion.button
            type={onPayClick ? 'button' : 'submit'}
            onClick={onPayClick}
            disabled={disabled || loading}
            whileHover={!disabled && !loading ? { scale: 1.015 } : undefined}
            whileTap={!disabled && !loading ? { scale: 0.985 } : undefined}
            data-testid="summary-pay-button"
            className="relative group w-full inline-flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-[#C84B0E] to-[#E06D2B] text-white font-display text-sm font-extrabold uppercase tracking-[0.16em] shadow-xl shadow-[#C84B0E]/25 hover:shadow-[#C84B0E]/40 transition-all duration-300 disabled:opacity-55 disabled:cursor-not-allowed border border-white/10 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.6} />
                <span className="relative">Processing…</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" strokeWidth={2.6} />
                <span className="relative">{isFree ? 'Confirm Free Registration' : ctaLabel}</span>
                <ArrowUpRight className="w-4 h-4 relative transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.6} />
              </>
            )}
          </motion.button>

          <p className="text-center text-[9px] text-white/35 font-sans pt-1">
            By proceeding, you agree to the{' '}
            <a href="/terms" className="text-[#C84B0E] hover:text-gold-accent transition-colors underline-offset-2 hover:underline">
              Terms
            </a>{' '}
            &{' '}
            <a href="/refunds" className="text-[#C84B0E] hover:text-gold-accent transition-colors underline-offset-2 hover:underline">
              Refund Policy
            </a>
          </p>
        </div>

        {/* ── PROGRESS STEPS ── */}
        <div className="relative px-7 py-5 border-t border-white/[0.06] bg-white/[0.015]">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45 mb-3">
            What happens next
          </p>
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        idx === 0
                          ? 'bg-[#C84B0E]/15 border-[#C84B0E]/35 text-[#C84B0E]'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/35'
                      }`}
                    >
                      {idx === 0 ? (
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.4} />
                      ) : (
                        <StepIcon className="w-4 h-4" strokeWidth={2.2} />
                      )}
                    </div>
                    <span
                      className={`text-[9px] font-display font-bold uppercase tracking-wider text-center leading-tight ${
                        idx === 0 ? 'text-[#C84B0E]' : 'text-white/45'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex-shrink-0 w-4 h-px bg-white/[0.08] mx-1 -mt-4" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── TRUST SIGNALS ── */}
        <div className="relative px-7 py-4 border-t border-white/[0.06] bg-[#050B18]/40">
          <div className="grid grid-cols-3 gap-2">
            {trustSignals.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="flex flex-col items-center gap-1.5 group">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.4} />
                  </div>
                  <span className="text-[8px] font-display font-bold uppercase tracking-wider text-white/50 text-center leading-tight">
                    {t.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="relative px-7 py-3.5 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-bold tracking-[0.18em] uppercase">
          <span className="text-white/35">Powered by Cashfree</span>
          <span className="inline-flex items-center gap-1 text-gold-accent">
            <BadgeCheck className="w-2.5 h-2.5" strokeWidth={2.6} />
            RBI Authorized
          </span>
        </div>
      </div>
    </motion.aside>
  );
};

export default SummaryCard;
