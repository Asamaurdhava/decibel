'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { startCapture, stopCapture } from '@/lib/audio/capture';
import { getCurrentdB, getWaveformData, getFrequencyData } from '@/lib/audio/analyzer';
import { calculateNoiseDose, remainingSafeTime, formatSafeTime } from '@/lib/audio/dose';
import { getZone, DangerZone, SessionSummary } from '@/lib/types';
import type { AudioNodes } from '@/lib/audio/capture';
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

const READING_INTERVAL = 1000;
const COMPARISON_INTERVAL = 15000; // Fetch noise comparison every 15s
const TIP_COOLDOWN = 20000; // Min 20s between contextual tips

export default function MonitorPage() {
  const store = useDecibelStore();
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const animationRef = useRef<number>(0);
  const lastReadingRef = useRef<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Claude feature refs — track timing without re-renders
  const lastZoneRef = useRef<DangerZone>('safe');
  const lastTipTimeRef = useRef<number>(0);
  const lastComparisonTimeRef = useRef<number>(0);
  const tipInFlightRef = useRef(false);
  const comparisonInFlightRef = useRef(false);

  // --- Feature 1: Contextual Tip on zone change ---
  const fetchContextualTip = useCallback(async (zone: DangerZone, db: number) => {
    if (tipInFlightRef.current) return;
    const now = Date.now();
    if (now - lastTipTimeRef.current < TIP_COOLDOWN) return;

    tipInFlightRef.current = true;
    lastTipTimeRef.current = now;

    try {
      const state = useDecibelStore.getState();
      const res = await fetch('/api/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone,
          currentDb: db,
          durationInZoneSeconds: zone === 'danger' ? state.dangerZoneDuration : 0,
          noiseDosePercent: state.noiseDosePercent,
        }),
      });
      if (res.ok) {
        const { tip } = await res.json();
        useDecibelStore.getState().setContextualTip({ tip, zone, timestamp: Date.now() });
      }
    } catch { /* silent fail — non-critical feature */ }
    finally { tipInFlightRef.current = false; }
  }, []);

  // --- Feature 2: Noise Comparison every 15s ---
  const fetchNoiseComparison = useCallback(async (db: number) => {
    if (comparisonInFlightRef.current) return;
    const now = Date.now();
    if (now - lastComparisonTimeRef.current < COMPARISON_INTERVAL) return;

    comparisonInFlightRef.current = true;
    lastComparisonTimeRef.current = now;

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentDb: db }),
      });
      if (res.ok) {
        const { comparison } = await res.json();
        useDecibelStore.getState().setNoiseComparison({ comparison, db, timestamp: Date.now() });
      }
    } catch { /* silent fail */ }
    finally { comparisonInFlightRef.current = false; }
  }, []);

  // --- Feature 3: Session Summary on stop ---
  const fetchSessionSummary = useCallback(async () => {
    const state = useDecibelStore.getState();
    if (!state.session) return;

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
  }, []);

  const updateLoop = useCallback(() => {
    const nodes = audioNodesRef.current;
    if (!nodes) return;

    const db = getCurrentdB(nodes.analyserNode);
    const waveform = getWaveformData(nodes.analyserNode);
    const frequency = getFrequencyData(nodes.analyserNode);
    store.updateAudioData({ currentDb: db, waveformData: waveform, frequencyData: frequency });

    const now = Date.now();
    if (now - lastReadingRef.current >= READING_INTERVAL) {
      const zone = getZone(db);
      store.addReading({ timestamp: now, db, zone });
      const readings = useDecibelStore.getState().readings;
      const doseReadings = readings.map((r, i, arr) => ({
        db: r.db, durationSeconds: i > 0 ? (r.timestamp - arr[i - 1].timestamp) / 1000 : 1,
      }));
      store.updateNoiseDose(calculateNoiseDose(doseReadings));
      lastReadingRef.current = now;

      // Feature 1: Trigger tip on zone change
      if (zone !== lastZoneRef.current) {
        lastZoneRef.current = zone;
        fetchContextualTip(zone, db);
      }

      // Feature 2: Trigger comparison periodically
      fetchNoiseComparison(db);
    }

    animationRef.current = requestAnimationFrame(updateLoop);
  }, [store, fetchContextualTip, fetchNoiseComparison]);

  const handleStart = async () => {
    setMicError(null);
    lastZoneRef.current = 'safe';
    lastTipTimeRef.current = 0;
    lastComparisonTimeRef.current = 0;
    try {
      const nodes = await startCapture(2048);
      audioNodesRef.current = nodes;
      store.startMonitoring();
      lastReadingRef.current = Date.now();
      animationRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      setMicError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  };

  const handleStop = () => {
    cancelAnimationFrame(animationRef.current);
    stopCapture();
    audioNodesRef.current = null;
    store.stopMonitoring();
    // Feature 3: Auto-generate session summary
    fetchSessionSummary();
  };

  useEffect(() => { return () => { cancelAnimationFrame(animationRef.current); stopCapture(); }; }, []);

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
