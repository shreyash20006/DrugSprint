import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  eyebrow?: string;
  /** Optional CTA shown at the right side on desktop */
  cta?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  breadcrumb,
  eyebrow,
  cta,
}) => {
  return (
    <header className="relative w-full overflow-hidden z-10 border-b border-white/[0.06] pt-24 pb-12 sm:pt-32 sm:pb-16 bg-[#080F22]/40">
      {/* Layered backgrounds */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 ambient-orb-orange rounded-full" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 ambient-orb-gold rounded-full opacity-60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
        <div className="noise-overlay noise-soft" />
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-burnt/60 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          aria-label="breadcrumb"
          className="mb-5 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-[0.22em]"
          data-testid="page-breadcrumb"
        >
          <Link
            to="/"
            className="text-white/45 hover:text-orange-burnt transition-colors"
          >
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-white/25" strokeWidth={2.4} />
          <span className="text-orange-burnt">{breadcrumb || title}</span>
        </motion.nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Title section */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white shrink-0 shadow-xl shadow-orange-burnt/20 mt-1"
            >
              {icon}
            </motion.div>

            <div className="min-w-0 space-y-1.5">
              {eyebrow && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-gold-accent font-display"
                >
                  {eyebrow}
                </motion.p>
              )}
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white leading-[1.05] tracking-tight"
                data-testid="page-title"
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="text-white/60 text-sm sm:text-base font-sans leading-relaxed max-w-2xl pt-1"
                >
                  {subtitle}
                </motion.p>
              )}
            </div>
          </div>

          {/* CTA (if provided) */}
          {cta && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="shrink-0"
            >
              {cta}
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
