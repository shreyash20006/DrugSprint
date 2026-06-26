import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import {
  Home, Megaphone, BookOpen, Calendar, User,
  Bell, ArrowLeft, Sparkles, Grid, X,
  Camera, Users, Clock, Phone, Search as SearchIcon,
  Newspaper, Sun, Moon, ChevronRight
} from 'lucide-react';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { DNALoader } from '../../components/DNALoader';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Login } from '../screens/Login';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeContext } from '../../lib/ThemeProvider';
import { PushHandler } from '../notifications/PushHandler';

// Lazy-loaded mobile screens
const DashboardScreen = lazy(() => import('../screens/Dashboard'));
const NoticesScreen = lazy(() => import('../screens/Notices'));
const ResourcesScreen = lazy(() => import('../screens/Resources'));
const EventsScreen = lazy(() => import('../screens/Events'));
const ProfileScreen = lazy(() => import('../screens/Profile'));

// Lazy-loaded sub-screens
const LostAndFoundScreen = lazy(() => import('../screens/LostAndFound'));
const GPATPrepScreen = lazy(() => import('../screens/GPATPrep'));
const CouncilScreen = lazy(() => import('../screens/Council'));
const AskScreen = lazy(() => import('../screens/Ask'));
const GalleryScreen = lazy(() => import('../screens/Gallery'));
const ReportBugScreen = lazy(() => import('../screens/ReportBug'));
const VoteScreen = lazy(() => import('../screens/Vote'));
const AchievementsScreen = lazy(() => import('../screens/Achievements'));
const NewsletterScreen = lazy(() => import('../screens/Newsletter'));
const ComplaintScreen = lazy(() => import('../screens/Complaint'));
const MentorsScreen = lazy(() => import('../screens/Mentors'));
const MyCalendarScreen = lazy(() => import('../screens/MyCalendar'));
const LeaderboardScreen = lazy(() => import('../screens/Leaderboard'));
const MessageBoardScreen = lazy(() => import('../screens/MessageBoard'));
const ContactScreen = lazy(() => import('../screens/Contact'));
const SearchScreen = lazy(() => import('../screens/Search'));
const ExamScheduleScreen = lazy(() => import('../screens/ExamSchedule'));
const TermsScreen = lazy(() => import('../screens/Terms'));
const RefundsScreen = lazy(() => import('../screens/Refunds'));
const NewsScreen = lazy(() => import('../screens/News'));
const StudyMaterialScreen = lazy(() => import('../../pages/StudyMaterial'));
const ServicesScreen = lazy(() => import('../../pages/Services'));
const ServiceDetailScreen = lazy(() => import('../../pages/ServiceDetail'));

// More-drawer quick links config
const MORE_ITEMS = [
  { label: 'Gallery',         icon: Camera,     route: '/gallery',       color: 'text-purple-400',   bg: 'bg-purple-500/10',   border: 'border-purple-500/20' },
  { label: 'Council',         icon: Users,       route: '/council',       color: 'text-blue-400',     bg: 'bg-blue-500/10',     border: 'border-blue-500/20'   },
  { label: 'Services',        icon: Grid,        route: '/services',      color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20'},
  { label: 'Exam Schedule',   icon: Clock,       route: '/exams',         color: 'text-amber-400',    bg: 'bg-amber-500/10',    border: 'border-amber-500/20'  },
  { label: 'Contact',         icon: Phone,       route: '/contact',       color: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20'},
  { label: 'Search',          icon: SearchIcon,  route: '/search',        color: 'text-cyan-400',     bg: 'bg-cyan-500/10',     border: 'border-cyan-500/20'   },
  { label: 'News',            icon: Newspaper,   route: '/news',          color: 'text-orange-400',   bg: 'bg-orange-500/10',   border: 'border-orange-500/20' },
  { label: 'Study Material',  icon: BookOpen,    route: '/study-material',color: 'text-orange-400',   bg: 'bg-orange-500/10',   border: 'border-orange-500/20' },
  { label: 'Profile',         icon: User,        route: '/profile',       color: 'text-pink-400',     bg: 'bg-pink-500/10',     border: 'border-pink-500/20'   },
  { label: 'GPAT Prep',       icon: BookOpen,    route: '/gpat-prep',     color: 'text-indigo-400',   bg: 'bg-indigo-500/10',   border: 'border-indigo-500/20' },
  { label: 'Lost & Found',    icon: SearchIcon,  route: '/lost-found',    color: 'text-red-400',      bg: 'bg-red-500/10',      border: 'border-red-500/20'    },
  { label: 'Leaderboard',     icon: Sparkles,    route: '/leaderboard',   color: 'text-yellow-400',   bg: 'bg-yellow-500/10',   border: 'border-yellow-500/20' },
  { label: 'Message Board',   icon: Megaphone,   route: '/board',         color: 'text-teal-400',     bg: 'bg-teal-500/10',     border: 'border-teal-500/20'   },
  { label: 'Achievements',    icon: Sparkles,    route: '/achievements',  color: 'text-gold-400',     bg: 'bg-amber-500/10',    border: 'border-amber-500/20'  },
];

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: 18 },
  in:      { opacity: 1, x: 0  },
  out:     { opacity: 0, x: -18 },
};
const pageTransition = { type: 'tween' as const, ease: 'easeInOut' as const, duration: 0.22 };

