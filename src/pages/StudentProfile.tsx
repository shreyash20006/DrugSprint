import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { 
  User, Mail, Phone, Calendar, LogOut, CheckCircle, 
  MessageSquare, BookOpen, Clock, Heart
} from 'lucide-react';
import { useToast } from '../components/admin/Toast';

export const StudentProfile: React.FC = () => {
  const { studentProfile, signOut, refreshProfile, isLoading: isAuthLoading } = useStudentAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'questions'>('registrations');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('First Year');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Sync state with profile
  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.full_name || '');
      setYear(studentProfile.year || 'First Year');
      setPhone(studentProfile.phone || '');
    }
  }, [studentProfile]);

  // Load and check authorization
  useEffect(() => {
    if (!isAuthLoading && !studentProfile) {
      navigate('/');
    }
  }, [studentProfile, isAuthLoading, navigate]);

  // Fetch student events, bookmarks and questions
  useEffect(() => {
    if (!studentProfile) return;

    const fetchProfileData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Fetch event registrations
        const { data: regs, error: regsErr } = await supabase
          .from('event_registrations')
          .select('*, event:events(*)')
          .eq('email', studentProfile.email);

        if (regsErr) throw regsErr;
        setRegisteredEvents(regs || []);

        // 2. Fetch bookmarks from localStorage
        const storedBookmarks: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
        if (storedBookmarks.length > 0) {
          const { data: books, error: booksErr } = await supabase
            .from('events')
            .select('*')
            .in('id', storedBookmarks);
          
          if (!booksErr && books) {
            setBookmarkedEvents(books);
          }
        } else {
          setBookmarkedEvents([]);
        }

        // 3. Fetch asked questions
        const { data: quests, error: questsErr } = await supabase
          .from('questions')
          .select('*')
          .eq('student_email', studentProfile.email)
          .order('created_at', { ascending: false });

        if (!questsErr && quests) {
          setAskedQuestions(quests);
        }
      } catch (err: any) {
        console.error('Error loading student profile data:', err.message);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfileData();
  }, [studentProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          full_name: fullName,
          year: year,
          phone: phone,
        })
        .eq('id', studentProfile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sign out successful!');
      navigate('/');
    } catch (err: any) {
      toast.error('Error signing out');
    }
  };

  const removeBookmark = (eventId: string) => {
    const stored: string[] = JSON.parse(localStorage.getItem('tgpcop_saved_events') || '[]');
    const updated = stored.filter(id => id !== eventId);
    localStorage.setItem('tgpcop_saved_events', JSON.stringify(updated));
    setBookmarkedEvents(prev => prev.filter(e => e.id !== eventId));
    toast.info('Event removed from saved list');
  };

  if (isAuthLoading || !studentProfile) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-burnt border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050B18] pt-32 pb-24 overflow-hidden">
      {/* Background glowing orbs & grids */}
      <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-10 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Card & Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Dynamic glass glow lines */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-orange-burnt/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Pic */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-burnt to-gold-accent rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500" />
                  <div className="relative w-24 h-24 rounded-full bg-[#121E3D] border-2 border-white/20 overflow-hidden flex items-center justify-center shadow-lg">
                    {studentProfile.avatar_url ? (
                      <img 
                        src={studentProfile.avatar_url} 
                        alt={studentProfile.full_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-orange-burnt" />
                    )}
                  </div>
                </div>

                {/* Name & Role */}
                <div>
                  <h2 className="font-display font-extrabold text-xl text-white">{studentProfile.full_name}</h2>
                  <span className="text-[10px] font-bold text-orange-burnt uppercase tracking-widest bg-orange-burnt/10 px-2.5 py-1 rounded-full border border-orange-burnt/20 mt-1 inline-block">
                    Verified Student Portal
                  </span>
                </div>

                <div className="w-full border-t border-white/5 my-4" />

                {/* Fields details */}
                {!isEditing ? (
                  <div className="w-full space-y-3.5 text-left text-xs text-white/70">
                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <Mail className="w-4 h-4 text-orange-burnt shrink-0" />
                      <div className="truncate">
                        <span className="block text-[10px] text-white/40 uppercase">Email ID</span>
                        <span className="font-semibold text-white">{studentProfile.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <BookOpen className="w-4 h-4 text-orange-burnt shrink-0" />
                      <div>
                        <span className="block text-[10px] text-white/40 uppercase">Academic Year</span>
                        <span className="font-semibold text-white">{studentProfile.year || 'First Year'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                      <Phone className="w-4 h-4 text-orange-burnt shrink-0" />
                      <div>
                        <span className="block text-[10px] text-white/40 uppercase">WhatsApp Number</span>
                        <span className="font-semibold text-white">{studentProfile.phone || 'Not provided'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full mt-4 py-2.5 rounded-xl border border-white/10 hover:border-orange-burnt bg-white/5 hover:bg-orange-burnt/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      ✏️ Edit Profile Info
                    </button>
                  </div>
                ) : (
                  // Edit Profile Form
                  <form onSubmit={handleSave} className="w-full space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">Academic Year</label>
                      <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#080F25] border border-white/10 text-white text-xs outline-none focus:border-orange-burnt transition-all"
                      >
                        <option value="First Year">First Year</option>
                        <option value="Second Year">Second Year</option>
                        <option value="Third Year">Third Year</option>
                        <option value="Final Year">Final Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">WhatsApp Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. +91 9876543210"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all"
                      />
                    </div>

                    <div className="flex space-x-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-orange-burnt/20"
                      >
                        {isSaving ? 'Saving...' : 'Save Info'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="w-full border-t border-white/5 my-4" />

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-display text-xs font-bold uppercase tracking-wider transition-all border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Account</span>
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Portal Activity & Event Lists */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab controls */}
            <div className="bg-[#080F25]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex gap-1">
              {[
                { id: 'registrations', label: 'Registered Events', icon: CheckCircle },
                { id: 'bookmarks', label: 'Saved Events', icon: Heart },
                { id: 'questions', label: 'Q&A Questions', icon: MessageSquare }
              ].map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wide transition-all ${
                      active 
                        ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-lg shadow-orange-burnt/10'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Lists */}
            <div className="bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 min-h-[400px] shadow-2xl relative">
              
              {isLoadingData ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-orange-burnt border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* Tab 1: Registered Events */}
                  {activeTab === 'registrations' && (
                    <motion.div
                      key="regs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-extrabold text-white text-base uppercase">Registered Passes</h3>
                        <span className="text-[10px] text-white/50">{registeredEvents.length} active registers</span>
                      </div>

                      {registeredEvents.length === 0 ? (
                        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/20">
                          <Calendar className="w-12 h-12 mx-auto text-white/20 mb-3" />
                          <p className="text-sm text-white/50 font-sans">No event registrations found under this email.</p>
                          <Link to="/events" className="mt-4 inline-block text-orange-burnt text-xs font-display font-bold uppercase hover:underline">
                            Browse upcoming events →
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {registeredEvents.map((reg) => {
                            const ev = reg.event;
                            if (!ev) return null;
                            const d = new Date(ev.date);
                            return (
                              <div 
                                key={reg.id} 
                                className="border border-white/10 bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-burnt/30 transition-all shadow-inner"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[9px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                      {ev.type || 'Event'}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-semibold flex items-center">
                                      <Clock className="w-2.5 h-2.5 mr-1" />
                                      {new Date(reg.created_at).toLocaleDateString('en-IN')}
                                    </span>
                                  </div>
                                  <h4 className="font-display font-bold text-white text-sm leading-snug line-clamp-1">{ev.name}</h4>
                                  <p className="text-[10px] text-white/60 font-semibold mt-1">
                                    📅 {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                  <p className="text-[10px] text-white/40 mt-0.5">📍 {ev.location || 'College Hall'}</p>
                                </div>

                                <div className="mt-4 flex gap-2">
                                  <Link
                                    to={`/feedback/${ev.id}`}
                                    className="flex-1 py-1.5 text-center rounded-xl bg-orange-burnt/10 hover:bg-orange-burnt/20 border border-orange-burnt/20 text-orange-burnt text-[10px] font-display font-bold uppercase tracking-wider transition-all"
                                  >
                                    ✍️ Give Feedback
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 2: Bookmarks */}
                  {activeTab === 'bookmarks' && (
                    <motion.div
                      key="bookmarks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-extrabold text-white text-base uppercase">Saved Event Shortlist</h3>
                        <span className="text-[10px] text-white/50">{bookmarkedEvents.length} items saved</span>
                      </div>

                      {bookmarkedEvents.length === 0 ? (
                        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/20">
                          <Heart className="w-12 h-12 mx-auto text-white/20 mb-3 animate-pulse" />
                          <p className="text-sm text-white/50 font-sans">No saved bookmarks on this browser yet.</p>
                          <Link to="/events" className="mt-4 inline-block text-orange-burnt text-xs font-display font-bold uppercase hover:underline">
                            Bookmark events here →
                          </Link>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {bookmarkedEvents.map((ev) => {
                            const d = new Date(ev.date);
                            return (
                              <div 
                                key={ev.id} 
                                className="border border-white/10 bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:border-orange-burnt/30 transition-all"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[9px] font-extrabold uppercase bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt px-2 py-0.5 rounded-full">
                                      {ev.type || 'Event'}
                                    </span>
                                    <button 
                                      onClick={() => removeBookmark(ev.id)}
                                      className="text-red-400 hover:text-red-300 p-1 transition-colors"
                                      title="Remove from saved"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <h4 className="font-display font-bold text-white text-sm line-clamp-1">{ev.name}</h4>
                                  <p className="text-[10px] text-white/60 font-semibold mt-1">
                                    📅 {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </p>
                                </div>

                                <div className="mt-4 flex gap-2">
                                  <Link
                                    to={`/register/${ev.id}`}
                                    className="flex-grow py-1.5 text-center rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-[10px] font-display font-bold uppercase tracking-wider transition-all shadow-md shadow-orange-burnt/10"
                                  >
                                    Register Now
                                  </Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 3: Q&A Questions */}
                  {activeTab === 'questions' && (
                    <motion.div
                      key="quests"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-extrabold text-white text-base uppercase">Ask Q&A Logs</h3>
                        <span className="text-[10px] text-white/50">{askedQuestions.length} queries asked</span>
                      </div>

                      {askedQuestions.length === 0 ? (
                        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/20">
                          <MessageSquare className="w-12 h-12 mx-auto text-white/20 mb-3" />
                          <p className="text-sm text-white/50 font-sans">No questions asked using this email yet.</p>
                          <Link to="/ask" className="mt-4 inline-block text-orange-burnt text-xs font-display font-bold uppercase hover:underline">
                            Submit a question →
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {askedQuestions.map((q) => (
                            <div 
                              key={q.id} 
                              className="border border-white/10 bg-white/5 rounded-2xl p-4 space-y-2.5 hover:border-orange-burnt/30 transition-all"
                            >
                              <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  q.is_answered 
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                    : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {q.is_answered ? 'Answered' : 'Pending Reply'}
                                </span>
                                <span className="text-[9px] text-white/40">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                              </div>
                              
                              <div>
                                <span className="block text-[10px] text-white/40 uppercase">My Question</span>
                                <p className="text-xs text-white/80 font-sans">{q.question_text}</p>
                              </div>

                              {q.is_answered && q.answer_text && (
                                <div className="bg-orange-burnt/5 p-3 rounded-xl border border-orange-burnt/10 mt-2">
                                  <span className="block text-[9px] font-bold text-orange-burnt uppercase tracking-wider">Council Response</span>
                                  <p className="text-xs text-white/70 font-sans mt-0.5">{q.answer_text}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentProfile;
