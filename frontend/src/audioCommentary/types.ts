export interface NarrationSegment {
  id: string;
  startTime: number; // normalized 0.0 - 1.0
  endTime: number;   // normalized 0.0 - 1.0
  text: string;
  associatedOverlays?: string[];
  cameraEvent?: {
    preset: string;
    description?: string;
  };
  animationEvent?: {
    type: 'seek' | 'focus' | 'cue';
    payload?: Record<string, any>;
  };
}

export class NarrationTimeline {
  public readonly segments: NarrationSegment[];
  public readonly durationSeconds: number;

  constructor(segments: NarrationSegment[], durationSeconds: number) {
    this.segments = segments;
    this.durationSeconds = Math.max(1, durationSeconds);
  }

  public static fromSegments(segments: NarrationSegment[], durationSeconds: number): NarrationTimeline {
    const normalizedSegments = segments.map((segment, index) => ({
      ...segment,
      id: segment.id || `segment-${index}`,
      startTime: Math.max(0, Math.min(1, segment.startTime)),
      endTime: Math.max(0, Math.min(1, segment.endTime)),
      text: segment.text.trim(),
    }));

    return new NarrationTimeline(normalizedSegments, durationSeconds);
  }

  public getSegmentAt(timeFraction: number): NarrationSegment | null {
    const normalized = Math.max(0, Math.min(1, timeFraction));
    return this.segments.find((segment) => normalized >= segment.startTime && normalized < segment.endTime) || null;
  }

  public getUpcomingSegment(timeFraction: number): NarrationSegment | null {
    const normalized = Math.max(0, Math.min(1, timeFraction));
    return this.segments.find((segment) => segment.startTime > normalized) || null;
  }
}

export interface VoiceProviderOptions {
  rate?: number;
  volume?: number;
  lang?: string;
  voiceName?: string;
}

export interface VoiceProvider {
  isSupported(): boolean;
  speak(text: string, options?: VoiceProviderOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  setVolume(volume: number): void;
}
