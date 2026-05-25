import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Users, Hourglass, ArrowRight, Heart } from 'lucide-react';

interface CompetitionCardProps {
  competition: any;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const seatsLeft = (competition.capacity || 100) - (competition.registered_count || 0);
  const isFull = seatsLeft <= 0;

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    setIsSaved(stored.includes(competition.id));
  }, [competition.id]);

  const toggleBookmark = () => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    let updated;
    if (isSaved) {
      updated = stored.filter(id => id !== competition.id);
    } else {
      updated = [...stored, competition.id];
    }
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));
    setIsSaved(!isSaved);
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(`${competition.deadline || competition.date}T23:59:59`) - +new Date();
      let newTimeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isExpired: false,
        };
      }

      setTimeLeft(newTimeLeft);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [competition.deadline, competition.date]);

  // Card Variants
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
      whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.25)' }}
      className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl overflow-hidden flex flex-col justify-between shadow-[0_8px_32px_rgba(5,11,24,0.4)]"
    >
      {/* Upper Color Strip */}
      <div className="bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt h-1.5 w-full shadow-[0_0_8px_rgba(214,90,30,0.3)]" />

      <div className="p-6 flex flex-col h-full justify-between">
        <div>
          {/* Header Trophy Badging */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt shrink-0">
              <Trophy className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div className="flex flex-col items-end space-y-1">
              {timeLeft.isExpired ? (
                <span className="bg-red-500/10 text-red-400 border border-red-500/25 text-[10px] sm:text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  Ended
                </span>
              ) : (
                <span className="bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/35 text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center">
                  <Hourglass className="w-3.5 h-3.5 mr-1 animate-spin" style={{ animationDuration: '4s' }} />
                  Active
                </span>
              )}
              <span className={`text-[10px] font-bold ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                {isFull ? '🔴 House Full' : `🟢 ${seatsLeft} seats left`}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-xl text-white mb-3 leading-snug">
            {competition.name}
          </h3>

          {/* Description */}
          <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans">
            {competition.description}
          </p>

          {/* Prize Info & Eligibility Grid */}
          <div className="space-y-3 mb-6 bg-[#0F1E42]/40 border border-orange-burnt/15 p-4 rounded-xl shadow-inner">
            <div className="flex items-start space-x-2.5 text-xs">
              <Trophy className="w-4 h-4 text-orange-burnt shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Rewards:</span>
                <span className="text-white/70">{competition.prizeInfo || 'Exciting Prizes & Certificates'}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2.5 text-xs">
              <Users className="w-4 h-4 text-orange-burnt shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Eligibility:</span>
                <span className="text-white/70">{competition.participationInfo || 'All B.Pharm & D.Pharm Students'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Countdown Timer Drawer */}
        <div>
          {!timeLeft.isExpired && (
            <div className="grid grid-cols-4 gap-2 mb-6 text-center">
              {[
                { label: 'Days', value: timeLeft.days },
                { label: 'Hrs', value: timeLeft.hours },
                { label: 'Min', value: timeLeft.minutes },
                { label: 'Sec', value: timeLeft.seconds },
              ].map((cell, idx) => (
                <div key={idx} className="bg-[#0F1E42]/80 border border-orange-burnt/20 text-white rounded-lg p-2 shadow-sm">
                  <span className="block font-display font-bold text-base sm:text-lg leading-none mb-1 text-gold-accent">
                    {String(cell.value).padStart(2, '0')}
                  </span>
                  <span className="block text-[8px] uppercase tracking-wider text-white/50">
                    {cell.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Participate CTA Button & Bookmark */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleBookmark}
              title={isSaved ? "Remove Bookmark" : "Save Competition"}
              className={`p-3 rounded-xl border transition-all ${
                isSaved 
                  ? 'bg-orange-burnt/10 border-orange-burnt/30 text-orange-burnt shadow-inner shadow-orange-burnt/20' 
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>

            {timeLeft.isExpired || isFull ? (
              <button
                disabled
                className="flex-1 py-3 bg-white/5 text-white/30 font-display font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed uppercase border border-white/5"
              >
                {isFull && !timeLeft.isExpired ? 'Registrations Full' : 'Registrations Closed'}
              </button>
            ) : (
              <Link
                to={`/register/${competition.id}`}
                className="group flex-1 flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-orange-burnt/25 hover:-translate-y-[1px] transition-all duration-300 border border-white/5 active:scale-98"
              >
                <span>REGISTER NOW</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(CompetitionCard);
