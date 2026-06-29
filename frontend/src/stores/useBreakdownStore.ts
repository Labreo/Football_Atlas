import { create } from 'zustand';
import { HistoricalExample, HistoricalBreakdown, WhatIfOption } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { useTacticalStore } from './useTacticalStore';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import * as THREE from 'three';

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
  selectedWhatIfOption: WhatIfOption | null;
  activeAnalyst: 'nathan' | 'valeria' | 'claire' | 'lukas';

  startBreakdown: (example: HistoricalExample) => Promise<void>;
  setMoment: (index: number) => void;
  replayMoment: (index: number) => void;
  setPlaybackState: (state: 'playing' | 'paused' | 'stopped') => void;
  setLearningMode: (mode: 'guided' | 'free') => void;
  updateProgress: (progress: number) => void;
  stopBreakdown: (shouldReload?: boolean) => void;
  applyCameraPreset: (view: string) => void;
  syncWithEngine: () => void;
  setSelectedWhatIfOption: (option: WhatIfOption | null) => void;
  setActiveAnalyst: (analyst: 'nathan' | 'valeria' | 'claire' | 'lukas') => Promise<void>;
  translateBreakdown: (targetLang: string) => Promise<void>;
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
    selectedWhatIfOption: null,
    activeAnalyst: 'nathan',

    startBreakdown: async (example: HistoricalExample) => {
      cleanupSubscription();
      console.log('[startBreakdown] Triggered with example:', example.example_id, example.match_name);
      set({ isLoading: true, error: null, currentExample: example, selectedConcept: null });

      try {
        // 1. Fetch breakdown data and concept details
        const breakdown = await tacticalApi.getHistoricalBreakdown(example.example_id);
        console.log('[startBreakdown] Fetched breakdown successfully:', breakdown.title, breakdown);

        const concept = await tacticalApi.getConceptById(example.concept_id);

        // Pre-set the current concept in the global store to trigger mounting the InteractivePitchPlayer
        useTacticalStore.setState({ currentConcept: concept });

        // Wait for WebGL / Pitch3D canvas to finish mounting and registering the engine
        await new Promise<void>((resolve) => {
          const check = () => {
            if ((learningOrchestrator as any).engine) {
              resolve();
            } else {
              setTimeout(check, 50);
            }
          };
          check();
        });

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
          selectedWhatIfOption: null,
        });

        // Translate the breakdown if the current language is not English
        const currentLang = useTacticalStore.getState().lang;
        if (currentLang !== 'en') {
          await get().translateBreakdown(currentLang);
        }

        // Set visual mode to historical
        useTacticalStore.getState().setVisualMode('historical');

        // Track analytics
        analyticsTracker.trackBreakdownStarted(breakdown.breakdown_id, {
          example_id: example.example_id,
          concept_id: example.concept_id,
          mode: get().learningMode,
        });

        // 4. Synchronize with the 3D animation engine
        get().syncWithEngine();
      } catch (err: any) {
        set({ error: err.message, isLoading: false });
      }
    },

    syncWithEngine: () => {
      cleanupSubscription();
      const engineInstance = (learningOrchestrator as any).engine;
      if (!engineInstance) {
        console.log('[useBreakdownStore] Engine not yet initialized. Postponing subscription.');
        return;
      }

      const breakdown = get().currentBreakdown;
      if (!breakdown) return;

      const currentMoment = breakdown.key_moments[get().currentMomentIndex];
      if (currentMoment) {
        engineInstance.seek(currentMoment.timestamp);
        set({ timelineProgress: currentMoment.timestamp });
        get().applyCameraPreset(currentMoment.camera_view);
      }

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
          }

          // Check if play finished (near 1.0)
          if (progress >= 0.98 && get().playbackState === 'playing') {
            set({ playbackState: 'paused' });
          }
        } else if (get().learningMode === 'free' && get().playbackState === 'playing') {
          // Check if play finished (near 1.0)
          if (progress >= 0.98) {
            set({ playbackState: 'paused' });
          } else {
            // Free Explore Mode: Auto-pause at the next moment threshold
            const nextMoment = currentBrk.key_moments[get().currentMomentIndex + 1];
            if (nextMoment && progress >= nextMoment.timestamp) {
              const nextIdx = get().currentMomentIndex + 1;
              set({ currentMomentIndex: nextIdx, playbackState: 'paused' });
              engineInstance.pause();
              engineInstance.seek(nextMoment.timestamp);
              get().applyCameraPreset(nextMoment.camera_view);
            }
          }
        }
      });
      console.log('[useBreakdownStore] Synced timeline and subscribed to engine ticks.');
    },

    setMoment: (index: number) => {
      const breakdown = get().currentBreakdown;
      if (!breakdown) return;

      const moment = breakdown.key_moments[index];
      if (!moment) return;

      set({ currentMomentIndex: index, timelineProgress: moment.timestamp, selectedWhatIfOption: null });

      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        engine.seek(moment.timestamp);
      }

      get().applyCameraPreset(moment.camera_view);
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

      // Removed learning mode analytics tracking to align with allowed event list
    },

    updateProgress: (progress: number) => {
      set({ timelineProgress: progress });
      const engine = (learningOrchestrator as any).engine;
      if (engine) {
        engine.seek(progress);
      }
    },

    stopBreakdown: (shouldReload = true) => {
      cleanupSubscription();
      set({
        currentExample: null,
        currentBreakdown: null,
        currentMomentIndex: 0,
        playbackState: 'stopped',
        timelineProgress: 0.0,
        selectedWhatIfOption: null,
      });
      // Restore standard concept settings
      useTacticalStore.getState().setVisualMode('concept');
      if (shouldReload) {
        const currentConcept = useTacticalStore.getState().currentConcept;
        if (currentConcept) {
          learningOrchestrator.loadConceptAnimation(currentConcept.concept_id);
        }
      }
    },

    applyCameraPreset: (_view: string) => {
      const engine = (learningOrchestrator as any).engine;
      if (!engine || !engine.camera || !engine.controls) return;

      const camera = engine.camera as THREE.PerspectiveCamera;
      const controls = engine.controls;

      // Always set target and coordinates to overhead view as requested by user
      controls.target.set(0, 0, 0);
      camera.position.set(0, 135, 0.1);
      camera.zoom = 1.0;

      camera.updateProjectionMatrix();
      controls.update();
    },
    setSelectedWhatIfOption: (option) => set({ selectedWhatIfOption: option }),
    setActiveAnalyst: async (analyst) => {
      set({ activeAnalyst: analyst });
      
      const langMap: Record<'nathan' | 'valeria' | 'claire' | 'lukas', string> = {
        nathan: 'en',
        valeria: 'es',
        claire: 'fr',
        lukas: 'de'
      };
      const targetLang = langMap[analyst] || 'en';
      if (useTacticalStore.getState().lang !== targetLang) {
        await useTacticalStore.getState().setLang(targetLang);
      }
    },

    translateBreakdown: async (targetLang: string) => {
      const { currentBreakdown, currentExample } = get();
      if (!currentBreakdown) return;

      try {
        set({ isLoading: true });
        const cleanBreakdown = await tacticalApi.getHistoricalBreakdown(currentBreakdown.example_id);
        
        const texts: string[] = [];
        texts.push(cleanBreakdown.title);
        texts.push(cleanBreakdown.description);
        
        cleanBreakdown.key_moments.forEach(m => {
          texts.push(m.title);
          texts.push(m.description);
          texts.push(m.granite_context);
          if (m.what_if_options) {
            m.what_if_options.forEach(opt => {
              texts.push(opt.label);
            });
          }
        });

        cleanBreakdown.commentary.forEach(c => {
          texts.push(c);
        });

        cleanBreakdown.learning_goals.forEach(g => {
          texts.push(g);
        });

        if (currentExample) {
          texts.push(currentExample.description);
          texts.push(currentExample.tactical_summary);
        }

        const { translatedTexts } = await tacticalApi.translateTexts(texts, targetLang);
        
        let idx = 0;
        const translatedBreakdown = { ...cleanBreakdown };
        translatedBreakdown.title = translatedTexts[idx++] || cleanBreakdown.title;
        translatedBreakdown.description = translatedTexts[idx++] || cleanBreakdown.description;
        
        translatedBreakdown.key_moments = cleanBreakdown.key_moments.map(m => {
          const newMoment = { ...m };
          newMoment.title = translatedTexts[idx++] || m.title;
          newMoment.description = translatedTexts[idx++] || m.description;
          newMoment.granite_context = translatedTexts[idx++] || m.granite_context;
          if (m.what_if_options) {
            newMoment.what_if_options = m.what_if_options.map(opt => {
              return {
                ...opt,
                label: translatedTexts[idx++] || opt.label
              };
            });
          }
          return newMoment;
        });

        translatedBreakdown.commentary = cleanBreakdown.commentary.map(() => {
          return translatedTexts[idx++] || '';
        });

        translatedBreakdown.learning_goals = cleanBreakdown.learning_goals.map(() => {
          return translatedTexts[idx++] || '';
        });

        let translatedExample = currentExample;
        if (currentExample) {
          translatedExample = {
            ...currentExample,
            description: translatedTexts[idx++] || currentExample.description,
            tactical_summary: translatedTexts[idx++] || currentExample.tactical_summary
          };
        }

        set({
          currentBreakdown: translatedBreakdown,
          currentExample: translatedExample,
          isLoading: false
        });
      } catch (err) {
        console.error('Failed to translate breakdown:', err);
        set({ isLoading: false });
      }
    },
  };
});
