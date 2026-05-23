import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { supabase } from './lib/supabase';

// Import components
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { ProtectedRoute } from './components/admin/ProtectedRoute';

// Import pages
import { Home } from './pages/Home';
import { Council } from './pages/Council';
import { Ask } from './pages/Ask';
import { Notices } from './pages/Notices';
import { Events } from './pages/Events';
import { Gallery } from './pages/Gallery';
import { ReportBug } from './pages/ReportBug';
import { EventRegister } from './pages/EventRegister';
import { Vote } from './pages/Vote';
import { EventFeedback } from './pages/EventFeedback';
import { Achievements } from './pages/Achievements';
import { Newsletter } from './pages/Newsletter';
import { Complaint } from './pages/Complaint';
import { Mentors } from './pages/Mentors';

// Import admin pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminQuestions } from './pages/admin/AdminQuestions';
import { AdminNotices } from './pages/admin/AdminNotices';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminGallery } from './pages/admin/AdminGallery';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminLogs } from './pages/admin/AdminLogs';
import { AdminBugs } from './pages/admin/AdminBugs';
import { AdminRegistrations } from './pages/admin/AdminRegistrations';
import { AdminPolls } from './pages/admin/AdminPolls';
import { AdminFeedback } from './pages/admin/AdminFeedback';
import { AdminAchievements } from './pages/admin/AdminAchievements';
import { AdminNewsletter } from './pages/admin/AdminNewsletter';
import { AdminComplaints } from './pages/admin/AdminComplaints';
import { AdminMentors } from './pages/admin/AdminMentors';

// A helper component to scroll to top automatically on route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Inner wrapper to enable conditional layout isolation based on route paths
const AppContent: React.FC = () => {
  const location = useLocation();
  
  // Suppress public header Navbar and footer Footer inside the admin panels
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen bg-gray-light font-sans text-navy-dark antialiased">
      {!isAdminRoute && <Navbar />}

      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/council" element={<Council />} />
          <Route path="/ask" element={<Ask />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/events" element={<Events />} />
          <Route path="/media" element={<Gallery />} />
          <Route path="/report" element={<ReportBug />} />
          <Route path="/register/:eventId" element={<EventRegister />} />
          <Route path="/vote" element={<Vote />} />
          <Route path="/feedback/:eventId" element={<EventFeedback />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/complaint" element={<Complaint />} />
          <Route path="/mentors" element={<Mentors />} />

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
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="/admin/notices" element={<AdminNotices />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/gallery" element={<AdminGallery />} />
            <Route path="/admin/registrations" element={<AdminRegistrations />} />
            <Route path="/admin/polls" element={<AdminPolls />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/achievements" element={<AdminAchievements />} />
            <Route path="/admin/newsletter" element={<AdminNewsletter />} />
            <Route path="/admin/mentors" element={<AdminMentors />} />
            
            {/* Super Admin Exclusive Routes */}
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
            <Route path="/admin/bugs" element={<AdminBugs />} />
          </Route>
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

import { ToastProvider } from './components/admin/Toast';

export const App: React.FC = () => {
  // Global dynamic favicon mounting on application load
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
    const lenis = new Lenis({
      duration: 1.0, // Snappier and more responsive transit
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Premium exponential ease-out
      infinite: false,
      wheelMultiplier: 1.1, // Highly fluid wheel response
      syncTouch: false, // Prevent touch hijacking for native 120Hz smooth scrolling on mobile/trackpads
    });

    // Request Animation Frame loop
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Clean up scroll instance on unmount
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <ToastProvider>
      <Router>
        {/* Reset window viewport coordinate on routing */}
        <ScrollToTop />
        
        {/* Fixed Scroll progress indicator */}
        <ScrollProgressBar />

        {/* Dynamic Content isolated layout */}
        <AppContent />
      </Router>
    </ToastProvider>
  );
};

export default App;
