import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { downloadICS } from '../../utils/ics';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Heart, 
  Download, MapPin, Clock, Loader2
} from 'lucide-react';
import { examsData, type Exam } from '../../data/exams';

export const MyCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'all' | 'bookmarks'>('all');
  const [examFilter, setExamFilter] = useState<string>('all');
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [selectedDateExams, setSelectedDateExams] = useState<Exam[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    setBookmarks(saved);
  }, []);

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

  const getExamsForDay = (day: Date) => {
    return examsData.filter(exam => {
      const examDate = new Date(exam.date);
      const matchesDay = isSameDay(examDate, day);
      if (examFilter !== 'all') {
        return matchesDay && exam.year === examFilter;
      }
      return matchesDay;
    });
  };

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

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    const dayEvents = getEventsForDay(clickedDate);
    const dayExams = getExamsForDay(clickedDate);
    setSelectedDateEvents(dayEvents);
    setSelectedDateExams(dayExams);
    setSelectedDateStr(clickedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  };

  const toggleBookmark = (eventId: string) => {
    let updated = [...bookmarks];
    if (updated.includes(eventId)) {
      updated = updated.filter(id => id !== eventId);
    } else {
      updated.push(eventId);
    }
    setBookmarks(updated);
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));

    if (selectedDateEvents.length > 0) {
      setSelectedDateEvents(prev => prev.map(e => e.id === eventId ? { ...e } : e));
    }
  };

  useEffect(() => {
    if (events.length > 0) {
      const today = new Date();
      if (today.getMonth() === month && today.getFullYear() === year) {
        handleDayClick(today.getDate());
      } else {
        handleDayClick(1);
      }
    }
  }, [events, viewMode, examFilter, currentDate]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Schedules & Dates
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Academic Calendar
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Stay aligned with all college lectures, examinations, symposiums, fests, and workshops.
        </p>
      </section>

      {/* View Switchers */}
      <div className="flex bg-[#0F1E42]/80 border border-white/5 p-1 rounded-xl gap-1">
        <button
          onClick={() => setViewMode('all')}
          className={`flex-1 py-2 text-center rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
            viewMode === 'all' ? 'bg-orange-burnt text-white' : 'text-white/60'
          }`}
        >
          All Events
        </button>
        <button
          onClick={() => setViewMode('bookmarks')}
          className={`flex-1 py-2 text-center rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition-all ${
            viewMode === 'bookmarks' ? 'bg-orange-burnt text-white' : 'text-white/60'
          }`}
        >
          My Saved ({bookmarks.length})
        </button>
      </div>

      {/* Exam Year Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {[
          { id: 'all', label: 'All Exams' },
          { id: '1st-year', label: '1st Year' },
          { id: '2nd-year', label: '2nd Year' },
          { id: '3rd-year', label: '3rd Year' },
          { id: 'final-year', label: 'Final Year' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setExamFilter(filter.id)}
            className={`px-3.5 py-1.5 rounded-full text-[9px] font-display font-bold uppercase tracking-wider shrink-0 transition-all ${
              examFilter === filter.id
                ? 'bg-orange-burnt/10 border border-orange-burnt/35 text-orange-burnt'
                : 'bg-white/5 border border-white/5 text-white/40'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Calendar Widget */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <Loader2 className="w-7 h-7 text-orange-burnt animate-spin" />
        </div>
      ) : (
        <div className="bg-[#0F1E42]/85 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white uppercase flex items-center">
              <span>{monthNames[month]}</span>
              <span className="text-orange-burnt ml-1.5">{year}</span>
            </h3>
            <div className="flex gap-1.5">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center">
                <ChevronLeft className="w-4 h-4 text-white/80" />
              </button>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <div key={idx} className="text-[9px] font-bold text-white/30 uppercase py-0.5">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayIndex }).map((_, idx) => {
              const paddingDay = prevMonthDays - firstDayIndex + idx + 1;
              return (
                <div key={`prev-${idx}`} className="aspect-square flex items-center justify-center text-[10px] text-white/15 select-none pointer-events-none">
                  {paddingDay}
                </div>
              );
            })}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dayDate = new Date(year, month, day);
              const dayEvents = getEventsForDay(dayDate);
              const dayExams = getExamsForDay(dayDate);
              const isToday = isSameDay(new Date(), dayDate);

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-between p-1.5 border transition-all ${
                    isToday
                      ? 'border-blue-500 bg-blue-500/10 text-white font-extrabold'
                      : 'border-white/5 bg-white/5 text-white/80'
                  }`}
                >
                  <span className="text-[10px] font-bold">{day}</span>
                  {(dayEvents.length > 0 || dayExams.length > 0) && (
                    <div className="flex gap-0.5 justify-center w-full">
                      {dayExams.length > 0 && <span className="w-1 h-1 rounded-full bg-orange-burnt" />}
                      {dayEvents.slice(0, 2).map((ev) => (
                        <span
                          key={ev.id}
                          className={`w-1 h-1 rounded-full ${
                            bookmarks.includes(ev.id) ? 'bg-gold-accent' : 'bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Details */}
      <section className="bg-[#0F1E42]/50 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-3">
          <CalendarIcon className="w-4 h-4 text-orange-burnt" />
          <h3 className="font-display font-bold text-xs text-orange-burnt uppercase tracking-wider">
            {selectedDateStr || 'Select date'}
          </h3>
        </div>

        <div className="space-y-3">
          {selectedDateEvents.length === 0 && selectedDateExams.length === 0 ? (
            <div className="text-center py-6 bg-white/5 border border-dashed border-white/5 rounded-xl text-white/40 text-[10px] font-sans">
              No events or examinations scheduled.
            </div>
          ) : (
            <>
              {selectedDateExams.map((exam) => (
                <div key={exam.id} className="bg-orange-burnt/10 border border-orange-burnt/25 p-4 rounded-xl space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-burnt text-white">
                      Exam
                    </span>
                    <span className="text-[9px] font-bold text-white/60">{exam.semester}</span>
                  </div>
                  <h4 className="font-display font-bold text-xs text-white leading-snug">{exam.subjectName}</h4>
                  <div className="flex gap-4 text-[9px] text-white/50 pt-1 border-t border-white/5">
                    <div>Subject Code: <span className="text-orange-burnt font-mono font-bold">{exam.subjectCode}</span></div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-orange-burnt" />
                      <span>{exam.time}</span>
                    </div>
                  </div>
                </div>
              ))}

              {selectedDateEvents.map((ev) => {
                const isSaved = bookmarks.includes(ev.id);
                return (
                  <div key={ev.id} className="bg-[#050B18]/40 border border-white/10 p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          ev.type === 'competition' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-white/5 border border-white/10 text-white/55'
                        }`}>
                          {ev.type || 'Event'}
                        </span>
                        <h4 className="font-display font-bold text-xs text-white mt-1.5 leading-snug">{ev.name}</h4>
                      </div>
                      <button onClick={() => toggleBookmark(ev.id)} className="text-white/40">
                        <Heart className={`w-4 h-4 ${isSaved ? 'text-red-500 fill-red-500' : ''}`} />
                      </button>
                    </div>

                    <p className="text-[10px] text-white/50 leading-relaxed font-sans">{ev.description}</p>

                    <div className="space-y-1 text-[9px] text-white/50 border-t border-white/5 pt-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-orange-burnt" />
                        <span>{ev.location || 'Campus Seminar Hall'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-orange-burnt" />
                        <span>{ev.date ? new Date(ev.date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '10:00 AM'} onwards</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadICS(ev.name, ev.description || '', ev.date, ev.location)}
                        className="flex-1 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-display font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Sync ICS</span>
                      </button>
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name)}&dates=${encodeURIComponent(new Date(ev.date).toISOString().replace(/-|:|\.\d+/g, ''))}/${encodeURIComponent(new Date(new Date(ev.date).getTime() + 2 * 3600000).toISOString().replace(/-|:|\.\d+/g, ''))}&details=${encodeURIComponent(ev.description || '')}&location=${encodeURIComponent(ev.location || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 bg-orange-burnt text-white text-[9px] font-display font-bold uppercase tracking-wider rounded-lg flex items-center justify-center shadow-md"
                      >
                        Add to Google
                      </a>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyCalendar;
