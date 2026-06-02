import { create } from 'zustand';
import { TacticalConcept } from '@football-atlas/shared';
import { OrchestratorTelemetry, OrchestratorConfig } from './types';

interface LearningState {
  currentQuestion: string;
  currentConcept: TacticalConcept | null;
  currentAnimation: string | null;
  animationStatus: 'stopped' | 'playing' | 'paused';
  isLoading: boolean;
  error: string | null;
  followUpAvailable: boolean;
  telemetry: OrchestratorTelemetry;
  config: OrchestratorConfig;

  setCurrentQuestion: (q: string) => void;
  setCurrentConcept: (concept: TacticalConcept | null) => void;
  setCurrentAnimation: (anim: string | null) => void;
  setAnimationStatus: (status: 'stopped' | 'playing' | 'paused') => void;
  setIsLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
  setFollowUpAvailable: (available: boolean) => void;
  setTelemetry: (tel: Partial<OrchestratorTelemetry>) => void;
  setConfig: (config: Partial<OrchestratorConfig>) => void;
  reset: () => void;
}

export const useOrchestratorStore = create<LearningState>((set) => ({
  currentQuestion: '',
  currentConcept: null,
  currentAnimation: null,
  animationStatus: 'stopped',
  isLoading: false,
  error: null,
  followUpAvailable: false,
  telemetry: {
    graniteLatencyMs: 0,
    animationLatencyMs: 0,
    confidenceScore: 0,
    activeConceptId: 'none',
    loadedModuleId: 'none',
    sessionState: 'idle'
  },
  config: {
    autoPlayThreshold: 0.80,
    clarificationThreshold: 0.50
  },

  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setCurrentConcept: (currentConcept) => set({ currentConcept, followUpAvailable: currentConcept !== null }),
  setCurrentAnimation: (currentAnimation) => set({ currentAnimation }),
  setAnimationStatus: (animationStatus) => set({ animationStatus }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setFollowUpAvailable: (followUpAvailable) => set({ followUpAvailable }),
  setTelemetry: (tel) => set((state) => ({ telemetry: { ...state.telemetry, ...tel } })),
  setConfig: (cfg) => set((state) => ({ config: { ...state.config, ...cfg } })),
  reset: () => set({
    currentQuestion: '',
    currentConcept: null,
    currentAnimation: null,
    animationStatus: 'stopped',
    isLoading: false,
    error: null,
    followUpAvailable: false,
    telemetry: {
      graniteLatencyMs: 0,
      animationLatencyMs: 0,
      confidenceScore: 0,
      activeConceptId: 'none',
      loadedModuleId: 'none',
      sessionState: 'idle'
    }
  })
}));
export const learningStateStore = useOrchestratorStore;
