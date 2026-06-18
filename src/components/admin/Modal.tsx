import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
          {/* 1. Backdrop Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-[#050A15]/80 backdrop-blur-sm"
          />

          {/* 2. Responsive Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-[#0A1428] shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-3xl border border-white/10 flex flex-col overflow-hidden z-10"
          >
            {/* Top Glowing Edge */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-burnt to-[#FF8C42]" />

            {/* Header Strip */}
            <div className="px-8 py-6 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                {icon && <div className="text-orange-burnt shrink-0">{icon}</div>}
                <h3 className="font-display font-extrabold text-xl tracking-wide text-white">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors outline-none"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Body Pane */}
            <div className="flex-grow overflow-y-auto px-8 pb-8 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
