import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowLeft, Bug, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
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

/* ── Floating orb ─────────────────────────────────────────── */
const Orb = ({ style }: { style: React.CSSProperties }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={style}
    animate={{ y: [0, -24, 0], scale: [1, 1.06, 1] }}
    transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ── Animated grid line ───────────────────────────────────── */
const GridLine = ({ x, delay }: { x: string; delay: number }) => (
  <motion.div
    className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
    style={{ left: x }}
    initial={{ scaleY: 0, opacity: 0 }}
    animate={{ scaleY: 1, opacity: 1 }}
    transition={{ duration: 1.2, delay, ease: 'easeOut' }}
  />
);

/* ── Particle dot ─────────────────────────────────────────── */
const Particle = ({ x, y, delay }: { x: string; y: string; delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-orange-400/30"
    style={{ left: x, top: y }}
    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: 'easeInOut' }}
  />
);

/* ── Stagger variants ─────────────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};

export const AdminLogin: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { role, email, userId, provider, isLoading } = useAuth();

  /* parallax on scroll */
  const { scrollYProgress } = useScroll({ container: containerRef });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0,  60]);
  const cardY  = useTransform(scrollYProgress, [0, 1], [0, -20]);

  useEffect(() => {
    if (!isLoading && email) {
      const redirectPath = ROLE_REDIRECT[role ?? ''] ?? '/admin/dashboard';
      logAction('LOGIN', `${email} signed in via ${provider} with role=${role} → ${redirectPath}`);
      navigate(redirectPath, { replace: true });
    }
  }, [role, email, userId, provider, isLoading, navigate]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage('');
    const isNative = Capacitor.isNativePlatform();
    try {
      if (isNative) {
        console.log('[AdminAuth] Starting native Google Sign-in...');
        GoogleAuth.initialize();
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        
        if (!idToken) {
          throw new Error('Google Auth did not return an ID token.');
        }

        console.log('[AdminAuth] Logging in to Supabase with ID token...');
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) throw error;
        return;
      }

      // Web Fallback
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin',
          queryParams: { prompt: 'select_account', access_type: 'offline' },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('[AdminLogin] Google login error:', err);
      let errMsg = 'Failed to initialize Google Sign-in.';
      if (err) {
        if (typeof err === 'string') {
          errMsg = err;
        } else if (err.message) {
          errMsg = err.message;
        } else if (err.error) {
          errMsg = err.error;
        } else {
          errMsg = JSON.stringify(err);
        }
      }
      setErrorMessage(errMsg);
      toast.error(`❌ Google login failed! ${errMsg}`);
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#08090e] flex items-center justify-center overflow-auto"
    >
      {/* ── Background layer ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Grid lines */}
        {['16.6%','33.3%','50%','66.6%','83.3%'].map((x, i) => (
          <GridLine key={x} x={x} delay={i * 0.12} />
        ))}

        {/* Particles */}
        {[
          { x:'12%', y:'20%', d:0 }, { x:'80%', y:'15%', d:0.8 },
          { x:'30%', y:'70%', d:1.2 }, { x:'70%', y:'60%', d:0.4 },
          { x:'55%', y:'30%', d:1.8 }, { x:'20%', y:'50%', d:2.2 },
          { x:'88%', y:'80%', d:0.6 }, { x:'45%', y:'85%', d:1.5 },
        ].map((p, i) => <Particle key={i} x={p.x} y={p.y} delay={p.d} />)}

        {/* Orbs */}
        <motion.div style={{ y: orbY1 }} className="absolute -top-32 -left-32">
          <Orb style={{ width:480, height:480, background:'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)' }} />
        </motion.div>
        <motion.div style={{ y: orbY2 }} className="absolute -bottom-32 -right-32">
          <Orb style={{ width:520, height:520, background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Orb style={{ width:600, height:600, background:'radial-gradient(circle, rgba(234,88,12,0.04) 0%, transparent 70%)' }} />
        </div>
      </div>

      {/* ── Card ── */}
      <motion.div style={{ y: cardY }} className="relative z-10 w-full max-w-sm px-4 py-12">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center"
        >
          {/* Back link */}
          <motion.div variants={item} className="self-start mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-xs transition-colors group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to site
            </Link>
          </motion.div>

          {/* Icon */}
          <motion.div variants={item}>
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
              animate={{ boxShadow: ['0 0 0px rgba(234,88,12,0)', '0 0 32px rgba(234,88,12,0.45)', '0 0 0px rgba(234,88,12,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Lock className="w-7 h-7 text-white" />
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.div variants={item} className="text-center mb-2">
            <h1 className="text-white text-2xl font-bold tracking-tight">Admin Portal</h1>
            <p className="text-white/40 text-sm mt-1">TGPCOP Student Council</p>
          </motion.div>

          {/* Badge */}
          <motion.div variants={item} className="mb-8">
            <motion.div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest"
              style={{ borderColor:'rgba(239,68,68,0.3)', color:'rgba(252,165,165,0.8)', background:'rgba(239,68,68,0.06)' }}
              animate={{ opacity:[0.6,1,0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ShieldCheck className="w-3 h-3" />
              Authorized Executives Only
            </motion.div>
          </motion.div>

          {/* Card box */}
          <motion.div
            variants={item}
            className="w-full rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Subtle top shine */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Error */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity:0, height:0 }}
                  animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2.5 rounded-lg mb-4 leading-relaxed"
                >
                  {errorMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google button */}
            <motion.button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              whileHover={{ scale: isLoggingIn ? 1 : 1.02 }}
              whileTap={{ scale: isLoggingIn ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3 px-5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              style={{ background:'#fff', color:'#111' }}
            >
              {isLoggingIn ? (
                <>
                  <motion.div
                    className="w-4 h-4 rounded-full border-2 border-orange-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                  />
                  <span className="text-orange-500">Redirecting…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-.97 4.14v3.45h1.59c3.27-3 5.43-7.42 5.43-12.44z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.84-2.98c-1.07.72-2.44 1.15-4.12 1.15-3.17 0-5.85-2.14-6.81-5.02H1.23v3.1A11.996 11.996 0 0012 24z"/>
                    <path fill="#FBBC05" d="M5.19 14.24A7.2 7.2 0 014.8 12c0-.79.13-1.57.39-2.31V6.59H1.23A11.96 11.96 0 000 12c0 2.23.6 4.32 1.66 6.13l3.53-2.89z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.34 0 3.37 2.67 1.23 6.59l3.96 3.1c.96-2.88 3.64-5.02 6.81-5.02z"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </motion.button>

            <p className="text-white/25 text-[10px] text-center mt-4 leading-relaxed">
              Use your authorized <span className="text-white/40">@tgpcopcouncil.online</span> or pre‑approved Google account.
            </p>
          </motion.div>

          {/* Footer */}
          <motion.p variants={item} className="text-white/20 text-[10px] text-center mt-6 tracking-wide">
            🔐 All activity is monitored and logged.
          </motion.p>

          {/* Debug toggle */}
          <motion.div variants={item} className="mt-4 w-full">
            <button
              onClick={() => setShowDebug(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-white/10 hover:text-white/25 text-[10px] transition-colors"
            >
              <Bug className="w-3 h-3" />
              {showDebug ? 'Hide' : 'Show'} Debug
            </button>

            <AnimatePresence>
              {showDebug && (
                <motion.div
                  initial={{ opacity:0, height:0 }}
                  animate={{ opacity:1, height:'auto' }}
                  exit={{ opacity:0, height:0 }}
                  className="mt-3 bg-black/50 border border-white/8 rounded-xl p-4 font-mono text-[10px] space-y-1.5 overflow-hidden"
                >
                  <p className="text-white/30 uppercase tracking-wider font-bold mb-2">🔍 Session State</p>
                  {[
                    ['Loading', String(isLoading), isLoading ? 'text-amber-400' : 'text-emerald-400'],
                    ['Email', email || '—', 'text-white/60'],
                    ['User ID', userId ? `${userId.slice(0,16)}…` : '—', 'text-white/50'],
                    ['Provider', provider || '—', 'text-white/60'],
                    ['Role', role || 'null', role ? 'text-orange-400 font-bold' : 'text-red-400'],
                    ['Redirect', role ? (ROLE_REDIRECT[role] ?? '/admin/dashboard') : '—', 'text-white/50'],
                  ].map(([label, val, cls]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/30">{label}:</span>
                      <span className={cls as string}>{val}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
