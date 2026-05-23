import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { YEAR_OPTIONS } from '../constants/formOptions';
import { getEventCapacity, formatEventDate } from '../lib/eventCapacity';
import { sendEventRegistrationEmail, openWhatsAppConfirmation } from '../lib/brevo';
import { Calendar, Loader2, CheckCircle, Users } from 'lucide-react';

export const EventRegistration: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    year: YEAR_OPTIONS[0],
  });

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()
      .then(({ data, error: e }) => {
        if (e) setError('Event not found');
        else setEvent(data);
        setLoading(false);
      });
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError('');
    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', event.id)
        .eq('email', form.email.trim().toLowerCase())
        .maybeSingle();

      if (existing) {
        setError('Already registered!');
        setSubmitting(false);
        return;
      }

      const { isFull } = getEventCapacity(event);
      if (isFull) {
        setError('Event is full!');
        setSubmitting(false);
        return;
      }

      const { error: insertErr } = await supabase.from('event_registrations').insert([
        {
          event_id: event.id,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          whatsapp: form.whatsapp.trim() || null,
          year: form.year,
        },
      ]);
      if (insertErr) throw insertErr;

      const newCount = (event.registered_count ?? 0) + 1;
      await supabase
        .from('events')
        .update({ registered_count: newCount })
        .eq('id', event.id);

      await sendEventRegistrationEmail({
        studentName: form.full_name,
        studentEmail: form.email,
        eventName: event.name,
        eventDate: formatEventDate(event.deadline),
      });

      if (form.whatsapp.trim()) {
        openWhatsAppConfirmation(form.whatsapp, event.name);
      }

      setSuccess(true);
      setEvent({ ...event, registered_count: newCount });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
      </div>
    );
  }

  if (!event) {
    return (
      <PublicPageShell title="Event Not Found" subtitle="This registration link may be invalid.">
        <p className="text-center text-navy-dark/50">Please check the events page for active registrations.</p>
      </PublicPageShell>
    );
  }

  const { capacity, registered, seatsLeft, isFull, progress } = getEventCapacity(event);

  if (success) {
    return (
      <PublicPageShell title="Registration Confirmed!" icon={<CheckCircle className="w-6 h-6" />}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-10 text-center border border-emerald-500/20 shadow-lg"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <p className="font-display font-bold text-lg text-navy-dark">
            You&apos;re registered for {event.name}!
          </p>
          <p className="text-sm text-navy-dark/60 mt-2">Check your email for confirmation.</p>
        </motion.div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      title={event.name}
      subtitle={formatEventDate(event.deadline)}
      icon={<Calendar className="w-6 h-6" />}
    >
      <div className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm mb-6 space-y-4">
        <p className="text-sm text-navy-dark/70 leading-relaxed">{event.description}</p>
        {capacity > 0 && (
          <>
            <p className={`font-display font-bold text-sm ${isFull ? 'text-red-600' : 'text-orange-burnt'}`}>
              {isFull ? '🔴 Full' : `🟢 ${seatsLeft} seats left`}
            </p>
            <div className="h-2 bg-navy-dark/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-burnt transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-navy-dark/40 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {registered} / {capacity} registered
            </p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-semibold">
            {error}
          </div>
        )}
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Full Name *</label>
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">WhatsApp Number</label>
          <input
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            placeholder="+91..."
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Year *</label>
          <select
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 bg-white text-sm"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting || isFull}
          className="w-full py-3 bg-orange-burnt text-white font-display font-bold rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Register Now'}
        </button>
      </form>
    </PublicPageShell>
  );
};

export default EventRegistration;
