import { tacticalApi } from '../apiClients/tacticalApi';
import { useTacticalStore } from '../stores/useTacticalStore';
import { learningStateStore } from './store';
import { conversationContextManager } from './context';
import { animationModuleRegistry } from './registry';
import { ConceptRouter } from './router';
import { analyticsTracker } from './analytics';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';

export class LearningOrchestrator {
  private engine: TacticalAnimationEngine | null = null;
  private activeModuleInstance: any = null;

  /**
   * Initializes the orchestrator with the pitch's 3D animation engine.
   */
  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;
    learningStateStore.getState().setTelemetry({ sessionState: 'ready' });
  }

  /**
   * Returns the currently active animation module instance.
   */
  public getActiveModule(): any {
    return this.activeModuleInstance;
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

    analyticsTracker.track('question_submitted', { question });
    const startTime = performance.now();

    try {
      const currentActiveConcept = conversationContextManager.getActiveConcept();

      // Check and track if this is a follow-up query
      const isFollowUp = conversationContextManager.isFollowUp(question);
      if (isFollowUp) {
        analyticsTracker.track('follow_up_question', { question, activeConcept: currentActiveConcept });
      }

      // 1. Call Granite AI Tutoring API
      const response = await tacticalApi.askTutor(question, globalStore.conversation);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      analyticsTracker.track('granite_response_received', { 
        concept_id: response.concept_id, 
        confidence: response.confidence_score || 0.90,
        latencyMs: latency
      });

      store.setTelemetry({ graniteLatencyMs: latency });

      // 2. Append turn in chat console
      useTacticalStore.setState((state) => ({
        conversation: [
          ...state.conversation,
          { role: 'user', content: question },
          { role: 'assistant', content: response.explanation }
        ],
        detectedLevel: response.detected_level,
        followUpSuggestions: response.follow_up_suggestions && response.follow_up_suggestions.length > 0
          ? response.follow_up_suggestions
          : state.followUpSuggestions
      }));

      // 3. Evaluate Confidence and Concept Routing
      const confidence = response.confidence_score || 0.90;
      const conceptId = response.concept_id;

      store.setTelemetry({ confidenceScore: confidence, activeConceptId: conceptId || 'none' });

      if (conceptId) {
        conversationContextManager.addTurn(question, response.explanation, conceptId);
        analyticsTracker.track('concept_identified', { conceptId, confidence });

        if (confidence >= store.config.autoPlayThreshold) {
          // Auto-play animation
          if (this.engine) {
            await this.loadConceptAnimation(conceptId);
          } else {
            // Engine not initialized yet. Update store to trigger mounting the InteractivePitchPlayer
            const concept = await tacticalApi.getConceptById(conceptId);
            const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
            useTacticalStore.setState({ 
              currentConcept: concept, 
              playState: resolvedModule ? 'playing' : 'stopped' 
            });
            store.setCurrentConcept(concept);
            store.setCurrentAnimation(resolvedModule);
            store.setAnimationStatus(resolvedModule ? 'playing' : 'stopped');
            
            analyticsTracker.track('animation_triggered_mount', { conceptId });
          }
        } else if (confidence >= store.config.clarificationThreshold) {
          // Ask for clarification
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
          this.handleLowConfidence();
        }
      } else {
        // No concept resolved
        conversationContextManager.addTurn(question, response.explanation, null);
        this.handleUnknownConcept();
      }

    } catch (err: any) {
      analyticsTracker.track('orchestrator_error', { error: err.message });
      store.setError(err.message || 'An error occurred in the orchestrator.');
      
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
      
      // 2. Resolve module key
      const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
      
      if (!resolvedModule) {
        // Fallback: No animation module is registered for this concept ID.
        // We still load the concept metadata and explanation in the UI, but do not load a 3D module.
        analyticsTracker.track('animation_fallback_no_module', { conceptId });
        
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
        return;
      }
      
      // 3. Load via registry
      analyticsTracker.track('animation_loaded', { conceptId, module: resolvedModule });
      const instance = animationModuleRegistry.loadModule(resolvedModule, this.engine);
      this.activeModuleInstance = instance;

      // 4. Set listeners
      instance.onPhaseChange = (index: number, name: string) => {
        analyticsTracker.track('phase_changed', { conceptId, phaseIndex: index, phaseName: name });
      };
      instance.onAnalyticsEvent = (name: string, data: any) => {
        analyticsTracker.track(name, data);
      };

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

      analyticsTracker.track('animation_started', { conceptId, latencyMs: latency });

    } catch (err: any) {
      analyticsTracker.track('animation_failure', { conceptId, error: err.message });
      store.setError(`Failed to load tactical animation: ${err.message}`);
      store.setTelemetry({ sessionState: 'error' });
    }
  }

  private handleLowConfidence(): void {
    const store = learningStateStore.getState();
    store.setTelemetry({ sessionState: 'fallback' });
    analyticsTracker.track('low_confidence_fallback');
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
    analyticsTracker.track('unknown_concept_fallback');
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
    }
  }

  public pause(): void {
    if (this.engine) {
      this.engine.pause();
      learningStateStore.getState().setAnimationStatus('paused');
    }
  }

  public reset(): void {
    if (this.engine) {
      this.engine.reset();
      this.activeModuleInstance?.reset();
      learningStateStore.getState().setAnimationStatus('stopped');
    }
  }

  public destroy(): void {
    if (this.activeModuleInstance) {
      animationModuleRegistry.clear();
      this.activeModuleInstance = null;
    }
    this.engine = null;
    conversationContextManager.clear();
    learningStateStore.getState().reset();
  }
}

export const learningOrchestrator = new LearningOrchestrator();
export default learningOrchestrator;
