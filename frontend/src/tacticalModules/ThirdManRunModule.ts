import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  HighlightZone, 
  HighlightPassingLane,
  PassBall, 
  DribbleBall,
  SetBallPosition,
  TriggerRun,
  HighlightCompactness,
  DefenderFollows,
  DefenderHolds,
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
      data: { concept_id: 'third_man_run', ...this.data },
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
// THIRD MAN RUN MODULE
//
// Blue Team (4-3-3 initial, attacking left->right)
// Red Team (4-4-2 initial, defending right->left)
// ─────────────────────────────────────────────────────────────────
export class ThirdManRunModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'third_man_run',
      name: 'Third Man Run',
      description: 'An attacking combination where Player A passes to Player B to attract defensive cover, while Player C makes a run into the newly created space to receive a one-touch lay-off pass.',
      durationSeconds: 16.0,

      primitives: [
        // 1. Formations Setup
        new FormationState('attack', '4-3-3', 'left',
          {
            'GK': { x: -44, z: 0 },
            'LCB': { x: -28, z: -8 },
            'RCB': { x: -28, z: 8 },
            'LB': { x: -20, z: -24 },
            'RB': { x: -20, z: 24 },
            'DM': { x: -14, z: 0 },
            'LCM': { x: -5, z: -10 },   // Player A
            'RCM': { x: -5, z: 10 },    // Player C (Third Man)
            'LW': { x: 12, z: -22 },
            'RW': { x: 12, z: 22 },
            'CF': { x: 22, z: 0 }       // Player B (Wall/Lay-off)
          },
          {
            'GK': 'blue_gk',
            'LCB': 'blue_cb_l',
            'RCB': 'blue_cb_r',
            'LB': 'blue_lb',
            'RB': 'blue_rb',
            'DM': 'blue_dm',
            'LCM': 'blue_cm_l',
            'RCM': 'blue_cm_r',
            'LW': 'blue_lw',
            'RW': 'blue_rw',
            'CF': 'blue_cf'
          }
        ),

        new FormationState('defend', '4-4-2', 'right',
          {
            'GK': { x: 44, z: 0 },
            'LCB': { x: 26, z: -6 },    // Key defender
            'RCB': { x: 26, z: 6 },
            'LB': { x: 24, z: -22 },
            'RB': { x: 24, z: 22 },
            'LM': { x: 12, z: -20 },
            'LCM': { x: 10, z: -7 },
            'RCM': { x: 10, z: 7 },
            'RM': { x: 12, z: 20 },
            'LST': { x: -2, z: -8 },
            'RST': { x: -2, z: 8 }
          },
          {
            'GK': 'red_gk',
            'LCB': 'red_cb_l',
            'RCB': 'red_cb_r',
            'LB': 'red_lb',
            'RB': 'red_rb',
            'LM': 'red_lm',
            'LCM': 'red_cm_l',
            'RCM': 'red_cm_r',
            'RM': 'red_rm',
            'LST': 'red_st_l',
            'RST': 'red_st_r'
          }
        ),

        // ─────────────────────────────────────────────────────────
        // GLOBAL STATIC PLAYER TIMELINES (0.0 to 1.0)
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_gk', { x: -44, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_cb_l', { x: -28, z: -8 }, 0.0, 1.0),
        new MovePlayer('blue_cb_r', { x: -28, z: 8 }, 0.0, 1.0),
        new MovePlayer('blue_lb', { x: -20, z: -24 }, 0.0, 1.0),
        new MovePlayer('blue_rb', { x: -20, z: 24 }, 0.0, 1.0),
        new MovePlayer('blue_dm', { x: -14, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_lw', { x: 12, z: -22 }, 0.0, 1.0),
        new MovePlayer('blue_cm_l', { x: -5, z: -10 }, 0.0, 1.0), // Player A stays supporting

        new MovePlayer('red_gk', { x: 44, z: 0 }, 0.0, 1.0),
        new MovePlayer('red_cb_r', { x: 26, z: 6 }, 0.0, 1.0),
        new MovePlayer('red_lb', { x: 24, z: -22 }, 0.0, 1.0),
        new MovePlayer('red_rb', { x: 24, z: 22 }, 0.0, 1.0),
        new MovePlayer('red_lm', { x: 12, z: -20 }, 0.0, 1.0),
        new MovePlayer('red_rm', { x: 12, z: 20 }, 0.0, 1.0),
        new MovePlayer('red_st_l', { x: -2, z: -8 }, 0.0, 1.0),
        new MovePlayer('red_st_r', { x: -2, z: 8 }, 0.0, 1.0),

        // ─────────────────────────────────────────────────────────
        // GLOBAL MOVING DEFENDERS (0.0 to 1.0)
        // ─────────────────────────────────────────────────────────
        new MovePlayer('red_cm_l', { x: 10, z: -7 }, 0.0, 0.15),
        new MovePlayer('red_cm_l', { x: 8, z: -4 }, 0.15, 0.30, 'sineInOut'),
        new MovePlayer('red_cm_l', { x: 8, z: -4 }, 0.30, 1.0),

        new MovePlayer('red_cm_r', { x: 10, z: 7 }, 0.0, 0.15),
        new MovePlayer('red_cm_r', { x: 8, z: 4 }, 0.15, 0.30, 'sineInOut'),
        new MovePlayer('red_cm_r', { x: 8, z: 4 }, 0.30, 1.0),

        new MovePlayer('red_cb_l', { x: 26, z: -6 }, 0.0, 0.45), // LCB holds until dilemma

        // ─────────────────────────────────────────────────────────
        // PLAYER B (CF) TIMELINE
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_cf', { x: 22, z: 0 }, 0.0, 0.15),
        new MovePlayer('blue_cf', { x: 14, z: -2 }, 0.15, 0.30, 'sineInOut'),
        new MovePlayer('blue_cf', { x: 14, z: -2 }, 0.30, 0.45),
        new MovePlayer('blue_cf', { x: 14, z: -2 }, 0.45, 0.60),

        // ─────────────────────────────────────────────────────────
        // PLAYER C (RCM / THIRD MAN) GLOBAL TIMELINE
        // ─────────────────────────────────────────────────────────
        new MovePlayer('blue_cm_r', { x: -5, z: 10 }, 0.0, 0.30),
        new TriggerRun('blue_cm_r', { x: 8, z: 12 }, 0.30, 0.45, 'sineInOut'),
        new MovePlayer('blue_cm_r', { x: 14, z: 10 }, 0.45, 0.60, 'sineInOut'),

        // ─────────────────────────────────────────────────────────
        // BALL TIMELINE
        // ─────────────────────────────────────────────────────────
        new SetBallPosition('blue_cm_l', 0.0),
        new SetBallPosition('blue_cm_l', 0.15),
        new PassBall('blue_cm_l', 'blue_cf', 0.15, 0.25),
        new SetBallPosition('blue_cf', 0.25),
        new SetBallPosition('blue_cf', 0.30),
        new SetBallPosition('blue_cf', 0.30),
        new SetBallPosition('blue_cf', 0.45),
        new SetBallPosition('blue_cf', 0.45),
        new SetBallPosition('blue_cf', 0.60),

        // ─────────────────────────────────────────────────────────
        // GLOBAL OVERLAYS & ARROWS
        // ─────────────────────────────────────────────────────────
        new HighlightPassingLane('blue_cm_l', 'blue_cf', 0.0, 0.15),
        new HighlightPassingLane('blue_cm_l', 'blue_lw', 0.0, 0.15),
        new HighlightCompactness('defend', 0.0, 0.15, '#FFCC00', 0.15),

        new HighlightZone('attraction_zone', OverlayType.CIRCLE, { center: 'blue_cf', radius: 7.5 }, 0.15, 0.30, '#FF0055', 0.2),
        new PassingArrow('pass_a_to_b', 'blue_cm_l', 'blue_cf', 0.15, 0.24, { color: '#00F3FF', width: 2 }),

        new MovementArrow('c_run_arrow_1', { x: -5, z: 10 }, { x: 8, z: 12 }, 0.30, 0.45, { color: '#39FF14', width: 2.2 }),

        new HighlightZone('created_space_overlay', OverlayType.CIRCLE, { center: { x: 26, z: -6 }, radius: 6.5 }, 0.45, 0.60, '#39FF14', 0.22),
        new MovementArrow('cb_press_arrow', { x: 26, z: -6 }, { x: 18, z: -3 }, 0.45, 0.58, { color: '#DC2626', width: 2 }),

        new AnalyticsTrigger('lesson_started', 0.02),
        new AnalyticsTrigger('first_pass_completed', 0.26),
        new AnalyticsTrigger('off_ball_run_started', 0.32),
        new AnalyticsTrigger('space_created', 0.50)
      ],

      branchPrimitives: {
        // ─────────────────────────────────────────────────────────
        // BRANCH A: Defender steps up to press. Player C runs behind.
        // ─────────────────────────────────────────────────────────
        A: [
          // Red LCB steps up completely
          new MovePlayer('red_cb_l', { x: 18, z: -3 }, 0.45, 0.60, 'sineInOut'),
          new MovePlayer('red_cb_l', { x: 18, z: -3 }, 0.60, 0.85),
          new MovePlayer('red_cb_l', { x: 30, z: -6 }, 0.85, 0.92, 'sineInOut'),
          new MovePlayer('red_cb_l', { x: 30, z: -6 }, 0.92, 1.0),

          // Player B static in Branch A
          new MovePlayer('blue_cf', { x: 14, z: -2 }, 0.60, 1.0),

          // Player C (RCM) runs behind LCB
          new TriggerRun('blue_cm_r', { x: 28, z: -8 }, 0.60, 0.72, 'cubicInOut'),
          new MovePlayer('blue_cm_r', { x: 28, z: -8 }, 0.72, 0.82),
          new MovePlayer('blue_cm_r', { x: 36, z: -8 }, 0.82, 0.92, 'sineInOut'),
          new MovePlayer('blue_cm_r', { x: 36, z: -8 }, 0.92, 1.0),

          // RW static in Branch A
          new MovePlayer('blue_rw', { x: 12, z: 22 }, 0.60, 1.0),

          // Ball: B -> C layoff -> Dribble into box
          new SetBallPosition('blue_cf', 0.60),
          new SetBallPosition('blue_cf', 0.72),
          new PassBall('blue_cf', 'blue_cm_r', 0.72, 0.82),
          new SetBallPosition('blue_cm_r', 0.82),
          new DribbleBall('blue_cm_r', 0.82, 0.92),
          new SetBallPosition('blue_cm_r', 0.92),
          new SetBallPosition('blue_cm_r', 1.0),

          new PassingArrow('pass_b_to_c_a', 'blue_cf', 'blue_cm_r', 0.72, 0.81, { color: '#00F3FF', width: 2.5 }),
          new MovementArrow('c_run_arrow_2_a', { x: 14, z: 10 }, { x: 28, z: -8 }, 0.60, 0.71, { color: '#39FF14', width: 3, dashSpeed: 1.2 }, true),

          // Overlays
          new HighlightZone('progression_path_a', OverlayType.POLYGON, {
            points: [
              { x: 14, z: -2 },
              { x: 28, z: -8 },
              { x: 36, z: -8 }
            ]
          }, 0.85, 1.0, '#39FF14', 0.2),
          new HighlightShapePolygon('summary_tri_a', ['blue_cm_l', 'blue_cf', 'blue_cm_r'], 0.92, 1.0, '#00F3FF', 0.22),
          new HighlightPassingLane('blue_cf', 'blue_cm_r', 0.60, 0.72),

          new DefenderFollows(0.50),
          new AnalyticsTrigger('third_man_activated', 0.65),
          new AnalyticsTrigger('final_pass_completed', 0.83),
          new AnalyticsTrigger('lesson_completed', 0.95)
        ],

        // ─────────────────────────────────────────────────────────
        // BRANCH B: Defender holds line. Player C receives in front.
        // ─────────────────────────────────────────────────────────
        B: [
          // Red LCB holds deep line
          new MovePlayer('red_cb_l', { x: 24, z: -6 }, 0.45, 0.60, 'sineInOut'),
          new MovePlayer('red_cb_l', { x: 24, z: -6 }, 0.60, 1.0),

          // Player B static in Branch B
          new MovePlayer('blue_cf', { x: 14, z: -2 }, 0.60, 1.0),

          // Player C (RCM) checks run in front of defensive line
          new MovePlayer('blue_cm_r', { x: 14, z: 8 }, 0.60, 0.72, 'sineInOut'),
          new MovePlayer('blue_cm_r', { x: 14, z: 8 }, 0.72, 1.0),

          // RW: static until trigger run in Branch B
          new MovePlayer('blue_rw', { x: 12, z: 22 }, 0.60, 0.80),
          new TriggerRun('blue_rw', { x: 28, z: 12 }, 0.80, 0.92, 'cubicInOut'),
          new MovePlayer('blue_rw', { x: 28, z: 12 }, 0.92, 1.0),

          // Ball: B -> C layoff -> Pass to RW inside
          new SetBallPosition('blue_cf', 0.60),
          new SetBallPosition('blue_cf', 0.72),
          new PassBall('blue_cf', 'blue_cm_r', 0.72, 0.80),
          new SetBallPosition('blue_cm_r', 0.80),
          new SetBallPosition('blue_cm_r', 0.84),
          new PassBall('blue_cm_r', 'blue_rw', 0.84, 0.90),
          new SetBallPosition('blue_rw', 0.90),
          new SetBallPosition('blue_rw', 1.0),

          new PassingArrow('pass_b_to_c_b', 'blue_cf', 'blue_cm_r', 0.72, 0.79, { color: '#00F3FF', width: 2.5 }),
          new MovementArrow('c_run_arrow_2_b', { x: 14, z: 10 }, { x: 14, z: 8 }, 0.60, 0.71, { color: '#39FF14', width: 2.2 }),
          new PassingArrow('pass_c_to_rw', 'blue_cm_r', 'blue_rw', 0.84, 0.89, { color: '#00F3FF', width: 2.5 }),
          new MovementArrow('rw_diagonal_run', { x: 12, z: 22 }, { x: 28, z: 12 }, 0.80, 0.90, { color: '#39FF14', width: 2.5 }),

          // Overlays
          new HighlightZone('progression_path_b', OverlayType.POLYGON, {
            points: [
              { x: 14, z: -2 },
              { x: 14, z: 8 },
              { x: 28, z: 12 }
            ]
          }, 0.85, 1.0, '#39FF14', 0.2),
          new HighlightShapePolygon('summary_tri_b', ['blue_cm_l', 'blue_cf', 'blue_cm_r'], 0.92, 1.0, '#00F3FF', 0.22),
          new HighlightPassingLane('blue_cf', 'blue_cm_r', 0.60, 0.72),

          new DefenderHolds(0.50),
          new AnalyticsTrigger('third_man_activated', 0.65),
          new AnalyticsTrigger('final_pass_completed', 0.81),
          new AnalyticsTrigger('lesson_completed', 0.95)
        ]
      },

      // Phase definitions
      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Initial Structure', description: 'Blue team establishes possession in midfield. The Red defensive block is organized and compact, closing down central paths.' },
        { index: 2, start: 0.15, end: 0.30, name: 'First Pass', description: 'Player A plays the ball forward to Player B, who drops deep. The pass immediately attracts the attention of the Red midfielders and defensive block.' },
        { index: 3, start: 0.30, end: 0.45, name: 'Off-Ball Trigger', description: 'As defenders shift focus to the ball carrier, Player C begins a subtle off-ball vertical run from deep to prepare the combination.' },
        { index: 4, start: 0.45, end: 0.60, name: 'Defensive Manipulation', description: 'Red center-back steps up to press Player B. This movement manipulates the defensive line, creating open space behind it.' },
        { index: 5, start: 0.60, end: 0.72, name: 'Third Man Activation', description: 'Player C accelerates his run into the created space. The correct timing of the run keeps him unmarked as a passing lane opens.' },
        { index: 6, start: 0.72, end: 0.85, name: 'Final Pass', description: 'Player B plays a quick one-touch lay-off pass. The third man receives the ball in stride, bypassing the shifted block.' },
        { index: 7, start: 0.85, end: 0.92, name: 'Attacking Advantage', description: 'Player C carries forward or releases a winger, capitalizing on the broken defensive line to progress the attack.' },
        { index: 8, start: 0.92, end: 1.0, name: 'Summary', description: 'The combination successfully breaks the defense. Timing, distraction, and off-ball movement from deep created the progression opportunity.' }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.15, text: 'Initial Shape: Attack against an organized midfield block.' },
        { start: 0.15, end: 0.30, text: 'The first pass attracts defenders. Shift block towards Player B.' },
        { start: 0.30, end: 0.45, text: 'Movement begins away from the ball. Player C starts a run from deep.' },
        { start: 0.45, end: 0.60, text: 'Space is created through distraction. Opponent steps up, opening gaps.' },
        { start: 0.60, end: 0.72, text: 'The third man attacks the opening. Run is timed to bypass markers.' },
        { start: 0.72, end: 0.85, text: 'The decisive pass becomes available. Player B lays it off one-touch.' },
        { start: 0.85, end: 0.92, text: 'Progression is achieved. The defensive line is successfully bypassed.' },
        { start: 0.92, end: 1.0, text: 'Summary: Decoy runs and third-man timing unlock compact defenses.' }
      ],

      // Camera Presets
      cameraPresets: [
        { start: 0.0, end: 0.30, preset: 'triangle_view' },
        { start: 0.30, end: 0.60, preset: 'offball_view' },
        { start: 0.60, end: 0.92, preset: 'route_view' },
        { start: 0.92, end: 1.0, preset: 'summary_view' }
      ]
    });
  }

  public getPhaseInfo(t: number) {
    const info = super.getPhaseInfo(t);
    if (info.name === 'Defensive Manipulation') {
      info.description = this.activeBranch === 'A' 
        ? 'Red center-back steps up aggressively to press, opening up massive space behind.' 
        : 'Red center-back holds his line to screen the run, keeping central spaces compact.';
    } else if (info.name === 'Third Man Activation') {
      info.description = this.activeBranch === 'A'
        ? 'Player C sprints into the vacated space behind the defender.'
        : 'Player C checks his run to receive the ball in space in front of the line.';
    }
    return info;
  }

  public getTeachingAnnotation(t: number): string {
    if (t >= 0.45 && t < 0.60) {
      return this.activeBranch === 'A'
        ? 'Decoy Attraction: Red defender steps up to press Player B, opening space in behind.'
        : 'Defensive Cover: Red defender holds deep to cover the run, keeping space narrow.';
    }
    if (t >= 0.60 && t < 0.72) {
      return this.activeBranch === 'A'
        ? 'Third Man Activation: Player C sprints into the vacated space behind the defender.'
        : 'Space Adaptation: Player C checks his run, exploiting the space in front of the line.';
    }
    return super.getTeachingAnnotation(t);
  }
}
