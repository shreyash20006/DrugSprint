import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Megaphone, 
  Calendar, 
  FileText, 
  Trophy, 
  GraduationCap, 
  Lock
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  // Scroll to download section handler
  const scrollToDownload = () => {
    const downloadSection = document.getElementById('download-app-section');
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Inline styling for keyframe animations (GPU accelerated)
  const animationStyles = (
    <style>{`
      @keyframes float-y-slow {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(1deg); }
      }
      @keyframes float-y-fast {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(-1deg); }
      }
      @keyframes float-y-reverse {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(12px) rotate(0.5deg); }
      }
      @keyframes rotate-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 15px rgba(214, 90, 30, 0.3), 0 0 30px rgba(168, 85, 247, 0.1); }
        50% { box-shadow: 0 0 30px rgba(214, 90, 30, 0.5), 0 0 60px rgba(168, 85, 247, 0.3); }
      }
      .animate-float-slow {
        animation: float-y-slow 7s ease-in-out infinite;
      }
      .animate-float-fast {
        animation: float-y-fast 5s ease-in-out infinite;
      }
      .animate-float-reverse {
        animation: float-y-reverse 6s ease-in-out infinite;
      }
      .animate-rotate-slow {
        animation: rotate-slow 30s linear infinite;
      }
      .animate-pulse-glow {
        animation: pulse-glow 3s ease-in-out infinite;
      }
      .custom-blur-glow {
        filter: blur(80px);
        will-change: transform;
      }
    `}</style>
  );

  return (
    <div className="relative w-full bg-[#050B1F] text-white overflow-hidden pb-12">
      {animationStyles}

      {/* Modern startup-style grid background & radial glow blobs */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Decorative Neon Glow Blobs */}
      <div className="absolute -top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-purple-600/10 custom-blur-glow pointer-events-none" />
      <div className="absolute top-[25%] -right-[5%] w-[500px] h-[500px] rounded-full bg-blue-600/10 custom-blur-glow pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[450px] h-[450px] rounded-full bg-orange-500/10 custom-blur-glow pointer-events-none" />

      {/* Main Hero Wrapper */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 md:pt-40 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center">
          
          {/* Left Side Column: App Introduction */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col space-y-6 text-left"
          >
            {/* Small Badge */}
            <div className="self-start flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-lg">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-white/80 text-[10px] sm:text-xs font-bold tracking-wider font-display uppercase flex items-center gap-1.5">
                🚀 Official TGPCOP Student Council App
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6.5xl font-black font-display tracking-tight text-white leading-[1.15]">
              Your Campus. <br />
              Your Council. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-orange-400 bg-[size:200%_auto] animate-[shimmer_5s_linear_infinite]">
                Your App.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-white/70 text-base sm:text-lg max-w-xl leading-relaxed font-sans font-medium">
              Stay updated with notices, events, exam schedules, achievements, resources and student services — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
              <button
                onClick={scrollToDownload}
                className="animate-pulse-glow flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-orange-burnt to-purple-600 hover:from-orange-650 hover:to-purple-700 text-white font-display text-sm font-bold uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-white/10 cursor-pointer"
              >
                <span>📥 Download App</span>
              </button>

              <button
                onClick={scrollToDownload}
                className="group flex items-center justify-center space-x-2 px-8 py-4 bg-white/[0.03] border border-white/10 hover:border-white/20 text-white font-display text-sm font-bold uppercase tracking-widest rounded-2xl shadow-lg backdrop-blur-md hover:bg-white/[0.06] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 cursor-pointer"
              >
                <span>📱 Join Beta Testing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-400" />
              </button>
            </div>
          </motion.div>

          {/* Right Side Column: Floating Device Mockup & Features */}
          <div className="lg:col-span-5 flex items-center justify-center relative min-h-[420px] sm:min-h-[500px]">
            
            {/* Glowing Gradient Rings behind phone */}
            <div className="absolute w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border border-purple-500/20 animate-rotate-slow pointer-events-none z-0 flex items-center justify-center">
              <div className="w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rounded-full border border-dashed border-blue-500/10" />
            </div>
            
            {/* Ambient Backlight Glow */}
            <div className="absolute w-[240px] h-[240px] bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-orange-500/20 rounded-full blur-[60px] pointer-events-none z-0" />

            {/* Mobile Device Mockup */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10 w-[240px] sm:w-[280px] aspect-[9/19] rounded-[48px] border-[12px] border-[#0A0E1A] bg-[#050B1F] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden animate-float-slow ring-1 ring-white/10"
            >
              {/* Speaker & Camera notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-[#0A0E1A] z-40 rounded-b-2xl flex items-center justify-center">
                <div className="w-16 h-3 bg-black rounded-full mb-1 flex items-center justify-end px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                </div>
              </div>

              {/* Screen Content: Cloudinary app dashboard image */}
              <div className="w-full h-full relative z-30 select-none">
                <img 
                  src="https://res.cloudinary.com/dsqxboxoc/image/upload/q_auto/f_auto/v1781695316/ChatGPT_Image_Jun_17_2026_04_50_13_PM_ln5ggb.png" 
                  alt="TGPCOP App Mockup Dashboard" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Bottom Home indicator */}
              <div className="absolute bottom-1.5 inset-x-0 h-1 flex justify-center z-40">
                <div className="w-24 h-1 bg-white/30 rounded-full" />
              </div>
            </motion.div>

            {/* Floating Features Badges around the device */}
            <div className="absolute inset-0 pointer-events-none z-20">
              
              {/* Floating Badge 1: 📢 Notices (Top Left) */}
              <div className="absolute top-[8%] left-[2%] sm:left-[-8%] animate-float-fast pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Megaphone className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-purple-400 font-extrabold font-display leading-none">Live Alerts</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">📢 Notices</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2: 🏆 Achievements (Top Right) */}
              <div className="absolute top-[18%] right-[2%] sm:right-[-8%] animate-float-reverse pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Trophy className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-orange-400 font-extrabold font-display leading-none">Hall of Fame</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">🏆 Triumphs</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 3: 📅 Events (Middle Left) */}
              <div className="absolute top-[48%] left-[-4%] sm:left-[-12%] animate-float-reverse pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-blue-400 font-extrabold font-display leading-none">Timelines</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">📅 Events</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 4: 📝 Exam Schedules (Middle Right) */}
              <div className="absolute top-[55%] right-[-4%] sm:right-[-12%] animate-float-fast pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <FileText className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-extrabold font-display leading-none">Timetables</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">📝 Exams</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 5: 🎓 PRN Verification (Bottom Left) */}
              <div className="absolute bottom-[10%] left-[0%] sm:left-[-8%] animate-float-slow pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-extrabold font-display leading-none">Database</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">🎓 PRN Verification</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 6: 🔐 Secure Login (Bottom Right) */}
              <div className="absolute bottom-[18%] right-[0%] sm:right-[-8%] animate-float-fast pointer-events-auto">
                <div className="flex items-center space-x-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl hover:scale-105 transition-transform">
                  <div className="w-7 h-7 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                    <Lock className="w-4 h-4 text-yellow-450" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[9px] uppercase tracking-wider text-yellow-450 font-extrabold font-display leading-none">Google Auth</span>
                    <span className="text-[11px] font-sans font-bold text-white leading-tight mt-0.5">🔐 Secure Login</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Feature Highlights Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5 bg-gradient-to-b from-transparent to-[#080F25]/40">
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
