import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  HighlightZone, 
  PassBall, 
  SetBallPosition
} from '../tacticalPrimitives/library';
import { OverlayType } from '../tacticalEngine/types';

export class DefensiveBlockModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'defensive_block',
      name: 'Defensive Block',
      description: 'A structured, compact defensive shape designed to deny space in central zones, steering attackers into less dangerous wide areas.',
      durationSeconds: 14.0,
      
      primitives: [
        // 1. Red attacking team initial setup
        new FormationState('defend', '4-3-3', 'left',
          {
            'GK': { x: -40, z: 0 },
            'RCB': { x: -12, z: 12 },
            'LCB': { x: -12, z: -12 },
            'RB': { x: -2, z: 28 },
            'LB': { x: -2, z: -28 },
            'DM': { x: -4, z: 0 }, // Wait: 4-4-2 has no DM. Let's map these to roles
            'LCM': { x: 5, z: -10 },
            'RCM': { x: 5, z: 10 },
            'LW': { x: 25, z: -28 },
            'RW': { x: 25, z: 28 },
            'CF': { x: 23, z: 0 }
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
            'LW': 'red_lw',
            'RW': 'red_rw',
            'CF': 'red_cf'
          }
        ),

        // 2. Blue defending block initial setup (starts compact 4-4-2)
        new FormationState('attack', '4-4-2', 'right',
          {
            'GK': { x: 45, z: 0 },
            'RB': { x: 26, z: 15 },
            'RCB': { x: 26, z: 5 },
            'LCB': { x: 26, z: -5 },
            'LB': { x: 26, z: -15 },
            'RM': { x: 18, z: 14 },
            'RCM': { x: 18, z: 4.5 },
            'LCM': { x: 18, z: -4.5 },
            'LM': { x: 18, z: -14 },
            'RST': { x: 10, z: 3 },
            'LST': { x: 10, z: -3 }
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

        // Red team movements
        new MovePlayer('red_gk', { x: -40, z: 0 }, 0.0, 1.0),

        new MovePlayer('red_rcb', { x: -12, z: 12 }, 0.0, 0.15),
        new MovePlayer('red_rcb', { x: -10, z: 8 }, 0.15, 0.30),
        new MovePlayer('red_rcb', { x: -5, z: 4 }, 0.30, 1.0),

        new MovePlayer('red_lcb', { x: -12, z: -12 }, 0.0, 0.22),
        new MovePlayer('red_lcb', { x: -8, z: -10 }, 0.22, 0.35),
        new MovePlayer('red_lcb', { x: -3, z: -6 }, 0.35, 1.0),

        new MovePlayer('red_rb', { x: -2, z: 28 }, 0.0, 0.50),
        new MovePlayer('red_rb', { x: 8, z: 22 }, 0.50, 1.0),

        new MovePlayer('red_lb', { x: -2, z: -28 }, 0.0, 0.55),
        new MovePlayer('red_lb', { x: -2, z: -28 }, 0.55, 0.75),
        new MovePlayer('red_lb', { x: 5, z: -26 }, 0.75, 0.85),
        new MovePlayer('red_lb', { x: 10, z: -24 }, 0.85, 1.0),

        new MovePlayer('red_dm', { x: -4, z: 0 }, 0.0, 0.30),
        new MovePlayer('red_dm', { x: -2, z: 2 }, 0.30, 0.60),
        new MovePlayer('red_dm', { x: 4, z: 0 }, 0.60, 1.0),

        new MovePlayer('red_lcm', { x: 5, z: -10 }, 0.0, 0.45),
        new MovePlayer('red_lcm', { x: 8, z: -12 }, 0.45, 0.60),
        new MovePlayer('red_lcm', { x: 14, z: -10 }, 0.60, 1.0),

        new MovePlayer('red_rcm', { x: 5, z: 10 }, 0.0, 0.30),
        new MovePlayer('red_rcm', { x: 15, z: 8 }, 0.30, 1.0),

        new MovePlayer('red_lw', { x: 25, z: -28 }, 0.0, 0.85),
        new MovePlayer('red_lw', { x: 26, z: -27 }, 0.85, 0.90),
        new MovePlayer('red_lw', { x: 28, z: -25 }, 0.90, 1.0),

        new MovePlayer('red_rw', { x: 25, z: 28 }, 0.0, 1.0),

        new MovePlayer('red_cf', { x: 23, z: 0 }, 0.0, 0.40),
        new MovePlayer('red_cf', { x: 24, z: -5 }, 0.40, 0.60),
        new MovePlayer('red_cf', { x: 28, z: -4 }, 0.60, 0.90),
        new MovePlayer('red_cf', { x: 30, z: -2 }, 0.90, 1.0),

        // Blue team movements
        new MovePlayer('blue_gk', { x: 45, z: 0 }, 0.0, 1.0),

        new MovePlayer('blue_rb', { x: 26, z: 15 }, 0.0, 0.30),
        new MovePlayer('blue_rb', { x: 26, z: 10 }, 0.30, 0.45),
        new MovePlayer('blue_rb', { x: 26, z: 4 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_rb', { x: 26, z: 2 }, 0.60, 1.0),

        new MovePlayer('blue_rcb', { x: 26, z: 5 }, 0.0, 0.30),
        new MovePlayer('blue_rcb', { x: 26, z: 1 }, 0.30, 0.45),
        new MovePlayer('blue_rcb', { x: 26, z: -3 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_rcb', { x: 26, z: 5 }, 0.60, 0.95, 'quadInOut'),
        new MovePlayer('blue_rcb', { x: 25, z: 6 }, 0.95, 1.0),

        new MovePlayer('blue_lcb', { x: 26, z: -5 }, 0.0, 0.30),
        new MovePlayer('blue_lcb', { x: 26, z: -9 }, 0.30, 0.45),
        new MovePlayer('blue_lcb', { x: 26, z: -11 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_lcb', { x: 26, z: -8 }, 0.60, 1.0),

        new MovePlayer('blue_lb', { x: 26, z: -15 }, 0.0, 0.30),
        new MovePlayer('blue_lb', { x: 26, z: -18 }, 0.30, 0.45),
        new MovePlayer('blue_lb', { x: 24, z: -22 }, 0.45, 0.60, 'cubicInOut'),
        new MovePlayer('blue_lb', { x: 25, z: -26 }, 0.60, 0.88, 'quadInOut'),
        new MovePlayer('blue_lb', { x: 25, z: -20 }, 0.88, 1.0),

        new MovePlayer('blue_rm', { x: 18, z: 14 }, 0.0, 0.30),
        new MovePlayer('blue_rm', { x: 18, z: 9 }, 0.30, 0.45),
        new MovePlayer('blue_rm', { x: 18, z: 3 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_rm', { x: 18, z: 1 }, 0.60, 1.0),

        new MovePlayer('blue_rcm', { x: 18, z: 4.5 }, 0.0, 0.30),
        new MovePlayer('blue_rcm', { x: 18, z: 0.5 }, 0.30, 0.45),
        new MovePlayer('blue_rcm', { x: 18, z: -3 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_rcm', { x: 18, z: -1 }, 0.60, 1.0),

        new MovePlayer('blue_lcm', { x: 18, z: -4.5 }, 0.0, 0.30),
        new MovePlayer('blue_lcm', { x: 18, z: -8.5 }, 0.30, 0.45),
        new MovePlayer('blue_lcm', { x: 18, z: -12 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_lcm', { x: 22, z: -20 }, 0.60, 0.88, 'quadInOut'),
        new MovePlayer('blue_lcm', { x: 20, z: -14 }, 0.88, 1.0),

        new MovePlayer('blue_lm', { x: 18, z: -14 }, 0.0, 0.30),
        new MovePlayer('blue_lm', { x: 18, z: -17 }, 0.30, 0.45),
        new MovePlayer('blue_lm', { x: 16, z: -22 }, 0.45, 0.60, 'cubicInOut'),
        new MovePlayer('blue_lm', { x: 17, z: -18 }, 0.60, 1.0),

        new MovePlayer('blue_r_st', { x: 10, z: 3 }, 0.0, 0.30),
        new MovePlayer('blue_r_st', { x: 10, z: -1 }, 0.30, 0.45),
        new MovePlayer('blue_r_st', { x: 12, z: -5 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_r_st', { x: 14, z: -2 }, 0.60, 1.0),

        new MovePlayer('blue_l_st', { x: 10, z: -3 }, 0.0, 0.30),
        new MovePlayer('blue_l_st', { x: 10, z: -7 }, 0.30, 0.45),
        new MovePlayer('blue_l_st', { x: 12, z: -8 }, 0.45, 0.60, 'quadInOut'),
        new MovePlayer('blue_l_st', { x: 13, z: -11 }, 0.60, 0.80),
        new MovePlayer('blue_l_st', { x: 15, z: -7 }, 0.80, 1.0),

        // Ball movement keyframes
        new SetBallPosition('red_rcb', 0.0),
        new SetBallPosition('red_rcb', 0.15),
        new PassBall('red_rcb', 'red_lcb', 0.15, 0.22),
        new PassBall('red_lcb', 'red_lcm', 0.22, 0.30),
        new PassBall('red_lcm', 'red_lb', 0.45, 0.55),
        new PassBall('red_lb', 'red_lw', 0.75, 0.80),
        new SetBallPosition('red_lw', 0.85),
        new PassBall('red_lw', 'blue_rcb', 0.88, 0.95), // Cross received by Blue RCB
        new PassBall('blue_rcb', { x: 12, z: 12 }, 0.95, 1.0), // Headed clearance

        // Arrows
        new PassingArrow('arrow_rcb_to_lcb', { x: -12, z: 12 }, { x: -12, z: -12 }, 0.15, 0.22, { color: '#00F3FF', width: 2.5 }),
        new PassingArrow('arrow_lcb_to_lcm', { x: -12, z: -12 }, { x: 5, z: -10 }, 0.22, 0.30, { color: '#00F3FF', width: 2.5 }),
        new MovementArrow('arrow_shift_defenders', { x: 26, z: 5 }, { x: 26, z: 0 }, 0.15, 0.30, { color: '#39FF14', width: 2, dashSize: 2.0 }),
        new MovementArrow('arrow_shift_midfielders', { x: 18, z: 5 }, { x: 18, z: 0 }, 0.15, 0.30, { color: '#39FF14', width: 2, dashSize: 2.0 }),
        new PassingArrow('arrow_central_denial_cf', { x: 5, z: -10 }, { x: 23, z: 0 }, 0.30, 0.45, { color: '#EF4444', width: 2.5 }),
        new PassingArrow('arrow_central_denial_rcm', { x: 5, z: -10 }, { x: 5, z: 10 }, 0.30, 0.45, { color: '#EF4444', width: 2 }),
        new PassingArrow('arrow_lcm_to_lb', { x: 5, z: -10 }, { x: -2, z: -28 }, 0.45, 0.55, { color: '#00F3FF', width: 2 }),
        new MovementArrow('arrow_lb_steer_wide', { x: -2, z: -28 }, { x: 25, z: -28 }, 0.45, 0.60, { color: '#F97316', width: 3 }, true),
        new MovementArrow('arrow_lm_press', { x: 18, z: -14 }, { x: 16, z: -22 }, 0.45, 0.60, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_lb_press', { x: 26, z: -15 }, { x: 24, z: -22 }, 0.45, 0.60, { color: '#39FF14', width: 2.5 }),
        new MovementArrow('arrow_lcb_cover', { x: 26, z: -5 }, { x: 26, z: -11 }, 0.45, 0.60, { color: '#39FF14', width: 2 }, true),
        new MovementArrow('arrow_compact_v_dist', { x: 26, z: 0 }, { x: 18, z: 0 }, 0.60, 0.75, { color: '#00F3FF', width: 2, dashSize: 1.5, gapSize: 1.0 }),
        new MovementArrow('arrow_compact_h_dist1', { x: 18, z: -4.5 }, { x: 18, z: 4.5 }, 0.60, 0.75, { color: '#EAB308', width: 2 }),
        new MovementArrow('arrow_compact_h_dist2', { x: 26, z: -5 }, { x: 26, z: 5 }, 0.60, 0.75, { color: '#EAB308', width: 2 }),
        new PassingArrow('arrow_lb_pass_to_lw', { x: -2, z: -28 }, { x: 25, z: -28 }, 0.75, 0.80, { color: '#EF4444', width: 2.2 }),
        new MovementArrow('arrow_blue_lb_engage', { x: 24, z: -22 }, { x: 25, z: -26 }, 0.80, 0.88, { color: '#39FF14', width: 2.5, dashSpeed: 1.2 }),
        new MovementArrow('arrow_blue_lm_double', { x: 16, z: -22 }, { x: 22, z: -26 }, 0.80, 0.88, { color: '#39FF14', width: 2.5 }, true),
        new PassingArrow('arrow_forced_wide_cross', { x: 26, z: -27 }, { x: 26, z: 5 }, 0.88, 0.95, { color: '#EF4444', width: 3 }, true),
        new MovementArrow('arrow_blue_rcb_clearance', { x: 26, z: 5 }, { x: 12, z: 12 }, 0.95, 1.0, { color: '#39FF14', width: 3 }),
        new MovementArrow('arrow_threat_reduced_flow', { x: 26, z: 5 }, { x: 8, z: 15 }, 0.95, 1.0, { color: '#10B981', width: 2, dashSize: 2.0 }, true),
        new MovementArrow('arrow_midfield_shift_left', { x: 18, z: 0.5 }, { x: 18, z: -3 }, 0.45, 0.60, { color: '#39FF14', width: 2 }),
        new MovementArrow('arrow_striker_drop_cover', { x: 10, z: -7 }, { x: 12, z: -8 }, 0.30, 0.45, { color: '#39FF14', width: 2 }),

        // Overlays
        new HighlightZone('overlay_defensive_structure', OverlayType.RECTANGLE, { center: { x: 22, z: 0 }, bounds: { width: 14, length: 34, rotation: 0 } }, 0.0, 0.20, '#1D4ED8', 0.12),
        new HighlightZone('overlay_midfield_line', OverlayType.POLYGON, {
          points: [
            { x: 18, z: -15 },
            { x: 18, z: 15 },
            { x: 17.5, z: 15 },
            { x: 17.5, z: -15 }
          ]
        }, 0.0, 0.18, '#00F3FF', 0.22),
        new HighlightZone('overlay_defensive_line', OverlayType.POLYGON, {
          points: [
            { x: 26, z: -16 },
            { x: 26, z: 16 },
            { x: 25.5, z: 16 },
            { x: 25.5, z: -16 }
          ]
        }, 0.0, 0.18, '#00F3FF', 0.22),
        new HighlightZone('overlay_danger_zone', OverlayType.CIRCLE, { center: { x: 22, z: 0 }, radius: 8.5 }, 0.25, 0.50, '#EF4444', 0.16),
        new HighlightZone('overlay_central_corridor', OverlayType.RECTANGLE, { center: { x: 20, z: 0 }, bounds: { width: 35, length: 15, rotation: 0 } }, 0.25, 0.55, '#EAB308', 0.08),
        new HighlightZone('overlay_half_space_left', OverlayType.RECTANGLE, { center: { x: 20, z: -11.5 }, bounds: { width: 35, length: 7, rotation: 0 } }, 0.28, 0.55, '#00F3FF', 0.08),
        new HighlightZone('overlay_half_space_right', OverlayType.RECTANGLE, { center: { x: 20, z: 11.5 }, bounds: { width: 35, length: 7, rotation: 0 } }, 0.28, 0.55, '#00F3FF', 0.08),
        new HighlightZone('overlay_wide_space_available', OverlayType.POLYGON, {
          points: [
            { x: 0, z: -20 },
            { x: 0, z: -32 },
            { x: 30, z: -32 },
            { x: 30, z: -20 }
          ]
        }, 0.45, 0.65, '#10B981', 0.14),
        new HighlightZone('overlay_central_space_denied', OverlayType.RECTANGLE, { center: { x: 15, z: 0 }, bounds: { width: 15, length: 22, rotation: 0 } }, 0.45, 0.65, '#EF4444', 0.12),
        new HighlightZone('overlay_horizontal_compactness', OverlayType.POLYGON, {
          points: [
            { x: 26, z: 12 },
            { x: 26, z: -12 },
            { x: 27, z: -12 },
            { x: 27, z: 12 }
          ]
        }, 0.60, 0.75, '#EAB308', 0.22),
        new HighlightZone('overlay_vertical_compactness', OverlayType.RECTANGLE, { center: { x: 22, z: 0 }, bounds: { width: 8, length: 30, rotation: 0 } }, 0.60, 0.75, '#10B981', 0.15),
        new HighlightZone('overlay_pressure_trap_wide', OverlayType.CIRCLE, { center: { x: 26, z: -25 }, radius: 7.0 }, 0.80, 0.95, '#EF4444', 0.24),
        new HighlightZone('overlay_protected_space_summary', OverlayType.POLYGON, {
          points: [
            { x: 22, z: -16 },
            { x: 22, z: 16 },
            { x: 40, z: 20 },
            { x: 40, z: -20 }
          ]
        }, 0.90, 1.0, '#10B981', 0.12),
        new HighlightZone('overlay_compact_shape_summary', OverlayType.RECTANGLE, { center: { x: 22, z: -5 }, bounds: { width: 14, length: 32, rotation: 0 } }, 0.90, 1.0, '#06B6D4', 0.12),
        new HighlightZone('overlay_threat_reduction', OverlayType.CIRCLE, { center: { x: 26, z: 5 }, radius: 8.0 }, 0.92, 1.0, '#EAB308', 0.15)
      ],

      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Initial Shape', description: 'Blue defensive block in a structured 4-4-2. High horizontal and vertical compactness.' },
        { index: 2, start: 0.15, end: 0.30, name: 'Attacker Circulation', description: 'Red circulates the ball. Blue block shifts together as a collective, disciplined unit.' },
        { index: 3, start: 0.30, end: 0.45, name: 'Central Space Protection', description: 'Blue protects the danger zone and half spaces, completely closing paths into the central corridor.' },
        { index: 4, start: 0.45, end: 0.60, name: 'Forcing Wide Play', description: 'Central progression is denied. Attacking play is steered towards the touchline.' },
        { index: 5, start: 0.60, end: 0.75, name: 'Compactness Analysis', description: 'Freeze-frame analysis of distance between players and defensive lines, denying space.' },
        { index: 6, start: 0.75, end: 0.90, name: 'Low-Quality Attack', description: 'Choked near the corner, the attacker is forced into a rushed cross with low probability of success.' },
        { index: 7, start: 0.90, end: 1.0, name: 'Summary State', description: 'Threat successfully neutralized by controlling space. Defending is about structure, not chasing.' }
      ],

      annotations: [
        { start: 0.0, end: 0.15, text: 'Initial Shape: Blue defensive block is established in a 4-4-2 structure. Horizontal and vertical lines are highly compact.' },
        { start: 0.15, end: 0.30, text: 'Attacker Circulation: Red passes the ball across midfield. The entire Blue block shifts collectively as one unit to cover space.' },
        { start: 0.30, end: 0.45, text: 'Central Space Protection: Midfield and defensive lines squeeze, shutting down the central corridor and denying central progression.' },
        { start: 0.45, end: 0.60, text: 'Forcing Wide Play: Lacking central options, Red is forced to pass wide. Blue shifts further to choke touchline paths.' },
        { start: 0.60, end: 0.75, text: 'Compactness Analysis: Freeze-frame demonstrates tight line gaps (<10m) and narrow player spacing, preventing pass interception.' },
        { start: 0.75, end: 0.90, text: 'Low-Quality Attack: Pressed in the corner with no forward angles, Red winger is forced to attempt a low-value cross.' },
        { start: 0.90, end: 1.0, text: 'Summary: Coordinated space control forced a low-probability action. The central corridors remained protected, reducing threat.' }
      ],

      cameraPresets: [
        { start: 0.0, end: 0.15, preset: 'overview' },
        { start: 0.15, end: 0.45, preset: 'central_space' },
        { start: 0.45, end: 0.75, preset: 'compactness' },
        { start: 0.75, end: 1.0, preset: 'summary' }
      ],

      // Setup debug metrics builder
      debugMetricsBuilder: (fraction: number) => {
        let width = '30.0m';
        let depth = '14.5m';
        let lineDist = '8.0m';
        let compactnessScore = 95;

        if (fraction < 0.15) {
          width = '30.0m'; depth = '14.5m'; lineDist = '8.0m'; compactnessScore = 96;
        } else if (fraction < 0.30) {
          width = '28.5m'; depth = '14.0m'; lineDist = '7.8m'; compactnessScore = 98;
        } else if (fraction < 0.45) {
          width = '29.0m'; depth = '14.2m'; lineDist = '8.1m'; compactnessScore = 97;
        } else if (fraction < 0.75) {
          width = '26.0m'; depth = '13.8m'; lineDist = '7.5m'; compactnessScore = 99;
        } else {
          width = '32.0m'; depth = '15.5m'; lineDist = '8.8m'; compactnessScore = 90;
        }

        const startFrames = [0.0, 0.0, 0.0, 0.25, 0.25, 0.28, 0.28, 0.45, 0.45, 0.60, 0.60, 0.80, 0.90, 0.90, 0.92];
        const endFrames = [0.20, 0.18, 0.18, 0.50, 0.55, 0.55, 0.55, 0.65, 0.65, 0.75, 0.75, 0.95, 1.0, 1.0, 1.0];
        let activeOverlays = 0;
        for (let i = 0; i < startFrames.length; i++) {
          if (fraction >= startFrames[i] && fraction <= endFrames[i]) activeOverlays++;
        }

        return {
          teamWidth: width,
          teamDepth: depth,
          lineDistances: lineDist,
          compactnessScore: `${compactnessScore}/100`,
          activeOverlays: `${activeOverlays} active`
        };
      }
    });
  }

  // Override debug metrics to ensure currentPhase and timelinePosition are merged
  public getDebugMetrics(fraction: number) {
    const custom = super.getDebugMetrics(fraction);
    return {
      ...custom,
      currentPhase: this.getPhaseInfo(fraction).name,
      timelinePosition: `${(fraction * 100).toFixed(1)}%`
    };
  }
}
