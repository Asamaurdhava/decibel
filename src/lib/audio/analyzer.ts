// dB calculation engine: RMS → dBFS → estimated dBSPL

// Calibration offset: difference between dBFS and estimated dBSPL
// Default assumes a typical phone mic. User can calibrate via Tone.js reference.
let calibrationOffset = 94; // dBSPL of a typical reference (adjustable)

export function setCalibrationOffset(offset: number): void {
  calibrationOffset = offset;
}

export function getCalibrationOffset(): number {
  return calibrationOffset;
}

/**
 * Calculate RMS (Root Mean Square) from time-domain audio data
 */
export function calculateRMS(dataArray: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sumSquares += dataArray[i] * dataArray[i];
  }
  return Math.sqrt(sumSquares / dataArray.length);
}

/**
 * Convert RMS to dBFS (decibels relative to full scale)
 * Full scale = 1.0 for normalized float audio data
 */
export function rmsTodBFS(rms: number): number {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

/**
 * Convert dBFS to estimated dBSPL using calibration offset
 * Note: This is an ESTIMATE. Phone mics are not calibrated instruments.
 */
export function dBFSTodBSPL(dbfs: number): number {
  return dbfs + calibrationOffset;
}

/**
 * Main function: get current dB level from analyser node
 * Returns estimated dBSPL value
 */
export function getCurrentdB(analyserNode: AnalyserNode): number {
  const bufferLength = analyserNode.fftSize;
  const dataArray = new Float32Array(bufferLength);
  analyserNode.getFloatTimeDomainData(dataArray);

  const rms = calculateRMS(dataArray);
  const dbfs = rmsTodBFS(rms);
  const dbspl = dBFSTodBSPL(dbfs);

  // Clamp to reasonable range
  return Math.max(0, Math.min(150, dbspl));
}

/**
 * Get waveform data (time domain) for visualization
 */
export function getWaveformData(analyserNode: AnalyserNode): Float32Array {
  const bufferLength = analyserNode.fftSize;
  const dataArray = new Float32Array(bufferLength);
  analyserNode.getFloatTimeDomainData(dataArray);
  return dataArray;
}

/**
 * Get frequency data for spectrum visualization
 */
export function getFrequencyData(analyserNode: AnalyserNode): Uint8Array {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyserNode.getByteFrequencyData(dataArray);
  return dataArray;
}

/**
 * Determine dominant frequency profile from frequency data
 */
export function getFrequencyProfile(analyserNode: AnalyserNode): string {
  const data = getFrequencyData(analyserNode);
  const binCount = data.length;
  const sampleRate = analyserNode.context.sampleRate;
  const binWidth = sampleRate / (analyserNode.fftSize);

  // Split into low (20-250Hz), mid (250-2000Hz), high (2000-20000Hz)
  let lowSum = 0, midSum = 0, highSum = 0;
  let lowCount = 0, midCount = 0, highCount = 0;

  for (let i = 0; i < binCount; i++) {
    const freq = i * binWidth;
    if (freq < 250) { lowSum += data[i]; lowCount++; }
    else if (freq < 2000) { midSum += data[i]; midCount++; }
    else if (freq < 20000) { highSum += data[i]; highCount++; }
  }

  const lowAvg = lowCount > 0 ? lowSum / lowCount : 0;
  const midAvg = midCount > 0 ? midSum / midCount : 0;
  const highAvg = highCount > 0 ? highSum / highCount : 0;

  const max = Math.max(lowAvg, midAvg, highAvg);
  if (max === lowAvg) return 'low_heavy';
  if (max === midAvg) return 'mid_heavy';
  return 'high_heavy';
}
