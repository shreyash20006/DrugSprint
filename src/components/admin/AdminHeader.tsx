import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { useAuth } from '../../lib/AuthProvider';

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onMenuClick }) => {
  const { email, role, fullName } = useAuth();
  
  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <header className="bg-[#0A1428]/60 backdrop-blur-md border border-white/10 h-[72px] px-4 sm:px-6 mx-3 sm:mx-4 md:mx-8 mt-3 sm:mt-4 md:mt-8 rounded-2xl flex items-center justify-between shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-20">
      {/* Left side: Hamburger (Mobile) + Title & Search */}
      <div className="flex items-center space-x-3 sm:space-x-6 flex-1 min-w-0">
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none backdrop-blur-sm border border-white/5"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="font-display font-extrabold text-xs sm:text-sm md:text-base lg:text-lg text-white tracking-tight uppercase drop-shadow-md block line-clamp-1 max-w-[120px] sm:max-w-none">
            {title}
          </h1>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/40 group-focus-within:text-orange-burnt transition-colors duration-300" />
          </div>
          <input
            type="text"
            placeholder="Search across portal..."
            className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-orange-burnt/50 focus:border-orange-burnt/50 focus:bg-white/10 transition-all duration-300 sm:text-sm shadow-inner"
          />
        </div>
      </div>

      {/* Right side: Admin Email + Avatar Monogram + Role Badge */}
      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
        <button className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all focus:outline-none relative group border border-transparent hover:border-white/10">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-burnt rounded-full border border-[#0A1428] animate-pulse"></span>
        </button>
        <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
        <div className="hidden sm:flex flex-col text-right">
          <div className="flex items-center justify-end space-x-2">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
              Executive
            </span>
            {role && (
              <span className="bg-orange-burnt/20 text-orange-400 border border-orange-burnt/30 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(214,90,30,0.2)] leading-none shrink-0">
                {role.replace('_', ' ')}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-white/90 font-sans leading-none mt-1.5 drop-shadow-sm">
            {email || 'Loading...'}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-burnt to-[#FF8C42] border border-white/20 flex items-center justify-center text-white font-display font-extrabold text-sm shadow-[0_4px_15px_rgba(214,90,30,0.5)] shrink-0 cursor-default select-none relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
          {getInitials()}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
