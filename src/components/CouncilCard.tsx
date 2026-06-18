import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, User, Mail, Phone, ArrowUpRight } from 'lucide-react';
import type { CouncilMember } from '../data/council';
import { Card, CardBadge } from './ui/Card';

interface CouncilCardProps {
  member: CouncilMember;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 110,
      damping: 16,
    },
  },
};

export const CouncilCard: React.FC<CouncilCardProps> = React.memo(({ member }) => {
  return (
    <motion.div variants={cardVariants} whileHover={{ y: -4 }}>
      <Card variant="default" padding="lg" hover className="flex flex-col h-full group">
        {/* Top row: avatar + year tag */}
        <div className="flex items-start justify-between mb-5">
          {/* Spinning gradient ring avatar */}
          <div className="relative w-16 h-16 rounded-full shrink-0 flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-burnt to-gold-accent animate-spin opacity-90"
              style={{ animationDuration: '5s' }}
            />
            <div className="absolute inset-[2.5px] rounded-full bg-[#0D1B3E]" />
            <div className="relative w-[54px] h-[54px] rounded-full bg-[#0F1E42] flex items-center justify-center text-white font-display font-extrabold text-base overflow-hidden">
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
                <span>{member.avatarSeed}</span>
              ) : (
                <User className="w-5 h-5 text-white/50" strokeWidth={2.2} />
              )}
            </div>
          </div>

          <CardBadge tone="orange">{member.year}</CardBadge>
        </div>

        {/* Identity */}
        <div className="mb-4 space-y-1.5">
          <p className="text-orange-burnt font-display font-extrabold text-[10px] uppercase tracking-[0.22em]">
            {member.role}
          </p>
          <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-tight tracking-tight">
            {member.name}
          </h3>
        </div>

        {/* Contact */}
        {(member.email || member.phone) && (
          <div className="space-y-2 text-xs text-white/60 font-sans border-t border-white/[0.06] pt-3.5 mb-5">
            {member.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-burnt shrink-0" strokeWidth={2.2} />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-burnt shrink-0" strokeWidth={2.2} />
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <Link
          to={`/ask?to=${encodeURIComponent(member.name)}`}
          data-testid={`council-ask-${member.email}`}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 bg-white/[0.04] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-[0.18em] rounded-xl transition-all duration-300 border border-white/[0.06] hover:border-transparent active:scale-[0.98] group/cta"
        >
          <HelpCircle className="w-3.5 h-3.5 text-orange-burnt group-hover/cta:text-white transition-colors" strokeWidth={2.4} />
          <span>Ask a Question</span>
          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/cta:opacity-100 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 transition-all" strokeWidth={2.4} />
        </Link>
      </Card>
    </motion.div>
  );
});

CouncilCard.displayName = 'CouncilCard';

export default CouncilCard;
