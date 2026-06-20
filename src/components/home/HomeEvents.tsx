import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CalendarDays, Clock, MapPin, ArrowUpRight, Trophy, Users } from 'lucide-react';
import { Card, CardBadge } from '../ui/Card';
import { Section, SectionHeader } from './Section';
import type { HomeEvent } from '../../hooks/useHomePageData';

export const HomeEvents: React.FC<{ events: HomeEvent[] }> = ({ events }) => {
  useEffect(() => {
    // Reload Instagram Embed script to process the newly rendered blockquote
    if ((window as any).instgrm) {
      (window as any).instgrm.Embeds.process();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
      script.onload = () => {
        if ((window as any).instgrm) {
          (window as any).instgrm.Embeds.process();
        }
      };
    }
  }, [events]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-7 items-start">
        {/* Render events from database */}
        {events.map((event) => {
          const capacity = event.capacity || 100;
          const seatsLeft = capacity - (event.registered_count || 0);
          const isFull = seatsLeft <= 0;
          const progressPct = Math.min(100, ((event.registered_count || 0) / capacity) * 100);

          return (
            <Card key={event.id} variant="default" padding="none" hover className="flex flex-col h-full">
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

        {/* If there are no upcoming events in the database, show a stay tuned placeholder */}
        {events.length === 0 && (
          <Card variant="default" padding="xl" className="text-center md:col-span-2 flex flex-col justify-center py-12 min-h-[380px]">
            <Calendar className="w-10 h-10 text-white/10 mx-auto mb-3 animate-pulse" strokeWidth={1.6} />
            <h3 className="font-display font-bold text-white/60 text-base">Stay Tuned for More Events</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-2 leading-relaxed font-sans">
              We are actively planning new quizzes, cultural symposiums, and sports competitions. Check back soon or follow our Instagram feed for immediate updates!
            </p>
          </Card>
        )}

        {/* Instagram Post Embed Card */}
        <Card variant="default" padding="none" className="overflow-hidden bg-[#0D1B3E]/30 border border-white/5 backdrop-blur-md flex flex-col items-center p-4 min-h-[380px] h-full justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-burnt mb-3 self-start">
            📢 Instagram Update
          </span>
          <div className="w-full overflow-y-auto max-h-[380px] flex justify-center instagram-embed-wrapper scrollbar-thin">
            <blockquote 
              className="instagram-media" 
              data-instgrm-captioned 
              data-instgrm-permalink="https://www.instagram.com/p/DZyC8xmzlR7/?utm_source=ig_embed&amp;utm_campaign=loading" 
              data-instgrm-version="14" 
              style={{ background: '#FFF', border: 0, borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: 0, width: 'calc(100% - 2px)' }}
            >
              <div style={{ padding: '16px' }}> 
                <a href="https://www.instagram.com/p/DZyC8xmzlR7/?utm_source=ig_embed&amp;utm_campaign=loading" style={{ background: '#FFFFFF', lineHeight: 0, padding: '0 0', textAlign: 'center', textDecoration: 'none', width: '100%' }} target="_blank" rel="noopener noreferrer"> 
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}> 
                    <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', flexGrow: 0, height: '40px', marginRight: '14px', width: '40px' }}></div> 
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}> 
                      <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', marginBottom: '6px', width: '100px' }}></div> 
                      <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', width: '60px' }}></div>
                    </div>
                  </div>
                  <div style={{ padding: '19% 0' }}></div> 
                  <div style={{ display: 'block', height: '50px', margin: '0 auto 12px', width: '50px' }}>
                    <svg width="50px" height="50px" viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                      <g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
                        <g transform="translate(-511.000000, -20.000000)" fill="#000000">
                          <g>
                            <path d="M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631" />
                          </g>
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div style={{ paddingTop: '8px' }}> 
                    <div style={{ color: '#3897f0', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: 550, lineHeight: '18px' }}>View this post on Instagram</div>
                  </div>
                  <div style={{ padding: '12.5% 0' }}></div> 
                  <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '14px', alignItems: 'center' }}>
                    <div> 
                      <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', height: '12.5px', width: '12.5px', transform: 'translateX(0px) translateY(7px)' }}></div> 
                      <div style={{ backgroundColor: '#F4F4F4', height: '12.5px', transform: 'rotate(-45deg) translateX(3px) translateY(1px)', width: '12.5px', flexGrow: 0, marginRight: '14px', marginLeft: '2px' }}></div> 
                      <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', height: '12.5px', width: '12.5px', transform: 'translateX(9px) translateY(-18px)' }}></div>
                    </div>
                    <div style={{ marginLeft: '8px' }}> 
                      <div style={{ backgroundColor: '#F4F4F4', borderRadius: '50%', flexGrow: 0, height: '20px', width: '20px' }}></div> 
                      <div style={{ width: 0, height: 0, borderTop: '2px solid transparent', borderLeft: '6px solid #f4f4f4', borderBottom: '2px solid transparent', transform: 'translateX(16px) translateY(-4px) rotate(30deg)' }}></div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}> 
                      <div style={{ width: '0px', borderTop: '8px solid #F4F4F4', borderRight: '8px solid transparent', transform: 'translateY(16px)' }}></div> 
                      <div style={{ backgroundColor: '#F4F4F4', flexGrow: 0, height: '12px', width: '16px', transform: 'translateY(-4px)' }}></div> 
                      <div style={{ width: 0, height: 0, borderTop: '8px solid #F4F4F4', borderLeft: '8px solid transparent', transform: 'translateY(-4px) translateX(8px)' }}></div>
                    </div>
                  </div> 
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center', marginBottom: '24px' }}> 
                    <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', marginBottom: '6px', width: '224px' }}></div> 
                    <div style={{ backgroundColor: '#F4F4F4', borderRadius: '4px', flexGrow: 0, height: '14px', width: '144px' }}></div>
                  </div>
                </a>
                <p style={{ color: '#c9c8cd', fontFamily: 'Arial,sans-serif', fontSize: '14px', lineHeight: '17px', marginBottom: 0, marginTop: '8px', overflow: 'hidden', padding: '8px 0 7px', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href="https://www.instagram.com/p/DZyC8xmzlR7/?utm_source=ig_embed&amp;utm_campaign=loading" style={{ color: '#c9c8cd', fontFamily: 'Arial,sans-serif', fontSize: '14px', fontStyle: 'normal', fontWeight: 'normal', lineHeight: '17px', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">A post shared by tgpcop.council (@tgpcop.council)</a>
                </p>
              </div>
            </blockquote>
          </div>
        </Card>
      </div>
    </Section>
  );
};

export default HomeEvents;

