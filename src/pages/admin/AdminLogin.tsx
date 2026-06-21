import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, Loader2, Zap, FileCheck, ArrowLeft
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Add custom Google Fonts for the new design system
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Hanken+Grotesk:wght@400;500;600&family=Geist:wght@700&display=swap';
    document.head.appendChild(fontLink);
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  // HTML5 Particle Network Background Logic (55 particles, mix of C84B0E and 3d5a9e, orange connecting lines < 90px)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      W = (canvas.width = window.innerWidth);
      H = (canvas.height = window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.7 ? '#C84B0E' : '#3d5a9e',
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Move and draw dots
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connecting lines < 90px distance at low opacity orange
      ctx.strokeStyle = '#C84B0E';
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            // Lower opacity for longer lines
            const lineAlpha = (1 - dist / 90) * 0.12;
            ctx.globalAlpha = lineAlpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // 3D Card Tilt Logic (Max Y ±12deg, Max X ±8deg, Lerp factor 0.1)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    let targetRX = 0;
    let targetRY = 0;
    let currentRX = 0;
    let currentRY = 0;
    let animationId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cardWidth = rect.width;
      const cardHeight = rect.height;
      const cardCenterX = rect.left + cardWidth / 2;
      const cardCenterY = rect.top + cardHeight / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Normalised coordinates (-0.5 to 0.5) from card center
      const dx = (mouseX - cardCenterX) / cardWidth;
      const dy = (mouseY - cardCenterY) / cardHeight;

      targetRY = dx * 12;
      targetRX = -dy * 8;
    };

    const handleMouseLeave = () => {
      targetRX = 0;
      targetRY = 0;
    };

    const updateTilt = () => {
      currentRX += (targetRX - currentRX) * 0.1;
      currentRY += (targetRY - currentRY) * 0.1;

      card.style.transform = `perspective(900px) rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;

      animationId = requestAnimationFrame(updateTilt);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    updateTilt();

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
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
      className="relative min-h-screen w-full bg-[#050d1a] text-white overflow-x-hidden flex flex-col justify-between selection:bg-[#C84B0E]/30 selection:text-white"
      data-testid="admin-login-page"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-btn {
          0% {
            box-shadow: 0 0 0 0 rgba(200, 75, 14, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(200, 75, 14, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(200, 75, 14, 0);
          }
        }
        .pulse-btn {
          animation: pulse-btn 2.5s infinite;
        }
        .card-glow-border::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #C84B0E, transparent);
          z-index: 10;
        }
      ` }} />

      {/* HTML5 Particle Network Background */}
      <canvas
        ref={canvasRef}
        id="bg"
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(200, 75, 14, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(200, 75, 14, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#C84B0E]/10 rounded-full blur-[100px] pointer-events-none z-[2]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#1a2f66]/30 rounded-full blur-[120px] pointer-events-none z-[2]" />
      <div className="absolute bottom-[-20%] left-[30%] w-[400px] h-[400px] bg-[#C84B0E]/5 rounded-full blur-[80px] pointer-events-none z-[2]" />

      {/* Header navigation */}
      <nav className="relative z-30 flex justify-between items-center w-full px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#C84B0E] flex items-center justify-center shadow-[0_0_15px_rgba(200,75,14,0.4)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-wider font-sans group-hover:text-white/90 transition-colors">
            TGPCOP
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <a
            href="https://www.linkedin.com/company/tgpcop-council"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            LINKEDIN
          </a>
          <a
            href="mailto:support@tgpcopcouncil.online"
            className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white transition-colors"
          >
            SUPPORT
          </a>
        </div>
      </nav>

      {/* Main Section */}
      <main className="relative z-20 flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-center lg:py-0 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 w-full items-center">
          
          {/* Left Column (Hero Content) */}
          <div className="flex flex-col text-left">

            
            {/* Display Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-extrabold text-white leading-tight font-sans tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Welcome to the <br />
              <span className="text-[#C84B0E]" style={{ textShadow: '0 0 40px rgba(200, 75, 14, 0.25)' }}>Council Portal.</span>
            </h1>
            
            {/* Subtitle */}
            <p className="mt-6 text-base md:text-lg text-white/60 leading-relaxed font-sans max-w-lg" style={{ fontFamily: 'Hanken Grotesk, sans-serif' }}>
              One login for everyone — students access dashboards, executives manage operations. Your role determines what you see next.
            </p>

            {/* Feature bullets */}
            <div className="mt-10 space-y-5">
              <div className="flex items-center gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C84B0E]/10 border border-[#C84B0E]/20 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#C84B0E]/40">
                  <Lock className="w-5 h-5 text-[#C84B0E]" />
                </div>
                <p className="text-sm md:text-base text-white/80 font-medium font-sans">
                  Encrypted sign-in with Google or Email OTP
                </p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C84B0E]/10 border border-[#C84B0E]/20 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#C84B0E]/40">
                  <FileCheck className="w-5 h-5 text-[#C84B0E]" />
                </div>
                <p className="text-sm md:text-base text-white/80 font-medium font-sans">
                  Verified TGPCOP accounts auto-recognised
                </p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C84B0E]/10 border border-[#C84B0E]/20 flex items-center justify-center transition-all group-hover:scale-105 group-hover:border-[#C84B0E]/40">
                  <Zap className="w-5 h-5 text-[#C84B0E]" />
                </div>
                <p className="text-sm md:text-base text-white/80 font-medium font-sans">
                  One click → your personal dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Login Card Container) */}
          <div className="relative flex items-center justify-center z-10 w-full max-w-md mx-auto lg:mx-0">


            {/* 3D Glassmorphic Card */}
            <div
              ref={cardRef}
              className="w-full bg-[rgba(13,27,62,0.85)] border border-[rgba(200,75,14,0.25)] card-glow-border rounded-2xl p-8 md:p-10 relative overflow-hidden backdrop-blur-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col transition-transform duration-100 ease-out"
            >
              {/* Radial glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#C84B0E]/15 blur-[40px] rounded-full pointer-events-none" />

              {/* Header */}
              <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-[#C84B0E]/10 border border-[#C84B0E]/20 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-[#C84B0E]" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  Sign in to continue
                </h2>
                <p className="text-[10px] tracking-[0.2em] font-bold text-white/40 mt-2 uppercase" style={{ fontFamily: 'Geist, sans-serif' }}>
                  STUDENTS · COUNCIL · ADMINS
                </p>
              </div>

              {/* Content Forms with AnimatePresence */}
              <div className="relative z-10 flex-grow">
                {/* Error Message */}
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/10 border border-red-500/25 text-red-300 text-xs px-4 py-3 rounded-xl mb-6 leading-relaxed font-sans"
                    >
                      {errorMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {loginMethod === 'options' ? (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {/* Google Button */}
                      <motion.button
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-12 bg-white hover:bg-white/95 text-gray-900 transition-all font-semibold rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.19-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {isLoggingIn ? 'Authenticating...' : 'Continue with Google'}
                          </span>
                        </div>
                        <span className="font-bold text-base text-gray-900 transition-transform group-hover:translate-x-1">↗</span>
                      </motion.button>

                      {/* Email OTP Button */}
                      <motion.button
                        onClick={() => {
                          setLoginMethod('otp');
                          setOtpStep('email');
                          setErrorMessage('');
                        }}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-12 bg-gradient-to-r from-[#C84B0E] to-[#E8671A] text-white transition-all font-semibold rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50 pulse-btn"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-white" />
                          <span className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Continue with Email OTP
                          </span>
                        </div>
                        <span className="font-bold text-base transition-transform group-hover:translate-x-1">↗</span>
                      </motion.button>

                      {/* LinkedIn Button */}
                      <motion.button
                        onClick={handleLinkedInLogin}
                        disabled={isLoggingIn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full h-12 bg-transparent border border-white/20 hover:border-white/40 text-white transition-all font-semibold rounded-xl flex items-center justify-between px-6 group cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                          <span className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Continue with LinkedIn
                          </span>
                        </div>
                        <span className="font-bold text-base transition-transform group-hover:translate-x-1">↗</span>
                      </motion.button>
                    </motion.div>
                  ) : otpStep === 'email' ? (
                    <motion.form
                      key="email-input"
                      onSubmit={handleSendOtp}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
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
                          className="w-full h-12 pl-12 pr-6 bg-white/[0.02] border border-white/10 rounded-xl outline-none text-sm text-white placeholder-white/20 focus:border-[#C84B0E]/50 focus:ring-1 focus:ring-[#C84B0E]/20 transition-all font-sans"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLoginMethod('options')}
                          className="flex-1 h-11 flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSendingOtp || !emailInput.trim()}
                          className="flex-1 h-11 flex items-center justify-center bg-[#C84B0E] hover:bg-[#C84B0E]/90 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="text-left bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold" style={{ fontFamily: 'Geist, sans-serif', letterSpacing: '0.15em' }}>
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
                          className="w-full h-12 pl-12 pr-6 bg-white/[0.02] border border-white/10 rounded-xl outline-none text-sm text-white tracking-[0.2em] text-center placeholder-white/20 focus:border-[#C84B0E]/50 focus:ring-1 focus:ring-[#C84B0E]/20 transition-all font-mono font-bold"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setOtpStep('email')}
                          className="flex-1 h-11 flex items-center justify-center bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isVerifyingOtp || otpInput.trim().length !== 8}
                          className="flex-1 h-11 flex items-center justify-center bg-[#C84B0E] hover:bg-[#C84B0E]/90 text-white font-semibold text-sm rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 font-bold"
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
                          className="text-xs font-semibold uppercase tracking-wider text-[#C84B0E] hover:text-[#E8671A] disabled:text-white/30 transition-colors cursor-pointer"
                          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                        >
                          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend Code'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Domain Hint */}
              <p className="mt-8 text-center text-xs text-white/40 font-medium font-sans relative z-10">
                Use your <span className="text-[#C84B0E] font-semibold">@tgpcopcouncil.online</span> or pre-approved account
              </p>
            </div>
          </div>

        </div>
      </main>


    </div>
  );
};

export default AdminLogin;
