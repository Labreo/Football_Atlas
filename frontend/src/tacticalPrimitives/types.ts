import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  TacticalPosition, 
  AnimationFrame 
} from '../tacticalEngine/types';

import { VisualMode } from '../visualLanguage/types';

export type TeamType = 'attack' | 'defense' | 'defend';

export interface PhaseInfo {
  index: number;
  startFraction: number;
  endFraction: number;
  name: string;
  description: string;
}

export interface AnnotationInfo {
  startFraction: number;
  endFraction: number;
  text: string;
}

export interface AnalyticsEventInfo {
  timeFraction: number;
  eventName: string;
  data: any;
}

export interface CameraPresetInfo {
  startFraction: number;
  endFraction: number;
  preset: string;
}

export interface PrimitiveCompileContext {
  players: Map<string, PlayerState>;
  arrows: ArrowState[];
  overlays: OverlayState[];
  ballKeyFrames: AnimationFrame[];
  ballStartPos: TacticalPosition;
  phases: PhaseInfo[];
  annotations: AnnotationInfo[];
  analyticsEvents: AnalyticsEventInfo[];
  cameraPresets: CameraPresetInfo[];
  activeBranch: 'A' | 'B';
  durationSeconds: number;
  visualMode?: VisualMode;
  
  // Helpers
  getPlayerPosition(playerId: string, time: number): TacticalPosition;
  addPlayerKeyframe(
    playerId: string, 
    time: number, 
    pos: TacticalPosition, 
    easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ): void;
}

export interface TacticalPrimitive {
  type: string;
  compile(context: PrimitiveCompileContext): void;
}

// Predefined formations supported by the library
export type FormationType = '4-3-3' | '4-4-2' | '3-4-3' | '3-5-2' | '5-3-2';
export type PitchSide = 'left' | 'right';
