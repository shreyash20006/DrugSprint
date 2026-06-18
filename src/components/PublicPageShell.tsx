import React from 'react';
import { motion } from 'framer-motion';

interface PublicPageShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const PublicPageShell: React.FC<PublicPageShellProps> = ({
  title,
  subtitle,
  icon,
  children,
}) => (
  <div className="pt-28 pb-24 min-h-screen bg-gray-light">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        {icon && (
          <div className="w-12 h-12 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt mx-auto mb-4">
            {icon}
          </div>
        )}
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-navy-dark">{title}</h1>
        {subtitle && (
          <p className="text-navy-dark/60 text-sm mt-2 font-sans max-w-xl mx-auto">{subtitle}</p>
        )}
        <div className="h-1 w-20 bg-orange-burnt mx-auto mt-4 rounded-full" />
      </motion.div>
      {children}
    </div>
  </div>
);

export default PublicPageShell;
