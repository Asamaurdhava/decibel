import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DecibelState, ExposureReading, ExposureSession, getZone } from '@/lib/types';
import { saveSession, deleteSession as deleteLocalSession } from '@/lib/db/local';
import { savePinToCloud, saveSessionToCloud, deleteSessionFromCloud, linkPinsToSession } from '@/lib/db/supabase';
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
  _updateCount: 0,
  _lastUpdateTime: 0,

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
      _updateCount: 0,
      _lastUpdateTime: 0,
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

    const sessionId = crypto.randomUUID();
    const newSession: ExposureSession = {
      id: sessionId,
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

    // Tag all unlinked pins from this session
    const taggedPins = state.mapPins.map(p =>
      !p.sessionId && p.timestamp >= (state.sessionStartTime || 0) && p.timestamp <= now
        ? { ...p, sessionId }
        : p
    );

    set({
      isMonitoring: false,
      session: newSession,
      pastSessions: [newSession, ...state.pastSessions],
      mapPins: taggedPins,
      // Reset display values to zero for clean slate
      currentDb: 0,
      peakDb: 0,
      avgDb: 0,
      zone: 'safe',
      waveformData: null,
      frequencyData: null,
      readings: [],
      noiseDosePercent: 0,
      timeAbove85: 0,
      timeAbove100: 0,
      dangerZoneDuration: 0,
      _updateCount: 0,
      _lastUpdateTime: 0,
    });

    // Persist to IndexedDB + Supabase
    saveSession(newSession).catch(() => {
      useToast.getState().show('Session could not be saved locally', 'error');
    });
    saveSessionToCloud(newSession).catch(() => {});

    // Batch-update Supabase pins with the new sessionId
    const linkedPinIds = taggedPins.filter(p => p.sessionId === sessionId).map(p => p.id);
    linkPinsToSession(linkedPinIds, sessionId).catch(() => {});
  },

  updateAudioData: (data) => {
    const state = get();
    const zone = getZone(data.currentDb);
    const newPeak = Math.max(state.peakDb, data.currentDb);

    // Calculate running average using frame count for accuracy
    const newUpdateCount = (state._updateCount || 0) + 1;
    const newAvg = state._updateCount
      ? (state.avgDb * state._updateCount + data.currentDb) / newUpdateCount
      : data.currentDb;

    // Use real elapsed time for threshold tracking
    const now = performance.now();
    const elapsed = state._lastUpdateTime
      ? (now - state._lastUpdateTime) / 1000 // convert ms to seconds
      : 0;

    const newTimeAbove85 = data.currentDb >= 85
      ? state.timeAbove85 + elapsed
      : state.timeAbove85;
    const newTimeAbove100 = data.currentDb >= 100
      ? state.timeAbove100 + elapsed
      : state.timeAbove100;

    // Track continuous danger zone duration
    const newDangerDuration = zone === 'danger'
      ? state.dangerZoneDuration + elapsed
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
      _updateCount: newUpdateCount,
      _lastUpdateTime: now,
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
    const existing = get().pastSessions;
    const existingMap = new Map(existing.map(s => [s.id, s]));

    // Merge: combine best fields from local + cloud
    const merged = sessions
      .filter(s => !deleted.has(s.id))
      .map(s => {
        const prev = existingMap.get(s.id);
        if (!prev) return s;
        // Merge: take the best of both (cloud name, local report, etc.)
        return {
          ...s,
          name: s.name || prev.name,
          report: s.report || prev.report,
        };
      });

    // Also keep any existing sessions not in the DB list (e.g. just created)
    existing.forEach(s => {
      if (!deleted.has(s.id) && !merged.find(m => m.id === s.id)) {
        merged.push(s);
      }
    });

    merged.sort((a, b) => b.startTime - a.startTime);
    set({ pastSessions: merged });
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

  setSessionName: (name: string) => {
    const state = get();
    if (!state.session) return;
    const updated = { ...state.session, name };
    set({
      session: updated,
      pastSessions: state.pastSessions.map(s => s.id === updated.id ? updated : s),
    });
    saveSession(updated).catch(() => {});
    saveSessionToCloud(updated).catch(() => {});
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
