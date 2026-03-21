// WHO noise dose calculation
// Reference: WHO guidelines — 85 dB for 8 hours max daily exposure
// Every 3 dB increase halves the safe exposure time

import { WHO_REFERENCE_DB, WHO_REFERENCE_HOURS, DB_DOUBLING_FACTOR } from '@/lib/types';

/**
 * Calculate maximum safe exposure time (in hours) for a given dB level
 * Based on WHO equal energy principle:
 * - 85 dB → 8 hours
 * - 88 dB → 4 hours
 * - 91 dB → 2 hours
 * - 94 dB → 1 hour
 * - 100 dB → 15 minutes
 * - 110 dB → ~2 minutes
 */
export function safeExposureTime(db: number): number {
  if (db < WHO_REFERENCE_DB) return Infinity;
  return WHO_REFERENCE_HOURS / Math.pow(2, (db - WHO_REFERENCE_DB) / DB_DOUBLING_FACTOR);
}

/**
 * Calculate noise dose percentage from a set of readings
 * Each reading contributes: (actual_time / allowed_time) * 100
 * Total dose > 100% means daily safe limit exceeded
 *
 * @param readings Array of { db, durationSeconds }
 * @returns Dose percentage (0-100+)
 */
export function calculateNoiseDose(
  readings: { db: number; durationSeconds: number }[]
): number {
  let totalDose = 0;

  for (const reading of readings) {
    if (reading.db < WHO_REFERENCE_DB) continue;

    const safeHours = safeExposureTime(reading.db);
    const safeSeconds = safeHours * 3600;
    totalDose += (reading.durationSeconds / safeSeconds) * 100;
  }

  return Math.round(totalDose * 10) / 10; // 1 decimal place
}

/**
 * Calculate remaining safe time at current dB level
 * @returns Remaining time in minutes, or Infinity if safe
 */
export function remainingSafeTime(
  currentDb: number,
  currentDosePercent: number
): number {
  if (currentDb < WHO_REFERENCE_DB) return Infinity;

  const remainingDosePercent = Math.max(0, 100 - currentDosePercent);
  const safeHours = safeExposureTime(currentDb);
  const totalSafeMinutes = safeHours * 60;

  return (remainingDosePercent / 100) * totalSafeMinutes;
}

/**
 * Format safe time for display
 */
export function formatSafeTime(minutes: number): string {
  if (!isFinite(minutes)) return 'Unlimited';
  if (minutes <= 0) return 'Exceeded!';
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}
