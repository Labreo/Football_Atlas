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
  getPhaseStarts?(): number[];
  onPhaseChange?: ((phaseIndex: number, phaseName: string) => void) | null;
  onAnnotationChange?: ((text: string) => void) | null;
  onAnalyticsEvent?: ((name: string, data: any) => void) | null;
  onCameraPresetChange?: ((presetName: string) => void) | null;
  getDebugMetrics?(fraction: number): Record<string, any>;
  setBranch?(branch: 'A' | 'B'): void;
}


