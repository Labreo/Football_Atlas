import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  OverlayType, 
  TacticalPosition, 
  AnimationFrame 
} from '../tacticalEngine/types';

export class False9Module implements TacticalModule {
  private engine: TacticalAnimationEngine | null = null;
  private activeBranch: 'A' | 'B' = 'A';
  private durationSeconds: number = 12.0;

  // Callbacks for UI integration
  public onAnalyticsEvent: ((eventName: string, data: any) => void) | null = null;
  public onAnnotationChange: ((text: string) => void) | null = null;
  public onPhaseChange: ((phaseIndex: number, phaseName: string) => void) | null = null;

  // Track state transitions to avoid double-firing events
  private currentPhaseIndex: number = -1;
  private currentAnnotationText: string = '';
  private isInitialStartFired: boolean = false;
  private unsubscribeTick: (() => void) | null = null;
  private unsubscribeLoop: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;
    this.engine.getTimeline().setDuration(this.durationSeconds);
    
    this.subscribeToEngineEvents();
    this.loadActiveBranchData();
    this.reset();
  }

  private subscribeToEngineEvents(): void {
    if (!this.engine) return;

    // Subscriptions
    this.unsubscribeTick = this.engine.getTimeline().subscribe('tick', (fraction: number) => {
      this.evaluateTimelineTicks(fraction);
    });

    this.unsubscribeLoop = this.engine.getTimeline().subscribe('loop', () => {
      this.triggerAnalytics('animation_completed', { branch: this.activeBranch });
      this.isInitialStartFired = false; // Reset start trigger for next loop
    });

    this.unsubscribeState = this.engine.getTimeline().subscribe('stateChange', (isPlaying: boolean) => {
      if (isPlaying) {
        if (!this.isInitialStartFired) {
          this.triggerAnalytics('animation_started', { branch: this.activeBranch });
          this.isInitialStartFired = true;
        }
      }
    });
  }

  private triggerAnalytics(eventName: string, data: any): void {
    if (this.onAnalyticsEvent) {
      this.onAnalyticsEvent(eventName, data);
    }
  }

  /**
   * Switches defensive branch and updates engine parameters dynamically
   */
  public setBranch(branch: 'A' | 'B'): void {
    if (this.activeBranch === branch) return;
    this.activeBranch = branch;
    
    this.triggerAnalytics('replay_triggered', { reason: 'branch_switch', branch });
    this.loadActiveBranchData();
    this.reset();
  }

  public getBranch(): 'A' | 'B' {
    return this.activeBranch;
  }

  public getMetadata() {
    return {
      id: 'false_9',
      name: 'False 9',
      description: 'A tactical striker who drops deep into central midfield to draw center-backs out of position, creating space behind.',
      duration: this.durationSeconds
    };
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
    this.isInitialStartFired = false;
    
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
        description: 'Blue in a standard 4-3-3 attacking block. Red is defensive and compact.'
      };
    } else if (t < 0.40) {
      return {
        index: 2,
        name: 'False 9 Drops',
        description: 'The Center Forward drops deep into midfield, vacating the central attacking space.'
      };
    } else if (t < 0.60) {
      return {
        index: 3,
        name: 'Decision Point',
        description: 'The opposing Left Center Back must choose: follow the False 9 or hold the line.'
      };
    } else if (t < 0.75) {
      return {
        index: 4,
        name: this.activeBranch === 'A' ? 'Center Back Follows' : 'Center Back Holds',
        description: this.activeBranch === 'A' 
          ? 'LCB follows, opening a critical gap in the defensive line.' 
          : 'LCB stays in position, leaving the False 9 free to turn in space.'
      };
    } else if (t < 0.90) {
      return {
        index: 5,
        name: 'Attacking Exploitation',
        description: this.activeBranch === 'A'
          ? 'Left Winger makes a diagonal run into the gap to receive a through pass.'
          : 'False 9 turns and drives forward, opening diagonal passing lanes to wingers.'
      };
    } else {
      return {
        index: 6,
        name: 'Summary State',
        description: 'Defensive block disrupted. Attacking team achieves a numerical and positional advantage.'
      };
    }
  }

  /**
   * Evaluation loop checking for phase transitions and annotation shifts
   */
  private evaluateTimelineTicks(fraction: number): void {
    const phase = this.getPhaseInfo(fraction);

    // 1. Check for phase transitions
    if (phase.index !== this.currentPhaseIndex) {
      this.currentPhaseIndex = phase.index;
      if (this.onPhaseChange) {
        this.onPhaseChange(phase.index, phase.name);
      }
      this.triggerAnalytics('step_changed', { phaseIndex: phase.index, phaseName: phase.name });
    }

    // 2. Check for annotation adjustments
    const annotation = this.getTeachingAnnotation(fraction);
    if (annotation !== this.currentAnnotationText) {
      this.currentAnnotationText = annotation;
      if (this.onAnnotationChange) {
        this.onAnnotationChange(annotation);
      }
    }
  }

  private getTeachingAnnotation(t: number): string {
    if (t < 0.15) {
      return 'Initial Shape: Blue attacking in a 4-3-3 against a compact Red block.';
    } else if (t < 0.40) {
      return 'False 9 drops deep into midfield, drawing away from the defenders.';
    } else if (t < 0.60) {
      return this.activeBranch === 'A'
        ? 'Defensive Reaction A: Red Left Center Back follows the False 9 deep.'
        : 'Defensive Reaction B: Red Center Back holds the line, leaving the False 9 unmarked.';
    } else if (t < 0.75) {
      return this.activeBranch === 'A'
        ? 'LCB follows, exposing a dangerous gap in Red\'s defensive line.'
        : 'With the center back staying deep, the False 9 receives freely between the lines.';
    } else if (t < 0.90) {
      return this.activeBranch === 'A'
        ? 'Left Winger exploits the defensive gap, making a diagonal run behind.'
        : 'False 9 turns, drives forward, and opens passing lanes to both wingers.';
    } else {
      return this.activeBranch === 'A'
        ? 'Summary: Space successfully exploited. Blue winger receives a through ball behind.'
        : 'Summary: Midfield overload created. Blue False 9 easily penetrates the defensive block.';
    }
  }

  /**
   * Compiles player keyframes, arrows, and overlays for the selected branch
   */
  private loadActiveBranchData(): void {
    if (!this.engine) return;

    // Attacking Blue team start positions
    const pAttPasserStart = { x: -15, z: 5 };
    const pAttFalse9Start = { x: 20, z: 0 };
    const pAttWingerLStart = { x: 15, z: -22 };
    const pAttWingerRStart = { x: 15, z: 22 };
    const pAttMidRStart = { x: -5, z: 12 };

    // Defending Red team start positions
    const pDefCBLStart = { x: 22, z: -6 };
    const pDefCBRStart = { x: 22, z: 6 };
    const pDefLBStart = { x: 18, z: -18 };
    const pDefRBStart = { x: 18, z: 18 };
    const pDefDMStart = { x: 10, z: 0 };

    let players: PlayerState[] = [];
    let arrows: ArrowState[] = [];
    let overlays: OverlayState[] = [];
    let ball: { startPos: TacticalPosition; keyFrames: AnimationFrame[] };

    if (this.activeBranch === 'A') {
      // BRANCH A: Center back follows, creating a gap in behind. Winger exploits it.
      players = [
        {
          id: 'att_passer',
          team: 'attack',
          role: 'Central Midfielder',
          number: 8,
          startPos: pAttPasserStart,
          currentPos: { ...pAttPasserStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: -15, z: 5 },
            { time: 0.2, x: -15, z: 5 },
            { time: 0.5, x: -10, z: 3 },
            { time: 1.0, x: -8, z: 2 }
          ]
        },
        {
          id: 'att_false9',
          team: 'attack',
          role: 'False 9',
          number: 9,
          startPos: pAttFalse9Start,
          currentPos: { ...pAttFalse9Start },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 20, z: 0 },
            { time: 0.15, x: 20, z: 0 },
            { time: 0.45, x: 2, z: 0, easing: 'quadInOut' },
            { time: 0.65, x: 2, z: 0 },
            { time: 0.85, x: 3, z: 1 },
            { time: 1.0, x: 8, z: 3 }
          ]
        },
        {
          id: 'att_winger_left',
          team: 'attack',
          role: 'Left Winger',
          number: 11,
          startPos: pAttWingerLStart,
          currentPos: { ...pAttWingerLStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 15, z: -22 },
            { time: 0.45, x: 15, z: -22 },
            { time: 0.75, x: 26, z: -10, easing: 'cubicInOut' },
            { time: 1.0, x: 36, z: -5 }
          ]
        },
        {
          id: 'att_winger_right',
          team: 'attack',
          role: 'Right Winger',
          number: 7,
          startPos: pAttWingerRStart,
          currentPos: { ...pAttWingerRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 15, z: 22 },
            { time: 0.5, x: 15, z: 22 },
            { time: 1.0, x: 25, z: 20 }
          ]
        },
        {
          id: 'att_mid_right',
          team: 'attack',
          role: 'Right Midfielder',
          number: 10,
          startPos: pAttMidRStart,
          currentPos: { ...pAttMidRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: -5, z: 12 },
            { time: 0.3, x: -5, z: 12 },
            { time: 1.0, x: 10, z: 10 }
          ]
        },
        // Defending Red
        {
          id: 'def_cb_left',
          team: 'defend',
          role: 'Left Center Back',
          number: 4,
          startPos: pDefCBLStart,
          currentPos: { ...pDefCBLStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 22, z: -6 },
            { time: 0.25, x: 22, z: -6 },
            { time: 0.55, x: 8, z: -3, easing: 'quadInOut' },
            { time: 0.75, x: 8, z: -3 },
            { time: 1.0, x: 18, z: -6 }
          ]
        },
        {
          id: 'def_cb_right',
          team: 'defend',
          role: 'Right Center Back',
          number: 5,
          startPos: pDefCBRStart,
          currentPos: { ...pDefCBRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 22, z: 6 },
            { time: 0.3, x: 22, z: 6 },
            { time: 0.7, x: 21, z: 3 },
            { time: 1.0, x: 20, z: 1 }
          ]
        },
        {
          id: 'def_lb',
          team: 'defend',
          role: 'Left Back',
          number: 3,
          startPos: pDefLBStart,
          currentPos: { ...pDefLBStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 18, z: -18 },
            { time: 0.5, x: 18, z: -18 },
            { time: 1.0, x: 22, z: -14 }
          ]
        },
        {
          id: 'def_rb',
          team: 'defend',
          role: 'Right Back',
          number: 2,
          startPos: pDefRBStart,
          currentPos: { ...pDefRBStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 18, z: 18 },
            { time: 1.0, x: 18, z: 18 }
          ]
        },
        {
          id: 'def_dm',
          team: 'defend',
          role: 'Defensive Midfielder',
          number: 6,
          startPos: pDefDMStart,
          currentPos: { ...pDefDMStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 10, z: 0 },
            { time: 0.2, x: 10, z: 0 },
            { time: 0.5, x: 6, z: 2 },
            { time: 1.0, x: 8, z: 4 }
          ]
        }
      ];

      arrows = [
        {
          id: 'arrow_f9_drop',
          fromPos: pAttFalse9Start,
          toPos: { x: 2, z: 0 },
          style: { color: '#39FF14', width: 3, curved: false, dashSpeed: 1.0, dashSize: 1.5 },
          startFrame: 0.15,
          endFrame: 0.45,
          currentProgress: 0.0
        },
        {
          id: 'arrow_cb_follow',
          fromPos: pDefCBLStart,
          toPos: { x: 8, z: -3 },
          style: { color: '#DC2626', width: 2, curved: false },
          startFrame: 0.25,
          endFrame: 0.55,
          currentProgress: 0.0
        },
        {
          id: 'arrow_winger_run',
          fromPos: pAttWingerLStart,
          toPos: { x: 26, z: -10 },
          style: { color: '#39FF14', width: 3, curved: true, dashSpeed: 1.2 },
          startFrame: 0.45,
          endFrame: 0.75,
          currentProgress: 0.0
        },
        {
          id: 'pass_lane_1',
          fromPos: pAttPasserStart,
          toPos: { x: 2, z: 0 },
          style: { color: '#00F3FF', width: 2, curved: false },
          startFrame: 0.18,
          endFrame: 0.38,
          currentProgress: 0.0
        },
        {
          id: 'pass_lane_2',
          fromPos: { x: 3, z: 1 },
          toPos: { x: 28, z: -10 },
          style: { color: '#00F3FF', width: 2.5, curved: false },
          startFrame: 0.62,
          endFrame: 0.78,
          currentProgress: 0.0
        }
      ];

      overlays = [
        {
          id: 'overlay_vacated_space',
          type: OverlayType.CIRCLE,
          center: pAttFalse9Start,
          radius: 5.5,
          startFrame: 0.30,
          endFrame: 0.90,
          color: '#39FF14',
          opacity: 0.2
        },
        {
          id: 'overlay_defensive_gap',
          type: OverlayType.POLYGON,
          points: [
            { x: 22, z: -14 },
            { x: 22, z: -3 },
            { x: 16, z: -3 },
            { x: 16, z: -14 }
          ],
          startFrame: 0.50,
          endFrame: 0.95,
          color: '#FF0055',
          opacity: 0.22
        },
        {
          id: 'overlay_numerical_superiority',
          type: OverlayType.CIRCLE,
          center: { x: 2, z: 0 },
          radius: 7.0,
          startFrame: 0.45,
          endFrame: 0.85,
          color: '#00F3FF',
          opacity: 0.18
        }
      ];

      ball = {
        startPos: pAttPasserStart,
        keyFrames: [
          { time: 0.0, x: -15, z: 5 },
          { time: 0.2, x: -15, z: 5 },
          { time: 0.45, x: 2, z: 0 },
          { time: 0.65, x: 3, z: 1 },
          { time: 0.80, x: 28, z: -10 },
          { time: 0.90, x: 28, z: -10 },
          { time: 1.0, x: 36, z: -5 }
        ]
      };
    } else {
      // BRANCH B: Center back stays. False 9 receives unmarked between lines, turns and opens passing lanes.
      players = [
        {
          id: 'att_passer',
          team: 'attack',
          role: 'Central Midfielder',
          number: 8,
          startPos: pAttPasserStart,
          currentPos: { ...pAttPasserStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: -15, z: 5 },
            { time: 0.2, x: -15, z: 5 },
            { time: 0.5, x: -10, z: 3 },
            { time: 1.0, x: -8, z: 2 }
          ]
        },
        {
          id: 'att_false9',
          team: 'attack',
          role: 'False 9',
          number: 9,
          startPos: pAttFalse9Start,
          currentPos: { ...pAttFalse9Start },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 20, z: 0 },
            { time: 0.15, x: 20, z: 0 },
            { time: 0.45, x: 2, z: 0, easing: 'quadInOut' },
            { time: 0.70, x: 12, z: 0, easing: 'linear' },
            { time: 1.0, x: 12, z: 0 }
          ]
        },
        {
          id: 'att_winger_left',
          team: 'attack',
          role: 'Left Winger',
          number: 11,
          startPos: pAttWingerLStart,
          currentPos: { ...pAttWingerLStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 15, z: -22 },
            { time: 0.5, x: 15, z: -22 },
            { time: 1.0, x: 28, z: -20 }
          ]
        },
        {
          id: 'att_winger_right',
          team: 'attack',
          role: 'Right Winger',
          number: 7,
          startPos: pAttWingerRStart,
          currentPos: { ...pAttWingerRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 15, z: 22 },
            { time: 0.5, x: 15, z: 22 },
            { time: 0.85, x: 28, z: 14, easing: 'cubicInOut' },
            { time: 1.0, x: 32, z: 12 }
          ]
        },
        {
          id: 'att_mid_right',
          team: 'attack',
          role: 'Right Midfielder',
          number: 10,
          startPos: pAttMidRStart,
          currentPos: { ...pAttMidRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: -5, z: 12 },
            { time: 0.3, x: -5, z: 12 },
            { time: 1.0, x: 8, z: 10 }
          ]
        },
        // Defending Red (holds standard block shape)
        {
          id: 'def_cb_left',
          team: 'defend',
          role: 'Left Center Back',
          number: 4,
          startPos: pDefCBLStart,
          currentPos: { ...pDefCBLStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 22, z: -6 },
            { time: 1.0, x: 22, z: -6 }
          ]
        },
        {
          id: 'def_cb_right',
          team: 'defend',
          role: 'Right Center Back',
          number: 5,
          startPos: pDefCBRStart,
          currentPos: { ...pDefCBRStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 22, z: 6 },
            { time: 1.0, x: 22, z: 6 }
          ]
        },
        {
          id: 'def_lb',
          team: 'defend',
          role: 'Left Back',
          number: 3,
          startPos: pDefLBStart,
          currentPos: { ...pDefLBStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 18, z: -18 },
            { time: 1.0, x: 18, z: -18 }
          ]
        },
        {
          id: 'def_rb',
          team: 'defend',
          role: 'Right Back',
          number: 2,
          startPos: pDefRBStart,
          currentPos: { ...pDefRBStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 18, z: 18 },
            { time: 1.0, x: 18, z: 18 }
          ]
        },
        {
          id: 'def_dm',
          team: 'defend',
          role: 'Defensive Midfielder',
          number: 6,
          startPos: pDefDMStart,
          currentPos: { ...pDefDMStart },
          visible: true,
          keyFrames: [
            { time: 0.0, x: 10, z: 0 },
            { time: 0.4, x: 10, z: 0 },
            { time: 0.7, x: 15, z: 2 },
            { time: 1.0, x: 16, z: 3 }
          ]
        }
      ];

      arrows = [
        {
          id: 'arrow_f9_drop',
          fromPos: pAttFalse9Start,
          toPos: { x: 2, z: 0 },
          style: { color: '#39FF14', width: 3, curved: false, dashSpeed: 1.0, dashSize: 1.5 },
          startFrame: 0.15,
          endFrame: 0.45,
          currentProgress: 0.0
        },
        {
          id: 'arrow_f9_dribble',
          fromPos: { x: 2, z: 0 },
          toPos: { x: 12, z: 0 },
          style: { color: '#39FF14', width: 2, curved: true, dashSpeed: 0.8 },
          startFrame: 0.45,
          endFrame: 0.70,
          currentProgress: 0.0
        },
        {
          id: 'pass_lane_1',
          fromPos: pAttPasserStart,
          toPos: { x: 2, z: 0 },
          style: { color: '#00F3FF', width: 2, curved: false },
          startFrame: 0.18,
          endFrame: 0.38,
          currentProgress: 0.0
        },
        {
          id: 'pass_lane_2',
          fromPos: { x: 12, z: 0 },
          toPos: { x: 28, z: 14 },
          style: { color: '#00F3FF', width: 2.5, curved: false },
          startFrame: 0.68,
          endFrame: 0.85,
          currentProgress: 0.0
        }
      ];

      overlays = [
        {
          id: 'overlay_vacated_space',
          type: OverlayType.CIRCLE,
          center: pAttFalse9Start,
          radius: 5.5,
          startFrame: 0.30,
          endFrame: 0.65,
          color: '#39FF14',
          opacity: 0.2
        },
        {
          id: 'overlay_between_lines',
          type: OverlayType.RECTANGLE,
          bounds: { width: 12, length: 24, rotation: 0 },
          center: { x: 12, z: 0 },
          startFrame: 0.35,
          endFrame: 0.85,
          color: '#39FF14',
          opacity: 0.18
        },
        {
          id: 'overlay_numerical_superiority',
          type: OverlayType.CIRCLE,
          center: { x: 2, z: 0 },
          radius: 7.0,
          startFrame: 0.35,
          endFrame: 0.80,
          color: '#00F3FF',
          opacity: 0.18
        }
      ];

      ball = {
        startPos: pAttPasserStart,
        keyFrames: [
          { time: 0.0, x: -15, z: 5 },
          { time: 0.2, x: -15, z: 5 },
          { time: 0.45, x: 2, z: 0 },
          { time: 0.70, x: 12, z: 0 },
          { time: 0.85, x: 28, z: 14 },
          { time: 1.0, x: 32, z: 12 }
        ]
      };
    }

    this.engine.loadConcept({
      players,
      arrows,
      overlays,
      ball,
      duration: this.durationSeconds
    });
  }
}
