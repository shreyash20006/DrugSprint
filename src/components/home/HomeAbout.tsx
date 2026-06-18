import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Users, Megaphone, Calendar, Award, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Section } from './Section';
import { AnimatedCounter } from './AnimatedCounter';

interface HomeAboutProps {
  counts: { notices: number; events: number; students: number; members: number };
}

const itemFade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export const HomeAbout: React.FC<HomeAboutProps> = ({ counts }) => {
  const stats = [
    {
      value: counts.students,
      label: 'Verified Students',
      icon: Users,
      suffix: '+',
      span: 'col-span-2 sm:col-span-2',
      tone: 'primary' as const,
    },
    {
      value: counts.notices,
      label: 'Notices Published',
      icon: Megaphone,
      suffix: '',
      span: 'col-span-1',
      tone: 'default' as const,
    },
    {
      value: counts.events,
      label: 'Events Conducted',
      icon: Calendar,
      suffix: '',
      span: 'col-span-1',
      tone: 'default' as const,
    },
    {
      value: counts.members,
      label: 'Active Members',
      icon: Award,
      suffix: '',
      span: 'col-span-2 sm:col-span-2',
      tone: 'gold' as const,
    },
  ];

  return (
    <Section id="about">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        {/* LEFT — narrative */}
        <motion.div variants={itemFade} className="lg:col-span-5 space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center space-x-2 text-orange-burnt text-[11px] font-extrabold uppercase tracking-[0.22em]">
            <span className="w-6 h-[1.5px] bg-orange-burnt" />
            <span>Who We Are</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-[1.05]">
            Leading the next wave of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt to-gold-accent">
              pharmacy pioneers
            </span>{' '}
            at Nagpur.
          </h2>
          <p className="text-white/70 text-sm sm:text-base leading-relaxed font-sans">
            The Student Council of TGPCOP is the official voice of 500+ aspiring pharmacists. We balance
            intensive research with vibrant campus culture — from rural healthcare drives and AURA symposiums to
            anti-ragging networks and NotesDrive resources.
          </p>

          <Link
            to="/council"
            className="group inline-flex items-center gap-2 text-orange-burnt font-display font-extrabold text-sm hover:text-gold-accent transition-colors"
            data-testid="meet-leaders-link"
          >
            <span>Meet the Student Leaders</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Anti-Ragging', 'Healthcare Drives', 'NotesDrive', 'AURA Symposium', 'Cultural Fests'].map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/[0.04] border border-white/10 text-white/70"
              >
                <Sparkles className="w-3 h-3 text-gold-accent" strokeWidth={2.4} />
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — bento stats grid */}
        <motion.div variants={itemFade} className="lg:col-span-7">
          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              const isPrimary = stat.tone === 'primary';
              const isGold = stat.tone === 'gold';

              return (
                <Card
                  key={idx}
                  variant={isPrimary ? 'highlight' : isGold ? 'glow' : 'default'}
                  padding="lg"
                  hover
                  className={`${stat.span} group`}
                  testId={`stat-card-${idx}`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isPrimary
                          ? 'bg-gradient-to-br from-orange-burnt to-[#E06D2B] shadow-lg shadow-orange-burnt/25'
                          : isGold
                          ? 'bg-gradient-to-br from-gold-accent to-orange-burnt shadow-lg shadow-gold-accent/20'
                          : 'bg-white/[0.06] border border-white/10'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isPrimary || isGold ? 'text-white' : 'text-orange-burnt'}`}
                        strokeWidth={2.2}
                      />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/25 group-hover:text-orange-burnt group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3 className="font-display font-extrabold text-4xl sm:text-5xl text-white leading-none mb-2 tracking-tight">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </h3>
                  <p className="font-display font-bold text-[11px] text-orange-burnt uppercase tracking-[0.18em]">
                    {stat.label}
                  </p>
                </Card>
              );
            })}

            {/* Bento accent block */}
            <Card variant="subtle" padding="lg" className="col-span-2 group">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold-accent">
                    Together Towards Excellence
                  </p>
                  <p className="font-display font-bold text-white text-base sm:text-lg">
                    Your Voice. Our Future.
                  </p>
                </div>
                <Link
                  to="/contact"
                  data-testid="get-in-touch-cta"
                  className="inline-flex items-center gap-2 text-xs font-display font-bold uppercase tracking-[0.2em] text-orange-burnt hover:text-gold-accent transition-colors"
                >
                  Get in touch
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </Section>
  );
};

export default HomeAbout;
