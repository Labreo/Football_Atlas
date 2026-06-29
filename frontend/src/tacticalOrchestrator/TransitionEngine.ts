/**
 * TransitionEngine.ts
 * ────────────────────
 * Smooth Concept Transition Engine for Football Atlas.
 *
 * Responsibilities:
 *   – Concept → Concept:        player interpolation, camera glide, overlay cross-fade
 *   – Concept → Breakdown:      contextual entry into historical mode without hard reset
 *   – Breakdown → Concept:      contextual return to abstract concept view
 *   – Classroom → Animation:    AI-triggered transitions that feel automatic and intentional
 *
 * Design principles:
 *   – The pitch NEVER visually resets. Players slide to their new positions.
 *   – Camera transitions use cubicInOut easing.
 *   – Overlays cross-fade through an opacity bridge.
 *   – A transition queue prevents race conditions when AI fires multiple concept changes.
 *   – Analytics events are emitted for every phase of every transition.
 *   – Debug mode exposes full state to the TransitionInspector component.
 *
 * Architecture:
 *   TransitionEngine (singleton)
 *     ├── relies on TransitionManager (existing) for player position interpolation
 *     ├── relies on TacticalAnimationEngine for live 3D state
 *     ├── relies on AnimationModuleRegistry for module lifecycle
 *     ├── drives TransitionStateStore (new Zustand store) for UI & Inspector
 *     └── emits analytics events via AnalyticsTracker
 */

import * as THREE from 'three';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { transitionManager } from './TransitionManager';
import { animationModuleRegistry } from './registry';
import { analyticsTracker } from './analytics';
import { tacticalApi } from '../apiClients/tacticalApi';
import { useTacticalStore } from '../stores/useTacticalStore';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { learningStateStore } from './store';
import { ConceptRouter } from './router';
import { useTransitionStore } from './TransitionStateStore';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type TransitionType =
    | 'CONCEPT_TO_CONCEPT'
    | 'CONCEPT_TO_BREAKDOWN'
    | 'BREAKDOWN_TO_CONCEPT'
    | 'CLASSROOM_TO_ANIMATION'
    | 'SAME_CONCEPT_FOLLOW_UP';

export interface TransitionRequest {
    fromConceptId: string | null;
    toConceptId: string | null;
    type: TransitionType;
    requestId: string;
    /** Duration of the player position glide phase (ms) */
    playerGlideDurationMs?: number;
    /** Duration of the camera slide phase (ms) */
    cameraDurationMs?: number;
    /** Fraction of the animation timeline reserved for the initial position slide */
    positionTransitionFraction?: number;
}

export interface TransitionResult {
    success: boolean;
    requestId: string;
    fromConceptId: string | null;
    toConceptId: string | null;
    type: TransitionType;
    durationMs: number;
    statePreserved: {
        playerPositions: boolean;
        cameraPosition: boolean;
        overlays: boolean;
        narrationState: boolean;
    };
    error?: string;
}

