import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, HelpCircle, Sparkles, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';

const isVideoUrl = (url: string | null): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].some((e) => lower.endsWith(e)) ||
    lower.includes('/video/upload/') ||
    (lower.includes('res.cloudinary.com/') && lower.includes('/video/'))
  );
};

// Letter-by-letter reveal for hero title
const SplitText: React.FC<{ text: string; className?: string; delayStart?: number }> = ({
  text,
  className = '',
  delayStart = 0,
}) => {
  const words = text.split(' ');
  return (
    <span className={className} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: '0.05em' }}>
          {Array.from(word).map((ch, ci) => {
            const globalIndex = wi * 100 + ci;
            return (
              <span
                key={ci}
                className="letter-reveal"
                style={{ animationDelay: `${delayStart + globalIndex * 0.035}s` }}
              >
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block" style={{ width: '0.32em' }} />}
        </span>
      ))}
    </span>
  );
};

export const HeroSection: React.FC = () => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [heroBadgeText, setHeroBadgeText] = useState<string>('Tulsiramji Gaikwad Patil College of Pharmacy');
  const [heroTitleText1, setHeroTitleText1] = useState<string>('TGPCOP');
  const [heroTitleText2, setHeroTitleText2] = useState<string>('STUDENT COUNCIL');
  const [heroSubtitleText, setHeroSubtitleText] = useState<string>(
    'Your Voice. Our Future. | Together Towards Excellence'
  );

  // Scroll-linked parallax
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  const contentY = useTransform(scrollY, [0, 600], [0, -60]);
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('settings').select('key, value');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => {
            map[row.key] = row.value;
          });
          setBannerUrl(
            map['banner_url'] ||
              'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop'
          );
          if (map['hero_badge_text']) setHeroBadgeText(map['hero_badge_text']);
          if (map['hero_title_text_1']) setHeroTitleText1(map['hero_title_text_1']);
          if (map['hero_title_text_2']) setHeroTitleText2(map['hero_title_text_2']);
          if (map['hero_subtitle_text']) setHeroSubtitleText(map['hero_subtitle_text']);
        }
      } catch {
        setBannerUrl('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
      }
    };
    fetchSettings();
  }, []);

  const subtitleParts = heroSubtitleText.includes('|') ? heroSubtitleText.split('|') : [heroSubtitleText];

  return (
    <section
      className="relative w-full min-h-[100svh] overflow-hidden bg-[#050B1F] text-white flex items-end"
      data-testid="hero-section"
    >
      {/* Parallax background */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        {bannerUrl && isVideoUrl(bannerUrl) ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-[120%] object-cover select-none pointer-events-none scale-110"
            src={bannerUrl}
          />
        ) : (
          bannerUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center select-none scale-110"
              style={{ backgroundImage: `url(${bannerUrl})`, height: '120%' }}
            />
          )
        )}
      </motion.div>

      {/* Layered overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#050B1F]/40 via-[#050B1F]/65 to-[#050B1F]" />
      <div className="absolute inset-0 z-10 hero-spotlight pointer-events-none" />
      <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50 pointer-events-none" />
      <div className="noise-overlay z-10 noise-soft" />

      {/* Asymmetric content */}
      <motion.div
        className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          {/* LEFT — primary content */}
          <div className="lg:col-span-8 space-y-7">
            {/* Eyebrow / live badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full backdrop-blur-md bg-white/[0.04] border border-white/10"
            >
              <span className="relative flex items-center justify-center w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-orange-burnt opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-orange-burnt" />
              </span>
              <span className="text-white/85 text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase font-display">
                {heroBadgeText}
              </span>
            </motion.div>

            {/* Headline with split-text reveal */}
            <h1
              className="font-display font-black tracking-tight leading-[0.95] text-white"
              style={{ fontSize: 'clamp(2.75rem, 8vw, 6.5rem)' }}
            >
              <SplitText text={heroTitleText1} className="block" delayStart={0.15} />
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[length:200%_auto]">
                <SplitText text={heroTitleText2} delayStart={0.45} />
              </span>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0 }}
              className="text-white/75 text-base sm:text-xl max-w-2xl font-sans leading-relaxed"
            >
              {subtitleParts[0]}
              {subtitleParts[1] && (
                <>
                  <span className="text-white/30 mx-2">/</span>
                  <span className="text-gold-accent font-semibold">{subtitleParts.slice(1).join('|')}</span>
                </>
              )}
            </motion.p>

            {/* CTAs — 1 primary + 1 ghost */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              <Link
                to="/ask"
                data-testid="hero-primary-cta"
                className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full shadow-xl shadow-orange-burnt/25 hover:shadow-orange-burnt/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10"
              >
                <HelpCircle className="w-4 h-4" strokeWidth={2.4} />
                <span>Ask the Council</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>

              <Link
                to="/notices"
                data-testid="hero-secondary-cta"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-white/85 hover:text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full border border-white/15 hover:border-white/35 hover:bg-white/[0.04] backdrop-blur-md transition-all duration-300"
              >
                <FileText className="w-4 h-4 text-orange-burnt" strokeWidth={2.2} />
                <span>Notice Board</span>
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — vertical meta panel */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md overflow-hidden">
              <div className="noise-overlay noise-soft" />

              <div className="relative p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold-accent" strokeWidth={2.4} />
                  <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/55 font-display">
                    The Council Pulse
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-white/45 text-[10px] font-sans uppercase tracking-[0.2em]">Established</p>
                  <p className="font-display font-extrabold text-3xl text-white tracking-tight">2003</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <div className="space-y-1">
                  <p className="text-white/45 text-[10px] font-sans uppercase tracking-[0.2em]">Active Programs</p>
                  <p className="font-display font-extrabold text-3xl text-white tracking-tight">
                    B.Pharm <span className="text-white/35 text-2xl">·</span> D.Pharm
                  </p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                <div className="space-y-1">
                  <p className="text-white/45 text-[10px] font-sans uppercase tracking-[0.2em]">Campus</p>
                  <p className="font-display font-bold text-base text-white leading-snug">
                    Nagpur, Maharashtra
                    <span className="block text-orange-burnt text-xs mt-0.5 font-extrabold tracking-wider">
                      INDIA
                    </span>
                  </p>
                </div>
              </div>

              {/* Decorative corner */}
              <div className="absolute -top-px -right-px w-16 h-16 border-t border-r border-orange-burnt/50 rounded-tr-2xl pointer-events-none" />
              <div className="absolute -bottom-px -left-px w-16 h-16 border-b border-l border-gold-accent/40 rounded-bl-2xl pointer-events-none" />
            </div>
          </motion.div>
        </div>

        {/* Bottom marker bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-16 sm:mt-20 flex items-end justify-between gap-6 border-t border-white/10 pt-5"
        >
          <div className="flex items-center gap-2.5 text-white/45 text-[10px] font-sans uppercase tracking-[0.25em]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-burnt blink-dot" />
            <span>Live · Academic Year 2026—27</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/35 text-[10px] font-sans uppercase tracking-[0.25em]">
            <span>Scroll to explore</span>
            <motion.span
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="inline-block"
            >
              ↓
            </motion.span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
