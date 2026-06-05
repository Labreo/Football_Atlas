import { create } from 'zustand';
import { HistoricalExample, HistoricalBreakdown } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { useTacticalStore } from './useTacticalStore';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import * as THREE from 'three';
import { useLearningJourneyStore } from './useLearningJourneyStore';

interface BreakdownState {
  currentExample: HistoricalExample | null;
  currentBreakdown: HistoricalBreakdown | null;
  currentMomentIndex: number;
  playbackState: 'playing' | 'paused' | 'stopped';
  learningMode: 'guided' | 'free';
  timelineProgress: number; // 0.0 to 1.0 fraction
  activeAnnotations: any[];
  selectedConcept: string | null;
  isLoading: boolean;
  error: string | null;

  startBreakdown: (example: HistoricalExample) => Promise<void>;
  setMoment: (index: number) => void;
  replayMoment: (index: number) => void;
  setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => void;
  setLearningMode: (mode: 'guided' | 'free') => void;
  updateProgress: (progress: number) => void;
  stopBreakdown: () => void;
  applyCameraPreset: (view: string) => void;
}

export const useBreakdownStore = create<BreakdownState>((set, get) => {
  let tickSubscription: (() => void) | null = null;

  const cleanupSubscription = () => {
    if (tickSubscription) {
      tickSubscription();
      tickSubscription = null;
    }
  };

  return {
    currentExample: null,
    currentBreakdown: null,
    currentMomentIndex: 0,
    playbackState: 'stopped',
    learningMode: 'guided',
    timelineProgress: 0.0,
    activeAnnotations: [],
    selectedConcept: null,
    isLoading: false,
    error: null,

    startBreakdown: async (example: HistoricalExample) => {
      cleanupSubscription();
      console.log('[startBreakdown] Triggered with example:', example.example_id, example.match_name);
      set({ isLoading: true, error: null, currentExample: example, selectedConcept: null });

      try {
        // 1. Fetch breakdown data
        const breakdown = await tacticalApi.getHistoricalBreakdown(example.example_id);
        console.log('[startBreakdown] Fetched breakdown successfully:', breakdown.title, breakdown);

        // 2. Co-load the corresponding concept animation module
        await learningOrchestrator.loadConceptAnimation(example.concept_id);

        // 3. Switch branches on the active module if necessary
        const activeModule = learningOrchestrator.getActiveModule();
        if (activeModule && typeof activeModule.setBranch === 'function') {
          if (example.example_id === 'barcelona_2009_f9') {
            activeModule.setBranch('A'); // Ferdinand follows
          } else if (example.example_id === 'spain_2012_f9') {
            activeModule.setBranch('B'); // Midfield overload / LCB holds
          }
          // Reset module to compile correct branch
          activeModule.reset();
        }

        // Set initial state values
        set({
          currentBreakdown: breakdown,
          currentMomentIndex: 0,
          playbackState: 'paused',
          timelineProgress: 0.0,
          isLoading: false,
        });

        // Track analytics
        analyticsTracker.track('breakdown_started', {
          example_id: example.example_id,
          concept_id: example.concept_id,
          mode: get().learningMode,
        });

        // 4. Seek to the first moment's timestamp
        const firstMoment = breakdown.key_moments[0];
        if (firstMoment) {
          const engine = (learningOrchestrator as any).engine;
          if (engine) {
            engine.seek(firstMoment.timestamp);
            set({ timelineProgress: firstMoment.timestamp });
            get().applyCameraPreset(firstMoment.camera_view);
          }
        }

        // Subscribe to engine tick events for progress synchronization
        const engineInstance = (learningOrchestrator as any).engine;
        if (engineInstance) {
          tickSubscription = engineInstance.subscribeTelemetry((telemetry: any) => {
            const progress = telemetry.currentTime;
            set({ timelineProgress: progress });

            const currentBrk = get().currentBreakdown;
            if (!currentBrk) return;

            // Guided Mode: Auto progression logic
            if (get().learningMode === 'guided') {
              const nextMoment = currentBrk.key_moments[get().currentMomentIndex + 1];

              // Check if we passed into the next moment's threshold
              if (nextMoment && progress >= nextMoment.timestamp) {
                const nextIdx = get().currentMomentIndex + 1;
                set({ currentMomentIndex: nextIdx });
                get().applyCameraPreset(nextMoment.camera_view);
                analyticsTracker.track('moment_viewed', {
                  breakdown_id: currentBrk.breakdown_id,
                  moment_id: nextMoment.moment_id,
                  index: nextIdx,
                });
              }

              // Check if play finished (near 1.0)
              if (progress >= 0.98 && get().playbackState === 'playing') {
                set({ playbackState: 'paused' });
                analyticsTracker.track('breakdown_completed', {
                  breakdown_id: currentBrk.breakdown_id,
                });
                const example = get().currentExample;
                if (example) {
                  useLearningJourneyStore.getState().completeBreakdown(example.concept_id, example.example_id);
                }
              }
            } else if (get().learningMode === 'free' && get().playbackState === 'playing') {
              // Check if play finished (near 1.0)
              if (progress >= 0.98) {
                set({ playbackState: 'paused' });
                analyticsTracker.track('breakdown_completed', {
                  breakdown_id: currentBrk.breakdown_id,
                });
                const example = get().currentExample;
                if (example) {
                  useLearningJourneyStore.getState().completeBreakdown(example.concept_id, example.example_id);
                }
              } else {
                // Free Explore Mode: Auto-pause at the next moment threshold
                const nextMoment = currentBrk.key_moments[get().currentMomentIndex + 1];
                if (nextMoment && progress >= nextMoment.timestamp) {
                  const nextIdx = get().currentMomentIndex + 1;
                  set({ currentMomentIndex: nextIdx, playbackState: 'paused' });
                  const engine = (learningOrchestrator as any).engine;
                  if (engine) {
                    engine.pause();
                    engine.seek(nextMoment.timestamp);
                  }
                  get().applyCameraPreset(nextMoment.camera_view);
                  analyticsTracker.track('moment_viewed', {
                    breakdown_id: currentBrk.breakdown_id,
                    moment_id: nextMoment.moment_id,
                    index: nextIdx,
                  });
                }
              }
            }
          });
        }
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    setMoment: (index: number) => {
      const breakdown = get().currentBreakdown;
      if (!breakdown) return;

      const moment = breakdown.key_moments[index];
      if (!moment) return;

      set({ currentMomentIndex: index, timelineProgress: moment.timestamp });

      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        engine.seek(moment.timestamp);
      }

      get().applyCameraPreset(moment.camera_view);

      analyticsTracker.track('moment_viewed', {
        breakdown_id: breakdown.breakdown_id,
        moment_id: moment.moment_id,
        index,
      });
    },

    replayMoment: (index: number) => {
      const breakdown = get().currentBreakdown;
      if (!breakdown) return;

      const moment = breakdown.key_moments[index];
      if (!moment) return;

      set({ timelineProgress: moment.timestamp });

      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        engine.seek(moment.timestamp);
      }

      get().applyCameraPreset(moment.camera_view);

      analyticsTracker.track('moment_replayed', {
        breakdown_id: breakdown.breakdown_id,
        moment_id: moment.moment_id,
        index,
      });
    },

    setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => {
      set({ playbackState: state });

      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        if (state === 'playing') {
          engine.play();
        } else if (state === 'paused') {
          engine.pause();
        } else if (state === 'stopped') {
          engine.reset();
          set({ timelineProgress: 0 });
        }
      }
    },

    setLearningMode: (mode: 'guided' | 'free') => {
      set({ learningMode: mode });

      const breakdown = get().currentBreakdown;
      analyticsTracker.track(mode === 'guided' ? 'guided_mode_used' : 'free_mode_used', {
        breakdown_id: breakdown?.breakdown_id,
      });
    },

    updateProgress: (progress: number) => {
      set({ timelineProgress: progress });
      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        engine.seek(progress);
      }
    },

    stopBreakdown: () => {
      cleanupSubscription();
      set({
        currentExample: null,
        currentBreakdown: null,
        currentMomentIndex: 0,
        playbackState: 'stopped',
        timelineProgress: 0.0,
      });
      // Restore standard concept settings
      const currentConcept = useTacticalStore.getState().currentConcept;
      if (currentConcept) {
        learningOrchestrator.loadConceptAnimation(currentConcept.concept_id);
      }
    },

    applyCameraPreset: (view: string) => {
      const engine = (learningOrchestrator as any).engine;
      if (!engine || !engine.camera || !engine.controls) return;

      const camera = engine.camera as THREE.PerspectiveCamera;
      const controls = engine.controls;
      const exampleId = get().currentExample?.example_id || '';

      // Set target and coordinates based on camera preset views
      if (view === 'overview') {
        controls.target.set(0, 0, 0);
        camera.position.set(0, 135, 0.1);
        camera.zoom = 1.0;
      } else if (view === 'player_focus') {
        const playerManager = engine.getPlayerManager();
        let targetPos = { x: 0, z: 0 };
        const keyPlayerId = exampleId.includes('hp') ? 'blue_cf' : 'att_false9';
        const pos = playerManager.getPlayerPosition(keyPlayerId);
        if (pos) {
          targetPos = pos;
        }
        controls.target.set(targetPos.x, 0, targetPos.z);
        camera.position.set(targetPos.x, 30, targetPos.z + 25);
        camera.zoom = 1.25;
      } else if (view === 'tactical_shape') {
        controls.target.set(10, 0, 0);
        camera.position.set(10, 60, 50);
        camera.zoom = 1.1;
      } else if (view === 'passing_lane') {
        controls.target.set(-5, 0, 0);
        camera.position.set(-5, 45, 40);
        camera.zoom = 1.15;
      } else if (view === 'space_creation') {
        controls.target.set(15, 0, -5);
        camera.position.set(15, 55, 35);
        camera.zoom = 1.2;
      }

      camera.updateProjectionMatrix();
      controls.update();
    },
  };
});
