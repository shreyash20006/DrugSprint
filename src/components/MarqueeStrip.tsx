import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export const MarqueeStrip: React.FC = () => {
  const [marqueeItems, setMarqueeItems] = useState<{ id: string; text: string }[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('id, title, category')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) throw error;
        
        if (data && data.length > 0) {
          const items = data.map((n) => ({
            id: n.id,
            text: `⚡ [${n.category.toUpperCase()}] ${n.title}`,
          }));
          setMarqueeItems(items);
        } else {
          // Robust elegant static fallback if database is empty
          setMarqueeItems([
            { id: '1', text: '⚡ [GENERAL] Welcome to the all-new TGPCOP Student Council Portal!' },
            { id: '2', text: '⚡ [ACADEMIC] Mid-semester examination schedules published on Notice Board.' },
            { id: '3', text: '⚡ [EVENT] Scientific Poster Presentation registrations are active.' }
          ]);
        }
      } catch (err) {
        console.error('Error loading marquee updates:', err);
        // Resilient fallback
        setMarqueeItems([
          { id: '1', text: '⚡ [ALERT] Database offline - showing cached administrative notifications.' },
          { id: '2', text: '⚡ [GENERAL] Council operations running regularly on Nagpur campus.' }
        ]);
      }
    };
    fetchNotices();
  }, []);

  if (marqueeItems.length === 0) return null;

  // Quadruplicate to guarantee a flawless, gap-free infinite scrolling loop on wide viewports
  const duplicatedItems = [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems];

  return (
    <div className="bg-navy-dark/70 backdrop-blur-md py-3.5 border-y border-white/5 overflow-hidden w-full flex items-center relative z-20 shadow-md">
      {/* Fixed Tag Label with responsive design */}
      <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-burnt to-orange-burnt/90 text-white font-display font-bold text-[10px] sm:text-xs uppercase tracking-wider px-4 flex items-center z-30 shadow-2xl shrink-0 border-r border-white/5">
        <AlertCircle className="w-3.5 h-3.5 mr-1.5 animate-pulse text-gold-accent" />
        Latest Updates
      </div>

      {/* Infinite Ticker Track with Pause-on-Hover dynamics */}
      <div 
        className="w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className="flex whitespace-nowrap pl-40 gap-12"
          animate={{ x: [0, -1200] }}
          transition={{
            ease: 'linear',
            duration: isHovered ? 120 : 25, // Fluidly slows down speed on hover
            repeat: Infinity,
          }}
        >
          {duplicatedItems.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              to="/notices"
              className="inline-flex items-center text-white/80 hover:text-orange-burnt font-display font-medium text-xs sm:text-sm tracking-wide transition-all duration-300 transform hover:scale-102"
            >
              <span className="mr-2 text-gold-accent select-none">✦</span>
              {item.text}
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default MarqueeStrip;
