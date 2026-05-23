import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { Star, Loader2 } from 'lucide-react';

export const EventFeedback: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: '', liked: '', suggestions: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    supabase
      .from('events')
      .select('id, name')
      .eq('id', eventId)
      .single()
      .then(({ data }) => {
        setEvent(data);
        setLoading(false);
      });
  }, [eventId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    await supabase.from('feedback').insert([
      {
        event_id: eventId,
        name: form.name.trim() || null,
        rating,
        liked: form.liked,
        suggestions: form.suggestions,
      },
    ]);
    setDone(true);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
      </div>
    );
  }

  if (done) {
    return (
      <PublicPageShell title="Thank You!" subtitle="🙏 Thank you for your feedback!">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-10 text-center border border-navy-dark/10"
        >
          <p className="font-display font-bold text-navy-dark">Your feedback helps us improve future events.</p>
        </motion.div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      title="Event Feedback"
      subtitle={event?.name || 'Share your experience'}
      icon={<Star className="w-6 h-6" />}
    >
      <form onSubmit={submit} className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm space-y-5">
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Your Name (optional)</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60 block mb-2">Rating *</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= (hover || rating) ? 'text-orange-burnt fill-orange-burnt' : 'text-navy-dark/20'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">What did you like?</label>
          <textarea
            rows={3}
            value={form.liked}
            onChange={(e) => setForm({ ...form, liked: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Suggestions for improvement</label>
          <textarea
            rows={3}
            value={form.suggestions}
            onChange={(e) => setForm({ ...form, suggestions: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!rating || submitting}
          className="w-full py-3 bg-orange-burnt text-white font-display font-bold rounded-lg disabled:opacity-50"
        >
          Submit Feedback
        </button>
      </form>
    </PublicPageShell>
  );
};

export default EventFeedback;