export const MobileLayout: React.FC = () => {
  const { studentProfile } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeContext();

  const [prnSkipped, setPrnSkipped] = useState(() => {
    return localStorage.getItem('skip_prn_verification') === 'true';
  });

  const [isPrnVerified, setIsPrnVerified] = useState(false);
  const [checkingPrn, setCheckingPrn] = useState(true);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const [unreadNotices, setUnreadNotices] = useState(0);

  useEffect(() => {
    setPrnSkipped(localStorage.getItem('skip_prn_verification') === 'true');
  }, [studentProfile]);

  useEffect(() => {
    if (!studentProfile) {
      setIsPrnVerified(false);
      setCheckingPrn(false);
      return;
    }
    const checkVerification = async () => {
      try {
        const { data } = await supabase
          .from('student_verifications')
          .select('verification_status')
          .eq('user_id', studentProfile.id)
          .maybeSingle();
        setIsPrnVerified(data?.verification_status === 'verified');
      } catch {
        setIsPrnVerified(false);
      } finally {
        setCheckingPrn(false);
      }
    };
    checkVerification();
  }, [studentProfile]);

  // Fetch unread notices count for badge
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('notices')
          .select('id', { count: 'exact', head: true })
          .order('created_at', { ascending: false });
        setUnreadNotices(Math.min(count || 0, 99));
      } catch { /* silent */ }
    };
    fetchCount();
  }, []);

  if (!studentProfile) {
    return <Login onLoginComplete={() => {}} />;
  }

  if (!isPrnVerified && !prnSkipped && !checkingPrn) {
    return <Login onLoginComplete={() => setPrnSkipped(true)} />;
  }

  const getActiveTab = () => {
    const p = location.pathname.toLowerCase();
    if (p === '/' || p === '/dashboard' || p === '/home') return 'home';
    if (p.startsWith('/notices')) return 'notices';
    if (p.startsWith('/resources') || p.startsWith('/store')) return 'resources';
    if (p.startsWith('/events')) return 'events';
    return '';
  };

  const activeTab = getActiveTab();

  const handleTabChange = useCallback((tab: 'home' | 'notices' | 'resources' | 'events') => {
    setIsMoreDrawerOpen(false);
    switch (tab) {
      case 'home':      navigate('/');          break;
      case 'notices':   navigate('/notices');   break;
      case 'resources': navigate('/resources'); break;
      case 'events':    navigate('/events');    break;
      default:          navigate('/');
    }
  }, [navigate]);

  const handleMoreNav = useCallback((route: string) => {
    setIsMoreDrawerOpen(false);
    navigate(route);
  }, [navigate]);

  const getPageTitle = (path: string) => {
    const p = path.toLowerCase();
    if (p.startsWith('/lost-found'))    return 'Lost & Found Board';
    if (p.startsWith('/gpat-prep'))     return 'GPAT & NIPER Prep';
    if (p.startsWith('/council'))       return 'Council Directory';
    if (p.startsWith('/ask'))           return 'Ask Council';
    if (p.startsWith('/gallery') || p.startsWith('/media')) return 'Photo Gallery';
    if (p.startsWith('/report'))        return 'Report Bug';
    if (p.startsWith('/vote'))          return 'Live Polls';
    if (p.startsWith('/achievements'))  return 'Achievements';
    if (p.startsWith('/newsletter'))    return 'Newsletters';
    if (p.startsWith('/complaint'))     return 'Complaint Portal';
    if (p.startsWith('/mentors'))       return 'Mentorship';
    if (p.startsWith('/calendar'))      return 'Academic Calendar';
    if (p.startsWith('/leaderboard'))   return 'Leaderboard';
    if (p.startsWith('/board'))         return 'Message Board';
    if (p.startsWith('/contact'))       return 'Contact Support';
    if (p.startsWith('/terms'))         return 'Terms & Policies';
    if (p.startsWith('/refunds'))       return 'Refund Policy';
    if (p.startsWith('/search'))        return 'Global Search';
    if (p.startsWith('/exams') || p.startsWith('/exam-schedule')) return 'Exam Timetable';
    if (p.startsWith('/news'))          return 'Council News';
    if (p.startsWith('/study-material')) return 'Study Material';
    if (p.startsWith('/profile'))       return 'My Profile';
    if (p.startsWith('/services/'))     return 'Service Details';
    if (p === '/services')              return 'Student Services';
    return '';
  };

  const PRIMARY_ROUTES = ['/', '/dashboard', '/home', '/notices', '/resources', '/store', '/events', '/services'];
  const isSubRoute = !PRIMARY_ROUTES.includes(location.pathname.toLowerCase());
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-white">
      {/* Push handler — mounts once, handles FCM deep links */}
      <PushHandler />

      {/* ── Top App Bar ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-[#080F25]/90 backdrop-blur-md border-b border-white/5 shadow-sm">
        {isSubRoute && pageTitle ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <h1 className="font-display font-extrabold text-sm tracking-wide text-white capitalize">
              {pageTitle}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-burnt/10 border border-orange-burnt/35 flex items-center justify-center overflow-hidden">
              <img
                alt="Council Logo"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjyoTFvyEFR975TtIY9lyKfrLHfAXGGF7JVgRdFBnE3cjc_gdwumA6XC0MYZ8tDiGPAd-05hNEfr_es_OMw0IXeZI0U3ByOSbo7Aw6AWqidd0bijT8_gmtzYoRal4igXr20dWvPdxxXpI6MAorWCQbO3ZWGMqvhJ1-k2d_VLPgdNUj20x2iOPW87FxHEiITNw-wgKgekzPjPx8DckrX8giHDyjcoz5gw-mLAv8it8EbMsQEgTAoAXLylFsQjS52NE90FdsyerwVJc"
              />
            </div>
            <h1 className="font-display font-extrabold text-base tracking-wide text-orange-burnt uppercase">
              TGPCOP COUNCIL
            </h1>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/70 active:scale-95 transition-transform"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark'
              ? <Sun className="w-4 h-4 text-amber-400" />
              : <Moon className="w-4 h-4 text-indigo-400" />
            }
          </button>

          {studentProfile && (
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full border border-orange-burnt/25 overflow-hidden active:scale-95 transition-transform"
            >
              {studentProfile.avatar_url ? (
                <img src={studentProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-burnt/10 flex items-center justify-center text-xs text-orange-burnt font-bold">
                  {studentProfile.full_name?.charAt(0) || 'S'}
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 active:scale-95 transition-transform shadow-md shadow-purple-500/10"
            title="Ask Council AI"
          >
            <Sparkles className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
          </button>
          <button
            onClick={() => handleTabChange('notices')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/80 active:scale-95 transition-transform relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotices > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-grow pt-16 pb-24 px-4 overflow-y-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <DNALoader />
          </div>
        }>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="h-full"
            >
              <Routes location={location}>
                {/* Primary tabs */}
                <Route path="/"          element={<DashboardScreen onNavigateTab={handleTabChange as any} />} />
                <Route path="/dashboard" element={<DashboardScreen onNavigateTab={handleTabChange as any} />} />
                <Route path="/home"      element={<DashboardScreen onNavigateTab={handleTabChange as any} />} />
                <Route path="/notices"   element={<NoticesScreen />} />
                <Route path="/resources" element={<ResourcesScreen />} />
                <Route path="/store"     element={<ResourcesScreen />} />
                <Route path="/events"    element={<EventsScreen />} />

                {/* More-drawer sub-screens */}
                <Route path="/gallery"        element={<GalleryScreen />} />
                <Route path="/media"          element={<GalleryScreen />} />
                <Route path="/council"        element={<CouncilScreen />} />
                <Route path="/exams"          element={<ExamScheduleScreen />} />
                <Route path="/exam-schedule"  element={<ExamScheduleScreen />} />
                <Route path="/contact"        element={<ContactScreen />} />
                <Route path="/search"         element={<SearchScreen />} />
                <Route path="/news"           element={<NewsScreen />} />
                <Route path="/study-material" element={<StudyMaterialScreen />} />
                <Route path="/profile"        element={<ProfileScreen />} />
                <Route path="/services"       element={<ServicesScreen />} />
                <Route path="/services/:serviceId" element={<ServiceDetailScreen />} />

                {/* Other sub-routes */}
                <Route path="/lost-found"    element={<LostAndFoundScreen />} />
                <Route path="/gpat-prep"     element={<GPATPrepScreen />} />
                <Route path="/ask"           element={<AskScreen />} />
                <Route path="/report"        element={<ReportBugScreen />} />
                <Route path="/vote"          element={<VoteScreen />} />
                <Route path="/achievements"  element={<AchievementsScreen />} />
                <Route path="/newsletter"    element={<NewsletterScreen />} />
                <Route path="/complaint"     element={<ComplaintScreen />} />
                <Route path="/mentors"       element={<MentorsScreen />} />
                <Route path="/calendar"      element={<MyCalendarScreen />} />
                <Route path="/leaderboard"   element={<LeaderboardScreen />} />
                <Route path="/board"         element={<MessageBoardScreen />} />
                <Route path="/terms"         element={<TermsScreen />} />
                <Route path="/terms-and-conditions" element={<TermsScreen />} />
                <Route path="/refunds"       element={<RefundsScreen />} />
                <Route path="/refunds-and-cancellations" element={<RefundsScreen />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-2 bg-[#080F25]/90 backdrop-blur-md border-t border-white/5 shadow-lg rounded-t-2xl">
        {/* Home */}
        <button
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'home' ? 'text-orange-burnt' : 'text-white/45'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Home</span>
          {activeTab === 'home' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        {/* Notices */}
        <button
          onClick={() => handleTabChange('notices')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'notices' ? 'text-orange-burnt' : 'text-white/45'
          }`}
        >
          <Megaphone className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Notices</span>
          {activeTab === 'notices' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        {/* Events */}
        <button
          onClick={() => handleTabChange('events')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'events' ? 'text-orange-burnt' : 'text-white/45'
          }`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Events</span>
          {activeTab === 'events' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        {/* Resources */}
        <button
          onClick={() => handleTabChange('resources')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'resources' ? 'text-orange-burnt' : 'text-white/45'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Resources</span>
          {activeTab === 'resources' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        {/* More */}
        <button
          onClick={() => setIsMoreDrawerOpen(true)}
          className="flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative text-white/45"
        >
          <Grid className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">More</span>
        </button>
      </nav>

      {/* ── More Drawer ── */}
      <AnimatePresence>
        {isMoreDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => setIsMoreDrawerOpen(false)}
            />

            {/* Slide-up sheet */}
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-[#080F25] border-t border-white/10 rounded-t-3xl px-4 pt-3 pb-10 shadow-2xl max-h-[75vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

              {/* Header row */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-extrabold text-base text-white tracking-wide">
                  More Features
                </h2>
                <button
                  onClick={() => setIsMoreDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of quick-access cards */}
              <div className="grid grid-cols-3 gap-3">
                {MORE_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.route}
                      onClick={() => handleMoreNav(item.route)}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border ${item.bg} ${item.border} active:scale-95 transition-transform`}
                    >
                      <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-display font-bold text-[10px] uppercase tracking-wider ${item.color} text-center leading-tight`}>
                        {item.label}
                      </span>
                      <ChevronRight className={`w-3 h-3 ${item.color} opacity-50`} />
                    </button>
                  );
                })}
              </div>

              {/* Theme toggle shortcut in drawer */}
              <div className="mt-5 flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  {theme === 'dark'
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-indigo-400" />
                  }
                  <span className="font-display font-bold text-xs text-white">
                    {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileLayout;
