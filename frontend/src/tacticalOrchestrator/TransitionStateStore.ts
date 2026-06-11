/**
 * TransitionStateStore.ts
 * ───────────────────────
 * Zustand store tracking the live state of the TransitionEngine.
 *
 * Consumed by:
 *   – TransitionInspector (debug HUD)
 *   – useTransitionEngine hook (React integration)
 *   – Pitch3D (shows a transition overlay badge)
 */

import { create } from 'zustand';
import { TransitionType } from './TransitionEngine';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ActiveTransitionRecord {
  requestId: string;
  fromConceptId: string | null;
  toConceptId: string | null;
  type: TransitionType;
  startedAt: number;
  playerGlideDurationMs: number;
  cameraDurationMs: number;
}

export interface TransitionHistoryRecord {
  requestId: string;
  fromConceptId: string | null;
  toConceptId: string | null;
  type: TransitionType;
  durationMs: number;
  success: boolean;
  statePreserved: {
    playerPositions: boolean;
    cameraPosition: boolean;
    overlays: boolean;
    narrationState: boolean;
  };
  error?: string;
}

export interface TransitionStoreState {
  /** Whether a transition is currently executing */
  isTransitioning: boolean;

  /** The currently executing transition record, null if idle */
  activeTransition: ActiveTransitionRecord | null;

  /** Rolling log of the last 50 completed transitions */
  history: TransitionHistoryRecord[];

  /** Whether the TransitionInspector debug panel is open */
  inspectorOpen: boolean;

  /** Total number of transitions executed in this session */
  totalTransitions: number;

  /** Total number of interrupted transitions */
  interruptedTransitions: number;

  // ── Actions ──────────────────────────────────────────────────────────────

  setIsTransitioning: (v: boolean) => void;
  setActiveTransition: (t: ActiveTransitionRecord | null) => void;
  pushHistory: (record: TransitionHistoryRecord) => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────────────

export const useTransitionStore = create<TransitionStoreState>((set) => ({
  isTransitioning: false,
  activeTransition: null,
  history: [],
  inspectorOpen: false,
  totalTransitions: 0,
  interruptedTransitions: 0,

  setIsTransitioning: (v) => set({ isTransitioning: v }),

  setActiveTransition: (t) =>
    set((state) => ({
      activeTransition: t,
      totalTransitions: t ? state.totalTransitions + 1 : state.totalTransitions,
    })),

  pushHistory: (record) =>
    set((state) => ({
      history: [record, ...state.history].slice(0, 50),
      interruptedTransitions: record.error
        ? state.interruptedTransitions + 1
        : state.interruptedTransitions,
    })),

  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),

  reset: () =>
    set({
      isTransitioning: false,
      activeTransition: null,
      history: [],
      totalTransitions: 0,
      interruptedTransitions: 0,
    }),
}));
