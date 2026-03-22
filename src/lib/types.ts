// ============================================================
// Decibel — Core Types & Interfaces
// ============================================================

// --- Sound Level Zones ---
export type DangerZone = 'safe' | 'caution' | 'danger';

export interface ZoneThreshold {
  zone: DangerZone;
  minDb: number;
  maxDb: number;
  color: string;
  label: string;
}

export const ZONE_THRESHOLDS: ZoneThreshold[] = [
  { zone: 'safe', minDb: 0, maxDb: 70, color: '#22C55E', label: 'Safe' },
  { zone: 'caution', minDb: 70, maxDb: 85, color: '#F59E0B', label: 'Caution' },
  { zone: 'danger', minDb: 85, maxDb: 200, color: '#EF4444', label: 'Danger' },
];

// --- WHO Noise Dose ---
export const WHO_REFERENCE_DB = 85;
export const WHO_REFERENCE_HOURS = 8;
export const DB_DOUBLING_FACTOR = 3; // Every 3 dB doubles the risk

export interface NoiseDoseEntry {
  timestamp: number;
  db: number;
  duration: number; // in seconds
}

// --- Audio Capture ---
export interface AudioCaptureState {
  isCapturing: boolean;
  currentDb: number;
  peakDb: number;
  avgDb: number;
  waveformData: Float32Array | null;
  frequencyData: Uint8Array | null;
  sampleRate: number;
}

// --- Exposure Session ---
export interface ExposureReading {
  timestamp: number;
  db: number;
  zone: DangerZone;
}

export interface ExposureSession {
  id: string;
  name?: string;
  startTime: number;
  endTime: number | null;
  readings: ExposureReading[];
  avgDb: number;
  maxDb: number;
  minDb: number;
  timeAbove85: number; // seconds
  timeAbove100: number; // seconds
  noiseDosePercent: number;
  location?: {
    lat: number;
    lng: number;
  };
  report?: HearingReport;
}

// --- Noise Map ---
export interface NoiseMapPin {
  id: string;
  lat: number;
  lng: number;
  avgDb: number;
  peakDb: number;
  timestamp: number;
  zone: DangerZone;
  sessionId?: string;
}

// --- Claude Analysis ---
export interface AnalysisInput {
  session_duration_minutes: number;
  avg_db: number;
  max_db: number;
  min_db: number;
  time_above_85db_minutes: number;
  time_above_100db_minutes: number;
  noise_dose_percent: number;
  frequency_profile: string;
  location_type: string;
  reading_count: number;
}

export interface RiskAnalysis {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  hearing_score: number;
  key_concern: string;
  daily_budget_used: string;
  safe_time_remaining_at_current_level: string;
  cumulative_risk_factor: number;
}

export interface HearingReport {
  summary: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  hearing_score: number;
  top_3_recommendations: string[];
  long_term_projection: string;
  comparison: string;
  action_items: string[];
  daily_budget_used: string;
  safe_time_remaining: string;
}

// --- Claude Real-time Features ---
export interface ContextualTip {
  tip: string;
  zone: DangerZone;
  timestamp: number;
}

export interface NoiseComparison {
  comparison: string;
  db: number;
  timestamp: number;
}

export interface SessionSummary {
  summary: string;
  key_stat: string;
  recommendation: string;
}

// --- Store State ---
export interface DecibelState {
  // Audio
  isMonitoring: boolean;
  currentDb: number;
  peakDb: number;
  avgDb: number;
  zone: DangerZone;
  waveformData: Float32Array | null;
  frequencyData: Uint8Array | null;

  // Session
  session: ExposureSession | null;
  readings: ExposureReading[];
  sessionStartTime: number | null;

  // Noise dose
  noiseDosePercent: number;
  timeAbove85: number; // seconds
  timeAbove100: number; // seconds
  dangerZoneDuration: number; // seconds in current danger zone stint
  _updateCount: number; // internal: frame count for accurate averaging
  _lastUpdateTime: number; // internal: performance.now() for elapsed time

  // Map
  mapPins: NoiseMapPin[];
  userLocation: { lat: number; lng: number } | null;

  // Report
  report: HearingReport | null;
  isGeneratingReport: boolean;

  // Session history (IndexedDB)
  pastSessions: ExposureSession[];
  setPastSessions: (sessions: ExposureSession[]) => void;
  loadSessionFromHistory: (session: ExposureSession) => void;

  // Claude real-time features
  contextualTip: ContextualTip | null;
  noiseComparison: NoiseComparison | null;
  sessionSummary: SessionSummary | null;
  isGeneratingSummary: boolean;

  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  updateAudioData: (data: {
    currentDb: number;
    waveformData: Float32Array | null;
    frequencyData: Uint8Array | null;
  }) => void;
  addReading: (reading: ExposureReading) => void;
  updateNoiseDose: (dose: number) => void;
  setUserLocation: (location: { lat: number; lng: number }) => void;
  addMapPin: (pin: NoiseMapPin) => void;
  loadCloudPins: (pins: NoiseMapPin[]) => void;
  setReport: (report: HearingReport | null) => void;
  setIsGeneratingReport: (isGenerating: boolean) => void;
  setContextualTip: (tip: ContextualTip | null) => void;
  setNoiseComparison: (comparison: NoiseComparison | null) => void;
  setSessionSummary: (summary: SessionSummary | null) => void;
  setIsGeneratingSummary: (isGenerating: boolean) => void;
  removeSession: (id: string) => void;
  setSessionName: (name: string) => void;
  clearCurrentReport: () => void;
  resetSession: () => void;
}

// --- Utility ---
export function getZone(db: number): DangerZone {
  if (db >= 85) return 'danger';
  if (db >= 70) return 'caution';
  return 'safe';
}

export function getZoneColor(zone: DangerZone): string {
  switch (zone) {
    case 'danger': return '#EF4444';
    case 'caution': return '#F59E0B';
    case 'safe': return '#22C55E';
  }
}

export function getZoneLabel(zone: DangerZone): string {
  switch (zone) {
    case 'danger': return 'DANGER';
    case 'caution': return 'CAUTION';
    case 'safe': return 'SAFE';
  }
}
