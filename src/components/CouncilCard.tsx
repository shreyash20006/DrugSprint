import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, User } from 'lucide-react';
import type { CouncilMember } from '../data/council';

interface CouncilCardProps {
  member: CouncilMember;
}

export const CouncilCard: React.FC<CouncilCardProps> = React.memo(({ member }) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, scale: 1.02 }}
      className="glass-panel glow-card rounded-2xl p-6 flex flex-col justify-between border border-orange-burnt/25 border-l-4 border-l-orange-burnt backdrop-blur-[16px] transition-all duration-300 relative bg-[#0D1B3E]/85 shadow-[0_8px_32px_rgba(5,11,24,0.5)]"
    >
      <div className="flex items-start justify-between mb-4">
        {/* Circular Rotating Avatar Ring */}
        <div className="relative w-16 h-16 rounded-full shrink-0 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-burnt to-gold-accent animate-spin opacity-85" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-[3px] rounded-full bg-[#0D1B3E]" />
          <div className="relative w-[52px] h-[52px] rounded-full bg-[#0F1E42]/80 flex items-center justify-center text-orange-burnt font-display font-bold text-base overflow-hidden">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                alt={member.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : member.avatarSeed ? (
              <span className="text-white/90">{member.avatarSeed}</span>
            ) : (
              <User className="w-5 h-5 text-white/40" />
            )}
          </div>
        </div>

        {/* Year Tag */}
        <span className="bg-orange-burnt/15 border border-orange-burnt/35 text-orange-burnt text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {member.year}
        </span>
      </div>

      {/* Roster Information */}
      <div className="mb-4">
        <p className="text-orange-burnt font-display font-extrabold text-[10px] uppercase tracking-widest mb-1.5">
          {member.role}
        </p>
        <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-tight">
          {member.name}
        </h3>
      </div>

      {/* Contact Details */}
      {(member.email || member.phone) && (
        <div className="mt-2 mb-6 space-y-1.5 text-xs text-white/60 font-sans border-t border-orange-burnt/10 pt-3.5">
          {member.email && (
            <div className="flex items-center space-x-2">
              <span>📧</span>
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center space-x-2">
              <span>📞</span>
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* CTA Button */}
      <Link
        to={`/ask?to=${encodeURIComponent(member.name)}`}
        className="mt-auto group flex items-center justify-center space-x-2 w-full py-2.5 bg-white/5 hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all duration-300 border border-white/5 hover:border-transparent active:scale-98"
      >
        <HelpCircle className="w-4 h-4 text-orange-burnt group-hover:text-white transition-colors animate-pulse" />
        <span>Ask a Question</span>
      </Link>
    </motion.div>
  );
});

export default CouncilCard;
