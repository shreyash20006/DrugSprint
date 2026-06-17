import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { supabase } from './lib/supabase';
import { AuthProvider } from './lib/AuthProvider';
import { ThemeProvider } from './lib/ThemeProvider';
import { StudentAuthProvider } from './lib/StudentAuthProvider';
import { isMobile } from './lib/device';
import OneSignal from 'react-onesignal';
import { Capacitor } from '@capacitor/core';
import { MobileLayout } from './mobile/layouts/MobileLayout';


// Import core static layout components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { DNALoader } from './components/DNALoader';
import { DesktopOnlyWrapper } from './components/DesktopOnlyWrapper';
import { AIChatbot } from './components/AIChatbot';
import { FloatingScrollButtons } from './components/FloatingScrollButtons';

// Lazy load ALL pages for dynamic bundle code-splitting & minimal first-paint loading times
const Home = lazy(() => import('./pages/Home'));
const Council = lazy(() => import('./pages/Council'));
const Ask = lazy(() => import('./pages/Ask'));
const Notices = lazy(() => import('./pages/Notices'));
const Events = lazy(() => import('./pages/Events'));
const Gallery = lazy(() => import('./pages/Gallery'));
const ReportBug = lazy(() => import('./pages/ReportBug'));
const EventRegister = lazy(() => import('./pages/EventRegister'));
const Vote = lazy(() => import('./pages/Vote'));
const EventFeedback = lazy(() => import('./pages/EventFeedback'));
const Achievements = lazy(() => import('./pages/Achievements'));
const Newsletter = lazy(() => import('./pages/Newsletter'));
const Complaint = lazy(() => import('./pages/Complaint'));
const Mentors = lazy(() => import('./pages/Mentors'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const MyCalendar = lazy(() => import('./pages/MyCalendar'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const MessageBoard = lazy(() => import('./pages/MessageBoard'));
const Store = lazy(() => import('./pages/Store'));
const Pay = lazy(() => import('./pages/Pay'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const Contact = lazy(() => import('./pages/Contact'));
const Terms = lazy(() => import('./pages/Terms'));
const Refunds = lazy(() => import('./pages/Refunds'));
const Search = lazy(() => import('./pages/Search'));
const ExamSchedule = lazy(() => import('./pages/ExamSchedule'));

const MobileEventRegister = lazy(() => import('./mobile/screens/EventRegister'));
const MobileEventFeedback = lazy(() => import('./mobile/screens/EventFeedback'));
const MobilePay = lazy(() => import('./mobile/screens/Pay'));
const MobilePaymentSuccess = lazy(() => import('./mobile/screens/PaymentSuccess'));

// Lazy load all admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminQuestions = lazy(() => import('./pages/admin/AdminQuestions'));
const AdminNotices = lazy(() => import('./pages/admin/AdminNotices'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminGallery = lazy(() => import('./pages/admin/AdminGallery'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminBugs = lazy(() => import('./pages/admin/AdminBugs'));
const AdminRegistrations = lazy(() => import('./pages/admin/AdminRegistrations'));
const AdminStudentVerification = lazy(() => import('./pages/admin/AdminStudentVerification'));
const AdminPolls = lazy(() => import('./pages/admin/AdminPolls'));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'));
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'));
const AdminAchievements = lazy(() => import('./pages/admin/AdminAchievements'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminComplaints = lazy(() => import('./pages/admin/AdminComplaints'));
const AdminMentors = lazy(() => import('./pages/admin/AdminMentors'));
const AdminDeveloper = lazy(() => import('./pages/admin/AdminDeveloper'));
const AdminManageAdmins = lazy(() => import('./pages/admin/AdminManageAdmins'));
const AdminExamSchedule = lazy(() => import('./pages/admin/AdminExamSchedule'));
const AdminStories = lazy(() => import('./pages/admin/AdminStories'));
const AdminAdmissions = lazy(() => import('./pages/admin/AdminAdmissions'));

// Scroll to top helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// All paths that belong to the secure admin panel (some don't use /admin prefix)
const ADMIN_PATHS = [
  '/super-admin', '/developer', '/president',
  '/vice-president', '/general-secretary', '/secretary', '/treasurer',
];

// Layout wrapper separating public navbar/footers from secure admin panels
const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute =
    location.pathname.startsWith('/admin') ||
    ADMIN_PATHS.includes(location.pathname);

  useEffect(() => {
    // --- Custom Horizontal Scroll Support for Mouse Wheels ---
    // Converts vertical mouse wheel scrolling into horizontal scrolling for any overflow-x-auto containers when hovered
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY === 0 || e.shiftKey) return;
      
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        const isScrollableX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && target.scrollWidth > target.clientWidth;
        
        if (isScrollableX) {
          const atLeft = target.scrollLeft === 0;
          const atRight = Math.ceil(target.scrollLeft + target.clientWidth) >= target.scrollWidth;
          
          // Let the browser handle standard vertical scrolling if we've hit the horizontal edges
          if ((e.deltaY < 0 && atLeft) || (e.deltaY > 0 && atRight)) {
            return;
          }
          
          e.preventDefault();
          target.scrollLeft += e.deltaY;
          return;
        }
        target = target.parentElement;
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    // Initialize OneSignal Push Notifications
    try {
      OneSignal.init({
        appId: 'c9422105-aceb-4d9b-8e4f-9c7e7c49958b',
        allowLocalhostAsSecureOrigin: true,
      }).then(() => {
        // Show the subscription prompt after initialization
        OneSignal.Slidedown.promptPush();
      });
    } catch (error) {
      console.warn("OneSignal initialization failed:", error);
    }
    
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    return (
      <div className="flex flex-col min-h-screen bg-[#050B18] font-sans text-white antialiased">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh] bg-[#050B18]">
            <DNALoader />
          </div>
        }>
          <Routes>
            {/* Special full screen pages on mobile */}
            <Route path="/register/:eventId" element={<MobileEventRegister />} />
            <Route path="/feedback/:eventId" element={<MobileEventFeedback />} />
            <Route path="/pay" element={<MobilePay />} />
            <Route path="/payment-success" element={<MobilePaymentSuccess />} />

            {/* Secure Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/super-admin" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/developer" element={<AdminDashboard />} />
              <Route path="/president" element={<AdminDashboard />} />
              <Route path="/vice-president" element={<AdminDashboard />} />
              <Route path="/general-secretary" element={<AdminDashboard />} />
              <Route path="/secretary" element={<AdminDashboard />} />
              <Route path="/treasurer" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/questions" element={<AdminQuestions />} />
              <Route path="/admin/notices" element={<AdminNotices />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/registrations" element={<AdminRegistrations />} />
              <Route path="/admin/verification" element={<AdminStudentVerification />} />
              <Route path="/admin/polls" element={<AdminPolls />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/achievements" element={<AdminAchievements />} />
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/mentors" element={<AdminMentors />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/bugs" element={<AdminBugs />} />
              <Route path="/admin/developer" element={<AdminDeveloper />} />
              <Route path="/admin/manage-admins" element={<AdminManageAdmins />} />
              <Route path="/admin/exams" element={<AdminExamSchedule />} />
              <Route path="/admin/stories" element={<AdminStories />} />
              <Route path="/admin/admissions" element={<AdminAdmissions />} />
            </Route>

            {/* Everything else maps to bottom-tabbed MobileLayout */}
            <Route path="*" element={<MobileLayout />} />
          </Routes>
          <AIChatbot />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-light font-sans text-navy-dark antialiased">
      {!isAdminRoute && <Navbar />}
      {!isAdminRoute && <ScrollProgressBar />}
      {isAdminRoute && <FloatingScrollButtons />}

      <main className="flex-grow">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <DNALoader />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/council" element={<Council />} />
            <Route path="/ask" element={<Ask />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/events" element={<Events />} />
            <Route path="/media" element={<Gallery />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/report" element={<ReportBug />} />
            <Route path="/register/:eventId" element={<EventRegister />} />
            <Route path="/vote" element={<Vote />} />
            <Route path="/feedback/:eventId" element={<EventFeedback />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/complaint" element={<Complaint />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/profile" element={<StudentProfile />} />
            <Route path="/dashboard" element={<StudentProfile />} />
            <Route path="/calendar" element={<DesktopOnlyWrapper><MyCalendar /></DesktopOnlyWrapper>} />
            <Route path="/leaderboard" element={<DesktopOnlyWrapper><Leaderboard /></DesktopOnlyWrapper>} />
            <Route path="/board" element={<MessageBoard />} />
            <Route path="/store" element={<DesktopOnlyWrapper><Store /></DesktopOnlyWrapper>} />
            <Route path="/pay" element={<Pay />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/terms-and-conditions" element={<Terms />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/refunds-and-cancellations" element={<Refunds />} />
            <Route path="/search" element={<Search />} />
            <Route path="/exams" element={<ExamSchedule />} />
            <Route path="/exam-schedule" element={<ExamSchedule />} />

            {/* Secure Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/super-admin" element={<AdminDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/developer" element={<AdminDashboard />} />
              <Route path="/president" element={<AdminDashboard />} />
              <Route path="/vice-president" element={<AdminDashboard />} />
              <Route path="/general-secretary" element={<AdminDashboard />} />
              <Route path="/secretary" element={<AdminDashboard />} />
              <Route path="/treasurer" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/questions" element={<AdminQuestions />} />
              <Route path="/admin/notices" element={<AdminNotices />} />
              <Route path="/admin/events" element={<AdminEvents />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/registrations" element={<AdminRegistrations />} />
              <Route path="/admin/verification" element={<AdminStudentVerification />} />
              <Route path="/admin/polls" element={<AdminPolls />} />
              <Route path="/admin/feedback" element={<AdminFeedback />} />
              <Route path="/admin/messages" element={<AdminMessages />} />
              <Route path="/admin/achievements" element={<AdminAchievements />} />
              <Route path="/admin/newsletter" element={<AdminNewsletter />} />
              <Route path="/admin/mentors" element={<AdminMentors />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/logs" element={<AdminLogs />} />
              <Route path="/admin/bugs" element={<AdminBugs />} />
              <Route path="/admin/developer" element={<AdminDeveloper />} />
              <Route path="/admin/manage-admins" element={<AdminManageAdmins />} />
              <Route path="/admin/exams" element={<AdminExamSchedule />} />
              <Route path="/admin/stories" element={<AdminStories />} />
              <Route path="/admin/admissions" element={<AdminAdmissions />} />
            </Route>
          </Routes>
        </Suspense>
      </main>

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <AIChatbot />}
    </div>
  );

};

import { ToastProvider } from './components/admin/Toast';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an unhandled exception:", error, errorInfo);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0D1B3E',
          color: 'white',
          gap: '16px',
          fontFamily: 'sans-serif'
        }}>
          <h2>Something went wrong</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#C84B0E', 
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const App: React.FC = () => {
  // Load portal configuration settings
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'favicon_url')
          .maybeSingle();

        if (data?.value) {
          let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (faviconLink) {
            faviconLink.href = data.value;
          } else {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            faviconLink.href = data.value;
            document.head.appendChild(faviconLink);
          }
        }
      } catch (err) {
        console.error('Failed to load custom portal favicon:', err);
      }
    };
    loadFavicon();
  }, []);

  // Global Lenis smooth scroll engine initialization
  useEffect(() => {
    // Completely disable smooth scroll engine on mobile to save GPU cycles and run native scrolls
    if (isMobile()) return;

    const lenis = new Lenis({
      duration: 0.6,
      easing: (t) => 1 - Math.pow(1 - t, 4), // Highly responsive quartic out easing curve
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StudentAuthProvider>
            <ToastProvider>
              <Router>
                <ScrollToTop />
                <AppContent />
              </Router>
            </ToastProvider>
          </StudentAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