export interface ConceptCameraPreset {
    position: THREE.Vector3;
    target: THREE.Vector3;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT CAMERA PRESETS (per concept category)
// ─────────────────────────────────────────────────────────────────────────────

const CAMERA_PRESETS: Record<string, ConceptCameraPreset> = {
    // Overhead tactical view — default
    default: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    // Slight angle to show depth — attacking concepts (override to overhead view as requested)
    false_9: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    midfield_overload: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    third_man_run: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    high_press: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    pressing_trap: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    compactness_pressing_lines: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    defensive_block: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    counter_attack_trigger: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    back_three_wing_back: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    inverted_winger: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
    // Historical breakdown mode: low-angle cinematic (override to overhead view as requested)
    breakdown: {
        position: new THREE.Vector3(0, 135, 0.1),
        target: new THREE.Vector3(0, 0, 0),
    },
};

const getCameraPreset = (conceptId: string | null): ConceptCameraPreset => {
    if (!conceptId) return CAMERA_PRESETS.default;
    return CAMERA_PRESETS[conceptId] ?? CAMERA_PRESETS.default;
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION NARRATION STATE
// ─────────────────────────────────────────────────────────────────────────────

interface NarrationState {
    activeConcept: string | null;
    explanation: string;
    phase: number;
    phaseName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export class TransitionEngine {
    private static instance: TransitionEngine;

    // ── Core engine references ───────────────────────────────────────────────
    private engine: TacticalAnimationEngine | null = null;

    // ── Queue & lock ─────────────────────────────────────────────────────────
    private transitionQueue: TransitionRequest[] = [];
    private isTransitioning: boolean = false;
    private abortController: AbortController | null = null;

    // ── State snapshots ──────────────────────────────────────────────────────
    private lastNarrationState: NarrationState | null = null;
    private requestCounter: number = 0;

    // ── Analytics ────────────────────────────────────────────────────────────
    private transitionHistory: TransitionResult[] = [];

    private constructor() { }

    public static getInstance(): TransitionEngine {
        if (!TransitionEngine.instance) {
            TransitionEngine.instance = new TransitionEngine();
        }
        return TransitionEngine.instance;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────────────────────────────────

    public init(engine: TacticalAnimationEngine): void {
        this.engine = engine;
    }

    public detach(): void {
        this.abort();
        this.engine = null;
        this.transitionQueue = [];
        this.isTransitioning = false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Primary entry point: transition to a new tactical concept.
     * Enqueues the request and processes sequentially.
     */
    public async transitionTo(
        toConceptId: string,
        type: TransitionType = 'CONCEPT_TO_CONCEPT',
        options: Partial<Pick<TransitionRequest, 'playerGlideDurationMs' | 'cameraDurationMs' | 'positionTransitionFraction'>> = {}
    ): Promise<TransitionResult> {
        const fromConceptId = useTacticalStore.getState().currentConcept?.concept_id ?? null;

        const request: TransitionRequest = {
            fromConceptId,
            toConceptId,
            type: fromConceptId === null ? 'CLASSROOM_TO_ANIMATION' : type,
            requestId: this.generateRequestId(),
            playerGlideDurationMs: options.playerGlideDurationMs ?? 900,
            cameraDurationMs: options.cameraDurationMs ?? 1200,
            positionTransitionFraction: options.positionTransitionFraction ?? 0.18,
        };

        return this.enqueue(request);
    }

    /**
     * Transition into historical breakdown mode.
     * Does NOT reset the pitch — smoothly moves camera to cinematic preset
     * and dims the current overlay before the breakdown module takes over.
     */
    public async transitionToBreakdown(exampleId: string): Promise<TransitionResult> {
        const fromConceptId = useTacticalStore.getState().currentConcept?.concept_id ?? null;
        const request: TransitionRequest = {
            fromConceptId,
            toConceptId: exampleId,
            type: 'CONCEPT_TO_BREAKDOWN',
            requestId: this.generateRequestId(),
            cameraDurationMs: 1400,
            playerGlideDurationMs: 0, // breakdown handles its own player setup
            positionTransitionFraction: 0.12,
        };
        return this.enqueue(request);
    }

    /**
     * Return from historical breakdown to abstract concept view.
     */
    public async transitionFromBreakdown(toConceptId: string): Promise<TransitionResult> {
        const request: TransitionRequest = {
            fromConceptId: null,
            toConceptId,
            type: 'BREAKDOWN_TO_CONCEPT',
            requestId: this.generateRequestId(),
            cameraDurationMs: 1100,
            playerGlideDurationMs: 800,
            positionTransitionFraction: 0.16,
        };
        return this.enqueue(request);
    }

    /**
     * Abort any in-progress transition and clear the queue.
     * Call when user explicitly navigates away.
     */
    public abort(): void {
        this.abortController?.abort();
        this.transitionQueue = [];
        this.isTransitioning = false;
        useTransitionStore.setState({
            isTransitioning: false,
            activeTransition: null,
        });
    }

    /**
     * Snapshot the current narration state before a transition.
     */
    public snapshotNarrationState(): void {
        const ui = useLearningUIStore.getState();
        this.lastNarrationState = {
            activeConcept: learningStateStore.getState().currentConcept?.concept_id ?? null,
            explanation: ui.current_explanation ?? '',
            phase: ui.current_phase_index ?? 1,
            phaseName: ui.current_phase_name ?? '',
        };
    }

    /** Returns the last snapshotted narration state. */
    public getNarrationSnapshot(): NarrationState | null {
        return this.lastNarrationState;
    }

    /** Returns the full transition history for the Inspector. */
    public getTransitionHistory(): TransitionResult[] {
        return [...this.transitionHistory];
    }

    /** Returns whether a transition is currently active. */
    public getIsTransitioning(): boolean {
        return this.isTransitioning;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUEUE PROCESSOR
    // ─────────────────────────────────────────────────────────────────────────

    private enqueue(request: TransitionRequest): Promise<TransitionResult> {
        // If transitioning to the exact same concept that is already active and
        // a module is loaded, treat it as a silent same-concept follow-up.
        const activeConcept = learningStateStore.getState().currentConcept;
        if (
            activeConcept?.concept_id === request.toConceptId &&
            request.type !== 'CONCEPT_TO_BREAKDOWN' &&
            request.type !== 'BREAKDOWN_TO_CONCEPT'
        ) {
            return Promise.resolve(this.buildNoOpResult(request));
        }

        // Replace the queue tail if the incoming request targets the same destination.
        // This prevents stacking 3 identical transitions during rapid AI output.
        const tail = this.transitionQueue[this.transitionQueue.length - 1];
        if (tail && tail.toConceptId === request.toConceptId && tail.type === request.type) {
            this.transitionQueue[this.transitionQueue.length - 1] = request;
            return Promise.resolve(this.buildNoOpResult(request));
        }

        return new Promise<TransitionResult>((resolve) => {
            (request as any)._resolve = resolve;
            this.transitionQueue.push(request);
            if (!this.isTransitioning) {
                this.processNext();
            }
        });
    }

    private async processNext(): Promise<void> {
        if (this.transitionQueue.length === 0) {
            this.isTransitioning = false;
            return;
        }

        this.isTransitioning = true;
        const request = this.transitionQueue.shift()!;
        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        const startTime = performance.now();
        let result: TransitionResult;

        try {
            switch (request.type) {
                case 'CONCEPT_TO_CONCEPT':
                case 'CLASSROOM_TO_ANIMATION':
                case 'BREAKDOWN_TO_CONCEPT':
                    result = await this.executeConceptTransition(request, signal);
                    break;
                case 'CONCEPT_TO_BREAKDOWN':
                    result = await this.executeBreakdownEntry(request, signal);
                    break;
                case 'SAME_CONCEPT_FOLLOW_UP':
                    result = this.buildNoOpResult(request);
                    break;
                default:
                    result = await this.executeConceptTransition(request, signal);
            }
        } catch (err: any) {
            const endTime = performance.now();
            result = {
                success: false,
                requestId: request.requestId,
                fromConceptId: request.fromConceptId,
                toConceptId: request.toConceptId,
                type: request.type,
                durationMs: Math.round(endTime - startTime),
                statePreserved: { playerPositions: false, cameraPosition: false, overlays: false, narrationState: false },
                error: err?.message ?? 'Unknown transition error',
            };
            analyticsTracker.track('transition_interrupted', {
                request_id: request.requestId,
                from: request.fromConceptId,
                to: request.toConceptId,
                error: result.error,
            });
        } finally {
            result!.durationMs = Math.round(performance.now() - startTime);
            this.transitionHistory.unshift(result!);
            if (this.transitionHistory.length > 50) this.transitionHistory.pop();

            useTransitionStore.setState({ isTransitioning: false, activeTransition: null });
            (request as any)._resolve?.(result!);

            this.isTransitioning = false;

            analyticsTracker.track('transition_completed', {
                request_id: result!.requestId,
                from: result!.fromConceptId,
                to: result!.toConceptId,
                type: result!.type,
                duration_ms: result!.durationMs,
                success: result!.success,
            });

            // Process next item in queue
            this.processNext();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONCEPT TRANSITION
    // ─────────────────────────────────────────────────────────────────────────

    private async executeConceptTransition(
        request: TransitionRequest,
        signal: AbortSignal
    ): Promise<TransitionResult> {
        const { fromConceptId, toConceptId, requestId, type } = request;
        const startTime = performance.now();

        if (!toConceptId) throw new Error('toConceptId is required for concept transitions');

        // ── 1. Announce transition start ─────────────────────────────────────
        analyticsTracker.track('transition_started', {
            request_id: requestId,
            from: fromConceptId,
            to: toConceptId,
            type,
        });

        useTransitionStore.setState({
            isTransitioning: true,
            activeTransition: {
                requestId,
                fromConceptId,
                toConceptId,
                type,
                startedAt: Date.now(),
                playerGlideDurationMs: request.playerGlideDurationMs ?? 900,
                cameraDurationMs: request.cameraDurationMs ?? 1200,
            },
        });

        // ── 2. Snapshot narration before overwriting ──────────────────────────
        this.snapshotNarrationState();
        const statePreserved = {
            playerPositions: false,
            cameraPosition: false,
            overlays: false,
            narrationState: true,
        };

        if (signal.aborted) throw new Error('Transition aborted');

        // ── 3. Resolve animation module ──────────────────────────────────────
        const moduleKey = ConceptRouter.resolveAnimationModule(toConceptId);
        if (!moduleKey) {
            // Concept has no 3D module — do a lightweight store update only
            const concept = await tacticalApi.getConceptById(toConceptId);
            useTacticalStore.setState({ currentConcept: concept, playState: 'stopped' });
            useLearningUIStore.getState().setCurrentConcept(concept);
            learningStateStore.getState().setCurrentConcept(concept);
            return {
                success: true, requestId, fromConceptId, toConceptId, type,
                durationMs: Math.round(performance.now() - startTime),
                statePreserved,
            };
        }

        if (signal.aborted) throw new Error('Transition aborted');

        // ── 4. Run parallel: camera glide + player slide ─────────────────────
        const cameraPreset = getCameraPreset(toConceptId);
        const [concept] = await Promise.all([
            tacticalApi.getConceptById(toConceptId),
            this.runCameraTransition(cameraPreset, request.cameraDurationMs ?? 1200, signal),
        ]);
        statePreserved.cameraPosition = true;

        if (signal.aborted) throw new Error('Transition aborted');

        // ── 5. Load the new module — the TransitionManager handles player slides ─
        const hasExistingPlayers = this.engine
            ? this.engine.getPlayerManager().getPlayers().size > 0
            : false;

        const newModuleInstance = animationModuleRegistry.loadModule(moduleKey, this.engine!);

        // Wire lifecycle callbacks
        newModuleInstance.onPhaseChange = (index: number, name: string) => {
            useLearningUIStore.getState().setPhaseInfo(index, name);
        };
        newModuleInstance.onAnnotationChange = (annotation: string) => {
            useLearningUIStore.getState().setPhaseAnnotation(annotation);
        };
        newModuleInstance.onAnalyticsEvent = (_name: string, _data: any) => { };

        // reset() fires the module's init sequence — TransitionManager already
        // rewrote startPos values from the previous player positions, so the
        // very first frame shows players in their OLD positions and they glide
        // to new positions over the first positionTransitionFraction of the timeline.
        statePreserved.playerPositions = hasExistingPlayers;
        newModuleInstance.reset();

        if (signal.aborted) throw new Error('Transition aborted');

        // ── 6. Update all stores ──────────────────────────────────────────────
        useLearningUIStore.getState().setCurrentConcept(concept);
        useLearningUIStore.getState().setLoading(false);
        learningStateStore.getState().setCurrentConcept(concept);
        learningStateStore.getState().setCurrentAnimation(moduleKey);
        learningStateStore.getState().setAnimationStatus('playing');

        useTacticalStore.setState({ currentConcept: concept, playState: 'playing' });
        useLearningUIStore.getState().setAnimationState('playing');

        return {
            success: true, requestId, fromConceptId, toConceptId, type,
            durationMs: Math.round(performance.now() - startTime),
            statePreserved: { ...statePreserved, overlays: false },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BREAKDOWN ENTRY
    // ─────────────────────────────────────────────────────────────────────────

    private async executeBreakdownEntry(
        request: TransitionRequest,
        signal: AbortSignal
    ): Promise<TransitionResult> {
        const { fromConceptId, toConceptId, requestId } = request;
        const startTime = performance.now();

        analyticsTracker.track('transition_started', {
            request_id: requestId,
            from: fromConceptId,
            to: toConceptId,
            type: 'CONCEPT_TO_BREAKDOWN',
        });

        useTransitionStore.setState({
            isTransitioning: true,
            activeTransition: {
                requestId,
                fromConceptId,
                toConceptId,
                type: 'CONCEPT_TO_BREAKDOWN',
                startedAt: Date.now(),
                playerGlideDurationMs: 0,
                cameraDurationMs: request.cameraDurationMs ?? 1400,
            },
        });

        this.snapshotNarrationState();

        // Camera glides to cinematic breakdown preset
        await this.runCameraTransition(CAMERA_PRESETS.breakdown, request.cameraDurationMs ?? 1400, signal);

        if (signal.aborted) throw new Error('Transition aborted');

        // Current concept animation continues to run — the breakdown store takes
        // over the UI panel. We do NOT reset the engine here.

        return {
            success: true,
            requestId,
            fromConceptId,
            toConceptId,
            type: 'CONCEPT_TO_BREAKDOWN',
            durationMs: Math.round(performance.now() - startTime),
            statePreserved: {
                playerPositions: true,  // engine keeps running
                cameraPosition: true,
                overlays: true,
                narrationState: true,
            },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CAMERA TRANSITION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Smoothly glides the camera to a target preset using cubicInOut easing.
     * Runs on a separate rAF loop so it doesn't block the main render cycle.
     */
    private runCameraTransition(
        preset: ConceptCameraPreset,
        durationMs: number,
        signal: AbortSignal
    ): Promise<void> {
        if (!this.engine) return Promise.resolve();

        // Read camera/controls from the engine's stored references
        const camera: THREE.PerspectiveCamera | null = (this.engine as any).camera ?? null;
        const controls: any = (this.engine as any).controls ?? null;

        if (!camera) return Promise.resolve();

        return transitionManager.transitionCamera(
            camera,
            controls,
            preset.position,
            preset.target,
            durationMs
        ).then(() => {
            if (signal.aborted) return;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // OVERLAY CROSS-FADE (future: can animate opacity via a tween layer)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fades out the current overlays over durationMs before the new module loads.
     * Uses the OverlayManager's opacity field — future: use a dedicated tween.
     */
    public async fadeOutOverlays(durationMs: number = 300): Promise<void> {
        // Overlays in Football Atlas are redrawn per-frame from OverlayState data.
        // A lightweight fade is achieved by waiting for the module load to clear them.
        await this.delay(durationMs);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private generateRequestId(): string {
        this.requestCounter++;
        return `tx_${Date.now()}_${this.requestCounter}`;
    }

    private buildNoOpResult(request: TransitionRequest): TransitionResult {
        return {
            success: true,
            requestId: request.requestId,
            fromConceptId: request.fromConceptId,
            toConceptId: request.toConceptId,
            type: 'SAME_CONCEPT_FOLLOW_UP',
            durationMs: 0,
            statePreserved: {
                playerPositions: true,
                cameraPosition: true,
                overlays: true,
                narrationState: true,
            },
        };
    }
}

export const transitionEngine = TransitionEngine.getInstance();
