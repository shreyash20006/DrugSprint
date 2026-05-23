import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { PublicPageShell } from '../components/PublicPageShell';
import { Modal } from '../components/admin/Modal';
import { YEAR_OPTIONS, MENTOR_YEARS, MENTOR_SPECIALIZATIONS } from '../constants/formOptions';
import { sendMentorRequestEmails } from '../lib/brevo';
import { Users, Loader2, Clock, BookOpen } from 'lucide-react';

export const Mentors: React.FC = () => {
  const [mentors, setMentors] = useState<any[]>([]);
  const [yearFilter, setYearFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({
    junior_name: '',
    junior_email: '',
    junior_year: YEAR_OPTIONS[0],
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase
      .from('mentors')
      .select('*')
      .eq('is_available', true)
      .order('name')
      .then(({ data }) => {
        setMentors(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = mentors.filter((m) => {
    const yearOk =
      yearFilter === 'All' || m.year?.includes(yearFilter.replace('All', ''));
    const specOk =
      specFilter === 'All' ||
      m.specialization?.toLowerCase() === specFilter.toLowerCase();
    return yearOk && specOk;
  });

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    await supabase.from('mentor_requests').insert([
      {
        mentor_id: selected.id,
        junior_name: form.junior_name.trim(),
        junior_email: form.junior_email.trim(),
        junior_year: form.junior_year,
        message: form.message.trim(),
        status: 'pending',
      },
    ]);
    await sendMentorRequestEmails({
      mentorName: selected.name,
      mentorEmail: selected.email,
      juniorName: form.junior_name,
      juniorEmail: form.junior_email,
      message: form.message,
    });
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PublicPageShell
          title="🤝 Find Your Mentor"
          subtitle="Connect with senior students for guidance and support"
          icon={<Users className="w-6 h-6" />}
        >
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {MENTOR_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  yearFilter === y ? 'bg-navy-dark text-white' : 'bg-white border border-navy-dark/10'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {MENTOR_SPECIALIZATIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSpecFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  specFilter === s ? 'bg-orange-burnt text-white' : 'bg-white border border-navy-dark/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-orange-burnt" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl border border-navy-dark/10 p-5 shadow-sm flex flex-col"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-burnt/10 mx-auto overflow-hidden flex items-center justify-center">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-orange-burnt" />
                    )}
                  </div>
                  <h3 className="font-display font-bold text-center text-navy-dark mt-3">{m.name}</h3>
                  <p className="text-xs text-center text-navy-dark/50">{m.year}</p>
                  <div className="mt-3 space-y-1 text-xs text-navy-dark/70">
                    <p className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-orange-burnt" /> {m.specialization}
                    </p>
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-burnt" /> {m.available_time}
                    </p>
                  </div>
                  <p className="text-xs text-navy-dark/60 mt-3 flex-grow italic">{m.bio}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(m);
                      setSent(false);
                      setForm({
                        junior_name: '',
                        junior_email: '',
                        junior_year: YEAR_OPTIONS[0],
                        message: '',
                      });
                    }}
                    className="mt-4 w-full py-2.5 bg-orange-burnt text-white font-bold rounded-lg text-sm"
                  >
                    Connect →
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </PublicPageShell>
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Connect with ${selected.name}` : ''}
        icon={<Users className="w-5 h-5" />}
      >
        {sent ? (
          <p className="text-center py-6 font-display font-bold text-emerald-600">
            Request sent to {selected?.name}!
          </p>
        ) : (
          <form onSubmit={sendRequest} className="space-y-3">
            <input
              required
              placeholder="Your Name *"
              value={form.junior_name}
              onChange={(e) => setForm({ ...form, junior_name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm"
            />
            <input
              type="email"
              required
              placeholder="Your Email *"
              value={form.junior_email}
              onChange={(e) => setForm({ ...form, junior_email: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm"
            />
            <select
              value={form.junior_year}
              onChange={(e) => setForm({ ...form, junior_year: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm bg-white"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <textarea
              rows={3}
              placeholder="Message"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 text-sm resize-none"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex-1 py-2 border border-navy-dark/15 rounded-lg text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-orange-burnt text-white rounded-lg text-sm font-bold"
              >
                Send Request →
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Mentors;
