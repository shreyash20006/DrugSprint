import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  type: 'event' | 'competition';
  is_active: boolean;
}

interface EventCalendarProps {
  events: Event[];
}

export const EventCalendar: React.FC<EventCalendarProps> = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get first day of month and total days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Create events map by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach((event) => {
      const dateKey = new Date(event.event_date).toDateString();
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(event);
    });
    return map;
  }, [events]);

  // Check if date has events
  const hasEvents = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return eventsByDate.has(date.toDateString());
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate.get(selectedDate.toDateString()) || [];
  }, [selectedDate, eventsByDate]);

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth === selectedDate.getMonth() &&
      currentYear === selectedDate.getFullYear()
    );
  };

  // Generate calendar days
  const calendarDays = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
    });
  }

  // Next month days to fill grid
  const remainingDays = 42 - calendarDays.length; // 6 rows × 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-navy-dark/10 p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-orange-burnt" />
            </div>
            <h2 className="font-display font-extrabold text-xl text-navy-dark">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-bold text-orange-burnt hover:bg-orange-burnt/10 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-navy-dark/5 rounded-lg transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-5 h-5 text-navy-dark" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-navy-dark/5 rounded-lg transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-5 h-5 text-navy-dark" />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-navy-dark/50 uppercase tracking-wider py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayInfo, index) => {
            const { day, isCurrentMonth } = dayInfo;
            const hasEvent = isCurrentMonth && hasEvents(day);
            const isTodayDate = isCurrentMonth && isToday(day);
            const isSelectedDate = isCurrentMonth && isSelected(day);

            return (
              <motion.button
                key={index}
                whileHover={{ scale: isCurrentMonth ? 1.05 : 1 }}
                whileTap={{ scale: isCurrentMonth ? 0.95 : 1 }}
                onClick={() => {
                  if (isCurrentMonth) {
                    setSelectedDate(new Date(currentYear, currentMonth, day));
                  }
                }}
                disabled={!isCurrentMonth}
                className={`
                  relative aspect-square rounded-lg p-2 text-sm font-semibold transition-all
                  ${!isCurrentMonth ? 'text-navy-dark/20 cursor-not-allowed' : 'text-navy-dark cursor-pointer'}
                  ${isTodayDate ? 'bg-orange-burnt/10 border-2 border-orange-burnt text-orange-burnt' : ''}
                  ${isSelectedDate ? 'bg-navy-dark text-white' : ''}
                  ${!isTodayDate && !isSelectedDate && isCurrentMonth ? 'hover:bg-navy-dark/5' : ''}
                `}
              >
                <span className="relative z-10">{day}</span>
                
                {/* Event Indicator Dot */}
                {hasEvent && !isSelectedDate && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-0.5">
                    <div className="w-1 h-1 rounded-full bg-orange-burnt" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-navy-dark/5">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-burnt/20 border-2 border-orange-burnt" />
            <span className="text-xs text-navy-dark/60 font-sans">Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-burnt" />
            <span className="text-xs text-navy-dark/60 font-sans">Has Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-navy-dark" />
            <span className="text-xs text-navy-dark/60 font-sans">Selected</span>
          </div>
        </div>
      </div>

      {/* Events Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-navy-dark/10 p-6">
          <h3 className="font-display font-extrabold text-base text-navy-dark mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-burnt" />
            <span>
              {selectedDate
                ? `Events on ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'Select a Date'}
            </span>
          </h3>

          {selectedDateEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedDateEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-navy-dark/5 border border-navy-dark/10 hover:border-orange-burnt/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-display font-bold text-sm text-navy-dark leading-snug flex-grow">
                      {event.title}
                    </h4>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        event.type === 'competition'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                  
                  <p className="text-xs text-navy-dark/60 font-sans leading-relaxed mb-2">
                    {event.description}
                  </p>

                  {event.location && (
                    <div className="flex items-center space-x-1.5 text-[10px] text-navy-dark/50">
                      <MapPin className="w-3 h-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : selectedDate ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-navy-dark/10 mx-auto mb-2" />
              <p className="text-xs text-navy-dark/40 font-sans">No events scheduled for this date</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="w-10 h-10 text-navy-dark/10 mx-auto mb-2" />
              <p className="text-xs text-navy-dark/40 font-sans">Click on a date to view events</p>
            </div>
          )}
        </div>

        {/* Upcoming Events Summary */}
        <div className="bg-gradient-to-br from-orange-burnt to-gold-accent rounded-2xl shadow-sm p-6 text-white">
          <h3 className="font-display font-extrabold text-base mb-3">📅 Upcoming Events</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans opacity-90">Total Events</span>
              <span className="text-2xl font-display font-extrabold">{events.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans opacity-90">This Month</span>
              <span className="text-2xl font-display font-extrabold">
                {events.filter((e) => {
                  const eventDate = new Date(e.event_date);
                  return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
                }).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
