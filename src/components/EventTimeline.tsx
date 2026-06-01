import React, { useRef } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Award, BookOpen, Music, Accessibility, ArrowRight, Heart } from 'lucide-react';
import { timelineEvents } from '../data/events';

interface EventTimelineProps {
  events?: any[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use live database events if provided, otherwise fallback to static timelineEvents
  const displayEvents = events || timelineEvents;

  // Measure scroll progress relative to this timeline section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  // Smooth the scroll line drawing
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const getIcon = (type: string) => {
    const cleanType = type?.toLowerCase() || '';
    switch (cleanType) {
      case 'academic':
        return <BookOpen className="w-5 h-5" />;
      case 'cultural':
        return <Music className="w-5 h-5" />;
      case 'sports':
        return <Award className="w-5 h-5" />;
      case 'social':
      default:
        return <Accessibility className="w-5 h-5" />;
    }
  };

  const getBadgeColors = (type: string) => {
    const cleanType = type?.toLowerCase() || '';
    switch (cleanType) {
      case 'academic':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cultural':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'sports':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'social':
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div ref={containerRef} className="relative max-w-5xl mx-auto px-4 py-16">
      
      {/* 1. Static track styled dark-navy with orange outline */}
      <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-4 bottom-4 w-1 bg-white/10 rounded-full" />
 
      {/* 2. Dynamic animated foreground timeline track (draws on scroll) */}
      <motion.div
        className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 top-4 bottom-4 w-1 bg-gradient-to-b from-orange-burnt via-gold-accent to-orange-burnt origin-top rounded-full z-10 shadow-[0_0_8px_rgba(214,90,30,0.5)]"
        style={{ scaleY }}
      />
 
      <div className="space-y-16">
        {displayEvents.map((event, idx) => {
          const isEven = idx % 2 === 0;
          const iconType = event.type || event.category || 'social';
 
          return (
            <div
              key={event.id}
              className="relative flex flex-col md:flex-row items-start md:items-center justify-between"
            >
              {/* Central/Left Dot with Active Bubble */}
              <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center z-20">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ type: 'spring' as const, delay: 0.15 }}
                  className="w-10 h-10 rounded-full bg-[#0D1B3E] border-4 border-orange-burnt flex items-center justify-center text-orange-burnt shadow-lg shadow-orange-burnt/30"
                >
                  {getIcon(iconType)}
                </motion.div>
              </div>
 
              {/* Layout Alignment Columns */}
              {/* Left Column (Content if Even, Spacer if Odd) */}
              <div className={`w-full md:w-[calc(50%-40px)] pl-16 md:pl-0 ${isEven ? 'md:text-right md:order-1' : 'md:order-3'}`}>
                {isEven && (
                  <TimelineCard event={event} isEven={isEven} getBadgeColors={getBadgeColors} />
                )}
              </div>
 
              {/* Invisible Spacing center Column */}
              <div className="hidden md:block w-20 md:order-2" />
 
              {/* Right Column (Content if Odd, Spacer if Even) */}
              <div className={`w-full md:w-[calc(50%-40px)] pl-16 md:pl-0 ${isEven ? 'md:order-3' : 'md:order-1'}`}>
                {!isEven && (
                  <TimelineCard event={event} isEven={isEven} getBadgeColors={getBadgeColors} />
                )}
              </div>
 
            </div>
          );
        })}
      </div>
    </div>
  );
};
 
const renderFormattedDescription = (text: string) => {
  if (!text) return null;

  const lines = text.split(/\n/);

  const renderTextWithBold = (str: string) => {
    const parts = str.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return (
          <strong key={partIdx} className="font-extrabold text-[#FFA500] drop-shadow-[0_0_6px_rgba(255,165,0,0.25)]">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-white/80 text-left">
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1.5" />;

        // 1. Numbered or standard bullet items (e.g. "1. ", "- ", "• ")
        const bulletMatch = trimmed.match(/^(\d+\.|-|•|\*)\s*(.*)/);
        if (bulletMatch) {
          const [, bullet, content] = bulletMatch;
          return (
            <div key={lineIdx} className="flex items-start space-x-2 pl-1 my-1.5">
              <span className="text-orange-burnt font-extrabold shrink-0 select-none text-xs sm:text-sm mt-0.5">{bullet}</span>
              <span className="text-xs sm:text-sm leading-relaxed font-sans">{renderTextWithBold(content)}</span>
            </div>
          );
        }

        // 2. Inline lists written horizontally (e.g. "1.Item A 2.Item B...")
        const inlineListRegex = /(\d+\.[\s\S]*?)(?=\d+\.|$)/g;
        const inlineMatches = trimmed.match(inlineListRegex);
        if (inlineMatches && inlineMatches.length > 1) {
          return (
            <div key={lineIdx} className="space-y-1.5 my-2 pl-1">
              {inlineMatches.map((item, itemIdx) => {
                const itemMatch = item.trim().match(/^(\d+\.)\s*(.*)/);
                if (itemMatch) {
                  const [, num, content] = itemMatch;
                  return (
                    <div key={itemIdx} className="flex items-start space-x-2">
                      <span className="text-orange-burnt font-extrabold shrink-0 select-none text-xs sm:text-sm mt-0.5">{num}</span>
                      <span className="text-xs sm:text-sm leading-relaxed font-sans">{renderTextWithBold(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={itemIdx} className="text-xs sm:text-sm leading-relaxed font-sans pl-3 text-white/70">
                    {renderTextWithBold(item)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 3. Style specific visual labels (e.g. "Theme:", "Venue:")
        const metaFieldMatch = trimmed.match(/^([A-Za-z\s|&]+:)\s*(.*)/);
        if (metaFieldMatch) {
          const [, label, content] = metaFieldMatch;
          const importantLabels = ['venue:', 'theme:', 'date:', 'time:', 'dates:', 'key highlights:', 'important dates:', 'note:', 'registration fees:', 'who can attend:'];
          if (importantLabels.some(l => label.toLowerCase().includes(l))) {
            return (
              <div key={lineIdx} className="text-xs sm:text-sm leading-relaxed font-sans my-2 pl-0.5">
                <strong className="text-orange-burnt font-extrabold block text-xs uppercase tracking-wider mb-1 select-none border-b border-orange-burnt/10 pb-0.5 max-w-xs">{label}</strong>
                <span className="text-white/80 block mt-0.5">{renderTextWithBold(content)}</span>
              </div>
            );
          }
        }

        return (
          <p key={lineIdx} className="text-xs sm:text-sm leading-relaxed font-sans">
            {renderTextWithBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper card subcomponent to avoid code redundancy
const TimelineCard: React.FC<{
  event: any;
  isEven: boolean;
  getBadgeColors: (type: string) => string;
}> = ({ event, isEven, getBadgeColors }) => {
  const iconType = event.type || event.category || 'social';
  const displayDate = event.date || (event.deadline ? new Date(event.deadline).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }) : '');
 
  const seatsLeft = (event.capacity || 100) - (event.registered_count || 0);
  const isFull = seatsLeft <= 0;
  
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    setIsSaved(stored.includes(event.id));
  }, [event.id]);

  const toggleBookmark = () => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    let updated;
    if (isSaved) {
      updated = stored.filter(id => id !== event.id);
    } else {
      updated = [...stored, event.id];
    }
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));
    setIsSaved(!isSaved);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isEven ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ type: 'spring' as const, stiffness: 100, damping: 15 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl p-6 shadow-[0_8px_32px_rgba(5,11,24,0.4)] hover:border-orange-burnt/40 transition-all relative"
    >
      <div className={`flex items-center justify-between mb-3 ${isEven ? 'md:flex-row-reverse' : 'flex-row'}`}>
        {/* Category tag */}
        <span className={`inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getBadgeColors(iconType)}`}>
          {iconType}
        </span>
        <span className={`text-[10px] font-bold ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
          {isFull ? '🔴 House Full' : `🟢 ${seatsLeft} seats left`}
        </span>
      </div>
 
      {/* Date */}
      <div className={`flex items-center space-x-1.5 text-orange-burnt font-bold text-xs mb-2 ${isEven ? 'md:justify-end' : 'justify-start'}`}>
        <Calendar className="w-3.5 h-3.5" />
        <span>{displayDate}</span>
      </div>
 
      {/* Title */}
      <h3 className={`font-display font-bold text-lg sm:text-xl text-white mb-2 leading-snug ${isEven ? 'md:text-right' : 'md:text-left'}`}>
        {event.title || event.name}
      </h3>
 
      {/* Description */}
      <div className="text-white/70 text-sm leading-relaxed font-sans mb-5 text-left whitespace-pre-wrap break-words">
        {renderFormattedDescription(event.description)}
      </div>
 
      {/* Action Button */}
      <div className={`flex items-center gap-2 ${isEven ? 'md:justify-end' : 'justify-start'}`}>
        <button
          onClick={toggleBookmark}
          title={isSaved ? "Remove Bookmark" : "Save Event"}
          className={`p-2 rounded-lg border transition-all ${
            isSaved 
              ? 'bg-orange-burnt/10 border-orange-burnt/30 text-orange-burnt shadow-inner shadow-orange-burnt/20' 
              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {isFull ? (
          <button
            disabled
            className="px-4 py-2 bg-white/5 text-white/30 font-display text-[11px] font-bold uppercase tracking-wider rounded-lg cursor-not-allowed border border-white/5"
          >
            Sold Out
          </button>
        ) : (
          <Link
            to={`/register/${event.id}`}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow-orange-burnt/10 active:scale-98 transition-all border border-white/5"
          >
            <span>Register Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </motion.div>
  );
};

export default EventTimeline;
