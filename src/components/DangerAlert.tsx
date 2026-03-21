'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function DangerAlert() {
  const { zone, dangerZoneDuration, isMonitoring, currentDb } = useDecibelStore();
  const showAlert = isMonitoring && zone === 'danger';

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <AnimatePresence>
      {showAlert && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 md:top-14 left-0 right-0 z-50 flex justify-center px-3 pt-2"
        >
          <div className="w-full max-w-xl rounded-md border border-red-500/20 bg-red-500/5 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 font-mono text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-red-400">
              {Math.round(currentDb)} dB — {formatDuration(dangerZoneDuration)} in danger zone
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
