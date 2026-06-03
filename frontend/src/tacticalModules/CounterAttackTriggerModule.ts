import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  CounterArrow,
  HighlightZone, 
  HighlightPassingLane,
  HighlightNumericalAdvantage,
  HighlightChannel,
  PassBall, 
  DribbleBall,
  SetBallPosition,
  TriggerRun,
  SupportRun,
  PossessionWon,
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
        concept_id: 'counter_attack_trigger',
        ...this.data
      }
    });
  }
}

export class CounterAttackTriggerModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'counter_attack_trigger',
      name: 'Counter-Attack Trigger',
      description: 'Understanding transition moments, exploiting space vacated by the opponent\'s attacking commitment, and using timing to penetrate their structure before they can reorganize.',
      durationSeconds: 12.0,
      
      primitives: [
        // 1. Initial positions
        // Blue Defending 4-3-3 (attack, left)
        new FormationState('attack', '4-3-3', 'left',
          {
            'GK': { x: -44, z: 0 },
            'LCB': { x: -28, z: -8 },
            'RCB': { x: -28, z: 8 },
            'LB': { x: -22, z: -22 },
            'RB': { x: -22, z: 22 },
            'DM': { x: -10, z: -4 },
            'LCM': { x: -8, z: -10 },
            'RCM': { x: -6, z: 12 },
            'LW': { x: 2, z: -18 },
            'RW': { x: 2, z: 18 },
            'CF': { x: 8, z: 0 }
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
        // Red Attacking 4-4-2 (defend, right, pushed extremely high)
        new FormationState('defend', '4-4-2', 'right',
          {
            'GK': { x: 44, z: 0 },
            'LCB': { x: 14, z: -8 },
            'RCB': { x: 14, z: 8 },
            'LB': { x: -2, z: -25 },
            'RB': { x: -2, z: 25 },
            'LM': { x: -10, z: -22 },
            'LCM': { x: -8, z: -6 },
            'RCM': { x: -8, z: 6 },
            'RM': { x: -10, z: 22 },
            'LST': { x: -22, z: -8 },
            'RST': { x: -22, z: 8 }
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

        // Static setups
        new MovePlayer('blue_gk', { x: -44, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_cb_l', { x: -28, z: -8 }, 0.0, 1.0),
        new MovePlayer('blue_cb_r', { x: -28, z: 8 }, 0.0, 1.0),
        new MovePlayer('blue_lb', { x: -22, z: -24 }, 0.0, 1.0),
        new MovePlayer('blue_rb', { x: -22, z: 24 }, 0.0, 1.0),

        new MovePlayer('red_gk', { x: 44, z: 0 }, 0.0, 1.0),
        new MovePlayer('red_lm', { x: -10, z: -22 }, 0.0, 1.0),
        new MovePlayer('red_rm', { x: -10, z: 22 }, 0.0, 1.0),
        new MovePlayer('red_cm_l', { x: -8, z: -6 }, 0.0, 1.0),
        new MovePlayer('red_cm_r', { x: -8, z: 6 }, 0.0, 1.0),
        new MovePlayer('red_st_l', { x: -22, z: -8 }, 0.0, 1.0),
        new MovePlayer('red_st_r', { x: -22, z: 8 }, 0.0, 1.0),

        // Phase 1: Opponent Attack
        new HighlightZone('attacking_commitment', OverlayType.RECTANGLE, { center: { x: -8, z: 0 }, bounds: { width: 30, length: 50, rotation: 0 } }, 0.0, 0.15, '#FF0055', 0.12),

        // Phase 2: Possession Recovery
        new SetBallPosition('red_cm_r', 0.0),
        new SetBallPosition('red_cm_r', 0.15),
        new PassBall('red_cm_r', 'blue_dm', 0.15, 0.20),
        new PossessionWon(0.20),
        new HighlightZone('recovery_zone', OverlayType.CIRCLE, { center: { x: -9, z: -5 }, radius: 6.0 }, 0.18, 0.35, '#39FF14', 0.20),
        new MovePlayer('blue_dm', { x: -10, z: -4 }, 0.0, 0.45),

        // Phase 3 & 4: Counter Trigger & Runs
        new HighlightZone('transition_space', OverlayType.RECTANGLE, { center: { x: 28, z: 0 }, bounds: { width: 28, length: 50, rotation: 0 } }, 0.30, 0.45, '#39FF14', 0.12),
        new HighlightChannel('right_wing', 0.30, 0.45, '#00F3FF', 0.15),

        // Blue forward sprints
        new TriggerRun('blue_cf', { x: 28, z: -4 }, 0.30, 0.45, 'quadInOut'),
        new MovePlayer('blue_cf', { x: 28, z: -4 }, 0.45, 0.65),
        new MovePlayer('blue_cf', { x: 30, z: -3 }, 0.65, 0.82, 'quadInOut'),
        new MovePlayer('blue_cf', { x: 30, z: -3 }, 0.82, 1.0),

        new TriggerRun('blue_rw', { x: 22, z: 18 }, 0.30, 0.45, 'quadInOut'),
        new MovePlayer('blue_rw', { x: 22, z: 18 }, 0.45, 0.65),
        new SupportRun('blue_rw', { x: 26, z: 12 }, 0.65, 0.80, 'quadInOut'),
        new MovePlayer('blue_rw', { x: 34, z: 6 }, 0.80, 1.0),

        new SupportRun('blue_lw', { x: 18, z: -15 }, 0.30, 0.45, 'quadInOut'),
        new MovePlayer('blue_lw', { x: 18, z: -15 }, 0.45, 0.65),
        new SupportRun('blue_lw', { x: 24, z: -10 }, 0.65, 0.80, 'quadInOut'),
        new MovePlayer('blue_lw', { x: 28, z: -6 }, 0.80, 1.0),

        new MovePlayer('blue_cm_r', { x: 6, z: 10 }, 0.30, 0.45, 'quadInOut'),
        new MovePlayer('blue_cm_r', { x: 6, z: 10 }, 0.45, 0.65),
        new MovePlayer('blue_cm_r', { x: 12, z: 8 }, 0.65, 1.0),

        new MovePlayer('blue_cm_l', { x: -8, z: -10 }, 0.0, 1.0),

        // Red defense runs back to recover (Phase 5)
        new MovePlayer('red_cb_l', { x: 14, z: -8 }, 0.0, 0.45),
        new MovePlayer('red_cb_l', { x: 26, z: -6 }, 0.45, 0.80, 'sineInOut'),
        new MovePlayer('red_cb_l', { x: 26, z: -6 }, 0.80, 1.0),

        new MovePlayer('red_cb_r', { x: 14, z: 8 }, 0.0, 0.45),
        new MovePlayer('red_cb_r', { x: 28, z: 4 }, 0.45, 0.80, 'sineInOut'),
        new MovePlayer('red_cb_r', { x: 28, z: 4 }, 0.80, 1.0),

        new MovePlayer('red_lb', { x: -2, z: -25 }, 0.0, 0.45),
        new MovePlayer('red_lb', { x: 20, z: -18 }, 0.45, 0.80, 'sineInOut'),
        new MovePlayer('red_lb', { x: 20, z: -18 }, 0.80, 1.0),

        new MovePlayer('red_rb', { x: -2, z: 25 }, 0.0, 0.45),
        new MovePlayer('red_rb', { x: 22, z: 18 }, 0.45, 0.80, 'sineInOut'),
        new MovePlayer('red_rb', { x: 22, z: 18 }, 0.80, 1.0),

        // Ball progression (Phase 4)
        new PassBall('blue_dm', 'blue_cm_r', 0.32, 0.45),
        new PassBall('blue_cm_r', 'blue_cf', 0.48, 0.65),

        // Passing arrows
        new PassingArrow('pass_outlet', 'blue_dm', 'blue_cm_r', 0.32, 0.43, { color: '#00F3FF', width: 2 }),
        new PassingArrow('pass_release', 'blue_cm_r', 'blue_cf', 0.48, 0.63, { color: '#00F3FF', width: 2.5 }),
        new CounterArrow('counter_path', 'blue_cm_r', 'blue_cf', 0.45, 0.65),

        // Phase 5: Red recovery arrows
        new MovementArrow('recovery_lcb', { x: 14, z: -8 }, { x: 26, z: -6 }, 0.65, 0.80, { color: '#DC2626', width: 2 }),
        new MovementArrow('recovery_rcb', { x: 14, z: 8 }, { x: 28, z: 4 }, 0.65, 0.80, { color: '#DC2626', width: 2 }),

        // Phase 6: Advantage Exploited
        new HighlightNumericalAdvantage({ x: 28, z: 0 }, 12.0, 0.80, 0.95, '#00F3FF', 0.20),
        new DribbleBall('blue_cf', 0.65, 0.82),
        new PassBall('blue_cf', 'blue_rw', 0.82, 0.95),
        new PassingArrow('pass_lane_back_post', 'blue_cf', 'blue_rw', 0.82, 0.93, { color: '#00F3FF', width: 2.5 }),
        new HighlightPassingLane('blue_cf', 'blue_rw', 0.82, 0.95),

        // Blue DM supporting progression (Phase 4 onwards)
        new MovePlayer('blue_dm', { x: -8, z: -2 }, 0.45, 0.65),
        new MovePlayer('blue_dm', { x: -8, z: -2 }, 0.65, 1.0),

        // Phase 7: Summary freeze
        new HighlightZone('summary_exploited_space', OverlayType.POLYGON, {
          points: [
            { x: -10, z: -4 },
            { x: 6, z: 10 },
            { x: 28, z: -4 },
            { x: 26, z: 12 }
          ]
        }, 0.95, 1.0, '#39FF14', 0.18),

        // Analytics triggers
        new AnalyticsTrigger('possession_recovered', 0.20),
        new AnalyticsTrigger('counter_triggered', 0.32),
        new AnalyticsTrigger('space_identified', 0.38),
        new AnalyticsTrigger('recovery_attempt_started', 0.50),
        new AnalyticsTrigger('advantage_exploited', 0.82),
        new AnalyticsTrigger('lesson_completed', 0.98)
      ],

      // Camera views
      cameraPresets: [
        { start: 0.0, end: 0.15, preset: 'overview' },
        { start: 0.15, end: 0.30, preset: 'transition' },
        { start: 0.30, end: 0.65, preset: 'counter_channel' },
        { start: 0.65, end: 0.95, preset: 'recovery_race' },
        { start: 0.95, end: 1.0, preset: 'summary' }
      ],

      // Phase segments
      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Opponent Attack', description: 'Red commits multiple players forward, spreading fullbacks wide and pushing midfielders high.' },
        { index: 2, start: 0.15, end: 0.30, name: 'Possession Recovery', description: 'Blue wins possession centrally through an interception, triggering the transition moment.' },
        { index: 3, start: 0.30, end: 0.45, name: 'Counter Trigger', description: 'Blue players immediately recognize space, sprinting vertically into open channels.' },
        { index: 4, start: 0.45, end: 0.65, name: 'Immediate Progression', description: 'Blue plays a rapid outlet pass followed by a direct release behind Red\'s high line.' },
        { index: 5, start: 0.65, end: 0.80, name: 'Defensive Recovery Attempt', description: 'Red defense attempts to sprint back and compress space in a race against organization.' },
        { index: 6, start: 0.80, end: 0.95, name: 'Advantage Exploited', description: 'Blue accesses the final third, establishing a 3v2 numerical advantage to score.' },
        { index: 7, start: 0.95, end: 1.0, name: 'Summary', description: 'A freeze-frame of the transition showing how timing and space created a counter-attacking success.' }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.15, text: 'Opponent Attack: Red is committed forward and structurally stretched.' },
        { start: 0.15, end: 0.30, text: 'Possession changes hands: Blue wins the ball centrally.' },
        { start: 0.30, end: 0.45, text: 'Space appears immediately: Blue triggers vertical outlet runs.' },
        { start: 0.45, end: 0.65, text: 'Immediate Progression: Direct passes bypass Red\'s advanced block.' },
        { start: 0.65, end: 0.80, text: 'Defensive Recovery: Red sprints backward in a race against timing.' },
        { start: 0.80, end: 0.95, text: 'Advantage Exploited: Numerical superiority creates a free shot at the back post.' },
        { start: 0.95, end: 1.0, text: 'Summary: Exploited space and timing yield a counter-attacking goal.' }
      ]
    });
  }
}
