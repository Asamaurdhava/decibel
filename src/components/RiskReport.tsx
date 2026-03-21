'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function RiskReport() {
  const { report, isGeneratingReport } = useDecibelStore();

  if (isGeneratingReport) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-foreground text-xs font-mono">Analyzing...</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Score + Risk */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="gold-glow">
          <CardContent className="p-5 text-center">
            <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.2em] mb-3">Score</p>
            <p className="text-5xl sm:text-6xl font-mono font-bold text-foreground">{report.hearing_score}</p>
            <p className="text-muted-foreground text-[10px] font-mono mt-1">/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center flex flex-col justify-center">
            <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.2em] mb-3">Risk</p>
            <p className="text-2xl font-mono font-bold uppercase tracking-wider text-foreground">{report.risk_level}</p>
            <div className="flex justify-center gap-3 mt-3 text-muted-foreground text-[10px] font-mono">
              <span>{report.daily_budget_used}</span>
              <span className="text-border">|</span>
              <span>{report.safe_time_remaining}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Summary</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-foreground/80">{report.summary}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Equivalent To</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-foreground/80">{report.comparison}</p></CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Recommendations</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.top_3_recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold bg-primary/10 text-primary mt-0.5">{i + 1}</span>
                <p className="text-sm leading-relaxed text-foreground/80">{rec}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Projection</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-foreground/80">{report.long_term_projection}</p></CardContent>
      </Card>

      {report.action_items.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase tracking-wider text-red-400">Actions</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {report.action_items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 text-[10px]">&#8226;</span>
                  <p className="text-sm text-foreground/80">{item}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
