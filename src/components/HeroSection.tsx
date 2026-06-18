import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return (
    videoExtensions.some(ext => lowerUrl.endsWith(ext)) ||
    lowerUrl.includes('/video/upload/') ||
    (lowerUrl.includes('res.cloudinary.com/') && lowerUrl.includes('/video/'))
  );
};

export const HeroSection: React.FC = () => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [heroBadgeText, setHeroBadgeText] = useState<string | null>('Tulsiramji Gaikwad Patil College of Pharmacy');
  const [heroTitleText1, setHeroTitleText1] = useState<string | null>('TGPCOP');
  const [heroTitleText2, setHeroTitleText2] = useState<string | null>('STUDENT COUNCIL');
  const [heroSubtitleText, setHeroSubtitleText] = useState<string | null>('Your Voice. Our Future. | Together Towards Excellence');
  const [heroButtonText, setHeroButtonText] = useState<string | null>('');
  const [heroButtonLink, setHeroButtonLink] = useState<string | null>('');
  const [heroButtonEnabled, setHeroButtonEnabled] = useState<boolean>(true);

  // Fetch dynamic banner settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('key, value');
        
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(row => { map[row.key] = row.value; });
          
          setBannerUrl(map['banner_url'] || 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
          setHeroBadgeText(map['hero_badge_text'] ?? 'Tulsiramji Gaikwad Patil College of Pharmacy');
          setHeroTitleText1(map['hero_title_text_1'] ?? 'TGPCOP');
          setHeroTitleText2(map['hero_title_text_2'] ?? 'STUDENT COUNCIL');
          setHeroSubtitleText(map['hero_subtitle_text'] ?? 'Your Voice. Our Future. | Together Towards Excellence');
          setHeroButtonText(map['hero_button_text'] ?? '');
          setHeroButtonLink(map['hero_button_link'] ?? '');
          setHeroButtonEnabled(map['hero_button_enabled'] !== 'false');
        }
      } catch (err) {
        console.error('Error fetching dynamic hero setting:', err);
        setBannerUrl('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="relative w-full bg-[#050B1F] text-white overflow-hidden pb-12">
      
      {/* 1. Hero Viewport Section (Full Screen h-screen) */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Dynamic Background (Image or Video) */}
        {bannerUrl && isVideoUrl(bannerUrl) ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
            src={bannerUrl}
          />
        ) : (
          bannerUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center select-none z-0"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
          )
        )}

        {/* Tint Overlay for Premium Contrast & Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B1F]/75 via-[#050B1F]/50 to-[#050B1F] z-10 pointer-events-none" />
        
        {/* Sleek startup grid overlay */}
        <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />

        {/* Centered Content Wrapper */}
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center justify-center h-full space-y-8 select-none">
          
          {/* Badge */}
          {heroBadgeText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full backdrop-blur-md shadow-md"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-burnt animate-pulse" />
              <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
                {heroBadgeText}
              </span>
            </motion.div>
          )}

          {/* Main Title Heading */}
          {(heroTitleText1 || heroTitleText2) && (
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white leading-none uppercase drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
            >
              {heroTitleText1} <br className="sm:hidden" />
              {heroTitleText2 && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
                  {heroTitleText2}
                </span>
              )}
            </motion.h1>
          )}

          {/* Subtitle */}
          {heroSubtitleText && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-white/95 text-base sm:text-xl md:text-2xl max-w-3xl mx-auto tracking-wide font-sans leading-relaxed drop-shadow-md font-medium"
            >
              {heroSubtitleText.includes('|') ? (
                <>
                  {heroSubtitleText.split('|')[0]} <span className="hidden sm:inline text-white/45 mx-1"> | </span>{" "}
                  <span className="text-gold-accent font-semibold">{heroSubtitleText.split('|').slice(1).join('|')}</span>
                </>
              ) : (
                heroSubtitleText
              )}
            </motion.p>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 w-full sm:w-auto"
          >
            {heroButtonEnabled && heroButtonText && heroButtonLink && (
              <Link
                to={heroButtonLink}
                className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-9 py-4.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.04] active:scale-[0.98] transition-all duration-300 border border-white/5 cursor-pointer"
              >
                <span>{heroButtonText}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-white/90" />
              </Link>
            )}

            <Link
              to="/ask"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-9 py-4.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-orange-burnt/25 hover:scale-[1.04] active:scale-[0.98] transition-all duration-300 border border-white/5 cursor-pointer"
            >
              <span>Ask a Question</span>
              <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform text-white/90" />
            </Link>

            <Link
              to="/notices"
              className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-9 py-4.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-2xl shadow-lg backdrop-blur-md hover:scale-[1.04] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <span>Notice Board</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-orange-burnt" />
            </Link>
          </motion.div>
        </div>

        {/* Floating Mouse Scroll Indicator (Bottom Center) */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden sm:block">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-6.5 h-10 border-2 border-white/25 rounded-full flex justify-center p-1.5 backdrop-blur-sm shadow-inner"
          >
            <div className="w-1.5 h-2 bg-orange-burnt rounded-full animate-bounce" />
          </motion.div>
        </div>

      </section>

    </div>
  );
};

export default HeroSection;
