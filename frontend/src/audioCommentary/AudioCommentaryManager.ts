import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { BrowserSpeechSynthesisProvider, NoopVoiceProvider } from './VoiceProvider';
import { AudioPlaybackController } from './AudioPlaybackController';
import { NarrationTimeline, NarrationSegment } from './types';
import { SynchronizationEngine } from './SynchronizationEngine';
import { useAudioCommentaryStore } from './useAudioCommentaryStore';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { useBreakdownStore } from '../stores/useBreakdownStore';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';

export class AudioCommentaryManager {
  private static instance: AudioCommentaryManager;
  private engine: TacticalAnimationEngine | null = null;
  private controller: AudioPlaybackController;
  private syncEngine = new SynchronizationEngine();
  private voiceProvider = isBrowserSpeechSupported() ? new BrowserSpeechSynthesisProvider() : new NoopVoiceProvider();
  private telemetrySubscription: (() => void) | null = null;

  private constructor() {
    this.controller = new AudioPlaybackController({
      voiceProvider: this.voiceProvider,
      syncEngine: this.syncEngine,
      onStateChange: this.handleControllerStateChange,
      onCompleted: this.handlePlaybackCompleted,
      onError: this.handlePlaybackError,
    });
  }

  public static getInstance(): AudioCommentaryManager {
    if (!AudioCommentaryManager.instance) {
      AudioCommentaryManager.instance = new AudioCommentaryManager();
    }
    return AudioCommentaryManager.instance;
  }

  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;
    this.syncEngine.setEngine(engine);
    this.bindTelemetry();
  }

  public destroy(): void {
    this.controller.stop();
    this.unbindTelemetry();
    this.engine = null;
  }

  public prepareConceptNarration(): void {
    const timeline = this.buildConceptTimeline();
    useAudioCommentaryStore.getState().setTimeline(timeline);
    if (useAudioCommentaryStore.getState().enabled) {
      this.controller.setTimeline(timeline);
      this.controller.setPlaybackSpeed(useAudioCommentaryStore.getState().playbackSpeed);
      this.controller.setVolume(useAudioCommentaryStore.getState().volume);
      this.controller.setMute(useAudioCommentaryStore.getState().isMuted);
      void this.controller.play();
      analyticsTracker.track('audio_started', { mode: 'concept' });
    } else {
      this.controller.setTimeline(timeline);
    }
  }

  public prepareHistoricalNarration(): void {
    const timeline = this.buildHistoricalTimeline();
    useAudioCommentaryStore.getState().setTimeline(timeline);
    if (useAudioCommentaryStore.getState().enabled) {
      this.controller.setTimeline(timeline);
      this.controller.setPlaybackSpeed(useAudioCommentaryStore.getState().playbackSpeed);
      this.controller.setVolume(useAudioCommentaryStore.getState().volume);
      this.controller.setMute(useAudioCommentaryStore.getState().isMuted);
      void this.controller.play();
      analyticsTracker.track('audio_started', { mode: 'historical' });
    } else {
      this.controller.setTimeline(timeline);
    }
  }

  public play(): void {
    if (!useAudioCommentaryStore.getState().enabled) return;
    const timeline = useAudioCommentaryStore.getState().timeline;
    if (!timeline) return;
    void this.controller.play();
    analyticsTracker.track('audio_resumed', { playback_speed: useAudioCommentaryStore.getState().playbackSpeed });
  }

  public pause(): void {
    this.controller.pause();
    analyticsTracker.track('audio_paused', { playback_speed: useAudioCommentaryStore.getState().playbackSpeed });
  }

  public stop(): void {
    this.controller.stop();
    analyticsTracker.track('audio_completed', { reason: 'manual_stop' });
  }

  public seek(timeFraction: number): void {
    void this.controller.seek(timeFraction);
  }

  public restart(): void {
    this.controller.stop();
    this.controller.restart();
    analyticsTracker.track('audio_started', { mode: 'restart' });
  }

  public setPlaybackSpeed(playbackSpeed: number): void {
    this.controller.setPlaybackSpeed(playbackSpeed);
    if (this.engine) {
      this.engine.setSpeed(playbackSpeed);
    }
    analyticsTracker.track('playback_speed', { playback_speed: playbackSpeed });
  }

  public setMute(isMuted: boolean): void {
    this.controller.setMute(isMuted);
  }

  public setVolume(volume: number): void {
    this.controller.setVolume(volume);
  }

  private buildConceptTimeline(): NarrationTimeline {
    const learningUi = useLearningUIStore.getState();
    const concept = learningUi.current_concept;
    const explanation = learningUi.current_explanation || ''; 
    const activeModule = learningOrchestrator.getActiveModule();
    const durationSeconds = activeModule?.getMetadata()?.duration || 12;

    if (!activeModule) {
      const fallbackSegment = {
        id: 'concept-fallback',
        startTime: 0,
        endTime: 1,
        text: explanation || concept?.core_explanation || 'Audio commentary is not available for this concept yet.',
      } as NarrationSegment;
      return NarrationTimeline.fromSegments([fallbackSegment], durationSeconds);
    }

    const phases: any[] = activeModule.getPhases?.() || [];
    const segments: NarrationSegment[] = [];

    if (explanation.trim()) {
      segments.push({
        id: 'concept-intro',
        startTime: 0,
        endTime: phases.length > 0 ? Math.min(0.12, phases[0].start || 0.12) : 1,
        text: explanation,
        associatedOverlays: ['overview'],
        animationEvent: { type: 'cue', payload: { name: 'intro' } },
      });
    }

    phases.forEach((phase) => {
      const text = `${phase.name}: ${phase.description}`.trim();
      if (!text) return;
      segments.push({
        id: `phase-${phase.index}`,
        startTime: phase.start,
        endTime: phase.end,
        text,
        associatedOverlays: [phase.name],
        cameraEvent: { preset: phase.name, description: phase.description },
        animationEvent: { type: 'focus', payload: { phaseIndex: phase.index } },
      });
    });

    if (segments.length === 0) {
      segments.push({
        id: 'concept-summary',
        startTime: 0,
        endTime: 1,
        text: explanation || (concept?.core_explanation ?? 'A tactical explanation is being prepared.'),
      });
    }

    return NarrationTimeline.fromSegments(segments, durationSeconds);
  }

  private buildHistoricalTimeline(): NarrationTimeline {
    const breakdown = useBreakdownStore.getState().currentBreakdown;
    if (!breakdown) {
      return NarrationTimeline.fromSegments([{
        id: 'breakdown-fallback',
        startTime: 0,
        endTime: 1,
        text: 'Historical audio commentary will begin when the breakdown is ready.',
      }], 10);
    }

    const segments = breakdown.key_moments.map((moment, index) => ({
      id: `breakdown-moment-${moment.moment_id}`,
      startTime: moment.timestamp,
      endTime: index < breakdown.key_moments.length - 1
        ? breakdown.key_moments[index + 1].timestamp
        : 1,
      text: moment.granite_context || moment.description || moment.title,
      associatedOverlays: moment.annotations?.map((ann: any) => ann.type).filter(Boolean) || [],
      cameraEvent: { preset: moment.camera_view || 'overview', description: moment.description },
      animationEvent: { type: 'seek', payload: { timestamp: moment.timestamp } },
    })) as NarrationSegment[];

    return NarrationTimeline.fromSegments(segments, 12);
  }

  private handleControllerStateChange = (state: {
    isPlaying: boolean;
    currentSegment: NarrationSegment | null;
    upcomingSegment: NarrationSegment | null;
    currentTime: number;
  }): void => {
    useAudioCommentaryStore.setState({
      isPlaying: state.isPlaying,
      currentSegment: state.currentSegment,
      upcomingSegment: state.upcomingSegment,
      currentTime: state.currentTime,
      captionText: state.currentSegment?.text || useAudioCommentaryStore.getState().captionText,
    });
  };

  private handlePlaybackCompleted = (): void => {
    useAudioCommentaryStore.setState({ isPlaying: false });
    analyticsTracker.track('audio_completed', { mode: 'complete' });
  };

  private handlePlaybackError = (error: Error): void => {
    useAudioCommentaryStore.setState({ isPlaying: false, error: error.message });
    analyticsTracker.track('audio_disabled', { reason: error.message });
  };

  private bindTelemetry(): void {
    if (!this.engine || this.telemetrySubscription) return;
    this.telemetrySubscription = this.engine.subscribeTelemetry((telemetry) => {
      const timeline = useAudioCommentaryStore.getState().timeline;
      if (!timeline) return;
      const segment = timeline.getSegmentAt(telemetry.currentTime);
      useAudioCommentaryStore.setState({
        currentTime: telemetry.currentTime,
        currentSegment: segment,
        upcomingSegment: timeline.getUpcomingSegment(telemetry.currentTime),
      });
    });
  }

  private unbindTelemetry(): void {
    if (this.telemetrySubscription) {
      this.telemetrySubscription();
      this.telemetrySubscription = null;
    }
  }
}

const isBrowserSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
};

export const audioCommentaryManager = AudioCommentaryManager.getInstance();
