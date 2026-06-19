import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLogo } from './AnimatedLogo';

const SESSION_KEY = 'tgpcop-splash-seen';

interface SplashIntroProps {
  /** Force show even if seen this session (for dev/preview) */
  force?: boolean;
  /** Total duration in ms (default 2800) */
  duration?: number;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({
  force = false,
  duration = 2800,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (!seen || force) {
      setShow(true);
      // Lock scroll while splash visible
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => {
        setShow(false);
        sessionStorage.setItem(SESSION_KEY, '1');
        document.body.style.overflow = '';
      }, duration);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
  }, [force, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050B18]"
          data-testid="splash-intro"
        >
          {/* Layered ambient background */}
          <div className="absolute inset-0 ambient-orb-orange rounded-full opacity-50" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-50" />
          <div className="noise-overlay noise-soft" />

          {/* Volumetric god-rays */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.65, 0.35] }}
            transition={{ duration: 2.4, times: [0, 0.5, 1], ease: 'easeOut' }}
            style={{
              background:
                'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(214,90,30,0.35) 0%, rgba(214,90,30,0.08) 30%, transparent 65%)',
            }}
          />

          {/* Spawning particles */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const dist = 280 + (i % 3) * 60;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            return (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#D65A1E' : '#FFB338',
                  boxShadow: `0 0 12px ${i % 2 === 0 ? '#D65A1E' : '#FFB338'}`,
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x, y, opacity: 0, scale: 0 }}
                animate={{ x: 0, y: 0, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                transition={{
                  duration: 1.8,
                  delay: 0.15 + (i % 8) * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            );
          })}

          {/* Center column */}
          <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 px-6">
            {/* Animated logo with pulse rings */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <AnimatedLogo size="xl" variant="pulse" />
            </motion.div>

            {/* Brand text reveal */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.4 }}
              className="text-center space-y-2"
            >
              <h1
                className="font-display font-extrabold text-white tracking-tight leading-none"
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
              >
                TGPCOP
              </h1>
              <p className="text-orange-burnt font-display font-bold text-[10px] sm:text-xs tracking-[0.35em] uppercase">
                Student Council
              </p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 0.4 }}
              className="w-44 h-[2px] bg-white/[0.08] rounded-full overflow-hidden mt-2"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-orange-burnt via-gold-accent to-orange-burnt rounded-full"
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 1.0, ease: 'easeInOut', delay: 1.7 }}
              />
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.0 }}
              className="text-white/45 text-[10px] sm:text-xs font-sans tracking-[0.22em] uppercase font-bold"
            >
              Your Voice · Our Future
            </motion.p>
          </div>

          {/* Bottom marker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-[0.28em] text-white/25 uppercase"
          >
            Felicitation 2025 — 26
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashIntro;
