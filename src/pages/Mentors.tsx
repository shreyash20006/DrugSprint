import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Handshake, CheckCircle2, GraduationCap, Clock, BookOpen,
  Search, X, User
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { DNALoader } from '../components/DNALoader';

const SPECIALIZATIONS = ['All', 'Pharmacology', 'Pharmaceutics', 'Chemistry', 'Research', 'Placements'];

export const Mentors: React.FC = () => {
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
      const { data } = await supabase.from('mentors').select('*').eq('is_available', true).order('created_at', { ascending: false });
      setMentors(data || []);
      setIsLoading(false);
    };
    fetch();
  }, []);

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
        junior_name: reqName, junior_email: reqEmail,
        junior_year: reqYear, message: reqMessage,
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
    setReqName(''); setReqEmail(''); setReqYear(''); setReqMessage('');
    setRequestSent(false);
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
        icon={<Handshake className="w-6 h-6 animate-pulse" />}
        title="Find a Mentor"
        subtitle="Connect with senior students for academic guidance, syllabus tips, career advice, and general guidance"
        breadcrumb="Mentors"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3.5 mb-12 justify-center bg-[#0D1B3E]/85 backdrop-blur-[16px] p-4 rounded-2xl border border-orange-burnt/25 shadow-2xl">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mentors..."
              className="pl-10 pr-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#050B18] outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-orange-burnt transition-colors w-full sm:w-56"
            />
          </div>
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-orange-burnt/20 outline-none text-xs sm:text-sm font-sans text-white bg-[#050B18] focus:border-orange-burnt transition-colors w-full sm:w-auto cursor-pointer"
          >
            <option className="bg-[#0D1B3E]" value="All">All Years</option>
            <option className="bg-[#0D1B3E]" value="B.Pharm III">B.Pharm III</option>
            <option className="bg-[#0D1B3E]" value="B.Pharm IV">B.Pharm IV</option>
            <option className="bg-[#0D1B3E]" value="M.Pharm">M.Pharm</option>
          </select>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {SPECIALIZATIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpecFilter(s)}
                className={`px-4 py-2.5 rounded-xl font-display text-xs font-bold transition-all duration-300 border ${
                  specFilter === s
                    ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white border-transparent shadow-lg shadow-orange-burnt/15'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mentor Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <DNALoader />
            <span className="text-xs font-bold font-display uppercase tracking-widest text-white/50 mt-4 animate-pulse">Loading Mentors...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl max-w-lg mx-auto flex flex-col items-center p-6 shadow-2xl">
            <Handshake className="w-12 h-12 text-white/10 mx-auto mb-3" />
            <h3 className="font-display font-bold text-white/70 mb-1">No Mentors Available</h3>
            <p className="text-white/50 text-sm font-sans">No mentors match the selected filters currently.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filtered.map(mentor => (
              <motion.div
                key={mentor.id}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.2)' }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 backdrop-blur-[16px] rounded-2xl shadow-[0_8px_32px_rgba(5,11,24,0.4)] p-6 flex flex-col items-center text-center hover:border-orange-burnt/40 transition-all duration-300"
              >
                {/* Avatar with gold-orange rotating ring */}
                <div className="relative w-20 h-20 rounded-full shrink-0 flex items-center justify-center overflow-hidden mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-burnt to-gold-accent animate-spin opacity-85" style={{ animationDuration: '6s' }} />
                  <div className="absolute inset-[3px] rounded-full bg-[#0D1B3E]" />
                  <div className="relative w-[68px] h-[68px] rounded-full bg-[#0F1E42]/80 flex items-center justify-center text-orange-burnt font-display font-bold text-lg overflow-hidden">
                    {mentor.photo_url ? (
                      <img src={mentor.photo_url} alt={mentor.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-white/30" />
                    )}
                  </div>
                </div>

                <h3 className="font-display font-bold text-base text-white mb-1.5">{mentor.name}</h3>
                <div className="flex items-center space-x-1.5 text-white/50 text-xs mb-2">
                  <GraduationCap className="w-4 h-4 text-orange-burnt" />
                  <span>{mentor.year}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-orange-burnt text-xs font-bold mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{mentor.specialization}</span>
                </div>
                {mentor.available_time && (
                  <div className="flex items-center space-x-1.5 text-white/40 text-[10px] mb-3">
                    <Clock className="w-3.5 h-3.5 text-orange-burnt" />
                    <span>{mentor.available_time}</span>
                  </div>
                )}
                {mentor.bio && <p className="text-xs text-white/60 font-sans leading-relaxed mb-5 flex-grow">{mentor.bio}</p>}
                
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-white/5 hover:border-transparent active:scale-98 flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Handshake className="w-4 h-4 text-orange-burnt hover:text-white transition-colors" />
                  <span>Connect →</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Connect Modal */}
      <AnimatePresence>
        {selectedMentor && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div onClick={closeModal} className="absolute inset-0 cursor-default" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#0D1B3E] w-full max-w-md rounded-2xl shadow-2xl border border-orange-burnt/35 overflow-hidden z-10"
            >
              <div className="bg-[#050B18] text-white px-6 py-4 flex items-center justify-between border-b border-orange-burnt/10 shrink-0">
                <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">Connect with {selectedMentor.name}</h4>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {requestSent ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
                  <h3 className="font-display font-extrabold text-lg text-white mb-2">Request Sent! 🎉</h3>
                  <p className="text-white/70 text-sm font-sans">Your mentorship request has been sent to <strong>{selectedMentor.name}</strong>.</p>
                </div>
              ) : (
                <form onSubmit={handleConnect} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={e => setReqName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#0F1E42]/60 outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-orange-burnt transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={e => setReqEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#0F1E42]/60 outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-orange-burnt transition-colors shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">Your Year *</label>
                    <select
                      required
                      value={reqYear}
                      onChange={e => setReqYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#0F1E42]/60 outline-none text-xs sm:text-sm font-sans text-white focus:border-orange-burnt transition-colors cursor-pointer"
                    >
                      <option className="bg-[#0D1B3E] text-white" value="">Select Year</option>
                      <option className="bg-[#0D1B3E] text-white" value="B.Pharm I">B.Pharm I</option>
                      <option className="bg-[#0D1B3E] text-white" value="B.Pharm II">B.Pharm II</option>
                      <option className="bg-[#0D1B3E] text-white" value="B.Pharm III">B.Pharm III</option>
                      <option className="bg-[#0D1B3E] text-white" value="D.Pharm I">D.Pharm I</option>
                      <option className="bg-[#0D1B3E] text-white" value="D.Pharm II">D.Pharm II</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1.5">Message</label>
                    <textarea
                      value={reqMessage}
                      onChange={e => setReqMessage(e.target.value)}
                      rows={3}
                      placeholder="Tell the mentor what you need help with..."
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-burnt/20 bg-[#0F1E42]/60 outline-none text-xs sm:text-sm font-sans text-white placeholder-white/30 focus:border-orange-burnt transition-colors resize-none shadow-inner"
                    />
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 py-2.5 rounded-xl border border-orange-burnt/20 text-white/60 hover:text-white font-display text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-orange-burnt/20 text-white font-display text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 border border-white/5 flex items-center justify-center space-x-1.5"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <DNALoader />
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <span>Send Request</span>
                      )}
                    </button>
                  </div>
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
