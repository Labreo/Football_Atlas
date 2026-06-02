import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  OverlayType 
} from '../tacticalEngine/types';

export class HighPressModule implements TacticalModule {
  private engine: TacticalAnimationEngine | null = null;
  private durationSeconds: number = 14.0;

  // Callbacks for UI integration
  public onAnalyticsEvent: ((eventName: string, data: any) => void) | null = null;
  public onAnnotationChange: ((text: string) => void) | null = null;
  public onPhaseChange: ((phaseIndex: number, phaseName: string) => void) | null = null;
  public onCameraPresetChange: ((presetName: string) => void) | null = null;

  // Track state transitions to avoid double-firing events
  private currentPhaseIndex: number = -1;
  private currentAnnotationText: string = '';
  private isInitialStartFired: boolean = false;
  private hasFiredTrigger: boolean = false;
  private hasFiredTrap: boolean = false;
  private hasFiredTurnover: boolean = false;
  private lastPreset: string = '';

  private unsubscribeTick: (() => void) | null = null;
  private unsubscribeLoop: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;
    this.engine.getTimeline().setDuration(this.durationSeconds);
    
    this.subscribeToEngineEvents();
    this.loadAnimationData();
    this.reset();
  }

  private subscribeToEngineEvents(): void {
    if (!this.engine) return;

    this.unsubscribeTick = this.engine.getTimeline().subscribe('tick', (fraction: number) => {
      this.evaluateTimelineTicks(fraction);
    });

    this.unsubscribeLoop = this.engine.getTimeline().subscribe('loop', () => {
      this.triggerAnalytics('animation_completed', { concept_id: 'high_press' });
      this.resetTrackingFlags();
    });

    this.unsubscribeState = this.engine.getTimeline().subscribe('stateChange', (isPlaying: boolean) => {
      if (isPlaying && !this.isInitialStartFired) {
        this.triggerAnalytics('press_started', { concept_id: 'high_press' });
        this.isInitialStartFired = true;
      }
    });
  }

  private triggerAnalytics(eventName: string, data: any): void {
    if (this.onAnalyticsEvent) {
      this.onAnalyticsEvent(eventName, data);
    }
  }

  private resetTrackingFlags(): void {
    this.isInitialStartFired = false;
    this.hasFiredTrigger = false;
    this.hasFiredTrap = false;
    this.hasFiredTurnover = false;
    this.lastPreset = '';
  }

  public getMetadata() {
    return {
      id: 'high_press',
      name: 'High Press',
      description: 'A coordinated defensive strategy to win possession close to the opponent\'s goal by cutting passing options and trapping the ball carrier.',
      duration: this.durationSeconds,
      related_concepts: ['pressing_trap', 'compactness', 'counter_press', 'defensive_block']
    };
  }

  public getPhaseStarts(): number[] {
    return [0.0, 0.15, 0.30, 0.45, 0.60, 0.75, 0.90];
  }

  public play(): void {
    this.engine?.play();
  }

  public pause(): void {
    this.engine?.pause();
  }

  public reset(): void {
    this.engine?.reset();
    this.currentPhaseIndex = -1;
    this.currentAnnotationText = '';
    this.resetTrackingFlags();
    
    // Force redraw starting positions
    this.evaluateTimelineTicks(0.0);
  }

  public destroy(): void {
    if (this.unsubscribeTick) this.unsubscribeTick();
    if (this.unsubscribeLoop) this.unsubscribeLoop();
    if (this.unsubscribeState) this.unsubscribeState();
    this.engine = null;
  }

  /**
   * Returns current active step / phase based on time fraction
   */
  public getPhaseInfo(t: number): { index: number; name: string; description: string } {
    if (t < 0.15) {
      return {
        index: 1,
        name: 'Build-Up Setup',
        description: 'Red attempts to build from the back in a wide shape. Blue matches in a compact 4-3-3.'
      };
    } else if (t < 0.30) {
      return {
        index: 2,
        name: 'Press Activation',
        description: 'Red Goalkeeper passes to LCB. This trigger activates Blue\'s coordinated front three press.'
      };
    } else if (t < 0.45) {
      return {
        index: 3,
        name: 'Passing Lane Denial',
        description: 'Blue wingers and midfielders step up, utilizing cover shadows to block all immediate escape routes.'
      };
    } else if (t < 0.60) {
      return {
        index: 4,
        name: 'Pressing Trap',
        description: 'Play is steered wide to the Left Back. Blue springs the trap by surrounding the ball carrier.'
      };
    } else if (t < 0.75) {
      return {
        index: 5,
        name: 'Opponent Mistake',
        description: 'Suffocated near the touchline, the Left Back makes a hurried, forced pass back inside.'
      };
    } else if (t < 0.90) {
      return {
        index: 6,
        name: 'Turnover & Transition',
        description: 'Blue\'s midfielder intercepts the pass and instantly feeds the striker running into open space.'
      };
    } else {
      return {
        index: 7,
        name: 'Summary State',
        description: 'Possession won high up the pitch. Pressing is about controlling options and spaces, not chaotic running.'
      };
    }
  }

  /**
   * Timeline evaluation checking for phase transitions, annotation shifts, camera presets, and analytics triggers
   */
  private evaluateTimelineTicks(fraction: number): void {
    const phase = this.getPhaseInfo(fraction);

    // 1. Check for phase transitions
    if (phase.index !== this.currentPhaseIndex) {
      this.currentPhaseIndex = phase.index;
      if (this.onPhaseChange) {
        this.onPhaseChange(phase.index, phase.name);
      }
    }

    // 2. Check for annotation adjustments
    const annotation = this.getTeachingAnnotation(fraction);
    if (annotation !== this.currentAnnotationText) {
      this.currentAnnotationText = annotation;
      if (this.onAnnotationChange) {
        this.onAnnotationChange(annotation);
      }
    }

    // 3. Dynamic Camera Presets (Disabled to maintain solid top-down view)
    const cameraPreset = this.getCameraPresetForFraction(fraction);
    if (cameraPreset !== this.lastPreset) {
      this.lastPreset = cameraPreset;
      // this.applyCameraPreset(cameraPreset);
    }

    // 4. Analytics Events Emission
    this.evaluateAnalyticsTriggers(fraction);
  }

  private getTeachingAnnotation(t: number): string {
    if (t < 0.15) {
      return 'Build-Up Setup: Red GK starts with possession. Red defenders spread wide. Blue matches in a compact 4-3-3, preparing the press.';
    } else if (t < 0.30) {
      return 'Press Activation: Ball is passed to Red LCB. Blue RW initiates a curved run, while Blue CF and LW adjust positions to cover options.';
    } else if (t < 0.45) {
      return 'Passing Lane Denial: Passing options to Red DM, RCB, and central midfielders are completely blocked using cover shadows.';
    } else if (t < 0.60) {
      return 'Pressing Trap: Play is steered wide to the Left Back. Blue springs the trap, locking all touchline and backward escape routes.';
    } else if (t < 0.75) {
      return 'Opponent Mistake: Suffocated near the touchline, the Left Back makes a panicked, rushed decision and tries to force a pass inside.';
    } else if (t < 0.90) {
      return 'Turnover: Blue RCM intercepts the pass, launching an immediate transition. Striker CF makes a diagonal run into the open space.';
    } else {
      return 'Summary: Coordinated pressing won the ball high up the pitch. Pressing is about controlling options and spaces, not chaotic running.';
    }
  }

  private getCameraPresetForFraction(t: number): string {
    if (t < 0.15) return 'overview';
    if (t < 0.45) return 'press_trigger';
    if (t < 0.75) return 'turnover';
    return 'summary';
  }



  private evaluateAnalyticsTriggers(fraction: number): void {
    if (fraction >= 0.15 && !this.hasFiredTrigger) {
      this.triggerAnalytics('trigger_detected', { trigger_type: 'pass_to_cb', time_fraction: fraction });
      this.hasFiredTrigger = true;
    }
    if (fraction >= 0.45 && !this.hasFiredTrap) {
      this.triggerAnalytics('trap_activated', { trap_zone: 'left_sideline', time_fraction: fraction });
      this.hasFiredTrap = true;
    }
    if (fraction >= 0.75 && !this.hasFiredTurnover) {
      this.triggerAnalytics('turnover_created', { interceptor: 'blue_cm_r', time_fraction: fraction });
      this.hasFiredTurnover = true;
    }
  }

  private loadAnimationData(): void {
    if (!this.engine) return;

    // --- Red Team (Building from back, team: 'defend' -> Renders Red) ---
    const redPlayers: PlayerState[] = [
      {
        id: 'red_gk',
        team: 'defend',
        role: 'Goalkeeper',
        number: 1,
        startPos: { x: -46, z: 0 },
        currentPos: { x: -46, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -46, z: 0 },
          { time: 0.15, x: -46, z: 0 },
          { time: 0.30, x: -44, z: 0 },
          { time: 1.0, x: -44, z: 0 }
        ]
      },
      {
        id: 'red_cb_l',
        team: 'defend',
        role: 'Left Center Back',
        number: 4,
        startPos: { x: -36, z: -14 },
        currentPos: { x: -36, z: -14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -36, z: -14 },
          { time: 0.30, x: -36, z: -14 },
          { time: 0.45, x: -36, z: -14 },
          { time: 0.60, x: -33, z: -10, easing: 'quadInOut' },
          { time: 0.85, x: -30, z: -6 },
          { time: 1.0, x: -30, z: -6 }
        ]
      },
      {
        id: 'red_cb_r',
        team: 'defend',
        role: 'Right Center Back',
        number: 5,
        startPos: { x: -36, z: 14 },
        currentPos: { x: -36, z: 14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -36, z: 14 },
          { time: 0.45, x: -34, z: 12 },
          { time: 0.85, x: -30, z: 6 },
          { time: 1.0, x: -30, z: 6 }
        ]
      },
      {
        id: 'red_lb',
        team: 'defend',
        role: 'Left Back',
        number: 3,
        startPos: { x: -28, z: -26 },
        currentPos: { x: -28, z: -26 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -28, z: -26 },
          { time: 0.55, x: -28, z: -26 },
          { time: 0.60, x: -28, z: -26 },
          { time: 0.75, x: -25, z: -22, easing: 'quadInOut' },
          { time: 1.0, x: -20, z: -18 }
        ]
      },
      {
        id: 'red_rb',
        team: 'defend',
        role: 'Right Back',
        number: 2,
        startPos: { x: -28, z: 26 },
        currentPos: { x: -28, z: 26 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -28, z: 26 },
          { time: 0.50, x: -26, z: 24 },
          { time: 1.0, x: -24, z: 22 }
        ]
      },
      {
        id: 'red_dm',
        team: 'defend',
        role: 'Defensive Midfielder',
        number: 6,
        startPos: { x: -24, z: 0 },
        currentPos: { x: -24, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -24, z: 0 },
          { time: 0.30, x: -24, z: 0 },
          { time: 0.60, x: -22, z: -2 },
          { time: 1.0, x: -20, z: -2 }
        ]
      },
      {
        id: 'red_cm_l',
        team: 'defend',
        role: 'Left Midfielder',
        number: 8,
        startPos: { x: -16, z: -8 },
        currentPos: { x: -16, z: -8 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -16, z: -8 },
          { time: 0.30, x: -16, z: -8 },
          { time: 0.60, x: -15, z: -7 },
          { time: 1.0, x: -14, z: -6 }
        ]
      },
      {
        id: 'red_cm_r',
        team: 'defend',
        role: 'Right Midfielder',
        number: 10,
        startPos: { x: -16, z: 8 },
        currentPos: { x: -16, z: 8 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -16, z: 8 },
          { time: 1.0, x: -14, z: 6 }
        ]
      },
      {
        id: 'red_lw',
        team: 'defend',
        role: 'Left Winger',
        number: 11,
        startPos: { x: -2, z: -24 },
        currentPos: { x: -2, z: -24 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -2, z: -24 },
          { time: 1.0, x: -2, z: -24 }
        ]
      },
      {
        id: 'red_rw',
        team: 'defend',
        role: 'Right Winger',
        number: 7,
        startPos: { x: -2, z: 24 },
        currentPos: { x: -2, z: 24 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -2, z: 24 },
          { time: 1.0, x: -2, z: 24 }
        ]
      },
      {
        id: 'red_cf',
        team: 'defend',
        role: 'Striker',
        number: 9,
        startPos: { x: 5, z: 0 },
        currentPos: { x: 5, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 5, z: 0 },
          { time: 1.0, x: 2, z: 0 }
        ]
      }
    ];

    // --- Blue Team (Pressing team, team: 'attack' -> Renders Blue) ---
    const bluePlayers: PlayerState[] = [
      {
        id: 'blue_gk',
        team: 'attack',
        role: 'Goalkeeper',
        number: 1,
        startPos: { x: 42, z: 0 },
        currentPos: { x: 42, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 42, z: 0 },
          { time: 1.0, x: 38, z: 0 }
        ]
      },
      {
        id: 'blue_cb_l',
        team: 'attack',
        role: 'Left Center Back',
        number: 5,
        startPos: { x: 15, z: -6 },
        currentPos: { x: 15, z: -6 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 15, z: -6 },
          { time: 0.15, x: 15, z: -6 },
          { time: 0.30, x: 9, z: -7 },
          { time: 0.60, x: 3, z: -7, easing: 'quadInOut' },
          { time: 1.0, x: -2, z: -5 }
        ]
      },
      {
        id: 'blue_cb_r',
        team: 'attack',
        role: 'Right Center Back',
        number: 6,
        startPos: { x: 15, z: 6 },
        currentPos: { x: 15, z: 6 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 15, z: 6 },
          { time: 0.15, x: 15, z: 6 },
          { time: 0.30, x: 10, z: 5 },
          { time: 0.60, x: 5, z: 3, easing: 'quadInOut' },
          { time: 1.0, x: 0, z: 2 }
        ]
      },
      {
        id: 'blue_lb',
        team: 'attack',
        role: 'Left Back',
        number: 3,
        startPos: { x: 12, z: -22 },
        currentPos: { x: 12, z: -22 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 12, z: -22 },
          { time: 0.15, x: 12, z: -22 },
          { time: 0.30, x: 6, z: -23 },
          { time: 0.45, x: 1, z: -24 },
          { time: 0.60, x: -5, z: -25, easing: 'cubicInOut' },
          { time: 1.0, x: -10, z: -20 }
        ]
      },
      {
        id: 'blue_rb',
        team: 'attack',
        role: 'Right Back',
        number: 2,
        startPos: { x: 12, z: 22 },
        currentPos: { x: 12, z: 22 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 12, z: 22 },
          { time: 0.15, x: 12, z: 22 },
          { time: 0.30, x: 8, z: 20 },
          { time: 0.60, x: 4, z: 18 },
          { time: 1.0, x: 0, z: 12 }
        ]
      },
      {
        id: 'blue_dm',
        team: 'attack',
        role: 'Defensive Midfielder',
        number: 4,
        startPos: { x: 2, z: 0 },
        currentPos: { x: 2, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 2, z: 0 },
          { time: 0.15, x: 2, z: 0 },
          { time: 0.30, x: -2, z: -2 },
          { time: 0.60, x: -6, z: -10, easing: 'quadInOut' },
          { time: 1.0, x: -12, z: -6 }
        ]
      },
      {
        id: 'blue_cm_l',
        team: 'attack',
        role: 'Left Midfielder',
        number: 10,
        startPos: { x: -10, z: 8 },
        currentPos: { x: -10, z: 8 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -10, z: 8 },
          { time: 0.15, x: -10, z: 8 },
          { time: 0.30, x: -11, z: 3 },
          { time: 0.60, x: -14, z: 2 },
          { time: 1.0, x: -18, z: 4 }
        ]
      },
      {
        id: 'blue_cm_r',
        team: 'attack',
        role: 'Right Midfielder',
        number: 8,
        startPos: { x: -10, z: -8 },
        currentPos: { x: -10, z: -8 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -10, z: -8 },
          { time: 0.15, x: -10, z: -8 },
          { time: 0.30, x: -14, z: -9 },
          { time: 0.45, x: -13, z: -10 },
          { time: 0.60, x: -20, z: -20, easing: 'cubicInOut' },
          { time: 0.70, x: -22, z: -12 },
          { time: 0.75, x: -22, z: -12 },
          { time: 0.90, x: -18, z: -8 },
          { time: 1.0, x: -15, z: -5 }
        ]
      },
      {
        id: 'blue_cf',
        team: 'attack',
        role: 'Center Forward',
        number: 9,
        startPos: { x: -22, z: 0 },
        currentPos: { x: -22, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -22, z: 0 },
          { time: 0.15, x: -22, z: 0 },
          { time: 0.30, x: -23, z: -2, easing: 'quadInOut' },
          { time: 0.45, x: -23, z: -1 },
          { time: 0.60, x: -22, z: -3 },
          { time: 0.75, x: -23, z: -1 },
          { time: 0.85, x: -30, z: 2, easing: 'sineInOut' },
          { time: 0.90, x: -40, z: 0, easing: 'quadInOut' },
          { time: 1.0, x: -42, z: 0 }
        ]
      },
      {
        id: 'blue_lw',
        team: 'attack',
        role: 'Left Winger',
        number: 11,
        startPos: { x: -26, z: 14 },
        currentPos: { x: -26, z: 14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -26, z: 14 },
          { time: 0.15, x: -26, z: 14 },
          { time: 0.30, x: -30, z: 8, easing: 'quadInOut' },
          { time: 0.60, x: -28, z: 4 },
          { time: 1.0, x: -24, z: 0 }
        ]
      },
      {
        id: 'blue_rw',
        team: 'attack',
        role: 'Right Winger',
        number: 7,
        startPos: { x: -26, z: -14 },
        currentPos: { x: -26, z: -14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -26, z: -14 },
          { time: 0.15, x: -26, z: -14 },
          { time: 0.30, x: -30, z: -16, easing: 'cubicInOut' },
          { time: 0.45, x: -34, z: -17 },
          { time: 0.60, x: -29, z: -24, easing: 'quadInOut' },
          { time: 1.0, x: -20, z: -15 }
        ]
      }
    ];

    const players = [...redPlayers, ...bluePlayers];

    // --- Dynamic Arrow Definitions (22 Arrows) ---
    const arrows: ArrowState[] = [
      // GK build up options
      {
        id: 'arrow_gk_to_rcb_lane',
        fromPos: { x: -46, z: 0 },
        toPos: { x: -36, z: 14 },
        style: { color: '#00F3FF', width: 2, curved: false },
        startFrame: 0.0,
        endFrame: 0.15,
        currentProgress: 0.0
      },
      {
        id: 'arrow_gk_to_lcb_lane',
        fromPos: { x: -46, z: 0 },
        toPos: { x: -36, z: -14 },
        style: { color: '#00F3FF', width: 2, curved: false },
        startFrame: 0.0,
        endFrame: 0.15,
        currentProgress: 0.0
      },
      // GK pass to LCB
      {
        id: 'arrow_gk_to_lcb_pass',
        fromPos: { x: -46, z: 0 },
        toPos: { x: -36, z: -14 },
        style: { color: '#00F3FF', width: 2.5, curved: false },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      // Coordinated Press movements (Front 3 + Midfield)
      {
        id: 'arrow_blue_rw_press',
        fromPos: { x: -26, z: -14 },
        toPos: { x: -30, z: -16 },
        style: { color: '#39FF14', width: 3, curved: true, dashSpeed: 1.0 },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_cf_cover',
        fromPos: { x: -22, z: 0 },
        toPos: { x: -23, z: -2 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_lw_tuck',
        fromPos: { x: -26, z: 14 },
        toPos: { x: -30, z: 8 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_cm_r_step',
        fromPos: { x: -10, z: -8 },
        toPos: { x: -14, z: -9 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      {
        id: 'arrow_def_line_compress',
        fromPos: { x: 15, z: 0 },
        toPos: { x: 9, z: 0 },
        style: { color: '#39FF14', width: 2, curved: false, dashSize: 2.0 },
        startFrame: 0.15,
        endFrame: 0.35,
        currentProgress: 0.0
      },
      // Blocked passing lanes (visualized as red crossing lines)
      {
        id: 'arrow_blocked_lane_dm',
        fromPos: { x: -36, z: -14 },
        toPos: { x: -24, z: 0 },
        style: { color: '#EF4444', width: 2, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blocked_lane_rcb',
        fromPos: { x: -36, z: -14 },
        toPos: { x: -36, z: 14 },
        style: { color: '#EF4444', width: 2, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blocked_lane_cm_l',
        fromPos: { x: -36, z: -14 },
        toPos: { x: -16, z: -8 },
        style: { color: '#EF4444', width: 2, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      // Steered wide direction
      {
        id: 'arrow_funnel_steer',
        fromPos: { x: -36, z: -14 },
        toPos: { x: -28, z: -26 },
        style: { color: '#F97316', width: 3, curved: true },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      // Pass from LCB to LB under pressure
      {
        id: 'arrow_lcb_to_lb_pass',
        fromPos: { x: -36, z: -14 },
        toPos: { x: -28, z: -26 },
        style: { color: '#00F3FF', width: 2, curved: false },
        startFrame: 0.45,
        endFrame: 0.55,
        currentProgress: 0.0
      },
      // Trapping runs
      {
        id: 'arrow_blue_rw_trap',
        fromPos: { x: -30, z: -16 },
        toPos: { x: -29, z: -24 },
        style: { color: '#39FF14', width: 3, curved: false, dashSpeed: 1.2 },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_cm_r_trap',
        fromPos: { x: -14, z: -9 },
        toPos: { x: -20, z: -20 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_lb_trap',
        fromPos: { x: 6, z: -23 },
        toPos: { x: -5, z: -25 },
        style: { color: '#39FF14', width: 2.5, curved: true },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      // Panicked pass back inside
      {
        id: 'arrow_panicked_pass_in',
        fromPos: { x: -28, z: -26 },
        toPos: { x: -22, z: -12 },
        style: { color: '#EF4444', width: 2.5, curved: false },
        startFrame: 0.60,
        endFrame: 0.70,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_cm_r_intercept',
        fromPos: { x: -20, z: -20 },
        toPos: { x: -22, z: -12 },
        style: { color: '#39FF14', width: 3, curved: false },
        startFrame: 0.60,
        endFrame: 0.70,
        currentProgress: 0.0
      },
      // Transition and attacking run
      {
        id: 'arrow_turnover_pass',
        fromPos: { x: -22, z: -12 },
        toPos: { x: -30, z: 2 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.75,
        endFrame: 0.85,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_cf_run',
        fromPos: { x: -23, z: -1 },
        toPos: { x: -30, z: 2 },
        style: { color: '#39FF14', width: 3, curved: true, dashSpeed: 1.5 },
        startFrame: 0.75,
        endFrame: 0.85,
        currentProgress: 0.0
      },
      {
        id: 'arrow_shot_vector',
        fromPos: { x: -40, z: 0 },
        toPos: { x: -49, z: 0 },
        style: { color: '#EAB308', width: 3.5, curved: false },
        startFrame: 0.90,
        endFrame: 0.95,
        currentProgress: 0.0
      },
      {
        id: 'arrow_transition_space_indicator',
        fromPos: { x: -22, z: -12 },
        toPos: { x: -42, z: -5 },
        style: { color: '#10B981', width: 2, curved: true, dashSize: 2.0 },
        startFrame: 0.75,
        endFrame: 0.90,
        currentProgress: 0.0
      }
    ];

    // --- Spatial Overlay Definitions (15 Overlays) ---
    const overlays: OverlayState[] = [
      // 1. Initial Blue compact structure
      {
        id: 'overlay_pressing_structure',
        type: OverlayType.RECTANGLE,
        bounds: { width: 32, length: 55, rotation: 0 },
        center: { x: 0, z: 0 },
        startFrame: 0.0,
        endFrame: 0.20,
        color: '#1D4ED8',
        opacity: 0.12
      },
      // 2. Initial Red build-up shape
      {
        id: 'overlay_buildup_zone',
        type: OverlayType.RECTANGLE,
        bounds: { width: 28, length: 58, rotation: 0 },
        center: { x: -35, z: 0 },
        startFrame: 0.0,
        endFrame: 0.18,
        color: '#DC2626',
        opacity: 0.08
      },
      // 3. Press trigger area (Yellow circle)
      {
        id: 'overlay_trigger_area',
        type: OverlayType.CIRCLE,
        center: { x: -40, z: -10 },
        radius: 12.0,
        startFrame: 0.15,
        endFrame: 0.35,
        color: '#EAB308',
        opacity: 0.15
      },
      // 4. Pressure cooking zone around Red LCB
      {
        id: 'overlay_pressing_zone_lcb',
        type: OverlayType.CIRCLE,
        center: { x: -36, z: -14 },
        radius: 7.5,
        startFrame: 0.25,
        endFrame: 0.48,
        color: '#EF4444',
        opacity: 0.2
      },
      // 5. Cover shadow of Blue RW
      {
        id: 'overlay_cover_shadow_rw',
        type: OverlayType.POLYGON,
        points: [
          { x: -30, z: -16 },
          { x: -28, z: -26 },
          { x: -20, z: -24 },
          { x: -24, z: -16 }
        ],
        startFrame: 0.25,
        endFrame: 0.48,
        color: '#EF4444',
        opacity: 0.18
      },
      // 6. Midfield compactness area
      {
        id: 'overlay_midfield_compactness',
        type: OverlayType.RECTANGLE,
        bounds: { width: 15, length: 30, rotation: 0 },
        center: { x: -10, z: 0 },
        startFrame: 0.20,
        endFrame: 0.50,
        color: '#10B981',
        opacity: 0.12
      },
      // 7. Defensive line compression polygon
      {
        id: 'overlay_compact_defense',
        type: OverlayType.POLYGON,
        points: [
          { x: 8, z: -22 },
          { x: 8, z: 22 },
          { x: 16, z: 6 },
          { x: 16, z: -6 }
        ],
        startFrame: 0.20,
        endFrame: 0.55,
        color: '#10B981',
        opacity: 0.1
      },
      // 8. Funnel shape steering play wide
      {
        id: 'overlay_pressure_funnel',
        type: OverlayType.POLYGON,
        points: [
          { x: -24, z: 0 },
          { x: -32, z: 6 },
          { x: -38, z: -12 },
          { x: -28, z: -28 }
        ],
        startFrame: 0.30,
        endFrame: 0.50,
        color: '#F97316',
        opacity: 0.15
      },
      // 9. Pressing Trap Zone near left sideline
      {
        id: 'overlay_trap_zone',
        type: OverlayType.CIRCLE,
        center: { x: -28, z: -26 },
        radius: 8.5,
        startFrame: 0.45,
        endFrame: 0.68,
        color: '#EF4444',
        opacity: 0.26
      },
      // 10. Interception/turnover zone
      {
        id: 'overlay_turnover_zone',
        type: OverlayType.CIRCLE,
        center: { x: -22, z: -12 },
        radius: 6.5,
        startFrame: 0.65,
        endFrame: 0.80,
        color: '#10B981',
        opacity: 0.22
      },
      // 11. Transition space behind defense
      {
        id: 'overlay_transition_space',
        type: OverlayType.POLYGON,
        points: [
          { x: -28, z: -14 },
          { x: -28, z: 14 },
          { x: -46, z: 0 },
          { x: -38, z: -18 }
        ],
        startFrame: 0.75,
        endFrame: 0.95,
        color: '#10B981',
        opacity: 0.16
      },
      // 12. Shooting box space
      {
        id: 'overlay_shot_opportunity',
        type: OverlayType.CIRCLE,
        center: { x: -42, z: 0 },
        radius: 6.0,
        startFrame: 0.85,
        endFrame: 1.0,
        color: '#EAB308',
        opacity: 0.2
      },
      // 13. High press final defensive block
      {
        id: 'overlay_final_block',
        type: OverlayType.RECTANGLE,
        bounds: { width: 38, length: 48, rotation: 0 },
        center: { x: -25, z: -8 },
        startFrame: 0.90,
        endFrame: 1.0,
        color: '#10B981',
        opacity: 0.08
      },
      // 14. Compactness summary zone
      {
        id: 'overlay_compactness_summary',
        type: OverlayType.CIRCLE,
        center: { x: -18, z: -8 },
        radius: 16.0,
        startFrame: 0.90,
        endFrame: 1.0,
        color: '#06B6D4',
        opacity: 0.14
      },
      // 15. Opposition disorganization
      {
        id: 'overlay_opposition_disorganization',
        type: OverlayType.POLYGON,
        points: [
          { x: -30, z: -6 },
          { x: -30, z: 6 },
          { x: -20, z: -18 },
          { x: -24, z: 22 }
        ],
        startFrame: 0.80,
        endFrame: 0.98,
        color: '#EF4444',
        opacity: 0.12
      }
    ];

    // --- Ball keyframes with loft parabolic arc during passes ---
    const ball = {
      startPos: { x: -46, z: 0 },
      keyFrames: [
        { time: 0.0, x: -46, z: 0 },
        { time: 0.15, x: -46, z: 0 },
        { time: 0.30, x: -36, z: -14 },
        { time: 0.45, x: -36, z: -14 },
        { time: 0.55, x: -28, z: -26 },
        { time: 0.60, x: -28, z: -26 },
        { time: 0.70, x: -22, z: -12 },
        { time: 0.75, x: -22, z: -12 },
        { time: 0.85, x: -30, z: 2 },
        { time: 0.90, x: -40, z: 0 },
        { time: 0.95, x: -49, z: 0 },
        { time: 1.0, x: -49, z: 0 }
      ]
    };

    this.engine.loadConcept({
      players,
      arrows,
      overlays,
      ball,
      duration: this.durationSeconds
    });
  }
}
