import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Home, Megaphone, BookOpen, Calendar, User, Bell, ArrowLeft, Sparkles } from 'lucide-react';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { DNALoader } from '../../components/DNALoader';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Login } from '../screens/Login';

// Lazy-loaded mobile screens
const DashboardScreen = lazy(() => import('../screens/Dashboard'));
const NoticesScreen = lazy(() => import('../screens/Notices'));
const ResourcesScreen = lazy(() => import('../screens/Resources'));
const EventsScreen = lazy(() => import('../screens/Events'));
const ProfileScreen = lazy(() => import('../screens/Profile'));

// Lazy-loaded sub-screens
const LostAndFoundScreen = lazy(() => import('../screens/LostAndFound'));
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

export const MobileLayout: React.FC = () => {
  const { studentProfile } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [prnSkipped, setPrnSkipped] = useState(() => {
    return localStorage.getItem('skip_prn_verification') === 'true';
  });

  const [isPrnVerified, setIsPrnVerified] = useState(false);
  const [checkingPrn, setCheckingPrn] = useState(true);

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
        if (data && data.verification_status === 'verified') {
          setIsPrnVerified(true);
        } else {
          setIsPrnVerified(false);
        }
      } catch (err) {
        setIsPrnVerified(false);
      } finally {
        setCheckingPrn(false);
      }
    };
    checkVerification();
  }, [studentProfile]);

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
    if (p.startsWith('/profile')) return 'profile';
    return ''; // no tab highlighted for sub-routes
  };

  const activeTab = getActiveTab();

  const handleTabChange = (tab: 'home' | 'notices' | 'resources' | 'events' | 'profile') => {
    switch (tab) {
      case 'home':
        navigate('/');
        break;
      case 'notices':
        navigate('/notices');
        break;
      case 'resources':
        navigate('/resources');
        break;
      case 'events':
        navigate('/events');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        navigate('/');
    }
  };

  const getPageTitle = (path: string) => {
    const p = path.toLowerCase();
    if (p.startsWith('/lost-found')) return 'Lost & Found Board';
    if (p.startsWith('/council')) return 'Council Directory';
    if (p.startsWith('/ask')) return 'Ask Council';
    if (p.startsWith('/gallery') || p.startsWith('/media')) return 'Photo Gallery';
    if (p.startsWith('/report')) return 'Report Bug';
    if (p.startsWith('/vote')) return 'Live Polls';
    if (p.startsWith('/achievements')) return 'Achievements';
    if (p.startsWith('/newsletter')) return 'Newsletters';
    if (p.startsWith('/complaint')) return 'Complaint Portal';
    if (p.startsWith('/mentors')) return 'Mentorship';
    if (p.startsWith('/calendar')) return 'Academic Calendar';
    if (p.startsWith('/leaderboard')) return 'Leaderboard';
    if (p.startsWith('/board')) return 'Message Board';
    if (p.startsWith('/contact')) return 'Contact Support';
    if (p.startsWith('/terms')) return 'Terms & Policies';
    if (p.startsWith('/refunds')) return 'Refund Policy';
    if (p.startsWith('/search')) return 'Global Search';
    if (p.startsWith('/exams') || p.startsWith('/exam-schedule')) return 'Exam Timetable';
    return '';
  };

  const isSubRoute = !['/', '/dashboard', '/home', '/notices', '/resources', '/store', '/events', '/profile'].includes(location.pathname.toLowerCase());
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-[#050B18] text-white">
      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-[#080F25]/85 backdrop-blur-md border-b border-white/5 shadow-sm">
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
          {studentProfile && (
            <button 
              onClick={() => handleTabChange('profile')} 
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-burnt animate-pulse" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-16 pb-24 px-4 overflow-y-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <DNALoader />
          </div>
        }>
          <Routes>
            <Route path="/" element={<DashboardScreen onNavigateTab={handleTabChange} />} />
            <Route path="/dashboard" element={<DashboardScreen onNavigateTab={handleTabChange} />} />
            <Route path="/home" element={<DashboardScreen onNavigateTab={handleTabChange} />} />
            <Route path="/notices" element={<NoticesScreen />} />
            <Route path="/resources" element={<ResourcesScreen />} />
            <Route path="/store" element={<ResourcesScreen />} />
            <Route path="/events" element={<EventsScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />

            {/* Sub Routes */}
            <Route path="/lost-found" element={<LostAndFoundScreen />} />
            <Route path="/council" element={<CouncilScreen />} />
            <Route path="/ask" element={<AskScreen />} />
            <Route path="/gallery" element={<GalleryScreen />} />
            <Route path="/media" element={<GalleryScreen />} />
            <Route path="/report" element={<ReportBugScreen />} />
            <Route path="/vote" element={<VoteScreen />} />
            <Route path="/achievements" element={<AchievementsScreen />} />
            <Route path="/newsletter" element={<NewsletterScreen />} />
            <Route path="/complaint" element={<ComplaintScreen />} />
            <Route path="/mentors" element={<MentorsScreen />} />
            <Route path="/calendar" element={<MyCalendarScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            <Route path="/board" element={<MessageBoardScreen />} />
            <Route path="/contact" element={<ContactScreen />} />
            <Route path="/terms" element={<TermsScreen />} />
            <Route path="/terms-and-conditions" element={<TermsScreen />} />
            <Route path="/refunds" element={<RefundsScreen />} />
            <Route path="/refunds-and-cancellations" element={<RefundsScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/exams" element={<ExamScheduleScreen />} />
            <Route path="/exam-schedule" element={<ExamScheduleScreen />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 pb-safe px-2 bg-[#080F25]/90 backdrop-blur-md border-t border-white/5 shadow-lg rounded-t-2xl">
        <button 
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'home' ? 'text-orange-burnt font-bold' : 'text-white/45'
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Home</span>
          {activeTab === 'home' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange('notices')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'notices' ? 'text-orange-burnt font-bold' : 'text-white/45'
          }`}
        >
          <Megaphone className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Notices</span>
          {activeTab === 'notices' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange('resources')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'resources' ? 'text-orange-burnt font-bold' : 'text-white/45'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Resources</span>
          {activeTab === 'resources' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange('events')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'events' ? 'text-orange-burnt font-bold' : 'text-white/45'
          }`}
        >
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Events</span>
          {activeTab === 'events' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>

        <button 
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-200 active:scale-90 relative ${
            activeTab === 'profile' ? 'text-orange-burnt font-bold' : 'text-white/45'
          }`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px] uppercase tracking-wider font-semibold font-display">Profile</span>
          {activeTab === 'profile' && <span className="absolute bottom-1 w-1.5 h-1.5 bg-orange-burnt rounded-full" />}
        </button>
      </nav>
    </div>
  );
};

export default MobileLayout;
