import React from 'react';
import { Menu } from 'lucide-react';
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
    <header className="bg-[#0A1428]/60 backdrop-blur-md border border-white/10 h-[72px] px-6 mx-4 md:mx-8 mt-4 md:mt-8 rounded-2xl flex items-center justify-between shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.4)] z-20">
      {/* Left side: Hamburger (Mobile) + Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors focus:outline-none backdrop-blur-sm border border-white/5"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-lg md:text-xl text-white tracking-tight uppercase drop-shadow-md">
          {title}
        </h1>
      </div>

      {/* Right side: Admin Email + Avatar Monogram + Role Badge */}
      <div className="flex items-center space-x-3">
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
