import React from 'react';
import { Loader2, ArrowUpRight, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode | LucideIcon;
  trendColor?: 'orange' | 'green' | 'amber' | 'red' | 'navy' | 'purple';
  loading?: boolean;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  testId?: string;
  accentClass?: string;
}

const TONE_STYLES: Record<
  NonNullable<StatsCardProps['trendColor']>,
  {
    iconBg: string;
    iconColor: string;
    accentBg: string;
    deltaColor: string;
    borderAccent: string;
  }
> = {
  orange: {
    iconBg: 'bg-gradient-to-br from-orange-burnt to-[#E06D2B]',
    iconColor: 'text-white',
    accentBg: 'from-orange-burnt/12 via-transparent to-transparent',
    deltaColor: 'text-orange-burnt',
    borderAccent: 'stat-card-orange',
  },
  purple: {
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600',
    iconColor: 'text-white',
    accentBg: 'from-violet-500/12 via-transparent to-transparent',
    deltaColor: 'text-violet-400',
    borderAccent: 'stat-card-purple',
  },
  green: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconColor: 'text-white',
    accentBg: 'from-emerald-500/12 via-transparent to-transparent',
    deltaColor: 'text-emerald-400',
    borderAccent: 'stat-card-green',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-gold-accent to-orange-burnt',
    iconColor: 'text-white',
    accentBg: 'from-gold-accent/12 via-transparent to-transparent',
    deltaColor: 'text-gold-accent',
    borderAccent: 'stat-card-yellow',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    iconColor: 'text-white',
    accentBg: 'from-red-500/12 via-transparent to-transparent',
    deltaColor: 'text-red-400',
    borderAccent: 'stat-card-red',
  },
  navy: {
    iconBg: 'bg-white/[0.06] border border-white/10',
    iconColor: 'text-orange-burnt',
    accentBg: 'from-orange-burnt/8 via-transparent to-transparent',
    deltaColor: 'text-white/65',
    borderAccent: 'stat-card-orange',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trendColor = 'navy',
  loading = false,
  hint,
  delta,
  testId,
}) => {
  const tone = TONE_STYLES[trendColor];

  return (
    <div
      data-testid={testId}
      className={`stat-card ${tone.borderAccent} group relative overflow-hidden`}
    >
      {/* Decorative gradient wash */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tone.accentBg} opacity-70 pointer-events-none transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* Top row: icon + arrow */}
      <div className="relative z-10 flex items-start justify-between mb-5">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone.iconBg} ${tone.iconColor} shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
        >
          {icon as React.ReactNode}
        </div>
        <ArrowUpRight
          className="w-3.5 h-3.5 opacity-30 group-hover:opacity-80 group-hover:text-orange-burnt group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
          style={{ color: 'var(--text-muted)' }}
          strokeWidth={2.4}
        />
      </div>

      {/* Stats text */}
      <div className="relative z-10 space-y-1.5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>

        {loading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="w-5 h-5 animate-spin text-orange-burnt" />
            <div className="skeleton h-8 w-20 rounded" />
          </div>
        ) : (
          <p
            className="font-display font-extrabold text-3xl leading-none tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {value}
          </p>
        )}

        {hint && !loading && (
          <p className="text-[10px] font-medium pt-1" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </p>
        )}

        {delta && !loading && (
          <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider pt-1 ${delta.positive === false ? 'text-red-400' : tone.deltaColor}`}>
            {delta.positive === false ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            <span>{delta.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
