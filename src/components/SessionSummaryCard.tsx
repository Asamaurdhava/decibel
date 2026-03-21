'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function SessionSummaryCard() {
  const { sessionSummary, isGeneratingSummary, isMonitoring, session } = useDecibelStore();

  // Only show after monitoring stops and session exists
  if (isMonitoring || !session) return null;

  if (isGeneratingSummary) {
    return (
      <Card className="border-primary/10">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-4 h-4 border border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
          <p className="text-xs font-mono text-muted-foreground">Claude is summarizing your session...</p>
        </CardContent>
      </Card>
    );
  }

  if (!sessionSummary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-primary/20 gold-glow">
          <CardContent className="p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-primary/60 mb-3">Session Summary — Claude</p>

            <p className="text-sm text-foreground/90 leading-relaxed mb-3">{sessionSummary.summary}</p>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mb-0.5">Key Stat</p>
                <p className="text-xs font-mono font-bold text-primary">{sessionSummary.key_stat}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-muted-foreground/50 mb-0.5">Next Step</p>
                <p className="text-xs font-mono text-foreground/70">{sessionSummary.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
