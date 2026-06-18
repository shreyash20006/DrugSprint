import React from 'react';
import { motion } from 'framer-motion';

const LOGO_URL =
  'https://res.cloudinary.com/dsqxboxoc/image/upload/q_auto/f_auto/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg';

type LogoSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type LogoVariant = 'default' | 'minimal' | 'orbit' | 'pulse' | 'static';

interface AnimatedLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  testId?: string;
}

const SIZE_CONFIG: Record<LogoSize, { wrap: string; inner: string; ringWidth: number }> = {
  sm: { wrap: 'w-12 h-12', inner: 'inset-[3px]', ringWidth: 2 },
  md: { wrap: 'w-20 h-20', inner: 'inset-[4px]', ringWidth: 3 },
  lg: { wrap: 'w-32 h-32', inner: 'inset-[5px]', ringWidth: 4 },
  xl: { wrap: 'w-44 h-44', inner: 'inset-[6px]', ringWidth: 5 },
  '2xl': { wrap: 'w-56 h-56', inner: 'inset-[7px]', ringWidth: 6 },
};

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'lg',
  variant = 'default',
  className = '',
  testId = 'animated-logo',
}) => {
  const cfg = SIZE_CONFIG[size];

  // MINIMAL — just the logo with subtle hover pulse (for navbar etc.)
  if (variant === 'minimal') {
    return (
      <motion.div
        whileHover={{ scale: 1.08, rotate: 4 }}
        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
        className={`relative ${cfg.wrap} rounded-full overflow-hidden shadow-md ${className}`}
        data-testid={testId}
      >
        <img src={LOGO_URL} alt="TGPCOP Logo" className="w-full h-full object-cover" />
      </motion.div>
    );
  }

  // STATIC — fully static, no animation at all (admin can disable everything)
  if (variant === 'static') {
    return (
      <div
        className={`relative ${cfg.wrap} rounded-full overflow-hidden shadow-2xl ring-2 ring-orange-burnt/40 ${className}`}
        data-testid={testId}
      >
        <img src={LOGO_URL} alt="TGPCOP Logo" className="w-full h-full object-cover" />
      </div>
    );
  }

  // ORBIT — particles orbiting around the logo
  if (variant === 'orbit') {
    return (
      <div className={`relative ${cfg.wrap} ${className}`} data-testid={testId}>
        {/* Orbiting particles */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * 360;
          return (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2"
              style={{ transformOrigin: '0 0' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 14 + i * 1.5, ease: 'linear', repeat: Infinity }}
            >
              <div
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? '#D65A1E' : '#FFB338',
                  boxShadow: `0 0 8px ${i % 2 === 0 ? '#D65A1E' : '#FFB338'}`,
                  transform: `rotate(${angle}deg) translate(${size === '2xl' ? 130 : size === 'xl' ? 100 : 78}px) translate(-50%, -50%)`,
                }}
              />
            </motion.div>
          );
        })}

        {/* Inner logo + ring */}
        <div className={`relative ${cfg.wrap} rounded-full flex items-center justify-center`}>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, #D65A1E 0deg, #FFB338 90deg, #D65A1E 180deg, #142B5C 270deg, #D65A1E 360deg)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          />
          <div className={`absolute ${cfg.inner} rounded-full bg-[#050B18]`} />
          <img
            src={LOGO_URL}
            alt="TGPCOP Logo"
            className="relative w-[88%] h-[88%] rounded-full object-cover shadow-2xl"
          />
        </div>
      </div>
    );
  }

  // PULSE — concentric pulsing rings (for splash / hero)
  if (variant === 'pulse') {
    return (
      <div className={`relative ${cfg.wrap} ${className}`} data-testid={testId}>
        {/* Pulsing concentric rings */}
        {[0, 0.4, 0.8].map((delay, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-orange-burnt/45 pointer-events-none"
            animate={{ scale: [1, 1.85], opacity: [0.55, 0] }}
            transition={{
              duration: 2.4,
              ease: 'easeOut',
              repeat: Infinity,
              delay,
            }}
          />
        ))}

        {/* Inner logo */}
        <div className={`relative ${cfg.wrap} rounded-full flex items-center justify-center`}>
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, #D65A1E, #FFB338, #D65A1E, #142B5C, #D65A1E)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
          />
          <div className={`absolute ${cfg.inner} rounded-full bg-[#050B18]`} />
          <motion.img
            src={LOGO_URL}
            alt="TGPCOP Logo"
            className="relative w-[88%] h-[88%] rounded-full object-cover"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          />
        </div>
      </div>
    );
  }

  // DEFAULT — gradient ring + glow + soft float
  return (
    <motion.div
      className={`relative ${cfg.wrap} ${className}`}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      data-testid={testId}
    >
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full blur-2xl opacity-60 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(214,90,30,0.55) 0%, rgba(255,179,56,0.25) 40%, transparent 70%)' }}
      />

      {/* Rotating gradient ring */}
      <div className="relative w-full h-full rounded-full flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, #D65A1E 0deg, #FFB338 120deg, #D65A1E 240deg, #142B5C 320deg, #D65A1E 360deg)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, ease: 'linear', repeat: Infinity }}
        />

        {/* Inner dark backing */}
        <div className={`absolute ${cfg.inner} rounded-full bg-[#050B18]`} />

        {/* The actual logo */}
        <motion.img
          src={LOGO_URL}
          alt="TGPCOP Student Council Logo"
          className="relative w-[88%] h-[88%] rounded-full object-cover shadow-[0_8px_32px_rgba(214,90,30,0.35)]"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Inner highlight glow (top arc) */}
        <div
          className="absolute inset-[10%] rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(255,255,255,0.25) 0%, transparent 50%)',
          }}
        />
      </div>
    </motion.div>
  );
};

export default AnimatedLogo;
