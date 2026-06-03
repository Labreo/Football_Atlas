import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import { 
  FormationState, 
  MovePlayer, 
  PassingArrow, 
  MovementArrow,
  PressingArrow,
  HighlightZone, 
  HighlightPassingLane,
  PassBall, 
  DribbleBall,
  SetBallPosition,
  PressTriggered,
  TrapActivated,
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
        concept_id: 'pressing_trap',
        ...this.data
      }
    });
  }
}

export class PressingTrapModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'pressing_trap',
      name: 'Pressing Trap',
      description: 'A coordinated defensive shape where a team intentionally leaves a passing option open to invite a pass, then closes the receiver down with multiple players as the pass is played.',
      durationSeconds: 12.0,
      
      primitives: [
        // 1. Red team initial setup (building from the back, defend team type = styled Red)
        new FormationState('defend', '4-3-3', 'left',
          {
            'GK': { x: -44, z: 0 },
            'LCB': { x: -32, z: -12 },
            'RCB': { x: -32, z: 12 },
            'LB': { x: -24, z: -25 },
            'RB': { x: -24, z: 25 },
            'DM': { x: -18, z: 0 },
            'LCM': { x: -12, z: -8 },
            'RCM': { x: -12, z: 8 },
            'LW': { x: -2, z: -22 },
            'RW': { x: -2, z: 22 },
            'CF': { x: 2, z: 0 }
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

        // 2. Blue team initial setup (defending/pressing team, attack team type = styled Blue)
        new FormationState('attack', '4-3-3', 'right',
          {
            'GK': { x: 42, z: 0 },
            'LCB': { x: 18, z: -6 },
            'RCB': { x: 18, z: 6 },
            'LB': { x: 14, z: -20 },
            'RB': { x: 14, z: 20 },
            'DM': { x: 6, z: 0 },
            'LCM': { x: -2, z: -8 },
            'RCM': { x: -2, z: 8 },
            'CF': { x: -10, z: 0 },
            'LW': { x: -14, z: -15 },
            'RW': { x: -14, z: 15 }
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

        // Red team movements (possession phase)
        new MovePlayer('red_gk', { x: -44, z: 0 }, 0.0, 1.0),
        new MovePlayer('red_cb_r', { x: -32, z: 12 }, 0.0, 0.40),
        new MovePlayer('red_cb_r', { x: -32, z: 12 }, 0.40, 1.0),
        
        new MovePlayer('red_cb_l', { x: -32, z: -12 }, 0.0, 0.20),
        new MovePlayer('red_cb_l', { x: -29, z: -14 }, 0.20, 0.42),
        new MovePlayer('red_cb_l', { x: -29, z: -14 }, 0.42, 1.0),

        new MovePlayer('red_lb', { x: -24, z: -25 }, 0.0, 0.20),
        new MovePlayer('red_lb', { x: -22, z: -26 }, 0.20, 0.40),
        new MovePlayer('red_lb', { x: -22, z: -26 }, 0.40, 1.0),

        new MovePlayer('red_cm_l', { x: -12, z: -8 }, 0.0, 0.20),
        // drops deep to receive, baiting the trap
        new MovePlayer('red_cm_l', { x: -14, z: -9 }, 0.20, 0.42),
        new MovePlayer('red_cm_l', { x: -11, z: -8 }, 0.42, 0.55),
        // gets closed down and tackled
        new MovePlayer('red_cm_l', { x: -11, z: -8 }, 0.55, 0.75),
        new MovePlayer('red_cm_l', { x: -12, z: -7 }, 0.75, 1.0),

        // Blue team movements (pressing trap phase)
        new MovePlayer('blue_gk', { x: 42, z: 0 }, 0.0, 1.0),
        
        // striker curves run to block GK and RCB pass options
        new MovePlayer('blue_cf', { x: -10, z: 0 }, 0.0, 0.20),
        new MovePlayer('blue_cf', { x: -24, z: -2 }, 0.20, 0.40, 'quadInOut'),
        new MovePlayer('blue_cf', { x: -24, z: -2 }, 0.40, 0.55),
        new MovePlayer('blue_cf', { x: -13, z: -7 }, 0.55, 0.75, 'cubicInOut'), // converges on LCM
        new MovePlayer('blue_cf', { x: -10, z: -5 }, 0.75, 1.0),

        // winger closes down Left Back
        new MovePlayer('blue_rw', { x: -14, z: 15 }, 0.0, 0.20),
        new MovePlayer('blue_rw', { x: -22, z: -18 }, 0.20, 0.40, 'quadInOut'),
        new MovePlayer('blue_rw', { x: -22, z: -18 }, 0.40, 0.75),
        new MovePlayer('blue_rw', { x: -15, z: -20 }, 0.75, 0.90, 'cubicInOut'), // runs to receive counter pass
        new MovePlayer('blue_rw', { x: -12, z: -20 }, 0.90, 1.0),

        // midfielder shuts the trap from front
        new MovePlayer('blue_cm_l', { x: -2, z: -8 }, 0.0, 0.20),
        new MovePlayer('blue_cm_l', { x: -2, z: -8 }, 0.20, 0.40),
        new MovePlayer('blue_cm_l', { x: -2, z: -8 }, 0.40, 0.55),
        new MovePlayer('blue_cm_l', { x: -11, z: -8 }, 0.55, 0.75, 'quadInOut'), // springs the trap
        new MovePlayer('blue_cm_l', { x: -11, z: -8 }, 0.75, 0.90), // wins possession, passes
        new MovePlayer('blue_cm_l', { x: -13, z: -6 }, 0.90, 1.0),

        // defensive midfielder shuts the trap from other side
        new MovePlayer('blue_dm', { x: 6, z: 0 }, 0.0, 0.20),
        new MovePlayer('blue_dm', { x: 6, z: 0 }, 0.20, 0.40),
        new MovePlayer('blue_dm', { x: 6, z: 0 }, 0.40, 0.55),
        new MovePlayer('blue_dm', { x: -11, z: -5 }, 0.55, 0.75, 'quadInOut'), // converges
        new MovePlayer('blue_dm', { x: -9, z: -4 }, 0.75, 1.0),

        // Ball movement keyframes
        new SetBallPosition('red_gk', 0.0),
        new SetBallPosition('red_gk', 0.20),
        new PassBall('red_gk', 'red_cb_l', 0.20, 0.35),
        new DribbleBall('red_cb_l', 0.35, 0.42),
        // false availability pass
        new PassBall('red_cb_l', 'red_cm_l', 0.42, 0.55),
        // trap sprung
        new DribbleBall('red_cm_l', 0.55, 0.75),
        // turnover: Blue wins ball, passes to RW
        new PassBall('blue_cm_l', 'blue_rw', 0.75, 0.90),
        new DribbleBall('blue_rw', 0.90, 1.0),

        // Arrows
        new PassingArrow('pass_gk_cb', { x: -44, z: 0 }, { x: -32, z: -12 }, 0.20, 0.35),
        new MovementArrow('winger_press_lb', { x: -14, z: 15 }, { x: -22, z: -18 }, 0.20, 0.40),
        new MovementArrow('striker_curve_press', { x: -10, z: 0 }, { x: -24, z: -2 }, 0.20, 0.40, {}, true),
        
        // false passing option highlighted
        new PassingArrow('pass_cb_to_cm', { x: -29, z: -14 }, { x: -14, z: -9 }, 0.42, 0.55, { color: '#00F3FF' }),

        // trap arrows
        new PressingArrow('press_striker_back', { x: -24, z: -2 }, { x: -13, z: -7 }, 0.55, 0.75),
        new PressingArrow('press_mid_front', { x: -2, z: -8 }, { x: -11, z: -8 }, 0.55, 0.75),
        new PressingArrow('press_dm_side', { x: 6, z: 0 }, { x: -11, z: -5 }, 0.55, 0.75),

        // counter arrows
        new PassingArrow('pass_counter', { x: -11, z: -8 }, { x: -15, z: -20 }, 0.75, 0.90, { color: '#39FF14' }),

        // Overlays
        // 1. Passing Lane (False Availability)
        new HighlightPassingLane('red_cb_l', 'red_cm_l', 0.40, 0.55),
        
        // 2. Trap Zone
        new HighlightZone('trap_zone', OverlayType.CIRCLE, { center: { x: -12, z: -8 }, radius: 6.0 }, 0.20, 0.90, '#DC2626', 0.15),
        
        // 3. Pressure Funnel
        new HighlightZone('pressure_funnel', OverlayType.POLYGON, {
          points: [
            { x: -24, z: -2 },
            { x: -2, z: -8 },
            { x: 6, z: 0 },
            { x: -12, z: -15 }
          ]
        }, 0.20, 0.75, '#DC2626', 0.1),

        // 4. Receiving Isolation Zone
        new HighlightZone('isolation_zone', OverlayType.CIRCLE, { center: 'red_cm_l', radius: 4.5 }, 0.55, 0.75, '#FFCC00', 0.22),

        // 5. Turnover Area
        new HighlightZone('turnover_area', OverlayType.CIRCLE, { center: { x: -12, z: -8 }, radius: 3.5 }, 0.75, 1.0, '#39FF14', 0.25),

        // Decision primitives & semantic analytics triggers
        new PressTriggered(0.55),
        new TrapActivated(0.60),
        new PossessionWon(0.75),

        // Custom Analytics Triggers to satisfy tracking requirement
        new AnalyticsTrigger('trap_prepared', 0.20),
        new AnalyticsTrigger('forced_pass', 0.42),
        new AnalyticsTrigger('receiver_isolated', 0.60),
        new AnalyticsTrigger('possession_won', 0.75),
        new AnalyticsTrigger('lesson_completed', 0.95)
      ],

      phases: [
        { index: 1, start: 0.0, end: 0.20, name: 'Neutral Build-Up', description: 'Red building from the back with safe passing options, spacing is normal, and no trap is active.' },
        { index: 2, start: 0.20, end: 0.40, name: 'Trap Preparation', description: 'Blue team shifts shape collectively. Backpass and wide lanes are closed, funneling play inside.' },
        { index: 3, start: 0.40, end: 0.55, name: 'False Availability', description: 'One central passing lane remains intentionally open. The opponent believes this option is safe.' },
        { index: 4, start: 0.55, end: 0.75, name: 'Trap Activation', description: 'As the pass is played, the press is triggered. Multiple defenders converge to isolate the receiver.' },
        { index: 5, start: 0.75, end: 0.90, name: 'Ball Recovery', description: 'Blue wins possession. The pressing trap succeeds in forcing a turnover in a high-value zone.' },
        { index: 6, start: 0.90, end: 1.0, name: 'Summary', description: 'Lesson complete. Freeze frame showing original trap design, forced decisions, and recovery.' }
      ],

      annotations: [
        { start: 0.0, end: 0.20, text: 'Neutral Build-Up: Red GK has the ball. Red plays in a wide shape, circulates possession, and spacing is normal.' },
        { start: 0.20, end: 0.40, text: 'Trap Preparation: Blue shifts shape. Striker cf covers backpass lanes, and winger rw closes down the wide fullback option.' },
        { start: 0.40, end: 0.55, text: 'False Availability: We invite this pass. The central midfielder appears free and unmarked, tempting a forward pass.' },
        { start: 0.55, end: 0.75, text: 'Trap Activation: The trap is sprung! As the receiver controls the ball, pressure arrives from multiple directions.' },
        { start: 0.75, end: 0.90, text: 'Possession Recovered: Blue wins the ball in midfield and immediately passes to the winger to launch a counter-attack.' },
        { start: 0.90, end: 1.0, text: 'Summary: Coordinated pressing trap. Defending team forces a turnover by controlling choices rather than chasing the ball.' }
      ],

      cameraPresets: [
        { start: 0.0, end: 0.20, preset: 'overview' },
        { start: 0.20, end: 0.55, preset: 'press_trigger' },
        { start: 0.55, end: 0.90, preset: 'turnover' },
        { start: 0.90, end: 1.0, preset: 'summary' }
      ]
    });
  }
}
