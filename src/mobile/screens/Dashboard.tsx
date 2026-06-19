import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, HelpCircle, Calendar, MessageSquare, ChevronRight, 
  Loader2, Send, X, AlertCircle, BookOpen, User, Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { sendQuestionEmail } from '../../lib/brevo';
import { councilMembers } from '../../data/council';

interface DashboardProps {
  onNavigateTab: (tab: 'home' | 'notices' | 'resources' | 'events' | 'profile') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { studentProfile } = useStudentAuth();
  const navigate = useNavigate();
  
  // States
  const [stats, setStats] = useState({ students: 263, notices: 8, events: 3 });
  const [featuredNotice, setFeaturedNotice] = useState<any>(null);

  
  // Suggestion Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: 'B.Pharm I Year',
    directedTo: 'General Council',
    question: ''
  });

  // Pre-fill from auth profile
  useEffect(() => {
    if (studentProfile) {
      setFormData(prev => ({
        ...prev,
        name: studentProfile.full_name || prev.name,
        email: studentProfile.email || prev.email,
        year: studentProfile.year || prev.year
      }));
    }
  }, [studentProfile]);

  // Fetch Stats & Featured Pinned Alert Notice
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch live database counts
        const [noticesRes, eventsRes, profilesRes] = await Promise.all([
          supabase.from('notices').select('id', { count: 'exact', head: true }),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('profiles').select('id', { count: 'exact', head: true })
        ]);

        setStats({
          notices: noticesRes.count || 8,
          events: eventsRes.count || 3,
          students: (profilesRes.count || 0) > 10 ? profilesRes.count! : 263
        });

        // 2. Fetch the latest pinned alert/notice to display in the hero banner
        const { data: latestAlerts } = await supabase
          .from('notices')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1);

        if (latestAlerts && latestAlerts.length > 0) {
          setFeaturedNotice(latestAlerts[0]);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.question) return;

    setIsSubmitting(true);
    try {
      // 1. Save to Supabase
      const { error } = await supabase.from('questions').insert([
        {
          student_name: formData.name,
          student_email: formData.email,
          student_year: formData.year,
          directed_to: formData.directedTo,
          question_text: formData.question,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      // 2. Email alert via Brevo
      const targetedMember = councilMembers.find((m) => m.name === formData.directedTo);
      const memberEmail = targetedMember ? targetedMember.email : "sb108750@gmail.com";

      await sendQuestionEmail({
        studentName: formData.name,
        studentYear: formData.year,
        directedTo: formData.directedTo,
        questionText: formData.question,
        memberEmail: memberEmail
      });

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsModalOpen(false);
        setFormData(prev => ({
          ...prev,
          question: ''
        }));
      }, 2500);

    } catch (err: any) {
      alert(`Error submitting suggestion: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Hero Section */}
      <section className="space-y-1.5 pt-4">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Main Dashboard
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          Student Resource Hub
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Connect with council operations, check vital examinations data, read active alerts, or submit a suggestion instantly.
        </p>
      </section>

      {/* Dynamic Featured Banner */}
      <div 
        onClick={() => onNavigateTab('notices')}
        className="relative w-full h-44 rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-[#0D1B3E] cursor-pointer active:scale-[0.98] transition-all group"
      >
        <img 
          className="w-full h-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105" 
          alt="Pharmacy Campus Courtyard" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjxLg__qr-pV0YkQ7StLbKZXD2QahrJyqVq7WP58tLpu37sUFdD59V_SQk0ZOWWsVwoq9MPqzotf0T-3hoQAaynMl4yaPOTiwbKRPw4A7LTQzZfhaN0cFUj3dsZCD9WohaXl0C3VLP85IQmPYKAVltRX3Ir9xLzPRDKlXeIa-gyRgbHtCCSxy9o18N3xSRZBNX4jeAId3FU3s1juBvEuF49MQt8OjGRbbKtyfqNG9mcUc4xpd45elCoPhkE9uF0cM915pj6zdtaNc"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080F25] via-[#080F25]/75 to-transparent flex flex-col justify-end p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-orange-burnt text-white text-[9px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> ALERT
            </span>
            <span className="text-white/40 text-[10px] font-semibold">
              {featuredNotice ? new Date(featuredNotice.created_at).toLocaleDateString('en-IN') : '2 mins ago'}
            </span>
          </div>
          <h3 className="text-white font-display font-bold text-sm leading-snug line-clamp-1">
            {featuredNotice ? featuredNotice.title : 'Mid-Semester Exam Timetable Released'}
          </h3>
          <p className="text-orange-burnt text-xs font-display font-bold flex items-center gap-1 mt-1">
            View Updates & Documents →
          </p>
        </div>
      </div>

      {/* Bento Grid Resource Hub */}
      <section className="grid grid-cols-2 gap-4">
        {/* Notice Board */}
        <button 
          onClick={() => onNavigateTab('notices')}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col items-start text-left space-y-3 transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl flex items-center justify-center text-orange-burnt group-hover:bg-orange-burnt group-hover:text-white transition-colors">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-white block">Notice Board</span>
            <p className="text-[10px] text-white/55 font-sans mt-0.5">Official alerts & daily schedules</p>
          </div>
        </button>

        {/* Exam Timetable */}
        <button 
          onClick={() => navigate('/exams')}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col items-start text-left space-y-3 transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl flex items-center justify-center text-orange-burnt group-hover:bg-orange-burnt group-hover:text-white transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-white block">Exam Timetable</span>
            <p className="text-[10px] text-white/55 font-sans mt-0.5">Schedules & subject dates</p>
          </div>
        </button>

        {/* Upcoming Events */}
        <button 
          onClick={() => onNavigateTab('events')}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col items-start text-left space-y-3 transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl flex items-center justify-center text-orange-burnt group-hover:bg-orange-burnt group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-white block">Events Board</span>
            <p className="text-[10px] text-white/55 font-sans mt-0.5">Symposiums & cultural fests</p>
          </div>
        </button>

        {/* Ask the Council */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex flex-col items-start text-left space-y-3 transition-all active:scale-95 group"
        >
          <div className="w-11 h-11 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl flex items-center justify-center text-orange-burnt group-hover:bg-orange-burnt group-hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-bold text-xs text-white block">Ask Council</span>
            <p className="text-[10px] text-white/55 font-sans mt-0.5">Grievance & queries submissions</p>
          </div>
        </button>



        {/* My Student Profile (Wide Card) */}
        <button 
          onClick={() => onNavigateTab('profile')}
          className="col-span-2 bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-4.5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group text-left"
        >
          <div className="w-12 h-12 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl flex items-center justify-center text-orange-burnt shrink-0 shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-grow">
            <span className="font-display font-bold text-xs text-white block">Student Profile & Credentials</span>
            <p className="text-[10px] text-white/55 font-sans mt-0.5">PRN verification, pass receipts, & bookmarks</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Help & Support (Wide Card) - App Logo Box & Email Redirect */}
        <a 
          href="mailto:contact@tgpcopcouncil.online"
          className="col-span-2 bg-[#0F1E42]/50 border border-white/10 p-4.5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-burnt/10 border border-orange-burnt/25 overflow-hidden shrink-0 flex items-center justify-center">
            <img 
              alt="App Logo" 
              className="w-8 h-8 object-cover rounded" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjyoTFvyEFR975TtIY9lyKfrLHfAXGGF7JVgRdFBnE3cjc_gdwumA6XC0MYZ8tDiGPAd-05hNEfr_es_OMw0IXeZI0U3ByOSbo7Aw6AWqidd0bijT8_gmtzYoRal4igXr20dWvPdxxXpI6MAorWCQbO3ZWGMqvhJ1-k2d_VLPgdNUj20x2iOPW87FxHEiITNw-wgKgekzPjPx8DckrX8giHDyjcoz5gw-mLAv8it8EbMsQEgTAoAXLylFsQjS52NE90FdsyerwVJc"
            />
          </div>
          <div className="flex-grow">
            <span className="font-display font-bold text-xs text-white/90 block">Help & Support Desk</span>
            <p className="text-[10px] text-white/45 font-sans mt-0.5">Send query to contact@tgpcopcouncil.online</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:translate-x-1 transition-transform" />
        </a>
      </section>

      {/* Quick Stats Section */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-extrabold text-sm text-white">Current Engagement</h3>
          <span className="text-[9px] font-bold text-orange-burnt bg-orange-burnt/10 border border-orange-burnt/25 px-2 py-0.5 rounded-full uppercase tracking-wider blink-dot">
            Live Update
          </span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          <div className="min-w-[110px] flex-1 bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xl font-display font-extrabold text-orange-burnt">{stats.students}</span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-1">Students</span>
          </div>
          <div className="min-w-[110px] flex-1 bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xl font-display font-extrabold text-orange-burnt">{stats.notices}</span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-1">Notices</span>
          </div>
          <div className="min-w-[110px] flex-1 bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xl font-display font-extrabold text-orange-burnt">{stats.events}</span>
            <span className="text-[9px] text-white/50 uppercase tracking-widest font-bold mt-1">Events</span>
          </div>
        </div>
      </section>

      {/* AI Assistant Float FAB */}
      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
        className="fixed right-5 bottom-40 w-12 h-12 bg-gradient-to-r from-purple-600 to-[#E25822] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 border-2 border-white/20 shadow-purple-500/30"
        title="Ask Council AI"
      >
        <Sparkles className="w-5 h-5 text-white animate-pulse" />
      </button>

      {/* Suggestion Box Float FAB */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed right-5 bottom-24 w-12 h-12 bg-orange-burnt text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 border border-white/10"
      >
        <MessageSquare className="w-5 h-5 fill-white/10" />
      </button>

      {/* Suggestion Box Modal Drawer Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-end justify-center p-0 bg-black/70 backdrop-blur-sm">
            <div onClick={() => setIsModalOpen(false)} className="absolute inset-0" />
            
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
                  <MessageSquare className="w-5 h-5 text-orange-burnt" />
                  <h3 className="font-display font-extrabold text-lg text-white">Ask / Suggestion Box</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 pl-1">
                        Name
                      </label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name" 
                        className="w-full bg-[#0F1E42]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/25"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 pl-1">
                        Registered Email
                      </label>
                      <input 
                        type="email" 
                        required 
                        readOnly={!!studentProfile}
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your.email@example.com" 
                        className={`w-full border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors placeholder-white/25 ${
                          studentProfile ? 'bg-white/5 cursor-not-allowed text-white/45' : 'bg-[#0F1E42]/60 focus:border-orange-burnt'
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 pl-1">
                          Year
                        </label>
                        <select 
                          value={formData.year}
                          onChange={e => setFormData({ ...formData, year: e.target.value })}
                          className="w-full bg-[#0F1E42] border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-burnt"
                        >
                          <option>B.Pharm I Year</option>
                          <option>B.Pharm II Year</option>
                          <option>B.Pharm III Year</option>
                          <option>B.Pharm IV Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 pl-1">
                          Direct To
                        </label>
                        <select 
                          value={formData.directedTo}
                          onChange={e => setFormData({ ...formData, directedTo: e.target.value })}
                          className="w-full bg-[#0F1E42] border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-burnt"
                        >
                          <option value="General Council">General Council</option>
                          {councilMembers.map(m => (
                            <option key={m.name} value={m.name}>{m.role.split(' ')[0]} - {m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5 pl-1">
                        Question / Suggestion
                      </label>
                      <textarea 
                        required
                        rows={4}
                        value={formData.question}
                        onChange={e => setFormData({ ...formData, question: e.target.value })}
                        placeholder="Provide details about your query or feedback..." 
                        className="w-full bg-[#0F1E42]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none transition-colors placeholder-white/25"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-10 text-center"
                  >
                    <span className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl mb-4 animate-bounce">
                      ✓
                    </span>
                    <h4 className="font-display font-bold text-white text-base">Inquiry Submitted!</h4>
                    <p className="text-white/60 text-xs font-sans mt-1 max-w-xs leading-relaxed">
                      Thank you for contacting the Council. Your grievance has been recorded and directed successfully.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
