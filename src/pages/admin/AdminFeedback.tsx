import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Loader2, Star, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '../../components/admin/Toast';
import { motion } from 'framer-motion';

export const AdminFeedback: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFb, setIsLoadingFb] = useState(false);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('events').select('id, name').order('created_at', { ascending: false });
      setEvents(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!selectedEventId) { setFeedbacks([]); setSummary(null); return; }
    const fetch = async () => {
      setIsLoadingFb(true);
      setSummary(null);
      const { data } = await supabase.from('feedback').select('*').eq('event_id', selectedEventId).order('created_at', { ascending: false });
      setFeedbacks(data || []);
      setIsLoadingFb(false);
    };
    fetch();
  }, [selectedEventId]);

  const handleSummarize = async () => {
    const textComments = feedbacks
      .filter(f => f.liked || f.suggestions)
      .map(f => `Rating: ${f.rating}/5. Liked: ${f.liked || 'none'}. Suggestions: ${f.suggestions || 'none'}`)
      .join('\n');
      
    if (!textComments) {
      toast.error("No written comments to summarize.");
      return;
    }

    setIsSummarizing(true);
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error("GROQ API key is missing. Add VITE_GROQ_API_KEY to your .env.local file.");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an analytical assistant. Summarize the following event feedback into exactly 3 concise bullet points: 1. Overall Sentiment 2. Key Strengths 3. Areas for Improvement. Do not use markdown bolding." },
            { role: "user", content: `Here is the feedback:\n${textComments}` }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Groq API Error:", errText);
        throw new Error(`API request failed`);
      }
      
      const result = await response.json();
      setSummary(result.choices?.[0]?.message?.content?.trim() || "Failed to generate summary.");
      toast.success("✨ AI Summary Generated!");
    } catch (err: any) {
      toast.error(`❌ AI Summarization failed: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const avgRating = feedbacks.length > 0 ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : '0.0';
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: feedbacks.filter(f => f.rating === star).length,
    pct: feedbacks.length > 0 ? Math.round((feedbacks.filter(f => f.rating === star).length / feedbacks.length) * 100) : 0,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative z-10">
      <div className="flex items-center space-x-3">
        <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20 shadow-[0_0_15px_rgba(214,90,30,0.15)]">
          <BarChart3 className="w-6 h-6 text-orange-burnt" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white drop-shadow-md">Event Feedback</h2>
      </div>

      <div className="bg-[#0A1428]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-burnt to-[#FF8C42]" />
        <label className="block text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2 pl-2">Select Event for Analytics</label>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-burnt ml-2" /> : (
          <select 
            value={selectedEventId} 
            onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-5 py-3.5 rounded-xl border border-white/10 focus:border-orange-burnt/50 outline-none text-sm bg-black/20 text-white/90 hover:bg-white/5 transition-all shadow-inner focus:ring-1 focus:ring-orange-burnt/50"
          >
            <option value="" className="bg-[#050A15]">— Choose an event to view feedback —</option>
            {events.map(ev => <option key={ev.id} value={ev.id} className="bg-[#050A15] text-white">{ev.name}</option>)}
          </select>
        )}
      </div>

      {selectedEventId && (
        isLoadingFb ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-burnt mx-auto" />
            <p className="text-white/40 text-sm mt-4 font-display">Loading feedback data...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-[#0A1428]/60 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <MessageSquare className="w-10 h-10 text-white/20" />
            </div>
            <p className="text-white font-display font-bold text-lg mb-1">No feedback received yet</p>
            <p className="text-white/40 text-sm">Participants haven't shared their thoughts on this event.</p>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="bg-[#0A1428]/60 backdrop-blur-md rounded-2xl border border-orange-burnt/20 p-6 text-center shadow-[0_4px_20px_rgba(214,90,30,0.05)] relative overflow-hidden group hover:border-orange-burnt/40 transition-colors">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-burnt rounded-full blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Star className="w-6 h-6 text-orange-burnt fill-orange-burnt drop-shadow-md" />
                  <span className="font-display font-extrabold text-4xl text-white drop-shadow-sm">{avgRating}</span>
                  <span className="text-white/40 text-lg">/5</span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400/80">Average Rating</p>
              </motion.div>
              <motion.div variants={itemVariants} className="bg-[#0A1428]/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-center shadow-xl relative overflow-hidden group hover:border-white/20 transition-colors">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500 rounded-full blur-[50px] opacity-5 group-hover:opacity-10 transition-opacity" />
                <p className="font-display font-extrabold text-4xl text-white mb-2 drop-shadow-sm">{feedbacks.length}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Total Responses</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Rating Distribution */}
              <motion.div variants={itemVariants} className="bg-[#0A1428]/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl space-y-4 lg:col-span-1">
                <h3 className="font-display font-bold text-base text-white border-b border-white/10 pb-4">Rating Distribution</h3>
                <div className="space-y-3.5 pt-2">
                  {ratingDist.map(r => (
                    <div key={r.star} className="flex items-center space-x-3 group">
                      <span className="text-sm font-sans text-white/70 w-8 flex items-center justify-end space-x-1">
                        <span>{r.star}</span><Star className="w-3.5 h-3.5 text-orange-burnt fill-orange-burnt group-hover:scale-110 transition-transform" />
                      </span>
                      <div className="flex-grow h-3 bg-black/40 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-[#FF8C42] to-orange-burnt rounded-full transition-all duration-1000 ease-out" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-white/50 w-16 text-right group-hover:text-white/80 transition-colors">{r.pct}% <span className="opacity-50">({r.count})</span></span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Summary Section & Comments */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#1a1438]/80 to-[#0A1428]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-[0_4px_25px_rgba(168,85,247,0.05)] space-y-5 relative overflow-hidden">
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-10" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 shadow-inner">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-white">AI Feedback Summary</h3>
                    </div>
                    {!summary && (
                      <button
                        onClick={handleSummarize}
                        disabled={isSummarizing || feedbacks.length === 0}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-[0_4px_15px_rgba(168,85,247,0.3)] transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span>{isSummarizing ? 'Analyzing Sentiment...' : 'Generate Insights'}</span>
                      </button>
                    )}
                  </div>
                  
                  {summary && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 bg-black/30 border border-purple-500/20 shadow-inner rounded-xl text-sm text-purple-50/90 whitespace-pre-wrap font-sans leading-relaxed relative z-10"
                    >
                      {summary}
                    </motion.div>
                  )}
                </motion.div>

                {/* Comments */}
                <motion.div variants={itemVariants} className="bg-[#0A1428]/60 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl space-y-4">
                  <h3 className="font-display font-bold text-lg text-white mb-2">Recent Comments</h3>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {feedbacks.filter(f => f.liked || f.suggestions).slice(0, 20).map(f => (
                      <div key={f.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:bg-white/[0.04] transition-colors group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex space-x-0.5">
                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= f.rating ? 'text-orange-burnt fill-orange-burnt drop-shadow-sm' : 'text-white/10'}`} />)}
                          </div>
                          <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-md">{new Date(f.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-white/50 font-bold mb-2">From: <span className="text-white/80">{f.name || 'Anonymous Participant'}</span></p>
                          {f.liked && (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                              <p className="text-sm text-white/80 font-sans leading-relaxed"><span className="text-emerald-400 font-bold text-xs uppercase tracking-wider block mb-1">Liked</span>{f.liked}</p>
                            </div>
                          )}
                          {f.suggestions && (
                            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                              <p className="text-sm text-white/80 font-sans leading-relaxed"><span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">Suggestion</span>{f.suggestions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )
      )}
    </div>
  );
};

export default AdminFeedback;
