import { ComposedTacticalModule } from '../tacticalPrimitives/composedModule';
import {
  FormationState,
  MovePlayer,
  SupportRun,
  TriggerRun,
  Overlap,
  PassingArrow,
  MovementArrow,
  RotationArrow,
  SupportArrow,
  HighlightZone,
  HighlightHalfSpace,
  HighlightChannel,
  HighlightPassingLane,
  HighlightNumericalAdvantage,
  PassBall,
  DribbleBall,
  SetBallPosition,
  DefenderFollows,
  TacticalPrimitive,
  PrimitiveCompileContext,
} from '../tacticalPrimitives';
import { OverlayType } from '../tacticalEngine/types';

// ─────────────────────────────────────────────────────────────────
// LOCAL ANALYTICS TRIGGER PRIMITIVE
// Identical pattern to every other module — no bespoke logic.
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
      data: { concept_id: 'inverted_winger', ...this.data },
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// LOCAL TRIANGLE OVERLAY PRIMITIVE (same pattern as MidfieldOverload)
// Dynamically reads player positions at compile time.
// ─────────────────────────────────────────────────────────────────
class HighlightTriangle implements TacticalPrimitive {
  type = 'HighlightTriangle';
  constructor(
    public id: string,
    public playerIds: [string, string, string],
    public startTime: number,
    public endTime: number,
    public color: string = '#00F3FF',
    public opacity: number = 0.15
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const points = this.playerIds.map(id =>
      context.getPlayerPosition(id, this.startTime)
    );
    context.overlays.push({
      id: this.id,
      type: OverlayType.POLYGON,
      points,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity,
    });
  }
}

// ─────────────────────────────────────────────────────────────────
// INVERTED WINGER MODULE
//
// SCENARIO
//   Blue 4-3-3 attacking left→right (+X direction).
//   Right Winger (blue_rw) is LEFT-FOOTED → inverts centrally.
//   Red 4-4-2 defending from the right.
//
// TIMELINE  (16 seconds, 8 phases)
//   Phase 1  0.00–0.12  Traditional wide shape
//   Phase 2  0.12–0.28  Inversion begins — winger drifts to half-space
//   Phase 3  0.28–0.42  Half-space occupation + passing angles emerge
//   Phase 4  0.42–0.56  Defensive dilemma — defender must decide
//   Phase 5  0.56–0.68  Structural effects — midfield overload forms
//   Phase 6  0.68–0.80  Fullback overlaps to provide recovered width
//   Phase 7  0.80–0.92  Attacking advantage — shooting + passing angles
//   Phase 8  0.92–1.00  Summary freeze — all effects highlighted
// ─────────────────────────────────────────────────────────────────

