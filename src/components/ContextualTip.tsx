'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContextualTip() {
  const { contextualTip, isMonitoring } = useDecibelStore();

  if (!isMonitoring || !contextualTip) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contextualTip.timestamp}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-primary/10">
          <CardContent className="p-3 flex items-start gap-2.5">
            <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0 animate-pulse" />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary/60 mb-1">Claude Insight</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{contextualTip.tip}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
