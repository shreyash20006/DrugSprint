import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  eyebrow?: string;
  /** Optional tags displayed below the subtitle */
  tags?: string[];
  /** Optional CTA shown at the right side on desktop */
  cta?: React.ReactNode;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  subtitle,
  breadcrumb,
  eyebrow,
  tags,
  cta,
}) => {
  return (
    <header
      className="relative w-full overflow-hidden z-10 border-b pt-24 pb-12 sm:pt-32 sm:pb-16"
      style={{
        background: 'linear-gradient(to bottom, var(--bg-surface), var(--bg-base))',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Layered backgrounds */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Ambient orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full ambient-orb-orange opacity-60" />
        <div className="absolute -bottom-32 right-1/4 w-64 h-64 rounded-full ambient-orb-gold opacity-40" />
        {/* Grid */}
        <div className="absolute inset-0 grid-bg-overlay opacity-20" />
        {/* Noise */}
        <div className="noise-overlay noise-soft" />
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, var(--pw-purple) 30%, var(--pw-yellow) 70%, transparent)',
          opacity: 0.3,
        }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* Breadcrumb */}
        <motion.nav
          variants={itemVariants}
          aria-label="breadcrumb"
          className="mb-5 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-[0.2em]"
          data-testid="page-breadcrumb"
        >
          <Link
            to="/"
            className="flex items-center gap-1 transition-colors hover:text-orange-burnt"
            style={{ color: 'var(--text-muted)' }}
          >
            <Home className="w-3 h-3" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} strokeWidth={2.4} />
          <span className="text-orange-burnt">{breadcrumb || title}</span>
        </motion.nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          {/* Title section */}
          <div className="flex items-start gap-4 sm:gap-5 min-w-0">
            {/* Icon container with glow ring */}
            <motion.div
              variants={itemVariants}
              className="relative mt-1 shrink-0"
            >
              {/* Glow ring */}
              <div
                className="absolute inset-[-4px] rounded-[22px] opacity-40 blur-md pointer-events-none"
                style={{ background: 'linear-gradient(135deg, var(--pw-purple), var(--pw-yellow))' }}
              />
              <div
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl"
                style={{ background: 'linear-gradient(135deg, var(--pw-purple), var(--pw-purple-dark))' }}
              >
                {icon}
              </div>
            </motion.div>

            <div className="min-w-0 space-y-1.5">
              {eyebrow && (
                <motion.p
                  variants={itemVariants}
                  className="section-eyebrow"
                >
                  {eyebrow}
                </motion.p>
              )}

              <motion.h1
                variants={itemVariants}
                className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight"
                style={{ color: 'var(--text-primary)' }}
                data-testid="page-title"
              >
                {title}
              </motion.h1>

              {subtitle && (
                <motion.p
                  variants={itemVariants}
                  className="text-sm sm:text-base leading-relaxed max-w-2xl pt-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {subtitle}
                </motion.p>
              )}

              {/* Optional tags */}
              {tags && tags.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-2 pt-2"
                >
                  {tags.map((tag) => (
                    <span key={tag} className="badge-base badge-info">
                      {tag}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* CTA (if provided) */}
          {cta && (
            <motion.div
              variants={itemVariants}
              className="shrink-0"
            >
              {cta}
            </motion.div>
          )}
        </div>
      </motion.div>
    </header>
  );
};

export default PageHeader;
