import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ArrowLeft, Lock, Zap, FileCheck, ArrowUpRight, Mail, Loader2
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

const securityHighlights = [
  { icon: ShieldCheck, label: 'Encrypted sign-in with Google or Email OTP' },
  { icon: FileCheck, label: 'Verified TGPCOP accounts auto-recognised' },
  { icon: Zap, label: 'One click → your personal dashboard' },
];

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

  const { scrollYProgress } = useScroll({ container: containerRef });
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -30]);

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
      className="relative min-h-screen w-full bg-[#050B18] text-white overflow-auto"
      data-testid="admin-login-page"
    >
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          style={{ y: orbY }}
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full"
        >
          <div className="w-full h-full ambient-orb-orange rounded-full" />
        </motion.div>
        <motion.div
          style={{ y: orbY }}
          animate={{
            x: [0, -25, 20, 0],
            y: [0, 20, -30, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full"
        >
          <div className="w-full h-full ambient-orb-gold rounded-full" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50" />
        <div className="noise-overlay noise-soft" />
      </div>

      {/* Top bar */}
      <header className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-sans font-bold uppercase tracking-[0.2em] group transition-colors"
          data-testid="back-to-site-link"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.4} />
          Back to Site
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/55 font-display">
            Secure Channel
          </span>
        </div>
      </header>

      {/* Main */}
      <motion.main
        style={{ y: cardY }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center min-h-[calc(100vh-200px)]">
          {/* LEFT — narrative */}
          <div className="lg:col-span-7 space-y-8 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-orange-burnt/25 backdrop-blur-md"
            >
              <Lock className="w-3 h-3 text-orange-burnt" strokeWidth={2.4} />
              <span className="text-orange-burnt text-[10px] font-bold tracking-[0.22em] uppercase font-display">
                TGPCOP · Unified Portal
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display font-extrabold text-white leading-[1.02] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              Welcome to the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt bg-[length:200%_auto]">
                Council Portal.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="text-white/65 text-base lg:text-lg leading-relaxed font-sans max-w-xl"
            >
              One login for everyone — students access dashboards, executives manage operations. Your role determines what you see next.
            </motion.p>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="space-y-3 pt-2"
            >
              {securityHighlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + idx * 0.08 }}
                    className="flex items-center gap-3 text-white/72"
                  >
                    <div className="w-7 h-7 rounded-lg bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-orange-burnt" strokeWidth={2.4} />
                    </div>
                    <span className="text-sm font-sans font-medium">{item.label}</span>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          {/* RIGHT — login card */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Corner accents */}
              <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-orange-burnt/50 rounded-tl-3xl pointer-events-none" />
              <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-gold-accent/40 rounded-br-3xl pointer-events-none" />

              <div className="relative bg-gradient-to-br from-[#0D1B3E]/95 to-[#0A1428]/95 border border-orange-burnt/25 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="noise-overlay noise-soft" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <motion.div
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(214,90,30,0)',
                        '0 0 30px rgba(214,90,30,0.45)',
                        '0 0 0px rgba(214,90,30,0)',
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center"
                  >
                    <Lock className="w-5 h-5 text-white" strokeWidth={2.4} />
                  </motion.div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-white tracking-tight">
                      Sign in to continue
                    </h2>
                    <p className="text-[10px] text-white/45 font-sans font-medium tracking-[0.18em] uppercase mt-0.5">
                      Students · Council · Admins
                    </p>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      data-testid="login-error-message"
                      className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs px-3.5 py-2.5 rounded-xl mb-4 leading-relaxed font-sans relative z-10"
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
                      className="space-y-3 relative z-10"
                    >
                      {/* Google Button */}
                      <motion.button
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        whileHover={{ scale: isLoggingIn ? 1 : 1.015 }}
                        whileTap={{ scale: isLoggingIn ? 1 : 0.98 }}
                        data-testid="google-signin-btn"
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-white text-gray-900 font-display font-bold text-sm tracking-tight shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoggingIn ? (
                          <>
                            <motion.div
                              className="w-4 h-4 rounded-full border-2 border-orange-burnt border-t-transparent"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                            <span className="text-orange-burnt">Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-.97 4.14v3.45h1.59c3.27-3 5.43-7.42 5.43-12.44z" />
                              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.17 0-5.85-2.14-6.81-5.02H1.23v3.1A11.996 11.996 0 0012 24z" />
                              <path fill="#FBBC05" d="M5.19 14.24A7.2 7.2 0 014.8 12c0-.79.13-1.57.39-2.31V6.59H1.23A11.96 11.96 0 000 12c0 2.23.6 4.32 1.66 6.13l3.53-2.89z" />
                              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.34 0 3.37 2.67 1.23 6.59l3.96 3.1c.96-2.88 3.64-5.02 6.81-5.02z" />
                            </svg>
                            <span>Continue with Google</span>
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.6} />
                          </>
                        )}
                      </motion.button>

                      {/* LinkedIn Button */}
                      <motion.button
                        onClick={handleLinkedInLogin}
                        disabled={isLoggingIn}
                        whileHover={{ scale: isLoggingIn ? 1 : 1.015 }}
                        whileTap={{ scale: isLoggingIn ? 1 : 0.98 }}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-[#0077B5] text-white font-display font-bold text-sm tracking-tight shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoggingIn ? (
                          <>
                            <motion.div
                              className="w-4 h-4 rounded-full border-2 border-white border-t-transparent"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                            <span>Authenticating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 shrink-0 fill-white" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                            <span>Continue with LinkedIn</span>
                            <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-white/70" strokeWidth={2.6} />
                          </>
                        )}
                      </motion.button>

                      {/* Email OTP Button */}
                      <motion.button
                        onClick={() => {
                          setLoginMethod('otp');
                          setOtpStep('email');
                          setErrorMessage('');
                        }}
                        disabled={isLoggingIn}
                        whileHover={{ scale: isLoggingIn ? 1 : 1.015 }}
                        whileTap={{ scale: isLoggingIn ? 1 : 0.98 }}
                        className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl border border-orange-burnt/35 hover:border-orange-burnt bg-white/[0.03] hover:bg-orange-burnt/5 text-white font-display font-bold text-sm tracking-tight transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-orange-burnt shrink-0" strokeWidth={2.4} />
                        <span>Continue with Email OTP</span>
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2.6} />
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
                      className="space-y-4 relative z-10"
                    >
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          placeholder="Enter your email address"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          disabled={isSendingOtp}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#0F1E42]/85 outline-none text-xs text-white placeholder-white/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all font-sans"
                        />
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setLoginMethod('options')}
                          className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingOtp || !emailInput.trim()}
                          className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isSendingOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
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
                      className="space-y-4 relative z-10"
                    >
                      <div className="text-left bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl">
                        <p className="text-[10px] text-white/45 uppercase tracking-wider">Sending OTP to</p>
                        <p className="text-xs text-white font-bold font-sans truncate">{emailInput}</p>
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#0F1E42]/85 outline-none text-xs text-white tracking-[0.2em] text-center placeholder-white/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all font-mono font-bold"
                        />
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setOtpStep('email')}
                          className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifyingOtp || otpInput.trim().length !== 8}
                          className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <span>Verify OTP</span>
                          )}
                        </button>
                      </div>

                      <div className="text-center pt-1.5">
                        <button
                          type="button"
                          disabled={cooldown > 0 || isSendingOtp}
                          onClick={() => handleSendOtp()}
                          className="text-[10px] font-display font-bold uppercase tracking-wider text-orange-burnt hover:text-[#E06D2B] disabled:text-white/30 transition-colors"
                        >
                          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Helper text */}
                <p className="relative z-10 text-white/35 text-[10px] text-center mt-4 leading-relaxed font-sans">
                  Use your <span className="text-orange-burnt font-bold">@tgpcopcouncil.online</span> or pre-approved account
                </p>

                {/* Divider */}
                <div className="relative z-10 my-5 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">Smart Routing</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
                </div>

                {/* Role explanation */}
                <div className="relative z-10 grid grid-cols-2 gap-2 text-center">
                  <div className="px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Student</p>
                    <p className="text-[9px] text-white/50 mt-0.5">→ Dashboard</p>
                  </div>
                  <div className="px-2 py-2 rounded-lg bg-white/[0.03] border border-orange-burnt/20">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-orange-burnt">Executive</p>
                    <p className="text-[9px] text-white/50 mt-0.5">→ Admin Panel</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default AdminLogin;
