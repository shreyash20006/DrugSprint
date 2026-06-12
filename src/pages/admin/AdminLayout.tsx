import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
      <div className="flex h-screen w-full bg-gray-light overflow-hidden font-sans antialiased">
        
        {/* 1. SIDEBAR FOR DESKTOP (Width: 240px, visible on md+) */}
        <div className="hidden md:block h-full shrink-0 z-20 shadow-md">
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
          <main id="admin-main-scroll" className="flex-grow overflow-y-auto p-6 md:p-8 custom-scrollbar">
            <Outlet context={{ refreshBadge: fetchPendingQuestions }} />
          </main>

        </div>

      </div>
    </ToastProvider>
  );
};

export default AdminLayout;
