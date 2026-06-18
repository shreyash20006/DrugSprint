import React from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Bell, Calendar, FileText, Trophy, ShieldCheck, Rocket } from 'lucide-react';
import { Card } from '../ui/Card';

const features = [
  { label: 'Notices', icon: Bell },
  { label: 'Events', icon: Calendar },
  { label: 'Exams', icon: FileText },
  { label: 'Achievements', icon: Trophy },
  { label: 'PRN Verify', icon: ShieldCheck },
];

export const HomeAppPromo: React.FC = () => {
  return (
    <section className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card variant="glow" padding="lg" className="!rounded-3xl">
          <div className="noise-overlay noise-soft" />
          <div className="absolute -right-20 -bottom-20 w-72 h-72 ambient-orb-orange rounded-full pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-72 h-72 ambient-orb-gold rounded-full pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10 text-center lg:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 max-w-3xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] bg-gradient-to-br from-orange-burnt via-[#E06D2B] to-gold-accent p-0.5 flex-shrink-0 shadow-lg shadow-orange-burnt/25 self-center md:self-start overflow-hidden">
                <div className="w-full h-full bg-[#050B1F] rounded-[18px] flex items-center justify-center overflow-hidden">
                  <img
                    src="https://res.cloudinary.com/dsqxboxoc/image/upload/q_auto/f_auto/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg"
                    alt="TGPCOP Student Council Logo"
                    className="w-full h-full object-cover rounded-[18px]"
                  />
                </div>
              </div>

              <div className="space-y-3 flex flex-col items-center md:items-start text-center md:text-left">
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-orange-burnt" strokeWidth={2.2} />
                  Download the TGPCOP Council App
                </h3>

                <p className="text-[11px] sm:text-xs font-sans font-bold text-white/55 uppercase tracking-[0.25em] leading-none">
                  Your Campus. Your Council.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent font-extrabold">
                    Your App.
                  </span>
                </p>

                <p className="text-white/72 text-xs sm:text-sm leading-relaxed font-sans font-medium max-w-xl">
                  Instant access to notices, events, exam schedules, achievements, resources & PRN verification —
                  all in one place.
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-2 pt-1">
                  {features.map((f) => {
                    const Icon = f.icon;
                    return (
                      <span
                        key={f.label}
                        className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold text-white/65 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/8"
                      >
                        <Icon className="w-3 h-3 text-orange-burnt" strokeWidth={2.4} />
                        {f.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 w-full lg:w-auto shrink-0 justify-center">
              <a
                href="https://drive.google.com/file/d/18ujun_VrhU3aeZ9441fGEkfxKG7tWkPT/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="download-app-btn"
                className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-orange-burnt/30 hover:scale-[1.03] active:scale-[0.98] transition-all border border-white/5 cursor-pointer text-center w-full lg:w-48"
              >
                <Download className="w-4 h-4" strokeWidth={2.4} />
                <span>Download App</span>
              </a>

              <a
                href="https://drive.google.com/file/d/18ujun_VrhU3aeZ9441fGEkfxKG7tWkPT/view?usp=sharing"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 text-white font-display text-xs font-bold uppercase tracking-[0.2em] rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer text-center w-full lg:w-48"
              >
                <Rocket className="w-4 h-4 text-gold-accent" strokeWidth={2.4} />
                <span>Join Beta</span>
              </a>
            </div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
};

export default HomeAppPromo;
