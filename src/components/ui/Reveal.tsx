import React, { useRef } from 'react';
import { motion, useScroll, useTransform, type Variants, type MotionValue } from 'framer-motion';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale';

interface RevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  as?: 'div' | 'section' | 'article' | 'span' | 'li';
}

const variantFor = (direction: RevealDirection, distance: number, duration: number): Variants => {
  const map: Record<RevealDirection, { hidden: any; visible: any }> = {
    up:    { hidden: { opacity: 0, y: distance }, visible: { opacity: 1, y: 0 } },
    down:  { hidden: { opacity: 0, y: -distance }, visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: distance }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -distance }, visible: { opacity: 1, x: 0 } },
    fade:  { hidden: { opacity: 0 }, visible: { opacity: 1 } },
    scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  };
  const { hidden, visible } = map[direction];
  return {
    hidden,
    visible: { ...visible, transition: { duration, ease: [0.16, 1, 0.3, 1] as any } },
  };
};

export const Reveal: React.FC<RevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.7,
  distance = 32,
  className = '',
  once = true,
  amount = 0.2,
  as = 'div',
}) => {
  const MotionTag = motion[as] as any;
  const variants = variantFor(direction, distance, duration);
  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionTag>
  );
};

interface ParallaxProps {
  children: React.ReactNode;
  speed?: number; // 0.0 - 1.0 (0.3 = subtle, 0.6 = strong)
  className?: string;
  reverse?: boolean;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  speed = 0.3,
  className = '',
  reverse = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const range = 100 * speed;
  const y = useTransform(scrollYProgress, [0, 1], reverse ? [-range, range] : [range, -range]);
  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

interface ScrollOpacityProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollOpacity: React.FC<ScrollOpacityProps> = ({ children, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const opacity: MotionValue<number> = useTransform(scrollYProgress, [0, 1], [0.4, 1]);
  const scale: MotionValue<number> = useTransform(scrollYProgress, [0, 1], [0.97, 1]);
  return (
    <motion.div ref={ref} style={{ opacity, scale }} className={className}>
      {children}
    </motion.div>
  );
};

interface StaggerListProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  staggerDelay = 0.08,
  className = '',
}) => {
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: staggerDelay } },
  };
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const variants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } },
  };
  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
};

export default Reveal;
