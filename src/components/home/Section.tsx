import React from 'react';
import { motion } from 'framer-motion';

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  noPadding?: boolean;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, staggerChildren: 0.08 },
  },
};

export const Section: React.FC<SectionProps> = ({ children, id, className = '', noPadding }) => (
  <motion.section
    id={id}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
    variants={sectionVariants}
    className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${noPadding ? '' : 'py-20 sm:py-24'} ${className}`}
  >
    {children}
  </motion.section>
);

interface SectionHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: 'left' | 'center' | 'between';
  cta?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  cta,
}) => {
  if (align === 'center') {
    return (
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        {eyebrow && (
          <span className="inline-block bg-orange-burnt/10 border border-orange-burnt/35 text-orange-burnt text-[10px] font-extrabold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-[1.05]">
          {title}
        </h2>
        {description && (
          <p className="text-white/60 text-sm sm:text-base font-sans leading-relaxed">{description}</p>
        )}
      </div>
    );
  }

  if (align === 'between') {
    return (
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-3 max-w-2xl">
          {eyebrow && (
            <div className="flex items-center space-x-2 text-orange-burnt text-[11px] font-extrabold uppercase tracking-[0.22em]">
              <span className="w-6 h-[1.5px] bg-orange-burnt" />
              <span>{eyebrow}</span>
            </div>
          )}
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-white/60 text-xs sm:text-sm font-sans leading-relaxed">{description}</p>
          )}
        </div>
        {cta && <div className="shrink-0">{cta}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mb-12">
      {eyebrow && (
        <div className="flex items-center space-x-2 text-orange-burnt text-[11px] font-extrabold uppercase tracking-[0.22em]">
          <span className="w-6 h-[1.5px] bg-orange-burnt" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-[1.05]">
        {title}
      </h2>
      {description && (
        <p className="text-white/65 text-sm sm:text-base font-sans leading-relaxed">{description}</p>
      )}
    </div>
  );
};

export default Section;
