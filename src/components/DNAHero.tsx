import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, HelpCircle, Users, ShieldCheck, Star } from 'lucide-react';
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

export const DNAHero: React.FC = () => {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {

    const fetchBanner = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'banner_url')
          .maybeSingle();
        if (data?.value) {
          setBannerUrl(data.value);
        } else {
          setBannerUrl('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
        }
      } catch (err) {
        console.error('Error fetching dynamic banner setting:', err);
        setBannerUrl('https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop');
      }
    };
    fetchBanner();
  }, []);

  return (
    <section className="relative w-full min-h-screen lg:h-screen flex items-center justify-center overflow-hidden z-10 py-24 lg:py-0">
      {/* Dynamic Background */}
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
          className="absolute inset-0 bg-cover bg-center z-0 pointer-events-none select-none"
          style={bannerUrl ? {
            backgroundImage: `url(${bannerUrl})` 
          } : undefined}
        />
      )}

      {/* Frosted Layer Overlay */}
      <div className="absolute inset-0 bg-[#050b18]/70 backdrop-blur-[2px] z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#050b18]/90 via-[#0d1b3e]/80 to-[#050b18]/95 z-0 pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none z-[1]" />

      {/* Custom 3D CSS Styles */}
      <style>{`
        .scene-3d {
          width: 300px;
          height: 300px;
          perspective: 1000px;
          display: flex;
          align-items: center;
          justify-center: center;
        }
        .cube-3d {
          width: 160px;
          height: 160px;
          position: relative;
          transform-style: preserve-3d;
          animation: spinCube 25s infinite linear;
        }
        .face-3d {
          position: absolute;
          width: 160px;
          height: 160px;
          border: 1px solid rgba(200, 75, 14, 0.4);
          background: linear-gradient(135deg, rgba(200, 75, 14, 0.25), rgba(250, 204, 21, 0.2));
          backdrop-filter: blur(8px);
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), 0 0 30px rgba(200, 75, 14, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.85);
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
          user-select: none;
        }
        .face-front  { transform: rotateY(0deg) translateZ(80px); }
        .face-back   { transform: rotateY(180deg) translateZ(80px); }
        .face-left   { transform: rotateY(-90deg) translateZ(80px); }
        .face-right  { transform: rotateY(90deg) translateZ(80px); }
        .face-top    { transform: rotateX(90deg) translateZ(80px); }
        .face-bottom { transform: rotateX(-90deg) translateZ(80px); }
        
        @keyframes spinCube {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }
        
        .glass-panel-glow {
          box-shadow: 0 8px 32px 0 rgba(5, 11, 24, 0.37),
                      inset 0 0 32px 0 rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Main Grid Wrapper */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT SIDE: Copy & Call-to-actions */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8 text-left">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 15 }}
              className="space-y-4"
            >
              {/* Badge label */}
              <div className="inline-flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/35 px-4 py-1.5 rounded-full backdrop-blur-md self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-burnt animate-pulse" />
                <span className="text-orange-burnt text-[9px] sm:text-[10px] font-bold tracking-[0.2em] uppercase font-display">
                  Official Executive Portal
                </span>
              </div>

              {/* High-impact headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black font-display uppercase tracking-tight text-white leading-[1.05] drop-shadow-2xl">
                TGPCOP <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto] animate-[shimmer_4s_linear_infinite]">
                  Student Council
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-white/80 text-sm sm:text-lg max-w-xl font-sans leading-relaxed">
                Empowering the future pioneers of pharmacy. Connect directly with student representatives, monitor dynamic notices, view verified accounts, or submit anonymous complaints.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 15, delay: 0.15 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Link
                to="/ask"
                className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-orange-burnt/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/5"
              >
                <span>Ask a Question</span>
                <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform text-white/95" />
              </Link>
              
              <Link
                to="/notices"
                className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
              >
                <span>Notice Board</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-orange-burnt" />
              </Link>
            </motion.div>

            {/* Bottom stats row (Frosted Glassmorphism Cards) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 15, delay: 0.3 }}
              className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5"
            >
              {/* Stat 1: Student Count */}
              <div className="bg-[#0d1b3e]/30 border border-white/[0.08] backdrop-blur-md rounded-xl p-3.5 flex flex-col justify-center glass-panel-glow">
                <div className="flex items-center space-x-2 text-orange-burnt mb-1.5">
                  <Users className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Roster</span>
                </div>
                <span className="block font-display font-extrabold text-lg sm:text-xl text-white">500+</span>
                <span className="block text-[9px] text-white/60 font-sans mt-0.5 leading-none">Active Students</span>
              </div>

              {/* Stat 2: Security/Revenue */}
              <div className="bg-[#0d1b3e]/30 border border-white/[0.08] backdrop-blur-md rounded-xl p-3.5 flex flex-col justify-center glass-panel-glow">
                <div className="flex items-center space-x-2 text-orange-burnt mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Fee Desk</span>
                </div>
                <span className="block font-display font-extrabold text-lg sm:text-xl text-white">100%</span>
                <span className="block text-[9px] text-white/60 font-sans mt-0.5 leading-none">Secure Payments</span>
              </div>

              {/* Stat 3: Ratings */}
              <div className="bg-[#0d1b3e]/30 border border-white/[0.08] backdrop-blur-md rounded-xl p-3.5 flex flex-col justify-center glass-panel-glow">
                <div className="flex items-center space-x-2 text-orange-burnt mb-1.5">
                  <Star className="w-4 h-4 text-gold-accent fill-gold-accent/20" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50">Rating</span>
                </div>
                <span className="block font-display font-extrabold text-lg sm:text-xl text-white">4.9★</span>
                <span className="block text-[9px] text-white/60 font-sans mt-0.5 leading-none">Portal Score</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT SIDE: Rotating 3D Shape viewport */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[320px] lg:min-h-[400px]">
            {/* Background glowing circle behind cube */}
            <div className="absolute w-52 h-52 bg-orange-burnt/15 rounded-full blur-[80px] pointer-events-none animate-pulse" />
            <div className="absolute w-44 h-44 bg-gold-accent/10 rounded-full blur-[100px] pointer-events-none delay-1000" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.2 }}
              className="scene-3d"
            >
              <div className="cube-3d">
                <div className="face-3d face-front">TGPCOP</div>
                <div className="face-3d face-back">Nagpur</div>
                <div className="face-3d face-left">Council</div>
                <div className="face-3d face-right">Pioneers</div>
                <div className="face-3d face-top">Rx</div>
                <div className="face-3d face-bottom">AURA</div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>

      {/* Floating bottom scroll helper */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 hidden lg:block">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-6.5 h-10.5 border-2 border-white/20 rounded-full flex justify-center p-1.5 backdrop-blur-sm shadow-inner"
        >
          <div className="w-1.5 h-3 bg-orange-burnt rounded-full animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
};

export default DNAHero;
