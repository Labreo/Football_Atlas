/**
 * TransitionInspector.tsx
 * ───────────────────────
 * Debug HUD overlay for the TransitionEngine.
 *
 * Shows:
 *   – Active transition: Source → Target, Type, Duration, State Preserved flags
 *   – History log: last 20 completed transitions
 *   – Session stats: total / interrupted / average duration
 *
 * Toggled by pressing ` (backtick) or clicking the ⟳ badge in the pitch corner.
 * Only renders in dev mode (import.meta.env.DEV).
 */

import React, { useEffect, useCallback } from 'react';
import { useTransitionStore, type TransitionHistoryRecord } from '../../tacticalOrchestrator/TransitionStateStore.ts';
import type { TransitionType } from '../../tacticalOrchestrator/TransitionEngine.ts';

// ─────────────────────────────────────────────────────────────────────────────
// LABEL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TransitionType, { label: string; color: string }> = {
  CONCEPT_TO_CONCEPT:       { label: 'C → C',        color: '#10B981' },
  CONCEPT_TO_BREAKDOWN:     { label: 'C → Brkdwn',   color: '#F59E0B' },
  BREAKDOWN_TO_CONCEPT:     { label: 'Brkdwn → C',   color: '#60A5FA' },
  CLASSROOM_TO_ANIMATION:   { label: 'Chat → Anim',  color: '#A78BFA' },
  SAME_CONCEPT_FOLLOW_UP:   { label: 'Follow-up',    color: '#6B7280' },
};

