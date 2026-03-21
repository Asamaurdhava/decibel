'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { getCurrentdB, getWaveformData, getFrequencyData } from '@/lib/audio/analyzer';
import { calculateNoiseDose } from '@/lib/audio/dose';
import { getAnalyserNode } from '@/lib/audio/capture';
import { getZone, DangerZone } from '@/lib/types';

const READING_INTERVAL = 1000;
const COMPARISON_INTERVAL = 15000;
const TIP_COOLDOWN = 20000;

/**
 * Global audio monitoring loop that persists across page navigation.
 * Lives in the layout — never unmounts.
 */
export default function AudioMonitorProvider() {
  const animationRef = useRef<number>(0);
  const lastReadingRef = useRef<number>(0);
  const lastZoneRef = useRef<DangerZone>('safe');
  const lastTipTimeRef = useRef<number>(0);
  const lastComparisonTimeRef = useRef<number>(0);
  const tipInFlightRef = useRef(false);
  const comparisonInFlightRef = useRef(false);
  const wasMonitoringRef = useRef(false);

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
    } catch { /* silent fail */ }
    finally { tipInFlightRef.current = false; }
  }, []);

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

  const updateLoop = useCallback(() => {
    const analyser = getAnalyserNode();
    const state = useDecibelStore.getState();

    if (!state.isMonitoring || !analyser) {
      // If we were monitoring but now stopped, cancel the loop
      if (wasMonitoringRef.current) {
        wasMonitoringRef.current = false;
      }
      return;
    }

    wasMonitoringRef.current = true;

    const db = getCurrentdB(analyser);
    const waveform = getWaveformData(analyser);
    const frequency = getFrequencyData(analyser);
    state.updateAudioData({ currentDb: db, waveformData: waveform, frequencyData: frequency });

    const now = Date.now();
    if (now - lastReadingRef.current >= READING_INTERVAL) {
      const zone = getZone(db);
      state.addReading({ timestamp: now, db, zone });
      const readings = useDecibelStore.getState().readings;
      const doseReadings = readings.map((r, i, arr) => ({
        db: r.db, durationSeconds: i > 0 ? (r.timestamp - arr[i - 1].timestamp) / 1000 : 1,
      }));
      state.updateNoiseDose(calculateNoiseDose(doseReadings));
      lastReadingRef.current = now;

      // Contextual tip on zone change
      if (zone !== lastZoneRef.current) {
        lastZoneRef.current = zone;
        fetchContextualTip(zone, db);
      }

      // Noise comparison periodically
      fetchNoiseComparison(db);
    }

    animationRef.current = requestAnimationFrame(updateLoop);
  }, [fetchContextualTip, fetchNoiseComparison]);

  // Subscribe to isMonitoring — start/stop the loop
  useEffect(() => {
    const unsubscribe = useDecibelStore.subscribe(
      (state, prevState) => {
        if (state.isMonitoring && !prevState.isMonitoring) {
          // Monitoring just started — kick off the loop
          lastReadingRef.current = Date.now();
          lastZoneRef.current = 'safe';
          lastTipTimeRef.current = 0;
          lastComparisonTimeRef.current = 0;
          wasMonitoringRef.current = true;
          animationRef.current = requestAnimationFrame(updateLoop);
        } else if (!state.isMonitoring && prevState.isMonitoring) {
          // Monitoring just stopped — cancel the loop
          cancelAnimationFrame(animationRef.current);
          wasMonitoringRef.current = false;
        }
      }
    );

    // If already monitoring on mount (e.g., hot reload), start the loop
    if (useDecibelStore.getState().isMonitoring && getAnalyserNode()) {
      wasMonitoringRef.current = true;
      animationRef.current = requestAnimationFrame(updateLoop);
    }

    return () => {
      unsubscribe();
      cancelAnimationFrame(animationRef.current);
    };
  }, [updateLoop]);

  return null; // No UI — just the monitoring loop
}
