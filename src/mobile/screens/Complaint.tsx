import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { sendAdminNotification } from '../../lib/brevo';
import { ShieldAlert, CheckCircle2, Calendar, MapPin, Loader2 } from 'lucide-react';

const INCIDENT_TYPES = ['Ragging', 'Harassment', 'Bullying', 'Discrimination', 'Other'];

export const Complaint: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentType || !description) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('complaints').insert({
        incident_type: incidentType,
        description,
        incident_date: incidentDate || null,
        location: location || null,
      });
      if (error) throw error;

      await sendAdminNotification({
        subject: '⚠️ Mobile App Anonymous Complaint',
        title: 'Anonymous Complaint Alert',
        bodyHtml: `
          <p><b>Incident Type:</b> ${incidentType}</p>
          <p><b>Date:</b> ${incidentDate || 'Not specified'}</p>
          <p><b>Location:</b> ${location || 'Not specified'}</p>
          <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:15px 0;" />
          <p><b>Description:</b></p>
          <p style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px;">${description}</p>
        `,
      });

      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="font-display text-xs font-bold text-red-500 tracking-widest uppercase">
            Anonymous Portal
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Report Incident
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Report harassment, anti-ragging compliance violations, or campus grievances safely. Identity is never recorded.
        </p>
      </section>

      {/* Safety Alert Banner */}
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-2.5 backdrop-blur-md">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-display font-bold text-xs">🔒 100% Anonymous Compliance</p>
          <p className="text-white/60 text-[10px] font-sans mt-0.5">
            This form does not collect your name, email, or device ID. Anti-ragging regulations secure your complete anonymity.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-display font-bold text-white text-base">Complaint Submitted</h3>
              <p className="text-white/60 text-xs font-sans max-w-xs leading-relaxed">
                The anti-ragging committee and concerned executives have been notified. Your privacy remains 100% protected.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Incident Type *
                </label>
                <select
                  required
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-red-500 appearance-none"
                >
                  <option value="">Select type of incident</option>
                  {INCIDENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Describe Incident *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed description of what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-red-500 resize-none transition-colors placeholder-white/20 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                    Incident Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#050B18]/60 outline-none text-xs text-white focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Hostel Room B"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 bg-[#050B18]/60 outline-none text-xs text-white placeholder-white/20 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Complaint...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Submit Anonymously</span>
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

export default Complaint;
