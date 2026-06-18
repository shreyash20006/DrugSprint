import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { sendAdminNotification } from '../lib/brevo';
import {
  CalendarDays, Users, Loader2, CheckCircle2, AlertTriangle,
  ArrowLeft, UserPlus, Phone, Mail, GraduationCap
} from 'lucide-react';

export const EventRegister: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      if (!error && data) setEvent(data);
      setIsLoading(false);
    };
    fetchEvent();
  }, [eventId]);

  const seatsLeft = event ? Math.max(0, (event.capacity || 100) - (event.registered_count || 0)) : 0;
  const capacityPercent = event ? Math.min(100, ((event.registered_count || 0) / (event.capacity || 100)) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !year || !eventId) return;
    setIsSubmitting(true);
    setStatus('idle');

    try {
      // Check capacity
      if (seatsLeft <= 0) { setStatus('full'); setIsSubmitting(false); return; }

      // Check duplicate
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', email)
        .maybeSingle();
      if (existing) { setStatus('duplicate'); setIsSubmitting(false); return; }

      // Insert registration
      const { error } = await supabase.from('event_registrations').insert({
        event_id: eventId, full_name: fullName, email, whatsapp, year,
      });
      if (error) throw error;

      // Increment count
      await supabase.from('events').update({
        registered_count: (event.registered_count || 0) + 1,
      }).eq('id', eventId);

      setStatus('success');
      setEvent({ ...event, registered_count: (event.registered_count || 0) + 1 });

      // Send Brevo confirmation email
      try {
        await sendAdminNotification({
          subject: `🎉 Registration Confirmed: ${event.name}`,
          title: 'Event Registration Successful',
          bodyHtml: `
            <p>Dear <b>${fullName}</b>,</p>
            <p>Your registration for the upcoming event <b>${event.name}</b> has been successfully recorded!</p>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:15px 0;" />
            <p><b>Registration Summary:</b></p>
            <ul>
              <li><b>Event:</b> ${event.name}</li>
              <li><b>Registrant:</b> ${fullName}</li>
              <li><b>Year:</b> ${year}</li>
              <li><b>WhatsApp:</b> ${whatsapp || '—'}</li>
            </ul>
            <p>We look forward to seeing you at the campus venue!</p>
          `,
        });
      } catch (emailErr) {
        console.warn('Failed to send registration confirmation email:', emailErr);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 grid-bg-overlay opacity-10 pointer-events-none" />
        <div className="glass-panel rounded-2xl p-8 border border-white/5 w-full max-w-lg h-96 relative flex flex-col justify-center items-center">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
          <span className="text-white/50 text-xs font-bold uppercase tracking-widest font-display">Loading Event Data...</span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 grid-bg-overlay opacity-10 pointer-events-none" />
        <AlertTriangle className="w-12 h-12 text-orange-burnt mb-4 animate-bounce" />
        <h2 className="font-display font-extrabold text-2xl text-white mb-2">Event Not Found</h2>
        <p className="text-white/60 text-sm mb-6 max-w-sm">This event doesn't exist or has been removed from campus records.</p>
        <Link to="/events" className="text-orange-burnt font-display font-extrabold text-sm hover:text-white transition-colors flex items-center space-x-1.5">
          <ArrowLeft className="w-4 h-4" /><span>Back to Events</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden">
      {/* Background custom elements */}
      <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link to="/events" className="inline-flex items-center space-x-1.5 text-white/50 hover:text-orange-burnt font-display text-xs sm:text-sm font-extrabold mb-8 transition-all hover:-translate-x-0.5">
          <ArrowLeft className="w-4 h-4" /><span>Back to Events</span>
        </Link>

        {/* Event Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel glow-card rounded-2xl border border-white/5 p-6 sm:p-8 shadow-2xl mb-6 bg-[#0F1E42]/10"
        >
          <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
            <div className="space-y-1">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white leading-tight">{event.name}</h1>
              <div className="flex items-center space-x-2 text-white/50 text-xs font-sans">
                <CalendarDays className="w-4 h-4 text-orange-burnt" />
                <span>{new Date(event.event_date || event.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${seatsLeft > 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' : seatsLeft > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'}`}>
              {seatsLeft > 0 ? `🟢 ${seatsLeft} seats left` : '🔴 Full'}
            </span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed mb-6 font-sans">{event.description}</p>

          {/* Capacity Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span>Current Registrations</span>
              <span>{event.registered_count || 0} / {event.capacity || 100}</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${capacityPercent}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
              />
            </div>
          </div>
        </motion.div>

        {/* Form State Panels */}
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <CheckCircle2 className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-white mb-2">You're Registered! 🎉</h3>
            <p className="text-white/70 text-sm font-sans mb-1.5">Your seat at <strong>{event.name}</strong> is reserved successfully.</p>
            <p className="text-white/40 text-xs font-sans">A confirmation has been sent to <strong>{email}</strong>.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel glow-card rounded-2xl border border-white/5 p-6 sm:p-8 shadow-2xl bg-[#0F1E42]/10"
          >
            <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-white/5">
              <UserPlus className="w-5 h-5 text-orange-burnt animate-pulse" />
              <h2 className="font-display font-extrabold text-lg text-white">Registration Portal</h2>
            </div>

            {/* Alert Logs */}
            {status === 'duplicate' && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /><span>You have already registered with this email address!</span>
              </div>
            )}
            {status === 'full' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /><span>Sorry, registration capacity has been reached!</span>
              </div>
            )}
            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /><span>An unexpected error occurred. Please try again later.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Full Name *</label>
                <div className="relative group">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-burnt transition-colors" />
                  <input 
                    type="text" 
                    required 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-white transition-all duration-300 focus:shadow-lg focus:shadow-orange-burnt/5" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Email Address *</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-burnt transition-colors" />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-white transition-all duration-300 focus:shadow-lg focus:shadow-orange-burnt/5" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">WhatsApp Number</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-burnt transition-colors" />
                  <input 
                    type="tel" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-white transition-all duration-300 focus:shadow-lg focus:shadow-orange-burnt/5" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Academic Year *</label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-burnt transition-colors" />
                  <select 
                    required 
                    value={year} 
                    onChange={e => setYear(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-white/10 bg-[#080F25] focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-white transition-all duration-300 appearance-none focus:shadow-lg focus:shadow-orange-burnt/5"
                  >
                    <option value="">Select Academic Year</option>
                    <option value="D.Pharm I">D.Pharm I Year</option>
                    <option value="D.Pharm II">D.Pharm II Year</option>
                    <option value="B.Pharm I">B.Pharm I Year</option>
                    <option value="B.Pharm II">B.Pharm II Year</option>
                    <option value="B.Pharm III">B.Pharm III Year</option>
                    <option value="B.Pharm IV">B.Pharm IV Year</option>
                    <option value="M.Pharm">M.Pharm</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting || seatsLeft <= 0}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-98 transition-all hover:shadow-orange-burnt/20 border border-white/5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reserving Seat...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Confirm Registration</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventRegister;
