'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function NoiseComparisonDisplay() {
  const { noiseComparison, isMonitoring } = useDecibelStore();

  if (!isMonitoring || !noiseComparison) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={noiseComparison.timestamp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-card border border-border"
      >
        <svg className="w-3.5 h-3.5 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
        <p className="text-[11px] font-mono text-muted-foreground truncate">{noiseComparison.comparison}</p>
      </motion.div>
    </AnimatePresence>
  );
}
