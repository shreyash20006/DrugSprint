import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { sendAdminNotification } from '../lib/brevo';
import { ShieldAlert, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { DNALoader } from '../components/DNALoader';

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

      // Notify anti-ragging committee
      await sendAdminNotification({
        subject: '⚠️ New Anonymous Complaint Received',
        title: 'Anonymous Complaint Alert',
        bodyHtml: `
          <p><b>Incident Type:</b> ${incidentType}</p>
          <p><b>Date:</b> ${incidentDate || 'Not specified'}</p>
          <p><b>Location:</b> ${location || 'Not specified'}</p>
          <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:15px 0;" />
          <p><b>Description:</b></p>
          <p style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px;">${description}</p>
          <p style="margin-top:20px;color:rgba(255,255,255,0.5);font-size:12px;">This complaint was submitted anonymously. No personal data was collected.</p>
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<ShieldAlert className="w-6 h-6 animate-pulse" />}
        title="Anonymous Portal"
        subtitle="Report harassment, anti-ragging compliance violations, bullying or grievances safely. Identity is never recorded."
        breadcrumb="Complaint"
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 mt-12">
        {/* Anonymity Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-start space-x-3 backdrop-blur-md"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500 animate-pulse" />
          <div>
            <p className="font-display font-bold text-sm mb-0.5 text-red-400">🔒 100% Anonymous Compliance</p>
            <p className="text-white/60 text-xs font-sans">This form does not collect your name, email, or IP address. Anti-ragging regulations secure your complete anonymity.</p>
          </div>
        </motion.div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0D1B3E]/85 border border-emerald-500/25 backdrop-blur-[16px] p-8 text-center rounded-2xl shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-white mb-2">Complaint Submitted</h3>
            <p className="text-white/60 text-sm font-sans max-w-sm mx-auto">The anti-ragging committee and concerned executives have been notified. Your privacy remains 100% protected.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#0D1B3E]/85 border border-red-500/25 backdrop-blur-[16px] p-6 sm:p-8 rounded-2xl shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-display">Incident Type *</label>
                <select
                  required
                  value={incidentType}
                  onChange={e => setIncidentType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-red-500/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white focus:border-red-500 transition-colors cursor-pointer"
                >
                  <option className="bg-[#0D1B3E]" value="">Select type of incident</option>
                  {INCIDENT_TYPES.map(t => <option className="bg-[#0D1B3E]" key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-display">Describe the Incident *</label>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Please describe what happened in detail..."
                  className="w-full px-4 py-2.5 rounded-xl border border-red-500/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-red-500 transition-colors resize-none shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-display">Date of Incident</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={e => setIncidentDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-500/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white focus:border-red-500 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5 font-display">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Campus Lab 2"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-red-500/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-red-500 transition-colors shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:shadow-red-600/25 hover:-translate-y-[1px] text-white font-display text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 border border-white/5 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <DNALoader />
                    <span>Submitting Complaint...</span>
                  </div>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-white" />
                    <span>Submit Complaint Anonymously</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Complaint;
