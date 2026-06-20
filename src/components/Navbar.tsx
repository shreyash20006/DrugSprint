import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, ChevronDown, Sun, Moon, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useThemeContext } from '../lib/ThemeProvider';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { CommandPalette } from './CommandPalette';
import { NotificationBell } from './NotificationBell';
import { DNALoader } from './DNALoader';
import { ProfileMenu } from './ProfileMenu';

const getPortalPath = (role?: string | null): string => {
  if (!role) return '/admin';
  const rolePaths: Record<string, string> = {
    super_admin: '/super-admin',
    admin: '/admin/dashboard',
    developer: '/developer',
    president: '/president',
    vice_president: '/vice-president',
    general_secretary: '/general-secretary',
    secretary: '/secretary',
    treasurer: '/treasurer',
    coordinator: '/admin/dashboard',
    student: '/dashboard'
  };
  return rolePaths[role] || '/dashboard';
};

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState<string>('');
  const [announcementEnabled, setAnnouncementEnabled] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();
  const { studentProfile, signInWithGoogle } = useStudentAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      // We don't set false on success because the browser redirects to Google OAuth
    } catch (e) {
      console.error(e);
      setIsLoggingIn(false);
    }
  };

  // Listen for Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data } = await supabase.from('settings').select('*');
        if (data) {
          const map: Record<string, string> = {};
          data.forEach((row: any) => { map[row.key] = row.value; });
          setAnnouncementText(map['announcement_text'] || '');
          setAnnouncementEnabled(map['announcement_enabled'] === 'true');
        }
      } catch (err) {
        console.error('Error fetching announcement settings:', err);
      }
    };
    fetchAnnouncement();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Council', path: '/council' },
    { name: 'Ask', path: '/ask' },
    { name: 'Notices', path: '/notices' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/media' },
  ];

  const moreLinks = [
    { name: 'Achievements', path: '/achievements', icon: '🏆', desc: 'Student hall of fame' },
    { name: 'Vote Now', path: '/vote', icon: '🗳️', desc: 'Participate in active polls' },
    { name: 'Leaderboard', path: '/leaderboard', icon: '🏆', desc: 'Top achievers', desktopOnly: true },
    { name: 'Message Board', path: '/board', icon: '💬', desc: 'Community board' },
    { name: 'Study Store', path: '/store', icon: '📚', desc: 'Syllabus handbooks & exam keys', desktopOnly: true },
    { name: 'Study Resources', path: '/resources', icon: '📂', desc: 'Share & download student notes' },
    { name: 'Lost & Found', path: '/lost-found', icon: '🔍', desc: 'Report lost or found belongings' },
    { name: 'My Calendar', path: '/calendar', icon: '📅', desc: 'Your saved events', desktopOnly: true },
    { name: 'Exam Schedule', path: '/exams', icon: '🗓️', desc: 'B.Pharm semester timetables' },
    { name: 'Mentors', path: '/mentors', icon: '🤝', desc: 'Connect with senior guides' },
    { name: 'Newsletter', path: '/newsletter', icon: '📰', desc: 'Monthly publications' },
    { name: 'Report Issue', path: '/complaint', icon: '🆘', desc: 'File anonymous complaint', highlight: true },
  ];


  const isMoreActive = moreLinks.some((link) => location.pathname === link.path);

  return (
    <>
      <header
        id="navbar"
        style={{
          background: isScrolled ? 'rgba(13, 27, 62, 0.95)' : 'transparent',
          borderBottom: isScrolled ? '1px solid rgba(200, 75, 14, 0.2)' : '1px solid transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        }}
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled
            ? 'border-b py-2.5 shadow-2xl'
            : 'py-4'
        }`}
      >
        {/* Dynamic Announcement Bar - upgraded with sleek glow */}
        {announcementEnabled && announcementText && (
          <div className="w-full bg-gradient-to-r from-orange-burnt to-[#E06D2B] py-2 px-4 text-white text-[10px] sm:text-xs font-display font-bold tracking-wide flex items-center space-x-2 shadow-inner border-b border-white/5 relative overflow-hidden">
            <div className="bg-white/20 border border-white/30 px-2 py-0.5 rounded text-[8px] sm:text-[9px] uppercase tracking-wider animate-pulse shrink-0 relative z-10 shadow-md">
              LATEST
            </div>
            <div className="flex-1 overflow-hidden relative flex items-center">
              <div className="animate-marquee hover:opacity-90 cursor-default">
                <span className="pr-12">{announcementText}</span>
                <span className="pr-12">{announcementText}</span>
                <span className="pr-12">{announcementText}</span>
                <span className="pr-12">{announcementText}</span>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & College Name */}
          <Link to="/" className="flex items-center space-x-3 group relative z-50" data-testid="navbar-logo-link">
            <motion.div
              className="relative w-10 h-10 rounded-xl shrink-0 overflow-hidden border border-white/10 shadow-lg group-hover:border-orange-burnt/50 transition-colors"
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 320, damping: 14 }}
            >
              {/* Animated gradient ring on hover */}
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    'conic-gradient(from 0deg, #D65A1E, #FFB338, #D65A1E, #142B5C, #D65A1E)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
              />
              <div className="absolute inset-[2px] rounded-[10px] bg-[#050B18] group-hover:bg-[#0A1428] transition-colors" />
              <img
                src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg"
                alt="TGPCOP Logo"
                className="w-full h-full object-cover error-fallback-hide absolute inset-0 transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <GraduationCap className="w-5 h-5 text-orange-burnt absolute inset-0 m-auto" />
            </motion.div>
            <div>
              <span
                className="font-display font-extrabold text-lg sm:text-xl tracking-tight block leading-none group-hover:text-orange-burnt transition-colors"
                style={{ color: isScrolled ? 'var(--text-primary)' : '#ffffff' }}
              >
                TGPCOP
              </span>
              <span className="text-[9px] sm:text-[10px] opacity-80 block tracking-widest uppercase font-semibold text-orange-burnt mt-0.5">
                Student Council
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  style={!isScrolled ? { color: 'rgba(255,255,255,0.85)' } : {}}
                  className={`relative font-display font-semibold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:text-orange-burnt px-2 py-2 ${
                    isActive
                      ? 'text-orange-burnt'
                      : 'hover:text-orange-burnt'
                  }`}
                  data-active={isActive ? 'true' : 'false'}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-burnt to-gold-accent"
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    />
                  )}
                </NavLink>
              );
            })}

            {/* Desktop More Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsMoreDropdownOpen(true)}
              onMouseLeave={() => setIsMoreDropdownOpen(false)}
            >
              <button
                className={`flex items-center space-x-1 font-display font-semibold text-xs sm:text-sm tracking-wide transition-all duration-300 hover:text-orange-burnt px-2 py-2 outline-none ${
                  isMoreActive
                    ? 'text-orange-burnt font-extrabold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isMoreDropdownOpen ? 'rotate-180 text-orange-burnt' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isMoreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-[480px] sm:w-[520px] bg-[#080F25]/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-3 border border-white/10 z-50 overflow-hidden text-white"
                  >
                    <div className="grid grid-cols-2 gap-1.5">
                      {moreLinks.map((subLink) => (
                        <Link
                          key={subLink.path}
                          to={subLink.path}
                          onClick={() => setIsMoreDropdownOpen(false)}
                          className={`block px-3.5 py-3 hover:bg-white/5 rounded-xl transition-all duration-200 ${
                            subLink.highlight ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-red-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <span className="text-base mt-0.5 shrink-0">{subLink.icon}</span>
                            <div>
                              <span
                                className={`block text-xs font-semibold ${
                                  subLink.highlight ? 'text-red-400 font-extrabold' : 'text-white hover:text-orange-burnt'
                                }`}
                              >
                                {subLink.name}
                              </span>
                              <span className="block text-[10px] text-white/50 leading-tight mt-0.5">
                                {subLink.desc}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Search Button */}
            <button
              id="search-btn-desktop"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search palette"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white shrink-0 cursor-pointer"
            >
              <Search className="w-5 h-5 text-white" />
            </button>

            {/* Desktop Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-desktop"
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
              className="relative w-14 h-7 rounded-full border border-white/15 bg-white/10 hover:bg-white/15 flex items-center px-1 transition-all duration-300 overflow-hidden shrink-0 cursor-pointer"
            >
              <motion.div
                className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-orange-burnt to-gold-accent shadow-md shadow-orange-burnt/30 flex items-center justify-center"
                animate={{ x: theme === 'dark' ? 0 : 26 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === 'dark' ? (
                    <motion.div key="moon" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Moon className="w-3 h-3 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="sun" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Sun className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </button>

            {/* Student Login / Profile Menu (role-aware portals) */}
            {studentProfile ? (
              <ProfileMenu profile={studentProfile} />
            ) : (
              /* UNIFIED LOGIN — single entry, role-aware redirect on the login page itself */
              <Link
                to="/login"
                data-testid="navbar-signin-link"
                className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-[10px] font-display font-bold uppercase tracking-widest text-white transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-2 shrink-0 shadow-lg shadow-orange-burnt/15 border border-white/10 hover:shadow-orange-burnt/25 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#fff" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-.97 4.14v3.45h1.59c3.27-3 5.43-7.42 5.43-12.44z" opacity="0.85"/>
                  <path fill="#fff" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.17 0-5.85-2.14-6.81-5.02H1.23v3.1A11.996 11.996 0 0012 24z" opacity="0.85"/>
                  <path fill="#fff" d="M5.19 14.24A7.2 7.2 0 014.8 12c0-.79.13-1.57.39-2.31V6.59H1.23A11.96 11.96 0 000 12c0 2.23.6 4.32 1.66 6.13l3.53-2.89z" opacity="0.85"/>
                  <path fill="#fff" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.34 0 3.37 2.67 1.23 6.59l3.96 3.1c.96-2.88 3.64-5.02 6.81-5.02z" opacity="0.85"/>
                </svg>
                <span>Sign In</span>
              </Link>
            )}
          </nav>

          {/* Mobile Right Icons & Hamburger */}
          <div className="flex md:hidden items-center space-x-1 relative z-50">
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search palette"
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-white cursor-pointer"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white cursor-pointer"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer (Pure CSS Transform Optimization) */}
      {/* Backdrop */}
      <div
        onClick={() => setIsMobileMenuOpen(false)}
        className={`fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity duration-250 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-in Drawer with GPU layer force CSS translate */}
      <div
        style={{ background: '#0D1B3E', borderLeft: '1px solid rgba(200, 75, 14, 0.2)' }}
        className={`fixed right-0 top-0 bottom-0 w-[290px] p-6 z-50 shadow-2xl flex flex-col justify-between md:hidden overflow-y-auto transition-transform duration-250 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <span className="font-display font-extrabold text-lg text-orange-burnt uppercase tracking-wider">
              TGPCOP Council
            </span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <div key={link.path}>
                  <Link
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`font-display font-semibold text-sm py-2 flex items-center justify-between border-b border-white/5 transition-colors ${
                      isActive ? 'text-orange-burnt font-extrabold' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-burnt shadow-md shadow-orange-burnt/50" />
                    )}
                  </Link>
                </div>
              );
            })}

            {/* Expandable Mobile "More" Items */}
            <div>
              <button
                onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
                className="w-full font-display font-semibold text-sm py-2 flex items-center justify-between outline-none text-white/80 cursor-pointer"
              >
                <span>More Features</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 ${
                    isMobileMoreOpen ? 'rotate-180 text-orange-burnt' : ''
                  }`}
                />
              </button>

              {isMobileMoreOpen && (
                <div className="pl-4 pb-2 mt-2 space-y-3 overflow-hidden flex flex-col border-l border-white/5 text-xs">
                  {moreLinks.filter(l => !l.desktopOnly).map((subLink) => {
                    const isSubActive = location.pathname === subLink.path;
                    return (
                      <Link
                        key={subLink.path}
                        to={subLink.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`py-1 flex items-center space-x-2 transition-colors ${
                          isSubActive ? 'text-orange-burnt font-extrabold' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <span>{subLink.icon}</span>
                        <span>{subLink.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5">
          {/* Mobile Student Profile / Sign In */}
          {studentProfile ? (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-between py-3 px-4 mb-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white"
            >
              <div className="flex items-center space-x-3">
                {studentProfile.avatar_url ? (
                  <img
                    src={studentProfile.avatar_url}
                    alt={studentProfile.full_name || 'Student'}
                    className="w-8 h-8 rounded-full object-cover border border-orange-burnt"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-orange-burnt flex items-center justify-center text-xs font-bold">
                    {(studentProfile.full_name || 'Student').charAt(0)}
                  </div>
                )}
                <div className="text-left">
                  <span className="block font-display font-bold text-xs">{studentProfile.full_name || 'Student'}</span>
                  <span className="block text-[9px] text-white/50">{studentProfile.email}</span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-orange-burnt tracking-wide">VIEW</span>
            </Link>
          ) : (
            <button
              onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center justify-center space-x-3 py-3 px-4 mb-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-burnt/30 text-white font-display text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-98 transition-all shadow-lg shadow-black/10"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-.97 4.14v3.45h1.59c3.27-3 5.43-7.42 5.43-12.44z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.17 0-5.85-2.14-6.81-5.02H1.23v3.1A11.996 11.996 0 0012 24z"/>
                <path fill="#FBBC05" d="M5.19 14.24A7.2 7.2 0 014.8 12c0-.79.13-1.57.39-2.31V6.59H1.23A11.96 11.96 0 000 12c0 2.23.6 4.32 1.66 6.13l3.53-2.89z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.34 0 3.37 2.67 1.23 6.59l3.96 3.1c.96-2.88 3.64-5.02 6.81-5.02z"/>
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {/* Mobile Theme Toggle */}
          <button
            id="theme-toggle-mobile"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
            className="w-full flex items-center justify-between py-3 px-4 mb-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <span className="font-display font-semibold text-xs text-white/80">
              {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <div className="relative w-12 h-6 rounded-full border border-white/15 bg-white/10 flex items-center px-1">
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-burnt to-gold-accent transition-transform duration-250 ease-out"
                style={{ transform: theme === 'dark' ? 'translateX(0)' : 'translateX(22px)' }}
              />
            </div>
          </button>

          <Link
            to={getPortalPath(studentProfile?.role)}
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-full text-center py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-orange-burnt/15 transition-all block mb-4 active:scale-98 border border-white/5"
          >
            🔑 Admin Portal
          </Link>
          <div className="text-center text-[10px] text-white/45 tracking-wider">
            TGPCOP Student Council © 2026
          </div>
        </div>
      </div>

      {/* Global Command Palette Search */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Global Login Loader Overlay */}
      <AnimatePresence>
        {isLoggingIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050B18]/90 backdrop-blur-md"
          >
            <DNALoader />
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 font-display font-bold text-white tracking-widest uppercase text-sm"
            >
              Authorizing via Google...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
