/**
 * useTransitionEngine.ts
 * ──────────────────────
 * React hook providing components with a clean, typed interface to the
 * TransitionEngine singleton.
 *
 * Exposes:
 *   – transitionTo(conceptId)              → smooth concept-to-concept glide
 *   – transitionToBreakdown(exampleId)     → cinematic entry into historical mode
 *   – transitionFromBreakdown(conceptId)   → return from historical mode
 *   – abort()                              → cancel in-flight transition
 *   – isTransitioning                      → live boolean from store
 *   – activeTransition                     → in-flight transition record
 *   – history                              → last 50 completed transitions
 *   – inspectorOpen / toggleInspector      → debug panel control
 */

import { useCallback } from 'react';
import { transitionEngine, TransitionType } from '../tacticalOrchestrator/TransitionEngine';
import { useTransitionStore } from '../tacticalOrchestrator/TransitionStateStore';

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface TransitionOptions {
  /** Override player glide duration in ms (default: 900) */
  playerGlideDurationMs?: number;
  /** Override camera glide duration in ms (default: 1200) */
  cameraDurationMs?: number;
  /** Fraction of animation reserved for initial position slide (default: 0.18) */
  positionTransitionFraction?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useTransitionEngine() {
  const {
    isTransitioning,
    activeTransition,
    history,
    inspectorOpen,
    totalTransitions,
    interruptedTransitions,
    toggleInspector,
    setInspectorOpen,
  } = useTransitionStore();

  /**
   * Smooth concept-to-concept transition.
   * Players slide from their current positions; camera glides to the concept preset.
   */
  const transitionTo = useCallback(
    async (
      conceptId: string,
      type: TransitionType = 'CONCEPT_TO_CONCEPT',
      options: TransitionOptions = {}
    ) => {
      return transitionEngine.transitionTo(conceptId, type, options);
    },
    []
  );

  /**
   * Transition into a historical breakdown.
   * Camera glides to cinematic mode; current players stay visible briefly.
   */
  const transitionToBreakdown = useCallback(async (exampleId: string) => {
    return transitionEngine.transitionToBreakdown(exampleId);
  }, []);

  /**
   * Return from historical breakdown to abstract concept animation.
   */
  const transitionFromBreakdown = useCallback(async (conceptId: string) => {
    return transitionEngine.transitionFromBreakdown(conceptId);
  }, []);

  /**
   * Abort any in-flight transition and drain the queue.
   */
  const abort = useCallback(() => {
    transitionEngine.abort();
  }, []);

  /**
   * Retrieve all recorded transition results (for Inspector / analytics).
   */
  const getHistory = useCallback(() => {
    return transitionEngine.getTransitionHistory();
  }, []);

  return {
    // State
    isTransitioning,
    activeTransition,
    history,
    totalTransitions,
    interruptedTransitions,

    // Actions
    transitionTo,
    transitionToBreakdown,
    transitionFromBreakdown,
    abort,
    getHistory,

    // Inspector
    inspectorOpen,
    toggleInspector,
    setInspectorOpen,
  };
}
