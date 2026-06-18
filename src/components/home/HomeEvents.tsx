import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarDays, Clock, MapPin, ArrowUpRight, Trophy, Users } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section, SectionHeader } from './Section';
import type { HomeEvent } from '../../hooks/useHomePageData';

export const HomeEvents: React.FC<{ events: HomeEvent[] }> = ({ events }) => {
  return (
    <Section>
      <SectionHeader
        eyebrow="What's Next"
        align="between"
        title="Upcoming Events & Competitions"
        description="Block your dates — scientific quizzes, cultural drives and sports symposiums happening on campus."
        cta={
          <Link
            to="/events"
            className="group inline-flex items-center gap-2 text-orange-burnt font-display font-extrabold text-sm hover:text-gold-accent transition-colors"
            data-testid="view-all-events"
          >
            <span>Explore Events Timeline</span>
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        }
      />

      {events.length === 0 ? (
        <Card variant="default" padding="xl" className="text-center">
          <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3" strokeWidth={1.6} />
          <h3 className="font-display font-bold text-white/40 text-sm">No upcoming events scheduled</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {events.map((event) => {
            const capacity = event.capacity || 100;
            const seatsLeft = capacity - (event.registered_count || 0);
            const isFull = seatsLeft <= 0;
            const progressPct = Math.min(100, ((event.registered_count || 0) / capacity) * 100);

            return (
              <Card key={event.id} variant="default" padding="none" hover className="flex flex-col">
                <div className="h-44 bg-[#080F25] relative overflow-hidden border-b border-white/5">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.name} className="w-full h-full object-cover opacity-90" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#080F25] via-[#0D1B3E] to-orange-burnt/15 flex flex-col p-6 justify-between">
                      <CardBadge tone="orange">
                        {event.type === 'competition' ? (
                          <>
                            <Trophy className="w-3 h-3" strokeWidth={2.4} />
                            <span>Competition</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3 h-3" strokeWidth={2.4} />
                            <span>Event</span>
                          </>
                        )}
                      </CardBadge>
                      <span className="text-white font-display font-bold text-base sm:text-lg leading-tight line-clamp-2">
                        {event.name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4 flex-grow">
                  <h3 className="font-display font-extrabold text-base text-white line-clamp-2">{event.name}</h3>

                  <div className="space-y-2 text-xs text-white/65 font-sans">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-orange-burnt shrink-0" strokeWidth={2.2} />
                      <span>
                        {event.deadline
                          ? new Date(event.deadline).toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBA'}
                      </span>
                    </div>
                    {event.time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-burnt shrink-0" strokeWidth={2.2} />
                        <span>{event.time}</span>
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-burnt shrink-0" strokeWidth={2.2} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className={`inline-flex items-center gap-1.5 ${isFull ? 'text-red-400' : 'text-emerald-400'}`}>
                        <Users className="w-3 h-3" strokeWidth={2.4} />
                        {isFull ? 'House Full' : `${seatsLeft} seats left`}
                      </span>
                      <span className="text-white/45">Cap: {capacity}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progressPct}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/register/${event.id}`}
                    onClick={(e) => {
                      if (isFull) e.preventDefault();
                    }}
                    data-testid={`event-register-${event.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-[0.18em] transition-all border ${
                      isFull
                        ? 'bg-white/[0.04] text-white/30 cursor-not-allowed border-white/5'
                        : 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-[1.02] text-white shadow-lg shadow-orange-burnt/15 active:scale-[0.98] hover:shadow-orange-burnt/30 border-white/5'
                    }`}
                  >
                    {isFull ? 'Sold Out' : 'Register Now'}
                    {!isFull && <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.4} />}
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
};

export default HomeEvents;
