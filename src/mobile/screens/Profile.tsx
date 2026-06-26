import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, BookOpen, Clock, Heart, 
  CheckCircle, MessageSquare, LogOut, 
  BadgeCheck, Loader2, Edit, Fingerprint, Trash2, Sun, Moon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { useToast } from '../../components/admin/Toast';
import { useThemeContext } from '../../lib/ThemeProvider';

const getRoleBadgeClasses = (role: string): string => {
  const badgeMap: Record<string, string> = {
    super_admin: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    developer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    president: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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
    student: 'Student'
  };
  return labelMap[role] || 'Student';
};

export const Profile: React.FC = () => {
  const { studentProfile, signOut, refreshProfile } = useStudentAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { theme, toggleTheme } = useThemeContext();

  const [activeTab, setActiveTab] = useState<'registrations' | 'services' | 'bookmarks' | 'questions'>('registrations');
  const [serviceRegistrations, setServiceRegistrations] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('First Year');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
  const [askedQuestions, setAskedQuestions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

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

  // Sync state with profile details
  useEffect(() => {
    if (studentProfile) {
      setFullName(studentProfile.full_name || '');
      setYear(studentProfile.year || 'First Year');
      setPhone(studentProfile.phone || '');
    }
  }, [studentProfile]);

  // Fetch PRN Verification Info
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

  // Load registered passes, Q&As, and bookmarks
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

        // 4. Fetch service registrations
        const { data: svcRegs } = await supabase
          .from('registrations')
          .select('*, service:services(name, category, thumbnail)')
          .eq('email', studentProfile.email)
          .order('created_at', { ascending: false });
        setServiceRegistrations(svcRegs || []);

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
    toast.info('Event removed from saved shortlist');
  };

  if (!studentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
        <User className="w-12 h-12 text-white/25 mb-3" />
        <h3 className="font-display font-bold text-white text-base">Not Signed In</h3>
        <p className="text-white/50 text-xs mt-1 mb-6">Please log in to your verified student portal account.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-orange-burnt text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 pt-2">
      {/* Profile Card Summary */}
      <div className="bg-[#0D1B3E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-burnt/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-burnt to-gold-accent rounded-full blur opacity-30" />
            <div className="relative w-16 h-16 rounded-full bg-[#121E3D] border border-white/20 overflow-hidden flex items-center justify-center shadow">
              {studentProfile.avatar_url ? (
                <img 
                  src={studentProfile.avatar_url} 
                  alt={studentProfile.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-orange-burnt" />
              )}
            </div>
          </div>

          {/* Name & Badge details */}
          <div className="space-y-1 min-w-0">
            <h2 className="font-display font-extrabold text-base text-white truncate leading-tight">
              {studentProfile.full_name}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[8px] font-bold text-orange-burnt uppercase tracking-widest bg-orange-burnt/10 px-2 py-0.5 rounded-full border border-orange-burnt/25">
                Portal Verified
              </span>
              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getRoleBadgeClasses(studentProfile.role || 'student')}`}>
                {getRoleLabel(studentProfile.role || 'student')}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-white/5 my-4" />

        {/* Info editor toggle */}
        {!isEditing ? (
          <div className="space-y-2.5 text-xs text-white/70">
            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Mail className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
              <div className="min-w-0 truncate">
                <span className="block text-[8px] text-white/40 uppercase font-semibold">Email ID</span>
                <span className="font-semibold text-white/90 truncate block">{studentProfile.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <BookOpen className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
              <div>
                <span className="block text-[8px] text-white/40 uppercase font-semibold">Academic Year</span>
                <span className="font-semibold text-white/90">{studentProfile.year || 'First Year'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
              <Phone className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
              <div>
                <span className="block text-[8px] text-white/40 uppercase font-semibold">WhatsApp Link</span>
                <span className="font-semibold text-white/90">{studentProfile.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 hover:border-orange-burnt bg-white/5 text-white font-display text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Edit className="w-3 h-3" /> Edit Info
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-display text-[10px] font-bold uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[8px] font-bold text-white/50 uppercase pl-1 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#0F1E42] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-burnt"
              />
            </div>
            <div>
              <label className="block text-[8px] font-bold text-white/50 uppercase pl-1 mb-1">Academic Year</label>
              <select
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full bg-[#0F1E42] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-burnt"
              >
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Final Year">Final Year</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] font-bold text-white/50 uppercase pl-1 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-[#0F1E42] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-burnt"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-grow py-2 bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-grow py-2 bg-orange-burnt text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Info'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* PRN Verification Form Widget */}
      <div className="bg-[#0D1B3E]/95 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/10 rounded-full blur-xl pointer-events-none" />
        
        {verificationData?.verification_status === 'verified' ? (
          <div className="flex gap-3 items-start relative z-10">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <BadgeCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-display font-extrabold text-white mb-0.5">Student PRN Verified</h4>
              <p className="text-[10px] text-white/60 leading-relaxed font-sans">
                Official DBATU PRN: <span className="font-bold text-orange-burnt">{verificationData.prn}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="relative z-10 space-y-3">
            <div className="flex gap-2.5 items-start">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 mt-0.5 shrink-0">
                <Clock className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-display font-bold text-white mb-0.5">Verify Student Credentials</h4>
                <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                  Enter your DBATU PRN below to link and lock your profile details with the official university roster.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={prnInput}
                onChange={e => setPrnInput(e.target.value)}
                placeholder="e.g. 240467311..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
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
                    
                    const officialName = data.student_name || studentProfile?.full_name;
                    const officialYear = data.year || studentProfile?.year || 'First Year';
                    
                    const { error: profileErr } = await supabase.from('profiles').update({
                      full_name: officialName,
                      year: officialYear
                    }).eq('id', studentProfile?.id);
                    
                    if (profileErr) throw profileErr;
                    
                    setFullName(officialName);
                    setYear(officialYear);
                    setVerificationData({ ...data, user_id: studentProfile?.id, verification_status: 'verified' });
                    await refreshProfile();
                    toast.success('PRN verified successfully! Profile details updated.');
                  } catch (err: any) {
                    toast.error(err.message);
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                disabled={isVerifying}
                className="px-4 py-2 bg-orange-burnt hover:bg-[#E06D2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Verify'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Theme Toggle Card */}
      <div className="bg-[#0D1B3E]/95 border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {theme === 'dark' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </div>
          <div>
            <h4 className="text-xs font-display font-bold text-white">App Theme</h4>
            <p className="text-[10px] text-white/50 font-sans mt-0.5">
              Currently: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
            theme === 'dark' ? 'bg-indigo-500' : 'bg-amber-400'
          }`}
          aria-label="Toggle theme"
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Passkey Settings Widget */}
      <div className="bg-[#0D1B3E]/95 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex gap-2.5 items-start">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5 shrink-0">
              <Fingerprint className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-display font-bold text-white mb-0.5">Passkeys Security</h4>
              <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                Register a passkey to sign in password-free using biometrics (Touch ID, Face ID, Windows Hello) or security keys.
              </p>
            </div>
          </div>

          {/* Enrolled Passkeys List */}
          {isLoadingPasskeys ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          ) : passkeys.length > 0 ? (
            <div className="space-y-2">
              <span className="block text-[8px] font-bold text-white/40 uppercase tracking-wider pl-1">
                Enrolled Passkeys ({passkeys.length})
              </span>
              {passkeys.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-xs">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold text-white truncate text-[11px]">{pk.friendly_name || 'Unnamed Passkey'}</span>
                      <span className="block text-[8px] text-white/40">
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
            <div className="p-3 text-center rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-white/45 font-sans">
              No passkeys enrolled yet.
            </div>
          )}

          {/* Enrollment Interface */}
          {showPasskeyForm ? (
            <form onSubmit={handleRegisterPasskey} className="space-y-3 pt-1">
              <div>
                <label className="block text-[8px] font-bold text-white/50 uppercase pl-1 mb-1">Passkey Device Name</label>
                <input
                  type="text"
                  required
                  value={newPasskeyName}
                  onChange={(e) => setNewPasskeyName(e.target.value)}
                  placeholder="e.g. My Phone, Personal Laptop"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-400 transition-colors placeholder-white/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowPasskeyForm(false); setNewPasskeyName(''); }}
                  className="flex-1 py-2 bg-white/5 border border-white/10 text-white/70 text-[10px] font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegisteringPasskey || !newPasskeyName.trim()}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                >
                  {isRegisteringPasskey ? 'Enrolling...' : 'Register'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowPasskeyForm(true)}
              className="w-full py-2 bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-white font-display text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer rounded-xl"
            >
              <span>➕ Enroll New Passkey</span>
            </button>
          )}
        </div>
      </div>

      {/* Activity Logs Navigation Tab Control */}
      <div className="bg-[#080F25]/85 border border-white/10 rounded-2xl p-1 flex gap-1 overflow-x-auto scrollbar-hide">
        {[
          { id: 'registrations', label: 'Events', icon: CheckCircle },
          { id: 'services', label: 'Services', icon: BookOpen },
          { id: 'bookmarks', label: 'Bookmarks', icon: Heart },
          { id: 'questions', label: 'Q&A Logs', icon: MessageSquare },
        ].map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id as any);
              }}
              className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-display font-bold uppercase tracking-wide transition-all ${
                active 
                  ? 'bg-orange-burnt text-white shadow shadow-orange-burnt/15'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* List Container */}
      <div className="bg-[#080F25]/95 border border-white/5 rounded-2xl p-5 min-h-[250px] relative shadow-inner">
        {isLoadingData ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#080F25]/50 z-10">
            <Loader2 className="w-6 h-6 animate-spin text-orange-burnt" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Tab 1: Event registrations */}
            {activeTab === 'registrations' && (
              <motion.div
                key="regs"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Registered Event Passes</h4>
                  <span className="text-[9px] text-white/45 font-bold">{registeredEvents.length} registrations</span>
                </div>

                {registeredEvents.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-white/45">No registered events under this account.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {registeredEvents.map(reg => {
                      const ev = reg.event;
                      if (!ev) return null;
                      return (
                        <div key={reg.id} className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[8px] font-bold text-orange-burnt uppercase tracking-wider">{ev.type || 'Event'}</span>
                              <span className="text-[8px] text-white/45">{new Date(reg.created_at).toLocaleDateString('en-IN')}</span>
                            </div>
                            <h5 className="font-display font-bold text-xs text-white leading-snug truncate">{ev.name}</h5>
                            <span className="block text-[9px] text-white/50 mt-1">📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</span>
                          </div>

                          <div className="mt-3 flex gap-2 pt-2 border-t border-white/5">
                            <Link
                              to={`/feedback/${ev.id}`}
                              className="flex-1 py-1.5 text-center bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt text-[9px] font-display font-bold uppercase tracking-wider rounded-lg transition-colors"
                            >
                              Give Feedback
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 2: Bookmarked Events */}
            {activeTab === 'bookmarks' && (
              <motion.div
                key="bookmarks"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Bookmarked Events</h4>
                  <span className="text-[9px] text-white/45 font-bold">{bookmarkedEvents.length} items</span>
                </div>

                {bookmarkedEvents.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-white/45">No bookmarked events saved.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {bookmarkedEvents.map(ev => (
                      <div key={ev.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex justify-between items-center">
                        <div className="min-w-0">
                          <h5 className="font-display font-bold text-xs text-white leading-snug truncate">{ev.name}</h5>
                          <span className="text-[9px] text-white/50">📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex gap-1.5 shrink-0 pl-3">
                          <button 
                            onClick={() => removeBookmark(ev.id)}
                            className="p-1.5 text-red-400 bg-red-500/10 rounded-lg text-[9px] font-bold"
                          >
                            ✕
                          </button>
                          <Link 
                            to={`/register/${ev.id}`}
                            className="p-1.5 bg-orange-burnt text-white rounded-lg text-[9px] font-bold uppercase tracking-wider"
                          >
                            Join
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Tab 3: Asked Questions logs */}
            {activeTab === 'questions' && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">Submitted Inquiries</h4>
                  <span className="text-[9px] text-white/45 font-bold">{askedQuestions.length} asked</span>
                </div>

                {askedQuestions.length === 0 ? (
                  <div className="text-center py-10 border border-white/5 rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-white/45">No submitted Q&As yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {askedQuestions.map(q => (
                      <div key={q.id} className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-[9px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            q.status === 'answered' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {q.status}
                          </span>
                          <span className="text-white/40">{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-white/40 uppercase font-semibold">Inquiry:</span>
                          <p className="text-xs text-white/85 leading-relaxed font-sans">{q.question_text}</p>
                        </div>
                        {q.status === 'answered' && q.admin_reply && (
                          <div className="bg-orange-burnt/5 p-2.5 rounded-lg border border-orange-burnt/10 mt-1">
                            <span className="block text-[8px] font-bold text-orange-burnt uppercase">Council Reply:</span>
                            <p className="text-xs text-white/70 mt-0.5 font-sans leading-relaxed">{q.admin_reply}</p>
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
  );
};

export default Profile;
