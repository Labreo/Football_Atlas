import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import {
  FormationState,
  MovePlayer,
  PassingArrow,
  MovementArrow,
  HighlightZone,
  HighlightCompactness,
  PassBall,
  SetBallPosition,
  DribbleBall,
  TacticalPrimitive,
  PrimitiveCompileContext,
} from '../tacticalPrimitives';
import { OverlayType } from '../tacticalEngine/types';

// ─────────────────────────────────────────────────────────────────
// LOCAL ANALYTICS TRIGGER PRIMITIVE
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
      data: { concept_id: 'compactness_pressing_lines', ...this.data },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// COMPACTNESS & PRESSING LINES MODULE
// ─────────────────────────────────────────────────────────────────
export class CompactnessPressingLinesModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'compactness_pressing_lines',
      name: 'Compactness & Pressing Lines',
      description: 'A defensive lesson demonstrating how maintaining short distances between players and lines enables successful pressing, while a loss of compactness creates dangerous gaps that the opposition can exploit.',
      durationSeconds: 16.0,

      primitives: [
        // 1. Red Attacking Team Setup (4-3-3 shape)
        new FormationState('defend', '4-3-3', 'left',
          {
            'GK': { x: -42, z: 0 },
            'RCB': { x: -15, z: 10 },
            'LCB': { x: -15, z: -10 },
            'RB': { x: -5, z: 26 },
            'LB': { x: -5, z: -26 },
            'DM': { x: -8, z: 0 },
            'LCM': { x: 2, z: -12 },
            'RCM': { x: 2, z: 12 },
            'RW': { x: 15, z: 26 },
            'LW': { x: 15, z: -26 },
            'CF': { x: 14, z: 0 }
          },
          {
            'GK': 'red_gk',
            'RCB': 'red_rcb',
            'LCB': 'red_lcb',
            'RB': 'red_rb',
            'LB': 'red_lb',
            'DM': 'red_dm',
            'LCM': 'red_lcm',
            'RCM': 'red_rcm',
            'RW': 'red_rw',
            'LW': 'red_lw',
            'CF': 'red_cf'
          }
        ),

        // 2. Blue Defending Team Setup (Compact 4-4-2 shape)
        new FormationState('attack', '4-4-2', 'right',
          {
            'GK': { x: 45, z: 0 },
            'RB': { x: 25, z: 14 },
            'RCB': { x: 25, z: 4.5 },
            'LCB': { x: 25, z: -4.5 },
            'LB': { x: 25, z: -14 },
            'RM': { x: 17, z: 13 },
            'RCM': { x: 17, z: 4 },
            'LCM': { x: 17, z: -4 },
            'LM': { x: 17, z: -13 },
            'RST': { x: 9, z: 3 },
            'LST': { x: 9, z: -3 }
          },
          {
            'GK': 'blue_gk',
            'RB': 'blue_rb',
            'RCB': 'blue_rcb',
            'LCB': 'blue_lcb',
            'LB': 'blue_lb',
            'RM': 'blue_rm',
            'RCM': 'blue_rcm',
            'LCM': 'blue_lcm',
            'LM': 'blue_lm',
            'RST': 'blue_r_st',
            'LST': 'blue_l_st'
          }
        ),

        // 3. Static/Ambient Player Trajectories (0.0 -> 1.0)
        new MovePlayer('red_gk', { x: -42, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_gk', { x: 45, z: 0 }, 0.0, 1.0),

        // Red wingers and fullbacks stretching the width
        new MovePlayer('red_rb', { x: -5, z: 26 }, 0.0, 0.12),
        new MovePlayer('red_rb', { x: 0, z: 28 }, 0.12, 0.50),

        new MovePlayer('red_rw', { x: 15, z: 26 }, 0.0, 0.12),
        new MovePlayer('red_rw', { x: 18, z: 28 }, 0.12, 0.50),

        new MovePlayer('red_lw', { x: 15, z: -26 }, 0.0, 0.12),
        new MovePlayer('red_lw', { x: 20, z: -30 }, 0.12, 0.25),
        new MovePlayer('red_lw', { x: 20, z: -30 }, 0.25, 0.50),

        new MovePlayer('red_cf', { x: 14, z: 0 }, 0.0, 0.12),
        new MovePlayer('red_cf', { x: 16, z: -8 }, 0.12, 0.25),
        new MovePlayer('red_cf', { x: 16, z: -2 }, 0.25, 0.50),

        // 4. SHARED TIMELINE: PHASES 1 - 4 (0.0 -> 0.50)

        // Phase 1: Ball at LCB
        new SetBallPosition('red_lcb', 0.0),
        new SetBallPosition('red_lcb', 0.12),

        // Phase 2: Circulation to LB
        new PassBall('red_lcb', 'red_lb', 0.12, 0.20),
        new SetBallPosition('red_lb', 0.20),
        new SetBallPosition('red_lb', 0.25),

        new MovePlayer('red_lb', { x: -5, z: -26 }, 0.0, 0.12),
        new MovePlayer('red_lb', { x: 0, z: -28 }, 0.12, 0.25),

        new MovePlayer('red_lcb', { x: -15, z: -10 }, 0.0, 0.12),
        new MovePlayer('red_lcb', { x: -12, z: -8 }, 0.12, 0.25),

        new MovePlayer('red_lcm', { x: 2, z: -12 }, 0.0, 0.12),
        new MovePlayer('red_lcm', { x: 4, z: -18 }, 0.12, 0.25),

        // Blue Horizontal Shift
        new MovePlayer('blue_rb', { x: 25, z: 14 }, 0.0, 0.12),
        new MovePlayer('blue_rb', { x: 24, z: 9 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_rcb', { x: 25, z: 4.5 }, 0.0, 0.12),
        new MovePlayer('blue_rcb', { x: 24, z: -0.5 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_lcb', { x: 25, z: -4.5 }, 0.0, 0.12),
        new MovePlayer('blue_lcb', { x: 24, z: -9.5 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_lb', { x: 25, z: -14 }, 0.0, 0.12),
        new MovePlayer('blue_lb', { x: 24, z: -19 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_rm', { x: 17, z: 13 }, 0.0, 0.12),
        new MovePlayer('blue_rm', { x: 16, z: 8 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_rcm', { x: 17, z: 4 }, 0.0, 0.12),
        new MovePlayer('blue_rcm', { x: 16, z: -1 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_lcm', { x: 17, z: -4 }, 0.0, 0.12),
        new MovePlayer('blue_lcm', { x: 16, z: -9 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_lm', { x: 17, z: -13 }, 0.0, 0.12),
        new MovePlayer('blue_lm', { x: 16, z: -18 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_r_st', { x: 9, z: 3 }, 0.0, 0.12),
        new MovePlayer('blue_r_st', { x: 8, z: -2 }, 0.12, 0.25, 'quadInOut'),

        new MovePlayer('blue_l_st', { x: 9, z: -3 }, 0.0, 0.12),
        new MovePlayer('blue_l_st', { x: 8, z: -8 }, 0.12, 0.25, 'quadInOut'),

        // Phase 3: Pass back to LCB then DM
        new PassBall('red_lb', 'red_lcb', 0.25, 0.30),
        new PassBall('red_lcb', 'red_dm', 0.30, 0.38),
        new SetBallPosition('red_dm', 0.38),

        new MovePlayer('red_lb', { x: 0, z: -28 }, 0.25, 0.38),
        new MovePlayer('red_lcb', { x: -12, z: -8 }, 0.25, 0.30),
        new MovePlayer('red_lcb', { x: -10, z: -6 }, 0.30, 0.38),

        new MovePlayer('red_lcm', { x: 4, z: -18 }, 0.25, 0.38),
        new MovePlayer('red_dm', { x: -8, z: 0 }, 0.0, 0.25),
        new MovePlayer('red_dm', { x: -6, z: -2 }, 0.25, 0.38),

        // Blue Vertical Compactness (strikers drop, defenders step up)
        new MovePlayer('blue_rb', { x: 24, z: 9 }, 0.25, 0.38, 'quadInOut'),
        new MovePlayer('blue_rcb', { x: 24, z: -0.5 }, 0.25, 0.38, 'quadInOut'),
        new MovePlayer('blue_lcb', { x: 24, z: -9.5 }, 0.25, 0.38, 'quadInOut'),
        new MovePlayer('blue_lb', { x: 24, z: -19 }, 0.25, 0.38, 'quadInOut'),

        new MovePlayer('blue_rm', { x: 16, z: 8 }, 0.25, 0.38),
        new MovePlayer('blue_rcm', { x: 16, z: -1 }, 0.25, 0.38),
        new MovePlayer('blue_lcm', { x: 16, z: -9 }, 0.25, 0.38),
        new MovePlayer('blue_lm', { x: 16, z: -18 }, 0.25, 0.38),

        new MovePlayer('blue_r_st', { x: 8, z: -2 }, 0.25, 0.38, 'quadInOut'),
        new MovePlayer('blue_l_st', { x: 8, z: -8 }, 0.25, 0.38, 'quadInOut'),

        // Phase 4: Pressing Line Activation (DM passes to RCB, Blue presses)
        new PassBall('red_dm', 'red_rcb', 0.38, 0.45),
        new SetBallPosition('red_rcb', 0.45),
        new SetBallPosition('red_rcb', 0.50),

        new MovePlayer('red_dm', { x: -6, z: -2 }, 0.38, 0.50),
        new MovePlayer('red_lcb', { x: -10, z: -6 }, 0.38, 0.50),
        new MovePlayer('red_lcm', { x: 4, z: -18 }, 0.38, 0.50),

        new MovePlayer('red_rcb', { x: -15, z: 10 }, 0.0, 0.38),
        new MovePlayer('red_rcb', { x: -10, z: 10 }, 0.38, 0.50, 'sineInOut'),

        new MovePlayer('red_rcm', { x: 2, z: 12 }, 0.0, 0.38),
        new MovePlayer('red_rcm', { x: 6, z: 6 }, 0.38, 0.50, 'sineInOut'),

        // Blue forward line presses RCB and DM
        new MovePlayer('blue_r_st', { x: 8, z: -2 }, 0.38, 0.50, 'cubicInOut'),
        new MovePlayer('blue_l_st', { x: 8, z: -8 }, 0.38, 0.50, 'cubicInOut'),

        // Blue midfield & defensive line steps up
        new MovePlayer('blue_rm', { x: 16, z: 8 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_rcm', { x: 16, z: -1 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_lcm', { x: 16, z: -9 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_lm', { x: 16, z: -18 }, 0.38, 0.50, 'quadInOut'),

        new MovePlayer('blue_rb', { x: 24, z: 9 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_rcb', { x: 24, z: -0.5 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_lcb', { x: 24, z: -9.5 }, 0.38, 0.50, 'quadInOut'),
        new MovePlayer('blue_lb', { x: 24, z: -19 }, 0.38, 0.50, 'quadInOut'),

        // Shared Overlays
        // Line overlays highlighting Back line, Midfield line, Forward line in Phase 1-3
        new HighlightZone('back_line_poly', OverlayType.POLYGON, {
          points: [
            { x: 26, z: 16 },
            { x: 26, z: -16 },
            { x: 24.5, z: -16 },
            { x: 24.5, z: 16 }
          ]
        }, 0.0, 0.25, '#00F3FF', 0.15),
        new HighlightZone('mid_line_poly', OverlayType.POLYGON, {
          points: [
            { x: 18, z: 15 },
            { x: 18, z: -15 },
            { x: 16.5, z: -15 },
            { x: 16.5, z: 15 }
          ]
        }, 0.0, 0.25, '#00F3FF', 0.15),

        // Shared Arrows
        new PassingArrow('pass_lcb_to_lb', { x: -15, z: -10 }, { x: 0, z: -28 }, 0.12, 0.20, { color: '#00F3FF', width: 2.2 }),
        new MovementArrow('blue_block_shift_arrow', { x: 17, z: 0 }, { x: 16, z: -6 }, 0.12, 0.24, { color: '#39FF14', width: 2, dashSize: 2.0 }),
        new PassingArrow('pass_lb_to_lcb', { x: 0, z: -28 }, { x: -12, z: -8 }, 0.25, 0.30, { color: '#00F3FF', width: 2 }),
        new PassingArrow('pass_lcb_to_dm', { x: -12, z: -8 }, { x: -6, z: -2 }, 0.30, 0.38, { color: '#00F3FF', width: 2.2 }),
        new PassingArrow('pass_dm_to_rcb', { x: -6, z: -2 }, { x: -10, z: 10 }, 0.38, 0.45, { color: '#00F3FF', width: 2.2 }),

        // Pressing indicators
        new MovementArrow('press_r_st_arrow', { x: 8, z: -2 }, { x: -6, z: 8 }, 0.38, 0.48, { color: '#EF4444', width: 2.5 }, true),
        new MovementArrow('press_l_st_arrow', { x: 8, z: -8 }, { x: -2, z: 2 }, 0.38, 0.48, { color: '#EF4444', width: 2.5 }, true),

        // Analytics Triggers
        new AnalyticsTrigger('compact_shape_established', 0.05),
        new AnalyticsTrigger('horizontal_shift_completed', 0.22),
        new AnalyticsTrigger('vertical_compactness_maintained', 0.35)
      ],

      branchPrimitives: {
        // ─────────────────────────────────────────────────────────────
        // BRANCH A: Coordinated Press (Disciplined and Compact)
        // ─────────────────────────────────────────────────────────────
        A: [
          // Red players movements in Branch A
          new MovePlayer('red_rcb', { x: -10, z: 10 }, 0.50, 1.0),
          new MovePlayer('red_rcm', { x: 6, z: 6 }, 0.50, 0.65),
          new MovePlayer('red_rcm', { x: 6, z: 6 }, 0.65, 0.72),
          new MovePlayer('red_rcm', { x: 12, z: 6 }, 0.72, 1.0),

          new MovePlayer('red_lb', { x: 0, z: -28 }, 0.50, 1.0),
          new MovePlayer('red_lcb', { x: -10, z: -6 }, 0.50, 1.0),
          new MovePlayer('red_dm', { x: -6, z: -2 }, 0.50, 1.0),
          new MovePlayer('red_lcm', { x: 4, z: -18 }, 0.50, 1.0),
          new MovePlayer('red_rb', { x: 0, z: 28 }, 0.50, 1.0),
          new MovePlayer('red_rw', { x: 18, z: 28 }, 0.50, 1.0),
          new MovePlayer('red_lw', { x: 20, z: -30 }, 0.50, 1.0),
          new MovePlayer('red_cf', { x: 16, z: -2 }, 0.50, 1.0),

          // Blue players remain compact and shift collectively
          new MovePlayer('blue_rb', { x: 18, z: 9 }, 0.50, 0.65),
          new MovePlayer('blue_rb', { x: 18, z: 12 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_rb', { x: 22, z: 14 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rb', { x: 22, z: 14 }, 0.90, 1.0),

          new MovePlayer('blue_rcb', { x: 18, z: -0.5 }, 0.50, 0.65),
          new MovePlayer('blue_rcb', { x: 18, z: 2.5 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_rcb', { x: 24, z: 3 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rcb', { x: 24, z: 3 }, 0.90, 1.0),

          new MovePlayer('blue_lcb', { x: 18, z: -9.5 }, 0.50, 0.65),
          new MovePlayer('blue_lcb', { x: 18, z: -6.5 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_lcb', { x: 24, z: -4 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lcb', { x: 24, z: -4 }, 0.90, 1.0),

          new MovePlayer('blue_lb', { x: 18, z: -19 }, 0.50, 0.65),
          new MovePlayer('blue_lb', { x: 18, z: -16 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_lb', { x: 22, z: -10 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lb', { x: 22, z: -10 }, 0.90, 1.0),

          new MovePlayer('blue_rm', { x: 12, z: 6 }, 0.50, 0.65),
          new MovePlayer('blue_rm', { x: 10, z: 10 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_rm', { x: 6, z: 18 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rm', { x: 6, z: 18 }, 0.90, 1.0),

          // Blue RCM intercepts ball
          new MovePlayer('blue_rcm', { x: 12, z: 1 }, 0.50, 0.65),
          new MovePlayer('blue_rcm', { x: 5, z: 5.5 }, 0.65, 0.72, 'cubicInOut'),
          new MovePlayer('blue_rcm', { x: 15, z: 8 }, 0.72, 0.90, 'sineInOut'),
          new MovePlayer('blue_rcm', { x: 15, z: 8 }, 0.90, 1.0),

          // Blue LCM shifts centrally
          new MovePlayer('blue_lcm', { x: 12, z: -6 }, 0.50, 0.65),
          new MovePlayer('blue_lcm', { x: 10, z: 2 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_lcm', { x: 12, z: -2 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lcm', { x: 12, z: -2 }, 0.90, 1.0),

          new MovePlayer('blue_lm', { x: 12, z: -14 }, 0.50, 0.65),
          new MovePlayer('blue_lm', { x: 12, z: -11 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_lm', { x: 15, z: -8 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lm', { x: 15, z: -8 }, 0.90, 1.0),

          // Blue RST runs forward to receive interception
          new MovePlayer('blue_r_st', { x: -6, z: 8 }, 0.50, 0.65),
          new MovePlayer('blue_r_st', { x: -2, z: 14 }, 0.65, 0.78, 'cubicInOut'),
          new MovePlayer('blue_r_st', { x: 10, z: 20 }, 0.78, 0.90, 'quadInOut'),
          new MovePlayer('blue_r_st', { x: 10, z: 20 }, 0.90, 1.0),

          new MovePlayer('blue_l_st', { x: -2, z: 2 }, 0.50, 0.65),
          new MovePlayer('blue_l_st', { x: -4, z: 3 }, 0.65, 0.78),
          new MovePlayer('blue_l_st', { x: 8, z: 5 }, 0.78, 0.90, 'quadInOut'),
          new MovePlayer('blue_l_st', { x: 8, z: 5 }, 0.90, 1.0),

          // Ball: Red RCB -> RCM (intercepted) -> RST -> RST dribbles
          new PassBall('red_rcb', 'red_rcm', 0.65, 0.70),
          new SetBallPosition('blue_rcm', 0.70),
          new SetBallPosition('blue_rcm', 0.72),
          new PassBall('blue_rcm', 'blue_r_st', 0.72, 0.78),
          new SetBallPosition('blue_r_st', 0.78),
          new DribbleBall('blue_r_st', 0.78, 0.90),
          new SetBallPosition('blue_r_st', 0.90),
          new SetBallPosition('blue_r_st', 1.0),

          // Arrows
          new PassingArrow('pass_rcb_to_rcm_a', { x: -10, z: 10 }, { x: 6, z: 6 }, 0.65, 0.70, { color: '#EF4444', width: 2.2 }),
          new PassingArrow('pass_intercept_to_st_a', { x: 5, z: 5.5 }, { x: -2, z: 14 }, 0.72, 0.78, { color: '#39FF14', width: 2.5 }),
          new MovementArrow('rst_counter_run_a', { x: -2, z: 14 }, { x: 10, z: 20 }, 0.78, 0.90, { color: '#39FF14', width: 3 }, true),

          // Overlays
          new HighlightCompactness('attack', 0.50, 0.65, '#39FF14', 0.15),
          new HighlightZone('controlled_space_poly_a', OverlayType.POLYGON, {
            points: [
              { x: -8, z: 12 },
              { x: 18, z: 15 },
              { x: 18, z: -15 },
              { x: -8, z: -5 }
            ]
          }, 0.50, 0.78, '#38FE5E', 0.12),
          new HighlightZone('compactness_grid_a', OverlayType.RECTANGLE, {
            center: { x: 10, z: 0 },
            bounds: { width: 15, length: 28, rotation: 0 }
          }, 0.90, 1.0, '#38FE5E', 0.12),

          // Analytics
          new AnalyticsTrigger('vertical_compactness_maintained', 0.58, { branch: 'A' }),
          new AnalyticsTrigger('gap_created', 0.68, { branch: 'A', status: 'denied' }), // Gap prevented
          new AnalyticsTrigger('compactness_restored', 0.85, { branch: 'A', status: 'transition' }),
          new AnalyticsTrigger('lesson_completed', 0.95)
        ],

        // ─────────────────────────────────────────────────────────────
        // BRANCH B: Loss of Compactness & Stretched (Vulnerable)
        // ─────────────────────────────────────────────────────────────
        B: [
          // Red players movements in Branch B
          new MovePlayer('red_rcb', { x: -10, z: 10 }, 0.50, 1.0),

          // Red RCM steps into the created central gap to receive
          new MovePlayer('red_rcm', { x: 6, z: 6 }, 0.50, 0.65),
          new MovePlayer('red_rcm', { x: 8, z: 4 }, 0.65, 0.72, 'quadInOut'),
          new MovePlayer('red_rcm', { x: 12, z: 12 }, 0.72, 0.90, 'sineInOut'),
          new MovePlayer('red_rcm', { x: 12, z: 12 }, 0.90, 1.0),

          // Red RW receives wide pass
          new MovePlayer('red_rw', { x: 18, z: 28 }, 0.50, 0.78),
          new MovePlayer('red_rw', { x: 22, z: 28 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('red_rw', { x: 22, z: 28 }, 0.90, 1.0),

          new MovePlayer('red_lb', { x: 0, z: -28 }, 0.50, 1.0),
          new MovePlayer('red_lcb', { x: -10, z: -6 }, 0.50, 1.0),
          new MovePlayer('red_dm', { x: -6, z: -2 }, 0.50, 1.0),
          new MovePlayer('red_lcm', { x: 4, z: -18 }, 0.50, 1.0),
          new MovePlayer('red_rb', { x: 0, z: 28 }, 0.50, 1.0),
          new MovePlayer('red_lw', { x: 20, z: -30 }, 0.50, 1.0),
          new MovePlayer('red_cf', { x: 16, z: -2 }, 0.50, 1.0),

          // Blue LCM jumps forward to press individually, breaking shape
          new MovePlayer('blue_lcm', { x: 12, z: -6 }, 0.50, 0.65, 'cubicInOut'),
          new MovePlayer('blue_lcm', { x: -8, z: 10 }, 0.65, 0.78, 'sineInOut'),
          new MovePlayer('blue_lcm', { x: 10, z: 4 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lcm', { x: 10, z: 4 }, 0.90, 1.0),

          // Blue RCM drops to cover
          new MovePlayer('blue_rcm', { x: 12, z: 1 }, 0.50, 0.65),
          new MovePlayer('blue_rcm', { x: 14, z: -2 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_rcm', { x: 16, z: -4 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rcm', { x: 16, z: -4 }, 0.90, 1.0),

          // Blue LCB steps up to engage Red RCM
          new MovePlayer('blue_lcb', { x: 18, z: -9.5 }, 0.50, 0.65),
          new MovePlayer('blue_lcb', { x: 20, z: -9.5 }, 0.65, 0.78, 'quadInOut'),
          new MovePlayer('blue_lcb', { x: 12, z: 0 }, 0.78, 0.85, 'cubicInOut'),
          new MovePlayer('blue_lcb', { x: 12, z: 0 }, 0.85, 1.0),

          // Other defenders drop to cover space behind LCB
          new MovePlayer('blue_rcb', { x: 18, z: -0.5 }, 0.50, 0.65),
          new MovePlayer('blue_rcb', { x: 18, z: -0.5 }, 0.65, 0.78),
          new MovePlayer('blue_rcb', { x: 22, z: 1 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rcb', { x: 22, z: 1 }, 0.90, 1.0),

          new MovePlayer('blue_rb', { x: 18, z: 9 }, 0.50, 0.65),
          new MovePlayer('blue_rb', { x: 18, z: 9 }, 0.65, 0.78),
          new MovePlayer('blue_rb', { x: 22, z: 7 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rb', { x: 22, z: 7 }, 0.90, 1.0),

          new MovePlayer('blue_lb', { x: 18, z: -19 }, 0.50, 0.65),
          new MovePlayer('blue_lb', { x: 18, z: -19 }, 0.65, 0.78),
          new MovePlayer('blue_lb', { x: 22, z: -15 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lb', { x: 22, z: -15 }, 0.90, 1.0),

          // Other Blue players static/drop back
          new MovePlayer('blue_lm', { x: 12, z: -14 }, 0.50, 0.65),
          new MovePlayer('blue_lm', { x: 14, z: -14 }, 0.65, 0.78),
          new MovePlayer('blue_lm', { x: 18, z: -10 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_lm', { x: 18, z: -10 }, 0.90, 1.0),

          new MovePlayer('blue_rm', { x: 12, z: 6 }, 0.50, 0.65),
          new MovePlayer('blue_rm', { x: 14, z: 6 }, 0.65, 0.78),
          new MovePlayer('blue_rm', { x: 18, z: 6 }, 0.78, 0.90, 'sineInOut'),
          new MovePlayer('blue_rm', { x: 18, z: 6 }, 0.90, 1.0),

          new MovePlayer('blue_r_st', { x: -6, z: 8 }, 0.50, 1.0),
          new MovePlayer('blue_l_st', { x: -2, z: 2 }, 0.50, 1.0),

          // Ball: Red RCB -> line-breaking pass -> Red RCM -> Red RCM passes to RW
          new PassBall('red_rcb', 'red_rcm', 0.65, 0.72),
          new SetBallPosition('red_rcm', 0.72),
          new SetBallPosition('red_rcm', 0.80),
          new PassBall('red_rcm', 'red_rw', 0.80, 0.88),
          new SetBallPosition('red_rw', 0.88),
          new SetBallPosition('red_rw', 1.0),

          // Arrows
          new MovementArrow('lcm_break_shape_arrow', { x: 12, z: -6 }, { x: -8, z: 10 }, 0.50, 0.64, { color: '#EF4444', width: 3 }, true),
          new PassingArrow('line_breaking_pass_b', { x: -10, z: 10 }, { x: 8, z: 4 }, 0.65, 0.72, { color: '#EF4444', width: 3 }),
          new MovementArrow('lcb_step_up_arrow', { x: 20, z: -9.5 }, { x: 12, z: 0 }, 0.78, 0.85, { color: '#39FF14', width: 2.5 }),
          new PassingArrow('pass_rcm_to_rw_b', { x: 8, z: 4 }, { x: 22, z: 28 }, 0.80, 0.88, { color: '#EF4444', width: 2 }),

          // Overlays
          // Highlight the gap created in Phase 5-6
          new HighlightZone('dangerous_gap_overlay', OverlayType.CIRCLE, {
            center: { x: 10, z: 4 },
            radius: 6.5
          }, 0.50, 0.78, '#EF4444', 0.22),
          // Highlight the stretched shape
          new HighlightZone('stretched_shape_poly', OverlayType.POLYGON, {
            points: [
              { x: -8, z: 10 },
              { x: 20, z: 9 },
              { x: 20, z: -19 },
              { x: 12, z: -14 }
            ]
          }, 0.65, 0.78, '#EF4444', 0.12),

          // Analytics
          new AnalyticsTrigger('gap_created', 0.58, { branch: 'B' }),
          new AnalyticsTrigger('gap_exploited', 0.72, { branch: 'B' }),
          new AnalyticsTrigger('compactness_restored', 0.85, { branch: 'B' }),
          new AnalyticsTrigger('lesson_completed', 0.95)
        ]
      },

      phases: [
        { index: 1, start: 0.00, end: 0.12, name: 'Compact Shape', description: 'Blue defensive block in a highly compact 4-4-2. Short horizontal and vertical distances prevent entry.' },
        { index: 2, start: 0.12, end: 0.25, name: 'Horizontal Compactness', description: 'As the ball is circulated wide, the entire defensive block shifts collectively to choke the side.' },
        { index: 3, start: 0.25, end: 0.38, name: 'Vertical Compactness', description: 'Strikers drop and the backline pushes up. Squeezing the vertical distance eliminates passing lanes.' },
        { index: 4, start: 0.38, end: 0.50, name: 'Pressing Line Activation', description: 'The forward line steps up to press the ball, while supporting lines push higher to remain compact.' },
        { index: 5, start: 0.50, end: 0.65, name: 'Loss of Compactness', description: 'Compare: Branch A maintains connection. Branch B sees one midfielder break shape, creating a dangerous gap.' },
        { index: 6, start: 0.65, end: 0.78, name: 'Defensive Vulnerability', description: 'Branch A forces a turnover. Branch B sees the opponent play a line-breaking pass through the central gap.' },
        { index: 7, start: 0.78, end: 0.90, name: 'Compactness Restored', description: 'In Branch B, the center-back steps up while the block contracts to compress space around the ball.' },
        { index: 8, start: 0.90, end: 1.00, name: 'Summary', description: 'Freeze-frame analysis. Coordinated spacing and team shape are more important than individual actions.' }
      ],

      annotations: [
        { start: 0.00, end: 0.12, text: 'Defensive lines remain connected. The compact 4-4-2 blocks all central corridors.' },
        { start: 0.12, end: 0.25, text: 'The block shifts collectively. Players move as one unit to squeeze space near the ball.' },
        { start: 0.25, end: 0.38, text: 'Vertical gaps are closed. Keeping lines under 10m removes passing options between lines.' },
        { start: 0.38, end: 0.50, text: 'Pressing becomes effective when distances stay short, forcing Red to circulate backward.' },
        // Phase 5 annotations branch-specific
        { start: 0.50, end: 0.65, text: 'Branch A: Coordinated press remains connected. Branch B: Blue LCM breaks shape to press individually, leaving a central gap.' },
        { start: 0.65, end: 0.78, text: 'Branch A: Blue RCM intercepts. Branch B: Red exploits the gap with a line-breaking pass between the lines.' },
        { start: 0.78, end: 0.90, text: 'Branch A: Transition launch. Branch B: Blue LCB steps up to engage, restoring compactness around the ball.' },
        { start: 0.90, end: 1.00, text: 'Summary: Defensive solidity relies on collective connection. The team shape is more important than any individual defender.' }
      ],

      cameraPresets: [
        { start: 0.00, end: 0.12, preset: 'summary_view' },
        { start: 0.12, end: 0.25, preset: 'horizontal_compactness_view' },
        { start: 0.25, end: 0.38, preset: 'vertical_compactness_view' },
        { start: 0.38, end: 0.50, preset: 'pressing_structure_view' },
        { start: 0.50, end: 0.78, preset: 'gap_analysis_view' },
        { start: 0.78, end: 1.00, preset: 'summary_view' }
      ],

      debugMetricsBuilder: (fraction: number, activeBranch: 'A' | 'B') => {
        let width = '28.0m';
        let depth = '14.0m';
        let lineDist = '7.5m';
        let compactnessScore = 96;

        if (fraction < 0.12) {
          width = '28.0m'; depth = '14.0m'; lineDist = '7.5m'; compactnessScore = 96;
        } else if (fraction < 0.25) {
          width = '25.5m'; depth = '13.5m'; lineDist = '7.2m'; compactnessScore = 98;
        } else if (fraction < 0.38) {
          width = '26.0m'; depth = '12.0m'; lineDist = '6.8m'; compactnessScore = 99;
        } else if (fraction < 0.50) {
          width = '27.0m'; depth = '12.5m'; lineDist = '7.0m'; compactnessScore = 95;
        } else {
          if (activeBranch === 'A') {
            width = '25.0m'; depth = '13.0m'; lineDist = '7.2m'; compactnessScore = 97;
          } else {
            // Branch B - Stretched
            if (fraction < 0.78) {
              width = '34.0m'; depth = '22.0m'; lineDist = '16.5m'; compactnessScore = 48;
            } else {
              // Restored
              width = '29.0m'; depth = '15.0m'; lineDist = '9.0m'; compactnessScore = 84;
            }
          }
        }

        return {
          teamWidth: width,
          teamDepth: depth,
          lineDistances: lineDist,
          compactnessScore: `${compactnessScore}/100`,
          activeOverlays: fraction > 0.50 && activeBranch === 'B' ? '2 active (Gap Highlight)' : '1 active'
        };
      }
    });
  }

  public getDebugMetrics(fraction: number) {
    const custom = super.getDebugMetrics(fraction);
    return {
      ...custom,
      currentPhase: this.getPhaseInfo(fraction).name,
      timelinePosition: `${(fraction * 100).toFixed(1)}%`
    };
  }
}
