import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  HighlightZone, 
  PassBall, 
  DribbleBall,
  SetBallPosition,
  PressTriggered,
  TrapActivated,
  PossessionWon
} from '../tacticalPrimitives/library';
import { OverlayType } from '../tacticalEngine/types';

export class GegenpressingModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'gegenpressing',
      name: 'Gegenpressing',
      description: 'An immediate, coordinated counter-press initiated immediately after losing possession, aiming to exploit the opponent\'s open shape.',
      durationSeconds: 12.0,
      
      // Global primitives loaded for both branches
      primitives: [
        // 1. Initial positions for attacking Blue team
        new FormationState('attack', '4-3-3', 'left', 
          {
            'GK': { x: -46, z: 0 },
            'LCB': { x: -24, z: -10 },
            'RCB': { x: -24, z: 10 },
            'LB': { x: -12, z: -25 },
            'RB': { x: -12, z: 25 },
            'DM': { x: -8, z: 0 },
            'LCM': { x: 2, z: -8 },
            'RCM': { x: 4, z: 8 },
            'LW': { x: 18, z: -20 },
            'RW': { x: 18, z: 20 },
            'CF': { x: 24, z: 2 }
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
          },
          true
        ),
        // 2. Initial positions for defending Red team
        new FormationState('defend', '4-3-3', 'right',
          {
            'GK': { x: 44, z: 0 },
            'LCB': { x: 28, z: -12 },
            'RCB': { x: 28, z: 12 },
            'LB': { x: 22, z: -24 },
            'RB': { x: 22, z: 24 },
            'DM': { x: 15, z: 0 },
            'LCM': { x: 6, z: -8 },
            'RCM': { x: 6, z: 8 },
            'LW': { x: -8, z: -20 },
            'RW': { x: -8, z: 20 },
            'CF': { x: -15, z: 0 }
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
          },
          true
        ),

        // Initial pass from Blue CM to Winger intercepted by Red CB
        new SetBallPosition('blue_cm_r', 0.0),
        new SetBallPosition('blue_cm_r', 0.10),
        new PassBall('blue_cm_r', 'red_cb_r', 0.10, 0.25),
        
        // Dynamic movements during the initial pass interception (0.0 to 0.25)
        new MovePlayer('blue_cm_r', { x: 8, z: 10 }, 0.10, 0.25),
        new MovePlayer('red_cb_r', { x: 24, z: 15 }, 0.10, 0.25),
        new MovePlayer('blue_rw', { x: 20, z: 18 }, 0.0, 0.25),
        new MovePlayer('blue_cf', { x: 25, z: 6 }, 0.0, 0.25),

        // Press Trigger Highlight at point of interception
        new HighlightZone('overlay_turnover_zone', OverlayType.CIRCLE, { center: { x: 24, z: 15 }, radius: 6.0 }, 0.22, 0.40, '#EF4444', 0.2),
        new PressTriggered(0.25)
      ],

      // Branch-specific counter-pressing outcomes
      branchPrimitives: {
        A: [
          // BRANCH A: Direct Swarm Gegenpress
          // Coordinated sprint to the ball carrier
          new MovePlayer('blue_cf', { x: 24, z: 15 }, 0.25, 0.50, 'quadInOut'),
          new MovePlayer('blue_rw', { x: 24, z: 15 }, 0.25, 0.50, 'quadInOut'),
          new MovePlayer('blue_cm_r', { x: 24, z: 15 }, 0.25, 0.50, 'quadInOut'),

          // Red LCB stays pinned
          new MovePlayer('red_cb_r', { x: 24, z: 15 }, 0.25, 0.50),

          // Swarm highlights showing high pressure
          new HighlightZone('overlay_swarm_press', OverlayType.CIRCLE, { center: { x: 24, z: 15 }, radius: 4.5 }, 0.35, 0.65, '#EF4444', 0.25),

          // Coordinated pressing arrows pointing to Red CB
          new MovementArrow('arrow_cf_swarm', { x: 25, z: 6 }, { x: 24, z: 15 }, 0.25, 0.45, { color: '#EF4444', width: 2.5 }),
          new MovementArrow('arrow_rw_swarm', { x: 20, z: 18 }, { x: 24, z: 15 }, 0.25, 0.45, { color: '#EF4444', width: 2.5 }),
          new MovementArrow('arrow_cm_swarm', { x: 8, z: 10 }, { x: 24, z: 15 }, 0.25, 0.45, { color: '#EF4444', width: 2.5 }),

          // Trap activated & Possession won directly
          new TrapActivated(0.40),
          new PossessionWon(0.50),

          // Ball turnover
          new SetBallPosition('blue_cf', 0.50),
          
          // Attack creation: CF passes to LW crossing inside
          new MovePlayer('blue_lw', { x: 30, z: -5 }, 0.50, 0.75, 'cubicInOut'),
          new PassBall('blue_cf', 'blue_lw', 0.55, 0.75),
          new DribbleBall('blue_lw', 0.75, 0.85),

          // Shot at goal
          new SetBallPosition({ x: 44, z: 0 }, 0.90),
          new SetBallPosition({ x: 44, z: 0 }, 1.0),

          // Visual vectors
          new PassingArrow('arrow_outlet_pass', { x: 24, z: 15 }, { x: 30, z: -5 }, 0.55, 0.75, { color: '#38FE5E', width: 2.5 }),
          new MovementArrow('arrow_shot', { x: 30, z: -5 }, { x: 44, z: 0 }, 0.85, 0.90, { color: '#EAB308', width: 3.5 })
        ],
        B: [
          // BRANCH B: Lane-Blocking Gegenpress
          // Players cut off passing lanes rather than swarming the ball directly
          new MovePlayer('blue_cf', { x: 22, z: 22 }, 0.25, 0.50), // cuts lane to Red RB
          new MovePlayer('blue_rw', { x: 18, z: 12 }, 0.25, 0.50), // cuts lane to Red DM
          new MovePlayer('blue_cm_r', { x: 12, z: 18 }, 0.25, 0.50), // screens central outlet

          // Highlight blocked passing lanes
          new HighlightZone('overlay_lane_blocks', OverlayType.RECTANGLE, { center: { x: 21, z: 18 }, bounds: { width: 6, length: 15, rotation: 0.2 } }, 0.30, 0.65, '#38FE5E', 0.15),
          
          new PassingArrow('arrow_blocked_lane_rb', { x: 24, z: 15 }, { x: 22, z: 24 }, 0.30, 0.50, { color: '#EF4444', width: 2 }),
          new PassingArrow('arrow_blocked_lane_dm', { x: 24, z: 15 }, { x: 15, z: 0 }, 0.30, 0.50, { color: '#EF4444', width: 2 }),

          // Red CB is forced into a long ball
          new MovePlayer('red_cb_r', { x: 22, z: 13 }, 0.25, 0.50),
          new SetBallPosition('red_cb_r', 0.50),
          new PassBall('red_cb_r', 'red_cf', 0.50, 0.70),

          // Intercepted by Blue LCB stepping forward
          new MovePlayer('blue_cb_l', { x: -5, z: -2 }, 0.25, 0.70, 'quadInOut'),
          new PossessionWon(0.70),
          new SetBallPosition('blue_cb_l', 0.70),

          // Build counter attack
          new PassBall('blue_cb_l', 'blue_cm_l', 0.75, 0.90),
          new MovePlayer('blue_cm_l', { x: 8, z: -10 }, 0.70, 0.90),
          new DribbleBall('blue_cm_l', 0.90, 1.0),

          // Interception arrow
          new MovementArrow('arrow_cb_intercept', { x: -24, z: -10 }, { x: -5, z: -2 }, 0.25, 0.70, { color: '#38FE5E', width: 2.5 })
        ]
      },

      // Phase segments
      phases: [
        { index: 1, start: 0.0, end: 0.10, name: 'Attacking Phase', description: 'Blue in possession, looking to penetrate the defensive shape.' },
        { index: 2, start: 0.10, end: 0.25, name: 'Turnover Moment', description: 'Blue pass is intercepted by Red RCB. Red transitions into an open, counter-attacking shape.' },
        { index: 3, start: 0.25, end: 0.50, name: 'Counter-Press Trigger', description: 'Gegenpressing activates instantly. Blue must choose: Swarm the ball carrier or Block passing lanes.' },
        {
          index: 4,
          start: 0.50,
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
          name: 'Counter Transition',
          description: 'BRANCH_OUTCOME_DESC_6'
        }
      ],

      // Teaching Annotations
      annotations: [
        { start: 0.0, end: 0.10, text: 'Blue builds up in possession, looking to play into the forward lines.' },
        { start: 0.10, end: 0.25, text: 'Turnover: Blue CM misplaced pass is intercepted by Red LCB.' },
        { start: 0.25, end: 0.50, text: 'BRANCH_ANNOTATION_3' },
        { start: 0.50, end: 0.75, text: 'BRANCH_ANNOTATION_4' },
        { start: 0.75, end: 0.90, text: 'BRANCH_ANNOTATION_5' },
        { start: 0.90, end: 1.0, text: 'BRANCH_ANNOTATION_6' }
      ]
    });
  }

  public getPhaseInfo(t: number) {
    const info = super.getPhaseInfo(t);
    if (info.name === 'BRANCH_OUTCOME_PHASE_4') {
      info.name = this.activeBranch === 'A' ? 'Sustained Swarm' : 'Lane Constriction';
      info.description = this.activeBranch === 'A' 
        ? 'Three closest players converge immediately, swarming the ball carrier.' 
        : 'Attackers drop into cover positions, screening immediate outlet paths.';
    } else if (info.name === 'BRANCH_OUTCOME_PHASE_5') {
      info.name = 'Possession Regained';
      info.description = this.activeBranch === 'A'
        ? 'Blue wins possession in Zone 14 and slides a pass through to the left winger.'
        : 'Red RCB plays a hurried long ball that is easily intercepted by Blue CB.';
    } else if (info.name === 'Counter Transition') {
      info.description = 'Possession recovered. Gegenpressing prevents defensive organization and launches a high-value transition.';
    }
    return info;
  }

  public getTeachingAnnotation(t: number): string {
    if (t >= 0.25 && t < 0.50) {
      return this.activeBranch === 'A'
        ? 'Gegenpress A: Immediate swarm. Closest Blue players converge on the ball.'
        : 'Gegenpress B: Passing Lane screening. Players position to cover outlet receivers.';
    }
    if (t >= 0.50 && t < 0.75) {
      return this.activeBranch === 'A'
        ? 'Blue swarms RCB, wins the ball back, and plays a quick lateral pass.'
        : 'Failing to find a short pass, Red RCB hits a long clearance intercepted by Blue LCB.';
    }
    if (t >= 0.75 && t < 0.90) {
      return this.activeBranch === 'A'
        ? 'Blue winger drives into the penalty area, receiving the transitional pass.'
        : 'Blue LCB wins the header, turning possession over and feeding CM to build.';
    }
    if (t >= 0.90 && t <= 1.0) {
      return this.activeBranch === 'A'
        ? 'Summary: Ball won high up, resulting in a clean shot and goal in transition.'
        : 'Summary: Positional dominance maintained. Pressing prevented a clean breakout.';
    }
    return super.getTeachingAnnotation(t);
  }
}
