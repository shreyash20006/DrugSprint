import React from 'react';
import { motion, useScroll } from 'framer-motion';

export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      id="scroll-progress"
      className="fixed top-0 left-0 right-0 h-[3px] bg-orange-burnt z-[9999] origin-left"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

export default ScrollProgressBar;
