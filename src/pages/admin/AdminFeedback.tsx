import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, Loader2, Star, MessageSquare, Sparkles } from 'lucide-react';
import { useToast } from '../../components/admin/Toast';

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
      const hfKey = import.meta.env.VITE_HF_API_KEY;
      if (!hfKey) throw new Error("Hugging Face API key is missing. Add VITE_HF_API_KEY to your .env file.");
      
      const response = await fetch(
        "https://api-inference.huggingface.co/models/google/gemma-4-12B-it/v1/chat/completions",
        {
          headers: { Authorization: `Bearer ${hfKey}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ 
            model: "google/gemma-4-12B-it",
            messages: [
              { role: "system", content: "You are an analytical assistant. Summarize the following event feedback into exactly 3 concise bullet points: 1. Overall Sentiment 2. Key Strengths 3. Areas for Improvement. Do not use markdown bolding." },
              { role: "user", content: `Here is the feedback:\n${textComments}` }
            ],
            max_tokens: 300,
            temperature: 0.3
          }),
        }
      );
      
      if (!response.ok) throw new Error("API request failed");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-6 h-6 text-orange-burnt" />
        <h2 className="font-display font-extrabold text-xl text-navy-dark">Event Feedback</h2>
      </div>

      <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60 mb-1">Select Event</label>
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-orange-burnt" /> : (
          <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm bg-white">
            <option value="">— Choose an event —</option>
            {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </select>
        )}
      </div>

      {selectedEventId && (
        isLoadingFb ? <div className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-orange-burnt mx-auto" /></div> : feedbacks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-navy-dark/10">
            <MessageSquare className="w-10 h-10 text-navy-dark/15 mx-auto mb-2" />
            <p className="text-navy-dark/40 text-sm">No feedback received yet</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-navy-dark/10 p-5 text-center shadow-sm">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Star className="w-5 h-5 text-orange-burnt fill-orange-burnt" />
                  <span className="font-display font-extrabold text-2xl text-navy-dark">{avgRating}</span>
                  <span className="text-navy-dark/40 text-sm">/5</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50">Average Rating</p>
              </div>
              <div className="bg-white rounded-xl border border-navy-dark/10 p-5 text-center shadow-sm">
                <p className="font-display font-extrabold text-2xl text-navy-dark mb-1">{feedbacks.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-navy-dark/50">Total Responses</p>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <h3 className="font-display font-bold text-sm text-navy-dark">AI Feedback Summary</h3>
                </div>
                {!summary && (
                  <button
                    onClick={handleSummarize}
                    disabled={isSummarizing || feedbacks.length === 0}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                  >
                    {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{isSummarizing ? 'Analyzing...' : 'Generate Summary'}</span>
                  </button>
                )}
              </div>
              
              {summary && (
                <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg text-sm text-navy-dark/80 whitespace-pre-wrap font-sans leading-relaxed">
                  {summary}
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm space-y-3">
              <h3 className="font-display font-bold text-sm text-navy-dark mb-3">Rating Distribution</h3>
              {ratingDist.map(r => (
                <div key={r.star} className="flex items-center space-x-3">
                  <span className="text-sm font-sans text-navy-dark/70 w-8 flex items-center space-x-0.5">
                    <span>{r.star}</span><Star className="w-3 h-3 text-orange-burnt fill-orange-burnt" />
                  </span>
                  <div className="flex-grow h-4 bg-navy-dark/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-burnt rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-navy-dark/50 w-16 text-right">{r.pct}% ({r.count})</span>
                </div>
              ))}
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border border-navy-dark/10 p-5 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-sm text-navy-dark">Recent Comments</h3>
              {feedbacks.filter(f => f.liked || f.suggestions).slice(0, 20).map(f => (
                <div key={f.id} className="border-b border-navy-dark/5 pb-3 last:border-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`w-3 h-3 ${s <= f.rating ? 'text-orange-burnt fill-orange-burnt' : 'text-navy-dark/15'}`} />)}</div>
                    <span className="text-[10px] text-navy-dark/40">{f.name || 'Anonymous'} · {new Date(f.created_at).toLocaleDateString()}</span>
                  </div>
                  {f.liked && <p className="text-sm text-navy-dark/70 font-sans"><span className="text-emerald-600 font-bold text-xs">Liked: </span>{f.liked}</p>}
                  {f.suggestions && <p className="text-sm text-navy-dark/70 font-sans"><span className="text-amber-600 font-bold text-xs">Suggestion: </span>{f.suggestions}</p>}
                </div>
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AdminFeedback;
