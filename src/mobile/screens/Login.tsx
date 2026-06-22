import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { ShieldCheck, Lock, GraduationCap, Loader2, Sparkles, Mail, Phone, BookOpen, User, Fingerprint } from 'lucide-react';

interface LoginProps {
  onLoginComplete: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginComplete }) => {
  const { studentProfile, signInWithGoogle, refreshProfile } = useStudentAuth();
  const toast = useToast();

  const [step, setStep] = useState<'login' | 'complete-profile' | 'prn'>('login');
  const [prnInput, setPrnInput] = useState('');
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Email OTP states
  const [loginMethod, setLoginMethod] = useState<'options' | 'otp'>('options');
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Complete Profile states
  const [fullNameInput, setFullNameInput] = useState('');
  const [courseInput, setCourseInput] = useState('B.Pharm');
  const [semesterInput, setSemesterInput] = useState('Semester I');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Semesters config for mobile
  const SEMESTER_OPTIONS: Record<string, string[]> = {
    'B.Pharm': [
      'Semester I', 'Semester II', 'Semester III', 'Semester IV',
      'Semester V', 'Semester VI', 'Semester VII', 'Semester VIII'
    ],
    'D.Pharm': ['Year I', 'Year II'],
    'M.Pharm': ['Semester I', 'Semester II', 'Semester III', 'Semester IV']
  };

  // Reset semester selection when course changes
  useEffect(() => {
    if (SEMESTER_OPTIONS[courseInput] && !SEMESTER_OPTIONS[courseInput].includes(semesterInput)) {
      setSemesterInput(SEMESTER_OPTIONS[courseInput][0]);
    }
  }, [courseInput]);

  // Cooldown countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  // Transition steps based on login and profile state
  useEffect(() => {
    if (studentProfile) {
      const isComplete = studentProfile.full_name && 
                         studentProfile.full_name !== 'Student' && 
                         studentProfile.full_name !== 'Member' && 
                         studentProfile.phone && 
                         studentProfile.course &&
                         studentProfile.semester;

      if (!isComplete) {
        setStep('complete-profile');
        // Pre-fill name from Google/LinkedIn details if available
        const name = studentProfile.full_name || '';
        if (name !== 'Student' && name !== 'Member') {
          setFullNameInput(name);
        }
        if (studentProfile.course) {
          setCourseInput(studentProfile.course);
        }
        if (studentProfile.semester) {
          setSemesterInput(studentProfile.semester);
        }
        if (studentProfile.prn) {
          setPrnInput(studentProfile.prn);
        }
        setPhoneInput(studentProfile.phone || '');
      } else {
        // Check if already verified
        const checkVerification = async () => {
          try {
            const { data } = await supabase
              .from('student_verifications')
              .select('*')
              .eq('user_id', studentProfile.id)
              .single();
            
            if (data && data.verification_status === 'verified') {
              // Already verified, complete onboarding instantly
              onLoginComplete();
            } else {
              // Not verified, transition to PRN step
              setStep('prn');
            }
          } catch (err) {
            // No verification record, show PRN step
            setStep('prn');
          }
        };
        checkVerification();
      }
    } else {
      setStep('login');
    }
  }, [studentProfile, onLoginComplete]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully logged in via Google!');
    } catch (err: any) {
      console.error('[StudentLogin] Google login error:', err);
      let errorMsg = 'Unknown error';
      if (err) {
        if (typeof err === 'string') {
          errorMsg = err;
        } else if (err.message) {
          errorMsg = err.message;
        } else if (err.error) {
          errorMsg = err.error;
        } else {
          errorMsg = JSON.stringify(err);
        }
      }
      toast.error(`❌ Google Login failed: ${errorMsg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: window.location.origin + '/profile',
        }
      });
      if (error) throw error;
      toast.success('Redirecting to LinkedIn...');
    } catch (err: any) {
      console.error('[StudentLogin] LinkedIn login error:', err);
      toast.error(`❌ LinkedIn Login failed: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) throw error;
      console.log('Passkey sign-in successful:', data);
      toast.success('Signed in successfully with Passkey!');
      onLoginComplete();
    } catch (err: any) {
      console.error('[StudentLogin] Passkey login error:', err);
      let errMsg = err.message || 'Passkey sign-in failed.';
      if (err.name === 'NotAllowedError' || errMsg.includes('abort') || errMsg.includes('cancel')) {
        errMsg = 'Passkey sign-in cancelled.';
      }
      toast.error(`❌ Passkey login failed: ${errMsg}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) {
      return toast.error('Please enter a valid email address');
    }
    setIsSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailInput.trim(),
        options: {
          shouldCreateUser: true
        }
      });
      if (error) throw error;
      setOtpStep('verify');
      setCooldown(60);
      toast.success('Verification code sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length !== 8) {
      return toast.error('Please enter the 8-digit verification code');
    }
    setIsVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailInput.trim(),
        token: otpInput.trim(),
        type: 'email'
      });
      if (error) throw error;
      toast.success('OTP verified successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) return;
    if (!fullNameInput.trim() || fullNameInput.trim().length < 3) {
      return toast.error('Please enter your full name (minimum 3 characters)');
    }
    if (!phoneInput.trim() || phoneInput.trim().length < 10) {
      return toast.error('Please enter a valid phone number (minimum 10 digits)');
    }
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullNameInput.trim(),
          course: courseInput,
          semester: semesterInput,
          prn: prnInput.trim() || null,
          year: `${courseInput} - ${semesterInput}`,
          phone: phoneInput.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentProfile.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success('Profile details saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePrnVerify = async () => {
    if (!prnInput.trim() || prnInput.length < 5) {
      return toast.error('Please enter a valid PRN');
    }
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('student_verifications')
        .select('*')
        .eq('prn', prnInput.trim())
        .maybeSingle();

      if (error || !data) {
        throw new Error('PRN not found in university database. Please check or contact council.');
      }
      if (data.user_id && data.user_id !== studentProfile?.id) {
        throw new Error('This PRN has already been claimed by another student account.');
      }

      // Link and verify
      const { error: updateErr } = await supabase
        .from('student_verifications')
        .update({
          user_id: studentProfile?.id,
          verification_status: 'verified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (updateErr) throw updateErr;

      const officialName = data.student_name || studentProfile?.full_name || 'Student';
      const officialYear = data.year || studentProfile?.year || 'First Year';

      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: officialName,
          year: officialYear,
        })
        .eq('id', studentProfile?.id);

      if (profileErr) throw profileErr;

      await refreshProfile();
      toast.success('Credentials verified successfully!');
      onLoginComplete();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddLater = () => {
    localStorage.setItem('skip_prn_verification', 'true');
    toast.info('You can verify your PRN later from the Profile tab.');
    onLoginComplete();
  };


  return (
    <div className="min-h-screen bg-[#050B18] text-white flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Decorative Blur Background Orbs */}
      <motion.div
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full ambient-orb-orange pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -25, 20, 0],
          y: [0, 20, -30, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full ambient-orb-gold pointer-events-none"
      />

      {/* Header Info */}
      <div className="pt-12 text-center z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 1 }}
          className="w-20 h-20 mx-auto bg-gradient-to-tr from-orange-burnt to-[#FF8C42] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-burnt/10 border border-white/10 mb-5 relative"
        >
          {/* Custom logo details */}
          <span className="text-3xl font-display font-black text-white select-none">T</span>
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full border-2 border-[#050B18] flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white animate-spin-slow" />
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-display font-extrabold text-2xl text-white tracking-tight"
        >
          TGPCOP Nagpur
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-white/50 text-xs tracking-wider uppercase font-semibold mt-1"
        >
          Student Portal App
        </motion.p>
      </div>      {/* Dynamic Slide Steps */}
      <div className="my-auto py-8 z-10 w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          {step === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-1.5">
                <h2 className="font-display font-bold text-lg text-white">Student Sign In</h2>
                <p className="text-white/60 text-xs font-sans">Access the TGPCOP Nagpur student portal using Google or Email OTP.</p>
              </div>

              <AnimatePresence mode="wait">
                {loginMethod === 'options' ? (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    {/* Google Login Button */}
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-white hover:bg-gray-100 text-black font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-4 h-4 animate-spin text-orange-burnt" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      )}
                      <span>Sign in with Google</span>
                    </button>

                    {/* LinkedIn Login Button */}
                    <button
                      onClick={handleLinkedInLogin}
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-[#0077B5] hover:bg-[#006297] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0 fill-white" viewBox="0 0 24 24" width="20" height="20">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                      )}
                      <span>Sign in with LinkedIn</span>
                    </button>

                    {/* Passkey Login Button */}
                    <button
                      onClick={handlePasskeyLogin}
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Fingerprint className="w-5 h-5 text-white animate-pulse" />
                      <span>Sign in with Passkey</span>
                    </button>

                    {/* Email OTP Login Button */}
                    <button
                      onClick={() => {
                        setLoginMethod('otp');
                        setOtpStep('email');
                      }}
                      disabled={isLoggingIn}
                      className="w-full py-4 bg-transparent hover:bg-white/5 border border-white/10 hover:border-orange-burnt/50 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Mail className="w-5 h-5 text-orange-burnt" />
                      <span>Sign in with Email OTP</span>
                    </button>
                  </motion.div>
                ) : otpStep === 'email' ? (
                  <motion.form
                    key="email-input"
                    onSubmit={handleSendOtp}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="email"
                        required
                        placeholder="Enter email address"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        disabled={isSendingOtp}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-all"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('options')}
                        className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingOtp || !emailInput.trim()}
                        className="flex-1 py-3 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <span>Send OTP</span>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form
                    key="verify-input"
                    onSubmit={handleVerifyOtp}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <div className="text-left bg-white/5 border border-white/10 p-3 rounded-xl">
                      <p className="text-[9px] text-white/50 uppercase tracking-wider">Sending OTP to</p>
                      <p className="text-xs text-white font-bold truncate">{emailInput}</p>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        placeholder="Enter 8-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        disabled={isVerifyingOtp}
                        className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white tracking-[0.2em] text-center placeholder-white/20 focus:border-orange-burnt transition-all font-mono font-bold"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setOtpStep('email')}
                        className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isVerifyingOtp || otpInput.trim().length !== 8}
                        className="flex-1 py-3 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                        ) : (
                          <span>Verify OTP</span>
                        )}
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        disabled={cooldown > 0 || isSendingOtp}
                        onClick={() => handleSendOtp()}
                        className="text-xs font-display font-bold uppercase tracking-wider text-orange-burnt hover:text-[#E06D2B] disabled:text-white/30 transition-colors cursor-pointer"
                      >
                        {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          ) : step === 'complete-profile' ? (
            <motion.div
              key="complete-profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <User className="w-10 h-10 text-orange-burnt mx-auto animate-pulse" />
                <h2 className="font-display font-bold text-lg text-white">Complete Profile</h2>
                <p className="text-white/60 text-xs font-sans leading-relaxed">
                  Provide your details to unlock student dashboards and event passes.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-all"
                  />
                </div>

                {/* Course Dropdown */}
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select
                    value={courseInput}
                    onChange={(e) => setCourseInput(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#080F25] outline-none text-xs text-white focus:border-orange-burnt transition-all appearance-none cursor-pointer"
                  >
                    <option value="B.Pharm">B.Pharm (Bachelor of Pharmacy)</option>
                    <option value="D.Pharm">D.Pharm (Diploma in Pharmacy)</option>
                    <option value="M.Pharm">M.Pharm (Master of Pharmacy)</option>
                  </select>
                </div>

                {/* Year / Semester Dropdown */}
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <select
                    value={semesterInput}
                    onChange={(e) => setSemesterInput(e.target.value)}
                    disabled={isSavingProfile}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#080F25] outline-none text-xs text-white focus:border-orange-burnt transition-all appearance-none cursor-pointer"
                  >
                    {SEMESTER_OPTIONS[courseInput]?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Optional PRN input */}
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="PRN Number (Optional)"
                    value={prnInput}
                    onChange={(e) => setPrnInput(e.target.value.replace(/\s/g, ''))}
                    disabled={isSavingProfile}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-all"
                  />
                </div>

                {/* WhatsApp Phone */}
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp Phone Number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    disabled={isSavingProfile}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingProfile || !fullNameInput.trim() || !phoneInput.trim()}
                  className="w-full py-3.5 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    <span>Save & Continue</span>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="prn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <GraduationCap className="w-10 h-10 text-orange-burnt mx-auto animate-bounce" />
                <h2 className="font-display font-bold text-lg text-white">Student Verification</h2>
                <p className="text-white/60 text-xs font-sans leading-relaxed">
                  To link your account to your academic record, please enter your DBATU university enrollment PRN number.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={prnInput}
                    onChange={(e) => setPrnInput(e.target.value)}
                    placeholder="e.g. 240467311..."
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F1E42]/80 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleAddLater}
                    className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Add Later
                  </button>
                  
                  <button
                    onClick={handlePrnVerify}
                    disabled={isVerifying || !prnInput.trim()}
                    className="flex-1 py-3 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="pb-6 text-center text-white/20 text-[9px] font-sans tracking-wide">
        Developed by Shreyash Borkar • TGPCOP Nagpur
      </div>
    </div>
  );
};
