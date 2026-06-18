import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Settings, LogOut, Wrench, Crown, ShieldCheck,
  ChevronDown, ArrowUpRight, User, BadgeCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StudentProfile {
  avatar_url?: string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface ProfileMenuProps {
  profile: StudentProfile;
}

interface PortalLink {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  tone: 'orange' | 'gold' | 'emerald' | 'navy' | 'red';
  description: string;
  hideOn?: string;
}

const ROLE_DISPLAY: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  developer: 'Developer',
  president: 'President',
  vice_president: 'Vice President',
  general_secretary: 'General Secretary',
  secretary: 'Secretary',
  treasurer: 'Treasurer',
  coordinator: 'Coordinator',
  student: 'Student',
};

const ROLE_BADGE: Record<string, string> = {
  super_admin: 'bg-red-500/15 text-red-400 border-red-500/30',
  developer: 'bg-gold-accent/15 text-gold-accent border-gold-accent/30',
  admin: 'bg-orange-burnt/15 text-orange-burnt border-orange-burnt/30',
  president: 'bg-gold-accent/15 text-gold-accent border-gold-accent/30',
  vice_president: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  general_secretary: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  secretary: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  treasurer: 'bg-emerald-500/12 text-emerald-400 border-emerald-500/25',
  coordinator: 'bg-orange-burnt/12 text-orange-burnt border-orange-burnt/25',
  student: 'bg-white/[0.04] text-white/65 border-white/10',
};

// Build the list of portals available to this role
const buildPortalsForRole = (role?: string | null): PortalLink[] => {
  const portals: PortalLink[] = [];

  // Student-side dashboard (always available if signed in)
  portals.push({
    label: 'My Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    tone: 'navy',
    description: 'View your activity & quick links',
  });

  if (role === 'super_admin') {
    portals.push({
      label: 'Super Admin Panel',
      path: '/super-admin',
      icon: Crown,
      tone: 'red',
      description: 'Full system access',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Daily operations console',
    });
  }

  if (role === 'developer' || role === 'super_admin') {
    portals.push({
      label: 'Developer Console',
      path: '/admin/developer',
      icon: Wrench,
      tone: 'gold',
      description: 'Debug, logs & dev tools',
    });
  }

  if (role === 'admin' || role === 'coordinator') {
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Council operations',
    });
  }

  if (role === 'president') {
    portals.push({
      label: "President's Console",
      path: '/president',
      icon: Crown,
      tone: 'gold',
      description: 'Executive overview',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Detailed operations',
    });
  }

  if (role === 'vice_president') {
    portals.push({
      label: "VP's Console",
      path: '/vice-president',
      icon: BadgeCheck,
      tone: 'orange',
      description: 'Executive overview',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Detailed operations',
    });
  }

  if (role === 'general_secretary') {
    portals.push({
      label: "GS Console",
      path: '/general-secretary',
      icon: BadgeCheck,
      tone: 'orange',
      description: 'Coordination centre',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Detailed operations',
    });
  }

  if (role === 'secretary') {
    portals.push({
      label: "Secretary Console",
      path: '/secretary',
      icon: BadgeCheck,
      tone: 'orange',
      description: 'Document & minutes',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Detailed operations',
    });
  }

  if (role === 'treasurer') {
    portals.push({
      label: "Treasurer Console",
      path: '/treasurer',
      icon: BadgeCheck,
      tone: 'emerald',
      description: 'Finance & payments',
    });
    portals.push({
      label: 'Admin Dashboard',
      path: '/admin/dashboard',
      icon: ShieldCheck,
      tone: 'orange',
      description: 'Detailed operations',
    });
  }

  return portals;
};

const TONE_STYLES = {
  orange: 'bg-orange-burnt/10 border-orange-burnt/25 text-orange-burnt',
  gold: 'bg-gold-accent/10 border-gold-accent/25 text-gold-accent',
  emerald: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  red: 'bg-red-500/10 border-red-500/25 text-red-400',
  navy: 'bg-white/[0.04] border-white/10 text-white/75',
};

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ profile }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = profile.role || 'student';
  const portals = buildPortalsForRole(role);
  const initials = (profile.full_name || profile.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = async () => {
    if (!window.confirm('Sign out of your account?')) return;
    await supabase.auth.signOut();
    setOpen(false);
    window.location.href = '/';
  };

  return (
    <div className="relative shrink-0 ml-2" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        data-testid="profile-menu-trigger"
        className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border transition-all ${
          open
            ? 'bg-orange-burnt/12 border-orange-burnt/35 text-white'
            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-orange-burnt/25 text-white'
        }`}
      >
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User'}
            className="w-7 h-7 rounded-full object-cover border border-orange-burnt/30"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white font-display font-extrabold text-[10px]">
            {initials}
          </div>
        )}
        <span className="text-[10px] font-display font-bold uppercase tracking-wider truncate max-w-[80px]">
          {(profile.full_name || 'User').split(' ')[0]}
        </span>
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2.4}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-[320px] origin-top-right z-[9999] rounded-2xl overflow-hidden bg-[#080F22] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            <div className="noise-overlay noise-soft" />

            {/* Header — identity */}
            <div className="relative p-4 border-b border-white/[0.06] bg-gradient-to-br from-orange-burnt/8 to-transparent">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-burnt/35"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center text-white font-display font-extrabold text-sm shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-sm text-white truncate leading-tight">
                    {profile.full_name || 'User'}
                  </p>
                  {profile.email && (
                    <p className="text-[10px] text-white/45 truncate font-sans mt-0.5">{profile.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span
                  className={`inline-flex items-center text-[9px] font-extrabold uppercase tracking-[0.16em] px-2 py-1 rounded-md border ${
                    ROLE_BADGE[role] || ROLE_BADGE.student
                  }`}
                >
                  <BadgeCheck className="w-2.5 h-2.5 mr-1" strokeWidth={2.4} />
                  {ROLE_DISPLAY[role] || 'User'}
                </span>
              </div>
            </div>

            {/* Portal list */}
            <div className="relative p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35 px-2 py-2">
                Your Portals
              </p>
              {portals.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Link
                    key={portal.path}
                    to={portal.path}
                    onClick={() => setOpen(false)}
                    data-testid={`profile-portal-${portal.path.split('/').pop()}`}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${TONE_STYLES[portal.tone]}`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-bold text-white truncate flex items-center gap-1.5">
                        {portal.label}
                        <ArrowUpRight className="w-3 h-3 text-white/30 group-hover:text-orange-burnt group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2.4} />
                      </p>
                      <p className="text-[10px] text-white/45 font-sans mt-0.5 truncate">{portal.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="relative border-t border-white/[0.06] p-2 grid grid-cols-3 gap-1">
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.04] transition"
              >
                <User className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
              </Link>
              <Link
                to="/profile/settings"
                onClick={() => setOpen(false)}
                className="flex flex-col items-center gap-1 py-2 rounded-lg text-white/55 hover:text-white hover:bg-white/[0.04] transition"
              >
                <Settings className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                data-testid="profile-signout"
                className="flex flex-col items-center gap-1 py-2 rounded-lg text-red-400/85 hover:text-red-300 hover:bg-red-500/8 transition"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
