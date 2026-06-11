import { tacticalApi } from '../apiClients/tacticalApi';
import { useTacticalStore } from '../stores/useTacticalStore';
import { learningStateStore } from './store';
import { conversationContextManager } from './context';
import { animationModuleRegistry } from './registry';
import { ConceptRouter } from './router';
import { analyticsTracker } from './analytics';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { conceptLoader } from '../conceptRuntime/ConceptLoader';
import { runtimeValidator } from '../conceptRuntime/RuntimeValidator';
import { conceptGraph } from '../conceptRuntime/ConceptGraph';
import { allConceptPackages } from '../conceptPackages';
import { useBreakdownStore } from '../stores/useBreakdownStore';

export class LearningOrchestrator {
  private engine: TacticalAnimationEngine | null = null;
  private activeModuleInstance: any = null;
  private runtimeBooted: boolean = false;

  constructor() {
    this.bootRuntime();
  }

  /**
   * Initializes the orchestrator with the pitch's 3D animation engine.
   * Boots the concept runtime on first init.
   */
  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;

    // Boot the runtime framework (only once)
    if (!this.runtimeBooted) {
      this.bootRuntime();
    }

    learningStateStore.getState().setTelemetry({ sessionState: 'ready' });

    // Automatically synchronize any active historical breakdown timeline/presets
    useBreakdownStore.getState().syncWithEngine();
  }

  /**
   * Boots the concept runtime — validates and registers all concept packages.
   * This replaces all hardcoded module registration.
   */
  private bootRuntime(): void {
    if (this.runtimeBooted) return;
    const startTime = performance.now();

    try {
      // 1. Load and validate all concept packages
      const loadReport = conceptLoader.loadAll(allConceptPackages);

      // 2. Run full runtime health check
      const healthReport = runtimeValidator.validate();

      // 3. Build the concept graph from loaded manifests
      conceptGraph.invalidateCache();

      // 4. Track the boot event
      const bootTime = Math.round(performance.now() - startTime);
      this.runtimeBooted = true;

      console.log(
        `[LearningOrchestrator] 🚀 Runtime booted in ${bootTime}ms — ` +
        `${loadReport.loaded} concepts ready, ${healthReport.invalid_concepts} issues`
      );
    } catch (err: any) {
      console.error('[LearningOrchestrator] ❌ Runtime boot failed:', err);
    }
  }

  /**
   * Returns the currently active animation module instance.
   */
  public getActiveModule(): any {
    return this.activeModuleInstance;
  }

  /**
   * Returns the tactical animation engine.
   */
  public getEngine(): TacticalAnimationEngine | null {
    return this.engine;
  }


  /**
   * Processes a user question through the end-to-end learning loop.
   */
  public async askQuestion(question: string): Promise<void> {
    const store = learningStateStore.getState();
    const globalStore = useTacticalStore.getState();

    store.setIsLoading(true);
    store.setError(null);
    store.setCurrentQuestion(question);
    useTacticalStore.setState({ isLoading: true, error: null });

    useLearningUIStore.getState().setLoading(true);
    useLearningUIStore.getState().setError(null);
    useLearningUIStore.getState().setCurrentQuestion(question);
    useLearningUIStore.getState().addToFollowUpChain(question);

    analyticsTracker.trackQuestionAsked(question);
    const startTime = performance.now();

    try {
      // 1. Log query intent analytics before calling API
      const qLower = question.toLowerCase();
      if (qLower.includes('breakdown')) {
        analyticsTracker.track('breakdown_requested', { question });
      }
      if (qLower.includes('example') || qLower.includes('real match') || qLower.includes('actual match')) {
        analyticsTracker.track('historical_example_requested', { question });
      }
      if (/messi|robben|salah|firmino|fabregas|totti/i.test(qLower)) {
        analyticsTracker.track('player_example_requested', { question });
      }
      if (/guardiola|klopp|simeone|mourinho/i.test(qLower)) {
        analyticsTracker.track('coach_example_requested', { question });
      }
      if (qLower.includes('match') || qLower.includes('fixture') || qLower.includes('game')) {
        analyticsTracker.track('match_example_requested', { question });
      }
      if (qLower.includes('next') || qLower.includes('chain') || qLower.includes('then what')) {
        analyticsTracker.track('concept_chain_triggered', { question });
      }
      if (
        qLower.includes('where did') ||
        qLower.includes('what source') ||
        qLower.includes('supporting evidence') ||
        qLower.includes('what document') ||
        qLower.includes('source of this') ||
        qLower.includes('why do you say') ||
        qLower.includes('based on what') ||
        qLower.includes('where does this analysis come from') ||
        qLower.includes('what says') ||
        qLower.includes('show source') ||
        qLower.includes('show me a source') ||
        qLower.includes('show a source')
      ) {
        analyticsTracker.trackSourceFollowupAsked(question);
      }

      // 2. Call Granite AI Tutoring API
      const response = await tacticalApi.askTutor(question, globalStore.conversation);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      useLearningUIStore.getState().setLoading(false);
      useLearningUIStore.getState().setCurrentExplanation(response.explanation);

      store.setTelemetry({ graniteLatencyMs: latency });

      // 3. Append turn in chat console with actions payload and process thread
      useTacticalStore.setState((state) => {
        if (state.detectedLevel !== response.detected_level) {
          analyticsTracker.track('level_changed', { 
            from_level: state.detectedLevel, 
            to_level: response.detected_level 
          });
        }
        
        analyticsTracker.track('knowledge_level_detected', {
          detected_level: response.detected_level,
          confidence_score: response.confidence_score,
          question: question
        });

        analyticsTracker.track('confidence_updated', {
          detected_level: response.detected_level,
          confidence_score: response.confidence_score
        });

        analyticsTracker.track('adaptation_applied', {
          level: response.detected_level,
          concept_id: response.concept_id
        });

        // Track Follow-Up Intelligence analytics events
        if (response.followup_detected) {
          analyticsTracker.track('followup_detected', { question });
        }
        if (response.reference_resolved) {
          analyticsTracker.track('reference_resolved', { question, resolved_references: response.resolved_references });
        }
        if (response.clarification_requested) {
          analyticsTracker.track('clarification_requested', { question });
        }
        if (response.context_recovered) {
          analyticsTracker.track('context_recovered', { question });
        }
        if (response.concept_transition) {
          analyticsTracker.track('concept_transition', { question });
        }
        if (response.breakdown_followup) {
          analyticsTracker.track('breakdown_followup', { question });
        }

        const newThread = response.conversation_thread && response.conversation_thread.length > 0
          ? response.conversation_thread
          : state.tacticalThread;

        return {
          conversation: [
            ...state.conversation,
            { role: 'user', content: question },
            { role: 'assistant', content: response.explanation, actions: response.actions }
          ],
          detectedLevel: response.detected_level,
          tacticalThread: newThread,
          followUpSuggestions: response.follow_up_suggestions && response.follow_up_suggestions.length > 0
            ? response.follow_up_suggestions
            : state.followUpSuggestions
        };
      });

      // 4. Evaluate Confidence and Concept Routing
      const confidence = response.confidence_score || 0.90;
      const conceptId = response.concept_id;

      store.setTelemetry({ confidenceScore: confidence, activeConceptId: conceptId || 'none' });

      // 5. Automatic Action Routing under High Confidence (>= 0.85)
      if (confidence >= 0.85 && response.actions && response.actions.length > 0) {
        const autoLaunchable = response.actions.find(act => act.type === 'LAUNCH_HISTORICAL_BREAKDOWN');
        if (autoLaunchable && autoLaunchable.payload.example_id) {
          analyticsTracker.track('breakdown_launched', { example_id: autoLaunchable.payload.example_id });
          setTimeout(async () => {
            try {
              const examples = await tacticalApi.getHistoricalExamplesByConcept(autoLaunchable.payload.concept_id || '');
              const targetEx = examples.find(e => e.example_id === autoLaunchable.payload.example_id);
              if (targetEx) {
                console.log('[AutoLaunch] Launching historical breakdown simulation:', targetEx.example_id);
                useBreakdownStore.getState().startBreakdown(targetEx);
              }
            } catch (autoErr) {
              console.error('[AutoLaunch Error] Failed to start breakdown:', autoErr);
            }
          }, 400);
        }
      }

      if (conceptId) {
        conversationContextManager.addTurn(question, response.explanation, conceptId);
        this.updateTacticalThread(conceptId, question);

        // Core Analytics Event tracking
        const currentActiveConcept = useTacticalStore.getState().currentConcept;
        const fromConceptId = currentActiveConcept?.concept_id || null;

        if (fromConceptId && fromConceptId !== conceptId) {
          // Concept transition
          analyticsTracker.trackConceptTransition(fromConceptId, conceptId);
        } else if (!fromConceptId) {
          // Concept chain started
          analyticsTracker.trackConceptChainStarted(conceptId);
        } else if (fromConceptId === conceptId) {
          // Context recovered from implicit pronoun check
          const isImplicit = /\b(that|this|it|they|them|these|next|then)\b/i.test(question) || 
                             /how would|what happens|why does|what problems/i.test(question);
          if (isImplicit) {
            analyticsTracker.trackContextRecovered(conceptId);
          }
        }

        const depth = useTacticalStore.getState().conversation.length / 2;
        if (depth >= 10) {
          analyticsTracker.trackConversationCompleted();
        }

        if (confidence >= store.config.autoPlayThreshold) {
          // Check if the same concept is already active — if so, this is a follow-up
          // and we should NOT reset the running animation.
          const isSameConcept = fromConceptId === conceptId;

          if (isSameConcept && this.activeModuleInstance) {
            // Follow-up on the same concept: update explanation only, keep animation running
            const concept = await tacticalApi.getConceptById(conceptId);
            useLearningUIStore.getState().setCurrentConcept(concept);
            useLearningUIStore.getState().setCurrentExplanation(response.explanation);
            useLearningUIStore.getState().setLoading(false);
            store.setCurrentConcept(concept);

            // Update branch selection if they asked about defender choices
            if (this.activeModuleInstance.setBranch) {
              const q = question.toLowerCase();
              if (q.includes('defend') || q.includes('respond') || q.includes('counter') || q.includes('reaction')) {
                const branch = (q.includes('hold') || q.includes('free')) ? 'B' : 'A';
                this.activeModuleInstance.setBranch(branch);
              }
            }
          } else if (this.engine) {
            // Different concept — load the new animation
            await this.loadConceptAnimation(conceptId);
          } else {
            // Engine not initialized yet. Update store to trigger mounting the InteractivePitchPlayer
            const concept = await tacticalApi.getConceptById(conceptId);
            const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
            
            useLearningUIStore.getState().setCurrentConcept(concept);
            useLearningUIStore.getState().setAnimationState(resolvedModule ? 'playing' : 'stopped');
            useLearningUIStore.getState().setLoading(false);
            analyticsTracker.trackConceptOpened(conceptId);

            useTacticalStore.setState({ 
              currentConcept: concept, 
              playState: resolvedModule ? 'playing' : 'stopped' 
            });
            store.setCurrentConcept(concept);
            store.setCurrentAnimation(resolvedModule);
            store.setAnimationStatus(resolvedModule ? 'playing' : 'stopped');
          }
        } else if (confidence >= store.config.clarificationThreshold) {
          // Ask for clarification
          analyticsTracker.trackClarificationRequested(question);
          store.setTelemetry({ sessionState: 'awaiting_clarification' });
          useTacticalStore.setState((state) => ({
            conversation: [
              ...state.conversation,
              { 
                role: 'assistant', 
                content: `I identified that you might be asking about "${conceptId.replace(/_/g, ' ')}" (Confidence: ${Math.round(confidence * 100)}%). Would you like me to load the tactical 3D lesson for this?` 
              }
            ]
          }));
        } else {
          // Fallback state below 0.50
          analyticsTracker.trackClarificationRequested(question);
          if (!response.explanation) {
            this.handleLowConfidence();
          }
        }
      } else {
        // No concept resolved
        conversationContextManager.addTurn(question, response.explanation, null);
        analyticsTracker.trackClarificationRequested(question);
        if (!response.explanation) {
          this.handleUnknownConcept();
        }
      }

    } catch (err: any) {
      store.setError(err.message || 'An error occurred in the orchestrator.');
      useLearningUIStore.getState().setError(err.message || 'An error occurred.');
      useLearningUIStore.getState().setLoading(false);
      
      // Append assistant error message in chat instead of overriding the global playbook error
      useTacticalStore.setState((state) => ({
        conversation: [
          ...state.conversation,
          { 
            role: 'assistant', 
            content: `Error: ${err.message || 'I had trouble processing that question. Please make sure the backend server is running.'}` 
          }
        ]
      }));
      store.setIsLoading(false);
    } finally {
      store.setIsLoading(false);
      useTacticalStore.setState({ isLoading: false });
      useLearningUIStore.getState().setLoading(false);
    }
  }

  /**
   * Resolves, instantiates, and loads the animation module.
   */
  public async loadConceptAnimation(conceptId: string): Promise<void> {
    const store = learningStateStore.getState();
    if (!this.engine) {
      throw new Error('[Orchestrator Error] Animation engine has not been initialized.');
    }

    const loadStart = performance.now();
    store.setTelemetry({ sessionState: 'loading_animation' });

    try {
      // 1. Fetch details from API
      const concept = await tacticalApi.getConceptById(conceptId);
      
      useLearningUIStore.getState().setCurrentConcept(concept);
      useLearningUIStore.getState().setLoading(false);
      analyticsTracker.trackConceptOpened(conceptId);

      // 2. Resolve module key
      const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
      
      if (!resolvedModule) {
        // Fallback: No animation module is registered for this concept ID.
        // We still load the concept metadata and explanation in the UI, but do not load a 3D module.
        
        const loadEnd = performance.now();
        store.setTelemetry({ 
          animationLatencyMs: Math.round(loadEnd - loadStart),
          loadedModuleId: 'none',
          sessionState: 'loaded_text_only'
        });

        // Update state stores safely to avoid React/API fetch infinite loops
        const currentGlobalConcept = useTacticalStore.getState().currentConcept;
        if (currentGlobalConcept?.concept_id !== conceptId) {
          useTacticalStore.setState({ 
            currentConcept: concept, 
            playState: 'stopped'
          });
        }

        store.setCurrentConcept(concept);
        store.setCurrentAnimation(null);
        store.setAnimationStatus('stopped');
        useLearningUIStore.getState().setAnimationState('stopped');
        return;
      }
      
      // 3. Load via registry
      const instance = animationModuleRegistry.loadModule(resolvedModule, this.engine);
      this.activeModuleInstance = instance;

      // Set initial branch if applicable based on the question text
      if (instance.setBranch) {
        const q = store.currentQuestion?.toLowerCase() || '';
        if (q.includes('defend') || q.includes('respond') || q.includes('counter') || q.includes('reaction')) {
          const branch = (q.includes('hold') || q.includes('free')) ? 'B' : 'A';
          instance.setBranch(branch);
        }
      }

      // 4. Set listeners
      instance.onPhaseChange = (index: number, name: string) => {
        useLearningUIStore.getState().setPhaseInfo(index, name);
      };
      instance.onAnnotationChange = (annotation: string) => {
        useLearningUIStore.getState().setPhaseAnnotation(annotation);
      };
      instance.onAnalyticsEvent = (_name: string, _data: any) => {
        // Sub-module events not tracked under the current strict telemetry criteria
      };

      // Reset the instance to trigger the initial phase and annotation listeners immediately
      instance.reset();

      const loadEnd = performance.now();
      const latency = Math.round(loadEnd - loadStart);
      store.setTelemetry({ 
        animationLatencyMs: latency,
        loadedModuleId: resolvedModule,
        sessionState: 'loaded'
      });

      // 5. Update state stores safely to avoid React/API fetch infinite loops
      const currentGlobalConcept = useTacticalStore.getState().currentConcept;
      if (currentGlobalConcept?.concept_id !== conceptId) {
        useTacticalStore.setState({ 
          currentConcept: concept, 
          playState: 'playing' 
        });
      } else if (useTacticalStore.getState().playState !== 'playing') {
        useTacticalStore.setState({ 
          playState: 'playing' 
        });
      }

      store.setCurrentConcept(concept);
      store.setCurrentAnimation(resolvedModule);
      store.setAnimationStatus('playing');
      useLearningUIStore.getState().setAnimationState('playing');

    } catch (err: any) {
      store.setError(`Failed to load tactical animation: ${err.message}`);
      store.setTelemetry({ sessionState: 'error' });
      useLearningUIStore.getState().setError(`Failed to load animation: ${err.message}`);
    }
  }

  private handleLowConfidence(): void {
    const store = learningStateStore.getState();
    store.setTelemetry({ sessionState: 'fallback' });
    useTacticalStore.setState((state) => ({
      conversation: [
        ...state.conversation,
        { 
          role: 'assistant', 
          content: "I couldn't confidently identify the tactical concept you're asking about. Would you like to clarify your question?" 
        }
      ]
    }));
  }

  private handleUnknownConcept(): void {
    const store = learningStateStore.getState();
    store.setTelemetry({ sessionState: 'fallback' });
    useTacticalStore.setState((state) => ({
      conversation: [
        ...state.conversation,
        { 
          role: 'assistant', 
          content: "I couldn't map that to any of our tactical animation lessons. Let me know if you would like to explore the False 9, High Press, or Defensive Block!" 
        }
      ]
    }));
  }

  public play(): void {
    if (this.engine) {
      this.engine.play();
      learningStateStore.getState().setAnimationStatus('playing');
      useLearningUIStore.getState().setAnimationState('playing');
    }
  }

  public pause(): void {
    if (this.engine) {
      this.engine.pause();
      learningStateStore.getState().setAnimationStatus('paused');
      useLearningUIStore.getState().setAnimationState('paused');
    }
  }

  public reset(): void {
    if (this.engine) {
      this.engine.reset();
      this.activeModuleInstance?.reset();
      learningStateStore.getState().setAnimationStatus('stopped');
      useLearningUIStore.getState().setAnimationState('stopped');
    }
  }

  public seek(fraction: number): void {
    if (this.engine) {
      this.engine.seek(fraction);
    }
  }

  public getPhases(): Array<{ index: number; start: number; end: number; name: string; description: string }> {
    return this.activeModuleInstance?.getPhases() || [];
  }

  /**
   * Helper to build/append to the tactical thread
   */
  private updateTacticalThread(conceptId: string, question: string): void {
    const globalStore = useTacticalStore.getState();
    const currentThread = [...globalStore.tacticalThread];
    const q = question.toLowerCase();

    // Mapping of concepts to user-friendly names
    const conceptNames: Record<string, string> = {
      false_9: 'False 9',
      midfield_overload: 'Midfield Overload',
      third_man_run: 'Third Man Run',
      high_press: 'High Press',
      pressing_trap: 'Pressing Trap',
      compactness_pressing_lines: 'Compactness',
      defensive_block: 'Defensive Block',
      counter_attack_trigger: 'Counter Attack Trigger',
      back_three_wing_back: 'Back Three Recovery',
      inverted_winger: 'Inverted Winger'
    };

    const friendlyName = conceptNames[conceptId] || conceptId.replace(/_/g, ' ');

    if (currentThread.length === 0) {
      currentThread.push(friendlyName);
    } else {
      const lastItem = currentThread[currentThread.length - 1];

      // Check if we are doing a defensive response follow-up on False 9
      if (conceptId === 'false_9' && /\b(defend|defender|defensive|respond|response|reaction|counter|follow|hold|choice|choose)\b/i.test(q)) {
        if (!currentThread.includes('Defensive Response')) {
          const f9Idx = currentThread.indexOf('False 9');
          if (f9Idx !== -1) {
            currentThread.splice(f9Idx + 1, 0, 'Defensive Response');
          } else {
            currentThread.push('Defensive Response');
          }
        }
      } else {
        if (lastItem !== friendlyName && !currentThread.includes(friendlyName)) {
          currentThread.push(friendlyName);
        }
      }
    }

    useTacticalStore.setState({ tacticalThread: currentThread });
  }

  public destroy(): void {
    // Only tear down the active module instance — do NOT clear the registry.
    // The registry holds static module class registrations that must survive
    // component unmount/remount cycles. Clearing it would cause all concept
    // animations to silently fall back to LegacyPitchPlayer after any remount.
    if (this.activeModuleInstance) {
      try { this.activeModuleInstance.destroy(); } catch (_) {}
      this.activeModuleInstance = null;
    }
    this.engine = null;
    // Reset the booted flag so modules are re-registered on the next init,
    // in case the registry was cleared for any other reason.
    this.runtimeBooted = false;
    conversationContextManager.clear();
    learningStateStore.getState().reset();
    useLearningUIStore.getState().resetUIStore();
    useTacticalStore.setState({ tacticalThread: [] });
  }
}

export const learningOrchestrator = new LearningOrchestrator();
export default learningOrchestrator;
