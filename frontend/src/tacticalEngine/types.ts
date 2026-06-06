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
  opacity?: number;
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
  /** TVLS: tactical event type tag for analytics binding */
  eventType?: string;
}

export enum OverlayType {
  // Standard types
  POLYGON = 'POLYGON',
  RECTANGLE = 'RECTANGLE',
  CIRCLE = 'CIRCLE',
  HEAT_AREA = 'HEAT_AREA',
  // Tactical Visual Language System types
  PULSE_RING = 'PULSE_RING',           // Expanding animated rings (PRESS_TRIGGER)
  VACATED_GLOW = 'VACATED_GLOW',       // Shimmer in vacated space (SPACE_CREATION)
  COMPRESSION_BAND = 'COMPRESSION_BAND', // Narrowing band (DEFENSIVE_COMPACTNESS)
  CONVERGING_ZONE = 'CONVERGING_ZONE', // Inward converging (PRESSING_TRAP)
  FLASH_BURST = 'FLASH_BURST',         // Instant radial flash (COUNTER_ATTACK_TRIGGER)
  SPLIT_FIELD = 'SPLIT_FIELD',         // Half-field color flip (TRANSITION_MOMENT)
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
  colorSecondary?: string; // Secondary color for gradient/transition effects
  opacity?: number;
  /** TVLS: tactical event type tag for analytics binding */
  eventType?: string;
  /** TVLS: pulse ring count (PULSE_RING type) */
  pulseCount?: number;
  /** TVLS: pulse period in ms (PULSE_RING, VACATED_GLOW) */
  pulsePeriodMs?: number;
  /** TVLS: squeeze axis (COMPRESSION_BAND type) */
  squeezeAxis?: 'x' | 'z';
  /** TVLS: flash duration in ms (FLASH_BURST, SPLIT_FIELD) */
  flashDurationMs?: number;
}

export interface EngineTelemetry {
  fps: number;
  activePlayers: number;
  activeArrows: number;
  activeOverlays: number;
  currentTime: number; // normalized time fraction (0 to 1)
  isPlaying: boolean;
}
