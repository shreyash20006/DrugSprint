import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, GraduationCap, MessageCircle, Phone, ClipboardList, X } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section } from './Section';

export const HomeAdmissions: React.FC = () => {
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  const courses = [
    {
      title: 'B.Pharm',
      subtitle: 'Bachelor of Pharmacy',
      duration: '4 Years',
      eligibility: '12th Sci. (PCM/PCB)',
    },
    {
      title: 'D.Pharm',
      subtitle: 'Diploma in Pharmacy',
      duration: '2 Years',
      eligibility: '12th Sci. (PCM/PCB)',
    },
  ];

  return (
    <Section className="!py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card variant="glow" padding="xl">
          <div className="noise-overlay noise-soft" />
          <div className="absolute -top-20 -left-20 w-72 h-72 ambient-orb-orange rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-72 h-72 ambient-orb-gold rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
            <div className="lg:col-span-8 space-y-6">
              <CardBadge tone="orange" className="!text-[10px] animate-pulse">
                <Sparkles className="w-3 h-3" strokeWidth={2.4} />
                <span>Admissions Open 2026 — 2027</span>
              </CardBadge>

              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-[1.1]">
                Secure your seat at Nagpur's leading{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">
                  pharmacy education destination.
                </span>
              </h2>

              <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
                Premium degree & diploma programs with cutting-edge labs, experienced faculty, and dedicated
                career placement cells. Join the next batch of healthcare pioneers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {courses.map((c) => (
                  <div
                    key={c.title}
                    className="group bg-white/[0.03] border border-white/8 rounded-2xl p-4 hover:border-orange-burnt/35 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-orange-burnt/15 flex items-center justify-center border border-orange-burnt/25">
                        <GraduationCap className="w-4.5 h-4.5 text-orange-burnt" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="font-display font-extrabold text-sm text-white leading-none">{c.title}</p>
                        <p className="text-[10px] text-orange-burnt font-bold tracking-wider uppercase mt-1">
                          {c.subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/55 text-[11px] font-semibold mt-2">
                      {c.duration} <span className="text-white/25">·</span> {c.eligibility}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <Card variant="flat" padding="lg" className="text-center space-y-4">
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.25em]">Enquire Instantly</p>
                <div className="font-display font-extrabold text-lg text-white">Admissions Cell</div>
                <p className="text-white/55 text-xs font-sans">
                  Fees, scholarships & seat availability — get details now.
                </p>

                <button
                  onClick={() => setShowEnquiryModal(true)}
                  data-testid="enquiry-modal-trigger"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold text-[11px] uppercase tracking-[0.18em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg border border-white/5"
                >
                  <ClipboardList className="w-4 h-4" strokeWidth={2.4} />
                  Submit Enquiry Form
                </button>

                <a
                  href="https://wa.me/918806937481?text=Hello%20Teju%20Mam%2C%20I%20am%20enquiring%20about%20admissions%20at%20TGPCOP%20for%20the%20academic%20year%202026-27."
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="whatsapp-enquiry-link"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-display font-bold text-[11px] uppercase tracking-[0.18em] rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg border border-emerald-400/20"
                >
                  <MessageCircle className="w-4 h-4" strokeWidth={2.4} />
                  WhatsApp Enquiry
                </a>

                <a
                  href="tel:+918806937481"
                  className="inline-flex items-center justify-center gap-2 text-white/60 hover:text-orange-burnt text-xs font-sans font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" strokeWidth={2.4} />
                  Teju Mam: +91 88069 37481
                </a>
              </Card>
            </div>
          </div>
        </Card>
      </motion.div>

      {showEnquiryModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowEnquiryModal(false)}
        >
          <div
            className="relative bg-[#0A1428] border border-white/10 rounded-3xl w-full max-w-2xl h-[85vh] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                    Admission Enquiry
                  </h3>
                  <span className="text-[10px] text-orange-burnt block font-sans font-bold uppercase tracking-[0.2em] mt-0.5">
                    Academic Year 2026—27
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEnquiryModal(false)}
                className="p-1.5 rounded-full hover:bg-white/5 text-white/55 hover:text-white transition-all"
                data-testid="enquiry-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full bg-[#050B18] overflow-y-auto relative p-1">
              <iframe
                src="https://docs.google.com/forms/d/e/1FAIpQLSeNhMWUUOF3rbmb4zU8owayxBplovO8X9JqoBYbrQwMyVxI5g/viewform?embedded=true"
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '600px' }}
                title="TGPCOP Admission Enquiry Form"
              >
                Loading…
              </iframe>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

export default HomeAdmissions;
