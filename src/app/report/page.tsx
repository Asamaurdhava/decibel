'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { AnalysisInput, HearingReport } from '@/lib/types';
import { getFrequencyProfile } from '@/lib/audio/analyzer';
import { getAnalyserNode } from '@/lib/audio/capture';
import { generatePDFReport } from '@/lib/pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import RiskReport from '@/components/RiskReport';
import SessionHistory from '@/components/SessionHistory';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NoiseMapPin, getZoneColor } from '@/lib/types';
import { getSessionPins } from '@/lib/db/supabase';

export default function ReportPage() {
  const store = useDecibelStore();
  const { session, report, isGeneratingReport, setReport, setIsGeneratingReport, clearCurrentReport } = store;
  const [sessionPins, setSessionPins] = useState<NoiseMapPin[]>([]);

  // Always land on the main report page, not inside a previous report
  useEffect(() => {
    clearCurrentReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load linked pins for current session
  useEffect(() => {
    if (session?.id) {
      const storePins = useDecibelStore.getState().mapPins.filter(p => p.sessionId === session.id);
      setSessionPins(storePins);
      getSessionPins(session.id).then(cloudPins => {
        if (cloudPins.length > storePins.length) setSessionPins(cloudPins);
      }).catch(() => {});
    } else {
      setSessionPins([]);
    }
  }, [session?.id]);

  const handleGenerateReport = async () => {
    if (!session) return;
    setIsGeneratingReport(true);
    try {
      const dur = session.endTime ? (session.endTime - session.startTime) / 60000 : 0;
      const analyser = getAnalyserNode();
      const fp = analyser ? getFrequencyProfile(analyser) : 'unknown';
      const input: AnalysisInput = {
        session_duration_minutes: Math.round(dur * 10) / 10,
        avg_db: Math.round(session.avgDb * 10) / 10,
        max_db: Math.round(session.maxDb * 10) / 10,
        min_db: Math.round((session.minDb || 0) * 10) / 10,
        time_above_85db_minutes: Math.round((session.timeAbove85 / 60) * 10) / 10,
        time_above_100db_minutes: Math.round((session.timeAbove100 / 60) * 10) / 10,
        noise_dose_percent: Math.round(session.noiseDosePercent * 10) / 10,
        frequency_profile: fp, location_type: 'indoor_event', reading_count: session.readings.length,
      };
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      if (!res.ok) throw new Error(`${res.statusText}`);
      setReport(await res.json() as HearingReport);
    } catch {
      setReport({
        summary: 'Unable to generate AI analysis. Check API key and try again.',
        risk_level: 'moderate', hearing_score: 0,
        top_3_recommendations: ['Set ANTHROPIC_API_KEY in .env.local', 'Check network', 'Retry'],
        long_term_projection: 'Unavailable.', comparison: 'Unavailable.', action_items: [],
        daily_budget_used: `${Math.round(session.noiseDosePercent)}%`, safe_time_remaining: '--',
      });
    } finally { setIsGeneratingReport(false); }
  };

  const handleDownloadPDF = () => {
    if (!report || !session) return;
    generatePDFReport(report, session).save(`decibel-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleBack = () => {
    clearCurrentReport();
  };

  // No active session — show empty state + history
  if (!session) {
    return (
      <div className="container py-4 sm:py-6 max-w-3xl">
        <div className="flex flex-col items-center justify-center min-h-[40dvh] px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm">
            <p className="text-muted-foreground/30 text-6xl font-mono mb-6">&mdash;</p>
            <h2 className="text-lg font-mono font-bold text-foreground uppercase tracking-wider mb-2">No Active Session</h2>
            <p className="text-muted-foreground text-sm mb-8">Run a monitoring session or select one from history below.</p>
            <Link href="/monitor">
              <Button className="gold-shimmer-bg text-black font-mono text-xs font-bold border-0">Start Monitoring</Button>
            </Link>
          </motion.div>
        </div>
        <SessionHistory />
      </div>
    );
  }

  const dur = session.endTime ? Math.round((session.endTime - session.startTime) / 60000) : 0;

  return (
    <div className="container py-4 sm:py-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="shrink-0 w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            aria-label="Back to reports"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-mono font-bold tracking-wider text-foreground uppercase">
              {session.name || 'Report'}
            </h1>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">AI hearing risk analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {report && (
            <>
              <Button variant="ghost" size="sm" onClick={handleDownloadPDF} className="font-mono text-xs text-muted-foreground">
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { if (session) { store.removeSession(session.id); clearCurrentReport(); } }}
                className="font-mono text-xs text-red-400/60 hover:text-red-400"
              >
                Delete
              </Button>
            </>
          )}
          {!report && !isGeneratingReport && (
            <Button size="sm" onClick={handleGenerateReport} className="gold-shimmer-bg text-black font-mono text-xs font-bold border-0">Generate</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Duration" value={`${dur}m`} />
        <MiniStat label="Avg" value={`${Math.round(session.avgDb)}`} unit="dB" />
        <MiniStat label="Peak" value={`${Math.round(session.maxDb)}`} unit="dB" />
        <MiniStat label="Dose" value={`${Math.round(session.noiseDosePercent)}%`} />
      </div>

      <RiskReport />

      {/* Linked noise pins — after report */}
      {sessionPins.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-3 sm:p-4">
            <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.15em] mb-3">
              Noise measurements · {sessionPins.length} pin{sessionPins.length !== 1 ? 's' : ''}
            </p>
            <div className="space-y-1.5">
              {sessionPins.map((pin) => (
                <div key={pin.id} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getZoneColor(pin.zone) }} />
                    <span className="text-foreground">{Math.round(pin.avgDb)} dB</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground/50 uppercase text-[9px]">{pin.zone}</span>
                  </div>
                  <span className="text-muted-foreground/40 text-[9px]">
                    {new Date(pin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <p className="text-center text-muted-foreground/30 text-[9px] mt-8 pb-4 font-mono tracking-wider">
          AI-GENERATED FOR AWARENESS — NOT MEDICAL ADVICE
        </p>
      )}

      <SessionHistory />
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className="text-sm font-mono font-bold text-foreground">
          {value}{unit && <span className="text-muted-foreground text-[9px] ml-0.5">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}
