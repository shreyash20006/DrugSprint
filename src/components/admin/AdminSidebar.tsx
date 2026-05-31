import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from './ProtectedRoute';
import { getRoleDisplayName, getPositionTitle } from '../../hooks/useRole';
import { 
  LayoutDashboard, 
  Mail, 
  Megaphone, 
  Calendar, 
  Image as ImageIcon, 
  Globe, 
  LogOut, 
  GraduationCap,
  Users,
  Sliders,
  ClipboardList,
  Bug,
  Sun,
  Moon,
  CheckSquare,
  MessageSquare,
  MessageCircle,
  Award,
  Newspaper,
  HeartHandshake,
  AlertTriangle,
  Wrench,
  CreditCard
} from 'lucide-react';

interface AdminSidebarProps {
  pendingQuestionsCount?: number;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingQuestionsCount = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, email, fullName, avatarUrl } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        if (onClose) onClose();
        navigate('/admin', { replace: true });
      }
    }
  };

  const baseNavItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      path: '/admin/questions',
      name: 'Questions',
      icon: <Mail className="w-5 h-5" />,
      badge: pendingQuestionsCount > 0 ? pendingQuestionsCount : null,
    },
    {
      path: '/admin/notices',
      name: 'Notices',
      icon: <Megaphone className="w-5 h-5" />,
    },
    {
      path: '/admin/events',
      name: 'Events',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      path: '/admin/gallery',
      name: 'Gallery',
      icon: <ImageIcon className="w-5 h-5" />,
    },
    {
      path: '/admin/registrations',
      name: 'Registrations',
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      path: '/admin/polls',
      name: 'Polls',
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      path: '/admin/feedback',
      name: 'Feedback',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      path: '/admin/messages',
      name: 'Messages Board',
      icon: <MessageCircle className="w-5 h-5 text-orange-burnt animate-pulse" />,
    },
    {
      path: '/admin/achievements',
      name: 'Achievements',
      icon: <Award className="w-5 h-5" />,
    },
    {
      path: '/admin/newsletter',
      name: 'Newsletter',
      icon: <Newspaper className="w-5 h-5" />,
    },
    {
      path: '/admin/mentors',
      name: 'Mentorship',
      icon: <HeartHandshake className="w-5 h-5" />,
    },
    {
      path: '/admin/payments',
      name: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
    },
  ];

  const navItems: any[] = [];
  if (role === 'developer' && email === 'sb108750@gmail.com') {
    navItems.push({
      path: '/admin/developer',
      name: 'Dev Dashboard',
      icon: <Wrench className="w-5 h-5 text-orange-burnt animate-pulse" />,
      badgeText: 'DEV'
    });
  }
  navItems.push(...baseNavItems);

  // Append specialized role tabs
  if (role === 'super_admin' || role === 'developer' || role === 'antiragging') {
    navItems.push({
      path: '/admin/complaints',
      name: 'Complaints',
      icon: <AlertTriangle className="w-5 h-5 text-orange-burnt animate-pulse" />,
    });
  }

  if (role === 'super_admin' || role === 'developer') {
    navItems.push({
      path: '/admin/users',
      name: 'User Management',
      icon: <Users className="w-5 h-5" />,
    });
  }

  if (role === 'super_admin' || role === 'developer' || role === 'admin') {
    navItems.push({
      path: '/admin/settings',
      name: 'Portal Settings',
      icon: <Sliders className="w-5 h-5" />,
    });
  }

  if (role === 'super_admin' || role === 'developer') {
    navItems.push(
      {
        path: '/admin/logs',
        name: 'Activity Logs',
        icon: <ClipboardList className="w-5 h-5" />,
      },
      {
        path: '/admin/bugs',
        name: 'Bug Reports',
        icon: <Bug className="w-5 h-5" />,
      }
    );
  }

  return (
    <div className="w-[240px] bg-navy-dark text-white flex flex-col justify-between h-full border-r border-white/5 shrink-0 overflow-y-auto">
      <div>
        {/* Top Branding Section */}
        <div className="p-6 border-b border-white/10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-orange-burnt flex items-center justify-center text-white shadow-lg shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight block leading-none">
              TGPCOP
            </span>
            <span className="text-[9px] text-orange-burnt block tracking-widest uppercase font-bold mt-1">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`w-full flex items-center justify-between px-6 py-3 font-display text-sm font-semibold transition-all duration-200 outline-none relative border-l-4 ${
                  isActive
                    ? 'text-orange-burnt bg-white/[0.03] border-orange-burnt'
                    : 'text-white/70 hover:bg-orange-burnt/10 hover:text-orange-burnt border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge !== null && item.badge !== undefined && (
                  <span className="bg-orange-burnt border border-white/10 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-5 text-center shadow animate-in fade-in duration-200">
                    {item.badge}
                  </span>
                )}
                {item.badgeText && (
                  <span className="bg-orange-burnt border border-white/10 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md text-center shadow animate-pulse shrink-0">
                    {item.badgeText}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User Profile & Theme/Logout Operations */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {/* User Card Profile details */}
        <div className="flex items-center space-x-3 p-2 rounded-xl bg-white/[0.02] border border-white/5">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={fullName || 'User avatar'} 
              className="w-10 h-10 rounded-full object-cover border border-orange-burnt/30 shadow shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt font-display font-extrabold text-sm shadow-inner shrink-0">
              {fullName ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AD'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-display font-extrabold text-white truncate leading-tight">
              {fullName || 'Admin User'}
            </span>
            <span className="block text-[9px] font-sans font-bold text-white/50 truncate leading-relaxed mt-0.5">
              {role ? `${getPositionTitle(role)} • ${getRoleDisplayName(role)}` : 'Council Member'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-display text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all outline-none"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>☀️ Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>🌙 Dark Mode</span>
              </>
            )}
          </button>

          {/* View Website External Link */}
          <a
            href="/"
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-display text-xs font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all outline-none"
          >
            <Globe className="w-4 h-4 text-orange-burnt" />
            <span>🌐 View Website</span>
          </a>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg font-display text-xs font-bold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all outline-none"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>🚪 Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
