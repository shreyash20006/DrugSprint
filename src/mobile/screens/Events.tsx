import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Calendar, Trophy, BookOpen, Music, Award, Accessibility, 
  ArrowRight, Heart, Users, Hourglass, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const Events: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'competitions'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');

  // Load saved bookmarks from localStorage
  const loadSavedEvents = useCallback(() => {
    const stored = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    setSavedEventIds(stored);
  }, []);

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
    loadSavedEvents();
    
    // Check if dashboard sent a redirect filter
    const dashboardFilter = localStorage.getItem('tgpcop-mobile-events-filter');
    if (dashboardFilter === 'competitions') {
      setActiveTab('competitions');
      localStorage.removeItem('tgpcop-mobile-events-filter');
    }
  }, [loadSavedEvents]);

  // Split database events by type
  const allTimelineEvents = useMemo(() => events.filter((e) => e.type === 'event'), [events]);
  const allCompetitions = useMemo(() => events.filter((e) => e.type === 'competition'), [events]);

  // Categories list based on active tab
  const categories = useMemo(() => {
    const activeList = activeTab === 'events' ? allTimelineEvents : allCompetitions;
    const cats = new Set<string>();
    activeList.forEach(item => {
      if (item.category) cats.add(item.category);
      // Fallback categories
      else if (item.name?.toLowerCase().includes('exam') || item.title?.toLowerCase().includes('exam')) cats.add('Academic');
      else if (item.name?.toLowerCase().includes('fest') || item.title?.toLowerCase().includes('fest')) cats.add('Cultural');
      else cats.add('General');
    });
    return ['All', ...Array.from(cats)];
  }, [activeTab, allTimelineEvents, allCompetitions]);

  const filteredEvents = useMemo(() => {
    const activeList = activeTab === 'events' ? allTimelineEvents : allCompetitions;
    if (activeCategoryFilter === 'All') return activeList;
    return activeList.filter(e => {
      const cat = e.category || (e.name?.toLowerCase().includes('exam') || e.title?.toLowerCase().includes('exam') ? 'Academic' : e.name?.toLowerCase().includes('fest') || e.title?.toLowerCase().includes('fest') ? 'Cultural' : 'General');
      return cat === activeCategoryFilter;
    });
  }, [activeTab, allTimelineEvents, allCompetitions, activeCategoryFilter]);

  const handleTabChange = (tab: 'events' | 'competitions') => {
    setActiveTab(tab);
    setActiveCategoryFilter('All');
  };

  const toggleBookmark = (eventId: string) => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    let updated;
    if (stored.includes(eventId)) {
      updated = stored.filter(id => id !== eventId);
    } else {
      updated = [...stored, eventId];
    }
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));
    setSavedEventIds(updated);
  };

  const getCategoryIcon = (category: string) => {
    const cat = category?.toLowerCase();
    if (cat === 'academic') return <BookOpen className="w-4 h-4" />;
    if (cat === 'cultural') return <Music className="w-4 h-4" />;
    if (cat === 'sports') return <Award className="w-4 h-4" />;
    return <Accessibility className="w-4 h-4" />;
  };

  const getCategoryBadgeColors = (category: string) => {
    const cat = category?.toLowerCase();
    if (cat === 'academic') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (cat === 'cultural') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
    if (cat === 'sports') return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  };

  // Render Countdown Timer Component for Competitions
  const CompetitionCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, isExpired: false });

    useEffect(() => {
      const calculate = () => {
        const diff = +new Date(targetDate) - +new Date();
        if (diff <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, isExpired: true });
          return;
        }
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          isExpired: false
        });
      };
      calculate();
      const t = setInterval(calculate, 60000);
      return () => clearInterval(t);
    }, [targetDate]);

    if (timeLeft.isExpired) {
      return (
        <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          Ended
        </span>
      );
    }

    return (
      <span className="bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/35 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
        <Hourglass className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: '6s' }} />
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h left
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-6 pt-4">
      {/* Header Section */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Calendar 2026
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          Upcoming Events & Contests
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Stay updated with the latest academic milestones and cultural festivities at TGPCOP.
        </p>
      </section>

      {/* Tabs Selector Toggle */}
      <div className="flex items-center justify-center pt-2">
        <div className="bg-white/5 p-1 rounded-xl flex space-x-1 border border-white/5 backdrop-blur-xl">
          <button
            onClick={() => handleTabChange('events')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-display text-xs font-bold transition-all relative ${
              activeTab === 'events' ? 'bg-[#0F1E42] text-white border border-white/5 shadow-md' : 'text-white/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-orange-burnt" />
            <span>Upcoming Events</span>
          </button>
          <button
            onClick={() => handleTabChange('competitions')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-display text-xs font-bold transition-all relative ${
              activeTab === 'competitions' ? 'bg-[#0F1E42] text-white border border-white/5 shadow-md' : 'text-white/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-orange-burnt" />
            <span>Competitions</span>
          </button>
        </div>
      </div>

      {/* Categories filter chips */}
      {categories.length > 2 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full font-display text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeCategoryFilter === cat
                  ? 'bg-orange-burnt text-white'
                  : 'bg-white/5 text-white/50 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Events List / Timeline Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((idx) => (
            <div key={idx} className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl p-5 space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 shimmer pointer-events-none" />
              <div className="h-5 bg-white/5 w-24 rounded-full" />
              <div className="h-6 bg-white/5 w-2/3 rounded" />
              <div className="h-3 bg-white/5 w-full rounded" />
              <div className="h-10 bg-white/5 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Connector Line */}
          {activeTab === 'events' && filteredEvents.length > 0 && (
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-burnt via-gold-accent to-orange-burnt opacity-20" />
          )}

          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => {
                const isSaved = savedEventIds.includes(event.id);
                const seatsLeft = (event.capacity || 100) - (event.registered_count || 0);
                const isFull = seatsLeft <= 0;
                const percentFull = Math.min(100, Math.round(((event.registered_count || 0) / (event.capacity || 100)) * 100));

                const eventCat = event.category || (event.name?.toLowerCase().includes('exam') || event.title?.toLowerCase().includes('exam') ? 'Academic' : event.name?.toLowerCase().includes('fest') || event.title?.toLowerCase().includes('fest') ? 'Cultural' : 'General');
                
                const formattedDate = event.date || (event.deadline ? new Date(event.deadline).toLocaleDateString('en-IN', {
                  month: 'short', day: 'numeric', year: 'numeric'
                }) : 'TBD');

                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative ${activeTab === 'events' ? 'pl-12' : ''}`}
                  >
                    {/* Timeline Dot Indicator */}
                    {activeTab === 'events' && (
                      <div className="absolute left-[20px] top-6 w-2.5 h-2.5 rounded-full bg-orange-burnt border-2 border-[#050B18] ring-4 ring-orange-burnt/10 z-10 animate-pulse" />
                    )}

                    {/* Event Glass Card */}
                    <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-5 shadow-md flex flex-col justify-between hover:border-orange-burnt/35 transition-all">
                      <div>
                        {/* Tags / Badging Header */}
                        <div className="flex justify-between items-center mb-3">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${getCategoryBadgeColors(eventCat)}`}>
                            {getCategoryIcon(eventCat)}
                            {eventCat}
                          </span>
                          
                          {activeTab === 'competitions' ? (
                            <CompetitionCountdown targetDate={`${event.deadline || event.date}T23:59:59`} />
                          ) : (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isFull ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isFull ? 'House Full' : `${seatsLeft} seats left`}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-extrabold text-sm text-white leading-snug">
                          {event.title || event.name}
                        </h3>

                        {/* Date and Location */}
                        <div className="space-y-1.5 my-3.5 font-sans text-white/50 text-[10px] font-semibold">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Description excerpt */}
                        <p className="font-sans text-xs text-white/60 leading-relaxed mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        {/* Rewards / Info Boxes for Competitions */}
                        {activeTab === 'competitions' && (
                          <div className="space-y-2 mb-4 bg-[#080F25]/45 border border-white/5 p-3 rounded-xl">
                            {event.prizeInfo && (
                              <div className="flex gap-2 text-[10px] font-sans">
                                <Trophy className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                                <span className="text-white/80">{event.prizeInfo}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Capacity Progress Bar for Events */}
                        {activeTab === 'events' && event.capacity && (
                          <div className="mt-3 mb-5 border-t border-white/5 pt-3">
                            <div className="flex justify-between items-center mb-1 text-[9px] font-semibold text-white/50 uppercase">
                              <span>Registered Capacity</span>
                              <span>{percentFull}% Full</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-orange-burnt h-full rounded-full" style={{ width: `${percentFull}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* CTAs */}
                      <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                        <button
                          onClick={() => toggleBookmark(event.id)}
                          className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
                            isSaved 
                              ? 'bg-orange-burnt/10 border-orange-burnt/30 text-orange-burnt shadow-inner' 
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>

                        {isFull ? (
                          <button
                            disabled
                            className="flex-grow py-2.5 bg-white/5 text-white/30 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-not-allowed border border-white/5"
                          >
                            Sold Out
                          </button>
                        ) : (
                          <Link
                            to={`/register/${event.id}`}
                            className="flex-grow inline-flex items-center justify-center space-x-1.5 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md active:scale-[0.97] transition-all border border-white/5"
                          >
                            <span>Register Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
                <RefreshCw className="w-10 h-10 text-white/10 mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                <h3 className="font-display font-bold text-white/60 text-sm">No Events Listed</h3>
                <p className="text-white/40 text-xs mt-1">Check back later for newly announced updates.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
