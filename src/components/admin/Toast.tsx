import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    // Success toasts automatically disappear after 3 seconds
    if (type !== 'error') {
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    }
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast('success', msg), [addToast]);
  const error = useCallback((msg: string) => addToast('error', msg), [addToast]);
  const warning = useCallback((msg: string) => addToast('warning', msg), [addToast]);
  const info = useCallback((msg: string) => addToast('info', msg), [addToast]);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-white shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-white shrink-0" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-white shrink-0" />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-[#22C55E] text-white shadow-xl shadow-[#22C55E]/20 border-none';
      case 'warning':
        return 'bg-[#F59E0B] text-white shadow-xl shadow-[#F59E0B]/20 border-none';
      case 'error':
        return 'bg-[#EF4444] text-white shadow-xl shadow-[#EF4444]/20 border-none';
      case 'info':
      default:
        return 'bg-[#3B82F6] text-white shadow-xl shadow-[#3B82F6]/20 border-none';
    }
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}

      {/* 3. Global Toast Container Overlay positioned at bottom-right corner */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`p-4 rounded-xl border border-navy-dark/10 flex items-start justify-between space-x-3 pointer-events-auto leading-relaxed select-none ${getToastStyles(t.type)}`}
            >
              <div className="flex items-start space-x-3">
                {getToastIcon(t.type)}
                <span className="text-xs font-semibold font-sans">{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-white/70 hover:text-white p-0.5 rounded transition-colors shrink-0 outline-none"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
export default useToast;
