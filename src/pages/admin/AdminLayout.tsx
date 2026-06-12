import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { supabase } from '../../lib/supabase';
import { ToastProvider } from '../../components/admin/Toast';

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/admin/payments':
        return 'Payments & Collections Ledger';
      case '/admin/questions':
        return 'Student Questions';
      case '/admin/notices':
        return 'Notice Board Management';
      case '/admin/events':
        return 'Events & Competitions';
      case '/admin/gallery':
        return 'Photo Gallery Management';
      case '/admin/registrations':
        return 'Event Registrations';
      case '/admin/polls':
        return 'Polls & Voting Management';
      case '/admin/feedback':
        return 'Event Feedback Analytics';
      case '/admin/messages':
        return 'Messages Board Moderation';
      case '/admin/achievements':
        return 'Hall of Fame achievements';
      case '/admin/newsletter':
        return 'Newsletter Publisher';
      case '/admin/complaints':
        return 'Anonymous Complaints';
      case '/admin/mentors':
        return 'Mentorship Connect Program';
      case '/admin/users':
        return 'User Administration';
      case '/admin/settings':
        return 'Portal Branding Settings';
      case '/admin/logs':
        return 'Security Audit Trail';
      case '/admin/bugs':
        return 'Glitch & Issue Reports';
      case '/admin/dashboard':
      default:
        return 'Dashboard Overview';
    }
  };

  const fetchPendingQuestions = async () => {
    try {
      const { data } = await supabase
        .from('questions')
        .select('status')
        .eq('status', 'pending');
      setPendingCount(data?.length || 0);
    } catch (err) {
      console.error('Error fetching sidebar pending badge count:', err);
    }
  };

  useEffect(() => {
    fetchPendingQuestions();
    
    // Poll every 10 seconds to keep pending badge counts refreshed
    const timer = setInterval(fetchPendingQuestions, 10000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  const pageTitle = getPageTitle(location.pathname);

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#050A15] text-white overflow-hidden font-sans antialiased relative selection:bg-orange-burnt/30 selection:text-white">
        
        {/* Ambient Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-burnt/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/10 blur-[120px] pointer-events-none" />

        {/* 1. SIDEBAR FOR DESKTOP (Width: 240px, visible on md+) */}
        <div className="hidden md:block h-full shrink-0 z-20">
          <AdminSidebar pendingQuestionsCount={pendingCount} />
        </div>

        {/* 2. SIDEBAR DRAWER FOR MOBILE (Visible on <md) */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop Blur Overlay */}
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            />

            {/* Sliding Content Container */}
            <div className="relative flex-1 flex flex-col max-w-[240px] w-full bg-navy-dark shadow-xl animate-in slide-in-from-left duration-250 z-10">
              <AdminSidebar 
                pendingQuestionsCount={pendingCount} 
                onClose={() => setIsSidebarOpen(false)} 
              />
            </div>
          </div>
        )}

        {/* 3. MAIN APP PANEL VIEWPORT */}
        <div className="flex-grow flex flex-col h-full overflow-hidden">
          
          {/* Top Header Navigation */}
          <AdminHeader 
            title={pageTitle} 
            onMenuClick={() => setIsSidebarOpen(true)} 
          />

          {/* Scrollable Contents Pane */}
          <main id="admin-main-scroll" className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full"
              >
                <Outlet context={{ refreshBadge: fetchPendingQuestions }} />
              </motion.div>
            </AnimatePresence>
          </main>

        </div>

      </div>
    </ToastProvider>
  );
};

export default AdminLayout;
