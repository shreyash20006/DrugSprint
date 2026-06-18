import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, ShieldCheck, HelpCircle, Phone, Mail, Sparkles, FileText, Headphones,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { PaymentForm, type PaymentFormSummary } from '../components/PaymentForm';
import { SummaryCard } from '../components/ui/SummaryCard';

const supportItems = [
  { icon: Phone, label: 'Call Treasurer', value: '+91 88069 37481', href: 'tel:+918806937481' },
  { icon: Mail, label: 'Email Treasury', value: 'treasury@tgpcopcouncil.online', href: 'mailto:treasury@tgpcopcouncil.online' },
  { icon: HelpCircle, label: 'Read FAQ', value: 'Common payment questions', href: '/contact' },
];

const faqs = [
  {
    q: 'When will I receive my receipt?',
    a: 'Instantly — within 30 seconds of successful payment. Receipt is emailed and downloadable.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes, refunds are processed per our policy. Most refunds appear within 5–7 business days.',
  },
  {
    q: 'What if payment fails?',
    a: 'No money is deducted. If money was deducted but status shows failed, it auto-reverses in 24-72 hours.',
  },
];

export const Pay: React.FC = () => {
  /** Live state lifted from PaymentForm — used to drive the SummaryCard */
  const [summaryState, setSummaryState] = useState<PaymentFormSummary>({
    studentName: '',
    studentEmail: '',
    studentYear: '',
    purpose: '',
    amount: 0,
    isSubmitting: false,
  });

  return (
    <div
      className="relative min-h-screen bg-[#050B18] overflow-hidden pb-28 select-none"
      data-testid="pay-page"
    >
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader
        icon={<CreditCard className="w-6 h-6" />}
        title="Secure Payment Gateway"
        subtitle="Official fee & donation collection portal for TGPCOP Student Council. Encrypted end-to-end, processed by Cashfree."
        breadcrumb="Pay Fees"
        eyebrow="Treasury · 2025-26"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 lg:mt-14">
        {/* Top security strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-500/[0.08] via-transparent to-emerald-500/[0.06] border border-emerald-500/25 backdrop-blur-md p-4 flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" strokeWidth={2.4} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold text-sm text-emerald-400 leading-tight">
              Official & Secured Gateway
            </p>
            <p className="text-white/65 text-xs font-sans leading-relaxed mt-1">
              Authorized payment portal of <span className="text-white font-semibold">Tulsiramji Gaikwad-Patil College of Pharmacy</span>. All transactions use 256-bit SSL encryption.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-400 text-[9px] font-extrabold uppercase tracking-[0.18em] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </motion.div>

        {/* ╔══════════════════════════╗
            ║  Two-column premium grid ║
            ╚══════════════════════════╝ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ── LEFT COLUMN — FORM (8/12) ─────────────────────────────── */}
          <div className="lg:col-span-8 space-y-6">
            {/* Form card with glass + corner accents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative rounded-3xl bg-gradient-to-br from-[#0D1B3E]/85 to-[#0A1428]/90 border border-white/[0.08] backdrop-blur-2xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-orange-burnt/45 rounded-tl-3xl pointer-events-none" />
              <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-gold-accent/35 rounded-br-3xl pointer-events-none" />
              <div className="noise-overlay noise-soft" />

              <div className="relative">
                {/* Card header */}
                <div className="px-6 sm:px-8 py-5 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-burnt/12 border border-orange-burnt/25 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-orange-burnt" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-white tracking-tight leading-none">
                      Payment Details
                    </h2>
                    <p className="text-[10px] text-orange-burnt font-bold tracking-[0.2em] uppercase mt-1 leading-none">
                      Step 1 of 2 · Fill information
                    </p>
                  </div>
                </div>

                {/* Form body — PaymentForm component renders inside */}
                <div className="px-2 sm:px-4 py-4 [&_form]:!bg-transparent [&_form]:!border-none [&_form]:!shadow-none [&_form]:!backdrop-blur-none">
                  <PaymentForm onStateChange={setSummaryState} />
                </div>
              </div>
            </motion.div>

            {/* Support card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="rounded-3xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-xl p-6 sm:p-7"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gold-accent/12 border border-gold-accent/25 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-gold-accent" strokeWidth={2.4} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white tracking-tight">
                    Need help with your payment?
                  </h3>
                  <p className="text-[10px] text-white/50 font-sans mt-0.5">
                    Treasury team responds within 6 hours on weekdays
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {supportItems.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="group flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-orange-burnt/30 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-burnt/12 border border-orange-burnt/25 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-orange-burnt" strokeWidth={2.4} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                        {label}
                      </p>
                      <p className="text-xs font-sans font-bold text-white group-hover:text-orange-burnt truncate transition-colors mt-0.5">
                        {value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>

            {/* FAQ accordion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="rounded-3xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-xl p-6 sm:p-7"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl bg-orange-burnt/12 border border-orange-burnt/25 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />
                </div>
                <h3 className="font-display font-extrabold text-sm text-white tracking-tight">
                  Frequently asked
                </h3>
              </div>

              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-orange-burnt/25 transition-colors overflow-hidden"
                  >
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3 p-4">
                      <span className="text-xs sm:text-sm font-display font-bold text-white leading-tight">
                        {faq.q}
                      </span>
                      <span className="text-orange-burnt text-xs font-bold shrink-0 group-open:rotate-45 transition-transform duration-300">
                        +
                      </span>
                    </summary>
                    <div className="px-4 pb-4 -mt-1 text-xs text-white/60 font-sans leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — STICKY SUMMARY (4/12) ──────────────────── */}
          <div className="lg:col-span-4">
            <SummaryCard
              studentName={summaryState.studentName}
              studentYear={summaryState.studentYear}
              purpose={summaryState.purpose}
              amount={summaryState.amount}
              loading={summaryState.isSubmitting}
              onPayClick={() => {
                // The PaymentForm has its OWN submit button (we keep its logic intact).
                // Just smooth-scroll to it on mobile, focus it on desktop.
                const formEl = document.querySelector('form[data-testid="payment-form-actual"]') as HTMLFormElement | null;
                if (formEl) {
                  formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Trigger submit if all fields filled
                  if (summaryState.studentName && summaryState.studentEmail) {
                    formEl.requestSubmit();
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pay;
