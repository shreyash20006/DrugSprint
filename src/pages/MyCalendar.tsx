import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { downloadICS } from '../utils/ics';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Heart, 
  Download, MapPin, Clock, Star, Info, Layers
} from 'lucide-react';
import { useToast } from '../components/admin/Toast';
import { FeaturedExamBanner } from '../components/FeaturedExamBanner';

export const MyCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'bookmarks'>('all');
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const toast = useToast();

  // Load bookmarks from local storage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    setBookmarks(saved);
  }, []);

  // Fetch active events from DB
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        setEvents(data || []);
      } catch (err: any) {
        console.error('Error fetching calendar events:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Helper: check if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear();
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(ev => {
      const evDate = new Date(ev.deadline || ev.date);
      const matchesDay = isSameDay(evDate, day);
      if (viewMode === 'bookmarks') {
        return matchesDay && bookmarks.includes(ev.id);
      }
      return matchesDay;
    });
  };

  // Calendar math helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Handle clicking a day in the calendar
  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const dayEvents = getEventsForDay(clickedDate);
    setSelectedDateEvents(dayEvents);
    setSelectedDateStr(clickedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }));
  };

  const toggleBookmark = (eventId: string, eventName: string) => {
    let updated = [...bookmarks];
    if (updated.includes(eventId)) {
      updated = updated.filter(id => id !== eventId);
      toast.info(`${eventName} removed from shortlist`);
    } else {
      updated.push(eventId);
      toast.success(`${eventName} added to shortlist`);
    }
    setBookmarks(updated);
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));

    // Refresh selected day details if displaying
    if (selectedDateEvents.length > 0) {
      setSelectedDateEvents(prev => prev.map(e => e.id === eventId ? { ...e } : e));
    }
  };

  // Select today on mount / when events load
  useEffect(() => {
    if (events.length > 0) {
      const today = new Date();
      if (today.getMonth() === month && today.getFullYear() === year) {
        handleDayClick(today.getDate());
      } else {
        handleDayClick(1);
      }
    }
  }, [events, viewMode, currentDate]);

  return (
    <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col items-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-xl bg-orange-burnt/10 flex items-center justify-center text-orange-burnt border border-orange-burnt/20 shadow-lg"
          >
            <CalendarIcon className="w-6 h-6" />
          </motion.div>
          
          <span className="text-orange-burnt text-xs font-bold uppercase tracking-widest">
            Personal Event Planner
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight uppercase">
            Academic Calendar
          </h1>
          <p className="text-white/60 text-xs sm:text-sm max-w-xl leading-relaxed">
            Stay aligned with all college workshops, competitions, cultural events, and seminars. Book and sync them straight to your phone.
        </div>

        {/* View Mode Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#080F25]/85 border border-white/10 p-1 rounded-xl flex gap-1 shadow-2xl">
            <button
              onClick={() => setViewMode('all')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all ${
                viewMode === 'all'
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-lg shadow-orange-burnt/15'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Campus Events</span>
            </button>
            <button
              onClick={() => setViewMode('bookmarks')}
              className={`flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all ${
                viewMode === 'bookmarks'
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-lg shadow-orange-burnt/15'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>My Shortlist ({bookmarks.length})</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid & Sidebar Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-32 bg-[#080F25]/90 border border-white/10 rounded-3xl shadow-2xl">
            <div className="w-10 h-10 border-4 border-orange-burnt border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Calendar Widget */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
              >
                {/* Calendar Month Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display font-extrabold text-white text-lg sm:text-xl uppercase flex items-center">
                    <span>{monthNames[month]}</span>
                    <span className="text-orange-burnt ml-2">{year}</span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={prevMonth}
                      className="w-9 h-9 rounded-xl border border-white/10 hover:border-orange-burnt/30 flex items-center justify-center text-white/70 hover:text-white transition-all bg-white/5"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={nextMonth}
                      className="w-9 h-9 rounded-xl border border-white/10 hover:border-orange-burnt/30 flex items-center justify-center text-white/70 hover:text-white transition-all bg-white/5"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                  
                  {/* Previous month padding days */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => {
                    const paddingDay = prevMonthDays - firstDayIndex + idx + 1;
                    return (
                      <div 
                        key={`prev-${idx}`}
                        className="aspect-square border border-white/5 rounded-xl bg-white/[0.01] flex items-center justify-center text-[11px] text-white/20 select-none pointer-events-none"
                      >
                        {paddingDay}
                      </div>
                    );
                  })}

                  {/* Actual Active Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const day = idx + 1;
                    const dayDate = new Date(year, month, day);
                    const dayEvents = getEventsForDay(dayDate);
                    const isToday = isSameDay(new Date(), dayDate);
                    
                    return (
                      <button
                        key={`day-${day}`}
                        onClick={() => handleDayClick(day)}
                        className={`aspect-square border rounded-xl flex flex-col items-center justify-between p-1.5 sm:p-2.5 transition-all relative ${
                          isToday 
                            ? 'border-orange-burnt bg-orange-burnt/10 text-white font-extrabold shadow-md'
                            : 'border-white/10 bg-white/5 hover:border-orange-burnt/40 text-white/90'
                        }`}
                      >
                        <span className="text-xs font-bold">{day}</span>
                        
                        {/* Event Dot Indicators */}
                        {dayEvents.length > 0 && (
                          <div className="flex justify-center space-x-1 w-full pb-0.5">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <span 
                                key={ev.id} 
                                className={`w-1.5 h-1.5 rounded-full ${
                                  bookmarks.includes(ev.id) 
                                    ? 'bg-gold-accent shadow-glow' 
                                    : ev.type === 'competition' 
                                      ? 'bg-red-400' 
                                      : 'bg-orange-burnt'
                                }`} 
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legends explanation */}
                <div className="mt-8 flex flex-wrap items-center gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest border-t border-white/5 pt-4">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-orange-burnt" />
                    <span>Workshop/Seminars</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-red-400" />
                    <span>Competitions</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-gold-accent" />
                    <span>Saved Shortlist</span>
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Sidebar Selected Date Events Details */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[440px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2 border-b border-white/5 pb-4 mb-4">
                    <CalendarIcon className="w-4 h-4 text-orange-burnt" />
                    <span className="text-xs font-bold text-orange-burnt uppercase tracking-wider">Date Schedule</span>
                  </div>
                  
                  <h3 className="font-display font-extrabold text-white text-base mb-4">
                    {selectedDateStr || 'Select a Date'}
                  </h3>

                  <div className="space-y-4">
                    {selectedDateEvents.length === 0 ? (
                      <div className="flex flex-col gap-6">
                        <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/5">
                          <Info className="w-8 h-8 mx-auto text-white/20 mb-2" />
                          <p className="text-xs text-white/40 leading-relaxed font-sans">No regular events scheduled on this date.</p>
                        </div>
                        {/* Display Featured Banner here instead */}
                        <FeaturedExamBanner />
                      </div>
                    ) : (
                      selectedDateEvents.map((ev) => {
                        const isSaved = bookmarks.includes(ev.id);
                        return (
                          <div 
                            key={ev.id} 
                            className="border border-white/10 bg-white/5 rounded-2xl p-4 space-y-3 hover:border-orange-burnt/20 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  ev.type === 'competition' 
                                    ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                                    : 'bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt'
                                }`}>
                                  {ev.type || 'Event'}
                                </span>
                                <h4 className="font-display font-bold text-white text-sm mt-1.5 leading-snug">{ev.name}</h4>
                              </div>
                              
                              <button
                                onClick={() => toggleBookmark(ev.id, ev.name)}
                                className="text-white/50 hover:text-white p-1"
                                title={isSaved ? "Remove from shortlist" : "Add to shortlist"}
                              >
                                <Heart className={`w-4 h-4 transition-colors ${isSaved ? 'text-red-400 fill-red-400' : 'hover:scale-115'}`} />
                              </button>
                            </div>

                            <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">{ev.description || 'Join us for college event!'}</p>

                            <div className="space-y-1.5 border-t border-white/5 pt-2 text-[10px] text-white/60">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3.5 h-3.5 text-orange-burnt" />
                                <span>{ev.location || 'Campus Seminar Hall'}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-orange-burnt" />
                                <span>{ev.date ? new Date(ev.date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '10:00 AM'} onwards</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => downloadICS(ev.name, ev.description || '', ev.date, ev.location)}
                                className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-xl bg-white/5 hover:bg-orange-burnt/10 border border-white/10 hover:border-orange-burnt/20 text-white text-[10px] font-display font-bold uppercase transition-all"
                              >
                                <Download className="w-3 h-3" />
                                <span>Sync Phone</span>
                              </button>
                              <a
                                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&dates=${encodeURIComponent(new Date(ev.date).toISOString().replace(/-|:|\.\d+/g, ''))}/${encodeURIComponent(new Date(new Date(ev.date).getTime() + 2 * 3600000).toISOString().replace(/-|:|\.\d+/g, ''))}&details=${encodeURIComponent(ev.description || '')}&location=${encodeURIComponent(ev.location || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 text-center rounded-xl bg-orange-burnt text-white text-[10px] font-display font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md shadow-orange-burnt/15"
                              >
                                Google Cal
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quick info tip */}
                <div className="border-t border-white/5 pt-4 text-[10px] text-white/40 leading-relaxed flex items-start space-x-2">
                  <Star className="w-4 h-4 text-orange-burnt shrink-0 mt-0.5" />
                  <span>Tip: Mark events as favorite (heart icon) to highlight them in yellow/gold on the calendar grid!</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default MyCalendar;
