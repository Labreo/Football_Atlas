export type TimelineEvent = 'tick' | 'stateChange' | 'loop';
export type TimelineCallback = (...args: any[]) => void;

export class Timeline {
  private currentTimeFraction: number = 0.0;
  private playSpeed: number = 1.0;
  private isPlayingState: boolean = false;
  private durationSeconds: number = 10.0; // Default animation loop duration

  private listeners: Map<TimelineEvent, Set<TimelineCallback>> = new Map();

  constructor(durationSeconds: number = 10.0) {
    this.durationSeconds = durationSeconds;
    this.listeners.set('tick', new Set());
    this.listeners.set('stateChange', new Set());
    this.listeners.set('loop', new Set());
  }

  public play(): void {
    if (this.isPlayingState) return;
    this.isPlayingState = true;
    this.emit('stateChange', true);
  }

  public pause(): void {
    if (!this.isPlayingState) return;
    this.isPlayingState = false;
    this.emit('stateChange', false);
  }

  public reset(): void {
    this.isPlayingState = false;
    this.currentTimeFraction = 0.0;
    this.emit('stateChange', false);
    this.emit('tick', 0.0);
  }

  public restart(): void {
    this.currentTimeFraction = 0.0;
    this.isPlayingState = true;
    this.emit('stateChange', true);
    this.emit('tick', 0.0);
  }

  public seek(fraction: number): void {
    this.currentTimeFraction = Math.max(0.0, Math.min(1.0, fraction));
    this.emit('tick', this.currentTimeFraction);
  }

  public setSpeed(speed: number): void {
    this.playSpeed = Math.max(0.1, Math.min(5.0, speed));
  }

  public setDuration(seconds: number): void {
    this.durationSeconds = Math.max(1.0, seconds);
  }

  public update(deltaTimeSeconds: number): void {
    if (!this.isPlayingState) return;

    // Advance time based on delta and speed, divided by duration to normalize
    const deltaFraction = (deltaTimeSeconds * this.playSpeed) / this.durationSeconds;
    this.currentTimeFraction += deltaFraction;

    if (this.currentTimeFraction >= 1.0) {
      this.currentTimeFraction = 0.0;
      this.emit('loop');
    }

    this.emit('tick', this.currentTimeFraction);
  }

  // Getters
  public getCurrentTime(): number {
    return this.currentTimeFraction;
  }

  public getSpeed(): number {
    return this.playSpeed;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getDuration(): number {
    return this.durationSeconds;
  }

  // Event System
  public subscribe(event: TimelineEvent, callback: TimelineCallback): () => void {
    const set = this.listeners.get(event);
    if (set) {
      set.add(callback);
    }
    return () => {
      const activeSet = this.listeners.get(event);
      if (activeSet) {
        activeSet.delete(callback);
      }
    };
  }

  private emit(event: TimelineEvent, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(...args));
    }
  }
}
