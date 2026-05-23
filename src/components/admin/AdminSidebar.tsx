import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useRole, isDeveloper } from '../../hooks/useRole';
import { 
  LayoutDashboard, 
  Mail, 
  Megaphone, 
  Calendar, 
  Image as ImageIcon, 
  Globe, 
  LogOut, 
  GraduationCap,
  Sliders,
  Sun,
  Moon,
  Database,
  Users,
  ClipboardList,
  Vote,
  BarChart3,
  Trophy,
  Newspaper,
  AlertTriangle,
  Handshake,
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
  const { adminUser, loading: roleLoading, can } = useRole();
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

  const isDev = isDeveloper(adminUser?.role);

  const navItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      permission: 'view_dashboard',
    },
    {
      path: '/admin/questions',
      name: 'Questions',
      icon: <Mail className="w-5 h-5" />,
      badge: pendingQuestionsCount > 0 ? pendingQuestionsCount : null,
      permission: 'view_questions',
    },
    {
      path: '/admin/notices',
      name: 'Notices',
      icon: <Megaphone className="w-5 h-5" />,
      permission: 'add_notices',
    },
    {
      path: '/admin/events',
      name: 'Events',
      icon: <Calendar className="w-5 h-5" />,
      permission: 'add_events',
    },
    {
      path: '/admin/gallery',
      name: 'Gallery',
      icon: <ImageIcon className="w-5 h-5" />,
      permission: 'upload_gallery',
    },
    {
      path: '/admin/registrations',
      name: 'Registrations',
      icon: <ClipboardList className="w-5 h-5" />,
      permission: 'view_registrations',
    },
    {
      path: '/admin/polls',
      name: 'Polls',
      icon: <Vote className="w-5 h-5" />,
      permission: 'manage_polls',
    },
    {
      path: '/admin/feedback',
      name: 'Feedback',
      icon: <BarChart3 className="w-5 h-5" />,
      permission: 'view_feedback',
    },
    {
      path: '/admin/achievements',
      name: 'Achievements',
      icon: <Trophy className="w-5 h-5" />,
      permission: 'manage_achievements',
    },
    {
      path: '/admin/newsletter',
      name: 'Newsletter',
      icon: <Newspaper className="w-5 h-5" />,
      permission: 'manage_newsletter',
    },
    {
      path: '/admin/complaints',
      name: 'Complaints',
      icon: <AlertTriangle className="w-5 h-5" />,
      permission: 'view_complaints',
    },
    {
      path: '/admin/mentors',
      name: 'Mentors',
      icon: <Handshake className="w-5 h-5" />,
      permission: 'manage_mentors',
    },
    {
      path: '/admin/settings',
      name: 'Portal Settings',
      icon: <Sliders className="w-5 h-5" />,
      permission: 'manage_settings',
    },
    {
      path: '/admin/database',
      name: 'Database',
      icon: <Database className="w-5 h-5" />,
      permission: 'view_database',
      devOnly: true,
    },
    {
      path: '/admin/manage-admins',
      name: 'Manage Admins',
      icon: <Users className="w-5 h-5" />,
      permission: 'manage_admins',
      devOnly: true,
    },
  ];

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
          {navItems
            .filter((item) => can(item.permission))
            .map((item) => {
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
                    <span className="bg-orange-burnt border border-white/10 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-5 text-center shadow">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Footer Navigation & User Info */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Admin User Info */}
        {!roleLoading && adminUser && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-semibold text-xs text-white truncate">
                  {isDev ? '👨‍💻' : '👤'} {adminUser.name}
                </p>
                {isDev && (
                  <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded bg-orange-burnt text-white">
                    DEV
                  </span>
                )}
              </div>
              <p className="text-[10px] text-orange-burnt/90 truncate mt-0.5">
                {isDev
                  ? 'Developer • Full Access 🔧'
                  : `${adminUser.role.replace('_', ' ')} • Admin`}
              </p>
            </div>
            {isDev && (
              <span className="inline-block w-full text-center text-[8px] font-extrabold uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-orange-burnt/25 text-orange-burnt border border-orange-burnt/40">
                DEV MODE
              </span>
            )}
          </div>
        )}

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
          target="_blank"
          rel="noopener noreferrer"
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
          <span>🚪 Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
