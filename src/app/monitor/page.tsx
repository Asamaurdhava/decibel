'use client';

import { useState } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { startCapture, stopCapture } from '@/lib/audio/capture';
import { remainingSafeTime, formatSafeTime } from '@/lib/audio/dose';
import type { SessionSummary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import SoundMeter from '@/components/SoundMeter';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import FrequencySpectrum from '@/components/FrequencySpectrum';
import ExposureTimeline from '@/components/ExposureTimeline';
import NoiseDoseGauge from '@/components/NoiseDoseGauge';
import DangerAlert from '@/components/DangerAlert';
import ContextualTip from '@/components/ContextualTip';
import NoiseComparisonDisplay from '@/components/NoiseComparisonDisplay';
import SessionSummaryCard from '@/components/SessionSummaryCard';
import { motion } from 'framer-motion';

export default function MonitorPage() {
  const store = useDecibelStore();
  const [micError, setMicError] = useState<string | null>(null);

  const handleStart = async () => {
    setMicError(null);
    try {
      await startCapture(2048);
      store.startMonitoring();
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  };

  const handleStop = async () => {
    stopCapture();
    store.stopMonitoring();

    // Auto-generate session summary
    const state = useDecibelStore.getState();
    if (state.session) {
      state.setIsGeneratingSummary(true);
      try {
        const session = state.session;
        const durationMinutes = session.endTime
          ? (session.endTime - session.startTime) / 60000
          : 0;
        const res = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            durationMinutes,
            avgDb: session.avgDb,
            maxDb: session.maxDb,
            timeAbove85Seconds: session.timeAbove85,
            noiseDosePercent: session.noiseDosePercent,
          }),
        });
        if (res.ok) {
          const summary: SessionSummary = await res.json();
          useDecibelStore.getState().setSessionSummary(summary);
        }
      } catch { /* silent fail */ }
      finally { useDecibelStore.getState().setIsGeneratingSummary(false); }
    }
  };

  const sessionDuration = store.sessionStartTime ? Math.floor((Date.now() - store.sessionStartTime) / 1000) : 0;
  const safeTimeLeft = remainingSafeTime(store.currentDb, store.noiseDosePercent);

  return (
    <div className="min-h-[100dvh] md:min-h-0">
      <DangerAlert />

      <div className="container py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-lg sm:text-xl font-mono font-bold tracking-wider text-foreground uppercase">Monitor</h1>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">Real-time noise measurement</p>
          </div>
          <div className="flex items-center gap-2">
            {store.isMonitoring ? (
              <Button variant="outline" size="sm" onClick={handleStop} className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 font-mono text-xs">
                Stop
              </Button>
            ) : (
              <Button size="sm" onClick={handleStart} className="gold-shimmer-bg text-black font-mono text-xs font-bold border-0">
                Start
              </Button>
            )}
          </div>
        </div>

        {/* Mic error */}
        {micError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-4 p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-mono">
            {micError}
          </motion.div>
        )}

        {/* Session Summary — shown after stopping */}
        <div className="mb-4">
          <SessionSummaryCard />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5">

          {/* dB Meter */}
          <Card className="md:col-span-2 lg:col-span-7 gold-glow">
            <CardContent className="flex flex-col items-center justify-center py-10 sm:py-14 lg:py-16 px-4 gap-4">
              <SoundMeter />
              {/* Noise Comparison — inline below the meter */}
              <NoiseComparisonDisplay />
            </CardContent>
          </Card>

          {/* Right side */}
          <div className="md:col-span-2 lg:col-span-5 flex flex-col gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col items-center">
                <NoiseDoseGauge />
                {store.isMonitoring && (
                  <div className="mt-2 text-center">
                    <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.2em] mb-1">Safe time left</p>
                    <p className="text-xs sm:text-sm font-mono font-bold text-foreground">{formatSafeTime(safeTimeLeft)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contextual Tip — in the right sidebar */}
            <ContextualTip />

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Session" value={store.isMonitoring ? fmtDur(sessionDuration) : '--:--'} />
              <StatCard label="Average" value={store.isMonitoring && store.avgDb > 0 ? `${Math.round(store.avgDb)}` : '--'} unit="dB" />
              <StatCard label="> 85 dB" value={store.isMonitoring ? fmtDur(Math.round(store.timeAbove85)) : '--:--'} warn />
              <StatCard label="Readings" value={store.isMonitoring ? `${store.readings.length}` : '--'} />
            </div>
          </div>

          {/* Visualizers */}
          <div className="md:col-span-1 lg:col-span-6"><WaveformVisualizer /></div>
          <div className="md:col-span-1 lg:col-span-6"><FrequencySpectrum /></div>

          {/* Timeline */}
          <div className="md:col-span-2 lg:col-span-12"><ExposureTimeline /></div>
        </div>

        <p className="text-center text-muted-foreground/30 text-[9px] mt-8 pb-4 font-mono tracking-wider">
          AWARENESS TOOL ONLY — NOT A CALIBRATED INSTRUMENT
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, warn }: { label: string; value: string; unit?: string; warn?: boolean }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-muted-foreground/50 text-[9px] font-mono uppercase tracking-[0.15em] mb-1">{label}</p>
        <p className={`text-sm font-mono font-bold ${warn ? 'text-primary' : 'text-foreground'}`}>
          {value}{unit && <span className="text-muted-foreground text-[9px] ml-0.5">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

function fmtDur(s: number): string {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
