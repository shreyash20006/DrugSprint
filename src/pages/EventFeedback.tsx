import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Star, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';

export const EventFeedback: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [liked, setLiked] = useState('');
  const [suggestions, setSuggestions] = useState('');

  useEffect(() => {
    const fetch = async () => {
      if (!eventId) return;
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (data) setEvent(data);
      setIsLoading(false);
    };
    fetch();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !eventId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        event_id: eventId, name: name || null, rating, liked, suggestions,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="pt-28 pb-24 min-h-screen bg-gray-light flex items-center justify-center"><Loader2 className="w-10 h-10 text-orange-burnt animate-spin" /></div>;

  if (!event) return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light flex flex-col items-center justify-center text-center px-4">
      <AlertTriangle className="w-12 h-12 text-orange-burnt mb-4" />
      <h2 className="font-display font-extrabold text-2xl text-navy-dark mb-2">Event Not Found</h2>
      <Link to="/events" className="text-orange-burnt font-display font-bold text-sm hover:underline flex items-center space-x-1"><ArrowLeft className="w-4 h-4" /><span>Back to Events</span></Link>
    </div>
  );

  return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <Link to="/events" className="inline-flex items-center space-x-1.5 text-navy-dark/50 hover:text-orange-burnt font-display text-sm font-bold mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Back to Events</span>
        </Link>

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border border-emerald-200 p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-navy-dark mb-2">🙏 Thank You!</h3>
            <p className="text-navy-dark/60 text-sm font-sans">Your feedback for <strong>{event.name}</strong> has been recorded.</p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-navy-dark/10 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-5 h-5 text-orange-burnt" />
              <h2 className="font-display font-extrabold text-lg text-navy-dark">Event Feedback</h2>
            </div>
            <p className="text-navy-dark/50 text-sm font-sans mb-6 pb-4 border-b border-navy-dark/5">Share your experience of <strong className="text-navy-dark">{event.name}</strong></p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Your Name (Optional)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Anonymous if left blank"
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans text-navy-dark transition-colors" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-2">Rating *</label>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star ? 'text-orange-burnt fill-orange-burnt' : 'text-navy-dark/15'}`} />
                    </button>
                  ))}
                  {rating > 0 && <span className="ml-2 text-sm font-display font-bold text-orange-burnt">{rating}/5</span>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">What did you like?</label>
                <textarea value={liked} onChange={e => setLiked(e.target.value)} rows={3} placeholder="Tell us what you enjoyed..."
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans text-navy-dark transition-colors resize-none" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1.5">Suggestions for improvement</label>
                <textarea value={suggestions} onChange={e => setSuggestions(e.target.value)} rows={3} placeholder="How can we improve?"
                  className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans text-navy-dark transition-colors resize-none" />
              </div>

              <button type="submit" disabled={isSubmitting || !rating}
                className="w-full py-3 rounded-lg bg-orange-burnt hover:bg-orange-burnt/90 text-white font-display text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center space-x-2">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></> : <span>Submit Feedback</span>}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EventFeedback;
