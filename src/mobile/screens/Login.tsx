import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { ShieldCheck, Lock, GraduationCap, Loader2, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginComplete: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginComplete }) => {
  const { studentProfile, signInWithGoogle, refreshProfile } = useStudentAuth();
  const toast = useToast();

  const [step, setStep] = useState<'login' | 'prn'>('login');
  const [prnInput, setPrnInput] = useState('');
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Transition to PRN step if student logged in but not verified
  useEffect(() => {
    if (studentProfile) {
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
      <div className="absolute top-[-20%] left-[-20%] w-[80%] aspect-square rounded-full bg-orange-burnt/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />

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
      </div>

      {/* Dynamic Slide Steps */}
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
                <p className="text-white/60 text-xs font-sans">Google authentication is required to access your student portal.</p>
              </div>

              {/* Login Button Container */}
              <div className="space-y-4">
                {/* Google Login Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-white hover:bg-gray-100 text-black font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
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

              </div>
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
                    className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/75 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                  >
                    Add Later
                  </button>
                  
                  <button
                    onClick={handlePrnVerify}
                    disabled={isVerifying || !prnInput.trim()}
                    className="flex-1 py-3 bg-orange-burnt hover:bg-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
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
