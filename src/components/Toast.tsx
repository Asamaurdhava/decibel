'use client';

import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastState {
  message: string | null;
  type: 'info' | 'error' | 'success';
  show: (message: string, type?: 'info' | 'error' | 'success') => void;
  dismiss: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  type: 'info',
  show: (message, type = 'info') => {
    set({ message, type });
    setTimeout(() => set({ message: null }), 4000);
  },
  dismiss: () => set({ message: null }),
}));

export default function Toast() {
  const { message, type, dismiss } = useToast();

  const borderColor = type === 'error'
    ? 'border-red-500/20'
    : type === 'success'
    ? 'border-primary/20'
    : 'border-border';

  const textColor = type === 'error'
    ? 'text-red-400'
    : type === 'success'
    ? 'text-primary'
    : 'text-foreground';

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm"
        >
          <button
            onClick={dismiss}
            className={`w-full rounded-md border ${borderColor} bg-card/95 backdrop-blur-sm px-4 py-3 text-left`}
          >
            <p className={`text-xs font-mono ${textColor}`}>{message}</p>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
