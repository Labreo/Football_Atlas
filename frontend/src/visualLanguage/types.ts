/**
 * Tactical Visual Language System — Core Types
 *
 * Every tactical event type maps to exactly one canonical EventSignature.
 * All concepts, breakdowns, classroom animations, and historical examples
 * consume this registry — no custom implementations allowed.
 */

// ─────────────────────────────────────────────────────────────────────────────
// EVENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export enum TacticalEventType {
  PRESS_TRIGGER            = 'PRESS_TRIGGER',
  PASSING_LANE             = 'PASSING_LANE',
  MOVEMENT_RUN             = 'MOVEMENT_RUN',
  THIRD_MAN_RUN            = 'THIRD_MAN_RUN',
  ZONE_OCCUPATION          = 'ZONE_OCCUPATION',
  MIDFIELD_OVERLOAD        = 'MIDFIELD_OVERLOAD',
  DEFENSIVE_COMPACTNESS    = 'DEFENSIVE_COMPACTNESS',
  DEFENSIVE_LINE_DROP      = 'DEFENSIVE_LINE_DROP',
  PRESSING_TRAP            = 'PRESSING_TRAP',
  COUNTER_ATTACK_TRIGGER   = 'COUNTER_ATTACK_TRIGGER',
  TRANSITION_MOMENT        = 'TRANSITION_MOMENT',
  SPACE_CREATION           = 'SPACE_CREATION',
  SPACE_EXPLOITATION       = 'SPACE_EXPLOITATION',
}

// ─────────────────────────────────────────────────────────────────────────────
// VISUAL MODE
// ─────────────────────────────────────────────────────────────────────────────

export type VisualMode = 'concept' | 'historical';

// ─────────────────────────────────────────────────────────────────────────────
// ARROW SIGNATURE
// ─────────────────────────────────────────────────────────────────────────────

