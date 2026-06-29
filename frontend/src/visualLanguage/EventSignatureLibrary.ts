/**
 * Tactical Visual Language System — Event Signature Library
 *
 * Canonical visual signatures for all 13 tactical event types.
 * This is the single source of truth for how every event looks
 * across concepts, breakdowns, classroom animations, and historical examples.
 *
 * Design rules:
 * - Every signature must be distinguishable WITHOUT relying solely on color
 * - Motion, shape, and timing must carry semantic weight independently
 * - Historical variants are produced by HistoricalVisualTheme, not here
 */

import {
  TacticalEventType,
  EventSignature,
  ThirdManRunStage,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// PRESS TRIGGER
// Expanding pulse rings originating from the pressing player.
// Used in: High Press, Pressing Trap, Counter Press, Historical Breakdowns
// ─────────────────────────────────────────────────────────────────────────────
const PRESS_TRIGGER: EventSignature = {
  eventType: TacticalEventType.PRESS_TRIGGER,
  displayName: 'Press Trigger',
  description: 'A coordinated press is activated. Pressure originates from the pressing player and expands outward.',
  usedIn: ['high_press', 'pressing_trap', 'counter_attack_trigger', 'historical_breakdowns'],
  overlay: {
    mode: 'PULSE_RING',
    color: '#EF4444',
    opacity: 0.75,
    borderOpacityMultiplier: 1.0,
    pulseCount: 3,
    pulsePeriodMs: 420,
  },
  motion: {
    descriptor: 'Three concentric rings expand outward from the pressing player at 420ms intervals.',
    easing: 'cubicInOut',
    durationMs: 1260,
    loops: false,
  },
  accessibility: {
    shapeId: 'concentric-rings',
    motionDescription: 'Expanding rings — press is activated',
    timingPattern: 'fast',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// PASSING LANE
// A clean directional corridor — not an arrow, but a temporary channel.
// Used everywhere.
// ─────────────────────────────────────────────────────────────────────────────
const PASSING_LANE: EventSignature = {
  eventType: TacticalEventType.PASSING_LANE,
  displayName: 'Passing Lane',
  description: 'A temporary passing channel between two players. Communicates a viable option, not a decision.',
  usedIn: ['false_9', 'high_press', 'midfield_overload', 'third_man_run', 'pressing_trap', 'defensive_block', 'historical_breakdowns'],
  arrow: {
    color: '#00F3FF',
    width: 2.5,
    dashed: false,
    opacity: 0.82,
  },
  overlay: {
    mode: 'RECTANGLE',
    color: '#00F3FF',
    opacity: 0.07,
    borderOpacityMultiplier: 1.6,
  },
  motion: {
    descriptor: 'Solid corridor fades in over 300ms and holds.',
    easing: 'sineInOut',
    durationMs: 300,
    loops: false,
  },
  accessibility: {
    shapeId: 'parallel-corridor',
    motionDescription: 'Solid corridor — passing option available',
    timingPattern: 'medium',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// MOVEMENT RUN
// Animated dashed trajectory. Directional. Subtle motion.
// ─────────────────────────────────────────────────────────────────────────────
const MOVEMENT_RUN: EventSignature = {
  eventType: TacticalEventType.MOVEMENT_RUN,
  displayName: 'Movement Run',
  description: 'A player run — directional movement with intent. The moving dash conveys motion-in-progress.',
  usedIn: ['false_9', 'high_press', 'midfield_overload', 'third_man_run', 'counter_attack_trigger', 'inverted_winger', 'back_three_wing_back'],
  arrow: {
    color: '#39FF14',
    width: 3.0,
    dashed: true,
    dashSize: 1.5,
    gapSize: 1.0,
    dashSpeed: 1.0,
    opacity: 0.95,
  },
  motion: {
    descriptor: 'Animated dashes flow along the trajectory in the direction of movement.',
    easing: 'linear',
    durationMs: 800,
    loops: false,
  },
  accessibility: {
    shapeId: 'dashed-curve',
    motionDescription: 'Flowing dashes — player is running',
    timingPattern: 'medium',
    colorBlindLineStyle: 'dashed',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// THIRD MAN RUN
// Multi-stage path with distinct visual per stage.
// Stage 1: Primary movement (deep/wide draw)
// Stage 2: Secondary movement (repositioning)
// Stage 3: Receiving movement (into space)
// ─────────────────────────────────────────────────────────────────────────────
const THIRD_MAN_RUN_STAGES: ThirdManRunStage[] = [
  {
    label: 'Primary Movement',
    arrowStyle: {
      color: '#38FE5E',
      width: 3.0,
      dashed: true,
      dashSize: 1.8,
      gapSize: 0.8,
      dashSpeed: 0.8,
      opacity: 0.90,
    },
    durationFraction: 0.35,
  },
  {
    label: 'Secondary Movement',
    arrowStyle: {
      color: '#F59E0B',
      width: 3.2,
      dashed: true,
      dashSize: 1.2,
      gapSize: 1.2,
      dashSpeed: 1.1,
      opacity: 0.92,
    },
    durationFraction: 0.30,
  },
  {
    label: 'Receiving Movement',
    arrowStyle: {
      color: '#EF4444',
      width: 3.5,
      dashed: false,
      opacity: 0.95,
    },
    durationFraction: 0.35,
  },
];

const THIRD_MAN_RUN: EventSignature = {
  eventType: TacticalEventType.THIRD_MAN_RUN,
  displayName: 'Third Man Run',
  description: 'A three-stage run: initial draw movement, repositioning, then final receiving run into space. Clearly distinct from a standard movement run.',
  usedIn: ['third_man_run', 'midfield_overload', 'false_9'],
  stages: THIRD_MAN_RUN_STAGES,
  arrow: {
    // Default fallback — stages take precedence when rendered
    color: '#F59E0B',
    width: 3.2,
    dashed: true,
    dashSize: 1.5,
    gapSize: 1.0,
    dashSpeed: 1.0,
    opacity: 0.92,
  },
  motion: {
    descriptor: 'Three sequential path segments render one after another: green dashes, amber dashes, then a solid red line.',
    easing: 'sineInOut',
    durationMs: 1800,
    loops: false,
  },
  accessibility: {
    shapeId: 'three-segment-path',
    motionDescription: 'Three-stage run — dashed-dashed-solid segments',
    timingPattern: 'slow',
    colorBlindLineStyle: 'dash-dot',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// ZONE OCCUPATION
// A highlighted zone indicating a player holds a key tactical area.
// ─────────────────────────────────────────────────────────────────────────────
const ZONE_OCCUPATION: EventSignature = {
  eventType: TacticalEventType.ZONE_OCCUPATION,
  displayName: 'Zone Occupation',
  description: 'A player or group occupies a key tactical zone, denying it to the opponent.',
  usedIn: ['defensive_block', 'compactness_pressing_lines', 'high_press', 'midfield_overload'],
  overlay: {
    mode: 'HEAT_AREA',
    color: '#8B5CF6',
    opacity: 0.22,
    borderOpacityMultiplier: 1.4,
    pulsePeriodMs: 800,
  },
  motion: {
    descriptor: 'A pulsing heat zone breathes softly at 800ms intervals to indicate active occupation.',
    easing: 'sineInOut',
    durationMs: 800,
    loops: true,
  },
  accessibility: {
    shapeId: 'breathing-heat-area',
    motionDescription: 'Pulsing heat zone — area is occupied',
    timingPattern: 'slow',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// MIDFIELD OVERLOAD
// Area expansion effect highlighting numerical superiority.
// ─────────────────────────────────────────────────────────────────────────────
const MIDFIELD_OVERLOAD: EventSignature = {
  eventType: TacticalEventType.MIDFIELD_OVERLOAD,
  displayName: 'Midfield Overload',
  description: 'Numerical superiority is established in the midfield zone. The area expands to show growing advantage.',
  usedIn: ['midfield_overload', 'false_9', 'high_press'],
  overlay: {
    mode: 'HEAT_AREA',
    color: '#F59E0B',
    opacity: 0.20,
    borderOpacityMultiplier: 1.8,
    pulsePeriodMs: 600,
  },
  motion: {
    descriptor: 'The zone expands radially from center as numerical advantage builds, with amber heat glow.',
    easing: 'cubicInOut',
    durationMs: 600,
    loops: false,
  },
  accessibility: {
    shapeId: 'expanding-amber-zone',
    motionDescription: 'Expanding amber area — numerical overload in midfield',
    timingPattern: 'medium',
    colorBlindLineStyle: 'dashed',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFENSIVE COMPACTNESS
// Shape compression visualization — block becomes tighter.
// ─────────────────────────────────────────────────────────────────────────────
const DEFENSIVE_COMPACTNESS: EventSignature = {
  eventType: TacticalEventType.DEFENSIVE_COMPACTNESS,
  displayName: 'Defensive Compactness',
  description: 'The defensive shape compresses, reducing space between players and lines.',
  usedIn: ['compactness_pressing_lines', 'defensive_block', 'high_press', 'back_three_wing_back'],
  overlay: {
    mode: 'COMPRESSION_BAND',
    color: '#FFCC00',
    opacity: 0.18,
    borderOpacityMultiplier: 2.0,
    squeezeAxis: 'x',
  },
  motion: {
    descriptor: 'A horizontal band squeezes inward over 600ms, visualizing the defensive shape tightening.',
    easing: 'cubicInOut',
    durationMs: 600,
    loops: false,
  },
  accessibility: {
    shapeId: 'narrowing-band',
    motionDescription: 'Narrowing yellow band — defensive shape is compressing',
    timingPattern: 'medium',
    colorBlindLineStyle: 'dash-dot',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFENSIVE LINE DROP
// Entire defensive line shifts back together.
// ─────────────────────────────────────────────────────────────────────────────
const DEFENSIVE_LINE_DROP: EventSignature = {
  eventType: TacticalEventType.DEFENSIVE_LINE_DROP,
  displayName: 'Defensive Line Drop',
  description: 'The entire defensive line drops in unison, emphasizing collective retreat.',
  usedIn: ['defensive_block', 'compactness_pressing_lines', 'back_three_wing_back'],
  arrow: {
    color: '#6366F1',
    width: 3.5,
    dashed: false,
    opacity: 0.88,
    curved: false,
  },
  overlay: {
    mode: 'RECTANGLE',
    color: '#6366F1',
    opacity: 0.10,
    borderOpacityMultiplier: 2.2,
  },
  motion: {
    descriptor: 'A full-width indigo bar shifts back smoothly over 500ms, representing coordinated defensive retreat.',
    easing: 'quadInOut',
    durationMs: 500,
    loops: false,
  },
  accessibility: {
    shapeId: 'synchronized-horizontal-line',
    motionDescription: 'Wide solid bar shifts back — defensive line is dropping',
    timingPattern: 'medium',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// PRESSING TRAP
// Converging pressure vectors that visually imply entrapment.
// ─────────────────────────────────────────────────────────────────────────────
const PRESSING_TRAP: EventSignature = {
  eventType: TacticalEventType.PRESSING_TRAP,
  displayName: 'Pressing Trap',
  description: 'Multiple pressers converge toward a single target. The visual implies inescapable entrapment.',
  usedIn: ['pressing_trap', 'high_press', 'compactness_pressing_lines'],
  arrow: {
    color: '#DC2626',
    width: 2.8,
    dashed: true,
    dashSize: 1.0,
    gapSize: 0.8,
    dashSpeed: 1.4,
    opacity: 0.92,
  },
  overlay: {
    mode: 'CONVERGING_ZONE',
    color: '#DC2626',
    opacity: 0.22,
    borderOpacityMultiplier: 1.6,
  },
  motion: {
    descriptor: 'Multiple fast-dashed arrows converge inward simultaneously. The zone tightens as pressure vectors close in.',
    easing: 'cubicInOut',
    durationMs: 700,
    loops: false,
  },
  accessibility: {
    shapeId: 'inward-converging-arrows',
    motionDescription: 'Converging arrows — trap is closing',
    timingPattern: 'fast',
    colorBlindLineStyle: 'dashed',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// COUNTER ATTACK TRIGGER
// Instant transition flash: possession recovery → attack phase.
// ─────────────────────────────────────────────────────────────────────────────
const COUNTER_ATTACK_TRIGGER: EventSignature = {
  eventType: TacticalEventType.COUNTER_ATTACK_TRIGGER,
  displayName: 'Counter Attack Trigger',
  description: 'The moment possession is recovered and attack begins. An instant flash marks the transition.',
  usedIn: ['counter_attack_trigger', 'high_press', 'pressing_trap'],
  arrow: {
    color: '#38FE5E',
    width: 4.0,
    dashed: false,
    opacity: 1.0,
    curved: false,
  },
  overlay: {
    mode: 'FLASH_BURST',
    color: '#38FE5E',
    colorSecondary: '#ECFDF5',
    opacity: 0.85,
    flashDurationMs: 150,
  },
  motion: {
    descriptor: 'Instant green flash burst (150ms) followed by a bold solid arrow launching the attack direction.',
    easing: 'cubicInOut',
    durationMs: 150,
    loops: false,
  },
  accessibility: {
    shapeId: 'instant-flash-burst',
    motionDescription: 'Instant bright flash — counter attack has triggered',
    timingPattern: 'instant',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// TRANSITION MOMENT
// The split-second shift between phases — defense to attack, or vice versa.
// ─────────────────────────────────────────────────────────────────────────────
const TRANSITION_MOMENT: EventSignature = {
  eventType: TacticalEventType.TRANSITION_MOMENT,
  displayName: 'Transition Moment',
  description: 'The phase boundary between two tactical states — the moment the game shifts.',
  usedIn: ['counter_attack_trigger', 'high_press', 'back_three_wing_back', 'historical_breakdowns'],
  overlay: {
    mode: 'SPLIT_FIELD',
    color: '#6366F1',
    colorSecondary: '#38FE5E',
    opacity: 0.16,
    flashDurationMs: 200,
  },
  motion: {
    descriptor: 'A 200ms field split: left half transitions from indigo (defensive) to green (attacking).',
    easing: 'linear',
    durationMs: 200,
    loops: false,
  },
  accessibility: {
    shapeId: 'split-field-halves',
    motionDescription: 'Field splits color — tactical phase has changed',
    timingPattern: 'instant',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPACE CREATION
// A vacated zone glows to show where space has appeared.
// ─────────────────────────────────────────────────────────────────────────────
const SPACE_CREATION: EventSignature = {
  eventType: TacticalEventType.SPACE_CREATION,
  displayName: 'Space Creation',
  description: 'A zone is vacated by a run or repositioning, creating exploitable space.',
  usedIn: ['false_9', 'third_man_run', 'inverted_winger', 'midfield_overload', 'counter_attack_trigger'],
  overlay: {
    mode: 'VACATED_GLOW',
    color: '#FDE68A',
    opacity: 0.30,
    borderOpacityMultiplier: 0.8,
    pulsePeriodMs: 1200,
  },
  motion: {
    descriptor: 'A pale gold shimmer pulses slowly in the vacated area at 1.2s intervals.',
    easing: 'sineInOut',
    durationMs: 1200,
    loops: true,
  },
  accessibility: {
    shapeId: 'shimmering-empty-zone',
    motionDescription: 'Slow shimmer — space has been created here',
    timingPattern: 'slow',
    colorBlindLineStyle: 'dotted',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// SPACE EXPLOITATION
// The space highlight transforms into an attack path.
// ─────────────────────────────────────────────────────────────────────────────
const SPACE_EXPLOITATION: EventSignature = {
  eventType: TacticalEventType.SPACE_EXPLOITATION,
  displayName: 'Space Exploitation',
  description: 'Created space is exploited. The zone glow transforms into a directional attack path.',
  usedIn: ['false_9', 'counter_attack_trigger', 'inverted_winger', 'back_three_wing_back'],
  arrow: {
    color: '#38FE5E',
    width: 3.5,
    dashed: false,
    opacity: 0.95,
    curved: true,
  },
  overlay: {
    mode: 'VACATED_GLOW',
    color: '#38FE5E',
    colorSecondary: '#FDE68A',
    opacity: 0.22,
    borderOpacityMultiplier: 1.4,
    pulsePeriodMs: 400,
  },
  motion: {
    descriptor: 'The pale gold space glow (Space Creation) transforms over 400ms into a solid green attack arrow.',
    easing: 'cubicInOut',
    durationMs: 400,
    loops: false,
  },
  accessibility: {
    shapeId: 'glow-to-solid-path',
    motionDescription: 'Glow becomes solid arrow — space is being exploited',
    timingPattern: 'fast',
    colorBlindLineStyle: 'solid',
  },
  hasHistoricalVariant: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT — All 13 canonical signatures
// ─────────────────────────────────────────────────────────────────────────────

export const EVENT_SIGNATURE_LIBRARY: Record<TacticalEventType, EventSignature> = {
  [TacticalEventType.PRESS_TRIGGER]:           PRESS_TRIGGER,
  [TacticalEventType.PASSING_LANE]:            PASSING_LANE,
  [TacticalEventType.MOVEMENT_RUN]:            MOVEMENT_RUN,
  [TacticalEventType.THIRD_MAN_RUN]:           THIRD_MAN_RUN,
  [TacticalEventType.ZONE_OCCUPATION]:         ZONE_OCCUPATION,
  [TacticalEventType.MIDFIELD_OVERLOAD]:       MIDFIELD_OVERLOAD,
  [TacticalEventType.DEFENSIVE_COMPACTNESS]:   DEFENSIVE_COMPACTNESS,
  [TacticalEventType.DEFENSIVE_LINE_DROP]:     DEFENSIVE_LINE_DROP,
  [TacticalEventType.PRESSING_TRAP]:           PRESSING_TRAP,
  [TacticalEventType.COUNTER_ATTACK_TRIGGER]:  COUNTER_ATTACK_TRIGGER,
  [TacticalEventType.TRANSITION_MOMENT]:       TRANSITION_MOMENT,
  [TacticalEventType.SPACE_CREATION]:          SPACE_CREATION,
  [TacticalEventType.SPACE_EXPLOITATION]:      SPACE_EXPLOITATION,
};
