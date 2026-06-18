import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from './ProtectedRoute';
import { getRoleDisplayName, getPositionTitle } from '../../hooks/useRole';
import {
  LayoutDashboard, Mail, Megaphone, Calendar, Image as ImageIcon, Globe, LogOut,
  Users, Sliders, ClipboardList, Bug, Sun, Moon, CheckSquare, MessageSquare,
  MessageCircle, Award, Newspaper, HeartHandshake, BadgeCheck, AlertTriangle,
  Wrench, CreditCard, GraduationCap, Camera, UserPlus, X, ChevronDown,
} from 'lucide-react';

interface AdminSidebarProps {
  pendingQuestionsCount?: number;
  onClose?: () => void;
}

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  badge?: number | null;
  badgeText?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const RoleBadge: Record<string, string> = {
  super_admin: 'bg-orange-burnt/15 text-orange-burnt border-orange-burnt/30',
  admin: 'bg-orange-burnt/10 text-orange-burnt/90 border-orange-burnt/20',
  developer: 'bg-gold-accent/15 text-gold-accent border-gold-accent/30',
  president: 'bg-gold-accent/15 text-gold-accent border-gold-accent/30',
  vice_president: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  general_secretary: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  secretary: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  treasurer: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  coordinator: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  student: 'bg-white/[0.04] text-white/65 border-white/10',
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  pendingQuestionsCount = 0,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, fullName, avatarUrl } = useAuth();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('tgpcop-theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('tgpcop-theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        if (onClose) onClose();
        navigate('/admin', { replace: true });
      }
    }
  };

  const groups = useMemo<NavGroup[]>(() => {
    const overview: NavItem[] = [
      { path: '/admin/dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" strokeWidth={2.2} /> },
    ];
    if (role === 'developer') {
      overview.unshift({
        path: '/admin/developer',
        name: 'Dev Console',
        icon: <Wrench className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />,
        badgeText: 'DEV',
      });
    }

    const community: NavItem[] = [
      { path: '/admin/verification', name: 'Student Verification', icon: <BadgeCheck className="w-4 h-4" strokeWidth={2.2} /> },
      {
        path: '/admin/questions', name: 'Questions',
        icon: <Mail className="w-4 h-4" strokeWidth={2.2} />,
        badge: pendingQuestionsCount > 0 ? pendingQuestionsCount : null,
      },
      { path: '/admin/messages', name: 'Messages Board', icon: <MessageCircle className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/mentors', name: 'Mentorship', icon: <HeartHandshake className="w-4 h-4" strokeWidth={2.2} /> },
    ];

    const content: NavItem[] = [
      { path: '/admin/notices', name: 'Notices', icon: <Megaphone className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/events', name: 'Events', icon: <Calendar className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/exams', name: 'Exam Schedule', icon: <GraduationCap className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/stories', name: 'Stories', icon: <Camera className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/gallery', name: 'Gallery', icon: <ImageIcon className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/achievements', name: 'Achievements', icon: <Award className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/newsletter', name: 'Newsletter', icon: <Newspaper className="w-4 h-4" strokeWidth={2.2} /> },
    ];

    const engagement: NavItem[] = [
      { path: '/admin/registrations', name: 'Registrations', icon: <ClipboardList className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/polls', name: 'Polls', icon: <CheckSquare className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/feedback', name: 'Feedback', icon: <MessageSquare className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/admissions', name: 'Admissions Leads', icon: <UserPlus className="w-4 h-4" strokeWidth={2.2} /> },
      { path: '/admin/payments', name: 'Payments', icon: <CreditCard className="w-4 h-4" strokeWidth={2.2} /> },
    ];

    const admin: NavItem[] = [];
    if (role === 'super_admin' || role === 'developer') {
      admin.push({ path: '/admin/complaints', name: 'Complaints', icon: <AlertTriangle className="w-4 h-4 text-orange-burnt" strokeWidth={2.2} /> });
      admin.push({ path: '/admin/users', name: 'User Management', icon: <Users className="w-4 h-4" strokeWidth={2.2} /> });
    }
    if (role === 'super_admin' || role === 'developer' || role === 'admin') {
      admin.push({ path: '/admin/settings', name: 'Portal Settings', icon: <Sliders className="w-4 h-4" strokeWidth={2.2} /> });
    }
    if (role === 'super_admin' || role === 'developer') {
      admin.push({ path: '/admin/logs', name: 'Activity Logs', icon: <ClipboardList className="w-4 h-4" strokeWidth={2.2} /> });
      admin.push({ path: '/admin/bugs', name: 'Bug Reports', icon: <Bug className="w-4 h-4" strokeWidth={2.2} /> });
    }

    const list: NavGroup[] = [
      { label: 'Overview', items: overview },
      { label: 'Community', items: community },
      { label: 'Content', items: content },
      { label: 'Engagement', items: engagement },
    ];
    if (admin.length > 0) list.push({ label: 'Administration', items: admin });
    return list;
  }, [role, pendingQuestionsCount]);

  const toggleGroup = (label: string) =>
    setCollapsedGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <aside className="w-[256px] h-full bg-[#080F22] border-r border-white/[0.06] flex flex-col shrink-0 relative">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-white/[0.06] flex items-center justify-between">
        <Link to="/admin/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white font-display font-extrabold text-[11px] shadow-lg shadow-orange-burnt/20 shrink-0 group-hover:scale-105 transition-transform">
            SC
          </div>
          <div className="min-w-0">
            <p className="font-display font-extrabold text-sm text-white leading-none tracking-tight">TGPCOP</p>
            <p className="text-[9px] text-orange-burnt mt-1 font-bold tracking-[0.2em] uppercase leading-none">
              Admin · Panel
            </p>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-white/55 hover:text-white hover:bg-white/5 transition"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav (scrollable) */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-3 space-y-5">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups[group.label];
          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-3 mb-1.5 group"
              >
                <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/35 group-hover:text-white/55 transition-colors">
                  {group.label}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-white/25 group-hover:text-white/45 transition-all duration-300 ${
                    isCollapsed ? '-rotate-90' : ''
                  }`}
                  strokeWidth={2.4}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        data-testid={`admin-nav-${item.path.split('/').pop()}`}
                        className={`relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-all duration-200 group ${
                          isActive
                            ? 'bg-orange-burnt/12 text-white'
                            : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-orange-burnt rounded-r-full" />
                        )}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`shrink-0 transition-colors ${isActive ? 'text-orange-burnt' : 'text-white/40 group-hover:text-white/75'}`}>
                            {item.icon}
                          </span>
                          <span className="truncate text-[13px]">{item.name}</span>
                        </div>
                        {item.badge != null && (
                          <span className="bg-orange-burnt text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                            {item.badge}
                          </span>
                        )}
                        {item.badgeText && (
                          <span className="bg-gold-accent/15 text-gold-accent border border-gold-accent/30 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                            {item.badgeText}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User profile + actions */}
      <div className="p-3 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName || 'Avatar'}
              className="w-9 h-9 rounded-full object-cover border border-orange-burnt/30 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-burnt/20 to-orange-burnt/5 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt font-display font-extrabold text-[11px] shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[11px] font-display font-bold text-white truncate leading-tight">
                {fullName || 'Admin User'}
              </p>
            </div>
            {role && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-block text-[7px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider leading-none ${RoleBadge[role] || RoleBadge.student}`}>
                  {getRoleDisplayName(role)}
                </span>
                <span className="text-[8px] text-white/40 font-sans tracking-wide truncate">
                  {getPositionTitle(role)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={toggleDarkMode}
            data-testid="admin-theme-toggle"
            className="flex flex-col items-center gap-1 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.04] transition-all"
            title={isDark ? 'Switch to light' : 'Switch to dark'}
          >
            {isDark ? <Sun className="w-4 h-4" strokeWidth={2.2} /> : <Moon className="w-4 h-4" strokeWidth={2.2} />}
            <span className="text-[8px] font-bold uppercase tracking-wider">Theme</span>
          </button>
          <a
            href="/"
            className="flex flex-col items-center gap-1 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.04] transition-all"
            title="Open public website"
          >
            <Globe className="w-4 h-4" strokeWidth={2.2} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Site</span>
          </a>
          <button
            onClick={handleLogout}
            data-testid="admin-logout"
            className="flex flex-col items-center gap-1 py-2 rounded-lg text-red-400/85 hover:text-red-300 hover:bg-red-500/8 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.2} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
