import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  HighlightZone, 
  HighlightNumericalAdvantage, 
  PassBall, 
  DribbleBall,
  SetBallPosition,
  DefenderFollows,
  DefenderHolds
} from '../tacticalPrimitives/library';
import { OverlayType } from '../tacticalEngine/types';

export class False9Module extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'false_9',
      name: 'False 9',
      description: 'A tactical striker who drops deep into central midfield to draw center-backs out of position, creating space behind.',
      durationSeconds: 12.0,
      
      // Global primitives loaded for both branches
      primitives: [
        // 1. Initial positions
        new FormationState('attack', '4-3-3', 'left', 
          {
            'Central Midfielder': { x: -15, z: 5 },
            'CF': { x: 20, z: 0 },
            'Left Winger': { x: 15, z: -22 },
            'Right Winger': { x: 15, z: 22 },
            'Right Midfielder': { x: -5, z: 12 }
          },
          {
            'Central Midfielder': 'att_passer',
            'CF': 'att_false9',
            'Left Winger': 'att_winger_left',
            'Right Winger': 'att_winger_right',
            'Right Midfielder': 'att_mid_right'
          }
        ),
        new FormationState('defend', '4-3-3', 'right',
          {
            'Left Center Back': { x: 22, z: -6 },
            'Right Center Back': { x: 22, z: 6 },
            'Left Back': { x: 18, z: -18 },
            'Right Back': { x: 18, z: 18 },
            'Defensive Midfielder': { x: 10, z: 0 }
          },
          {
            'Left Center Back': 'def_cb_left',
            'Right Center Back': 'def_cb_right',
            'Left Back': 'def_lb',
            'Right Back': 'def_rb',
            'Defensive Midfielder': 'def_dm'
          }
        ),

        // 2. Global movements
        new MovePlayer('att_passer', { x: -15, z: 5 }, 0.0, 0.2),
        new MovePlayer('att_passer', { x: -10, z: 3 }, 0.2, 0.5),
        new MovePlayer('att_passer', { x: -8, z: 2 }, 0.5, 1.0),

        new MovePlayer('att_false9', { x: 20, z: 0 }, 0.0, 0.15),
        new MovePlayer('att_false9', { x: 2, z: 0 }, 0.15, 0.45, 'quadInOut'),

        new MovePlayer('att_winger_right', { x: 15, z: 22 }, 0.0, 0.5),
        new MovePlayer('att_winger_right', { x: 25, z: 20 }, 0.5, 1.0),

        new MovePlayer('att_mid_right', { x: -5, z: 12 }, 0.0, 0.3),
        new MovePlayer('att_mid_right', { x: 10, z: 10 }, 0.3, 1.0),

        new MovePlayer('def_cb_right', { x: 22, z: 6 }, 0.0, 0.3),
        new MovePlayer('def_cb_right', { x: 21, z: 3 }, 0.3, 0.7),
        new MovePlayer('def_cb_right', { x: 20, z: 1 }, 0.7, 1.0),

        new MovePlayer('def_lb', { x: 18, z: -18 }, 0.0, 0.5),
        new MovePlayer('def_lb', { x: 22, z: -14 }, 0.5, 1.0),

        new MovePlayer('def_rb', { x: 18, z: 18 }, 0.0, 1.0),

        new MovePlayer('def_dm', { x: 10, z: 0 }, 0.0, 0.2),
        new MovePlayer('def_dm', { x: 6, z: 2 }, 0.2, 0.5),
        new MovePlayer('def_dm', { x: 8, z: 4 }, 0.5, 1.0),

        // Ball CM -> F9
        new SetBallPosition('att_passer', 0.0),
        new SetBallPosition('att_passer', 0.2),
        new PassBall('att_passer', 'att_false9', 0.2, 0.45),

        // Arrows
        new MovementArrow('arrow_f9_drop', { x: 20, z: 0 }, { x: 2, z: 0 }, 0.15, 0.45, { color: '#39FF14', width: 3, dashSpeed: 1.0, dashSize: 1.5 }),
        new PassingArrow('pass_lane_1', 'att_passer', { x: 2, z: 0 }, 0.18, 0.38, { color: '#00F3FF', width: 2 }),

        // Overlays
        new HighlightNumericalAdvantage({ x: 2, z: 0 }, 7.0, 0.45, 0.85, '#00F3FF', 0.18)
      ],

      // Branch-specific primitives
      branchPrimitives: {
        A: [
          // Movements
          new MovePlayer('att_false9', { x: 2, z: 0 }, 0.45, 0.65),
          new MovePlayer('att_false9', { x: 3, z: 1 }, 0.65, 0.85),
          new MovePlayer('att_false9', { x: 8, z: 3 }, 0.85, 1.0),

          new MovePlayer('att_winger_left', { x: 15, z: -22 }, 0.0, 0.45),
          new MovePlayer('att_winger_left', { x: 26, z: -10 }, 0.45, 0.75, 'cubicInOut'),
          new MovePlayer('att_winger_left', { x: 36, z: -5 }, 0.75, 1.0),

          new MovePlayer('def_cb_left', { x: 22, z: -6 }, 0.0, 0.25),
          new MovePlayer('def_cb_left', { x: 8, z: -3 }, 0.25, 0.55, 'quadInOut'),
          new MovePlayer('def_cb_left', { x: 8, z: -3 }, 0.55, 0.75),
          new MovePlayer('def_cb_left', { x: 18, z: -6 }, 0.75, 1.0),

          // Ball pass 2: F9 -> LW run
          new PassBall('att_false9', 'att_winger_left', 0.65, 0.80),
          new DribbleBall('att_winger_left', 0.80, 1.0),

          // Arrows
          new MovementArrow('arrow_cb_follow', { x: 22, z: -6 }, { x: 8, z: -3 }, 0.25, 0.55, { color: '#DC2626', width: 2 }),
          new MovementArrow('arrow_winger_run', { x: 15, z: -22 }, { x: 26, z: -10 }, 0.45, 0.75, { color: '#39FF14', width: 3, dashSpeed: 1.2 }, true),
          new PassingArrow('pass_lane_2', { x: 3, z: 1 }, { x: 28, z: -10 }, 0.62, 0.78, { color: '#00F3FF', width: 2.5 }),

          // Overlays
          new HighlightZone('overlay_vacated_space', OverlayType.CIRCLE, { center: { x: 20, z: 0 }, radius: 5.5 }, 0.30, 0.90, '#39FF14', 0.2),
          new HighlightZone('overlay_defensive_gap', OverlayType.POLYGON, {
            points: [
              { x: 22, z: -14 },
              { x: 22, z: -3 },
              { x: 16, z: -3 },
              { x: 16, z: -14 }
            ]
          }, 0.50, 0.95, '#FF0055', 0.22),

          // Decision Event
          new DefenderFollows(0.60)
        ],
        B: [
          // Movements
          new MovePlayer('att_false9', { x: 2, z: 0 }, 0.45, 0.45),
          new MovePlayer('att_false9', { x: 12, z: 0 }, 0.45, 0.70, 'linear'),
          new MovePlayer('att_false9', { x: 12, z: 0 }, 0.70, 1.0),

          new MovePlayer('att_winger_left', { x: 15, z: -22 }, 0.0, 0.5),
          new MovePlayer('att_winger_left', { x: 28, z: -20 }, 0.5, 1.0),

          new MovePlayer('def_cb_left', { x: 22, z: -6 }, 0.0, 1.0),

          new MovePlayer('att_winger_right', { x: 15, z: 22 }, 0.0, 0.5),
          new MovePlayer('att_winger_right', { x: 28, z: 14 }, 0.5, 0.85, 'cubicInOut'),
          new MovePlayer('att_winger_right', { x: 32, z: 12 }, 0.85, 1.0),

          new MovePlayer('def_dm', { x: 10, z: 0 }, 0.0, 0.4),
          new MovePlayer('def_dm', { x: 15, z: 2 }, 0.4, 0.7),
          new MovePlayer('def_dm', { x: 16, z: 3 }, 0.7, 1.0),

          // Ball dribble & pass
          new DribbleBall('att_false9', 0.45, 0.70),
          new PassBall('att_false9', 'att_winger_right', 0.70, 0.85),
          new DribbleBall('att_winger_right', 0.85, 1.0),

          // Arrows
          new MovementArrow('arrow_f9_dribble', { x: 2, z: 0 }, { x: 12, z: 0 }, 0.45, 0.70, { color: '#39FF14', width: 2, dashSpeed: 0.8 }, true),
          new PassingArrow('pass_lane_2', { x: 12, z: 0 }, { x: 28, z: 14 }, 0.68, 0.85, { color: '#00F3FF', width: 2.5 }),

          // Overlays
          new HighlightZone('overlay_vacated_space', OverlayType.CIRCLE, { center: { x: 20, z: 0 }, radius: 5.5 }, 0.30, 0.65, '#39FF14', 0.2),
          new HighlightZone('overlay_between_lines', OverlayType.RECTANGLE, { center: { x: 12, z: 0 }, bounds: { width: 12, length: 24, rotation: 0 } }, 0.35, 0.85, '#39FF14', 0.18),

          // Decision Event
          new DefenderHolds(0.60)
        ]
      },

      // Phase segments
      phases: [
        { index: 1, start: 0.0, end: 0.15, name: 'Initial Shape', description: 'Blue in a standard 4-3-3 attacking block. Red is defensive and compact.' },
        { index: 2, start: 0.15, end: 0.40, name: 'False 9 Drops', description: 'The Center Forward drops deep into midfield, vacating the central attacking space.' },
        { index: 3, start: 0.40, end: 0.60, name: 'Decision Point', description: 'The opposing Left Center Back must choose: follow the False 9 or hold the line.' },
        {
          index: 4,
          start: 0.60,
          end: 0.75,
          name: 'BRANCH_OUTCOME_PHASE_4',
          description: 'BRANCH_OUTCOME_DESC_4'
        },
        {
          index: 5,
          start: 0.75,
          end: 0.90,
          name: 'BRANCH_OUTCOME_PHASE_5',
          description: 'BRANCH_OUTCOME_DESC_5'
        },
        {
          index: 6,
          start: 0.90,
          end: 1.0,
          name: 'Summary State',
          description: 'BRANCH_OUTCOME_DESC_6'
        }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.15, text: 'Initial Shape: Blue attacking in a 4-3-3 against a compact Red block.' },
        { start: 0.15, end: 0.40, text: 'False 9 drops deep into midfield, drawing away from the defenders.' },
        { start: 0.40, end: 0.60, text: 'BRANCH_ANNOTATION_3' },
        { start: 0.60, end: 0.75, text: 'BRANCH_ANNOTATION_4' },
        { start: 0.75, end: 0.90, text: 'BRANCH_ANNOTATION_5' },
        { start: 0.90, end: 1.0, text: 'BRANCH_ANNOTATION_6' }
      ]
    });
  }

  public getPhaseInfo(t: number) {
    const info = super.getPhaseInfo(t);
    if (info.name === 'BRANCH_OUTCOME_PHASE_4') {
      info.name = this.activeBranch === 'A' ? 'Center Back Follows' : 'Center Back Holds';
      info.description = this.activeBranch === 'A' 
        ? 'LCB follows, opening a critical gap in the defensive line.' 
        : 'LCB stays in position, leaving the False 9 free to turn in space.';
    } else if (info.name === 'BRANCH_OUTCOME_PHASE_5') {
      info.name = 'Attacking Exploitation';
      info.description = this.activeBranch === 'A'
        ? 'Left Winger makes a diagonal run into the gap to receive a through pass.'
        : 'False 9 turns and drives forward, opening diagonal passing lanes to wingers.';
    } else if (info.name === 'Summary State') {
      info.description = 'Defensive block disrupted. Attacking team achieves a numerical and positional advantage.';
    }
    return info;
  }

  public getTeachingAnnotation(t: number): string {
    if (t >= 0.40 && t < 0.60) {
      return this.activeBranch === 'A'
        ? 'Defensive Reaction A: Red Left Center Back follows the False 9 deep.'
        : 'Defensive Reaction B: Red Center Back holds the line, leaving the False 9 unmarked.';
    }
    if (t >= 0.60 && t < 0.75) {
      return this.activeBranch === 'A'
        ? 'LCB follows, exposing a dangerous gap in Red\'s defensive line.'
        : 'With the center back staying deep, the False 9 receives freely between the lines.';
    }
    if (t >= 0.75 && t < 0.90) {
      return this.activeBranch === 'A'
        ? 'Left Winger exploits the defensive gap, making a diagonal run behind.'
        : 'False 9 turns, drives forward, and opens passing lanes to both wingers.';
    }
    if (t >= 0.90 && t <= 1.0) {
      return this.activeBranch === 'A'
        ? 'Summary: Space successfully exploited. Blue winger receives a through ball behind.'
        : 'Summary: Midfield overload created. Blue False 9 easily penetrates the defensive block.';
    }
    return super.getTeachingAnnotation(t);
  }
}
