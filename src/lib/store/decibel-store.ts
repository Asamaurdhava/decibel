import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DecibelState, ExposureReading, ExposureSession, getZone } from '@/lib/types';
import { saveSession, deleteSession as deleteLocalSession } from '@/lib/db/local';
import { savePinToCloud, saveSessionToCloud, deleteSessionFromCloud } from '@/lib/db/supabase';
import { useToast } from '@/components/Toast';

export const useDecibelStore = create<DecibelState>()(persist((set, get) => ({
  // Audio
  isMonitoring: false,
  currentDb: 0,
  peakDb: 0,
  avgDb: 0,
  zone: 'safe',
  waveformData: null,
  frequencyData: null,

  // Session
  session: null,
  readings: [],
  sessionStartTime: null,

  // Noise dose
  noiseDosePercent: 0,
  timeAbove85: 0,
  timeAbove100: 0,
  dangerZoneDuration: 0,

  // Map
  mapPins: [],
  userLocation: null,

  // Report
  report: null,
  isGeneratingReport: false,

  // Session history
  pastSessions: [],
  deletedSessionIds: [] as string[],

  // Claude real-time features
  contextualTip: null,
  noiseComparison: null,
  sessionSummary: null,
  isGeneratingSummary: false,

  // Actions
  startMonitoring: () => {
    set({
      isMonitoring: true,
      sessionStartTime: Date.now(),
      readings: [],
      peakDb: 0,
      avgDb: 0,
      noiseDosePercent: 0,
      timeAbove85: 0,
      timeAbove100: 0,
      dangerZoneDuration: 0,
      report: null,
      contextualTip: null,
      noiseComparison: null,
      sessionSummary: null,
      isGeneratingSummary: false,
    });
  },

  stopMonitoring: () => {
    const state = get();
    const readings = state.readings;
    const now = Date.now();

    const newSession: ExposureSession = {
      id: crypto.randomUUID(),
      startTime: state.sessionStartTime || now,
      endTime: now,
      readings,
      avgDb: state.avgDb,
      maxDb: state.peakDb,
      minDb: readings.length > 0 ? Math.min(...readings.map(r => r.db)) : 0,
      timeAbove85: state.timeAbove85,
      timeAbove100: state.timeAbove100,
      noiseDosePercent: state.noiseDosePercent,
      location: state.userLocation || undefined,
    };

    set({
      isMonitoring: false,
      session: newSession,
      pastSessions: [newSession, ...state.pastSessions],
    });

    // Persist to IndexedDB + Supabase
    saveSession(newSession).catch(() => {
      useToast.getState().show('Session could not be saved locally', 'error');
    });
    saveSessionToCloud(newSession).catch(() => {});
  },

  updateAudioData: (data) => {
    const state = get();
    const zone = getZone(data.currentDb);
    const newPeak = Math.max(state.peakDb, data.currentDb);

    // Calculate running average
    const readingCount = state.readings.length;
    const newAvg = readingCount > 0
      ? (state.avgDb * readingCount + data.currentDb) / (readingCount + 1)
      : data.currentDb;

    // Track time above thresholds (assuming ~100ms update interval)
    const updateInterval = 0.1; // seconds
    const newTimeAbove85 = data.currentDb >= 85
      ? state.timeAbove85 + updateInterval
      : state.timeAbove85;
    const newTimeAbove100 = data.currentDb >= 100
      ? state.timeAbove100 + updateInterval
      : state.timeAbove100;

    // Track continuous danger zone duration
    const newDangerDuration = zone === 'danger'
      ? state.dangerZoneDuration + updateInterval
      : 0;

    set({
      currentDb: data.currentDb,
      peakDb: newPeak,
      avgDb: newAvg,
      zone,
      waveformData: data.waveformData,
      frequencyData: data.frequencyData,
      timeAbove85: newTimeAbove85,
      timeAbove100: newTimeAbove100,
      dangerZoneDuration: newDangerDuration,
    });
  },

  addReading: (reading: ExposureReading) => {
    set((state) => ({
      readings: [...state.readings, reading],
    }));
  },

  updateNoiseDose: (dose: number) => {
    set({ noiseDosePercent: dose });
  },

  setUserLocation: (location) => {
    set({ userLocation: location });
  },

  addMapPin: (pin) => {
    set((state) => ({
      mapPins: [...state.mapPins, pin],
    }));
    // Persist to Supabase
    savePinToCloud(pin).catch(() => {});
  },

  loadCloudPins: (pins) => {
    set((state) => {
      const existingIds = new Set(state.mapPins.map(p => p.id));
      const newPins = pins.filter(p => !existingIds.has(p.id));
      return { mapPins: [...state.mapPins, ...newPins] };
    });
  },

  setReport: (report) => {
    const state = get();
    // Persist report into the session object
    if (report && state.session) {
      const updatedSession = { ...state.session, report };
      set({ report, session: updatedSession });
      // Update in pastSessions too
      set((s) => ({
        pastSessions: s.pastSessions.map(ps => ps.id === updatedSession.id ? updatedSession : ps),
      }));
      // Persist to IndexedDB + Supabase
      saveSession(updatedSession).catch(() => {});
      saveSessionToCloud(updatedSession).catch(() => {});
    } else {
      set({ report });
    }
  },

  setIsGeneratingReport: (isGenerating) => {
    set({ isGeneratingReport: isGenerating });
  },

  setContextualTip: (tip) => {
    set({ contextualTip: tip });
  },

  setNoiseComparison: (comparison) => {
    set({ noiseComparison: comparison });
  },

  setSessionSummary: (summary) => {
    set({ sessionSummary: summary });
  },

  setIsGeneratingSummary: (isGenerating) => {
    set({ isGeneratingSummary: isGenerating });
  },

  setPastSessions: (sessions) => {
    const deleted = new Set(get().deletedSessionIds);
    set({ pastSessions: sessions.filter(s => !deleted.has(s.id)) });
  },

  loadSessionFromHistory: (session) => {
    set({
      session,
      report: session.report || null,
      isGeneratingReport: false,
      sessionSummary: null,
    });
  },

  removeSession: (id: string) => {
    const state = get();
    set({
      pastSessions: state.pastSessions.filter(s => s.id !== id),
      deletedSessionIds: [...state.deletedSessionIds, id],
      ...(state.session?.id === id ? { session: null, report: null } : {}),
    });
    deleteLocalSession(id).catch(() => {});
    deleteSessionFromCloud(id).catch(() => {});
  },

  clearCurrentReport: () => {
    set({ session: null, report: null, isGeneratingReport: false });
  },

  resetSession: () => {
    set({
      isMonitoring: false,
      currentDb: 0,
      peakDb: 0,
      avgDb: 0,
      zone: 'safe',
      waveformData: null,
      frequencyData: null,
      session: null,
      readings: [],
      sessionStartTime: null,
      noiseDosePercent: 0,
      timeAbove85: 0,
      timeAbove100: 0,
      dangerZoneDuration: 0,
      report: null,
      isGeneratingReport: false,
      contextualTip: null,
      noiseComparison: null,
      sessionSummary: null,
      isGeneratingSummary: false,
    });
  },
}), {
  name: 'decibel-store',
  storage: createJSONStorage(() => {
    if (typeof window === 'undefined') return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    return localStorage;
  }),
  partialize: (state) => ({
    session: state.session,
    report: state.report,
    pastSessions: state.pastSessions,
    deletedSessionIds: state.deletedSessionIds,
    mapPins: state.mapPins,
  }),
}));
