import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  OverlayType 
} from '../tacticalEngine/types';

export class DefensiveBlockModule implements TacticalModule {
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
  private hasFiredShifted: boolean = false;
  private hasFiredDenied: boolean = false;
  private hasFiredForcedWide: boolean = false;
  private hasFiredNeutralized: boolean = false;
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
      this.triggerAnalytics('animation_completed', { concept_id: 'defensive_block' });
      this.resetTrackingFlags();
    });

    this.unsubscribeState = this.engine.getTimeline().subscribe('stateChange', (isPlaying: boolean) => {
      if (isPlaying && !this.isInitialStartFired) {
        this.triggerAnalytics('block_established', { concept_id: 'defensive_block' });
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
    this.hasFiredShifted = false;
    this.hasFiredDenied = false;
    this.hasFiredForcedWide = false;
    this.hasFiredNeutralized = false;
    this.lastPreset = '';
  }

  public getMetadata() {
    return {
      id: 'defensive_block',
      name: 'Defensive Block',
      description: 'A structured, compact defensive shape designed to deny space in central zones, steering attackers into less dangerous wide areas.',
      duration: this.durationSeconds,
      related_concepts: ['compactness', 'low_block', 'high_press', 'pressing_trap', 'transition_defending']
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
        name: 'Initial Shape',
        description: 'Blue defensive block in a structured 4-4-2. High horizontal and vertical compactness.'
      };
    } else if (t < 0.30) {
      return {
        index: 2,
        name: 'Attacker Circulation',
        description: 'Red circulates the ball. Blue block shifts together as a collective, disciplined unit.'
      };
    } else if (t < 0.45) {
      return {
        index: 3,
        name: 'Central Space Protection',
        description: 'Blue protects the danger zone and half spaces, completely closing paths into the central corridor.'
      };
    } else if (t < 0.60) {
      return {
        index: 4,
        name: 'Forcing Wide Play',
        description: 'Central progression is denied. Attacking play is steered towards the touchline.'
      };
    } else if (t < 0.75) {
      return {
        index: 5,
        name: 'Compactness Analysis',
        description: 'Freeze-frame analysis of distance between players and defensive lines, denying space.'
      };
    } else if (t < 0.90) {
      return {
        index: 6,
        name: 'Low-Quality Attack',
        description: 'Choked near the corner, the attacker is forced into a rushed cross with low probability of success.'
      };
    } else {
      return {
        index: 7,
        name: 'Summary State',
        description: 'Threat successfully neutralized by controlling space. Defending is about structure, not chasing.'
      };
    }
  }

  /**
   * Calculates debug telemetry dynamically for HUD display
   */
  public getDebugMetrics(fraction: number) {
    let width = '30.0m';
    let depth = '14.5m';
    let lineDist = '8.0m';
    let compactnessScore = 95;

    // Simulate metric shifts as shape shifting occurs
    if (fraction < 0.15) {
      width = '30.0m';
      depth = '14.5m';
      lineDist = '8.0m';
      compactnessScore = 96;
    } else if (fraction < 0.30) {
      width = '28.5m'; // Compresses as it shifts left
      depth = '14.0m';
      lineDist = '7.8m';
      compactnessScore = 98;
    } else if (fraction < 0.45) {
      width = '29.0m';
      depth = '14.2m';
      lineDist = '8.1m';
      compactnessScore = 97;
    } else if (fraction < 0.75) {
      width = '26.0m'; // Heavily shifts and compresses near touchline
      depth = '13.8m';
      lineDist = '7.5m';
      compactnessScore = 99; // Perfect compactness
    } else {
      width = '32.0m'; // Expands slightly as ball is cleared
      depth = '15.5m';
      lineDist = '8.8m';
      compactnessScore = 90;
    }

    const activeOverlays = this.getActiveOverlaysCount(fraction);

    return {
      teamWidth: width,
      teamDepth: depth,
      lineDistances: lineDist,
      compactnessScore: `${compactnessScore}/100`,
      currentPhase: this.getPhaseInfo(fraction).name,
      timelinePosition: `${(fraction * 100).toFixed(1)}%`,
      activeOverlays: `${activeOverlays} active`
    };
  }

  private getActiveOverlaysCount(fraction: number): number {
    const startFrames = [0.0, 0.0, 0.0, 0.25, 0.25, 0.28, 0.28, 0.45, 0.45, 0.60, 0.60, 0.80, 0.90, 0.90, 0.92];
    const endFrames = [0.20, 0.18, 0.18, 0.50, 0.55, 0.55, 0.55, 0.65, 0.65, 0.75, 0.75, 0.95, 1.0, 1.0, 1.0];
    let count = 0;
    for (let i = 0; i < startFrames.length; i++) {
      if (fraction >= startFrames[i] && fraction <= endFrames[i]) count++;
    }
    return count;
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
      if (this.onCameraPresetChange) {
        this.onCameraPresetChange(cameraPreset);
      }
    }

    // 4. Analytics Events Emission
    this.evaluateAnalyticsTriggers(fraction);
  }

  private getTeachingAnnotation(t: number): string {
    if (t < 0.15) {
      return 'Initial Shape: Blue defensive block is established in a 4-4-2 structure. Horizontal and vertical lines are highly compact.';
    } else if (t < 0.30) {
      return 'Attacker Circulation: Red passes the ball across midfield. The entire Blue block shifts collectively as one unit to cover space.';
    } else if (t < 0.45) {
      return 'Central Space Protection: Midfield and defensive lines squeeze, shutting down the central corridor and denying central progression.';
    } else if (t < 0.60) {
      return 'Forcing Wide Play: Lacking central options, Red is forced to pass wide. Blue shifts further to choke touchline paths.';
    } else if (t < 0.75) {
      return 'Compactness Analysis: Freeze-frame demonstrates tight line gaps (<10m) and narrow player spacing, preventing pass interception.';
    } else if (t < 0.90) {
      return 'Low-Quality Attack: Pressed in the corner with no forward angles, Red winger is forced to attempt a low-value cross.';
    } else {
      return 'Summary: Coordinated space control forced a low-probability action. The central corridors remained protected, reducing threat.';
    }
  }

  private getCameraPresetForFraction(t: number): string {
    if (t < 0.15) return 'overview';
    if (t < 0.45) return 'central_space';
    if (t < 0.75) return 'compactness';
    return 'summary';
  }



  private evaluateAnalyticsTriggers(fraction: number): void {
    if (fraction >= 0.15 && !this.hasFiredShifted) {
      this.triggerAnalytics('shape_shifted', { speed: 'controlled_slide', time_fraction: fraction });
      this.hasFiredShifted = true;
    }
    if (fraction >= 0.30 && !this.hasFiredDenied) {
      this.triggerAnalytics('central_access_denied', { corridors: ['central_corridor', 'left_halfspace'], time_fraction: fraction });
      this.hasFiredDenied = true;
    }
    if (fraction >= 0.45 && !this.hasFiredForcedWide) {
      this.triggerAnalytics('forced_wide', { receiver_role: 'Left Back', time_fraction: fraction });
      this.hasFiredForcedWide = true;
    }
    if (fraction >= 0.88 && !this.hasFiredNeutralized) {
      this.triggerAnalytics('attack_neutralized', { play_result: 'clearance', time_fraction: fraction });
      this.hasFiredNeutralized = true;
    }
  }

  private loadAnimationData(): void {
    if (!this.engine) return;

    // --- Red Team (Attacking Team, team: 'defend' -> Renders Red) ---
    const redPlayers: PlayerState[] = [
      {
        id: 'red_gk',
        team: 'defend',
        role: 'Goalkeeper',
        number: 1,
        startPos: { x: -40, z: 0 },
        currentPos: { x: -40, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -40, z: 0 },
          { time: 1.0, x: -40, z: 0 }
        ]
      },
      {
        id: 'red_rcb',
        team: 'defend',
        role: 'Right Center Back',
        number: 5,
        startPos: { x: -12, z: 12 },
        currentPos: { x: -12, z: 12 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -12, z: 12 },
          { time: 0.15, x: -12, z: 12 },
          { time: 0.30, x: -10, z: 8 },
          { time: 1.0, x: -5, z: 4 }
        ]
      },
      {
        id: 'red_lcb',
        team: 'defend',
        role: 'Left Center Back',
        number: 4,
        startPos: { x: -12, z: -12 },
        currentPos: { x: -12, z: -12 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -12, z: -12 },
          { time: 0.22, x: -12, z: -12 },
          { time: 0.35, x: -8, z: -10 },
          { time: 1.0, x: -3, z: -6 }
        ]
      },
      {
        id: 'red_rb',
        team: 'defend',
        role: 'Right Back',
        number: 2,
        startPos: { x: -2, z: 28 },
        currentPos: { x: -2, z: 28 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -2, z: 28 },
          { time: 0.50, x: 2, z: 26 },
          { time: 1.0, x: 8, z: 22 }
        ]
      },
      {
        id: 'red_lb',
        team: 'defend',
        role: 'Left Back',
        number: 3,
        startPos: { x: -2, z: -28 },
        currentPos: { x: -2, z: -28 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -2, z: -28 },
          { time: 0.55, x: -2, z: -28 },
          { time: 0.75, x: 0, z: -28 },
          { time: 0.85, x: 5, z: -26 },
          { time: 1.0, x: 10, z: -24 }
        ]
      },
      {
        id: 'red_dm',
        team: 'defend',
        role: 'Defensive Midfielder',
        number: 6,
        startPos: { x: -4, z: 0 },
        currentPos: { x: -4, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: -4, z: 0 },
          { time: 0.30, x: -2, z: 2 },
          { time: 0.60, x: 4, z: 0 },
          { time: 1.0, x: 12, z: 0 }
        ]
      },
      {
        id: 'red_lcm',
        team: 'defend',
        role: 'Left Midfielder',
        number: 8,
        startPos: { x: 5, z: -10 },
        currentPos: { x: 5, z: -10 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 5, z: -10 },
          { time: 0.30, x: 5, z: -10 },
          { time: 0.45, x: 5, z: -10 },
          { time: 0.60, x: 8, z: -12 },
          { time: 1.0, x: 14, z: -10 }
        ]
      },
      {
        id: 'red_rcm',
        team: 'defend',
        role: 'Right Midfielder',
        number: 10,
        startPos: { x: 5, z: 10 },
        currentPos: { x: 5, z: 10 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 5, z: 10 },
          { time: 0.30, x: 8, z: 12 },
          { time: 1.0, x: 15, z: 8 }
        ]
      },
      {
        id: 'red_lw',
        team: 'defend',
        role: 'Left Winger',
        number: 11,
        startPos: { x: 25, z: -28 },
        currentPos: { x: 25, z: -28 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 25, z: -28 },
          { time: 0.85, x: 25, z: -28 },
          { time: 0.90, x: 26, z: -27 },
          { time: 1.0, x: 28, z: -25 }
        ]
      },
      {
        id: 'red_rw',
        team: 'defend',
        role: 'Right Winger',
        number: 7,
        startPos: { x: 25, z: 28 },
        currentPos: { x: 25, z: 28 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 25, z: 28 },
          { time: 1.0, x: 28, z: 25 }
        ]
      },
      {
        id: 'red_cf',
        team: 'defend',
        role: 'Center Forward',
        number: 9,
        startPos: { x: 23, z: 0 },
        currentPos: { x: 23, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 23, z: 0 },
          { time: 0.40, x: 24, z: -2 },
          { time: 0.60, x: 24, z: -5 },
          { time: 0.90, x: 28, z: -4 },
          { time: 1.0, x: 30, z: -2 }
        ]
      }
    ];

    // --- Blue Team (Defending Team, team: 'attack' -> Renders Blue) ---
    const bluePlayers: PlayerState[] = [
      {
        id: 'blue_gk',
        team: 'attack',
        role: 'Goalkeeper',
        number: 1,
        startPos: { x: 45, z: 0 },
        currentPos: { x: 45, z: 0 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 45, z: 0 },
          { time: 1.0, x: 45, z: 0 }
        ]
      },
      {
        id: 'blue_rb',
        team: 'attack',
        role: 'Right Back',
        number: 2,
        startPos: { x: 26, z: 15 },
        currentPos: { x: 26, z: 15 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 26, z: 15 },
          { time: 0.30, x: 26, z: 10, easing: 'quadInOut' },
          { time: 0.45, x: 26, z: 10 },
          { time: 0.60, x: 26, z: 4, easing: 'quadInOut' },
          { time: 1.0, x: 26, z: 2 }
        ]
      },
      {
        id: 'blue_rcb',
        team: 'attack',
        role: 'Right Center Back',
        number: 6,
        startPos: { x: 26, z: 5 },
        currentPos: { x: 26, z: 5 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 26, z: 5 },
          { time: 0.30, x: 26, z: 1, easing: 'quadInOut' },
          { time: 0.45, x: 26, z: 1 },
          { time: 0.60, x: 26, z: -3, easing: 'quadInOut' },
          { time: 0.95, x: 26, z: 5, easing: 'quadInOut' }, // Steps to clear cross
          { time: 1.0, x: 25, z: 6 }
        ]
      },
      {
        id: 'blue_lcb',
        team: 'attack',
        role: 'Left Center Back',
        number: 5,
        startPos: { x: 26, z: -5 },
        currentPos: { x: 26, z: -5 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 26, z: -5 },
          { time: 0.30, x: 26, z: -9, easing: 'quadInOut' },
          { time: 0.45, x: 26, z: -9 },
          { time: 0.60, x: 26, z: -11, easing: 'quadInOut' },
          { time: 1.0, x: 26, z: -8 }
        ]
      },
      {
        id: 'blue_lb',
        team: 'attack',
        role: 'Left Back',
        number: 3,
        startPos: { x: 26, z: -15 },
        currentPos: { x: 26, z: -15 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 26, z: -15 },
          { time: 0.30, x: 26, z: -18, easing: 'quadInOut' },
          { time: 0.45, x: 26, z: -18 },
          { time: 0.60, x: 24, z: -22, easing: 'cubicInOut' },
          { time: 0.88, x: 25, z: -26, easing: 'quadInOut' }, // Closes winger
          { time: 1.0, x: 25, z: -20 }
        ]
      },
      {
        id: 'blue_rm',
        team: 'attack',
        role: 'Right Midfielder',
        number: 7,
        startPos: { x: 18, z: 14 },
        currentPos: { x: 18, z: 14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 18, z: 14 },
          { time: 0.30, x: 18, z: 9, easing: 'quadInOut' },
          { time: 0.45, x: 18, z: 9 },
          { time: 0.60, x: 18, z: 3, easing: 'quadInOut' },
          { time: 1.0, x: 18, z: 1 }
        ]
      },
      {
        id: 'blue_rcm',
        team: 'attack',
        role: 'Right Central Midfielder',
        number: 8,
        startPos: { x: 18, z: 4.5 },
        currentPos: { x: 18, z: 4.5 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 18, z: 4.5 },
          { time: 0.30, x: 18, z: 0.5, easing: 'quadInOut' },
          { time: 0.45, x: 18, z: 0.5 },
          { time: 0.60, x: 18, z: -3, easing: 'quadInOut' },
          { time: 1.0, x: 18, z: -1 }
        ]
      },
      {
        id: 'blue_lcm',
        team: 'attack',
        role: 'Left Central Midfielder',
        number: 10,
        startPos: { x: 18, z: -4.5 },
        currentPos: { x: 18, z: -4.5 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 18, z: -4.5 },
          { time: 0.30, x: 18, z: -8.5, easing: 'quadInOut' },
          { time: 0.45, x: 18, z: -8.5 },
          { time: 0.60, x: 18, z: -12, easing: 'quadInOut' },
          { time: 0.88, x: 22, z: -20, easing: 'quadInOut' }, // Helps double team
          { time: 1.0, x: 20, z: -14 }
        ]
      },
      {
        id: 'blue_lm',
        team: 'attack',
        role: 'Left Midfielder',
        number: 11,
        startPos: { x: 18, z: -14 },
        currentPos: { x: 18, z: -14 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 18, z: -14 },
          { time: 0.30, x: 18, z: -17, easing: 'quadInOut' },
          { time: 0.45, x: 18, z: -17 },
          { time: 0.60, x: 16, z: -22, easing: 'cubicInOut' },
          { time: 1.0, x: 17, z: -18 }
        ]
      },
      {
        id: 'blue_r_st',
        team: 'attack',
        role: 'Right Striker',
        number: 9,
        startPos: { x: 10, z: 3 },
        currentPos: { x: 10, z: 3 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 10, z: 3 },
          { time: 0.30, x: 10, z: -1, easing: 'quadInOut' },
          { time: 0.45, x: 10, z: -1 },
          { time: 0.60, x: 12, z: -5, easing: 'quadInOut' },
          { time: 1.0, x: 14, z: -2 }
        ]
      },
      {
        id: 'blue_l_st',
        team: 'attack',
        role: 'Left Striker',
        number: 20,
        startPos: { x: 10, z: -3 },
        currentPos: { x: 10, z: -3 },
        visible: true,
        keyFrames: [
          { time: 0.0, x: 10, z: -3 },
          { time: 0.30, x: 10, z: -7, easing: 'quadInOut' },
          { time: 0.45, x: 12, z: -8, easing: 'quadInOut' }, // Drops to help
          { time: 0.60, x: 13, z: -11 },
          { time: 1.0, x: 15, z: -7 }
        ]
      }
    ];

    const players = [...redPlayers, ...bluePlayers];

    // --- Dynamic Arrow Definitions (22 Arrows) ---
    const arrows: ArrowState[] = [
      // Attacker circulation passes
      {
        id: 'arrow_rcb_to_lcb',
        fromPos: { x: -12, z: 12 },
        toPos: { x: -12, z: -12 },
        style: { color: '#00F3FF', width: 2.5, curved: false },
        startFrame: 0.15,
        endFrame: 0.22,
        currentProgress: 0.0
      },
      {
        id: 'arrow_lcb_to_lcm',
        fromPos: { x: -12, z: -12 },
        toPos: { x: 5, z: -10 },
        style: { color: '#00F3FF', width: 2.5, curved: false },
        startFrame: 0.22,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      // Defensive slide vectors
      {
        id: 'arrow_shift_defenders',
        fromPos: { x: 26, z: 5 },
        toPos: { x: 26, z: 0 },
        style: { color: '#39FF14', width: 2, curved: false, dashSize: 2.0 },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      {
        id: 'arrow_shift_midfielders',
        fromPos: { x: 18, z: 5 },
        toPos: { x: 18, z: 0 },
        style: { color: '#39FF14', width: 2, curved: false, dashSize: 2.0 },
        startFrame: 0.15,
        endFrame: 0.30,
        currentProgress: 0.0
      },
      // Space denied lanes (red dashed lanes)
      {
        id: 'arrow_central_denial_cf',
        fromPos: { x: 5, z: -10 },
        toPos: { x: 23, z: 0 },
        style: { color: '#EF4444', width: 2.5, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      {
        id: 'arrow_central_denial_rcm',
        fromPos: { x: 5, z: -10 },
        toPos: { x: 5, z: 10 },
        style: { color: '#EF4444', width: 2, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      },
      // Force wide circulation pass
      {
        id: 'arrow_lcm_to_lb',
        fromPos: { x: 5, z: -10 },
        toPos: { x: -2, z: -28 },
        style: { color: '#00F3FF', width: 2, curved: false },
        startFrame: 0.45,
        endFrame: 0.55,
        currentProgress: 0.0
      },
      {
        id: 'arrow_lb_steer_wide',
        fromPos: { x: -2, z: -28 },
        toPos: { x: 25, z: -28 },
        style: { color: '#F97316', width: 3, curved: true },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      // Movement of defenders wide to cover LB reception
      {
        id: 'arrow_lm_press',
        fromPos: { x: 18, z: -14 },
        toPos: { x: 16, z: -22 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      {
        id: 'arrow_lb_press',
        fromPos: { x: 26, z: -15 },
        toPos: { x: 24, z: -22 },
        style: { color: '#39FF14', width: 2.5, curved: false },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      {
        id: 'arrow_lcb_cover',
        fromPos: { x: 26, z: -5 },
        toPos: { x: 26, z: -11 },
        style: { color: '#39FF14', width: 2, curved: true },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      // Compactness metrics arrows
      {
        id: 'arrow_compact_v_dist',
        fromPos: { x: 26, z: 0 },
        toPos: { x: 18, z: 0 },
        style: { color: '#00F3FF', width: 2, curved: false, dashSize: 1.5, gapSize: 1.0 },
        startFrame: 0.60,
        endFrame: 0.75,
        currentProgress: 0.0
      },
      {
        id: 'arrow_compact_h_dist1',
        fromPos: { x: 18, z: -4.5 },
        toPos: { x: 18, z: 4.5 },
        style: { color: '#EAB308', width: 2, curved: false },
        startFrame: 0.60,
        endFrame: 0.75,
        currentProgress: 0.0
      },
      {
        id: 'arrow_compact_h_dist2',
        fromPos: { x: 26, z: -5 },
        toPos: { x: 26, z: 5 },
        style: { color: '#EAB308', width: 2, curved: false },
        startFrame: 0.60,
        endFrame: 0.75,
        currentProgress: 0.0
      },
      // Wing progression under pressure
      {
        id: 'arrow_lb_pass_to_lw',
        fromPos: { x: -2, z: -28 },
        toPos: { x: 25, z: -28 },
        style: { color: '#EF4444', width: 2.2, curved: false },
        startFrame: 0.75,
        endFrame: 0.80,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_lb_engage',
        fromPos: { x: 24, z: -22 },
        toPos: { x: 25, z: -26 },
        style: { color: '#39FF14', width: 2.5, curved: false, dashSpeed: 1.2 },
        startFrame: 0.80,
        endFrame: 0.88,
        currentProgress: 0.0
      },
      {
        id: 'arrow_blue_lm_double',
        fromPos: { x: 16, z: -22 },
        toPos: { x: 22, z: -26 },
        style: { color: '#39FF14', width: 2.5, curved: true },
        startFrame: 0.80,
        endFrame: 0.88,
        currentProgress: 0.0
      },
      // Low probability cross
      {
        id: 'arrow_forced_wide_cross',
        fromPos: { x: 26, z: -27 },
        toPos: { x: 26, z: 5 },
        style: { color: '#EF4444', width: 3, curved: true },
        startFrame: 0.88,
        endFrame: 0.95,
        currentProgress: 0.0
      },
      // Headed clearance
      {
        id: 'arrow_blue_rcb_clearance',
        fromPos: { x: 26, z: 5 },
        toPos: { x: 12, z: 12 },
        style: { color: '#39FF14', width: 3, curved: false },
        startFrame: 0.95,
        endFrame: 1.0,
        currentProgress: 0.0
      },
      {
        id: 'arrow_threat_reduced_flow',
        fromPos: { x: 26, z: 5 },
        toPos: { x: 8, z: 15 },
        style: { color: '#10B981', width: 2, curved: true, dashSize: 2.0 },
        startFrame: 0.95,
        endFrame: 1.0,
        currentProgress: 0.0
      },
      {
        id: 'arrow_midfield_shift_left',
        fromPos: { x: 18, z: 0.5 },
        toPos: { x: 18, z: -3 },
        style: { color: '#39FF14', width: 2, curved: false },
        startFrame: 0.45,
        endFrame: 0.60,
        currentProgress: 0.0
      },
      {
        id: 'arrow_striker_drop_cover',
        fromPos: { x: 10, z: -7 },
        toPos: { x: 12, z: -8 },
        style: { color: '#39FF14', width: 2, curved: false },
        startFrame: 0.30,
        endFrame: 0.45,
        currentProgress: 0.0
      }
    ];

    // --- Spatial Overlay Definitions (15 Overlays) ---
    const overlays: OverlayState[] = [
      // 1. Initial 4-4-2 compact structure
      {
        id: 'overlay_defensive_structure',
        type: OverlayType.RECTANGLE,
        bounds: { width: 14, length: 34, rotation: 0 },
        center: { x: 22, z: 0 },
        startFrame: 0.0,
        endFrame: 0.20,
        color: '#1D4ED8',
        opacity: 0.12
      },
      // 2. Midfield Line link overlay
      {
        id: 'overlay_midfield_line',
        type: OverlayType.POLYGON,
        points: [
          { x: 18, z: -15 },
          { x: 18, z: 15 },
          { x: 17.5, z: 15 },
          { x: 17.5, z: -15 }
        ],
        startFrame: 0.0,
        endFrame: 0.18,
        color: '#00F3FF',
        opacity: 0.22
      },
      // 3. Defensive Line link overlay
      {
        id: 'overlay_defensive_line',
        type: OverlayType.POLYGON,
        points: [
          { x: 26, z: -16 },
          { x: 26, z: 16 },
          { x: 25.5, z: 16 },
          { x: 25.5, z: -16 }
        ],
        startFrame: 0.0,
        endFrame: 0.18,
        color: '#00F3FF',
        opacity: 0.22
      },
      // 4. Danger Zone (central area directly in front of the lines)
      {
        id: 'overlay_danger_zone',
        type: OverlayType.CIRCLE,
        center: { x: 22, z: 0 },
        radius: 8.5,
        startFrame: 0.25,
        endFrame: 0.50,
        color: '#EF4444',
        opacity: 0.16
      },
      // 5. Central Corridor highlighting
      {
        id: 'overlay_central_corridor',
        type: OverlayType.RECTANGLE,
        bounds: { width: 35, length: 15, rotation: 0 },
        center: { x: 20, z: 0 },
        startFrame: 0.25,
        endFrame: 0.55,
        color: '#EAB308',
        opacity: 0.08
      },
      // 6. Left Halfspace highlighting
      {
        id: 'overlay_half_space_left',
        type: OverlayType.RECTANGLE,
        bounds: { width: 35, length: 7, rotation: 0 },
        center: { x: 20, z: -11.5 },
        startFrame: 0.28,
        endFrame: 0.55,
        color: '#00F3FF',
        opacity: 0.08
      },
      // 7. Right Halfspace highlighting
      {
        id: 'overlay_half_space_right',
        type: OverlayType.RECTANGLE,
        bounds: { width: 35, length: 7, rotation: 0 },
        center: { x: 20, z: 11.5 },
        startFrame: 0.28,
        endFrame: 0.55,
        color: '#00F3FF',
        opacity: 0.08
      },
      // 8. Open space on the flank (Green indicator)
      {
        id: 'overlay_wide_space_available',
        type: OverlayType.POLYGON,
        points: [
          { x: 0, z: -20 },
          { x: 0, z: -32 },
          { x: 30, z: -32 },
          { x: 30, z: -20 }
        ],
        startFrame: 0.45,
        endFrame: 0.65,
        color: '#10B981',
        opacity: 0.14
      },
      // 9. Central block space closed (Red crossing overlay)
      {
        id: 'overlay_central_space_denied',
        type: OverlayType.RECTANGLE,
        bounds: { width: 15, length: 22, rotation: 0 },
        center: { x: 15, z: 0 },
        startFrame: 0.45,
        endFrame: 0.65,
        color: '#EF4444',
        opacity: 0.12
      },
      // 10. Horizontal Compactness visual linker
      {
        id: 'overlay_horizontal_compactness',
        type: OverlayType.POLYGON,
        points: [
          { x: 26, z: 12 },
          { x: 26, z: -12 },
          { x: 27, z: -12 },
          { x: 27, z: 12 }
        ],
        startFrame: 0.60,
        endFrame: 0.75,
        color: '#EAB308',
        opacity: 0.22
      },
      // 11. Vertical Compactness box representation
      {
        id: 'overlay_vertical_compactness',
        type: OverlayType.RECTANGLE,
        bounds: { width: 8, length: 30, rotation: 0 },
        center: { x: 22, z: 0 },
        startFrame: 0.60,
        endFrame: 0.75,
        color: '#10B981',
        opacity: 0.15
      },
      // 12. Pressure trap wide near corner flag
      {
        id: 'overlay_pressure_trap_wide',
        type: OverlayType.CIRCLE,
        center: { x: 26, z: -25 },
        radius: 7.0,
        startFrame: 0.80,
        endFrame: 0.95,
        color: '#EF4444',
        opacity: 0.24
      },
      // 13. Protected space summary
      {
        id: 'overlay_protected_space_summary',
        type: OverlayType.POLYGON,
        points: [
          { x: 22, z: -16 },
          { x: 22, z: 16 },
          { x: 40, z: 20 },
          { x: 40, z: -20 }
        ],
        startFrame: 0.90,
        endFrame: 1.0,
        color: '#10B981',
        opacity: 0.12
      },
      // 14. Compact shape summary block
      {
        id: 'overlay_compact_shape_summary',
        type: OverlayType.RECTANGLE,
        bounds: { width: 14, length: 32, rotation: 0 },
        center: { x: 22, z: -5 },
        startFrame: 0.90,
        endFrame: 1.0,
        color: '#06B6D4',
        opacity: 0.12
      },
      // 15. Threat reduction clearance area
      {
        id: 'overlay_threat_reduction',
        type: OverlayType.CIRCLE,
        center: { x: 26, z: 5 },
        radius: 8.0,
        startFrame: 0.92,
        endFrame: 1.0,
        color: '#EAB308',
        opacity: 0.15
      }
    ];

    // --- Ball keyframes for circulation, forced wide, cross, and clearance ---
    const ball = {
      startPos: { x: -12, z: 12 }, // Starts with RCB
      keyFrames: [
        { time: 0.0, x: -12, z: 12 },
        { time: 0.15, x: -12, z: 12 },
        { time: 0.22, x: -12, z: -12 }, // Pass to LCB
        { time: 0.30, x: 5, z: -10 },   // Pass to LCM
        { time: 0.45, x: 5, z: -10 },
        { time: 0.55, x: -2, z: -28 },  // Pass wide to LB
        { time: 0.60, x: -2, z: -28 },
        { time: 0.75, x: -2, z: -28 },
        { time: 0.80, x: 25, z: -28 },  // Rushed pass to LW
        { time: 0.85, x: 25, z: -28 },
        { time: 0.88, x: 26, z: -27 },  // Rushed cross start
        { time: 0.95, x: 26, z: 5 },    // Received by Blue RCB
        { time: 1.0, x: 12, z: 12 }     // Cleared away
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
