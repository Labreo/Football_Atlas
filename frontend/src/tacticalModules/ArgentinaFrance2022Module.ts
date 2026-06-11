import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import {
  FormationState,
  MovePlayer,
  PassingArrow,
  MovementArrow,
  HighlightZone,
  PassBall,
  SetBallPosition,
  DribbleBall,
  TacticalPrimitive,
  PrimitiveCompileContext,
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
        concept_id: 'compactness_pressing_lines',
        ...this.data
      }
    });
  }
}

export class ArgentinaFrance2022Module extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'argentina_france_2022_equaliser',
      name: "Mbappé's Equaliser vs Argentina (2022)",
      description: "A premium showcase breakdown of France's equaliser three passes before Kylian Mbappé's volley in the World Cup Final.",
      durationSeconds: 12.0,

      primitives: [
        // 1. Argentina Defending Shape Setup (4-3-3 right)
        new FormationState('defend', '4-3-3', 'right',
          {
            'GK': { x: 42, z: 0 },
            'RB': { x: 18, z: -20 },
            'RCB': { x: 22, z: -6 },
            'LCB': { x: 22, z: 6 },
            'LB': { x: 18, z: 20 },
            'RCM': { x: 8, z: -10 },
            'DM': { x: 10, z: 0 },
            'LCM': { x: 8, z: 10 }
          },
          {
            'GK': 'def_gk',
            'RB': 'def_molina',
            'RCB': 'def_romero',
            'LCB': 'def_otamendi',
            'LB': 'def_tagliafico',
            'RCM': 'def_de_paul',
            'DM': 'def_enzo',
            'LCM': 'def_mac_allister'
          },
          true
        ),

        // 2. France Attacking Shape Setup (4-3-3 left)
        new FormationState('attack', '4-3-3', 'left',
          {
            'GK': { x: -42, z: 0 },
            'LCM': { x: -12, z: 5 },
            'LW': { x: 10, z: -18 },
            'CF': { x: 8, z: -2 },
            'RW': { x: 15, z: 20 },
            'RCM': { x: -5, z: 10 },
            'RCB': { x: -25, z: 10 },
            'LCB': { x: -25, z: -10 },
            'RB': { x: -15, z: 22 },
            'LB': { x: -15, z: -22 }
          },
          {
            'GK': 'att_gk',
            'LCM': 'att_rabiot',
            'LW': 'att_mbappe',
            'CF': 'att_thuram',
            'RW': 'att_coman',
            'RCM': 'att_griezmann',
            'RCB': 'att_rcb',
            'LCB': 'att_lcb',
            'RB': 'att_rb',
            'LB': 'att_lb'
          }
        ),

        // Static setups / background movements
        new MovePlayer('att_gk', { x: -42, z: 0 }, 0.0, 1.0),
        new MovePlayer('att_rcb', { x: -25, z: 10 }, 0.0, 1.0),
        new MovePlayer('att_lcb', { x: -25, z: -10 }, 0.0, 1.0),
        new MovePlayer('att_rb', { x: -15, z: 22 }, 0.0, 1.0),
        new MovePlayer('att_lb', { x: -15, z: -22 }, 0.0, 1.0),
        new MovePlayer('att_coman', { x: 15, z: 20 }, 0.0, 1.0),
        new MovePlayer('att_griezmann', { x: -5, z: 10 }, 0.0, 1.0),

        new MovePlayer('def_otamendi', { x: 22, z: 6 }, 0.0, 1.0),
        new MovePlayer('def_tagliafico', { x: 18, z: 20 }, 0.0, 1.0),

        // Phase 1: France wins possession, Rabiot gathers ball
        new DribbleBall('att_rabiot', 0.0, 0.30),
        new MovePlayer('att_rabiot', { x: -12, z: 5 }, 0.0, 0.15),
        new MovePlayer('att_rabiot', { x: -8, z: 7 }, 0.15, 0.30, 'quadInOut'),
        new MovePlayer('att_rabiot', { x: -8, z: 7 }, 0.30, 1.0),

        // Argentina midfielders shift but stay high, leaving a gap behind
        new MovePlayer('def_de_paul', { x: 8, z: -10 }, 0.0, 0.15),
        new MovePlayer('def_de_paul', { x: 2, z: -12 }, 0.15, 0.45, 'quadInOut'),
        new MovePlayer('def_de_paul', { x: 2, z: -12 }, 0.45, 1.0),

        new MovePlayer('def_enzo', { x: 10, z: 0 }, 0.0, 0.15),
        new MovePlayer('def_enzo', { x: 4, z: -2 }, 0.15, 0.45, 'quadInOut'),
        new MovePlayer('def_enzo', { x: 4, z: -2 }, 0.45, 1.0),

        new MovePlayer('def_mac_allister', { x: 8, z: 10 }, 0.0, 0.15),
        new MovePlayer('def_mac_allister', { x: 6, z: 6 }, 0.15, 0.45, 'quadInOut'),
        new MovePlayer('def_mac_allister', { x: 6, z: 6 }, 0.45, 1.0),

        // Highlight the fatigue-induced gap / vertical line disconnection
        new HighlightZone('vertical_gap', OverlayType.POLYGON, {
          points: [
            { x: 21, z: 15 },
            { x: 21, z: -15 },
            { x: 5, z: -15 },
            { x: 5, z: 15 }
          ]
        }, 0.20, 0.75, '#FF0055', 0.15),

        // Phase 2: Rabiot passes to Mbappé wide
        new PassBall('att_rabiot', 'att_mbappe', 0.30, 0.40),
        new PassingArrow('pass_to_mbappe_arrow', { x: -8, z: 7 }, { x: 14, z: -20 }, 0.30, 0.39, { color: '#00F3FF', width: 2.2 }),

        new MovePlayer('att_mbappe', { x: 10, z: -18 }, 0.0, 0.30),
        new MovePlayer('att_mbappe', { x: 14, z: -20 }, 0.30, 0.40),
        new MovePlayer('att_mbappe', { x: 20, z: -15 }, 0.40, 0.60, 'quadInOut'),

        new MovePlayer('def_molina', { x: 18, z: -20 }, 0.0, 0.30),
        new MovePlayer('def_molina', { x: 20, z: -18 }, 0.30, 0.60, 'quadInOut'),
        new MovePlayer('def_molina', { x: 22, z: -15 }, 0.60, 1.0),

        // Phase 3: Mbappé delivers centrally to Thuram
        new DribbleBall('att_mbappe', 0.40, 0.60),
        new PassBall('att_mbappe', 'att_thuram', 0.60, 0.68),
        new PassingArrow('pass_to_thuram_arrow', { x: 20, z: -15 }, { x: 24, z: -2 }, 0.60, 0.67, { color: '#00F3FF', width: 2.2 }),

        new MovePlayer('att_thuram', { x: 8, z: -2 }, 0.0, 0.30),
        new MovePlayer('att_thuram', { x: 10, z: -3 }, 0.30, 0.60),
        new MovePlayer('att_thuram', { x: 24, z: -2 }, 0.60, 0.68, 'quadInOut'),
        new MovePlayer('att_thuram', { x: 24, z: -2 }, 0.68, 0.80),
        new MovePlayer('att_thuram', { x: 20, z: -1 }, 0.80, 1.0, 'quadInOut'),

        // Romero steps up, stretching the backline
        new MovePlayer('def_romero', { x: 22, z: -6 }, 0.0, 0.60),
        new MovePlayer('def_romero', { x: 20, z: -3 }, 0.60, 0.80, 'quadInOut'),
        new MovePlayer('def_romero', { x: 28, z: -6 }, 0.80, 1.0, 'sineInOut'),

        // Phase 4: Thuram lay-off back to Mbappé making run
        new DribbleBall('att_thuram', 0.68, 0.72),
        new MovePlayer('att_mbappe', { x: 30, z: -8 }, 0.60, 0.82, 'quadInOut'),
        new PassBall('att_thuram', 'att_mbappe', 0.72, 0.82),
        new PassingArrow('pass_layoff_arrow', { x: 24, z: -2 }, { x: 30, z: -8 }, 0.72, 0.81, { color: '#00F3FF', width: 2.2 }),
        new MovementArrow('mbappe_run_arrow', { x: 20, z: -15 }, { x: 30, z: -8 }, 0.65, 0.80, { color: '#39FF14', width: 2, dashSize: 2.0 }),

        // Phase 5: Volley strike into net
        new DribbleBall('att_mbappe', 0.82, 0.90),
        new MovePlayer('att_mbappe', { x: 32, z: -8 }, 0.82, 0.90, 'sineInOut'),
        new MovePlayer('att_mbappe', { x: 32, z: -8 }, 0.90, 1.0),
        new PassBall('att_mbappe', 'def_gk', 0.90, 0.95),
        new PassingArrow('volley_shot_arrow', { x: 32, z: -8 }, { x: 44, z: -1 }, 0.90, 0.94, { color: '#EAB308', width: 2.5 }),
        new MovePlayer('def_gk', { x: 42, z: 0 }, 0.0, 0.90),
        new MovePlayer('def_gk', { x: 43, z: -3 }, 0.90, 0.96, 'quadInOut'),
        new MovePlayer('def_gk', { x: 43, z: -3 }, 0.96, 1.0),
        new SetBallPosition('def_gk', 0.95),

        // Space highlight inside the box for Mbappé's shot
        new HighlightZone('shot_zone_highlight', OverlayType.CIRCLE, { center: { x: 32, z: -8 }, radius: 4.5 }, 0.85, 1.0, '#39FF14', 0.18),

        // Analytics Triggers
        new AnalyticsTrigger('possession_recovery', 0.10),
        new AnalyticsTrigger('pass_to_mbappe', 0.35),
        new AnalyticsTrigger('central_delivery', 0.60),
        new AnalyticsTrigger('wall_pass', 0.80),
        new AnalyticsTrigger('mbappe_volley', 0.95)
      ],

      // Camera views
      cameraPresets: [
        { start: 0.0, end: 0.20, preset: 'overview' },
        { start: 0.20, end: 0.50, preset: 'passing_lane' },
        { start: 0.50, end: 0.70, preset: 'tactical_shape' },
        { start: 0.70, end: 0.90, preset: 'space_creation' },
        { start: 0.90, end: 1.0, preset: 'overview' }
      ],

      // Phase segments
      phases: [
        { index: 1, start: 0.0, end: 0.20, name: 'France possession recovery', description: "France wins possession in midfield. Rabiot gathers the ball. Argentina's midfield is in a compact defensive shape initially." },
        { index: 2, start: 0.20, end: 0.50, name: 'Pass to Mbappé Wide', description: "Rabiot passes wide to Mbappé. Argentina's midfield shifts, but fatigue prevents them from dropping centrally." },
        { index: 3, start: 0.50, end: 0.70, name: 'Central Delivery to No. 9', description: "Mbappé plays to the No. 9 centrally. Argentina's midfield is high and flat, completely disconnected from the backline." },
        { index: 4, start: 0.70, end: 0.90, name: 'No. 9 Lay-off', description: "The No. 9 plays a first-time wall pass back to Mbappé making an inside sprint, drawing Romero out of shape." },
        { index: 5, start: 0.90, end: 1.0, name: 'Mbappé equaliser volley', description: "Mbappé receives the lay-off and strikes a volley into the goal." }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.20, text: 'France possession recovery: Argentina starts compact but fatigue has set in.' },
        { start: 0.20, end: 0.50, text: 'Pass to Mbappé: Argentina shifts, but midfield fails to track back.' },
        { start: 0.50, end: 0.70, text: 'Central delivery: Massive gap between midfield and defensive line highlighted.' },
        { start: 0.70, end: 0.90, text: 'No. 9 lay-off: Rapid wall pass bypasses Romero stepping up.' },
        { start: 0.90, end: 1.0, text: 'Mbappé equaliser volley: High-precision volley seals the dramatic equaliser.' }
      ]
    });
  }
}