import { VoiceProvider } from './types';
import { NarrationTimeline, NarrationSegment } from './types';
import { SynchronizationEngine } from './SynchronizationEngine';
import { useTacticalStore } from '../stores/useTacticalStore';
import { useBreakdownStore } from '../stores/useBreakdownStore';

export interface AudioPlaybackControllerDependencies {
  voiceProvider: VoiceProvider;
  syncEngine: SynchronizationEngine;
  onStateChange: (state: {
    isPlaying: boolean;
    currentSegment: NarrationSegment | null;
    upcomingSegment: NarrationSegment | null;
    currentTime: number;
  }) => void;
  onCompleted: () => void;
  onError: (error: Error) => void;
}

export class AudioPlaybackController {
  private voiceProvider: VoiceProvider;
  private syncEngine: SynchronizationEngine;
  private onStateChange: AudioPlaybackControllerDependencies['onStateChange'];
  private onCompleted: AudioPlaybackControllerDependencies['onCompleted'];
  private onError: AudioPlaybackControllerDependencies['onError'];
  private timeline: NarrationTimeline | null = null;
  private currentSegmentIndex: number = 0;
  private isPlayingInternal: boolean = false;
  private playbackSpeed: number = 1.0;
  private volume: number = 0.9;
  private isMuted: boolean = false;
  private segmentAbortRequested: boolean = false;

  constructor(deps: AudioPlaybackControllerDependencies) {
    this.voiceProvider = deps.voiceProvider;
    this.syncEngine = deps.syncEngine;
    this.onStateChange = deps.onStateChange;
    this.onCompleted = deps.onCompleted;
    this.onError = deps.onError;
  }

  public setTimeline(timeline: NarrationTimeline | null): void {
    this.timeline = timeline;
    this.currentSegmentIndex = 0;
    this.segmentAbortRequested = false;
    this.isPlayingInternal = false;
    const nextSegment = timeline?.segments[0] || null;
    this.onStateChange({ isPlaying: false, currentSegment: null, upcomingSegment: nextSegment, currentTime: 0 });
  }

  public async play(): Promise<void> {
    if (!this.timeline || this.timeline.segments.length === 0) return;
    if (this.isPlayingInternal) return;
    this.isPlayingInternal = true;
    this.segmentAbortRequested = false;

    await this.playSegment(this.currentSegmentIndex);
  }

  public pause(): void {
    this.isPlayingInternal = false;
    this.voiceProvider.pause();
    this.syncEngine.pause();
    this.onStateChange({ isPlaying: false, currentSegment: this.getCurrentSegment(), upcomingSegment: this.getUpcomingSegment(), currentTime: this.getCurrentTime() });
  }

  public resume(): void {
    if (!this.timeline || !this.getCurrentSegment()) return;
    if (this.isPlayingInternal) return;
    this.isPlayingInternal = true;
    this.voiceProvider.resume();
    this.syncEngine.resume();
    this.onStateChange({ isPlaying: true, currentSegment: this.getCurrentSegment(), upcomingSegment: this.getUpcomingSegment(), currentTime: this.getCurrentTime() });
  }

  public stop(): void {
    this.segmentAbortRequested = true;
    this.isPlayingInternal = false;
    this.voiceProvider.stop();
    this.syncEngine.pause();
    this.currentSegmentIndex = 0;
    this.onStateChange({ isPlaying: false, currentSegment: null, upcomingSegment: this.timeline?.segments[0] || null, currentTime: 0 });
  }

  public async seek(timeFraction: number): Promise<void> {
    if (!this.timeline) return;
    const nextIndex = this.timeline.segments.findIndex((segment) => timeFraction >= segment.startTime && timeFraction < segment.endTime);
    this.currentSegmentIndex = nextIndex >= 0 ? nextIndex : this.timeline.segments.length;
    this.syncEngine.seek(timeFraction);
    this.onStateChange({ isPlaying: this.isPlayingInternal, currentSegment: this.getCurrentSegment(), upcomingSegment: this.getUpcomingSegment(), currentTime: timeFraction });

    if (this.isPlayingInternal && this.currentSegmentIndex < (this.timeline?.segments.length || 0)) {
      this.segmentAbortRequested = false;
      await this.playSegment(this.currentSegmentIndex);
    }
  }

  public restart(): void {
    if (!this.timeline) return;
    this.stop();
    this.currentSegmentIndex = 0;
    if (this.isPlayingInternal) {
      this.play();
    }
  }

  public setPlaybackSpeed(playbackSpeed: number): void {
    this.playbackSpeed = playbackSpeed;
    this.voiceProvider.setRate(playbackSpeed);
  }

  public setMute(isMuted: boolean): void {
    this.isMuted = isMuted;
    this.voiceProvider.setVolume(isMuted ? 0 : this.volume);
  }

  public setVolume(volume: number): void {
    this.volume = volume;
    if (!this.isMuted) {
      this.voiceProvider.setVolume(volume);
    }
  }

  public getCurrentSegment(): NarrationSegment | null {
    if (!this.timeline) return null;
    return this.timeline.segments[this.currentSegmentIndex] || null;
  }

  public getUpcomingSegment(): NarrationSegment | null {
    if (!this.timeline) return null;
    return this.timeline.segments[this.currentSegmentIndex + 1] || null;
  }

  public getCurrentTime(): number {
    if (!this.timeline) return 0;
    const segment = this.getCurrentSegment();
    return segment ? segment.startTime : 0;
  }

  private async playSegment(index: number): Promise<void> {
    if (!this.timeline) return;
    if (index >= this.timeline.segments.length) {
      this.complete();
      return;
    }

    const segment = this.timeline.segments[index];
    this.currentSegmentIndex = index;
    this.onStateChange({
      isPlaying: true,
      currentSegment: segment,
      upcomingSegment: this.getUpcomingSegment(),
      currentTime: segment.startTime,
    });

    try {
      let langCode = 'en-US';
      const breakdown = useBreakdownStore.getState().currentBreakdown;
      if (breakdown) {
        const analyst = useBreakdownStore.getState().activeAnalyst;
        const analystLangs: Record<string, string> = {
          nathan: 'en-US',
          valeria: 'es-ES',
          claire: 'fr-FR',
          lukas: 'de-DE'
        };
        langCode = analystLangs[analyst] || 'en-US';
      } else {
        const globalLang = useTacticalStore.getState().lang || 'en';
        const langCodes: Record<string, string> = {
          en: 'en-US',
          es: 'es-ES',
          fr: 'fr-FR',
          de: 'de-DE',
        };
        langCode = langCodes[globalLang] || 'en-US';
      }

      this.syncEngine.syncToSegment(segment, this.playbackSpeed);
      await this.voiceProvider.speak(segment.text, {
        rate: this.playbackSpeed,
        volume: this.isMuted ? 0 : this.volume,
        lang: langCode,
      });
      if (this.segmentAbortRequested) {
        return;
      }
      this.currentSegmentIndex += 1;
      if (this.currentSegmentIndex < this.timeline.segments.length) {
        await this.playSegment(this.currentSegmentIndex);
      } else {
        this.complete();
      }
    } catch (error: any) {
      this.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private complete(): void {
    this.isPlayingInternal = false;
    this.onStateChange({
      isPlaying: false,
      currentSegment: null,
      upcomingSegment: null,
      currentTime: this.timeline?.durationSeconds ? 1 : 0,
    });
    this.onCompleted();
  }
}
