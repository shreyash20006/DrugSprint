import React from 'react';
import { Loader2 } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trendColor: 'orange' | 'green' | 'amber' | 'red' | 'navy';
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trendColor,
  loading = false,
}) => {
  const getColorStyles = (color: typeof trendColor) => {
    switch (color) {
      case 'orange':
        return {
          bg: 'bg-orange-burnt/10 border-orange-burnt/25',
          text: 'text-orange-burnt',
        };
      case 'green':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/25',
          text: 'text-emerald-400',
        };
      case 'amber':
        return {
          bg: 'bg-amber-500/10 border-amber-500/25',
          text: 'text-amber-400',
        };
      case 'red':
        return {
          bg: 'bg-red-500/10 border-red-500/25',
          text: 'text-red-400',
        };
      case 'navy':
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/25',
          text: 'text-blue-400',
        };
    }
  };

  const styles = getColorStyles(trendColor);

  return (
    <div className={`p-6 rounded-2xl shadow-xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-500 relative overflow-hidden group flex items-center justify-between border border-white/10 bg-[#0A1428]/60 backdrop-blur-md hover:-translate-y-1`}>
      {/* Dynamic Glow Corner Blob */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${styles.bg.split(' ')[0]} rounded-full blur-[30px] opacity-30 pointer-events-none group-hover:scale-150 transition-transform duration-700`} />
      
      <div className="space-y-2 z-10">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 block">
          {label}
        </span>
        {loading ? (
          <Loader2 className="w-5 h-5 text-orange-burnt animate-spin" />
        ) : (
          <span className="font-display font-extrabold text-3xl block leading-none text-white">
            {value}
          </span>
        )}
      </div>

      <div className={`w-11 h-11 rounded-xl ${styles.bg} ${styles.text} flex items-center justify-center border border-white/5 shrink-0 group-hover:scale-108 transition-all z-10 shadow-md shadow-black/20`}>
        {icon}
      </div>
    </div>
  );
};

export default StatsCard;
