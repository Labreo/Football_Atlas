import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  HighlightZone, 
  HighlightPassingLane,
  HighlightNumericalAdvantage,
  PassBall, 
  DribbleBall,
  SetBallPosition,
  PushForward,
  CompressShape,
  ExpandShape,
  TriggerRun,
  RecoveryRun,
  HighlightChannel,
  HighlightCompactness,
  DefenderFollows,
  DefenderHolds,
  PossessionWon,
  TacticalPrimitive,
  PrimitiveCompileContext
} from '../tacticalPrimitives';
import { OverlayType } from '../tacticalEngine/types';

// ─────────────────────────────────────────────────────────────────
// LOCAL ANALYTICS TRIGGER PRIMITIVE
// Identical pattern to other modules.
// ─────────────────────────────────────────────────────────────────
class AnalyticsTrigger implements TacticalPrimitive {
  type = 'AnalyticsTrigger';
  constructor(
    public eventName: string,
    public time: number,
    public data: Record<string, any> = {}
  ) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: this.eventName,
      data: { concept_id: 'back_three_wing_back', ...this.data },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// LOCAL DYNAMIC POLYGON HIGHLIGHT
// Highlights specific players in a shape dynamically.
// ─────────────────────────────────────────────────────────────────
class HighlightShapePolygon implements TacticalPrimitive {
  type = 'HighlightShapePolygon';
  constructor(
    public id: string,
    public playerIds: string[],
    public startTime: number,
    public endTime: number,
    public color: string = '#00F3FF',
    public opacity: number = 0.15
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const points = this.playerIds.map(id => context.getPlayerPosition(id, this.startTime));
    context.overlays.push({
      id: this.id,
      type: OverlayType.POLYGON,
      points,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// BACK THREE WING BACK MODULE
//
// Blue Team (3-4-3 initial, attacking left->right)
// Red Team (4-3-3 initial, defending right->left)
// ─────────────────────────────────────────────────────────────────
export class BackThreeWingBackModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'back_three_wing_back',
      name: 'Back 3 / Wing-Back System',
      description: 'A structural system using 3 central defenders and 2 wing-backs that transforms dynamically. In defense, wing-backs drop to form a compact 5-back; in possession, they push high to build a 5-player attacking line.',
      durationSeconds: 16.0,

      primitives: [
        // 1. Initial State / Formations
        new FormationState('attack', '3-4-3', 'left',
          {
            'GK': { x: -44, z: 0 },
            'LCB': { x: -28, z: -10 },
            'RCB': { x: -28, z: 10 },
            'CB': { x: -30, z: 0 },
            'LWB': { x: -26, z: -25 },
            'RWB': { x: -26, z: 25 },
            'LCM': { x: -18, z: -8 },
            'RCM': { x: -18, z: 8 },
            'LW': { x: -6, z: -15 },
            'CF': { x: -3, z: 0 },
            'RW': { x: -6, z: 15 }
          },
          {
            'GK': 'blue_gk',
            'LCB': 'blue_cb_l',
            'RCB': 'blue_cb_r',
            'CB': 'blue_cb_c',
            'LWB': 'blue_lwb',
            'RWB': 'blue_rwb',
            'LCM': 'blue_cm_l',
            'RCM': 'blue_cm_r',
            'LW': 'blue_lw',
            'CF': 'blue_cf',
            'RW': 'blue_rw'
          }
        ),

        new FormationState('defend', '4-3-3', 'right',
          {
            'GK': { x: 42, z: 0 },
            'LCB': { x: 22, z: -6 },
            'RCB': { x: 22, z: 6 },
            'LB': { x: 8, z: -24 },
            'RB': { x: 8, z: 24 },
            'DM': { x: 0, z: 0 },
            'LCM': { x: -8, z: -10 },
            'RCM': { x: -8, z: 10 },
            'LW': { x: -20, z: -22 },
            'CF': { x: -20, z: 0 },
            'RW': { x: -20, z: 22 }
          },
          {
            'GK': 'red_gk',
            'LCB': 'red_cb_l',
            'RCB': 'red_cb_r',
            'LB': 'red_lb',
            'RB': 'red_rb',
            'DM': 'red_cm_c',
            'LCM': 'red_cm_l',
            'RCM': 'red_cm_r',
            'LW': 'red_lw',
            'CF': 'red_cf',
            'RW': 'red_rw'
          }
        ),

        // ─────────────────────────────────────────────────────────
        // PHASE 1 — DEFENSIVE STRUCTURE (0.00 to 0.12)
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_gk', { x: -44, z: 0 }, 0.0, 0.12),
        new MovePlayer('blue_cb_l', { x: -28, z: -10 }, 0.0, 0.12),
        new MovePlayer('blue_cb_r', { x: -28, z: 10 }, 0.0, 0.12),
        new MovePlayer('blue_cb_c', { x: -30, z: 0 }, 0.0, 0.12),
        new MovePlayer('blue_lwb', { x: -26, z: -25 }, 0.0, 0.12),
        new MovePlayer('blue_rwb', { x: -26, z: 25 }, 0.0, 0.12),
        new MovePlayer('blue_cm_l', { x: -18, z: -8 }, 0.0, 0.12),
        new MovePlayer('blue_cm_r', { x: -18, z: 8 }, 0.0, 0.12),
        new MovePlayer('blue_lw', { x: -6, z: -15 }, 0.0, 0.12),
        new MovePlayer('blue_cf', { x: -3, z: 0 }, 0.0, 0.12),
        new MovePlayer('blue_rw', { x: -6, z: 15 }, 0.0, 0.12),

        // Red team in possession / attacking structure
        new MovePlayer('red_gk', { x: 42, z: 0 }, 0.0, 0.12),
        new MovePlayer('red_cb_l', { x: 22, z: -6 }, 0.0, 0.12),
        new MovePlayer('red_cb_r', { x: 22, z: 6 }, 0.0, 0.12),
        new MovePlayer('red_lb', { x: 8, z: -24 }, 0.0, 0.12),
        new MovePlayer('red_rb', { x: 8, z: 24 }, 0.0, 0.12),
        new MovePlayer('red_cm_c', { x: 0, z: 0 }, 0.0, 0.12),
        new MovePlayer('red_cm_l', { x: -8, z: -10 }, 0.0, 0.12),
        new MovePlayer('red_cm_r', { x: -8, z: 10 }, 0.0, 0.12),
        new MovePlayer('red_lw', { x: -20, z: -22 }, 0.0, 0.12),
        new MovePlayer('red_cf', { x: -20, z: 0 }, 0.0, 0.12),
        new MovePlayer('red_rw', { x: -20, z: 22 }, 0.0, 0.12),

        // Ball starts with Red central mid
        new SetBallPosition('red_cm_c', 0.0),
        new SetBallPosition('red_cm_c', 0.08),

        // Defensive compact overlay
        new HighlightCompactness('attack', 0.0, 0.12, '#FFCC00', 0.15),
        new HighlightShapePolygon('def_line_poly', ['blue_lwb', 'blue_cb_l', 'blue_cb_c', 'blue_cb_r', 'blue_rwb'], 0.0, 0.12, '#1D4ED8', 0.2),

        new AnalyticsTrigger('lesson_started', 0.02, { phase: 'defensive_structure' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 2 — POSSESSION GAINED (0.12 to 0.25)
        // Red CM plays a soft pass to CF, intercepted by central CB
        // ─────────────────────────────────────────────────────────
        new PassBall('red_cm_c', 'blue_cb_c', 0.08, 0.12),
        new SetBallPosition('blue_cb_c', 0.12),
        new SetBallPosition('blue_cb_c', 0.18),

        new MovePlayer('red_cm_c', { x: -2, z: 0 }, 0.12, 0.25),
        new MovePlayer('red_cf', { x: -16, z: 0 }, 0.12, 0.25),

        // Blue players start transitioning forward
        new PushForward('blue_lwb', 10, 0.12, 0.25, 'quadInOut'),
        new PushForward('blue_rwb', 10, 0.12, 0.25, 'quadInOut'),
        
        new MovePlayer('blue_cb_c', { x: -26, z: 0 }, 0.12, 0.25, 'sineInOut'),
        new MovePlayer('blue_cb_l', { x: -22, z: -16 }, 0.12, 0.25, 'sineInOut'),
        new MovePlayer('blue_cb_r', { x: -22, z: 16 }, 0.12, 0.25, 'sineInOut'),

        new MovePlayer('blue_cm_l', { x: -12, z: -10 }, 0.12, 0.25, 'sineInOut'),
        new MovePlayer('blue_cm_r', { x: -12, z: 10 }, 0.12, 0.25, 'sineInOut'),

        new MovePlayer('blue_lw', { x: 6, z: -16 }, 0.12, 0.25, 'sineInOut'),
        new MovePlayer('blue_cf', { x: 10, z: 0 }, 0.12, 0.25, 'sineInOut'),
        new MovePlayer('blue_rw', { x: 6, z: 16 }, 0.12, 0.25, 'sineInOut'),

        // Ball pass from central CB to LCB
        new PassBall('blue_cb_c', 'blue_cb_l', 0.18, 0.24),
        new SetBallPosition('blue_cb_l', 0.24),
        new SetBallPosition('blue_cb_l', 0.25),

        new PossessionWon(0.12),
        new AnalyticsTrigger('possession_gained', 0.13),

        // ─────────────────────────────────────────────────────────
        // PHASE 3 — SHAPE EXPANSION (0.25 to 0.42)
        // Wing-backs push very high, central forwards narrow, space expands
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_cb_l', { x: -22, z: -16 }, 0.25, 0.42),
        new MovePlayer('blue_cb_r', { x: -22, z: 16 }, 0.25, 0.42),
        new MovePlayer('blue_cb_c', { x: -26, z: 0 }, 0.25, 0.42),

        // Wingbacks push high up touchlines
        new PushForward('blue_lwb', 24, 0.25, 0.42, 'cubicInOut'),
        new PushForward('blue_rwb', 24, 0.25, 0.42, 'cubicInOut'),

        // CMs form double pivot
        new MovePlayer('blue_cm_l', { x: -6, z: -10 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('blue_cm_r', { x: -6, z: 10 }, 0.25, 0.42, 'sineInOut'),

        // Inside wingers tuck in, CF pushes deep to stretch defense
        new MovePlayer('blue_lw', { x: 20, z: -12 }, 0.25, 0.42, 'cubicInOut'),
        new MovePlayer('blue_cf', { x: 26, z: 0 }, 0.25, 0.42, 'cubicInOut'),
        new MovePlayer('blue_rw', { x: 20, z: 12 }, 0.25, 0.42, 'cubicInOut'),

        // Red team drops to defensive shape
        new MovePlayer('red_cb_l', { x: 18, z: -6 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_cb_r', { x: 18, z: 6 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_lb', { x: 14, z: -20 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_rb', { x: 14, z: 20 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_cm_c', { x: 10, z: 0 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_cm_l', { x: 6, z: -8 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_cm_r', { x: 6, z: 8 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_lw', { x: -2, z: -18 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_cf', { x: -2, z: 0 }, 0.25, 0.42, 'sineInOut'),
        new MovePlayer('red_rw', { x: -2, z: 18 }, 0.25, 0.42, 'sineInOut'),

        // Ball passed: LCB -> LCM
        new PassBall('blue_cb_l', 'blue_cm_l', 0.26, 0.34),
        new SetBallPosition('blue_cm_l', 0.34),
        new SetBallPosition('blue_cm_l', 0.42),

        // Highlight shape expansion and wing channels
        new HighlightChannel('left_wing', 0.25, 0.42, '#39FF14', 0.12),
        new HighlightChannel('right_wing', 0.25, 0.42, '#39FF14', 0.12),
        new ExpandShape('attack', 0.25, 0.42),
        
        new MovementArrow('lwb_run_arrow', { x: -16, z: -26 }, { x: 18, z: -28 }, 0.25, 0.40, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('rwb_run_arrow', { x: -16, z: 26 }, { x: 18, z: 28 }, 0.25, 0.40, { color: '#39FF14', width: 2.5 }),

        new AnalyticsTrigger('shape_expansion_started', 0.28),
        new AnalyticsTrigger('wing_back_advanced', 0.38),

        // ─────────────────────────────────────────────────────────
        // PHASE 4 — ATTACKING STRUCTURE (0.42 to 0.58)
        // Show 3-2-5 attacking shape. 5 lanes highlighted.
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_cb_l', { x: -22, z: -16 }, 0.42, 0.58),
        new MovePlayer('blue_cb_r', { x: -22, z: 16 }, 0.42, 0.58),
        new MovePlayer('blue_cb_c', { x: -26, z: 0 }, 0.42, 0.58),
        new MovePlayer('blue_lwb', { x: 18, z: -28 }, 0.42, 0.58),
        new MovePlayer('blue_rwb', { x: 18, z: 28 }, 0.42, 0.58),
        new MovePlayer('blue_cm_l', { x: -6, z: -10 }, 0.42, 0.58),
        new MovePlayer('blue_cm_r', { x: -6, z: 10 }, 0.42, 0.58),
        new MovePlayer('blue_lw', { x: 20, z: -12 }, 0.42, 0.58),
        new MovePlayer('blue_cf', { x: 26, z: 0 }, 0.42, 0.58),
        new MovePlayer('blue_rw', { x: 20, z: 12 }, 0.42, 0.58),

        new SetBallPosition('blue_cm_l', 0.42),
        new SetBallPosition('blue_cm_l', 0.58),

        // Highlight 5 lanes structures
        new HighlightChannel('left_wing', 0.42, 0.58, '#00F3FF', 0.1),
        new HighlightChannel('left_halfspace', 0.42, 0.58, '#00F3FF', 0.08),
        new HighlightChannel('center', 0.42, 0.58, '#00F3FF', 0.06),
        new HighlightChannel('right_halfspace', 0.42, 0.58, '#00F3FF', 0.08),
        new HighlightChannel('right_wing', 0.42, 0.58, '#00F3FF', 0.1),

        new HighlightShapePolygon('attack_5_line_poly', ['blue_lwb', 'blue_lw', 'blue_cf', 'blue_rw', 'blue_rwb'], 0.42, 0.58, '#1D4ED8', 0.15),
        new HighlightShapePolygon('rest_defense_poly', ['blue_cb_l', 'blue_cb_c', 'blue_cb_r', 'blue_cm_r', 'blue_cm_l'], 0.42, 0.58, '#FF9900', 0.12),

        new AnalyticsTrigger('attacking_shape_formed', 0.44),

        // ─────────────────────────────────────────────────────────
        // PHASE 6 — POSSESSION LOST (0.70 to 0.78)
        // Red team recovers ball, transition begins
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_gk', { x: -44, z: 0 }, 0.58, 1.0),

        new MovePlayer('red_gk', { x: 42, z: 0 }, 0.58, 1.0),
        new MovePlayer('red_cb_l', { x: 22, z: -6 }, 0.70, 0.78),
        new MovePlayer('red_cb_r', { x: 22, z: 6 }, 0.70, 0.78),
        new MovePlayer('red_cm_c', { x: 4, z: 0 }, 0.70, 0.78),

        new SetBallPosition('red_cb_l', 0.72),
        new SetBallPosition('red_cb_l', 0.74),
        new PassBall('red_cb_l', 'red_cm_c', 0.74, 0.78),

        new AnalyticsTrigger('possession_lost', 0.72),

        // ─────────────────────────────────────────────────────────
        // PHASE 7 — SHAPE RECOVERY (0.78 to 0.92)
        // Wing-backs dropped back to form a 5-back compact structure
        // ─────────────────────────────────────────────────────────
        new RecoveryRun('blue_lwb', { x: -26, z: -25 }, 0.78, 0.92, 'cubicInOut'),
        new RecoveryRun('blue_rwb', { x: -26, z: 25 }, 0.78, 0.92, 'cubicInOut'),

        new MovePlayer('blue_cb_l', { x: -28, z: -10 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('blue_cb_r', { x: -28, z: 10 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('blue_cb_c', { x: -30, z: 0 }, 0.78, 0.92, 'sineInOut'),

        new MovePlayer('blue_cm_l', { x: -18, z: -8 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('blue_cm_r', { x: -18, z: 8 }, 0.78, 0.92, 'sineInOut'),

        new MovePlayer('blue_lw', { x: -6, z: -15 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('blue_cf', { x: -3, z: 0 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('blue_rw', { x: -6, z: 15 }, 0.78, 0.92, 'sineInOut'),

        // Red team pushes forward for build-up
        new MovePlayer('red_cb_l', { x: 12, z: -10 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_cb_r', { x: 12, z: 10 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_lb', { x: 4, z: -24 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_rb', { x: 4, z: 24 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_cm_c', { x: -4, z: 0 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_cm_l', { x: -10, z: -8 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_cm_r', { x: -10, z: 8 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_lw', { x: -22, z: -20 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_cf', { x: -22, z: 0 }, 0.78, 0.92, 'sineInOut'),
        new MovePlayer('red_rw', { x: -22, z: 20 }, 0.78, 0.92, 'sineInOut'),

        new SetBallPosition('red_cm_c', 0.78),
        new SetBallPosition('red_cm_c', 0.92),

        new CompressShape('attack', 0.78, 0.92),
        new HighlightCompactness('attack', 0.78, 0.92, '#FFCC00', 0.18),

        new AnalyticsTrigger('defensive_shape_restored', 0.88),

        // ─────────────────────────────────────────────────────────
        // PHASE 8 — SUMMARY (0.92 to 1.00)
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_cb_l', { x: -28, z: -10 }, 0.92, 1.0),
        new MovePlayer('blue_cb_r', { x: -28, z: 10 }, 0.92, 1.0),
        new MovePlayer('blue_cb_c', { x: -30, z: 0 }, 0.92, 1.0),
        new MovePlayer('blue_lwb', { x: -26, z: -25 }, 0.92, 1.0),
        new MovePlayer('blue_rwb', { x: -26, z: 25 }, 0.92, 1.0),
        new MovePlayer('blue_cm_l', { x: -18, z: -8 }, 0.92, 1.0),
        new MovePlayer('blue_cm_r', { x: -18, z: 8 }, 0.92, 1.0),
        new MovePlayer('blue_lw', { x: -6, z: -15 }, 0.92, 1.0),
        new MovePlayer('blue_cf', { x: -3, z: 0 }, 0.92, 1.0),
        new MovePlayer('blue_rw', { x: -6, z: 15 }, 0.92, 1.0),

        new MovePlayer('red_cb_l', { x: 12, z: -10 }, 0.92, 1.0),
        new MovePlayer('red_cb_r', { x: 12, z: 10 }, 0.92, 1.0),
        new MovePlayer('red_lb', { x: 4, z: -24 }, 0.92, 1.0),
        new MovePlayer('red_rb', { x: 4, z: 24 }, 0.92, 1.0),
        new MovePlayer('red_cm_c', { x: -4, z: 0 }, 0.92, 1.0),

        new SetBallPosition('red_cm_c', 0.92),
        new SetBallPosition('red_cm_c', 1.0),

        new HighlightShapePolygon('summary_def_poly', ['blue_lwb', 'blue_cb_l', 'blue_cb_c', 'blue_cb_r', 'blue_rwb'], 0.92, 1.0, '#00F3FF', 0.25),
        new HighlightCompactness('attack', 0.92, 1.0, '#FFCC00', 0.15),

        new AnalyticsTrigger('lesson_completed', 0.96)
      ],

      branchPrimitives: {
        // ─────────────────────────────────────────────────────────
        // BRANCH A: Opposition fullbacks track the wing-backs
        // opens central spaces for the inside forward underlap
        // ─────────────────────────────────────────────────────────
        A: [
          // Red fullbacks slide wide to track high wingbacks
          new MovePlayer('red_lb', { x: 18, z: -28 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_rb', { x: 18, z: 28 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_cb_l', { x: 22, z: -6 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_cb_r', { x: 22, z: 6 }, 0.58, 0.70, 'sineInOut'),

          // Blue inside forward underlaps into central space
          new TriggerRun('blue_lw', { x: 26, z: -10 }, 0.58, 0.70, 'quadInOut'),
          new MovePlayer('blue_rw', { x: 20, z: 12 }, 0.58, 0.70),

          // Ball: LCM -> LW underlapping run
          new PassBall('blue_cm_l', 'blue_lw', 0.62, 0.69),
          new SetBallPosition('blue_lw', 0.69),
          new SetBallPosition('blue_lw', 0.70),

          new PassingArrow('pass_lcm_to_lw', 'blue_cm_l', 'blue_lw', 0.62, 0.68, { color: '#00F3FF', width: 2.5 }),
          new MovementArrow('lw_underlap_run', { x: 20, z: -12 }, { x: 26, z: -10 }, 0.58, 0.68, { color: '#39FF14', width: 2.5 }),

          // Highlight the gap created centrally
          new HighlightZone('central_gap_zone', OverlayType.POLYGON, {
            points: [
              { x: 10, z: -16 },
              { x: 24, z: -16 },
              { x: 24, z: -4 },
              { x: 10, z: -4 }
            ]
          }, 0.58, 0.70, '#39FF14', 0.15),
          new HighlightNumericalAdvantage({ x: 24, z: -8 }, 6.0, 0.58, 0.70, '#00F3FF', 0.2),

          new DefenderFollows(0.60)
        ],

        // ─────────────────────────────────────────────────────────
        // BRANCH B: Opposition fullbacks protect central zones
        // leaves wing-backs free on the flanks
        // ─────────────────────────────────────────────────────────
        B: [
          // Red fullbacks hold central zonal positions
          new MovePlayer('red_lb', { x: 14, z: -12 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_rb', { x: 14, z: 12 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_cb_l', { x: 20, z: -6 }, 0.58, 0.70, 'sineInOut'),
          new MovePlayer('red_cb_r', { x: 20, z: 6 }, 0.58, 0.70, 'sineInOut'),

          // Blue players hold positions
          new MovePlayer('blue_lw', { x: 20, z: -12 }, 0.58, 0.70),
          new MovePlayer('blue_rw', { x: 20, z: 12 }, 0.58, 0.70),

          // Ball: LCM -> LWB wide free option
          new PassBall('blue_cm_l', 'blue_lwb', 0.62, 0.69),
          new DribbleBall('blue_lwb', 0.69, 0.70),

          new PassingArrow('pass_lcm_to_lwb', 'blue_cm_l', 'blue_lwb', 0.62, 0.68, { color: '#00F3FF', width: 2.5 }),
          new MovementArrow('lwb_flank_run', { x: 18, z: -28 }, { x: 26, z: -28 }, 0.58, 0.68, { color: '#39FF14', width: 2.5 }),

          // Highlight the free wing-back on the touchline
          new HighlightZone('lwb_free_indicator', OverlayType.CIRCLE, { center: 'blue_lwb', radius: 6.5 }, 0.58, 0.70, '#FFFF00', 0.22),
          new HighlightPassingLane('blue_cm_l', 'blue_lwb', 0.58, 0.70),

          new DefenderHolds(0.60)
        ]
      },

      // Phase definitions
      phases: [
        { index: 1, start: 0.0, end: 0.12, name: 'Defensive Structure', description: 'Blue drops into a compact defensive block. The two wing-backs sit deep, aligning with the three central defenders to form a solid back five.' },
        { index: 2, start: 0.12, end: 0.25, name: 'Possession Gained', description: 'Blue recovers possession centrally. As the transition begins, the central center-back passes wide, and both wing-backs begin advancing.' },
        { index: 3, start: 0.25, end: 0.42, name: 'Shape Expansion', description: 'Possession is secured. Blue wing-backs push high up the touchlines to stretch the opposition horizontally, while inside forwards tuck centrally.' },
        { index: 4, start: 0.42, end: 0.58, name: 'Attacking Structure', description: 'Blue establishes a 3-2-5 attacking shape. The wing-backs occupy wide channels, and the front-line fills all five attacking lanes.' },
        { index: 5, start: 0.58, end: 0.70, name: 'Defensive Dilemma', description: 'Red defenders face a choice: slide wide to track the high wing-backs or stay compact to protect central zones.' },
        { index: 6, start: 0.70, end: 0.78, name: 'Possession Lost', description: 'The attack completes and possession is lost. Blue must immediately transition from attacking expansion back to defensive compactness.' },
        { index: 7, start: 0.78, end: 0.92, name: 'Shape Recovery', description: 'Wing-backs execute rapid recovery runs. The team block compresses, shifting back into the defensive structure.' },
        { index: 8, start: 0.92, end: 1.0, name: 'Summary', description: 'The Back 3 system dynamically transforms: providing stability in defense with a back 5, and horizontal width in attack.' }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.12, text: 'Three center-backs provide stability, flanked by wing-backs in a compact back five.' },
        { start: 0.12, end: 0.25, text: 'Blue team recovers possession. Transition begins and wing-backs start to advance.' },
        { start: 0.25, end: 0.42, text: 'The shape expands in possession. Wing-backs push high to provide max width.' },
        { start: 0.42, end: 0.58, text: 'Five attacking lanes are occupied in a 3-2-5 attacking shape, stretching the defense.' },
        { start: 0.58, end: 0.70, text: 'BRANCH_ANNOTATION_5' },
        { start: 0.70, end: 0.78, text: 'Possession is lost. Blue starts immediate defensive recovery.' },
        { start: 0.78, end: 0.92, text: 'The structure recovers defensively. Wing-backs drop to form the back five.' },
        { start: 0.92, end: 1.0, text: 'Summary: Dynamic shape transformation is key. Wing-backs maintain width and balance.' }
      ],

      // Camera Presets
      cameraPresets: [
        { start: 0.0, end: 0.12, preset: 'defensive_view' },
        { start: 0.12, end: 0.25, preset: 'wingback_view' },
        { start: 0.25, end: 0.58, preset: 'attacking_view' },
        { start: 0.58, end: 0.92, preset: 'transformation_view' },
        { start: 0.92, end: 1.0, preset: 'summary_view' }
      ]
    });
  }

  public getPhaseInfo(t: number) {
    const info = super.getPhaseInfo(t);
    if (info.name === 'Defensive Dilemma') {
      info.description = this.activeBranch === 'A' 
        ? 'Red full-backs track the wing-backs, leaving massive central space in the defensive line.' 
        : 'Red full-backs protect central zones, leaving the wing-backs free on the flanks.';
    }
    return info;
  }

  public getTeachingAnnotation(t: number): string {
    if (t >= 0.58 && t < 0.70) {
      return this.activeBranch === 'A'
        ? 'Defensive Dilemma: Red full-backs slide wide, opening central gaps for the inside forward run.'
        : 'Defensive Dilemma: Red full-backs stay narrow. The wing-back is left free in the wide channel.';
    }
    return super.getTeachingAnnotation(t);
  }
}
