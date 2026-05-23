import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

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
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminQuestions } from './pages/admin/AdminQuestions';
import { AdminNotices } from './pages/admin/AdminNotices';
import { AdminEvents } from './pages/admin/AdminEvents';

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

          {/* Secure Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <AdminQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <ProtectedRoute>
                <AdminNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  // Global Lenis smooth scroll engine initialization
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth exponential ease-out
      infinite: false,
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
    <Router>
      {/* Reset window viewport coordinate on routing */}
      <ScrollToTop />
      
      {/* Fixed Scroll progress indicator */}
      <ScrollProgressBar />

      {/* Dynamic Content isolated layout */}
      <AppContent />
    </Router>
  );
};

export default App;
