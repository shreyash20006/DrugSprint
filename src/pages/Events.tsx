import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventTimeline } from '../components/EventTimeline';
import { CompetitionCard } from '../components/CompetitionCard';
import { EventCalendar } from '../components/EventCalendar';
import { supabase } from '../lib/supabase';
import { CalendarRange, Trophy, CalendarDays, RefreshCw, Calendar } from 'lucide-react';

export const Events: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'events' | 'competitions'>('calendar');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching events:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Split database events
  const timelineEvents = events.filter((e) => e.type === 'event');
  const competitions = events.filter((e) => e.type === 'competition');

  return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            className="w-12 h-12 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt"
          >
            {activeTab === 'calendar' ? (
              <Calendar className="w-6 h-6" />
            ) : activeTab === 'events' ? (
              <CalendarRange className="w-6 h-6" />
            ) : (
              <Trophy className="w-6 h-6" />
            )}
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-burnt text-xs font-bold uppercase tracking-widest block"
          >
            Campus Happenings & Contests
          </motion.span>

          <div className="relative inline-block">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-extrabold text-3xl sm:text-5xl text-navy-dark leading-tight uppercase"
            >
              {activeTab === 'calendar' ? 'EVENTS CALENDAR' : activeTab === 'events' ? 'EVENTS TIMELINE' : 'ACTIVE COMPETITIONS'}
            </motion.h1>
            
            {/* Animated Underline */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80px' }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              className="h-1 bg-orange-burnt mx-auto mt-4 rounded-full"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-navy-dark/70 text-sm sm:text-base font-sans"
          >
            Explore our rich history of technical symposiums, cultural nights, and community campaigns, or participate in live scientific competitions!
          </motion.p>
        </div>

        {/* Toggle Selector Tabs */}
        <div className="flex items-center justify-center mb-12">
          <div className="bg-navy-dark/5 p-1.5 rounded-xl flex flex-wrap justify-center space-x-1 border border-navy-dark/5 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-display text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                activeTab === 'calendar'
                  ? 'bg-navy-dark text-white shadow-md'
                  : 'text-navy-dark/75 hover:bg-navy-dark/5 hover:text-navy-dark'
              }`}
            >
              <Calendar className="w-4 h-4 text-orange-burnt" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-display text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                activeTab === 'events'
                  ? 'bg-navy-dark text-white shadow-md'
                  : 'text-navy-dark/75 hover:bg-navy-dark/5 hover:text-navy-dark'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-orange-burnt" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`flex items-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-display text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 ${
                activeTab === 'competitions'
                  ? 'bg-navy-dark text-white shadow-md'
                  : 'text-navy-dark/75 hover:bg-navy-dark/5 hover:text-navy-dark'
              }`}
            >
              <Trophy className="w-4 h-4 text-orange-burnt" />
              <span>Competitions</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        {isLoading ? (
          /* SHIMMERING SKELETON COVERS */
          activeTab === 'calendar' ? (
            <div className="h-96 flex flex-col items-center justify-center text-navy-dark/40">
              <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
              <p className="font-display text-xs tracking-widest uppercase">Loading calendar...</p>
            </div>
          ) : activeTab === 'events' ? (
            <div className="h-96 flex flex-col items-center justify-center text-navy-dark/40">
              <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
              <p className="font-display text-xs tracking-widest uppercase">Fetching timeline milestones...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-navy-dark/5 p-6 space-y-4 animate-pulse"
                >
                  <div className="flex justify-between items-center">
                    <div className="w-10 h-10 rounded-full bg-navy-dark/10" />
                    <div className="w-20 h-5 bg-navy-dark/10 rounded-full" />
                  </div>
                  <div className="h-6 bg-navy-dark/10 w-2/3 rounded" />
                  <div className="h-16 bg-navy-dark/5 w-full rounded" />
                  <div className="h-20 bg-navy-dark/10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          )
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' ? (
              <motion.div
                key="calendar-tab"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.3 }}
              >
                <EventCalendar events={events} />
              </motion.div>
            ) : activeTab === 'events' ? (
              <motion.div
                key="events-tab"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.3 }}
              >
                <EventTimeline events={timelineEvents} />
                
                {timelineEvents.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-navy-dark/5 max-w-lg mx-auto flex flex-col items-center p-6">
                    <RefreshCw className="w-12 h-12 text-navy-dark/20 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                    <h3 className="font-display font-bold text-navy-dark/70 mb-1">No Timeline Events</h3>
                    <p className="text-navy-dark/50 text-sm font-sans">Timeline events are currently empty in our records.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="competitions-tab"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -25 }}
                transition={{ duration: 0.3 }}
              >
                {/* Competitions Card Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto py-8">
                  {competitions.map((comp) => (
                    <CompetitionCard key={comp.id} event={comp} />
                  ))}
                </div>

                {competitions.length === 0 && (
                  <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-navy-dark/5 max-w-lg mx-auto flex flex-col items-center p-6">
                    <RefreshCw className="w-12 h-12 text-navy-dark/20 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                    <h3 className="font-display font-bold text-navy-dark/70 mb-1">No Active Competitions</h3>
                    <p className="text-navy-dark/50 text-sm font-sans">No contests or quizzes are running at this moment. Check back soon!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </div>
    </div>
  );
};

// Quick helper to show spinner in skeleton loader
const Loader2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default Events;
