import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { 
  MessageSquare, Send, User, ShieldCheck, Pin, Clock, 
  Sparkles, AlertCircle, RefreshCw, Loader2
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  author_name: string;
  author_email?: string;
  reply?: string;
  reply_by?: string;
  is_pinned: boolean;
  is_approved: boolean;
  created_at: string;
}

export const MessageBoard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Submit Form States
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { studentProfile } = useStudentAuth();

  useEffect(() => {
    if (studentProfile) {
      setAuthorName(studentProfile.full_name || '');
      setIsAnonymous(false);
    } else {
      setAuthorName('');
    }
  }, [studentProfile]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('is_approved', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('Error fetching messages:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const nameToSubmit = isAnonymous ? 'Anonymous' : ((authorName || '').trim() || 'Anonymous');
      const emailToSubmit = studentProfile?.email || null;

      const { error } = await supabase
        .from('messages')
        .insert([{
          content: content.trim(),
          author_name: nameToSubmit,
          author_email: emailToSubmit,
          is_approved: false
        }]);

      if (error) throw error;

      alert('Message sent! It will appear once approved by the council.');
      setContent('');
      if (!studentProfile) setAuthorName('');
    } catch (err: any) {
      alert(err.message || 'Failed to post message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Community Chat
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Message Board
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Submit questions, suggestions, or positive feedback. Moderated by the council. Pinned posts are highlighted.
        </p>
      </section>

      {/* Post Form Card */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-orange-burnt animate-pulse" />
          <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">Share your thoughts</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={400}
            required
            placeholder="Write your suggestion or feedback here (Max 400 chars)..."
            className="w-full h-24 bg-[#050B18]/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 outline-none focus:border-orange-burnt resize-none transition-colors placeholder-white/20"
          />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {!studentProfile && (
                <div className="relative flex-1 mr-3">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    disabled={isAnonymous}
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-orange-burnt disabled:opacity-40 placeholder-white/20"
                  />
                </div>
              )}

              <label className="flex items-center gap-1.5 text-xs text-white/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-white/10 bg-[#050B18] text-orange-burnt"
                />
                <span>Anonymous Post</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1">
            <Clock className="w-3 h-3" /> Moderated Discussions
          </span>
          <button 
            onClick={fetchMessages}
            className="text-[9px] font-bold text-orange-burnt flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-orange-burnt animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
            <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <h3 className="font-display font-bold text-xs text-white">No Messages Post</h3>
            <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
              No messages have been posted and approved yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-[#0F1E42]/80 backdrop-blur-xl border p-4 rounded-xl shadow-md relative overflow-hidden flex flex-col gap-2 ${
                  msg.is_pinned ? 'border-gold-accent/30' : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-orange-burnt" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-xs text-white leading-tight">
                        {msg.author_name}
                      </h4>
                      <span className="block text-[8px] text-white/40 font-mono mt-0.5">
                        {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>

                  {msg.is_pinned && (
                    <span className="flex items-center gap-1 text-[8px] font-bold text-gold-accent bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Pin className="w-2.5 h-2.5 fill-gold-accent" />
                      <span>Pinned</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/85 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                  {msg.content}
                </p>

                {msg.reply && (
                  <div className="bg-[#050B18]/50 border border-orange-burnt/20 p-3 rounded-lg flex flex-col gap-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-orange-burnt uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Council Response
                      </span>
                      {msg.reply_by && (
                        <span className="text-[8px] text-white/40 uppercase font-mono">by {msg.reply_by}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/70 font-sans leading-relaxed whitespace-pre-wrap">
                      {msg.reply}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBoard;
