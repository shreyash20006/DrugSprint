import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, FileText, Calendar, Megaphone, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'notice' | 'event' | 'poll';
  title: string;
  message: string;
  path: string;
  time: string;
  isRead: boolean;
}

const STORAGE_KEY = 'tgpcop_notifications';
const READ_KEY = 'tgpcop_read_notifications';

const typeIcon = (type: Notification['type']) => {
  if (type === 'notice') return <FileText className="w-4 h-4 text-blue-400" />;
  if (type === 'event')  return <Calendar className="w-4 h-4 text-emerald-400" />;
  return <Megaphone className="w-4 h-4 text-orange-burnt" />;
};

const typeLabel = (type: Notification['type']) => {
  if (type === 'notice') return 'New Notice';
  if (type === 'event')  return 'New Event';
  return 'New Poll';
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffM = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffM < 1)  return 'just now';
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load stored notifications
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
      setNotifications(stored.map((n: Notification) => ({ ...n, isRead: readIds.includes(n.id) })));
    } catch {
      setNotifications([]);
    }
  }, []);

  // Fetch initial recent items from DB (last 10)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [{ data: notices }, { data: events }, { data: polls }] = await Promise.all([
          supabase.from('notices').select('id,title,created_at').order('created_at', { ascending: false }).limit(4),
          supabase.from('events').select('id,name,created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('polls').select('id,title,created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(2),
        ]);

        const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]');

        const newNotifs: Notification[] = [
          ...(notices || []).map((n: any) => ({
            id: `notice_${n.id}`, type: 'notice' as const,
            title: typeLabel('notice'), message: n.title,
            path: '/notices', time: n.created_at,
            isRead: readIds.includes(`notice_${n.id}`),
          })),
          ...(events || []).map((e: any) => ({
            id: `event_${e.id}`, type: 'event' as const,
            title: typeLabel('event'), message: e.name,
            path: '/events', time: e.created_at,
            isRead: readIds.includes(`event_${e.id}`),
          })),
          ...(polls || []).map((p: any) => ({
            id: `poll_${p.id}`, type: 'poll' as const,
            title: typeLabel('poll'), message: p.title,
            path: '/vote', time: p.created_at,
            isRead: readIds.includes(`poll_${p.id}`),
          })),
        ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 12);

        setNotifications(newNotifs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifs));
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchInitial();
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    const readIds = notifications.map(n => n.id);
    localStorage.setItem(READ_KEY, JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    const readIds: string[] = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    if (!readIds.includes(id)) {
      localStorage.setItem(READ_KEY, JSON.stringify([...readIds, id]));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(o => !o)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
      >
        {unreadCount > 0
          ? <Bell className="w-5 h-5 text-white" />
          : <BellOff className="w-5 h-5 text-white/50" />
        }
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-md"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            style={{ background: 'var(--bg-dropdown)', borderColor: 'var(--border-mid)' }}
            className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden"
          >
            {/* Header */}
            <div style={{ borderBottomColor: 'var(--border-subtle)' }} className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-orange-burnt" />
                <span style={{ color: 'var(--text-primary)' }} className="font-display font-bold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-orange-burnt hover:text-orange-burnt/70 transition-colors">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <BellOff className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs font-sans">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.path}
                    onClick={() => { markRead(notif.id); setIsOpen(false); }}
                    className={`flex items-start space-x-3 px-4 py-3 border-b transition-colors hover:bg-orange-burnt/5 ${
                      !notif.isRead ? 'bg-orange-burnt/4' : ''
                    }`}
                    style={{ borderBottomColor: 'var(--border-subtle)' }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-burnt/10 flex items-center justify-center shrink-0 mt-0.5">
                      {typeIcon(notif.type)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-burnt">{notif.title}</span>
                        {!notif.isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 ml-2" />}
                      </div>
                      <p style={{ color: 'var(--text-primary)' }} className="text-xs font-sans mt-0.5 leading-relaxed line-clamp-2">{notif.message}</p>
                      <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-sans mt-1 block">{formatTime(notif.time)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTopColor: 'var(--border-subtle)' }} className="border-t px-4 py-2.5 text-center">
              <Link to="/notices" onClick={() => setIsOpen(false)} className="text-orange-burnt text-xs font-display font-bold hover:underline">
                View all notices →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
