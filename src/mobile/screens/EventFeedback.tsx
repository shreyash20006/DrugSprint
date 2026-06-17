import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Star, Loader2, CheckCircle2, AlertTriangle, ArrowLeft, MessageSquare } from 'lucide-react';

export const EventFeedback: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
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

  // Pre-fill student name if logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setName(user.user_metadata?.full_name || user.user_metadata?.name || '');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !eventId) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        event_id: eventId, 
        name: name || null, 
        rating, 
        liked, 
        suggestions,
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-orange-burnt animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#050B18] flex flex-col items-center justify-center text-center px-6 space-y-4">
        <AlertTriangle className="w-12 h-12 text-orange-burnt animate-bounce" />
        <h2 className="font-display font-extrabold text-xl text-white">Event Not Found</h2>
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
          Event Experience
        </span>
        <h2 className="font-display font-extrabold text-xl text-white tracking-tight">
          Submit Feedback
        </h2>
      </section>

      {submitted ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="bg-emerald-500/10 border border-emerald-500/25 p-6 rounded-2xl text-center space-y-3"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="font-display font-extrabold text-base text-white">🙏 Thank You!</h3>
          <p className="text-white/70 text-xs font-sans">
            Your feedback for <strong>{event.name}</strong> has been recorded.
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 shadow-lg"
        >
          <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
            <MessageSquare className="w-4 h-4 text-orange-burnt animate-pulse" />
            <h2 className="font-display font-extrabold text-sm text-white">Share Your Review</h2>
          </div>
          <p className="text-white/60 text-xs font-sans pb-1">
            Let us know what you thought of <strong>{event.name}</strong>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">Your Name (Optional)</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Anonymous if left blank"
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 pl-0.5">Rating *</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-110"
                  >
                    <Star className={`w-7 h-7 transition-colors ${
                      (hoverRating || rating) >= star 
                        ? 'text-orange-burnt fill-orange-burnt' 
                        : 'text-white/10'
                    }`} />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-xs font-display font-bold text-orange-burnt">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">What did you like?</label>
              <textarea 
                value={liked} 
                onChange={e => setLiked(e.target.value)} 
                rows={3} 
                placeholder="Tell us what you enjoyed..."
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none placeholder-white/20" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5 pl-0.5">Suggestions for improvement</label>
              <textarea 
                value={suggestions} 
                onChange={e => setSuggestions(e.target.value)} 
                rows={3} 
                placeholder="How can we improve?"
                className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none placeholder-white/20" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !rating}
              className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center space-x-1.5 active:scale-98 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Feedback</span>
              )}
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default EventFeedback;
