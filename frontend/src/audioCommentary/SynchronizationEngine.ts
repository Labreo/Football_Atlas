import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { NarrationSegment } from './types';

export class SynchronizationEngine {
  private engine: TacticalAnimationEngine | null = null;

  public setEngine(engine: TacticalAnimationEngine): void {
    this.engine = engine;
  }

  public syncToSegment(segment: NarrationSegment, playbackSpeed: number): void {
    if (!this.engine) return;

    this.engine.setSpeed(playbackSpeed);
    this.engine.seek(segment.startTime);
    this.engine.play();
  }

  public seek(timeFraction: number): void {
    if (!this.engine) return;
    this.engine.seek(timeFraction);
  }

  public pause(): void {
    if (!this.engine) return;
    this.engine.pause();
  }

  public resume(): void {
    if (!this.engine) return;
    this.engine.play();
  }
}
