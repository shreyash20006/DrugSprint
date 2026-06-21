import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Users, FileText, Calendar, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isMobile } from '../lib/device';

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

export const DNAHero: React.FC = () => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [heroBadgeText, setHeroBadgeText] = useState<string | null>('Tulsiramji Gaikwad Patil College of Pharmacy');
  const [heroTitleText1, setHeroTitleText1] = useState<string | null>('TGPCOP');
  const [heroTitleText2, setHeroTitleText2] = useState<string | null>('STUDENT COUNCIL');
  const [heroSubtitleText, setHeroSubtitleText] = useState<string | null>('Your Voice. Our Future. | Together Towards Excellence');
  const [heroButtonText, setHeroButtonText] = useState<string | null>('');
  const [heroButtonLink, setHeroButtonLink] = useState<string | null>('');
  const [heroButtonEnabled, setHeroButtonEnabled] = useState<boolean>(true);
  const [heroAskButtonEnabled, setHeroAskButtonEnabled] = useState<boolean>(true);
  const [heroNoticeButtonEnabled, setHeroNoticeButtonEnabled] = useState<boolean>(true);

  const [mobileMode, setMobileMode] = useState(false);
  const [stats, setStats] = useState({ students: 500, notices: 45, events: 30, members: 15 });

  // Fetch dynamic banner settings & evaluate mobile mode & stats
  useEffect(() => {
    setMobileMode(isMobile());

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
          setHeroAskButtonEnabled(map['hero_ask_button_enabled'] !== 'false');
          setHeroNoticeButtonEnabled(map['hero_notice_button_enabled'] !== 'false');
        }
      } catch (err) {
        console.error('Error fetching dynamic hero setting:', err);
        setBannerUrl('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
      }
    };

    const fetchStats = async () => {
      try {
        const { count: sVal } = await supabase.from('student_verifications').select('*', { count: 'exact', head: true });
        const { count: nVal } = await supabase.from('notices').select('*', { count: 'exact', head: true });
        const { count: eVal } = await supabase.from('events').select('*', { count: 'exact', head: true });
        const { count: mVal } = await supabase.from('council_members').select('*', { count: 'exact', head: true });
        
        setStats({
          students: sVal || 500,
          notices: nVal || 45,
          events: eVal || 30,
          members: mVal || 15
        });
      } catch (err) {
        console.error('Error fetching stats in DNAHero:', err);
      }
    };

    fetchSettings();
    fetchStats();
  }, []);

  // Embed Custom CSS for 3D Keyframe Animations
  const styleTag = (
    <style>{`
      @keyframes rotateOuter {
        0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
        100% { transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg); }
      }
      @keyframes rotateInner {
        0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
        100% { transform: rotateX(-180deg) rotateY(-360deg) rotateZ(-180deg); }
      }
      .scene-container {
        width: 320px;
        height: 320px;
        perspective: 1000px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .gyroscope-outer {
        width: 260px;
        height: 260px;
        position: absolute;
        transform-style: preserve-3d;
        animation: rotateOuter 20s infinite linear;
      }
      .gyroscope-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px dashed rgba(200, 75, 14, 0.45); /* orange-burnt */
        box-shadow: 0 0 20px rgba(200, 75, 14, 0.15);
      }
      .ring-1 { transform: rotateX(0deg); }
      .ring-2 { transform: rotateY(60deg); border-color: rgba(168, 85, 247, 0.45); } /* violet */
      .ring-3 { transform: rotateZ(120deg); border-color: rgba(255, 255, 255, 0.25); }
      
      .cube-3d {
        width: 90px;
        height: 90px;
        position: absolute;
        left: 85px;
        top: 85px;
        transform-style: preserve-3d;
        animation: rotateInner 10s infinite linear;
      }
      .cube-face {
        position: absolute;
        width: 100%;
        height: 100%;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        background: rgba(200, 75, 14, 0.1); /* semi-transparent orange */
        box-shadow: inset 0 0 15px rgba(168, 85, 247, 0.25), 0 0 15px rgba(200, 75, 14, 0.15);
        backdrop-filter: blur(2px);
      }
      .f-front  { transform: rotateY(  0deg) translateZ(45px); }
      .f-back   { transform: rotateY(180deg) translateZ(45px); }
      .f-left   { transform: rotateY(-90deg) translateZ(45px); }
      .f-right  { transform: rotateY( 90deg) translateZ(45px); }
      .f-top    { transform: rotateX( 90deg) translateZ(45px); }
      .f-bottom { transform: rotateX(-90deg) translateZ(45px); }
    `}</style>
  );

  // Mobile bypass rendering (keeps it responsive and clean on phone viewports)
  if (mobileMode) {
    return (
      <section 
        className="relative w-full h-screen flex items-center justify-center overflow-hidden z-10 bg-[#050B18]"
        data-keep-dark="true"
      >
        {styleTag}
        {isVideoUrl(bannerUrl) ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none"
            src={bannerUrl || undefined}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center select-none"
            style={bannerUrl ? {
              backgroundImage: `url(${bannerUrl})` 
            } : undefined}
          />
        )}
        <div className="absolute inset-0 bg-[#0D1B3E] opacity-70 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B3E] via-[#1a2a5e] to-[#0D1B3E] opacity-85 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center select-none pt-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center"
          >
            {heroBadgeText && (
              <div className="mb-6 flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full">
                <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
                <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
                  {heroBadgeText}
                </span>
              </div>
            )}

            {(heroTitleText1 || heroTitleText2) && (
              <h1 className="text-4xl font-black font-display uppercase tracking-tight text-white leading-tight mb-6">
                {heroTitleText1} <br />
                {heroTitleText2 && (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
                    {heroTitleText2}
                  </span>
                )}
              </h1>
            )}

            {heroSubtitleText && (
              <p className="text-white/95 text-base font-medium max-w-sm mx-auto mb-10 tracking-wide font-sans leading-relaxed">
                {heroSubtitleText.includes('|') ? (
                  <>
                    {heroSubtitleText.split('|')[0]} <br />
                    <span className="text-gold-accent font-semibold text-sm">{heroSubtitleText.split('|').slice(1).join('|')}</span>
                  </>
                ) : (
                  heroSubtitleText
                )}
              </p>
            )}

            <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
              {heroButtonEnabled && heroButtonText && heroButtonLink && (
                <Link
                  to={heroButtonLink}
                  className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg border border-white/5"
                >
                  <span>{heroButtonText}</span>
                  <ArrowRight className="w-4.5 h-4.5 text-white/90" />
                </Link>
              )}

              {heroAskButtonEnabled && (
                <Link
                  to="/ask"
                  className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-orange-burnt text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg border border-white/5"
                >
                  <span>Ask a Question</span>
                  <HelpCircle className="w-4.5 h-4.5 text-white/90" />
                </Link>
              )}
              
              {heroNoticeButtonEnabled && (
                <Link
                  to="/notices"
                  className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 bg-white/10 border border-white/20 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
                >
                  <span>Notice Board</span>
                  <ArrowRight className="w-4.5 h-4.5 text-orange-burnt" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // Desktop/Tablet rendering with Glassmorphism grid layout and rotating 3D shape
  return (
    <section 
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden z-10 bg-[#050B18] pt-20 pb-12"
      data-keep-dark="true"
    >
      {styleTag}
      
      {/* College Photo Base background */}
      {isVideoUrl(bannerUrl) ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none select-none opacity-40"
          src={bannerUrl || undefined}
        />
      ) : (
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none select-none opacity-40"
          style={bannerUrl ? {
            backgroundImage: `url(${bannerUrl})` 
          } : undefined}
        />
      )}

      {/* Frosted gradient mesh background blobs */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-purple-500/10 blur-[110px] pointer-events-none" />

      <div className="absolute inset-0 bg-[#0D1B3E] opacity-60 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20 pointer-events-none z-[1]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-between min-h-[80vh]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full my-auto">
          
          {/* Left Side: Headline & CTA Panel inside a gorgeous frosted glass card */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              }}
              className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col text-left relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />
              
              {/* Badge */}
              {heroBadgeText && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
                  }}
                  className="mb-6 self-start flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/35 px-4.5 py-1.5 rounded-full"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
                  <span className="text-orange-burnt text-[9px] sm:text-[10px] font-extrabold tracking-[0.2em] uppercase font-display">
                    {heroBadgeText}
                  </span>
                </motion.div>
              )}

              {/* Heading */}
              {(heroTitleText1 || heroTitleText2) && (
                <motion.h1
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
                  }}
                  className="text-4xl sm:text-5xl md:text-6xl font-black font-display uppercase tracking-tight text-white leading-tight mb-6"
                >
                  {heroTitleText1} <br />
                  {heroTitleText2 && (
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto] animate-[shimmer_4s_linear_infinite]">
                      {heroTitleText2}
                    </span>
                  )}
                </motion.h1>
              )}

              {/* Subtitle */}
              {heroSubtitleText && (
                <motion.p
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
                  }}
                  className="text-white/85 text-sm sm:text-lg font-medium max-w-xl mb-8 tracking-wide font-sans leading-relaxed"
                >
                  {heroSubtitleText.includes('|') ? (
                    <>
                      {heroSubtitleText.split('|')[0]} <br className="sm:hidden" />
                      <span className="hidden sm:inline"> | </span>
                      <span className="text-gold-accent font-semibold">{heroSubtitleText.split('|').slice(1).join('|')}</span>
                    </>
                  ) : (
                    heroSubtitleText
                  )}
                </motion.p>
              )}

              {/* Call to Actions (CTA) */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90, damping: 15 } }
                }}
                className="flex flex-col sm:flex-row items-center gap-4 w-full"
              >
                {heroButtonEnabled && heroButtonText && heroButtonLink && (
                  <Link
                    to={heroButtonLink}
                    className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/5"
                  >
                    <span>{heroButtonText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/90" />
                  </Link>
                )}

                {heroAskButtonEnabled && (
                  <Link
                    to="/ask"
                    className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-7 py-3.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-orange-burnt/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/5"
                  >
                    <span>Ask a Question</span>
                    <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform text-white/90" />
                  </Link>
                )}
                
                {heroNoticeButtonEnabled && (
                  <Link
                    to="/notices"
                    className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-7 py-3.5 bg-white/10 hover:bg-white/18 border border-white/15 hover:border-white/25 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
                  >
                    <span>Notice Board</span>
                    <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform text-orange-burnt" />
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* Right Side: Rotating 3D Shape Scene */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="scene-container"
            >
              {/* Pulsing glow background effect */}
              <div className="absolute w-52 h-52 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
              
              {/* CSS 3D Gyroscope/Cube Structure */}
              <div className="gyroscope-outer">
                <div className="gyroscope-ring ring-1" />
                <div className="gyroscope-ring ring-2" />
                <div className="gyroscope-ring ring-3" />
                <div className="cube-3d">
                  <div className="cube-face f-front" />
                  <div className="cube-face f-back" />
                  <div className="cube-face f-left" />
                  <div className="cube-face f-right" />
                  <div className="cube-face f-top" />
                  <div className="cube-face f-bottom" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom: Frosted Glass Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 w-full z-10"
        >
          {[
            { value: stats.students, label: 'Total Students', suffix: '+', icon: <Users className="w-4 h-4 text-orange-burnt" /> },
            { value: stats.notices, label: 'Notice Alerts', suffix: '', icon: <FileText className="w-4 h-4 text-orange-burnt" /> },
            { value: stats.events, label: 'Events Held', suffix: '', icon: <Calendar className="w-4 h-4 text-orange-burnt" /> },
            { value: stats.members, label: 'Active Executives', suffix: '', icon: <Award className="w-4 h-4 text-orange-burnt" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4.5 flex items-center space-x-3.5 hover:border-orange-burnt/25 hover:bg-white/[0.04] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-burnt/10 flex items-center justify-center border border-orange-burnt/15 shrink-0">
                {item.icon}
              </div>
              <div className="text-left">
                <div className="font-display font-extrabold text-lg text-white leading-tight">
                  {item.value.toLocaleString()}{item.suffix}
                </div>
                <div className="font-display font-bold text-[9px] text-white/50 uppercase tracking-widest mt-0.5">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 hidden sm:block">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-6.5 h-10 border-2 border-white/25 rounded-full flex justify-center p-1.5 backdrop-blur-sm shadow-inner"
        >
          <div className="w-1.5 h-2 bg-orange-burnt rounded-full animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default DNAHero;
