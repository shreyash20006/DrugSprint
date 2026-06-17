import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Handshake, GraduationCap, Clock, BookOpen, Search, X, User, Loader2 } from 'lucide-react';
import { useStudentAuth } from '../../lib/StudentAuthProvider';

const SPECIALIZATIONS = ['All', 'Pharmacology', 'Pharmaceutics', 'Chemistry', 'Research', 'Placements'];

export const Mentors: React.FC = () => {
  const { studentProfile } = useStudentAuth();

  const [mentors, setMentors] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('All');
  const [specFilter, setSpecFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Request modal
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqYear, setReqYear] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });
      setMentors(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (studentProfile) {
      setReqName(studentProfile.full_name || '');
      setReqEmail(studentProfile.email || '');
      setReqYear(studentProfile.year || '');
    }
  }, [studentProfile, selectedMentor]);

  useEffect(() => {
    let result = [...mentors];
    if (yearFilter !== 'All') result = result.filter(m => m.year === yearFilter);
    if (specFilter !== 'All') result = result.filter(m => m.specialization.toLowerCase() === specFilter.toLowerCase());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(q) || m.specialization.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [mentors, yearFilter, specFilter, searchQuery]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqYear || !selectedMentor) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('mentor_requests').insert({
        mentor_id: selectedMentor.id,
        junior_name: reqName,
        junior_email: reqEmail,
        junior_year: reqYear,
        message: reqMessage,
      });
      if (error) throw error;
      setRequestSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedMentor(null);
    setReqMessage('');
    setRequestSent(false);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Handshake className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Mentorship Program
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Find a Senior Mentor
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Connect with senior students for notes guidance, exam tips, syllabus recommendations, or general college life advice.
        </p>
      </section>

      {/* Search & Filters */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-lg space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentors by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/5 bg-[#050B18]/60 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-colors placeholder-white/20"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-white/5 bg-[#050B18]/80 outline-none text-xs text-white focus:border-orange-burnt appearance-none cursor-pointer"
          >
            <option value="All">All Years</option>
            <option value="B.Pharm III">B.Pharm III</option>
            <option value="B.Pharm IV">B.Pharm IV</option>
            <option value="M.Pharm">M.Pharm</option>
          </select>

          <select
            value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl border border-white/5 bg-[#050B18]/80 outline-none text-xs text-white focus:border-orange-burnt appearance-none cursor-pointer"
          >
            <option value="All">All Topics</option>
            {SPECIALIZATIONS.slice(1).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-orange-burnt animate-spin" />
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Loading Mentors...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#0F1E42]/40 border border-white/5 rounded-2xl px-6">
          <Handshake className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <h3 className="font-display font-bold text-xs text-white">No Mentors Found</h3>
          <p className="text-[10px] text-white/45 max-w-xs mx-auto mt-1 leading-relaxed">
            No active mentors match the selected filters currently.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((mentor) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center overflow-hidden shrink-0">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={mentor.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">{mentor.name}</h3>
                    <div className="flex items-center gap-1 text-white/50 text-[10px] mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5 text-orange-burnt" />
                      <span>{mentor.year}</span>
                    </div>
                  </div>
                </div>

                <span className="bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>{mentor.specialization}</span>
                </span>
              </div>

              {mentor.available_time && (
                <div className="flex items-center gap-1.5 text-white/45 text-[9px] font-sans">
                  <Clock className="w-3.5 h-3.5 text-orange-burnt" />
                  <span>Available: {mentor.available_time}</span>
                </div>
              )}

              {mentor.bio && (
                <p className="text-[11px] text-white/60 leading-relaxed font-sans border-t border-white/5 pt-2">
                  {mentor.bio}
                </p>
              )}

              <button
                onClick={() => setSelectedMentor(mentor)}
                className="w-full py-2.5 bg-orange-burnt/10 hover:bg-orange-burnt text-orange-burnt hover:text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-orange-burnt/25 flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>Connect with Mentor</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Connect Modal Drawer overlay */}
      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center p-0 bg-black/70 backdrop-blur-sm">
            <div onClick={closeModal} className="absolute inset-0" />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10"
            >
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <Handshake className="w-5 h-5 text-orange-burnt" />
                  <h3 className="font-display font-extrabold text-base text-white">Connect with {selectedMentor.name}</h3>
                </div>
                <button onClick={closeModal} className="p-1 rounded-xl bg-white/5 text-white/60">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {requestSent ? (
                <div className="py-8 text-center space-y-3">
                  <span className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400 text-xl mx-auto animate-bounce">
                    ✓
                  </span>
                  <h4 className="font-display font-bold text-white text-base">Request Sent Successfully</h4>
                  <p className="text-white/60 text-xs font-sans max-w-xs mx-auto leading-relaxed">
                    Your request has been forwarded to <strong>{selectedMentor.name}</strong>. They will contact you via email soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConnect} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={e => setReqName(e.target.value)}
                      placeholder="Full name"
                      className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                      Your Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={e => setReqEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt placeholder-white/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                      Your Year
                    </label>
                    <select
                      required
                      value={reqYear}
                      onChange={e => setReqYear(e.target.value)}
                      className="w-full bg-[#050B18] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-orange-burnt appearance-none"
                    >
                      <option value="">Select Year</option>
                      <option value="B.Pharm I">B.Pharm I Year</option>
                      <option value="B.Pharm II">B.Pharm II Year</option>
                      <option value="B.Pharm III">B.Pharm III Year</option>
                      <option value="D.Pharm I">D.Pharm I Year</option>
                      <option value="D.Pharm II">D.Pharm II Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                      Inquiry Message
                    </label>
                    <textarea
                      value={reqMessage}
                      onChange={e => setReqMessage(e.target.value)}
                      rows={3}
                      placeholder="Explain what topics or subjects you need help with..."
                      className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none placeholder-white/20 font-sans"
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
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <span>Send Request</span>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Mentors;
