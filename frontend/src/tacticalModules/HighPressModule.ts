import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  PressingArrow,
  HighlightZone, 
  PassBall, 
  DribbleBall,
  SetBallPosition,
  PressTriggered,
  TrapActivated,
  PossessionWon
} from '../tacticalPrimitives/library';
import { OverlayType } from '../tacticalEngine/types';

export class HighPressModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'high_press',
      name: 'High Press',
      description: 'A coordinated defensive strategy to win possession close to the opponent\'s goal by cutting passing options and trapping the ball carrier.',
      durationSeconds: 14.0,
      
      primitives: [
        // 1. Red Team Initial setup
        new FormationState('defend', '4-3-3', 'left',
          {
            'GK': { x: -46, z: 0 },
            'LCB': { x: -36, z: -14 },
            'RCB': { x: -36, z: 14 },
            'LB': { x: -28, z: -26 },
            'RB': { x: -28, z: 26 },
            'DM': { x: -24, z: 0 },
            'LCM': { x: -16, z: -8 },
            'RCM': { x: -16, z: 8 },
            'LW': { x: -2, z: -24 },
            'RW': { x: -2, z: 24 },
            'CF': { x: 5, z: 0 }
          },
          {
            'GK': 'red_gk',
            'LCB': 'red_cb_l',
            'RCB': 'red_cb_r',
            'LB': 'red_lb',
            'RB': 'red_rb',
            'DM': 'red_dm',
            'LCM': 'red_cm_l',
            'RCM': 'red_cm_r',
            'LW': 'red_lw',
            'RW': 'red_rw',
            'CF': 'red_cf'
          }
        ),

        // 2. Blue Team Initial setup
        new FormationState('attack', '4-3-3', 'right',
          {
            'GK': { x: 42, z: 0 },
            'LCB': { x: 15, z: -6 },
            'RCB': { x: 15, z: 6 },
            'LB': { x: 12, z: -22 },
            'RB': { x: 12, z: 22 },
            'DM': { x: 2, z: 0 },
            'LCM': { x: -10, z: 8 },
            'RCM': { x: -10, z: -8 },
            'CF': { x: -22, z: 0 },
            'LW': { x: -26, z: 14 },
            'RW': { x: -26, z: -14 }
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
            'CF': 'blue_cf',
            'LW': 'blue_lw',
            'RW': 'blue_rw'
          }
        ),

        // Red team movements
        new MovePlayer('red_gk', { x: -46, z: 0 }, 0.0, 0.15),
        new MovePlayer('red_gk', { x: -44, z: 0 }, 0.15, 0.30),
        new MovePlayer('red_gk', { x: -44, z: 0 }, 0.30, 1.0),

        new MovePlayer('red_cb_l', { x: -36, z: -14 }, 0.0, 0.45),
        new MovePlayer('red_cb_l', { x: -33, z: -10 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('red_cb_l', { x: -30, z: -6 }, 0.60, 0.85),
        new MovePlayer('red_cb_l', { x: -30, z: -6 }, 0.85, 1.0),

        new MovePlayer('red_cb_r', { x: -36, z: 14 }, 0.0, 0.45),
        new MovePlayer('red_cb_r', { x: -34, z: 12 }, 0.45, 0.85),
        new MovePlayer('red_cb_r', { x: -30, z: 6 }, 0.85, 1.0),

        new MovePlayer('red_lb', { x: -28, z: -26 }, 0.0, 0.60),
        new MovePlayer('red_lb', { x: -25, z: -22 }, 0.60, 0.75, 'quadInOut'),
        new MovePlayer('red_lb', { x: -20, z: -18 }, 0.75, 1.0),

        new MovePlayer('red_rb', { x: -28, z: 26 }, 0.0, 0.50),
        new MovePlayer('red_rb', { x: -26, z: 24 }, 0.50, 1.0),

        new MovePlayer('red_dm', { x: -24, z: 0 }, 0.0, 0.30),
        new MovePlayer('red_dm', { x: -22, z: -2 }, 0.30, 0.60),
        new MovePlayer('red_dm', { x: -20, z: -2 }, 0.60, 1.0),

        new MovePlayer('red_cm_l', { x: -16, z: -8 }, 0.0, 0.30),
        new MovePlayer('red_cm_l', { x: -15, z: -7 }, 0.30, 0.60),
        new MovePlayer('red_cm_l', { x: -14, z: -6 }, 0.60, 1.0),

        new MovePlayer('red_cm_r', { x: -16, z: 8 }, 0.0, 1.0),
        new MovePlayer('red_lw', { x: -2, z: -24 }, 0.0, 1.0),
        new MovePlayer('red_rw', { x: -2, z: 24 }, 0.0, 1.0),
        new MovePlayer('red_cf', { x: 5, z: 0 }, 0.0, 1.0),

        // Blue team movements
        new MovePlayer('blue_gk', { x: 42, z: 0 }, 0.0, 1.0),
        new MovePlayer('blue_cb_l', { x: 15, z: -6 }, 0.0, 0.15),
        new MovePlayer('blue_cb_l', { x: 9, z: -7 }, 0.15, 0.30),
        new MovePlayer('blue_cb_l', { x: 3, z: -7 }, 0.30, 0.60, 'quadInOut'),
        new MovePlayer('blue_cb_l', { x: -2, z: -5 }, 0.60, 1.0),

        new MovePlayer('blue_cb_r', { x: 15, z: 6 }, 0.0, 0.15),
        new MovePlayer('blue_cb_r', { x: 10, z: 5 }, 0.15, 0.30),
        new MovePlayer('blue_cb_r', { x: 5, z: 3 }, 0.30, 0.60, 'quadInOut'),
        new MovePlayer('blue_cb_r', { x: 0, z: 2 }, 0.60, 1.0),

        new MovePlayer('blue_lb', { x: 12, z: -22 }, 0.0, 0.15),
        new MovePlayer('blue_lb', { x: 6, z: -23 }, 0.15, 0.30),
        new MovePlayer('blue_lb', { x: 1, z: -24 }, 0.30, 0.45),
        new MovePlayer('blue_lb', { x: -5, z: -25 }, 0.45, 0.60, 'cubicInOut'),
        new MovePlayer('blue_lb', { x: -10, z: -20 }, 0.60, 1.0),

        new MovePlayer('blue_rb', { x: 12, z: 22 }, 0.0, 0.15),
        new MovePlayer('blue_rb', { x: 8, z: 20 }, 0.15, 0.30),
        new MovePlayer('blue_rb', { x: 4, z: 18 }, 0.30, 0.60),
        new MovePlayer('blue_rb', { x: 0, z: 12 }, 0.60, 1.0),

        new MovePlayer('blue_dm', { x: 2, z: 0 }, 0.0, 0.15),
        new MovePlayer('blue_dm', { x: -2, z: -2 }, 0.15, 0.30),
        new MovePlayer('blue_dm', { x: -6, z: -10 }, 0.30, 0.60, 'quadInOut'),
        new MovePlayer('blue_dm', { x: -12, z: -6 }, 0.60, 1.0),

        new MovePlayer('blue_cm_l', { x: -10, z: 8 }, 0.0, 0.15),
        new MovePlayer('blue_cm_l', { x: -11, z: 3 }, 0.15, 0.30),
        new MovePlayer('blue_cm_l', { x: -14, z: 2 }, 0.30, 0.60),
        new MovePlayer('blue_cm_l', { x: -18, z: 4 }, 0.60, 1.0),

        new MovePlayer('blue_cm_r', { x: -10, z: -8 }, 0.0, 0.15),
        new MovePlayer('blue_cm_r', { x: -10, z: -8 }, 0.15, 0.15),
        new MovePlayer('blue_cm_r', { x: -14, z: -9 }, 0.15, 0.30),
        new MovePlayer('blue_cm_r', { x: -13, z: -10 }, 0.30, 0.45),
        new MovePlayer('blue_cm_r', { x: -20, z: -20 }, 0.45, 0.60, 'cubicInOut'),
        new MovePlayer('blue_cm_r', { x: -22, z: -12 }, 0.60, 0.70),
        new MovePlayer('blue_cm_r', { x: -22, z: -12 }, 0.70, 0.75),
        new MovePlayer('blue_cm_r', { x: -18, z: -8 }, 0.75, 0.90),
        new MovePlayer('blue_cm_r', { x: -15, z: -5 }, 0.90, 1.0),

        new MovePlayer('blue_cf', { x: -22, z: 0 }, 0.0, 0.15),
        new MovePlayer('blue_cf', { x: -22, z: 0 }, 0.15, 0.15),
        new MovePlayer('blue_cf', { x: -23, z: -2 }, 0.15, 0.30, 'quadInOut'),
        new MovePlayer('blue_cf', { x: -23, z: -1 }, 0.30, 0.45),
        new MovePlayer('blue_cf', { x: -22, z: -3 }, 0.45, 0.60),
        new MovePlayer('blue_cf', { x: -23, z: -1 }, 0.60, 0.75),
        new MovePlayer('blue_cf', { x: -30, z: 2 }, 0.75, 0.85, 'sineInOut'),
        new MovePlayer('blue_cf', { x: -40, z: 0 }, 0.85, 0.90, 'quadInOut'),
        new MovePlayer('blue_cf', { x: -42, z: 0 }, 0.90, 1.0),

        new MovePlayer('blue_lw', { x: -26, z: 14 }, 0.0, 0.15),
        new MovePlayer('blue_lw', { x: -30, z: 8 }, 0.15, 0.30, 'quadInOut'),
        new MovePlayer('blue_lw', { x: -28, z: 4 }, 0.30, 0.60),
        new MovePlayer('blue_lw', { x: -24, z: 0 }, 0.60, 1.0),

        new MovePlayer('blue_rw', { x: -26, z: -14 }, 0.0, 0.15),
        new MovePlayer('blue_rw', { x: -30, z: -16 }, 0.15, 0.30, 'cubicInOut'),
        new MovePlayer('blue_rw', { x: -34, z: -17 }, 0.30, 0.45),
        new MovePlayer('blue_rw', { x: -29, z: -24 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_rw', { x: -20, z: -15 }, 0.60, 1.0),

        // Ball movement keyframes
        new SetBallPosition('red_gk', 0.0),
        new SetBallPosition('red_gk', 0.15),
        new PassBall('red_gk', 'red_cb_l', 0.15, 0.30),
        new PassBall('red_cb_l', 'red_lb', 0.45, 0.55),
        new PassBall('red_lb', 'blue_cm_r', 0.60, 0.70),
        new PassBall('blue_cm_r', 'blue_cf', 0.75, 0.85),
        new DribbleBall('blue_cf', 0.85, 0.90),
        // Shot at goal
        new SetBallPosition({ x: -49, z: 0 }, 0.95),
        new SetBallPosition({ x: -49, z: 0 }, 1.0),

        // Arrows
        new PassingArrow('arrow_gk_to_rcb_lane', { x: -46, z: 0 }, { x: -36, z: 14 }, 0.0, 0.15, { color: '#00F3FF', width: 2 }),
        new PassingArrow('arrow_gk_to_lcb_lane', { x: -46, z: 0 }, { x: -36, z: -14 }, 0.0, 0.15, { color: '#00F3FF', width: 2 }),
        new PassingArrow('arrow_gk_to_lcb_pass', { x: -46, z: 0 }, { x: -36, z: -14 }, 0.15, 0.30, { color: '#00F3FF', width: 2.5 }),
        new MovementArrow('arrow_blue_rw_press', { x: -26, z: -14 }, { x: -30, z: -16 }, 0.15, 0.30, { color: '#39FF14', width: 3, dashSpeed: 1.0 }, true),
        new MovementArrow('arrow_blue_cf_cover', { x: -22, z: 0 }, { x: -23, z: -2 }, 0.15, 0.30, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_blue_lw_tuck', { x: -26, z: 14 }, { x: -30, z: 8 }, 0.15, 0.30, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_blue_cm_r_step', { x: -10, z: -8 }, { x: -14, z: -9 }, 0.15, 0.30, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_def_line_compress', { x: 15, z: 0 }, { x: 9, z: 0 }, 0.15, 0.35, { color: '#39FF14', width: 2, dashSize: 2.0 }),
        new PressingArrow('arrow_blocked_lane_dm', { x: -36, z: -14 }, { x: -24, z: 0 }, 0.30, 0.45, { color: '#EF4444', width: 2 }),
        new PressingArrow('arrow_blocked_lane_rcb', { x: -36, z: -14 }, { x: -36, z: 14 }, 0.30, 0.45, { color: '#EF4444', width: 2 }),
        new PressingArrow('arrow_blocked_lane_cm_l', { x: -36, z: -14 }, { x: -16, z: -8 }, 0.30, 0.45, { color: '#EF4444', width: 2 }),
        new MovementArrow('arrow_funnel_steer', { x: -36, z: -14 }, { x: -28, z: -26 }, 0.30, 0.45, { color: '#F97316', width: 3 }, true),
        new PassingArrow('arrow_lcb_to_lb_pass', { x: -36, z: -14 }, { x: -28, z: -26 }, 0.45, 0.55, { color: '#00F3FF', width: 2 }),
        new MovementArrow('arrow_blue_rw_trap', { x: -30, z: -16 }, { x: -29, z: -24 }, 0.45, 0.60, { color: '#39FF14', width: 3, dashSpeed: 1.2 }),
        new MovementArrow('arrow_blue_cm_r_trap', { x: -14, z: -9 }, { x: -20, z: -20 }, 0.45, 0.60, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_blue_lb_trap', { x: 6, z: -23 }, { x: -5, z: -25 }, 0.45, 0.60, { color: '#39FF14', width: 2.5 }, true),
        new PassingArrow('arrow_panicked_pass_in', { x: -28, z: -26 }, { x: -22, z: -12 }, 0.60, 0.70, { color: '#EF4444', width: 2.5 }),
        new MovementArrow('arrow_blue_cm_r_intercept', { x: -20, z: -20 }, { x: -22, z: -12 }, 0.60, 0.70, { color: '#39FF14', width: 3 }),
        new PassingArrow('arrow_turnover_pass', { x: -22, z: -12 }, { x: -30, z: 2 }, 0.75, 0.85, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_blue_cf_run', { x: -23, z: -1 }, { x: -30, z: 2 }, 0.75, 0.85, { color: '#39FF14', width: 3, dashSpeed: 1.5 }, true),
        new MovementArrow('arrow_shot_vector', { x: -40, z: 0 }, { x: -49, z: 0 }, 0.90, 0.95, { color: '#EAB308', width: 3.5 }),
        new MovementArrow('arrow_transition_space_indicator', { x: -22, z: -12 }, { x: -42, z: -5 }, 0.75, 0.90, { color: '#38FE5E', width: 2, dashSize: 2.0 }, true),

        // Overlays
        new HighlightZone('overlay_pressing_structure', OverlayType.RECTANGLE, { center: { x: 0, z: 0 }, bounds: { width: 32, length: 55, rotation: 0 } }, 0.0, 0.20, '#1D4ED8', 0.12),
        new HighlightZone('overlay_buildup_zone', OverlayType.RECTANGLE, { center: { x: -35, z: 0 }, bounds: { width: 28, length: 58, rotation: 0 } }, 0.0, 0.18, '#DC2626', 0.08),
        new HighlightZone('overlay_trigger_area', OverlayType.CIRCLE, { center: { x: -40, z: -10 }, radius: 12.0 }, 0.15, 0.35, '#EAB308', 0.15),
        new HighlightZone('overlay_pressing_zone_lcb', OverlayType.CIRCLE, { center: { x: -36, z: -14 }, radius: 7.5 }, 0.25, 0.48, '#EF4444', 0.2),
        new HighlightZone('overlay_cover_shadow_rw', OverlayType.POLYGON, {
          points: [
            { x: -30, z: -16 },
            { x: -28, z: -26 },
            { x: -20, z: -24 },
            { x: -24, z: -16 }
          ]
        }, 0.25, 0.48, '#EF4444', 0.18),
        new HighlightZone('overlay_midfield_compactness', OverlayType.RECTANGLE, { center: { x: -10, z: 0 }, bounds: { width: 15, length: 30, rotation: 0 } }, 0.20, 0.50, '#38FE5E', 0.12),
        new HighlightZone('overlay_compact_defense', OverlayType.POLYGON, {
          points: [
            { x: 8, z: -22 },
            { x: 8, z: 22 },
            { x: 16, z: 6 },
            { x: 16, z: -6 }
          ]
        }, 0.20, 0.55, '#38FE5E', 0.1),
        new HighlightZone('overlay_pressure_funnel', OverlayType.POLYGON, {
          points: [
            { x: -24, z: 0 },
            { x: -32, z: 6 },
            { x: -38, z: -12 },
            { x: -28, z: -28 }
          ]
        }, 0.30, 0.50, '#F97316', 0.15),
        new HighlightZone('overlay_trap_zone', OverlayType.CIRCLE, { center: { x: -28, z: -26 }, radius: 8.5 }, 0.45, 0.68, '#EF4444', 0.26),
        new HighlightZone('overlay_turnover_zone', OverlayType.CIRCLE, { center: { x: -22, z: -12 }, radius: 6.5 }, 0.65, 0.80, '#38FE5E', 0.22),
        new HighlightZone('overlay_transition_space', OverlayType.POLYGON, {
          points: [
            { x: -28, z: -14 },
            { x: -28, z: 14 },
            { x: -46, z: 0 },
            { x: -38, z: -18 }
          ]
        }, 0.75, 0.95, '#38FE5E', 0.16),
        new HighlightZone('overlay_shot_opportunity', OverlayType.CIRCLE, { center: { x: -42, z: 0 }, radius: 6.0 }, 0.85, 1.0, '#EAB308', 0.2),
        new HighlightZone('overlay_final_block', OverlayType.RECTANGLE, { center: { x: -25, z: -8 }, bounds: { width: 38, length: 48, rotation: 0 } }, 0.90, 1.0, '#38FE5E', 0.08),
        new HighlightZone('overlay_compactness_summary', OverlayType.CIRCLE, { center: { x: -18, z: -8 }, radius: 16.0 }, 0.90, 1.0, '#06B6D4', 0.14),
        new HighlightZone('overlay_opposition_disorganization', OverlayType.POLYGON, {
          points: [
            { x: -30, z: -6 },
            { x: -30, z: 6 },
            { x: -20, z: -18 },
            { x: -24, z: 22 }
          ]
        }, 0.80, 0.98, '#EF4444', 0.12),

        // Decision primitives (analytics events)
        new PressTriggered(0.15),
        new TrapActivated(0.45),
        new PossessionWon(0.75)
      ],

      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Build-Up Setup', description: 'Red attempts to build from the back in a wide shape. Blue matches in a compact 4-3-3.' },
        { index: 2, start: 0.15, end: 0.30, name: 'Press Activation', description: 'Red Goalkeeper passes to LCB. This trigger activates Blue\'s coordinated front three press.' },
        { index: 3, start: 0.30, end: 0.45, name: 'Passing Lane Denial', description: 'Blue wingers and midfielders step up, utilizing cover shadows to block all immediate escape routes.' },
        { index: 4, start: 0.45, end: 0.60, name: 'Pressing Trap', description: 'Play is steered wide to the Left Back. Blue springs the trap by surrounding the ball carrier.' },
        { index: 5, start: 0.60, end: 0.75, name: 'Opponent Mistake', description: 'Suffocated near the touchline, the Left Back makes a hurried, forced pass back inside.' },
        { index: 6, start: 0.75, end: 0.90, name: 'Turnover & Transition', description: 'Blue\'s midfielder intercepts the pass and instantly feeds the striker running into open space.' },
        { index: 7, start: 0.90, end: 1.0, name: 'Summary State', description: 'Possession won high up the pitch. Pressing is about controlling options and spaces, not chaotic running.' }
      ],

      annotations: [
        { start: 0.0, end: 0.15, text: 'Build-Up Setup: Red GK starts with possession. Red defenders spread wide. Blue matches in a compact 4-3-3, preparing the press.' },
        { start: 0.15, end: 0.30, text: 'Press Activation: Ball is passed to Red LCB. Blue RW initiates a curved run, while Blue CF and LW adjust positions to cover options.' },
        { start: 0.30, end: 0.45, text: 'Passing Lane Denial: Passing options to Red DM, RCB, and central midfielders are completely blocked using cover shadows.' },
        { start: 0.45, end: 0.60, text: 'Pressing Trap: Play is steered wide to the Left Back. Blue springs the trap, locking all touchline and backward escape routes.' },
        { start: 0.60, end: 0.75, text: 'Opponent Mistake: Suffocated near the touchline, the Left Back makes a panicked, rushed decision and tries to force a pass inside.' },
        { start: 0.75, end: 0.90, text: 'Turnover: Blue RCM intercepts the pass, launching an immediate transition. Striker CF makes a diagonal run into the open space.' },
        { start: 0.90, end: 1.0, text: 'Summary: Coordinated pressing won the ball high up the pitch. Pressing is about controlling options and spaces, not chaotic running.' }
      ],

      cameraPresets: [
        { start: 0.0, end: 0.15, preset: 'overview' },
        { start: 0.15, end: 0.45, preset: 'press_trigger' },
        { start: 0.45, end: 0.75, preset: 'turnover' },
        { start: 0.75, end: 1.0, preset: 'summary' }
      ]
    });
  }
}
