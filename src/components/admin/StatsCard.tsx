import React from 'react';
import { Loader2, ArrowUpRight, type LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode | LucideIcon;
  trendColor?: 'orange' | 'green' | 'amber' | 'red' | 'navy';
  loading?: boolean;
  hint?: string;
  delta?: { value: string; positive?: boolean };
  testId?: string;
}

const TONE_STYLES: Record<NonNullable<StatsCardProps['trendColor']>, { iconBg: string; iconColor: string; accentBg: string; deltaColor: string }> = {
  orange: {
    iconBg: 'bg-gradient-to-br from-orange-burnt to-[#E06D2B]',
    iconColor: 'text-white',
    accentBg: 'from-orange-burnt/15 via-transparent to-transparent',
    deltaColor: 'text-orange-burnt',
  },
  green: {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconColor: 'text-white',
    accentBg: 'from-emerald-500/12 via-transparent to-transparent',
    deltaColor: 'text-emerald-400',
  },
  amber: {
    iconBg: 'bg-gradient-to-br from-gold-accent to-orange-burnt',
    iconColor: 'text-white',
    accentBg: 'from-gold-accent/12 via-transparent to-transparent',
    deltaColor: 'text-gold-accent',
  },
  red: {
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600',
    iconColor: 'text-white',
    accentBg: 'from-red-500/12 via-transparent to-transparent',
    deltaColor: 'text-red-400',
  },
  navy: {
    iconBg: 'bg-white/[0.06] border border-white/10',
    iconColor: 'text-orange-burnt',
    accentBg: 'from-orange-burnt/8 via-transparent to-transparent',
    deltaColor: 'text-white/65',
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
      className="group relative overflow-hidden rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md p-6 hover:border-orange-burnt/30 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_8px_25px_rgba(5,11,24,0.4)]"
    >
      {/* Decorative gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tone.accentBg} opacity-60 pointer-events-none`} />

      <div className="relative z-10 flex items-start justify-between mb-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone.iconBg} ${tone.iconColor} shadow-md`}
        >
          {icon as React.ReactNode}
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-orange-burnt group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" strokeWidth={2.4} />
      </div>

      <div className="relative z-10 space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 leading-none">{label}</p>
        {loading ? (
          <Loader2 className="w-5 h-5 text-orange-burnt animate-spin mt-1" />
        ) : (
          <p className="font-display font-extrabold text-3xl text-white leading-none tracking-tight">{value}</p>
        )}
        {hint && !loading && (
          <p className="text-[10px] text-white/45 font-sans font-medium pt-1.5">{hint}</p>
        )}
        {delta && !loading && (
          <p className={`text-[10px] font-bold uppercase tracking-wider pt-1.5 ${delta.positive === false ? 'text-red-400' : tone.deltaColor}`}>
            {delta.positive === false ? '↓' : '↑'} {delta.value}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
