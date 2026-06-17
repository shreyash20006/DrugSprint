import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendAdminNotification } from '../../lib/brevo';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { useStudentAuth } from '../../lib/StudentAuthProvider';

export const ReportBug: React.FC = () => {
  const { studentProfile } = useStudentAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill details from user session
  useEffect(() => {
    if (studentProfile) {
      setName(studentProfile.full_name || '');
      setEmail(studentProfile.email || '');
    }
  }, [studentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !title || !description) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { error: dbError } = await supabase.from('bug_reports').insert([
        {
          reporter_name: name,
          reporter_email: email,
          issue_title: title,
          issue_description: description,
          status: 'pending',
        },
      ]);

      if (dbError) throw dbError;

      await sendAdminNotification({
        subject: `🚨 Mobile App Issue: ${title}`,
        title: `Bug Report Submitted via Mobile`,
        bodyHtml: `
          <p><b>Reporter:</b> ${name} (${email})</p>
          <p><b>Title:</b> ${title}</p>
          <p><b>Platform:</b> Capacitor Android App</p>
          <p><b>Description:</b></p>
          <p style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;font-style:italic;">
            "${description}"
          </p>
        `,
      });

      const { error: logError } = await supabase.from('activity_logs').insert([
        {
          user_email: email,
          action_type: 'bug_reported',
          details: `Reported mobile bug: "${title}"`,
        },
      ]);
      if (logError) console.error('Error logging activity:', logError);

      setSuccess(true);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Technical Support
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Report a Problem
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Experiencing glitches, download errors, or rendering issues inside the app? Submit details directly to our developers.
        </p>
      </section>

      {/* Form Card */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Bug Report Submitted</h3>
              <p className="text-white/60 text-xs font-sans max-w-xs leading-relaxed">
                Thank you! Our technical support team has been alerted. We will look into resolving this issue immediately.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-5 py-2.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Report Another Issue
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs p-3.5 rounded-xl leading-relaxed font-sans">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Issue Title / Summary
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PDF viewer crashes on mid-sem timetable"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Detailed Description
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what went wrong and how we can reproduce it..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none transition-colors placeholder-white/20 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Issue...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Bug Report</span>
                  </>
                )}
              </button>
            </form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportBug;
