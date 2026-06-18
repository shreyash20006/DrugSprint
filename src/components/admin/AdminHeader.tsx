import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Command } from 'lucide-react';
import { useAuth } from '../../lib/AuthProvider';

interface AdminHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, onMenuClick }) => {
  const { email, role, fullName } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = () => {
    if (fullName) return fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email.substring(0, 2).toUpperCase();
    return 'AD';
  };

  return (
    <header
      className="bg-[#080F22]/80 backdrop-blur-xl border-b border-white/[0.06] h-[64px] px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30"
      data-testid="admin-header"
    >
      {/* Left: hamburger + title + breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-5 flex-1 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.05] transition border border-white/[0.06]"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4" strokeWidth={2.2} />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35 mb-0.5">
            <span>Admin</span>
            <span className="text-white/15">/</span>
            <span className="text-orange-burnt">{currentTime}</span>
          </div>
          <h1
            data-testid="admin-page-title"
            className="font-display font-extrabold text-[14px] sm:text-[15px] text-white tracking-tight truncate"
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Middle: command bar (desktop only) */}
      <div className="hidden lg:flex items-center mx-6">
        <button
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-white/55 hover:text-white text-xs font-sans font-medium transition-all min-w-[280px]"
          data-testid="admin-cmd-search"
        >
          <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={2.4} />
          <span className="flex-1 text-left">Search portal…</span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.05] border border-white/10 text-white/45">
            <Command className="w-2.5 h-2.5" strokeWidth={2.8} />
            K
          </span>
        </button>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          data-testid="admin-notifications"
          className="relative p-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.05] transition border border-transparent hover:border-white/[0.06]"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" strokeWidth={2.2} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-burnt rounded-full ring-2 ring-[#080F22]" />
        </button>

        <div className="hidden sm:flex flex-col text-right">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 leading-none">
            {role ? role.replace(/_/g, ' ') : 'Executive'}
          </span>
          <span className="text-[11px] font-sans font-semibold text-white/85 leading-none mt-1 truncate max-w-[180px]">
            {email || 'loading...'}
          </span>
        </div>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-burnt to-[#E06D2B] border border-orange-burnt/30 flex items-center justify-center text-white font-display font-extrabold text-[11px] shadow-lg shadow-orange-burnt/15 shrink-0 cursor-default">
          {getInitials()}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
