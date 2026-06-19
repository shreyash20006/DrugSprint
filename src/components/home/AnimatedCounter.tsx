import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

interface CounterProps {
  target: number;
  suffix?: string;
  duration?: number;
}

export const AnimatedCounter: React.FC<CounterProps> = ({ target, suffix = '', duration = 1.4 }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView || target <= 0) return;
    const start = performance.now();
    const totalMs = duration * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / totalMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.floor(eased * target);
      setCount(value);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCount(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;
