import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { sendComplaintAlert } from '../lib/brevo';
import { COMPLAINT_TYPES } from '../constants/formOptions';
import { ShieldAlert } from 'lucide-react';

export const Complaint: React.FC = () => {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    incident_type: COMPLAINT_TYPES[0],
    description: '',
    incident_date: '',
    location: '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('complaints').insert([
      {
        incident_type: form.incident_type,
        description: form.description.trim(),
        incident_date: form.incident_date || null,
        location: form.location.trim() || null,
        status: 'received',
      },
    ]);

    if (!error) {
      await sendComplaintAlert({
        incidentType: form.incident_type,
        description: form.description,
        incidentDate: form.incident_date,
        location: form.location,
      });
      setDone(true);
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <PublicPageShell title="Submitted" icon={<ShieldAlert className="w-6 h-6" />}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-emerald-500/20 text-center space-y-3"
        >
          <p className="font-display font-bold text-navy-dark">✅ Complaint submitted anonymously.</p>
          <p className="text-sm text-navy-dark/60">
            The concerned authorities have been notified and will take action.
          </p>
        </motion.div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      title="Report an Issue"
      subtitle="Submit a confidential complaint"
      icon={<ShieldAlert className="w-6 h-6" />}
    >
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-sm text-amber-900">
        ⚠️ This form is 100% anonymous. No personal information is stored.
      </div>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-navy-dark/10 p-6 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Incident Type *</label>
          <select
            value={form.incident_type}
            onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 bg-white text-sm"
          >
            {COMPLAINT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Describe the incident *</label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Date of incident</label>
          <input
            type="date"
            value={form.incident_date}
            onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-navy-dark/60">Location (optional)</label>
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full mt-1 px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-display font-bold rounded-lg"
        >
          {submitting ? 'Submitting...' : 'Submit Anonymously'}
        </button>
      </form>
    </PublicPageShell>
  );
};

export default Complaint;