export interface ArrowSignature {
  /** Primary stroke color (hex). */
  color: string;
  /** Stroke width in world units. */
  width: number;
  /** Whether the line is dashed. */
  dashed: boolean;
  /** Dash segment length (world units). */
  dashSize?: number;
  /** Gap length between dashes (world units). */
  gapSize?: number;
  /** Animation speed multiplier for moving dashes. */
  dashSpeed?: number;
  /** Whether to use a curved/spline path. */
  curved?: boolean;
  /** Opacity (0–1). */
  opacity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLAY SIGNATURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extended overlay render modes supported by the TVLS.
 * These augment the base OverlayType enum in the engine.
 */
export type OverlayRenderMode =
  | 'POLYGON'
  | 'RECTANGLE'
  | 'CIRCLE'
  | 'HEAT_AREA'
  | 'PULSE_RING'        // Expanding animated rings (PRESS_TRIGGER)
  | 'VACATED_GLOW'      // Shimmer glow on empty space (SPACE_CREATION)
  | 'COMPRESSION_BAND'  // Narrowing band (DEFENSIVE_COMPACTNESS)
  | 'CONVERGING_ZONE'   // Inward converging vectors (PRESSING_TRAP)
  | 'FLASH_BURST'       // Instant radial flash (COUNTER_ATTACK_TRIGGER)
  | 'SPLIT_FIELD';      // Half-field color flip (TRANSITION_MOMENT)

export interface OverlaySignature {
  mode: OverlayRenderMode;
  /** Primary fill color (hex). */
  color: string;
  /** Optional secondary color for gradient/transition effects. */
  colorSecondary?: string;
  /** Fill opacity (0–1). */
  opacity: number;
  /** Border opacity multiplier relative to fill. */
  borderOpacityMultiplier?: number;
  /** Pulse ring specific: number of expanding rings. */
  pulseCount?: number;
  /** Pulse ring specific: animation period in ms. */
  pulsePeriodMs?: number;
  /** Compression band: squeeze direction. */
  squeezeAxis?: 'x' | 'z';
  /** Flash burst: flash duration in ms. */
  flashDurationMs?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTION PROFILE
// ─────────────────────────────────────────────────────────────────────────────

export interface MotionProfile {
  /** Human-readable description for accessibility announcements. */
  descriptor: string;
  /**
   * Animation easing used for this event type.
   * Used by the engine when rendering signature overlays.
   */
  easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut';
  /** Duration of the primary animation in ms. */
  durationMs: number;
  /** Whether the animation loops during the event window. */
  loops: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// THIRD MAN RUN — MULTI-STAGE PATH
// ─────────────────────────────────────────────────────────────────────────────

export interface ThirdManRunStage {
  label: string;
  arrowStyle: ArrowSignature;
  /** Fractional duration within the overall event window (must sum to 1.0). */
  durationFraction: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSIBILITY LAYER
// ─────────────────────────────────────────────────────────────────────────────

export interface AccessibilityProfile {
  /**
   * Unique shape identifier used in non-color-dependent mode.
   * Examples: 'concentric-rings', 'parallel-lines', 'dashed-curve'
   */
  shapeId: string;
  /** Human-readable motion description for screen-readers / legend. */
  motionDescription: string;
  /**
   * Timing pattern (fast / medium / slow / instant).
   * Allows users to distinguish events by rhythm even without color.
   */
  timingPattern: 'instant' | 'fast' | 'medium' | 'slow';
  /**
   * Fallback line style used in color-blind mode.
   * Overrides the dashed/solid property from ArrowSignature.
   */
  colorBlindLineStyle: 'solid' | 'dashed' | 'dotted' | 'dash-dot';
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL EVENT SIGNATURE
// ─────────────────────────────────────────────────────────────────────────────

export interface EventSignature {
  /** The event type this signature belongs to. */
  eventType: TacticalEventType;
  /** Human-readable name shown in the Visual Language Guide. */
  displayName: string;
  /** One-line description of what this event type communicates. */
  description: string;
  /** Which concepts/contexts use this signature. */
  usedIn: string[];
  /** Arrow style for path-based events (movement, passing, runs). */
  arrow?: ArrowSignature;
  /** Overlay style for zone-based events (compactness, trap, space). */
  overlay?: OverlaySignature;
  /** Multi-stage path spec for THIRD_MAN_RUN. */
  stages?: ThirdManRunStage[];
  /** Motion behavior spec. */
  motion: MotionProfile;
  /** Accessibility descriptor. */
  accessibility: AccessibilityProfile;
  /**
   * Whether this signature has a distinct Historical Mode variant.
   * When true, the HistoricalVisualTheme modifies colors and opacity.
   */
  hasHistoricalVariant: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORICAL VISUAL THEME
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoricalTheme {
  /** Opacity multiplier applied to all overlays in historical mode (0–1). */
  overlayOpacityScale: number;
  /** Color desaturation amount (0 = full color, 1 = full grayscale). */
  desaturationAmount: number;
  /** Tint color blended over all overlays in sepia/historical mode. */
  tintColor: string;
  /** Opacity of the tint overlay. */
  tintOpacity: number;
  /** Whether to show the "REAL MATCH" badge on-pitch. */
  showMatchBadge: boolean;
  /** Arrow opacity scale in historical mode. */
  arrowOpacityScale: number;
  /** CSS class applied to annotation text in historical mode. */
  annotationClass: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS EVENT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface VisualSignatureShownEvent {
  eventType: TacticalEventType;
  mode: VisualMode;
  conceptId?: string;
  sessionId: string;
  timestampMs: number;
}

export interface VisualSignatureRecognizedEvent {
  eventType: TacticalEventType;
  userConfirmed: boolean;
  latencyMs: number;
  sessionId: string;
  timestampMs: number;
}

export interface HistoricalModeViewedEvent {
  exampleId: string;
  durationMs: number;
  sessionId: string;
  timestampMs: number;
}
