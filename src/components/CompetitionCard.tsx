import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Users, Hourglass, ArrowRight, MessageSquare } from 'lucide-react';
import type { Competition } from '../data/events';
import { getEventCapacity, isEventPast } from '../lib/eventCapacity';

interface CompetitionCardProps {
  competition?: Competition;
  event?: any;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition, event }) => {
  const title = event?.name ?? competition?.title ?? 'Event';
  const description = event?.description ?? competition?.description ?? '';
  const deadline = event?.deadline ?? competition?.deadline ?? '';
  const prizeInfo = event?.prize_info ?? competition?.prizeInfo ?? '';
  const participationInfo = competition?.participationInfo ?? 'Open to all TGPCOP students';
  const googleFormUrl = event?.google_form_link ?? competition?.googleFormUrl ?? '';
  const eventId = event?.id;
  const capacityInfo = event ? getEventCapacity(event) : null;
  const past = isEventPast(deadline);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    if (!deadline) return;
    const calculateTimeLeft = () => {
      const difference = +new Date(`${deadline}T23:59:59`) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isExpired: false,
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 100, damping: 15 },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08)' }}
      className="bg-white rounded-xl shadow-md border border-navy-dark/5 overflow-hidden flex flex-col justify-between"
    >
      <div className="bg-gradient-to-r from-orange-burnt to-gold-accent h-2 w-full" />
      <div className="p-6 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt shrink-0">
              <Trophy className="w-5 h-5 fill-current" />
            </div>
            {capacityInfo && capacityInfo.capacity > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  capacityInfo.isFull ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {capacityInfo.isFull ? '🔴 Full' : `🟢 ${capacityInfo.seatsLeft} seats left`}
              </span>
            )}
            {!capacityInfo?.capacity && (
              <span className="bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/25 text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider flex items-center">
                {!timeLeft.isExpired && <Hourglass className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: '4s' }} />}
                {timeLeft.isExpired ? 'Ended' : 'Active'}
              </span>
            )}
          </div>
          <h3 className="font-display font-bold text-xl text-navy-dark mb-3 leading-snug">{title}</h3>
          <p className="text-navy-dark/80 text-sm leading-relaxed mb-6 font-sans">{description}</p>
          {(prizeInfo || participationInfo) && (
            <div className="space-y-3 mb-6 bg-navy-dark/5 p-4 rounded-lg">
              {prizeInfo && (
                <div className="flex items-start space-x-2 text-xs">
                  <Trophy className="w-4 h-4 text-orange-burnt shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-navy-dark block">Rewards:</span>
                    <span className="text-navy-dark/80">{prizeInfo}</span>
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-2 text-xs">
                <Users className="w-4 h-4 text-orange-burnt shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-navy-dark block">Eligibility:</span>
                  <span className="text-navy-dark/80">{participationInfo}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          {!timeLeft.isExpired && deadline && (
            <div className="grid grid-cols-4 gap-2 mb-6 text-center">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hrs', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.minutes },
                { label: 'Sec', value: timeLeft.seconds },
              ].map((cell, idx) => (
                <div key={idx} className="bg-navy-dark text-white rounded p-2">
                  <span className="block font-display font-bold text-base leading-none mb-1">
                    {String(cell.value).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] uppercase tracking-wider opacity-75">{cell.label}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {eventId && !timeLeft.isExpired && !capacityInfo?.isFull ? (
              <Link
                to={`/register/${eventId}`}
                className="group flex items-center justify-center space-x-2 w-full py-3 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display font-bold rounded-lg text-sm shadow-md"
              >
                <span>Register Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : timeLeft.isExpired && eventId && past ? (
              <Link
                to={`/feedback/${eventId}`}
                className="flex items-center justify-center space-x-2 w-full py-3 border border-orange-burnt text-orange-burnt font-display font-bold rounded-lg text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Feedback</span>
              </Link>
            ) : timeLeft.isExpired ? (
              <button disabled className="w-full py-3 bg-navy-dark/10 text-navy-dark/40 font-display font-semibold rounded-lg text-sm cursor-not-allowed">
                Registrations Closed
              </button>
            ) : googleFormUrl ? (
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center space-x-2 w-full py-3 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display font-bold rounded-lg text-sm shadow-md"
              >
                <span>PARTICIPATE NOW</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CompetitionCard;