export class InvertedWingerModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'inverted_winger',
      name: 'Inverted Winger',
      description:
        'A winger on the opposite flank to their dominant foot who cuts inside into the half-space, ' +
        'creating central overloads, opening wide channels for overlapping full-backs, ' +
        'and generating superior shooting angles on their stronger foot.',
      durationSeconds: 16.0,

      primitives: [
        // ─────────────────────────────────────────────────────────
        // INITIAL POSITIONS
        // Blue 4-3-3 attacking left (negative X half), facing right.
        // The pitch coordinate system: X -45→+45 (own goal → opp goal),
        // Z -34→+34 (left touchline → right touchline).
        // Blue RW (blue_rw) starts WIDE on the RIGHT touchline (+Z).
        // Red 4-4-2 sits in a mid-block from the right side.
        // ─────────────────────────────────────────────────────────
        new FormationState(
          'attack',
          '4-3-3',
          'left',
          {
            GK:  { x: -44, z:   0 },
            LCB: { x: -28, z:  -8 },
            RCB: { x: -28, z:   8 },
            LB:  { x: -20, z: -22 },
            RB:  { x: -20, z:  22 },   // Blue RB — will overlap later
            DM:  { x: -12, z:   0 },
            LCM: { x:  -5, z: -10 },
            RCM: { x:  -5, z:  10 },
            LW:  { x:  12, z: -22 },
            CF:  { x:  18, z:   0 },
            RW:  { x:  12, z:  26 },   // Wide right — left-footed inverted winger
          },
          {
            GK:  'blue_gk',
            LCB: 'blue_cb_l',
            RCB: 'blue_cb_r',
            LB:  'blue_lb',
            RB:  'blue_rb',
            DM:  'blue_dm',
            LCM: 'blue_cm_l',
            RCM: 'blue_cm_r',
            LW:  'blue_lw',
            CF:  'blue_cf',
            RW:  'blue_rw',
          }
        ),

        new FormationState(
          'defend',
          '4-4-2',
          'right',
          {
            GK:  { x:  44, z:   0 },
            LCB: { x:  28, z:  -6 },
            RCB: { x:  28, z:   6 },
            LB:  { x:  24, z: -22 },
            RB:  { x:  22, z:  22 },   // Red RB — marks blue_rw initially
            LM:  { x:  12, z: -20 },
            LCM: { x:  10, z:  -7 },
            RCM: { x:  10, z:   7 },
            RM:  { x:  12, z:  20 },   // Red RM — tracks the winger
            LST: { x:   0, z:  -8 },
            RST: { x:   0, z:   8 },
          },
          {
            GK:  'red_gk',
            LCB: 'red_cb_l',
            RCB: 'red_cb_r',
            LB:  'red_lb',
            RB:  'red_rb',
            LM:  'red_lm',
            LCM: 'red_cm_l',
            RCM: 'red_cm_r',
            RM:  'red_rm',
            LST: 'red_st_l',
            RST: 'red_st_r',
          }
        ),

        // ─────────────────────────────────────────────────────────
        // PHASE 1 — TRADITIONAL WIDE SHAPE  (0.00 → 0.12)
        // All players hold starting positions. Wide channel highlighted.
        // Ball sits with the RCB — standard buildup trigger.
        // ─────────────────────────────────────────────────────────

        // Anchor all Blue players in Phase 1 shape
        new MovePlayer('blue_gk',   { x: -44, z:   0 }, 0.0, 0.12),
        new MovePlayer('blue_cb_l', { x: -28, z:  -8 }, 0.0, 0.12),
        new MovePlayer('blue_cb_r', { x: -28, z:   8 }, 0.0, 0.12),
        new MovePlayer('blue_lb',   { x: -20, z: -22 }, 0.0, 0.12),
        new MovePlayer('blue_rb',   { x: -20, z:  22 }, 0.0, 0.12),
        new MovePlayer('blue_dm',   { x: -12, z:   0 }, 0.0, 0.12),
        new MovePlayer('blue_cm_l', { x:  -5, z: -10 }, 0.0, 0.12),
        new MovePlayer('blue_cm_r', { x:  -5, z:  10 }, 0.0, 0.12),
        new MovePlayer('blue_lw',   { x:  12, z: -22 }, 0.0, 0.12),
        new MovePlayer('blue_cf',   { x:  18, z:   0 }, 0.0, 0.12),
        new MovePlayer('blue_rw',   { x:  12, z:  26 }, 0.0, 0.12), // Wide touchline

        // Anchor all Red players in Phase 1 shape (they mostly hold for phases 1–3)
        new MovePlayer('red_gk',    { x:  44, z:   0 }, 0.0, 1.0),
        new MovePlayer('red_cb_l',  { x:  28, z:  -6 }, 0.0, 1.0),
        new MovePlayer('red_cb_r',  { x:  28, z:   6 }, 0.0, 1.0),
        new MovePlayer('red_lb',    { x:  24, z: -22 }, 0.0, 1.0),
        new MovePlayer('red_rb',    { x:  22, z:  22 }, 0.0, 0.42), // Holds until dilemma
        new MovePlayer('red_lm',    { x:  12, z: -20 }, 0.0, 1.0),
        new MovePlayer('red_cm_l',  { x:  10, z:  -7 }, 0.0, 1.0),
        new MovePlayer('red_rm',    { x:  12, z:  20 }, 0.0, 0.42), // Tracks winger until dilemma
        new MovePlayer('red_st_l',  { x:   0, z:  -8 }, 0.0, 1.0),
        new MovePlayer('red_st_r',  { x:   0, z:   8 }, 0.0, 1.0),

        // Ball starts with Blue RCB
        new SetBallPosition('blue_cb_r', 0.0),
        new SetBallPosition('blue_cb_r', 0.12),

        // Wide channel annotation overlay
        new HighlightChannel('right_wing', 0.0, 0.12, '#FFCC00', 0.12),

        // Phase 1 analytics
        new AnalyticsTrigger('lesson_started', 0.02, { phase: 'traditional_wide' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 2 — INVERSION BEGINS  (0.12 → 0.28)
        // RW drifts from the wide touchline inward toward half-space.
        // RB starts pushing higher to begin overlap positioning.
        // Ball moves to RCM via DM as buildup progresses.
        // ─────────────────────────────────────────────────────────

        // RW cuts inside — diagonal move toward right half-space
        new SupportRun('blue_rw', { x: 18, z: 16 }, 0.12, 0.28, 'quadInOut'),

        // Red RM tracks the winger — follows the inversion
        new MovePlayer('red_rm', { x: 15, z: 16 }, 0.12, 0.28, 'sineInOut'),

        // Blue DM drops to receive from CB, then recycles forward
        new MovePlayer('blue_dm',   { x: -14, z:   2 }, 0.12, 0.28),

        // Midfielders hold — create passing triangle with DM
        new MovePlayer('blue_cm_l', { x:  -5, z: -10 }, 0.12, 0.28),
        new MovePlayer('blue_cm_r', { x:  -5, z:  10 }, 0.12, 0.28),

        // Static holders
        new MovePlayer('blue_gk',   { x: -44, z:   0 }, 0.12, 1.0),
        new MovePlayer('blue_cb_l', { x: -28, z:  -8 }, 0.12, 1.0),
        new MovePlayer('blue_cb_r', { x: -28, z:   8 }, 0.12, 1.0),
        new MovePlayer('blue_lb',   { x: -20, z: -22 }, 0.12, 1.0),
        new MovePlayer('blue_lw',   { x:  12, z: -22 }, 0.12, 1.0),

        // Ball: CB → DM → RCM
        new PassBall('blue_cb_r', 'blue_dm', 0.12, 0.20),
        new PassBall('blue_dm',   'blue_cm_r', 0.20, 0.28),

        // Arrows showing the inversion movement
        new MovementArrow(
          'rw_inversion_move',
          { x: 12, z: 26 }, { x: 18, z: 16 },
          0.12, 0.26,
          { color: '#FFCC00', width: 3, dashSpeed: 1.2 },
          true   // curved arrow — diagonal path
        ),
        new PassingArrow('pass_cb_dm',  'blue_cb_r', 'blue_dm',   0.12, 0.19, { color: '#00F3FF', width: 2 }),
        new PassingArrow('pass_dm_rcm', 'blue_dm',   'blue_cm_r', 0.20, 0.27, { color: '#00F3FF', width: 2 }),

        // Phase 2 analytics
        new AnalyticsTrigger('inversion_started', 0.15, { player: 'blue_rw', from: 'wide', to: 'half_space' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 3 — HALF-SPACE OCCUPATION  (0.28 → 0.42)
        // RW arrives in the right half-space between Red RB and RCB.
        // Half-space highlighted. Passing angles to CF and RCM shown.
        // ─────────────────────────────────────────────────────────

        // RW settles in half-space
        new MovePlayer('blue_rw', { x: 20, z: 14 }, 0.28, 0.42),

        // Red RM continues tracking — now squeezed between zones
        new MovePlayer('red_rm', { x: 20, z: 14 }, 0.28, 0.42, 'sineInOut'),
        new MovePlayer('red_rb', { x: 22, z: 22 }, 0.12, 0.42),

        // Midfielders hold receiving shape
        new MovePlayer('blue_cm_r', { x: -5, z: 10 }, 0.28, 0.42),
        new MovePlayer('blue_cf',   { x: 18, z:  0 }, 0.12, 0.42),
        new MovePlayer('blue_dm',   { x: -14, z: 2 }, 0.28, 0.42),

        // Ball held by RCM who looks to distribute
        new SetBallPosition('blue_cm_r', 0.28),
        new SetBallPosition('blue_cm_r', 0.42),

        // Half-space zone highlight (right half-space)
        new HighlightHalfSpace('right', 0.28, 0.56, '#FFCC00', 0.18),

        // Receiving space around winger
        new HighlightZone(
          'rw_receiving_space',
          OverlayType.CIRCLE,
          { center: { x: 20, z: 14 }, radius: 5.5 },
          0.28, 0.56,
          '#39FF14', 0.18
        ),

        // Passing angles from RCM to RW and CF
        new HighlightPassingLane('blue_cm_r', 'blue_rw', 0.28, 0.42),
        new HighlightPassingLane('blue_cm_r', 'blue_cf', 0.28, 0.42),

        // Phase 3 analytics
        new AnalyticsTrigger('half_space_occupied', 0.32, { zone: 'right_half_space' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 4 — DEFENSIVE DILEMMA  (0.42 → 0.56)
        // Red RB must choose: follow the inverted winger inside
        // (leaving the wide channel free for the overlapping RB)
        // OR hold width (leaving the half-space free for the winger).
        //
        // Branch A: Red RB follows inside → wide channel opens
        // Branch B: Red RB holds wide → winger free in half-space
        // ─────────────────────────────────────────────────────────

        // RW holds half-space during the dilemma phase
        new MovePlayer('blue_rw', { x: 20, z: 14 }, 0.42, 0.56),
        new MovePlayer('blue_cf', { x: 20, z:  0 }, 0.42, 0.56, 'sineInOut'),

        // Ball passes to the winger in half-space
        new PassBall('blue_cm_r', 'blue_rw', 0.42, 0.50),
        new SetBallPosition('blue_rw', 0.50),
        new SetBallPosition('blue_rw', 0.56),

        new PassingArrow('pass_to_rw', 'blue_cm_r', 'blue_rw', 0.42, 0.49, { color: '#00F3FF', width: 2.5 }),

        // Dilemma decision event
        new AnalyticsTrigger('defensive_dilemma_created', 0.44, {
          defender: 'red_rb',
          choices: ['follow_inside', 'hold_wide']
        }),
        new DefenderFollows(0.44),   // Analytics event for decision tracking

        // ─────────────────────────────────────────────────────────
        // PHASE 5 — STRUCTURAL EFFECTS  (0.56 → 0.68)
        // Midfield overload: RW + RCM + CF form a central triangle.
        // RCM steps forward to support, DM shifts to cover vacated space.
        // ─────────────────────────────────────────────────────────

        // RW drives slightly deeper — linking play
        new MovePlayer('blue_rw',   { x: 22, z: 12 }, 0.56, 0.68),
        new MovePlayer('blue_cm_r', { x:  6, z: 10 }, 0.56, 0.68, 'quadInOut'),
        new MovePlayer('blue_cf',   { x: 24, z:  2 }, 0.56, 0.68, 'quadInOut'),
        new MovePlayer('blue_dm',   { x:  -8, z: 4 }, 0.56, 0.68, 'sineInOut'),

        new DribbleBall('blue_rw', 0.50, 0.68),

        // Central overload circle
        new HighlightNumericalAdvantage(
          { x: 20, z: 8 }, 10.0,
          0.56, 0.80,
          '#00F3FF', 0.18
        ),

        // Central combination triangle
        new HighlightTriangle(
          'central_triangle',
          ['blue_rw', 'blue_cm_r', 'blue_cf'],
          0.56, 0.80,
          '#39FF14', 0.14
        ),

        // Rotation arrow showing RCM stepping into advanced position
        new RotationArrow(
          'cm_step_forward',
          { x: -5, z: 10 }, { x: 6, z: 10 },
          0.42, 0.62,
          { color: '#FFCC00', width: 2.5 },
          true
        ),

        // Phase 5 analytics
        new AnalyticsTrigger('central_advantage_created', 0.58, {
          overload_zone: 'central_right',
          players: ['blue_rw', 'blue_cm_r', 'blue_cf']
        }),

        // ─────────────────────────────────────────────────────────
        // PHASE 6 — FULLBACK OVERLAP  (0.68 → 0.80)
        // Blue RB exploits the wide channel vacated by the inverted winger.
        // Uses the Overlap primitive — runs beyond the winger's position.
        // ─────────────────────────────────────────────────────────

        // Blue RB overlaps into wide right channel
        new Overlap('blue_rb', 'blue_rw', 0.56, 0.80, 8, 'quadInOut'),

        // Winger holds half-space while RB takes width
        new MovePlayer('blue_rw', { x: 22, z: 12 }, 0.68, 0.80),
        new MovePlayer('blue_cf', { x: 26, z:  0 }, 0.68, 0.80, 'sineInOut'),

        // Red RB (who chose to follow the winger) is now pulled away from wide channel
        new MovePlayer('red_rb', { x: 22, z: 14 }, 0.42, 0.80, 'sineInOut'), // follows winger inside

        // Wide overlap highlight
        new HighlightChannel('right_wing', 0.68, 0.92, '#39FF14', 0.14),

        // Overlap lane arrow
        new SupportArrow(
          'rb_overlap_lane',
          { x: -20, z: 22 }, { x: 26, z: 28 },
          0.56, 0.78,
          { color: '#39FF14', width: 3, dashSpeed: 1.0 },
          true
        ),

        // Ball passes to RB who has free run down the line
        new PassBall('blue_rw', 'blue_rb', 0.68, 0.76),
        new DribbleBall('blue_rb', 0.76, 0.80),

        new PassingArrow('pass_rw_to_rb', 'blue_rw', 'blue_rb', 0.68, 0.75, { color: '#00F3FF', width: 2.5 }),

        // Phase 6 analytics
        new AnalyticsTrigger('overlap_triggered', 0.70, { player: 'blue_rb', channel: 'right_wide' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 7 — ATTACKING ADVANTAGE  (0.80 → 0.92)
        // RB delivers a cross / cutback into the box.
        // Improved shooting angle for winger cutting toward the far post.
        // CF makes a near-post run, RCM supports late from outside box.
        // ─────────────────────────────────────────────────────────

        // RB carries to byline
        new MovePlayer('blue_rb',   { x: 32, z: 28 }, 0.80, 0.90, 'cubicInOut'),

        // RW curves toward far post — better shooting angle
        new TriggerRun('blue_rw',   { x: 30, z:  8 }, 0.80, 0.90, 'cubicInOut'),

        // CF near-post run
        new TriggerRun('blue_cf',   { x: 32, z:  0 }, 0.80, 0.90, 'cubicInOut'),

        // RCM arrives for cutback support at edge of box
        new MovePlayer('blue_cm_r', { x: 22, z: 10 }, 0.80, 0.90, 'quadInOut'),

        // Shooting angle highlight — RW cut toward far post
        new HighlightZone(
          'shooting_angle',
          OverlayType.POLYGON,
          {
            points: [
              { x: 30, z: 8 },
              { x: 38, z: 20 },   // goal right post
              { x: 38, z: 32 }    // byline reference
            ]
          },
          0.80, 0.92,
          '#FF0055', 0.15
        ),

        // Passing angles available from RB
        new HighlightPassingLane('blue_rb', 'blue_rw', 0.80, 0.92),
        new HighlightPassingLane('blue_rb', 'blue_cf', 0.80, 0.92),

        // Ball: RB → RW cut inside for shot
        new DribbleBall('blue_rb', 0.80, 0.88),
        new PassBall('blue_rb', 'blue_rw', 0.88, 0.91),

        new MovementArrow(
          'rb_byline_run',
          { x: 26, z: 28 }, { x: 32, z: 28 },
          0.80, 0.89,
          { color: '#39FF14', width: 2.5, dashSpeed: 1.0 }
        ),
        new MovementArrow(
          'rw_far_post_run',
          { x: 22, z: 12 }, { x: 30, z:  8 },
          0.80, 0.89,
          { color: '#FFCC00', width: 3, dashSpeed: 1.2 },
          true
        ),
        new PassingArrow(
          'cross_to_rw',
          'blue_rb', 'blue_rw',
          0.88, 0.90,
          { color: '#00F3FF', width: 2.5 }
        ),

        // Phase 7 analytics
        new AnalyticsTrigger('shooting_advantage_created', 0.82, { angle: 'far_post_diagonal' }),

        // ─────────────────────────────────────────────────────────
        // PHASE 8 — SUMMARY FREEZE  (0.92 → 1.00)
        // Freeze final state. Highlight all key zones together:
        //  • Half-space occupation (right)
        //  • Central overload triangle
        //  • Overlapping RB position
        //  • Improved shooting angle
        // ─────────────────────────────────────────────────────────

        // Hold final positions
        new MovePlayer('blue_rb',   { x: 32, z: 28 }, 0.90, 1.0),
        new MovePlayer('blue_rw',   { x: 30, z:  8 }, 0.91, 1.0),
        new MovePlayer('blue_cf',   { x: 32, z:  0 }, 0.90, 1.0),
        new MovePlayer('blue_cm_r', { x: 22, z: 10 }, 0.90, 1.0),

        new DribbleBall('blue_rw', 0.91, 1.0),

        // Summary overlays — all effects simultaneously
        new HighlightHalfSpace('right', 0.92, 1.0, '#FFCC00', 0.15),
        new HighlightChannel('right_wing', 0.92, 1.0, '#39FF14', 0.13),
        new HighlightNumericalAdvantage(
          { x: 28, z: 6 }, 12.0,
          0.92, 1.0,
          '#00F3FF', 0.20
        ),
        new HighlightZone(
          'summary_polygon',
          OverlayType.POLYGON,
          {
            points: [
              { x: 18, z: 12 },  // half-space entry
              { x: 30, z:  8 },  // far-post arrival
              { x: 32, z:  0 },  // near-post CF
              { x: 22, z: 10 },  // RCM support
            ]
          },
          0.92, 1.0,
          '#39FF14', 0.16
        ),

        // Final analytics
        new AnalyticsTrigger('lesson_completed', 0.96, { phase: 'summary' }),
      ],

      // ───────────────────────────────────────────────────────────
      // PHASE DEFINITIONS
      // ───────────────────────────────────────────────────────────
      phases: [
        {
          index: 1,
          start: 0.00,
          end:   0.12,
          name:  'Traditional Winger',
          description:
            'Blue right winger occupies the wide touchline in a conventional attacking shape. ' +
            'The team is balanced but predictable — the wide position creates crossing angles ' +
            'only, limiting central combinations.',
        },
        {
          index: 2,
          start: 0.12,
          end:   0.28,
          name:  'Inversion Begins',
          description:
            'The right winger drifts inward from the touchline toward the right half-space. ' +
            'Being left-footed, this diagonal run opens their dominant foot for shooting and ' +
            'forward passing. The movement begins to stretch the defensive structure.',
        },
        {
          index: 3,
          start: 0.28,
          end:   0.42,
          name:  'Half-Space Occupation',
          description:
            'The winger arrives in the right half-space — the channel between the fullback ' +
            'and center-back. This zone is the most dangerous attacking area because defenders ' +
            'cannot adequately cover it without losing their positioning.',
        },
        {
          index: 4,
          start: 0.42,
          end:   0.56,
          name:  'Defensive Dilemma',
          description:
            'Red fullback faces an impossible choice: follow the winger inside and expose ' +
            'the wide channel, or hold width and leave the winger free in the half-space. ' +
            'Either decision gives Blue an advantage.',
        },
        {
          index: 5,
          start: 0.56,
          end:   0.68,
          name:  'Structural Effects',
          description:
            'One movement has restructured the entire attacking shape. The winger, center ' +
            'forward, and central midfielder now form a compact triangle in and around the box. ' +
            'Three attackers compete in the central channel with two defenders.',
        },
        {
          index: 6,
          start: 0.68,
          end:   0.80,
          name:  'Fullback Overlap',
          description:
            'With the winger occupying the half-space, the wide right channel is entirely ' +
            'free. Blue\'s right back advances into the vacated space, providing recovered ' +
            'width and a new delivery option from a high position.',
        },
        {
          index: 7,
          start: 0.80,
          end:   0.92,
          name:  'Attacking Advantage',
          description:
            'Blue now has superior angles on all fronts: the overlapping fullback on the byline, ' +
            'the winger arriving at the far post on their dominant foot, the center forward ' +
            'on the near post, and the midfielder supporting outside the box for a cutback.',
        },
        {
          index: 8,
          start: 0.92,
          end:   1.00,
          name:  'Summary',
          description:
            'Summary: One positional decision — the winger inverting from wide to half-space — ' +
            'created central overload, a free overlapping fullback, improved shooting angles, ' +
            'and a defensive dilemma. This is the foundational principle of the inverted winger role.',
        },
      ],

      // ───────────────────────────────────────────────────────────
      // TEACHING ANNOTATIONS
      // ───────────────────────────────────────────────────────────
      annotations: [
        {
          start: 0.00,
          end:   0.12,
          text:  'Traditional Shape: Winger hugs the touchline. Predictable width — no central threat.',
        },
        {
          start: 0.12,
          end:   0.28,
          text:  'Inversion Begins: The left-footed winger leaves the touchline and cuts inside diagonally.',
        },
        {
          start: 0.28,
          end:   0.42,
          text:  'Half-Space Occupied: The winger arrives between the fullback and center-back. Passing angles emerge.',
        },
        {
          start: 0.42,
          end:   0.56,
          text:  'Defensive Dilemma: The fullback cannot cover both the half-space and the wide channel simultaneously.',
        },
        {
          start: 0.56,
          end:   0.68,
          text:  'Central Superiority: Winger, CF, and CM form a triangle. Three vs two in the central zone.',
        },
        {
          start: 0.68,
          end:   0.80,
          text:  'Fullback Provides Width: The overlapping RB fills the wide channel vacated by the inverted winger.',
        },
        {
          start: 0.80,
          end:   0.92,
          text:  'Attacking Advantage: Better shooting angle, near-post run, and byline delivery all created at once.',
        },
        {
          start: 0.92,
          end:   1.00,
          text:  'Summary: One role change restructured the entire attack. This is the inverted winger.',
        },
      ],

      // ───────────────────────────────────────────────────────────
      // CAMERA PRESETS
      // ───────────────────────────────────────────────────────────
      cameraPresets: [
        { start: 0.00, end: 0.12, preset: 'overview' },          // Phase 1: full pitch view
        { start: 0.12, end: 0.28, preset: 'role_view' },         // Phase 2: winger perspective
        { start: 0.28, end: 0.56, preset: 'halfspace_view' },    // Phases 3–4: half-space close up
        { start: 0.56, end: 0.68, preset: 'combination_play' },  // Phase 5: central triangle
        { start: 0.68, end: 0.80, preset: 'overlap_view' },      // Phase 6: wide channel
        { start: 0.80, end: 0.92, preset: 'attacking_third' },   // Phase 7: final third
        { start: 0.92, end: 1.00, preset: 'summary' },           // Phase 8: summary overview
      ],
    });
  }
}
