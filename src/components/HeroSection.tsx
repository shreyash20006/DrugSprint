import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  HelpCircle,
  Megaphone, 
  Calendar, 
  FileText, 
  Trophy, 
  GraduationCap, 
  Lock
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

  // Fetch dynamic banner settings
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center space-x-2 bg-orange-burnt/10 border border-orange-burnt/30 px-5 py-2 rounded-full backdrop-blur-md shadow-md"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-orange-burnt animate-pulse" />
            <span className="text-orange-burnt text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase font-display">
              Tulsiramji Gaikwad Patil College of Pharmacy
            </span>
          </motion.div>

          {/* Main Title Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-7xl md:text-8xl font-black font-display tracking-tight text-white leading-none uppercase drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
          >
            TGPCOP <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
              STUDENT
            </span> <br className="hidden sm:block md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[size:200%_auto]">
              COUNCIL
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-white/95 text-base sm:text-xl md:text-2xl max-w-3xl mx-auto tracking-wide font-sans leading-relaxed drop-shadow-md font-medium"
          >
            Your Voice. Our Future. <span className="hidden sm:inline text-white/45 mx-1"> | </span>{" "}
            <span className="text-gold-accent font-semibold">Together Towards Excellence</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 w-full sm:w-auto"
          >
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

      {/* Feature Highlights Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5 bg-gradient-to-b from-transparent to-[#080F25]/40">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <span className="bg-purple-500/10 border border-purple-500/35 text-purple-400 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-md">
            Features & Highlights
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4.5xl text-white">
            Designed for Student Success
          </h2>
          <p className="text-white/60 text-sm sm:text-base font-sans">
            Our specialized mobile solution helps you manage campus life with modern speed and security.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: notices */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(168, 85, 247, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-6 group-hover:bg-purple-500/20 transition-all">
              <Megaphone className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              📢 Instant Notices
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Stay in the loop with immediate push alerts for emergency notices, holiday declarations, and official campus circulars.
            </p>
          </motion.div>

          {/* Card 2: events */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(59, 130, 246, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-6 group-hover:bg-blue-500/20 transition-all">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              📅 Events & Activities
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Discover and register for seminars, technical symposiums, research forums, sports events, and cultural festivals.
            </p>
          </motion.div>

          {/* Card 3: exams */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(239, 68, 68, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 group-hover:bg-red-500/20 transition-all">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              📝 Exam Schedules
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Access winter/summer semester examination timetables, practical lists, seat numbers, and crucial result links.
            </p>
          </motion.div>

          {/* Card 4: achievements */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(245, 158, 11, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-6 group-hover:bg-amber-500/20 transition-all">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              🏆 Student Achievements
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Browse the campus Hall of Fame celebrating university merit rankers, research publications, and sports medalists.
            </p>
          </motion.div>

          {/* Card 5: prn verification */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(99, 102, 241, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:bg-indigo-500/20 transition-all">
              <GraduationCap className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              🎓 PRN Verification
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Fast-track validation system. Verify your student profiles and access permissions using official board PRNs.
            </p>
          </motion.div>

          {/* Card 6: google auth */}
          <motion.div 
            whileHover={{ y: -6, borderColor: 'rgba(234, 179, 8, 0.45)' }}
            className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 flex flex-col items-start text-left transition-all duration-300 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 mb-6 group-hover:bg-yellow-500/20 transition-all">
              <Lock className="w-6 h-6 text-yellow-405" />
            </div>
            <h3 className="font-display font-bold text-lg text-white mb-3 flex items-center gap-2">
              🔐 Secure Google Login
            </h3>
            <p className="text-white/60 text-sm leading-relaxed font-sans">
              Log in instantly using your official college Google account. Fully secure, encrypted single sign-on experience.
            </p>
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default HeroSection;
