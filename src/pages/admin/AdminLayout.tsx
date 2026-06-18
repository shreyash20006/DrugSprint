import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { supabase } from '../../lib/supabase';
import { ToastProvider } from '../../components/admin/Toast';

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard Overview',
  '/admin/exams': 'Exam Schedule Manager',
  '/admin/payments': 'Payments & Collections',
  '/admin/questions': 'Student Questions',
  '/admin/notices': 'Notice Board',
  '/admin/events': 'Events & Competitions',
  '/admin/gallery': 'Photo Gallery',
  '/admin/registrations': 'Event Registrations',
  '/admin/polls': 'Polls & Voting',
  '/admin/feedback': 'Event Feedback',
  '/admin/messages': 'Messages Board',
  '/admin/achievements': 'Hall of Fame',
  '/admin/newsletter': 'Newsletter Publisher',
  '/admin/complaints': 'Anonymous Complaints',
  '/admin/mentors': 'Mentorship Connect',
  '/admin/users': 'User Administration',
  '/admin/settings': 'Portal Settings',
  '/admin/logs': 'Security Audit Trail',
  '/admin/bugs': 'Bug Reports',
  '/admin/verification': 'Student Verification',
  '/admin/stories': 'Stories Manager',
  '/admin/admissions': 'Admissions Leads',
  '/admin/developer': 'Developer Console',
};

export const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const location = useLocation();

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Admin Console';

  const fetchPendingQuestions = async () => {
    try {
      const { data } = await supabase
        .from('questions')
        .select('status')
        .eq('status', 'pending');
      setPendingCount(data?.length || 0);
    } catch (err) {
      console.error('Sidebar badge fetch error:', err);
    }
  };

  useEffect(() => {
    fetchPendingQuestions();
    const timer = setInterval(fetchPendingQuestions, 10000);
    return () => clearInterval(timer);
  }, [location.pathname]);

  // Mobile: 60s auto-logout on tab switch / screen-off
  useEffect(() => {
    const isPhone = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (!isPhone) return;

    let logoutTimer: any = null;
    const handleVisibility = async () => {
      if (document.visibilityState === 'hidden') {
        logoutTimer = setTimeout(async () => {
          await supabase.auth.signOut();
        }, 60000);
      } else if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (logoutTimer) clearTimeout(logoutTimer);
    };
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <ToastProvider>
      <div className="flex h-screen w-full bg-[#050B18] text-white overflow-hidden font-sans antialiased relative selection:bg-orange-burnt/30 selection:text-white">
        {/* Ambient background orbs */}
        <div className="absolute top-[-15%] left-[-10%] w-[40%] h-[40%] rounded-full ambient-orb-orange pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full ambient-orb-gold pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] opacity-50 pointer-events-none" />

        {/* Desktop sidebar */}
        <div className="hidden md:block h-full shrink-0 z-30">
          <AdminSidebar pendingQuestionsCount={pendingCount} />
        </div>

        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/65 backdrop-blur-sm"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className="relative flex flex-col w-[256px] shadow-2xl z-10"
              >
                <AdminSidebar
                  pendingQuestionsCount={pendingCount}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main panel */}
        <div className="flex-grow flex flex-col h-full overflow-hidden relative z-10">
          <AdminHeader title={pageTitle} onMenuClick={() => setIsSidebarOpen(true)} />

          <main
            id="admin-main-scroll"
            className="flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
