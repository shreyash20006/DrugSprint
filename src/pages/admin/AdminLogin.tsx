import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, Loader2, ArrowRight, User
} from 'lucide-react';
import { useToast } from '../../components/admin/Toast';
import { logAction } from '../../lib/logger';
import { useAuth } from '../../lib/AuthProvider';

const ROLE_REDIRECT: Record<string, string> = {
  super_admin:       '/super-admin',
  developer:         '/admin/developer',
  admin:             '/admin/dashboard',
  president:         '/president',
  vice_president:    '/vice-president',
  general_secretary: '/general-secretary',
  secretary:         '/secretary',
  treasurer:         '/treasurer',
  coordinator:       '/admin/dashboard',
  student:           '/dashboard',
};

export const AdminLogin: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { role, email, userId, provider, isLoading } = useAuth();

  // OTP Login states
  const [loginMethod, setLoginMethod] = useState<'options' | 'otp'>('options');
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Add custom Google Fonts for the new AI UI design
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=Geist:wght@700&display=swap';
    document.head.appendChild(fontLink);
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  // Parallax background effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle resend OTP cooldown
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

  useEffect(() => {
    if (!isLoading && email && userId) {
      const checkProfileAndRedirect = async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          const isStudent = (role === 'student' || (profile && profile.role === 'student'));
          const profileExists = profile && 
                                profile.full_name && 
                                profile.full_name !== 'Student' && 
                                profile.full_name !== 'Member' && 
                                (!isStudent || (profile.phone && profile.course && profile.semester));

          if (!profileExists) {
            navigate('/complete-profile', { replace: true });
          } else {
            const redirectPath = ROLE_REDIRECT[role ?? ''] ?? '/admin/dashboard';
            logAction('LOGIN', `${email} signed in via ${provider} with role=${role} → ${redirectPath}`);
            navigate(redirectPath, { replace: true });
          }
        } catch (err) {
          console.error('Error checking profile during redirection:', err);
          const redirectPath = ROLE_REDIRECT[role ?? ''] ?? '/admin/dashboard';
          navigate(redirectPath, { replace: true });
        }
      };
      checkProfileAndRedirect();
    }
  }, [role, email, userId, provider, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    const isNative = Capacitor.isNativePlatform();
    try {
      if (isNative) {
        GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        if (!idToken) throw new Error('Google Auth did not return an ID token.');
        const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
        if (error) throw error;
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin',
          queryParams: { prompt: 'select_account', access_type: 'offline' },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      let errMsg = 'Failed to initialize Google Sign-in.';
      if (err) {
        if (typeof err === 'string') errMsg = err;
        else if (err.message) errMsg = err.message;
        else if (err.error) errMsg = err.error;
        else errMsg = JSON.stringify(err);
      }
      setErrorMessage(errMsg);
      toast.error(`Google login failed: ${errMsg}`);
      setIsLoggingIn(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: window.location.origin + '/admin',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      let errMsg = 'Failed to initialize LinkedIn Sign-in.';
      if (err) {
        if (typeof err === 'string') errMsg = err;
        else if (err.message) errMsg = err.message;
        else if (err.error) errMsg = err.error;
        else errMsg = JSON.stringify(err);
      }
      setErrorMessage(errMsg);
      toast.error(`LinkedIn login failed: ${errMsg}`);
      setIsLoggingIn(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim()) {
      return toast.error('Please enter a valid email address');
    }
    setIsSendingOtp(true);
    setErrorMessage('');
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
      let errMsg = err.message || 'Failed to send verification code.';
      setErrorMessage(errMsg);
      toast.error(`Error: ${errMsg}`);
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
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailInput.trim(),
        token: otpInput.trim(),
        type: 'email'
      });
      if (error) throw error;
      toast.success('OTP verified successfully!');
    } catch (err: any) {
      let errMsg = err.message || 'Verification failed. Please check the code.';
      setErrorMessage(errMsg);
      toast.error(`Verification failed: ${errMsg}`);
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#080a0f] text-[#e1e2eb] overflow-auto flex flex-col justify-between selection:bg-[#ff7a21]/30 selection:text-white"
      data-testid="admin-login-page"
    >
      <main className="relative min-h-screen flex items-center justify-center pt-24 pb-20 px-4 overflow-hidden">
        {/* Ambient Background Layer */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full transition-transform duration-150 ease-out"
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 122, 33, 0.08) 0%, transparent 70%)',
              transform: `translate3d(${-parallax.x * 50}px, ${-parallax.y * 50}px, 0)`,
            }}
          />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0272b0]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff7a21]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-[560px] flex flex-col items-center">
          {/* Header Text */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a21] animate-pulse"></span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#e0c0b1]/80 font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                Security Portal Online
              </span>
            </div>
            <h1 className="text-4xl md:text-[64px] font-extrabold text-[#e1e2eb] leading-none mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              The <span className="text-[#ff7a21] italic" style={{ textShadow: '0 0 30px rgba(255, 122, 33, 0.4)' }}>Council</span> Portal
            </h1>
            <p className="text-lg text-[#e0c0b1]/70 max-w-md mx-auto" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              Unified access for the TGPCOP ecosystem. Sign in to your authorized workspace.
            </p>
          </div>

          {/* Main Card */}
          <motion.div
            className="w-full bg-[#10131a]/60 backdrop-blur-[40px] border border-white/[0.08] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl p-8 md:p-12 relative transition-transform duration-100 ease-out"
            style={{
              transform: `translate3d(${parallax.x * 15}px, ${parallax.y * 15}px, 0)`,
            }}
          >
            <div className="flex flex-col gap-10">
              {/* Login Section */}
              <div>
                <h2 className="text-3xl font-extrabold text-[#e1e2eb] mb-8 text-center md:text-left tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Sign in
                </h2>

                {/* Error */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      data-testid="login-error-message"
                      className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs px-4 py-3 rounded-xl mb-6 leading-relaxed font-sans"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auth Forms */}
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
                      {/* Google */}
                      <motion.button
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-14 bg-white/[0.03] border border-white/[0.08] backdrop-blur-[10px] transition-all duration-300 hover:bg-white/[0.08] hover:border-[#ff7a21]/40 rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            alt="Google"
                            className="w-5 h-5"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXh4TleaUAzQKdI5D9R2JzIJDveDksTrWYA8hEE1cBXzS_F0qhiH5iyLit9igKlhMjLHuBATb98f9x6r6RgxNFxVhBwMwpYvQdevDmjYdeX33RGDaETkDEG6hxgMmzUmY0ZvBFiutBvSpkLXo3icu5ErjoPhRlmjt-6vIiw8cFB0XsST8y7b2HiLlsm28pS-IplTgd4_KrGslEoTjg0LFR2NG3TRBhLrec5zByObkp36kgNNyeCqf-xy1m9IrJ9kQVAWRU_YxSNPk"
                          />
                          <span className="text-[#e1e2eb]/90 font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {isLoggingIn ? 'Authenticating...' : 'Continue with Google'}
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#e1e2eb]/30 group-hover:text-[#ff7a21] transition-colors" />
                      </motion.button>

                      {/* LinkedIn */}
                      <motion.button
                        onClick={handleLinkedInLogin}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-14 bg-white/[0.03] border border-white/[0.08] backdrop-blur-[10px] transition-all duration-300 hover:bg-white/[0.08] hover:border-[#ff7a21]/40 rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            alt="LinkedIn"
                            className="w-5 h-5"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA4K6a3rot-Pa2AA-aTA2WkJlwlqv8m7Hpqnzp6y8Y4x4bbH1OdodpTeE1wcqTw8TIiqwWdRj8aWznuq9eHBK9sHwVwl4UnNPt7LGbFXK25WwvIfl7DISC7vrlpOZsXe_UfqB9T5RFrOJUot3auIYzPtlPhcsEukB4bnkK6HZK-XJvM6IrBxkdktvjWKYGLocNL5i5T6B-kWWgdLUxQ0TpmriCaYiBhZGBfx-BWKKu8P4IBJXf8zIvD8FRo7GOiyclKqFvICc3JWw"
                          />
                          <span className="text-[#e1e2eb]/90 font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Continue with LinkedIn
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#e1e2eb]/30 group-hover:text-[#ff7a21] transition-colors" />
                      </motion.button>

                      {/* Email */}
                      <motion.button
                        onClick={() => {
                          setLoginMethod('otp');
                          setOtpStep('email');
                          setErrorMessage('');
                        }}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-14 bg-white/[0.03] border border-white/[0.08] backdrop-blur-[10px] transition-all duration-300 hover:bg-white/[0.08] hover:border-[#ff7a21]/40 rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <Mail className="w-5 h-5 text-[#ff7a21]" />
                          <span className="text-[#e1e2eb]/90 font-semibold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Email OTP
                          </span>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#e1e2eb]/30 group-hover:text-[#ff7a21] transition-colors" />
                      </motion.button>
                    </motion.div>
                  ) : otpStep === 'email' ? (
                    <motion.form
                      key="email-input"
                      onSubmit={handleSendOtp}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="space-y-6"
                    >
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="email"
                          required
                          placeholder="Enter your email address"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          disabled={isSendingOtp}
                          className="w-full h-14 pl-12 pr-6 bg-white/[0.02] border border-white/10 rounded-xl outline-none text-sm text-white placeholder-white/20 focus:border-[#ff7a21]/50 focus:ring-1 focus:ring-[#ff7a21]/20 transition-all font-sans"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLoginMethod('options')}
                          className="flex-1 h-12 flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingOtp || !emailInput.trim()}
                          className="flex-1 h-12 flex items-center justify-center bg-[#ff7a21] hover:bg-[#ff7a21]/90 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {isSendingOtp ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                          ) : (
                            <span>Send Code</span>
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
                      className="space-y-6"
                    >
                      <div className="text-left bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                        <p className="text-[10px] text-[#e0c0b1] uppercase tracking-wider font-semibold" style={{ fontFamily: 'Geist, sans-serif', letterSpacing: '0.15em' }}>
                          Sending OTP to
                        </p>
                        <p className="text-sm text-white font-bold truncate mt-1">{emailInput}</p>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input
                          type="text"
                          required
                          maxLength={8}
                          placeholder="Enter 8-digit OTP"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                          disabled={isVerifyingOtp}
                          className="w-full h-14 pl-12 pr-6 bg-white/[0.02] border border-white/10 rounded-xl outline-none text-sm text-white tracking-[0.2em] text-center placeholder-white/20 focus:border-[#ff7a21]/50 focus:ring-1 focus:ring-[#ff7a21]/20 transition-all font-mono font-bold"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOtpStep('email')}
                          className="flex-1 h-12 flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifyingOtp || otpInput.trim().length !== 8}
                          className="flex-1 h-12 flex items-center justify-center bg-[#ff7a21] hover:bg-[#ff7a21]/90 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-5 h-5 animate-spin text-white" />
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
                          className="text-xs font-semibold uppercase tracking-wider text-[#ff7a21] hover:text-[#ff7a21]/80 disabled:text-white/30 transition-colors cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <p className="mt-8 text-center text-xs text-[#e0c0b1]/40 font-medium" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                  Authorized <span className="text-[#e0c0b1]/80 font-medium">@tgpcouncil.online</span> accounts only.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5"></div>
                <span className="text-[10px] text-[#e0c0b1]/40 tracking-[0.4em] uppercase font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                  Smart Routing
                </span>
                <div className="h-px flex-1 bg-white/5"></div>
              </div>

              {/* Routing Paths */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl cursor-default transition-all duration-300 hover:bg-white/[0.05] hover:border-[#ff7a21]/20 hover:shadow-[0_0_15px_rgba(255,122,33,0.1)] group">
                  <div className="w-8 h-8 rounded-lg bg-[#0272b0]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <User className="w-5 h-5 text-[#94ccff]" />
                  </div>
                  <span className="text-[11px] text-[#94ccff]/60 tracking-wider block mb-1 font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                    STUDENT
                  </span>
                  <p className="text-xs text-[#e1e2eb]/80 font-medium" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    Personal Dashboard
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] p-5 rounded-2xl cursor-default transition-all duration-300 hover:bg-white/[0.05] hover:border-[#ff7a21]/20 hover:shadow-[0_0_15px_rgba(255,122,33,0.1)] group">
                  <div className="w-8 h-8 rounded-lg bg-[#ff7a21]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5 text-[#ff7a21]" />
                  </div>
                  <span className="text-[11px] text-[#ff7a21]/60 tracking-wider block mb-1 font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
                    EXECUTIVE
                  </span>
                  <p className="text-xs text-[#e1e2eb]/80 font-medium" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
                    Admin Command Center
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-40">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 md:px-20 py-6 max-w-7xl mx-auto text-[11px] text-[#e0c0b1]/30 tracking-widest font-bold" style={{ fontFamily: 'Geist, sans-serif' }}>
          <p>© 2024 TGPCOP UNIFIED</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <a className="hover:text-[#ff7a21] transition-colors" href="#">SECURITY</a>
            <a className="hover:text-[#ff7a21] transition-colors" href="#">STATUS</a>
            <a className="hover:text-[#ff7a21] transition-colors" href="#">PRIVACY</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AdminLogin;
