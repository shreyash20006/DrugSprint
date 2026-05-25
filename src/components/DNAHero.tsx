import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { ArrowRight, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isMobile } from '../lib/device';


export const DNAHero: React.FC = () => {

  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [mobileMode, setMobileMode] = useState(false);

  // Fetch dynamic banner settings & evaluate mobile mode
  useEffect(() => {
    setMobileMode(isMobile());

    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'banner_url')
          .maybeSingle();
        if (data?.value) {
          setBannerUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching dynamic banner setting:', err);
      }
    };
    fetchBanner();
  }, []);



  // Mobile bypass rendering
  if (mobileMode) {
    return (
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10">
        <div 
          className="absolute inset-0 bg-cover bg-center select-none"
          style={{
            backgroundImage: bannerUrl 
              ? `url(${bannerUrl})` 
              : `url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop')`
          }}
        />
        <div className="absolute inset-0 bg-[#0D1B3E] opacity-70 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B3E] via-[#1a2a5e] to-[#0D1B3E] opacity-85 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none pt-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
              <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
                Tulsiramji Gaikwad Patil College of Pharmacy
              </span>
            </div>

            <h1 className="text-4xl font-black font-display uppercase tracking-tight text-white leading-tight mb-6">
              TGPCOP <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
                Student Council
              </span>
            </h1>

            <p className="text-white/95 text-base font-medium max-w-sm mx-auto mb-10 tracking-wide font-sans leading-relaxed">
              Your Voice. Our Future. <br />
              <span className="text-gold-accent font-semibold text-sm">Together Towards Excellence</span>
            </p>

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              <Link
                to="/ask"
                className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-orange-burnt text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg border border-white/5"
              >
                <span>Ask a Question</span>
                <HelpCircle className="w-4.5 h-4.5 text-white/90" />
              </Link>
              
              <Link
                to="/notices"
                className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-white/10 border border-white/20 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
              >
                <span>Notice Board</span>
                <ArrowRight className="w-4.5 h-4.5 text-orange-burnt" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Desktop/Tablet rendering with WebGL overlay
  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10">
      
      {/* College Photo Base background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none select-none"
        style={{
          backgroundImage: bannerUrl 
            ? `url(${bannerUrl})` 
            : `url('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop')`
        }}
      />

      <div className="absolute inset-0 bg-[#0D1B3E] opacity-60 z-0 pointer-events-none" />



      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none z-[1]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.12,
                delayChildren: 0.1,
              },
            },
          }}
          className="flex flex-col items-center justify-center"
        >
          {/* Badge */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.3 } }
            }}
            className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
            <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
              Tulsiramji Gaikwad Patil College of Pharmacy
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.5 } }
            }}
            className="text-4xl sm:text-6xl md:text-8xl font-black font-display uppercase tracking-tight text-white leading-[1.08] mb-6 drop-shadow-2xl"
          >
            TGPCOP <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto] animate-[shimmer_4s_linear_infinite]">
              Student Council
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.7 } }
            }}
            className="text-white/95 text-base sm:text-2xl font-medium max-w-2xl mx-auto mb-10 tracking-wide font-sans leading-relaxed drop-shadow-md"
          >
            Your Voice. Our Future. <br className="sm:hidden" />
            <span className="hidden sm:inline"> | </span>
            <span className="text-gold-accent font-semibold">Together Towards Excellence</span>
          </motion.p>

          {/* Call to Actions (CTA) */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 35 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15, delay: 0.9 } }
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full max-w-md mx-auto"
          >
            <Link
              to="/ask"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-orange-burnt/25 hover:scale-[1.04] active:scale-[0.97] transition-all duration-300"
            >
              <span>Ask a Question</span>
              <HelpCircle className="w-4.5 h-4.5 group-hover:scale-110 transition-transform text-white/90" />
            </Link>
            
            <Link
              to="/notices"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/18 border border-white/20 hover:border-white/35 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.04] active:scale-[0.97] transition-all duration-300"
            >
              <span>Notice Board</span>
              <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-1 transition-transform text-orange-burnt" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-6.5 h-10.5 border-2 border-white/35 rounded-full flex justify-center p-1.5 backdrop-blur-sm shadow-inner"
        >
          <div className="w-1.5 h-3 bg-orange-burnt rounded-full animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default DNAHero;
