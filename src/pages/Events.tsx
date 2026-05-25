import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventTimeline } from '../components/EventTimeline';
import { CompetitionCard } from '../components/CompetitionCard';
import { supabase } from '../lib/supabase';
import { CalendarRange, Trophy, CalendarDays, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Events: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'competitions'>('events');
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
  const timelineEvents = React.useMemo(() => events.filter((e) => e.type === 'event'), [events]);
  const competitions = React.useMemo(() => events.filter((e) => e.type === 'competition'), [events]);

  const handleTabChange = React.useCallback((tab: 'events' | 'competitions') => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[15%] right-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[50%] left-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={activeTab === 'events' ? <CalendarRange className="w-6 h-6 animate-pulse" /> : <Trophy className="w-6 h-6 animate-pulse" />}
        title={activeTab === 'events' ? "Events Timeline" : "Active Competitions"}
        subtitle="Discover scientific drug delivery challenges, technical symposiums, research forums, and campus cultural week contests."
        breadcrumb="Events"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

        {/* Toggle Selector Tabs with smooth layout slider */}
        <div className="flex items-center justify-center mb-16">
          <div className="bg-white/5 p-1.5 rounded-2xl flex space-x-1.5 border border-white/5 backdrop-blur-xl relative">
            <button
              onClick={() => handleTabChange('events')}
              className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl font-display text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 relative z-10 ${
                activeTab === 'events' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <CalendarDays className="w-4 h-4 text-orange-burnt" />
              <span>Upcoming Events</span>
              {activeTab === 'events' && (
                <motion.div
                  layoutId="activeTabSelectorBg"
                  className="absolute inset-0 bg-[#0F1E42] rounded-xl border border-white/5 shadow-lg -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                />
              )}
            </button>
            <button
              onClick={() => handleTabChange('competitions')}
              className={`flex items-center space-x-2 px-6 py-3.5 rounded-xl font-display text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 relative z-10 ${
                activeTab === 'competitions' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-orange-burnt" />
              <span>Competitions</span>
              {activeTab === 'competitions' && (
                <motion.div
                  layoutId="activeTabSelectorBg"
                  className="absolute inset-0 bg-[#0F1E42] rounded-xl border border-white/5 shadow-lg -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Display Panel */}
        {isLoading ? (
          activeTab === 'events' ? (
            <div className="space-y-8 max-w-4xl mx-auto">
              {[1, 2].map((idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-6 flex flex-col md:flex-row gap-6 border border-white/5 h-auto overflow-hidden relative">
                  <div className="absolute inset-0 shimmer pointer-events-none" />
                  <div className="w-full md:w-48 h-32 bg-white/5 rounded-xl shrink-0" />
                  <div className="flex-grow space-y-3 pt-2">
                    <div className="w-24 h-4 bg-white/5 rounded" />
                    <div className="w-48 h-6 bg-white/5 rounded" />
                    <div className="w-full h-12 bg-white/5 rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="glass-panel rounded-2xl overflow-hidden border border-white/5 p-6 h-96 flex flex-col justify-between relative"
                >
                  <div className="absolute inset-0 shimmer pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10" />
                    <div className="w-20 h-5 bg-white/5 rounded-full" />
                  </div>
                  <div className="space-y-3 flex-grow pt-4">
                    <div className="h-6 bg-white/5 w-2/3 rounded" />
                    <div className="h-16 bg-white/5 w-full rounded-xl" />
                  </div>
                  <div className="h-10 bg-white/5 w-full rounded-xl mt-6" />
                </div>
              ))}
            </div>
          )
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'events' ? (
              <motion.div
                key="events-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <EventTimeline events={timelineEvents} />
                
                {timelineEvents.length === 0 && (
                  <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 max-w-lg mx-auto flex flex-col items-center p-6">
                    <RefreshCw className="w-12 h-12 text-white/10 mb-4 animate-spin" style={{ animationDuration: '6s' }} />
                    <h3 className="font-display font-bold text-white/70 mb-1">No Upcoming Events</h3>
                    <p className="text-white/50 text-sm font-sans">Campus events are currently empty in our database.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="competitions-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto py-4">
                  {competitions.map((comp) => (
                    <CompetitionCard key={comp.id} competition={comp} />
                  ))}
                </div>

                {competitions.length === 0 && (
                  <div className="text-center py-20 glass-panel rounded-2xl border border-white/5 max-w-lg mx-auto flex flex-col items-center p-6">
                    <RefreshCw className="w-12 h-12 text-white/10 mb-4 animate-spin" style={{ animationDuration: '6s' }} />
                    <h3 className="font-display font-bold text-white/70 mb-1">No Active Competitions</h3>
                    <p className="text-white/50 text-sm font-sans">No contests or drug challenges are running at this moment.</p>
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

export default Events;
