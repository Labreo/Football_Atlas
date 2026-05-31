import { TacticalAnimationEngine } from './engine';

export interface TacticalModule {
  init(engine: TacticalAnimationEngine): void;
  play(): void;
  pause(): void;
  reset(): void;
  destroy(): void;
  getMetadata(): {
    id: string;
    name: string;
    description: string;
    duration: number; // duration in seconds
  };
}
