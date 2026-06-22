import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { generateUploadAndDownloadReceipt } from '../lib/receiptPdf';
import { 
  User, Mail, Phone, Calendar, LogOut, CheckCircle, 
  MessageSquare, BookOpen, Clock, Heart, CreditCard, Download, Loader2, BadgeCheck, Fingerprint, Trash2
} from 'lucide-react';
import { useToast } from '../components/admin/Toast';

const getRoleBadgeClasses = (role: string): string => {
  const badgeMap: Record<string, string> = {
    super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    developer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    president: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    vice_president: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    general_secretary: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    secretary: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    treasurer: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    coordinator: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    student: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  };
  return badgeMap[role] || badgeMap.student;
};

const getRoleLabel = (role: string): string => {
  const labelMap: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Council Admin',
    developer: 'Developer',
    president: 'President',
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    secretary: 'Secretary',
    treasurer: 'Treasurer',
    coordinator: 'Coordinator',
    student: 'Student'
  };
  return labelMap[role] || 'Student';
};

export const StudentProfile: React.FC = () => {
  const { studentProfile, signOut, refreshProfile, isLoading: isAuthLoading } = useStudentAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'registrations' | 'bookmarks' | 'questions' | 'payments'>('registrations');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('First Year');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  const [prnInput, setPrnInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationData, setVerificationData] = useState<any>(null);

  // Passkeys State
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [showPasskeyForm, setShowPasskeyForm] = useState(false);

  const fetchPasskeys = async () => {
    if (!studentProfile) return;
    setIsLoadingPasskeys(true);
    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      setPasskeys(data || []);
    } catch (err: any) {
      console.error('Error fetching passkeys:', err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  useEffect(() => {
    if (studentProfile) {
      fetchPasskeys();
    }
  }, [studentProfile]);

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasskeyName.trim()) return;
    setIsRegisteringPasskey(true);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      
      // Post-register: rename credential to friendlyName
      if (data?.id) {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: newPasskeyName.trim()
        });
      }
      
      toast.success('✅ Passkey registered successfully!');
      setNewPasskeyName('');
      setShowPasskeyForm(false);
      fetchPasskeys();
    } catch (err: any) {
      console.error('Error registering passkey:', err);
      let errMsg = err.message || 'Passkey registration failed.';
      if (err.name === 'NotAllowedError' || errMsg.includes('abort') || errMsg.includes('cancel')) {
        errMsg = 'Passkey registration cancelled.';
      }
      toast.error('❌ ' + errMsg);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!window.confirm('Are you sure you want to delete this passkey? You won\'t be able to use it to sign in anymore.')) return;
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      toast.success('✅ Passkey deleted successfully!');
      fetchPasskeys();
    } catch (err: any) {
      console.error('Error deleting passkey:', err);
      toast.error('❌ Failed to delete passkey: ' + err.message);
    }
  };

  // Sync state with profile
  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.full_name || '');
      setYear(studentProfile.year || 'First Year');
      setPhone(studentProfile.phone || '');
    }
  }, [studentProfile]);

  // Fetch Verification Data
  useEffect(() => {
    if (!studentProfile) return;
    const fetchVerification = async () => {
      try {
        const { data } = await supabase
          .from('student_verifications')
          .select('*')
          .eq('user_id', studentProfile.id)
          .single();
        if (data) setVerificationData(data);
      } catch (err) {}
    };
    fetchVerification();
  }, [studentProfile]);

  // Load and check authorization
  useEffect(() => {
    if (!isAuthLoading) {
      if (!studentProfile) {
        navigate('/');
      } else {
        const isComplete = studentProfile.full_name && 
                           studentProfile.full_name !== 'Student' && 
                           studentProfile.full_name !== 'Member' && 
                           studentProfile.phone && 
                           studentProfile.course &&
                           studentProfile.semester;
        if (!isComplete) {
          navigate('/complete-profile');
        }
      }
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

  // ── Standalone payment fetcher — called on mount AND on tab switch ────────
  const fetchMyPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (authUser?.id && authUser?.email) {
        // Use proper Supabase OR syntax with quoted string value
        query = query.or(`student_email.eq.${authUser.email},user_id.eq.${authUser.id}`);
      } else if (studentProfile?.email) {
        query = query.eq('student_email', studentProfile.email);
      }

      const { data: pays, error: paysErr } = await query;
      if (paysErr) {
        console.error('Payment fetch error:', paysErr.message, paysErr.code, paysErr.details);
      }
      // Deduplicate by id
      const unique = pays
        ? pays.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
        : [];
      setMyPayments(unique);
    } catch (err: any) {
      console.error('Payment fetch exception:', err.message);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  // Fetch payments on mount (when profile ready) and whenever Payments tab is opened
  useEffect(() => {
    if (!studentProfile) return;
    fetchMyPayments();
  }, [studentProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
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
                <div className="space-y-1.5">
                  <h2 className="font-display font-extrabold text-xl text-white leading-tight">
                    {studentProfile.full_name}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
                    <span className="text-[9px] font-bold text-orange-burnt uppercase tracking-widest bg-orange-burnt/10 px-2.5 py-0.5 rounded-full border border-orange-burnt/20">
                      Verified Portal
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getRoleBadgeClasses(studentProfile.role || 'student')}`}>
                      🛡️ {getRoleLabel(studentProfile.role || 'student')}
                    </span>
                  </div>

                  {/* Future-Ready Verification Badge */}
                  {verificationData?.verification_status === 'verified' ? (
                    <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Verified Student</span>
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Pending Verification</span>
                    </div>
                  )}
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

            {/* DBATU ERP Portal Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-burnt/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-orange-burnt">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                    DBATU ERP Portal
                  </h3>
                </div>
                
                <p className="text-white/60 text-xs leading-relaxed">
                  Access the official Dr. Babasaheb Ambedkar Technological University portal directly to fill out exam forms, view results, and manage your university registration.
                </p>

                <a
                  href="https://mis.dbatu.ac.in/erp/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 border border-white/10 hover:shadow-lg shadow-orange-burnt/10 cursor-pointer"
                >
                  <span>Launch ERP Portal ↗</span>
                </a>

                {/* PRN Verification Section */}
                <div className="w-full mt-6 bg-gradient-to-br from-[#0B152A] to-navy-dark border border-white/10 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-burnt/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-orange-burnt/20 transition-colors" />
                  
                  {verificationData?.verification_status === 'verified' ? (
                    <div className="flex items-start space-x-3 relative z-10">
                      <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <BadgeCheck className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-display font-extrabold text-white mb-1">Student PRN Verified</h4>
                        <p className="text-[11px] text-white/60 leading-relaxed font-sans mb-2">
                          Your account is permanently linked to your official DBATU PRN: <span className="font-bold text-orange-burnt">{verificationData.prn}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className="flex items-start space-x-3 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-xl shrink-0">
                          <BadgeCheck className="w-5 h-5 text-amber-500 mt-0.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-display font-extrabold text-white mb-1">Verify Your PRN</h4>
                          <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                            Enter your official university PRN below to link your account to the official student database.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={prnInput}
                          onChange={(e) => setPrnInput(e.target.value)}
                          placeholder="e.g. 240467311..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-burnt transition-colors"
                        />
                        <button
                          onClick={async () => {
                            if (!prnInput.trim() || prnInput.length < 5) return toast.error('Please enter a valid PRN');
                            setIsVerifying(true);
                            try {
                              const { data, error } = await supabase.from('student_verifications').select('*').eq('prn', prnInput.trim()).single();
                              if (error || !data) throw new Error('PRN not found in database. Contact council member.');
                              if (data.user_id && data.user_id !== studentProfile?.id) throw new Error('This PRN is already claimed.');
                              
                              const { error: updateErr } = await supabase.from('student_verifications').update({ 
                                user_id: studentProfile?.id, verification_status: 'verified', updated_at: new Date().toISOString()
                              }).eq('id', data.id);
                              if (updateErr) throw updateErr;
                              
                              // Autofill and update the user's profile with official data
                              const officialName = data.student_name || studentProfile?.full_name;
                              const officialYear = data.year || studentProfile?.year || 'First Year';
                              
                              const { error: profileErr } = await supabase.from('profiles').update({
                                full_name: officialName,
                                year: officialYear
                              }).eq('id', studentProfile?.id);
                              
                              if (profileErr) throw profileErr;
                              
                              // Update local state to show immediately
                              setFullName(officialName);
                              setYear(officialYear);
                              setVerificationData({ ...data, user_id: studentProfile?.id, verification_status: 'verified' });
                              
                              // Trigger a refetch of the profile in context
                              await refreshProfile();
                              
                              toast.success('Verified! Profile updated with official details.');
                            } catch (err: any) {
                              toast.error(err.message);
                            } finally {
                              setIsVerifying(false);
                            }
                          }}
                          disabled={isVerifying}
                          className="px-4 py-2.5 bg-orange-burnt hover:bg-[#E06D2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Passkey Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 bg-[#080F25]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-[#3B82F6]">
                  <Fingerprint className="w-5 h-5 animate-pulse" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                    Passkeys Security
                  </h3>
                </div>
                
                <p className="text-white/60 text-xs leading-relaxed">
                  Register a passkey to sign in password-free using biometrics (Touch ID, Face ID, Windows Hello) or security keys.
                </p>

                {/* Enrolled Passkeys List */}
                {isLoadingPasskeys ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#3B82F6]" />
                  </div>
                ) : passkeys.length > 0 ? (
                  <div className="space-y-2.5">
                    <span className="block text-[9px] font-bold text-white/40 uppercase tracking-wider pl-1">
                      Enrolled Passkeys ({passkeys.length})
                    </span>
                    {passkeys.map((pk) => (
                      <div key={pk.id} className="flex items-center justify-between bg-white/5 border border-white/5 px-3 py-2.5 rounded-xl text-xs">
                        <div className="flex items-center space-x-2.5">
                          <Fingerprint className="w-4 h-4 text-[#3B82F6] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="block font-semibold text-white truncate">{pk.friendly_name || 'Unnamed Passkey'}</span>
                            <span className="block text-[9px] text-white/40">
                              Added {new Date(pk.created_at).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePasskey(pk.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete Passkey"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/45">
                    No passkeys enrolled yet.
                  </div>
                )}

                {/* Enrollment Interface */}
                {showPasskeyForm ? (
                  <form onSubmit={handleRegisterPasskey} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-white/50 uppercase mb-1 pl-1">Passkey Device Name</label>
                      <input
                        type="text"
                        required
                        value={newPasskeyName}
                        onChange={(e) => setNewPasskeyName(e.target.value)}
                        placeholder="e.g. My Phone, Personal Laptop"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#3B82F6] transition-colors"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setShowPasskeyForm(false); setNewPasskeyName(''); }}
                        className="flex-1 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isRegisteringPasskey || !newPasskeyName.trim()}
                        className="flex-1 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        {isRegisteringPasskey ? 'Enrolling...' : 'Register'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowPasskeyForm(true)}
                    className="w-full py-2.5 rounded-xl border border-white/10 hover:border-[#3B82F6] bg-white/5 hover:bg-[#3B82F6]/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>➕ Enroll New Passkey</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Portal Activity & Event Lists */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab controls */}
            <div className="bg-[#080F25]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 flex gap-1 flex-wrap">
              {[
                { id: 'registrations', label: 'Events',   icon: CheckCircle },
                { id: 'bookmarks',    label: 'Saved',    icon: Heart },
                { id: 'questions',    label: 'Q&A',      icon: MessageSquare },
                { id: 'payments',     label: 'Payments', icon: CreditCard },
              ].map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id as any);
                      // Re-fetch payments every time Payments tab is opened
                      if (t.id === 'payments') fetchMyPayments();
                    }}
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
              
              {(isLoadingData || (activeTab === 'payments' && isLoadingPayments)) ? (
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
                                  q.status === 'answered'
                                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                                    : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {q.status === 'answered' ? 'Answered' : 'Pending Reply'}
                                </span>
                                <span className="text-[9px] text-white/40">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                              </div>
                              
                              <div>
                                <span className="block text-[10px] text-white/40 uppercase">My Question</span>
                                <p className="text-xs text-white/80 font-sans">{q.question_text}</p>
                              </div>

                              {q.status === 'answered' && q.admin_reply && (
                                <div className="bg-orange-burnt/5 p-3 rounded-xl border border-orange-burnt/10 mt-2">
                                  <span className="block text-[9px] font-bold text-orange-burnt uppercase tracking-wider">Council Response</span>
                                  <p className="text-xs text-white/70 font-sans mt-0.5">{q.admin_reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Tab 4: Payment History */}
                  {activeTab === 'payments' && (
                    <motion.div
                      key="payments"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-extrabold text-white text-base uppercase">Payment History</h3>
                        <div className="flex items-center space-x-3">
                          <span className="text-[10px] text-white/50">{myPayments.filter(p => p.status === 'completed').length} successful</span>
                          <button
                            onClick={fetchMyPayments}
                            disabled={isLoadingPayments}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-orange-burnt/10 border border-white/10 hover:border-orange-burnt/30 text-white/50 hover:text-orange-burnt text-[10px] font-display font-bold uppercase transition-all disabled:opacity-40"
                          >
                            <Loader2 className={`w-3 h-3 ${isLoadingPayments ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                          </button>
                        </div>
                      </div>

                      {myPayments.length === 0 ? (
                        <div className="text-center py-16 border border-white/5 rounded-2xl bg-white/[0.02]">
                          <CreditCard className="w-12 h-12 mx-auto text-white/20 mb-3" />
                          <p className="text-sm text-white/50 font-sans">No payments found for your account.</p>
                          <button
                            onClick={fetchMyPayments}
                            className="mt-3 inline-block text-orange-burnt/70 hover:text-orange-burnt text-xs font-display font-bold uppercase hover:underline"
                          >
                            Try refreshing →
                          </button>
                        </div>

                      ) : (
                        <div className="space-y-3">
                          {myPayments.map((pay) => {
                            const isCompleted = pay.status === 'completed';
                            const isFailed    = pay.status === 'failed';
                            return (
                              <div
                                key={pay.id}
                                className="border border-white/10 bg-white/5 rounded-2xl p-4 hover:border-orange-burnt/30 transition-all"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    {/* Purpose + Status */}
                                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                      <span className="font-display font-bold text-white text-sm leading-tight">{pay.purpose}</span>
                                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                                        isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : isFailed  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                      }`}>
                                        {isCompleted ? '✅ Paid' : isFailed ? '❌ Failed' : '⏳ Pending'}
                                      </span>
                                    </div>

                                    {/* Amount */}
                                    <p className="text-orange-burnt font-display font-extrabold text-base">₹{pay.amount}</p>

                                    {/* Meta */}
                                    <div className="mt-1 space-y-0.5">
                                      {pay.order_id && (
                                        <p className="text-[9px] text-white/40 font-mono">Order: {pay.order_id}</p>
                                      )}
                                      {pay.payment_id && (
                                        <p className="text-[9px] text-white/40 font-mono">Payment: {pay.payment_id}</p>
                                      )}
                                      <p className="text-[10px] text-white/40 flex items-center space-x-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(pay.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Download Receipt */}
                                  {isCompleted && (
                                    <button
                                      onClick={async () => {
                                        if (pay.receipt_url) {
                                          window.open(pay.receipt_url, '_blank');
                                          return;
                                        }
                                        // Generate on-the-fly
                                        setDownloadingId(pay.id);
                                        try {
                                          await generateUploadAndDownloadReceipt({
                                            paymentId:   pay.payment_id || pay.id,
                                            orderId:     pay.order_id,
                                            studentName: pay.student_name,
                                            studentEmail: pay.student_email,
                                            studentYear: pay.student_year,
                                            purpose:     pay.purpose,
                                            amount:      pay.amount,
                                            status:      pay.status,
                                            date:        new Date(pay.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                                          }, true);
                                        } finally {
                                          setDownloadingId(null);
                                        }
                                      }}
                                      disabled={downloadingId === pay.id}
                                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-orange-burnt/10 hover:bg-orange-burnt/20 border border-orange-burnt/20 text-orange-burnt text-[10px] font-display font-bold uppercase tracking-wider transition-all shrink-0 disabled:opacity-50"
                                    >
                                      {downloadingId === pay.id
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Download className="w-3.5 h-3.5" />
                                      }
                                      <span>Receipt</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
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
