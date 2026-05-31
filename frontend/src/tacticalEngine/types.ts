export interface TacticalPosition {
  x: number;
  z: number;
}

export interface AnimationFrame {
  time: number; // Normalized time (0.0 to 1.0)
  x: number;
  z: number;
  easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut';
}

export interface PlayerState {
  id: string;
  team: 'attack' | 'defense' | 'defend';
  role: string;
  number: number;
  startPos: TacticalPosition;
  currentPos: TacticalPosition;
  keyFrames: AnimationFrame[];
  visible: boolean;
}

export interface ArrowStyle {
  color: string;
  width: number;
  dashSpeed?: number;
  dashSize?: number;
  gapSize?: number;
  curved?: boolean;
}

export interface ArrowState {
  id: string;
  fromPos: TacticalPosition;
  toPos: TacticalPosition;
  points?: TacticalPosition[]; // For curved spline paths
  style: ArrowStyle;
  startFrame: number; // time fraction (0.0 to 1.0)
  endFrame: number;
  currentProgress: number; // current animated extension (0.0 to 1.0)
}

export enum OverlayType {
  POLYGON = 'POLYGON',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  HEAT_AREA = 'HEAT_AREA'
}

export interface OverlayState {
  id: string;
  type: OverlayType;
  points?: TacticalPosition[]; // For Polygon and Heat Areas
  bounds?: { width: number; length: number; rotation?: number }; // For Rectangle
  center?: TacticalPosition; // For Circle
  radius?: number; // For Circle
  startFrame: number; // time fraction (0.0 to 1.0)
  endFrame: number;
  color: string; // e.g. '#39FF14' (neon green), '#00F3FF' (cyan)
  opacity?: number;
}

export interface EngineTelemetry {
  fps: number;
  activePlayers: number;
  activeArrows: number;
  activeOverlays: number;
  currentTime: number; // normalized time fraction (0 to 1)
  isPlaying: boolean;
}
