import React from 'react';
import { motion } from 'framer-motion';
import { CouncilCard } from '../components/CouncilCard';
import { councilMembers } from '../data/council';
import { ShieldCheck } from 'lucide-react';

export const Council: React.FC = () => {
  // Container Variants for staggering children cards
  const gridContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  return (
    <div className="pt-28 pb-24 min-h-screen bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring' }}
            className="w-12 h-12 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt"
          >
            <ShieldCheck className="w-6 h-6" />
          </motion.div>
          
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-orange-burnt text-xs font-bold uppercase tracking-widest block"
          >
            Elected Leadership 2026
          </motion.span>

          <div className="relative inline-block">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display font-extrabold text-3xl sm:text-5xl text-navy-dark leading-tight"
            >
              OUR NEWLY SELECTED MEMBERS
            </motion.h1>
            
            {/* Animated Underline */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '80px' }}
              transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
              className="h-1 bg-orange-burnt mx-auto mt-4 rounded-full"
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-navy-dark/70 text-sm sm:text-base font-sans max-w-xl"
          >
            Representing semesters, cultural programs, physical sports, community NSS campaigns, and student welfare across TGPCOP.
          </motion.p>
        </div>

        {/* 13 Members Grid layout */}
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {councilMembers.map((member) => (
            <CouncilCard key={member.name} member={member} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Council;
