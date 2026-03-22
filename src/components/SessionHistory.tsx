'use client';

import { useEffect } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { getSessions } from '@/lib/db/local';
import { getCloudSessions } from '@/lib/db/supabase';
import { generatePDFReport } from '@/lib/pdf';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ExposureSession, HearingReport } from '@/lib/types';

export default function SessionHistory() {
  const { pastSessions, setPastSessions, loadSessionFromHistory, session, removeSession } = useDecibelStore();

  useEffect(() => {
    Promise.all([
      getSessions().catch(() => []),
      getCloudSessions().catch(() => []),
    ]).then(([local, cloud]) => {
      const map = new Map<string, typeof local[0]>();
      [...local, ...cloud].forEach(s => map.set(s.id, s));
      const merged = Array.from(map.values()).sort((a, b) => b.startTime - a.startTime);
      setPastSessions(merged);
    });
  }, [setPastSessions]);

  if (pastSessions.length === 0) return null;

  const history = pastSessions.filter((s) => s.id !== session?.id);
  if (history.length === 0) return null;

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSession(id);
  };

  const handleQuickPDF = async (e: React.MouseEvent, s: ExposureSession) => {
    e.stopPropagation();

    // Use Claude-generated report if available, otherwise fallback
    const report: HearingReport = s.report || (() => {
      const dur = s.endTime ? Math.round((s.endTime - s.startTime) / 60000) : 0;
      const dose = Math.round(s.noiseDosePercent);
      const riskLevel = dose >= 80 ? 'high' : dose >= 40 ? 'moderate' : 'low';
      return {
        summary: `Session of ${dur} minutes with average ${Math.round(s.avgDb)} dB and peak ${Math.round(s.maxDb)} dB.`,
        risk_level: riskLevel,
        hearing_score: Math.max(0, 100 - dose),
        top_3_recommendations: [
          s.avgDb >= 85 ? 'Reduce exposure duration in loud environments' : 'Current levels are within safe range',
          'Take breaks every 60 minutes in noisy settings',
          'Consider hearing protection above 85 dB',
        ],
        long_term_projection: `Based on this session: ${dose}% of daily safe noise budget used.`,
        comparison: `Average of ${Math.round(s.avgDb)} dB with peak of ${Math.round(s.maxDb)} dB.`,
        action_items: [],
        daily_budget_used: `${dose}%`,
        safe_time_remaining: '--',
      };
    })();

    generatePDFReport(report, s).save(`decibel-report-${new Date(s.startTime).toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="mt-8 overflow-visible">
      <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Past Sessions
      </h2>
      <div className="space-y-2">
        {history.slice(0, 10).map((s) => {
          const dur = s.endTime ? Math.round((s.endTime - s.startTime) / 60000) : 0;
          const date = new Date(s.startTime);
          const riskLevel = s.noiseDosePercent >= 80 ? 'danger' : s.noiseDosePercent >= 40 ? 'caution' : 'safe';

          return (
            <div key={s.id} className="group relative">
              <div
                role="button"
                tabIndex={0}
                onClick={() => loadSessionFromHistory(s)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') loadSessionFromHistory(s); }}
                className="w-full text-left cursor-pointer"
              >
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        <p className="text-xs font-mono font-bold text-foreground">{Math.round(s.avgDb)} dB</p>
                        <p className="text-[9px] font-mono text-muted-foreground/50">{dur}m</p>
                      </div>
                      <div className="w-px h-8 bg-border shrink-0" />
                      <div className="min-w-0">
                        {s.name && (
                          <p className="text-[11px] font-mono text-foreground/80 truncate mb-0.5">{s.name}</p>
                        )}
                        <p className="text-[10px] font-mono text-muted-foreground truncate">
                          {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[9px] font-mono text-muted-foreground/50">
                          Peak {Math.round(s.maxDb)} dB · Dose {Math.round(s.noiseDosePercent)}%
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={riskLevel === 'danger' ? 'danger' : riskLevel === 'caution' ? 'caution' : 'safe'}
                      className="shrink-0 text-[9px] font-mono"
                    >
                      {riskLevel === 'danger' ? 'High' : riskLevel === 'caution' ? 'Med' : 'Low'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Action buttons — right of card on desktop, below card on mobile */}
              {/* Desktop: slide out to the right */}
              <div className="hidden sm:flex absolute left-full top-0 bottom-0 items-center gap-1 pl-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out z-10">
                <button
                  onClick={(e) => handleQuickPDF(e, s)}
                  className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  title="Download PDF"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleRemove(e, s.id)}
                  className="w-8 h-8 rounded-md bg-background border border-red-500/20 flex items-center justify-center text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-colors"
                  title="Remove session"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              {/* Mobile: slide down below card, centered */}
              <div className="sm:hidden flex justify-center gap-2 mt-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-active:opacity-100 group-active:translate-y-0 transition-all duration-200 ease-out">
                <button
                  onClick={(e) => handleQuickPDF(e, s)}
                  className="h-7 px-3 rounded-md bg-background border border-border flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono"
                  title="Download PDF"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  PDF
                </button>
                <button
                  onClick={(e) => handleRemove(e, s.id)}
                  className="h-7 px-3 rounded-md bg-background border border-red-500/20 flex items-center gap-1.5 text-red-400/60 text-[10px] font-mono"
                  title="Remove session"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
