import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { 
  MessageSquare, Send, User, ShieldCheck, Pin, Clock, 
  Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { useToast } from '../components/admin/Toast';

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
  const toast = useToast();

  // Populate logged-in student details
  useEffect(() => {
    if (studentProfile) {
      setAuthorName(studentProfile.full_name);
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

  // Supabase Realtime Subscription for real-time posts updates
  useEffect(() => {
    const messagesChannel = supabase
      .channel('realtime-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload: any) => {
          // If a new approved message is inserted or updated to approved
          if (payload.eventType === 'INSERT' && payload.new.is_approved) {
            setMessages(prev => {
              const exists = prev.some(m => m.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            });
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.is_approved) {
              setMessages(prev => {
                const filtered = prev.filter(m => m.id !== payload.new.id);
                return [payload.new, ...filtered].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              });
            } else {
              // Removed from approval
              setMessages(prev => prev.filter(m => m.id !== payload.new.id));
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
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
          is_approved: false // Moderation required
        }]);

      if (error) throw error;

      toast.success('Message sent! It will appear once approved by the council.');
      setContent('');
      if (!studentProfile) setAuthorName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[15%] right-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 flex flex-col items-center space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-12 h-12 rounded-xl bg-orange-burnt/10 flex items-center justify-center text-orange-burnt border border-orange-burnt/20 shadow-lg"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.div>
          
          <span className="text-orange-burnt text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            TGPCOP STUDENT COMMUNITY
          </span>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight uppercase">
            Message Board
          </h1>
          <p className="text-white/60 text-xs sm:text-sm max-w-xl leading-relaxed">
            Submit a query, suggestion, or positive feedback. All messages are moderated by the student council. Pinned responses are showcased.
          </p>
        </div>

        {/* Messaging Board Grid */}
        <div className="space-y-8">
          
          {/* Post Message Form Panel */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-burnt/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 text-orange-burnt" />
              <h3 className="font-display font-extrabold text-white text-sm uppercase">Share with the Council</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={400}
                required
                placeholder="Write your suggestion, issue, or question here (Max 400 chars)..."
                className="w-full h-28 bg-[#050B18] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 resize-none transition-all"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Author Credentials Inputs */}
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  {!studentProfile && (
                    <div className="relative w-full sm:w-48">
                      <input
                        type="text"
                        placeholder="Your Name (Optional)"
                        disabled={isAnonymous}
                        value={authorName}
                        onChange={e => setAuthorName(e.target.value)}
                        className="w-full bg-[#050B18] border border-white/10 rounded-xl py-2 px-3 pl-8 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-burnt disabled:opacity-40 transition-colors"
                      />
                      <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
                    </div>
                  )}

                  <label className="flex items-center space-x-2 text-xs text-white/60 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="rounded border-white/10 bg-[#050B18] text-orange-burnt focus:ring-0"
                    />
                    <span>Post Anonymously</span>
                  </label>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 shadow-lg shadow-orange-burnt/15 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Message'}</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Messages feed List */}
          <div className="space-y-4">
            
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Latest Moderated Posts
              </span>
              <button 
                onClick={fetchMessages}
                className="text-[10px] font-bold text-orange-burnt hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-2 border-orange-burnt border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 bg-[#080F25]/90 border border-white/10 rounded-3xl">
                <AlertCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <h3 className="font-display font-bold text-white text-sm">No Messages Boarded</h3>
                <p className="text-xs text-white/40 font-sans mt-1">Be the first to share an feedback/query above.</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layoutId={`msg-card-${msg.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-[#080F25]/90 backdrop-blur-2xl border rounded-3xl p-5 shadow-xl transition-colors relative overflow-hidden ${
                      msg.is_pinned ? 'border-gold-accent/40' : 'border-white/10'
                    }`}
                  >
                    {/* Glowing highlight indicator for pinned posts */}
                    {msg.is_pinned && (
                      <div className="absolute inset-0 bg-gold-accent/[0.02] pointer-events-none" />
                    )}

                    {/* Card Header details */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-orange-burnt" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-bold text-xs text-white">{msg.author_name}</span>
                            {msg.author_name === 'Anonymous' && (
                              <span className="text-[8px] font-bold text-white/30 uppercase bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">ANON</span>
                            )}
                          </div>
                          <span className="block text-[9px] text-white/40 font-semibold mt-0.5">
                            {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Pin indicator badge */}
                      {msg.is_pinned && (
                        <span className="flex items-center space-x-1.5 text-[9px] font-bold text-gold-accent uppercase tracking-widest bg-gold-accent/10 border border-gold-accent/20 px-2 py-0.5 rounded-full">
                          <Pin className="w-2.5 h-2.5 fill-gold-accent" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    {/* Message Body Content */}
                    <p className="text-xs sm:text-sm text-white/80 font-sans leading-relaxed mt-4 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* Council Response Section */}
                    {msg.reply && (
                      <div className="bg-[#121E3D]/80 border border-orange-burnt/20 p-4 rounded-2xl mt-4 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[9px] font-bold text-orange-burnt uppercase tracking-widest flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Council Response
                          </span>
                          {msg.reply_by && (
                            <span className="text-[8px] text-white/40 font-bold uppercase">Replied by {msg.reply_by}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/70 font-sans leading-relaxed whitespace-pre-wrap">
                          {msg.reply}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default MessageBoard;
