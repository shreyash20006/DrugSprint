import React from 'react';
import { motion, type Variants } from 'framer-motion';

type CardVariant = 'default' | 'glow' | 'flat' | 'subtle' | 'highlight';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  animate?: boolean;
  hover?: boolean;
  onClick?: () => void;
  as?: 'div' | 'article' | 'section';
  testId?: string;
  style?: React.CSSProperties;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:
    'bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] shadow-[0_8px_32px_rgba(5,11,24,0.4)]',
  glow:
    'bg-gradient-to-br from-[#0D1B3E]/95 to-[#0A1428]/95 border border-orange-burnt/35 backdrop-blur-[20px] shadow-[0_8px_40px_rgba(214,90,30,0.12)]',
  flat:
    'bg-white/[0.03] border border-white/8 backdrop-blur-md',
  subtle:
    'bg-white/[0.02] border border-white/6',
  highlight:
    'bg-gradient-to-br from-orange-burnt/15 via-[#0D1B3E]/85 to-[#0A1428]/95 border border-orange-burnt/45 backdrop-blur-[20px] shadow-[0_8px_40px_rgba(214,90,30,0.18)]',
};

const PADDING_STYLES: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10 sm:p-12',
};

const cardFadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 18 },
  },
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  animate = false,
  hover = false,
  onClick,
  as = 'div',
  testId,
  style,
}) => {
  const baseClass = `relative rounded-2xl overflow-hidden transition-all duration-300 ${VARIANT_STYLES[variant]} ${PADDING_STYLES[padding]} ${
    hover ? 'hover:border-orange-burnt/55 hover:-translate-y-1 hover:shadow-[0_20px_45px_-15px_rgba(214,90,30,0.25)]' : ''
  } ${onClick ? 'cursor-pointer' : ''} ${className}`;

  if (animate) {
    const MotionTag = motion[as] as any;
    return (
      <MotionTag
        variants={cardFadeUp}
        onClick={onClick}
        className={baseClass}
        data-testid={testId}
        style={style}
      >
        {children}
      </MotionTag>
    );
  }

  const Tag: any = as;
  return (
    <Tag onClick={onClick} className={baseClass} data-testid={testId} style={style}>
      {children}
    </Tag>
  );
};

export const CardSectionLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex items-center space-x-2 text-orange-burnt text-[11px] font-extrabold uppercase tracking-[0.2em] ${className}`}
  >
    <span className="w-6 h-[1.5px] bg-orange-burnt" />
    <span>{children}</span>
  </div>
);

export const CardBadge: React.FC<{
  children: React.ReactNode;
  tone?: 'orange' | 'gold' | 'emerald' | 'red' | 'neutral';
  className?: string;
}> = ({ children, tone = 'orange', className = '' }) => {
  const toneClass: Record<string, string> = {
    orange: 'bg-orange-burnt/10 text-orange-burnt border-orange-burnt/30',
    gold: 'bg-gold-accent/10 text-gold-accent border-gold-accent/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/10 text-red-400 border-red-500/30',
    neutral: 'bg-white/5 text-white/65 border-white/10',
  };
  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-[0.18em] border ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Card;
