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
  RotatePositions,
  SupportRun,
  DefenderFollows,
  DefenderHolds,
  TacticalPrimitive,
  PrimitiveCompileContext
} from '../tacticalPrimitives';
import { OverlayType } from '../tacticalEngine/types';

// Simple primitive helper to record custom analytics triggers in the compile context
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
      data: {
        concept_id: 'midfield_overload',
        ...this.data
      }
    });
  }
}

// Custom primitive to compile a support triangle overlay dynamically from player positions
class HighlightSupportTriangle implements TacticalPrimitive {
  type = 'HighlightSupportTriangle';
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

export class MidfieldOverloadModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'midfield_overload',
      name: 'Midfield Overload',
      description: 'Creating numerical superiority in the middle third by dropping players and rotating midfielders to bypass defensive pressure and enable progressive play.',
      durationSeconds: 12.0,
      
      // Global primitives loaded for both branches
      primitives: [
        // 1. Initial positions
        new FormationState('attack', '4-3-3', 'left',
          {
            'GK': { x: -44, z: 0 },
            'LCB': { x: -28, z: -8 },
            'RCB': { x: -28, z: 8 },
            'LB': { x: -22, z: -24 },
            'RB': { x: -22, z: 24 },
            'DM': { x: -14, z: 0 },
            'LCM': { x: -5, z: -10 },
            'RCM': { x: -5, z: 10 },
            'LW': { x: 15, z: -22 },
            'RW': { x: 15, z: 22 },
            'CF': { x: 22, z: 0 }
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
            'LCB': { x: 26, z: -6 },
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

        // 2. Global movements (static / Phase 1 setup and Phase 2 progression)
        new MovePlayer('blue_gk', { x: -44, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_cb_l', { x: -28, z: -8 }, 0.0, 1.0),
        new MovePlayer('blue_cb_r', { x: -28, z: 8 }, 0.0, 1.0),
        new MovePlayer('blue_lb', { x: -22, z: -24 }, 0.0, 1.0),
        new MovePlayer('blue_rb', { x: -22, z: 24 }, 0.0, 1.0),

        // Blue DM drops to pick up the ball
        new MovePlayer('blue_dm', { x: -24, z: 0 }, 0.15, 0.40, 'quadInOut'),
        new MovePlayer('blue_dm', { x: -24, z: 0 }, 0.40, 1.0),

        // Blue midfielders rotate
        new RotatePositions(['blue_cm_l', 'blue_cm_r'], 0.15, 0.40, 'quadInOut'),
        new MovePlayer('blue_cm_l', { x: -5, z: 10 }, 0.40, 1.0),

        // Red strikers shift slightly to press the DM drop
        new MovePlayer('red_st_l', { x: -14, z: -4 }, 0.15, 0.40),
        new MovePlayer('red_st_l', { x: -14, z: -4 }, 0.40, 1.0),
        new MovePlayer('red_st_r', { x: -14, z: 4 }, 0.15, 0.40),
        new MovePlayer('red_st_r', { x: -14, z: 4 }, 0.40, 1.0),

        // Red defense/midfield standard positions
        new MovePlayer('red_gk', { x: 44, z: 0 }, 0.0, 1.0),
        new MovePlayer('red_cb_l', { x: 26, z: -6 }, 0.0, 1.0),
        new MovePlayer('red_cb_r', { x: 26, z: 6 }, 0.0, 1.0),
        new MovePlayer('red_lb', { x: 24, z: -22 }, 0.0, 1.0),
        new MovePlayer('red_rb', { x: 24, z: 22 }, 0.0, 1.0),
        new MovePlayer('red_lm', { x: 12, z: -20 }, 0.0, 1.0),
        new MovePlayer('red_rm', { x: 12, z: 20 }, 0.0, 1.0),
        new MovePlayer('red_cm_r', { x: 10, z: 7 }, 0.0, 1.0),

        // Ball setup
        new SetBallPosition('blue_cb_l', 0.0),
        new SetBallPosition('blue_cb_l', 0.20),
        new PassBall('blue_cb_l', 'blue_cm_r', 0.20, 0.40),

        // Passing lane 1 (Phase 2)
        new PassingArrow('pass_1', 'blue_cb_l', { x: -5, z: -10 }, 0.20, 0.38, { color: '#00F3FF', width: 2 }),

        // Phase 3 Highlight Overload Zone
        new HighlightZone('midfield_zone', OverlayType.CIRCLE, { center: { x: 2, z: -10 }, radius: 10.0 }, 0.40, 0.60, '#39FF14', 0.15),
        new HighlightNumericalAdvantage({ x: 2, z: -10 }, 10.0, 0.40, 0.60, '#00F3FF', 0.20),

        // Analytics events
        new AnalyticsTrigger('overload_created', 0.38),
        new AnalyticsTrigger('numerical_advantage_detected', 0.45)
      ],

      // Branch-specific primitives
      branchPrimitives: {
        A: [
          // Blue LW narrows and makes support run
          new SupportRun('blue_lw', { x: 4, z: -14 }, 0.15, 0.40, 'quadInOut'),
          new MovePlayer('blue_lw', { x: 4, z: -14 }, 0.40, 0.60),
          new SupportRun('blue_lw', { x: 14, z: -10 }, 0.60, 0.75, 'cubicInOut'),
          new MovePlayer('blue_lw', { x: 14, z: -10 }, 0.75, 0.90),
          new MovePlayer('blue_lw', { x: 14, z: -10 }, 0.90, 1.0),

          // Blue RCM (who rotated to the left) stays in Phase 3
          new MovePlayer('blue_cm_r', { x: -5, z: -10 }, 0.40, 0.60),
          new MovePlayer('blue_cm_r', { x: -5, z: -10 }, 0.60, 1.0),

          // Blue RW and CF
          new MovePlayer('blue_rw', { x: 15, z: 22 }, 0.0, 1.0),
          new MovePlayer('blue_cf', { x: 22, z: 0 }, 0.0, 0.90),
          new MovePlayer('blue_cf', { x: 34, z: -5 }, 0.90, 0.98, 'cubicInOut'),
          new MovePlayer('blue_cf', { x: 34, z: -5 }, 0.98, 1.0),

          // Red LCM follows the movement in Phase 4
          new MovePlayer('red_cm_l', { x: 10, z: -7 }, 0.0, 0.60),
          new MovePlayer('red_cm_l', { x: -2, z: -8 }, 0.60, 0.75, 'quadInOut'),
          new MovePlayer('red_cm_l', { x: -2, z: -8 }, 0.75, 1.0),

          // Ball pass 2: CM -> LW (Phase 5)
          new PassBall('blue_cm_r', 'blue_lw', 0.75, 0.88),
          
          // Ball pass 3: LW -> CF (Phase 6)
          new PassBall('blue_lw', 'blue_cf', 0.90, 0.98),
          new DribbleBall('blue_cf', 0.98, 1.0),

          // Arrows
          new MovementArrow('arrow_lw_narrow', { x: 15, z: -22 }, { x: 4, z: -14 }, 0.15, 0.40, { color: '#39FF14', width: 2 }),
          new MovementArrow('arrow_cm_follow', { x: 10, z: -7 }, { x: -2, z: -8 }, 0.60, 0.75, { color: '#DC2626', width: 2.5 }),
          new MovementArrow('arrow_lw_run', { x: 4, z: -14 }, { x: 14, z: -10 }, 0.60, 0.75, { color: '#39FF14', width: 3, dashSpeed: 1.2 }, true),
          new PassingArrow('pass_lane_2', { x: -5, z: -10 }, { x: 14, z: -10 }, 0.75, 0.86, { color: '#00F3FF', width: 2.5 }),
          new PassingArrow('pass_lane_3', { x: 14, z: -10 }, { x: 34, z: -5 }, 0.90, 0.96, { color: '#00F3FF', width: 2.5 }),

          // Overlays
          new HighlightZone('space_creation_overlay', OverlayType.CIRCLE, { center: { x: 10, z: -7 }, radius: 5.0 }, 0.60, 0.90, '#FF0055', 0.20),
          new HighlightZone('free_player_ind', OverlayType.CIRCLE, { center: 'blue_lw', radius: 4.0 }, 0.75, 0.90, '#FFFF00', 0.25),
          new HighlightSupportTriangle('support_tri', ['blue_cm_r', 'blue_lw', 'blue_cf'], 0.75, 0.90),
          new HighlightZone('progression_path', OverlayType.POLYGON, {
            points: [
              { x: 4, z: -14 },
              { x: 14, z: -10 },
              { x: 34, z: -5 }
            ]
          }, 0.98, 1.0, '#39FF14', 0.22),

          // Decision event & analytics triggers
          new DefenderFollows(0.62),
          new AnalyticsTrigger('free_player_created', 0.70),
          new AnalyticsTrigger('midfield_progression', 0.92),
          new AnalyticsTrigger('lesson_completed', 0.98)
        ],
        B: [
          // Blue LW narrows and makes support run
          new SupportRun('blue_lw', { x: 4, z: -14 }, 0.15, 0.40, 'quadInOut'),
          new MovePlayer('blue_lw', { x: 4, z: -14 }, 0.40, 0.60),
          new MovePlayer('blue_lw', { x: 10, z: -18 }, 0.60, 0.75, 'quadInOut'),
          new MovePlayer('blue_lw', { x: 10, z: -18 }, 0.75, 0.90),
          new MovePlayer('blue_lw', { x: 10, z: -18 }, 0.90, 1.0),

          // Blue RCM (who rotated to the left) stays in Phase 3
          new MovePlayer('blue_cm_r', { x: -5, z: -10 }, 0.40, 0.60),
          new MovePlayer('blue_cm_r', { x: -5, z: -10 }, 0.60, 1.0),

          // Blue RW and CF
          new MovePlayer('blue_cf', { x: 22, z: 0 }, 0.0, 1.0),
          new MovePlayer('blue_rw', { x: 15, z: 22 }, 0.0, 0.90),
          new MovePlayer('blue_rw', { x: 30, z: 8 }, 0.90, 0.98, 'cubicInOut'),
          new MovePlayer('blue_rw', { x: 30, z: 8 }, 0.98, 1.0),

          // Red LCM holds position
          new MovePlayer('red_cm_l', { x: 10, z: -7 }, 0.0, 1.0),

          // Ball dribble: RCM is free to receive and carry (Phase 5)
          new DribbleBall('blue_cm_r', 0.75, 0.88),

          // Ball pass 3: CM -> RW (Phase 6)
          new PassBall('blue_cm_r', 'blue_rw', 0.90, 0.98),
          new DribbleBall('blue_rw', 0.98, 1.0),

          // Arrows
          new MovementArrow('arrow_lw_narrow', { x: 15, z: -22 }, { x: 4, z: -14 }, 0.15, 0.40, { color: '#39FF14', width: 2 }),
          new MovementArrow('arrow_cm_hold', { x: 10, z: -7 }, { x: 10, z: -7 }, 0.60, 0.75, { color: '#DC2626', width: 2 }),
          new MovementArrow('arrow_cm_dribble', { x: -5, z: -10 }, { x: 8, z: -6 }, 0.75, 0.88, { color: '#39FF14', width: 2.5, dashSpeed: 1.0 }, true),
          new PassingArrow('pass_lane_3_b', { x: 8, z: -6 }, { x: 30, z: 8 }, 0.90, 0.96, { color: '#00F3FF', width: 2.5 }),

          // Overlays
          new HighlightZone('space_creation_overlay', OverlayType.CIRCLE, { center: { x: -5, z: -10 }, radius: 5.5 }, 0.60, 0.90, '#39FF14', 0.20),
          new HighlightZone('free_player_ind', OverlayType.CIRCLE, { center: 'blue_cm_r', radius: 4.0 }, 0.75, 0.90, '#FFFF00', 0.25),
          new HighlightPassingLane('blue_cm_r', 'blue_lw', 0.75, 0.90),
          new HighlightPassingLane('blue_cm_r', 'blue_rw', 0.75, 0.90),
          new HighlightZone('progression_path', OverlayType.POLYGON, {
            points: [
              { x: -5, z: -10 },
              { x: 30, z: 8 }
            ]
          }, 0.98, 1.0, '#39FF14', 0.22),

          // Decision event & analytics triggers
          new DefenderHolds(0.62),
          new AnalyticsTrigger('free_player_created', 0.70),
          new AnalyticsTrigger('midfield_progression', 0.92),
          new AnalyticsTrigger('lesson_completed', 0.98)
        ]
      },

      // Phase segments
      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Balanced Situation', description: 'Both teams display a balanced shape with equal numbers in midfield. No side has a positional or numerical advantage.' },
        { index: 2, start: 0.15, end: 0.40, name: 'Overload Creation', description: 'Blue DM drops to form a back three, LCM and RCM rotate positions, and LW narrows, pulling defenders and creating midfield overload.' },
        { index: 3, start: 0.40, end: 0.60, name: 'Numerical Superiority', description: 'Blue establishes a 4v3 numerical superiority in the central midfield overload zone, dominating options.' },
        { index: 4, start: 0.60, end: 0.75, name: 'Defensive Dilemma', description: 'Red LCM faces a dilemma: step out to press the ball carrier or hold position.' },
        { index: 5, start: 0.75, end: 0.90, name: 'Free Player Found', description: 'The defensive decision creates a free player who is found unmarked in space.' },
        { index: 6, start: 0.90, end: 0.98, name: 'Progression', description: 'Blue exploits the free player to break lines and progress forward, bypassing the midfield block.' },
        { index: 7, start: 0.98, end: 1.0, name: 'Summary', description: 'The overload successfully broke the defensive structure, creating numerical superiority, a free player, and progression.' }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.15, text: 'Initial State: Balanced midfield match-up with equal numbers.' },
        { start: 0.15, end: 0.40, text: 'Overload Creation: Blue DM drops, midfielders rotate, and LW narrows centrally.' },
        { start: 0.40, end: 0.60, text: 'Midfield Overload: Blue now enjoys a 4v3 numerical advantage in the central zone.' },
        { start: 0.60, end: 0.75, text: 'BRANCH_ANNOTATION_4' },
        { start: 0.75, end: 0.90, text: 'BRANCH_ANNOTATION_5' },
        { start: 0.90, end: 0.98, text: 'BRANCH_ANNOTATION_6' },
        { start: 0.98, end: 1.0, text: 'Summary: Positional superiority achieved. The midfield block is successfully bypassed.' }
      ]
    });
  }

  public getPhaseInfo(t: number) {
    const info = super.getPhaseInfo(t);
    if (info.name === 'Defensive Dilemma') {
      info.description = this.activeBranch === 'A' 
        ? 'Red LCM follows the rotating player, leaving space vacant behind him.' 
        : 'Red LCM holds his position, allowing the rotated Blue midfielder to remain unmarked.';
    } else if (info.name === 'Free Player Found') {
      info.description = this.activeBranch === 'A'
        ? 'LW makes a diagonal run into the vacated space behind, emerging as the free player.'
        : 'Blue midfielder turns in space, with passing lanes open to both wingers.';
    }
    return info;
  }

  public getTeachingAnnotation(t: number): string {
    if (t >= 0.60 && t < 0.75) {
      return this.activeBranch === 'A'
        ? 'Defensive Dilemma: Red LCM follows the midfielder, leaving space behind.'
        : 'Defensive Dilemma: Red LCM holds, leaving the rotated midfielder free in space.';
    }
    if (t >= 0.75 && t < 0.90) {
      return this.activeBranch === 'A'
        ? 'Free Player Found: Blue LW is found unmarked in the vacated space behind.'
        : 'Free Player Found: Blue midfielder turns in space, looking for progression lanes.';
    }
    if (t >= 0.90 && t < 0.98) {
      return this.activeBranch === 'A'
        ? 'Progression: Blue breaks the line, releasing the striker diagonally into the box.'
        : 'Progression: Blue progresses the ball wide to the winger cutting inside behind the line.';
    }
    return super.getTeachingAnnotation(t);
  }
}
