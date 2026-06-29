import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { sendAdminNotification } from '../../lib/brevo';
import {
  CalendarDays, Loader2, CheckCircle2, AlertTriangle,
  ArrowLeft, UserPlus
} from 'lucide-react';

export const EventRegister: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  
  if (eventId === 'b100dda7-ea02-4026-b104-d0ae7e11fe26') {
    return <Navigate to="/blood-donation" replace />;
  }

  const navigate = useNavigate();
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

  // Autofill from student session if available
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      }
    };
    checkSession();
  }, []);

  const seatsLeft = event ? Math.max(0, (event.capacity || 100) - (event.registered_count || 0)) : 0;
  const capacityPercent = event ? Math.min(100, ((event.registered_count || 0) / (event.capacity || 100)) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !year || !eventId) return;
    setIsSubmitting(true);
    setStatus('idle');

    try {
      // Check capacity
      if (seatsLeft <= 0) { 
        setStatus('full'); 
        setIsSubmitting(false); 
        return; 
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', email)
        .maybeSingle();
      
      if (existing) { 
        setStatus('duplicate'); 
        setIsSubmitting(false); 
        return; 
      }

      // Insert registration
      const { error } = await supabase.from('event_registrations').insert({
        event_id: eventId, 
        full_name: fullName, 
        email, 
        whatsapp, 
        year,
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
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-orange-burnt animate-spin" />
          <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest font-display">Loading Event Data...</span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-center px-6 space-y-4">
        <AlertTriangle className="w-12 h-12 text-orange-burnt animate-bounce" />
        <h2 className="font-display font-extrabold text-xl text-white">Event Not Found</h2>
        <p className="text-white/60 text-xs max-w-xs leading-relaxed">This event doesn't exist or has been removed from campus records.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="text-orange-burnt font-display font-extrabold text-xs flex items-center space-x-1.5 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" /><span>Go Back</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B18] text-white px-4 pt-6 pb-12 overflow-y-auto space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="inline-flex items-center space-x-1.5 text-white/50 hover:text-orange-burnt font-display text-xs font-bold transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /><span>Back</span>
      </button>

      {/* Title */}
      <section className="space-y-1">
        <span className="font-display text-[10px] font-bold text-orange-burnt tracking-widest uppercase block">
          Event Registration
        </span>
        <h2 className="font-display font-extrabold text-xl text-white tracking-tight">
          Reserve Your Spot
        </h2>
      </section>

      {/* Event Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg"
      >
        <div className="space-y-1.5">
          <h1 className="font-display font-extrabold text-lg text-white leading-snug">{event.name}</h1>
          <div className="flex items-center space-x-2 text-white/50 text-[11px] font-sans">
            <CalendarDays className="w-3.5 h-3.5 text-orange-burnt" />
            <span>
              {new Date(event.event_date || event.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>

        <p className="text-white/70 text-xs leading-relaxed font-sans">{event.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
            seatsLeft > 5 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : seatsLeft > 0 
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {seatsLeft > 0 ? `🟢 ${seatsLeft} seats left` : '🔴 Full'}
          </span>

          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            {event.registered_count || 0} / {event.capacity || 100} Registered
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${capacityPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              capacityPercent >= 90 
                ? 'bg-red-500' 
                : capacityPercent >= 70 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
          />
        </div>
      </motion.div>

      {/* Form State Panels */}
      {status === 'success' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/25 p-6 rounded-2xl text-center space-y-3 relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-display font-extrabold text-base text-white">You're Registered! 🎉</h3>
          <p className="text-white/70 text-xs font-sans">
            Your seat at <strong>{event.name}</strong> is reserved successfully.
          </p>
          <p className="text-white/40 text-[10px] font-sans">
            A confirmation receipt was sent to <strong>{email}</strong>.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
            <UserPlus className="w-4 h-4 text-orange-burnt animate-pulse" />
            <h2 className="font-display font-extrabold text-sm text-white">Registration Portal</h2>
          </div>

          {/* Alert Logs */}
          {status === 'duplicate' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>You have already registered with this email.</span>
            </div>
          )}
          {status === 'full' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Registration capacity has been reached!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>An unexpected error occurred. Please try again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">Full Name *</label>
              <input 
                type="text" 
                required 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                placeholder="Enter your full name"
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">Email Address *</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="your.email@example.com"
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">WhatsApp Number</label>
              <input 
                type="tel" 
                value={whatsapp} 
                onChange={e => setWhatsapp(e.target.value)} 
                placeholder="+91 98765 43210"
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">Academic Year *</label>
              <div className="relative">
                <select 
                  required 
                  value={year} 
                  onChange={e => setYear(e.target.value)}
                  className="w-full bg-[#050B18]/90 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt appearance-none cursor-pointer"
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▼</div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || seatsLeft <= 0}
              className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
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
  );
};

export default EventRegister;
