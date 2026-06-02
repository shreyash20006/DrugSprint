import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from './ProtectedRoute';
import { getRoleDisplayName, getPositionTitle, useRole } from '../../hooks/useRole';
import { 
  LayoutDashboard, 
  Mail, 
  Megaphone, 
  Calendar, 
  Image as ImageIcon, 
  Globe, 
  LogOut, 
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

const RoleSidebarBadgeMap: Record<string, string> = {
  super_admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  admin: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  developer: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  president: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  vice_president: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  general_secretary: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  secretary: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  treasurer: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  events: 'bg-orange-600/20 text-orange-300 border-orange-600/30',
  cultural: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  nss: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  anti_ragging: 'bg-red-500/20 text-red-300 border-red-500/30',
  social_media: 'bg-pink-600/20 text-pink-300 border-pink-600/30',
  college_issues: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  student: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingQuestionsCount = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, fullName, avatarUrl } = useAuth();
  const { can } = useRole();
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
      show: true
    },
    {
      path: '/admin/questions',
      name: 'Questions',
      icon: <Mail className="w-5 h-5" />,
      badge: pendingQuestionsCount > 0 ? pendingQuestionsCount : null,
      show: can('view_questions')
    },
    {
      path: '/admin/notices',
      name: 'Notices',
      icon: <Megaphone className="w-5 h-5" />,
      show: can('add_notices') || can('approve_notices')
    },
    {
      path: '/admin/events',
      name: 'Events',
      icon: <Calendar className="w-5 h-5" />,
      show: can('add_events')
    },
    {
      path: '/admin/gallery',
      name: 'Gallery',
      icon: <ImageIcon className="w-5 h-5" />,
      show: can('upload_gallery')
    },
    {
      path: '/admin/registrations',
      name: 'Registrations',
      icon: <ClipboardList className="w-5 h-5" />,
      show: can('view_registrations')
    },
    {
      path: '/admin/polls',
      name: 'Polls',
      icon: <CheckSquare className="w-5 h-5" />,
      show: can('view_dashboard')
    },
    {
      path: '/admin/feedback',
      name: 'Feedback',
      icon: <MessageSquare className="w-5 h-5" />,
      show: can('view_feedback')
    },
    {
      path: '/admin/messages',
      name: 'Messages Board',
      icon: <MessageCircle className="w-5 h-5 text-orange-burnt animate-pulse" />,
      show: can('view_dashboard')
    },
    {
      path: '/admin/achievements',
      name: 'Achievements',
      icon: <Award className="w-5 h-5" />,
      show: can('view_dashboard')
    },
    {
      path: '/admin/newsletter',
      name: 'Newsletter',
      icon: <Newspaper className="w-5 h-5" />,
      show: can('view_dashboard')
    },
    {
      path: '/admin/mentors',
      name: 'Mentorship',
      icon: <HeartHandshake className="w-5 h-5" />,
      show: can('view_dashboard')
    },
    {
      path: '/admin/payments',
      name: 'Payments',
      icon: <CreditCard className="w-5 h-5" />,
      show: can('view_payments')
    },
  ];

  const navItems: any[] = [];
  if (role === 'developer' || role === 'super_admin') {
    navItems.push({
      path: '/admin/developer',
      name: 'Dev Dashboard',
      icon: <Wrench className="w-5 h-5 text-orange-burnt animate-pulse" />,
      badgeText: 'DEV'
    });
  }

  // Push permitted base navigation items
  baseNavItems.forEach(item => {
    if (item.show) {
      navItems.push(item);
    }
  });

  // Append specialized role tabs dynamically based on permissions
  if (can('view_complaints')) {
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

  if (can('manage_settings')) {
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
        <div className="p-5 border-b border-white/10 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white font-display font-extrabold text-xs shadow-lg shrink-0 shadow-orange-burnt/20">
            SC
          </div>
          <div className="min-w-0">
            <span className="font-display font-extrabold text-sm tracking-tight block leading-none truncate">
              TGPCOP
            </span>
            <span className="text-[9px] text-orange-burnt block tracking-widest uppercase font-bold mt-0.5">
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
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="block text-xs font-display font-extrabold text-white truncate leading-tight">
                {fullName || 'Admin User'}
              </span>
              {role && (
                <span className={`inline-block text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border shrink-0 leading-none ${RoleSidebarBadgeMap[role] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                  {getRoleDisplayName(role)}
                </span>
              )}
            </div>
            <span className="block text-[9px] font-sans font-bold text-white/50 truncate leading-relaxed mt-0.5">
              {role ? getPositionTitle(role) : 'Council Member'}
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
