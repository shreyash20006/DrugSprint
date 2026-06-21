import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, HelpCircle, Sparkles, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AnimatedLogo } from './ui/AnimatedLogo';

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
  const [heroSubtitleText, setHeroSubtitleText] = useState<string>('Your Voice. Our Future. | Together Towards Excellence');
  const [heroAskButtonEnabled, setHeroAskButtonEnabled] = useState<boolean>(true);
  const [heroNoticeButtonEnabled, setHeroNoticeButtonEnabled] = useState<boolean>(true);
  const [pulseSinceYear, setPulseSinceYear] = useState<string>('2003');
  const [pulsePrograms, setPulsePrograms] = useState<string>('B.Pharm · D.Pharm');
  const [pulseCampusCity, setPulseCampusCity] = useState<string>('Nagpur, Maharashtra');
  const [pulseCampusCountry, setPulseCampusCountry] = useState<string>('INDIA');
  const [logoRotationEnabled, setLogoRotationEnabled] = useState<boolean>(true);
  const [logoOrbitEnabled, setLogoOrbitEnabled] = useState<boolean>(true);
  const [heroTextVisible, setHeroTextVisible] = useState<boolean>(true);
  const [videoObjectFit, setVideoObjectFit] = useState<'cover' | 'contain'>('contain');

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
          if (map['hero_badge_text'] !== undefined) setHeroBadgeText(map['hero_badge_text']);
          if (map['hero_title_text_1'] !== undefined) setHeroTitleText1(map['hero_title_text_1']);
          if (map['hero_title_text_2'] !== undefined) setHeroTitleText2(map['hero_title_text_2']);
          if (map['hero_subtitle_text'] !== undefined) setHeroSubtitleText(map['hero_subtitle_text']);

          setHeroAskButtonEnabled(map['hero_ask_button_enabled'] !== 'false');
          setHeroNoticeButtonEnabled(map['hero_notice_button_enabled'] !== 'false');
          if (map['pulse_since_year']) setPulseSinceYear(map['pulse_since_year']);
          if (map['pulse_programs']) setPulsePrograms(map['pulse_programs']);
          if (map['pulse_campus_city']) setPulseCampusCity(map['pulse_campus_city']);
          if (map['pulse_campus_country']) setPulseCampusCountry(map['pulse_campus_country']);
          if (map['hero_logo_rotation_enabled'] === 'false') setLogoRotationEnabled(false);
          if (map['hero_logo_orbit_enabled'] === 'false') setLogoOrbitEnabled(false);
          if (map['hero_text_visible'] === 'false') setHeroTextVisible(false);
          if (map['hero_video_object_fit'] === 'cover') setVideoObjectFit('cover');
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
            className={`absolute inset-0 w-full h-[120%] select-none pointer-events-none ${
              videoObjectFit === 'contain' ? 'object-contain bg-[#050B1F]' : 'object-cover scale-110'
            }`}
            src={bannerUrl}
          />
        ) : (
          bannerUrl && (
            <div
              className={`absolute inset-0 bg-center select-none ${
                videoObjectFit === 'contain' ? 'bg-contain bg-no-repeat' : 'bg-cover scale-110'
              }`}
              style={{ backgroundImage: `url(${bannerUrl})`, height: '120%' }}
            />
          )
        )}
      </motion.div>

      {/* Layered overlays — lighter when text hidden (cinema mode) */}
      <div className={`absolute inset-0 z-10 bg-gradient-to-b ${heroTextVisible ? 'from-[#050B1F]/40 via-[#050B1F]/65 to-[#050B1F]' : 'from-[#050B1F]/10 via-transparent to-[#050B1F]/40'}`} />
      {heroTextVisible && (
        <>
          <div className="absolute inset-0 z-10 hero-spotlight pointer-events-none" />
          <div className="absolute inset-0 z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50 pointer-events-none" />
          <div className="noise-overlay z-10 noise-soft" />
        </>
      )}

      {/* Cinema mode — show only a tiny floating scroll hint */}
      {!heroTextVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 4, 0] }}
          transition={{ opacity: { duration: 1, delay: 1 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none"
        >
          <span className="text-white/55 text-[9px] font-bold tracking-[0.28em] uppercase font-display drop-shadow-lg">
            Scroll to Explore
          </span>
          <span className="text-orange-burnt text-xs">↓</span>
        </motion.div>
      )}

      {/* Asymmetric content — hidden in cinema mode */}
      {heroTextVisible && (
      <motion.div
        className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-end">
          {/* LEFT — primary content */}
          <div className="lg:col-span-8 space-y-7">
            {/* Mobile-only animated logo on top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden flex justify-start mb-2"
            >
              <AnimatedLogo size="md" variant="default" />
            </motion.div>

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

            {/* CTAs — 1 primary + 1 ghost + 1 Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4"
            >
              {heroAskButtonEnabled && (
                <Link
                  to="/ask"
                  data-testid="hero-primary-cta"
                  className="group inline-flex items-center justify-center gap-3 px-7 py-4 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full shadow-xl shadow-orange-burnt/25 hover:shadow-orange-burnt/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10"
                >
                  <HelpCircle className="w-4 h-4" strokeWidth={2.4} />
                  <span>Ask the Council</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              )}

              {heroNoticeButtonEnabled && (
                <Link
                  to="/notices"
                  data-testid="hero-secondary-cta"
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-white/85 hover:text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full border border-white/15 hover:border-white/35 hover:bg-white/[0.04] backdrop-blur-md transition-all duration-300"
                >
                  <FileText className="w-4 h-4 text-orange-burnt" strokeWidth={2.2} />
                  <span>Notice Board</span>
                </Link>
              )}

              <a
                href="https://www.instagram.com/tgpcop.council/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-white/85 hover:text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full border border-[#E1306C]/30 hover:border-[#E1306C] hover:bg-[#E1306C]/10 backdrop-blur-md transition-all duration-300"
              >
                <svg className="w-4 h-4 text-[#E1306C] group-hover:scale-115 transition-transform duration-300 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                <span>Follow Us</span>
              </a>

              <a
                href="https://www.linkedin.com/company/tgpcop-council"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-white/85 hover:text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-full border border-[#0077B5]/30 hover:border-[#0077B5] hover:bg-[#0077B5]/10 backdrop-blur-md transition-all duration-300"
              >
                <svg className="w-4 h-4 text-[#0077B5] group-hover:scale-115 transition-transform duration-300 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="lg:col-span-4 hidden lg:block"
          >
            <div className="relative">
              {/* Animated logo halo as visual anchor */}
              <div className="flex justify-center mb-8">
                <AnimatedLogo
                  size="xl"
                  variant={
                    !logoRotationEnabled && !logoOrbitEnabled
                      ? 'static'
                      : logoOrbitEnabled
                      ? 'orbit'
                      : 'default'
                  }
                  testId="hero-animated-logo"
                />
              </div>

              {/* Meta panel below */}
              <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md overflow-hidden">
                <div className="noise-overlay noise-soft" />

                <div className="relative p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-gold-accent" strokeWidth={2.4} />
                    <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/55 font-display">
                      The Council Pulse
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-white/45 text-[9px] font-sans uppercase tracking-[0.18em]">Since</p>
                      <p className="font-display font-extrabold text-2xl text-white tracking-tight">{pulseSinceYear}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-white/45 text-[9px] font-sans uppercase tracking-[0.18em]">Campus</p>
                      <p className="font-display font-bold text-sm text-white leading-tight">
                        {pulseCampusCity.split(',')[0]}
                        <span className="block text-orange-burnt text-[10px] font-extrabold tracking-wider">
                          {pulseCampusCountry}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                  <div className="space-y-0.5">
                    <p className="text-white/45 text-[9px] font-sans uppercase tracking-[0.18em]">Programs</p>
                    <p className="font-display font-extrabold text-base text-white">
                      {pulsePrograms}
                    </p>
                  </div>
                </div>

                {/* Decorative corners */}
                <div className="absolute -top-px -right-px w-12 h-12 border-t border-r border-orange-burnt/50 rounded-tr-2xl pointer-events-none" />
                <div className="absolute -bottom-px -left-px w-12 h-12 border-b border-l border-gold-accent/40 rounded-bl-2xl pointer-events-none" />
              </div>
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
      )}
    </section>
  );
};

export default HeroSection;
