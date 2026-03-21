// Tone.js calibration — generate a reference tone for dB calibration

/**
 * Play a calibration tone at a known frequency and amplitude
 * User compares with a known reference (e.g., a phone app showing actual dBSPL)
 * to determine the calibration offset for their device.
 *
 * Default: 1kHz sine wave (standard calibration frequency)
 */
export async function playCalibrationTone(
  frequency: number = 1000,
  durationSeconds: number = 5
): Promise<void> {
  // Dynamic import to avoid SSR issues
  const Tone = await import('tone');

  // Ensure audio context is started (requires user gesture on iOS/Safari)
  await Tone.start();

  const synth = new Tone.Oscillator({
    frequency,
    type: 'sine' as const,
    volume: -20,
  });

  synth.toDestination();
  synth.start();

  return new Promise<void>((resolve) => {
    setTimeout(() => {
      synth.stop();
      synth.dispose();
      resolve();
    }, durationSeconds * 1000);
  });
}

/**
 * Calculate calibration offset based on user-provided reference
 * @param measuredDbfs The dBFS value our app reads during calibration tone
 * @param actualDbspl The actual dBSPL measured by a reference device
 * @returns The offset to convert dBFS → dBSPL
 */
export function calculateCalibrationOffset(
  measuredDbfs: number,
  actualDbspl: number
): number {
  return actualDbspl - measuredDbfs;
}