const STATE_FLAG: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono ${
      active
        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
        : 'bg-slate-800/60 text-slate-500 border border-slate-700/30 line-through'
    }`}
  >
    {active ? '✓' : '✗'} {label}
  </span>
);

const ConceptLabel: React.FC<{ id: string | null }> = ({ id }) => (
  <span className="font-mono text-slate-200 text-[10px]">
    {id ? id.replace(/_/g, ' ') : <span className="text-slate-500">—</span>}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TransitionInspector: React.FC = () => {
  const {
    isTransitioning,
    activeTransition,
    history,
    inspectorOpen,
    totalTransitions,
    interruptedTransitions,
    toggleInspector,
  } = useTransitionStore();

  // Keyboard shortcut: backtick toggles the inspector
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === '`' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleInspector();
      }
    },
    [toggleInspector]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Compute average duration from history
  const successfulHistory = history.filter((h: TransitionHistoryRecord) => h.success && h.durationMs > 0);
  const avgDuration =
    successfulHistory.length > 0
      ? Math.round(
          successfulHistory.reduce((sum: number, h: TransitionHistoryRecord) => sum + h.durationMs, 0) / successfulHistory.length
        )
      : 0;

  // ── Transition badge (always visible) ──────────────────────────────────
  const badge = (
    <button
      onClick={toggleInspector}
      title="Transition Inspector (backtick)"
      className={`absolute bottom-4 left-4 z-50 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all duration-200 border ${
        isTransitioning
          ? 'bg-amber-900/60 border-amber-600/50 text-amber-300 animate-pulse'
          : inspectorOpen
          ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
          : 'bg-slate-900/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isTransitioning ? 'bg-amber-400' : 'bg-slate-600'
        }`}
      />
      {isTransitioning ? 'Transitioning…' : `TX ×${totalTransitions}`}
    </button>
  );

  if (!inspectorOpen) return badge;

  // ── Full inspector panel ────────────────────────────────────────────────
  return (
    <>
      {badge}

      <div className="absolute bottom-12 left-4 z-50 w-[340px] max-h-[520px] overflow-hidden rounded-xl border border-slate-700/60 bg-[#0A0D14]/95 backdrop-blur-md shadow-2xl shadow-black/60 flex flex-col font-mono text-[10px]">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/40 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#10B981] text-[9px] uppercase tracking-widest">⟳ Transition Inspector</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>Total: <span className="text-slate-300">{totalTransitions}</span></span>
            <span>Interrupted: <span className={interruptedTransitions > 0 ? 'text-red-400' : 'text-slate-300'}>{interruptedTransitions}</span></span>
            <span>Avg: <span className="text-slate-300">{avgDuration}ms</span></span>
            <button onClick={toggleInspector} className="text-slate-500 hover:text-slate-200 text-xs ml-1">✕</button>
          </div>
        </div>

        {/* Active transition */}
        <div className="px-3 py-2 border-b border-slate-800/60 shrink-0">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">Active</div>
          {activeTransition ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{
                    color: TYPE_LABELS[activeTransition.type]?.color ?? '#6B7280',
                    backgroundColor: `${TYPE_LABELS[activeTransition.type]?.color ?? '#6B7280'}18`,
                    border: `1px solid ${TYPE_LABELS[activeTransition.type]?.color ?? '#6B7280'}40`,
                  }}
                >
                  {TYPE_LABELS[activeTransition.type]?.label ?? activeTransition.type}
                </span>
                <span className="text-[9px] text-slate-500">#{activeTransition.requestId.slice(-6)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px]">
                <ConceptLabel id={activeTransition.fromConceptId} />
                <span className="text-slate-600">→</span>
                <ConceptLabel id={activeTransition.toConceptId} />
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                <span>Player glide: <span className="text-slate-300">{activeTransition.playerGlideDurationMs}ms</span></span>
                <span>•</span>
                <span>Camera: <span className="text-slate-300">{activeTransition.cameraDurationMs}ms</span></span>
              </div>

              {/* Animated progress bar */}
              <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#10B981] rounded-full animate-pulse"
                  style={{ width: '60%' }}
                />
              </div>
            </div>
          ) : (
            <div className="text-slate-600 text-[9px] italic">Idle — no transition in progress</div>
          )}
        </div>

        {/* History log */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">History</div>
          {history.length === 0 && (
            <div className="text-slate-600 italic text-[9px]">No transitions yet this session.</div>
          )}
          {history.slice(0, 20).map((record: TransitionHistoryRecord) => {
            const meta = TYPE_LABELS[record.type] ?? { label: record.type, color: '#6B7280' };
            return (
              <div
                key={record.requestId}
                className={`rounded-lg px-2 py-1.5 border ${
                  record.success
                    ? 'bg-slate-900/40 border-slate-700/30'
                    : 'bg-red-950/30 border-red-800/30'
                }`}
              >
                {/* Row 1: type badge + concept path + duration */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-1 py-0.5 rounded text-[8px] font-bold"
                      style={{
                        color: meta.color,
                        backgroundColor: `${meta.color}15`,
                        border: `1px solid ${meta.color}35`,
                      }}
                    >
                      {meta.label}
                    </span>
                    <ConceptLabel id={record.fromConceptId} />
                    <span className="text-slate-600">→</span>
                    <ConceptLabel id={record.toConceptId} />
                  </div>
                  <span className={`text-[9px] shrink-0 ${record.success ? 'text-slate-400' : 'text-red-400'}`}>
                    {record.durationMs > 0 ? `${record.durationMs}ms` : 'no-op'}
                  </span>
                </div>

                {/* Row 2: state flags */}
                {record.durationMs > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    <STATE_FLAG label="Players" active={record.statePreserved.playerPositions} />
                    <STATE_FLAG label="Camera"  active={record.statePreserved.cameraPosition} />
                    <STATE_FLAG label="Overlays" active={record.statePreserved.overlays} />
                    <STATE_FLAG label="Narration" active={record.statePreserved.narrationState} />
                  </div>
                )}

                {/* Error message */}
                {record.error && (
                  <div className="mt-1 text-[8px] text-red-400 italic">{record.error}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 border-t border-slate-800/60 text-[8px] text-slate-600 shrink-0">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 text-[8px]">`</kbd> to toggle · TransitionEngine v1.0
        </div>
      </div>
    </>
  );
};

export default TransitionInspector;
