import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudienceMode } from '@football-atlas/shared';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';

// ─────────────────────────────────────────────────────────────────────────────
// AUDIENCE STORE
// Global, persisted state for the active audience mode.
// Persists across page refreshes so returning users keep their preference.
// ─────────────────────────────────────────────────────────────────────────────

export interface AudienceSwitchRecord {
  mode: AudienceMode;
  timestamp: string;
  trigger: 'auto' | 'manual';
  confidence?: number;
}

interface AudienceState {
  audienceMode: AudienceMode;
  autoDetected: boolean;
  detectionConfidence: number;
  switchHistory: AudienceSwitchRecord[];

  // Actions
  setAudienceMode: (mode: AudienceMode, trigger: 'auto' | 'manual', confidence?: number) => void;
  toggleAudienceMode: () => void;
}

export const useAudienceStore = create<AudienceState>()(
  persist(
    (set, get) => ({
      audienceMode: AudienceMode.CASUAL_FAN,
      autoDetected: false,
      detectionConfidence: 0,
      switchHistory: [],

      setAudienceMode: (mode, trigger, confidence = 0) => {
        const prev = get().audienceMode;
        if (prev === mode) return; // no-op if same

        const record: AudienceSwitchRecord = {
          mode,
          timestamp: new Date().toISOString(),
          trigger,
          confidence,
        };

        set((state) => ({
          audienceMode: mode,
          autoDetected: trigger === 'auto',
          detectionConfidence: confidence,
          switchHistory: [record, ...state.switchHistory].slice(0, 50),
        }));

        // Analytics
        analyticsTracker.track('audience_switch', {
          from: prev,
          to: mode,
          trigger,
          confidence: Math.round(confidence * 100),
        });
      },

      toggleAudienceMode: () => {
        const current = get().audienceMode;
        const next = current === AudienceMode.CASUAL_FAN
          ? AudienceMode.TACTICAL_STUDENT
          : AudienceMode.CASUAL_FAN;
        get().setAudienceMode(next, 'manual', 1.0);

        analyticsTracker.track('audience_mode', {
          mode: next,
          trigger: 'manual_toggle',
        });
      },
    }),
    {
      name: 'football-atlas-audience',
      partialize: (state) => ({
        audienceMode: state.audienceMode,
      }),
    }
  )
);
