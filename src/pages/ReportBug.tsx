import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sendAdminNotification } from '../lib/brevo';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, ArrowLeft, Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ReportBug: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !title || !description) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Insert into public.bug_reports table in Supabase
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

      // 2. Dispatch Brevo Admin Notification email alert
      await sendAdminNotification({
        subject: `🚨 New Problem Reported: ${title}`,
        title: `Bug Report Submitted`,
        bodyHtml: `
          <p><b>Reporter:</b> ${name} (${email})</p>
          <p><b>Title:</b> ${title}</p>
          <p><b>Description:</b></p>
          <p style="background:rgba(255,255,255,0.05);padding:15px;border-radius:8px;font-style:italic;">
            "${description}"
          </p>
          <p>Please resolve this issue inside the Admin portal.</p>
        `,
      });

      // 3. Log failed logins audit trail if necessary, but here we log bug_report
      const { error: logError } = await supabase.from('activity_logs').insert([
        {
          user_email: email,
          action_type: 'bug_reported',
          details: `Reported bug: "${title}"`,
        },
      ]);
      if (logError) console.error('Error logging audit activity:', logError);

      setSuccess(true);
      setName('');
      setEmail('');
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-navy-dark flex items-center justify-center p-4 overflow-hidden">
      
      {/* Background aesthetics */}
      <div className="absolute top-1/4 -left-10 w-96 h-96 bg-orange-burnt/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-25 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-white/50 hover:text-white mb-6 text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <div className="glass-panel-dark rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />

          {/* Heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-burnt/15 border border-orange-burnt/30 flex items-center justify-center text-orange-burnt shadow-lg mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-white">Report a Problem</h1>
            <p className="text-white/60 text-xs mt-1 uppercase tracking-wider font-semibold">TGPCOP Notice Portal Support</p>
          </div>

          {success ? (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-6 rounded-xl text-center space-y-4"
            >
              <CheckCircle className="w-12 h-12 mx-auto" />
              <h3 className="font-display font-bold text-lg text-white">Bug Report Submitted!</h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Thank you for reporting this issue. The TGPCOP Student Council administrator team has been notified and will review the details shortly. You can return to the homepage now.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-display text-xs font-bold rounded-lg transition-colors"
              >
                Report Another Issue
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg leading-relaxed">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Issue Title / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Notice attachment PDF is not opening"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what went wrong, including steps to reproduce the error or links that seem broken..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors resize-none font-sans"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display font-bold rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Report</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default ReportBug;
