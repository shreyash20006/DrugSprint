import React, { useEffect, useState } from 'react';
import { isMobile } from '../lib/device';
import { Monitor, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScienceBackground } from './ScienceBackground';

interface DesktopOnlyWrapperProps {
  children: React.ReactNode;
}

export const DesktopOnlyWrapper: React.FC<DesktopOnlyWrapperProps> = ({ children }) => {
  const [mobileMode, setMobileMode] = useState(false);

  useEffect(() => {
    setMobileMode(isMobile());

    const handleResize = () => {
      setMobileMode(isMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (mobileMode) {
    return (
      <div className="relative min-h-screen bg-[#050B18] overflow-hidden flex flex-col items-center justify-center p-6 text-center">
        {/* Background molecular animations */}
        <ScienceBackground />
        <div className="absolute top-[30%] left-[10%] w-[350px] h-[350px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
        <div className="absolute inset-0 grid-bg-overlay opacity-10 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full bg-[#0D1B3E]/80 backdrop-blur-xl border border-orange-burnt/30 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-burnt/15 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt mx-auto shadow-inner animate-pulse">
            <Monitor className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display font-black text-xl text-white uppercase tracking-wider">
              Desktop View Only
            </h2>
            <p className="text-white/60 text-xs font-sans leading-relaxed">
              This complex interactive system features rich data tables, advanced grids, or high-density layouts optimized exclusively for desktop and laptop displays.
            </p>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] text-orange-burnt font-bold uppercase tracking-wider mb-4">
              💻 Please open this page on a Laptop or PC
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all w-full justify-center border border-white/5"
            >
              <ArrowLeft className="w-4 h-4 text-orange-burnt" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DesktopOnlyWrapper;
