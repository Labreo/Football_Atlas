import * as THREE from 'three';
import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { PrimitiveCompiler, CompileResult } from './compiler';
import { TacticalPrimitive } from './types';
import { transitionManager } from '../tacticalOrchestrator/TransitionManager';
import { ComplexityLevel } from '@football-atlas/shared';
import { VisualMode, TacticalEventType } from '../visualLanguage/types';
import { VisualLanguageRegistry } from '../visualLanguage/VisualLanguageRegistry';



export interface ComposedModuleOptions {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  primitives: TacticalPrimitive[];
  // If the concept has branching decision paths, supply branch-specific primitives
  branchPrimitives?: {
    A: TacticalPrimitive[];
    B: TacticalPrimitive[];
  };
  // Fallbacks or custom overrides for phases and teaching annotations
  phases?: Array<{ index: number; start: number; end: number; name: string; description: string }>;
  annotations?: Array<{ start: number; end: number; text: string }>;
  cameraPresets?: Array<{ start: number; end: number; preset: string }>;
  // Dynamic debug telemetry custom metrics builder
  debugMetricsBuilder?: (fraction: number, activeBranch: 'A' | 'B') => Record<string, any>;
  visualMode?: VisualMode;
}

// ────────────────────────────────────────────────────────────────────────────
// Dynamic concept overrides for new concepts that reuse base animation modules
// Each entry maps a concept_id to custom display name, description, phases,
// and annotations that replace the base module defaults at init time.
// ────────────────────────────────────────────────────────────────────────────
const CONCEPT_OVERRIDES: Record<string, Partial<ComposedModuleOptions>> = {
  rest_defense: {
    id: 'rest_defense',
    name: 'Rest Defense',
    description: 'A structural screening formation maintained during attacking phases to prevent counter-attacks, with designated players positioned to intercept transition outlet passes.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Attacking Shape Setup', description: 'The team pushes forward in possession — rest defenders hold position behind the ball line.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Screening Formation', description: 'Two to three players form a compact screen between the ball and the opponent\'s counter-attacking outlets.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Transition Interception', description: 'When possession is lost, rest defenders immediately intercept the clearance and recycle possession.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'While teammates attack, designated rest defenders hold central positions behind the halfway line.' },
      { start: 0.25, end: 0.55, text: 'The compact 2-3 screening block covers the central corridor, blocking direct counter-attack routes to the goal.' },
      { start: 0.55, end: 0.80, text: 'A clearance is intercepted by the rest defense screen, turning a potential counter into a secondary attacking wave.' },
      { start: 0.80, end: 1.00, text: 'Effective rest defense ensures the team never gets caught on the break even during high-risk attacking phases.' }
    ]
  },
  positional_play: {
    id: 'positional_play',
    name: 'Positional Play',
    description: 'A possession-based system where players occupy specific grid zones to maintain triangular passing options and create numerical superiority through spatial discipline.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Grid Occupation', description: 'Players spread across vertical and horizontal grid zones, ensuring no two occupy the same channel.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Triangular Circulation', description: 'Short passes circulate through triangles, drawing the opponent\'s shape narrow to open half-spaces.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Line-Breaking Pass', description: 'A vertical pass penetrates the opponent\'s defensive line through the opened half-space channel.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Players position themselves in a grid formation — each player occupies a unique zone to maximize passing angles.' },
      { start: 0.25, end: 0.55, text: 'Rapid triangular passing pulls defenders toward the ball, opening up space in the opposite half-space.' },
      { start: 0.55, end: 0.80, text: 'A line-breaking vertical pass exploits the gap created by the opponent\'s lateral shift, penetrating between the lines.' },
      { start: 0.80, end: 1.00, text: 'Positional play creates structured superiority — the opponent must react to spacing rather than individual dribbles.' }
    ]
  },
  box_midfield: {
    id: 'box_midfield',
    name: 'Box Midfield',
    description: 'A 2-2 midfield shape (two deep, two advanced) that creates a diamond/box structure to dominate the central corridor and provide constant passing triangles.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Double Pivot Formation', description: 'Two deep midfielders form the base of the box alongside the center-backs during build-up.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Box Shape Activation', description: 'Two advanced midfielders push into half-space pockets, completing the rectangular box shape.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Central Dominance', description: 'The 4v3 central overload bypasses the opponent\'s midfield line, opening vertical passing corridors.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Two holding midfielders sit alongside center-backs to form a 4-man build-up base — the bottom of the box.' },
      { start: 0.25, end: 0.55, text: 'Two attacking midfielders occupy the half-space pockets, completing a 2-2 box that creates passing triangles in every direction.' },
      { start: 0.55, end: 0.80, text: 'The box shape creates a 4v3 numerical overload centrally, bypassing the opponent\'s midfield and opening vertical channels.' },
      { start: 0.80, end: 1.00, text: 'Box midfield structures guarantee at least two passing options for any central player at all times.' }
    ]
  },
  overlapping_runs: {
    id: 'overlapping_runs',
    name: 'Overlapping Runs',
    description: 'Fullbacks or center-backs making forward runs beyond the winger to create 2v1 situations on the flank and deliver crosses from advanced positions.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Winger Receives Wide', description: 'The winger receives the ball in a wide position, drawing the opposition fullback toward them.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Overlap Trigger', description: 'The fullback sprints past the winger on the outside, creating a 2v1 against the opposing defender.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Cross Delivery', description: 'The overlapping fullback receives the ball in an advanced position and delivers a cross into the box.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The winger holds the ball wide, engaging the opposing fullback and fixing them in position.' },
      { start: 0.25, end: 0.55, text: 'The fullback explodes past the winger on the outside — the opposing fullback must choose who to track, creating a 2v1.' },
      { start: 0.55, end: 0.80, text: 'The overlapping fullback receives in space behind the defense and delivers a cross from an advanced wide position.' },
      { start: 0.80, end: 1.00, text: 'Overlapping runs stretch the opponent\'s defensive line horizontally and create numerical advantages on the flank.' }
    ]
  },
  overloading_to_isolate: {
    id: 'overloading_to_isolate',
    name: 'Overloading to Isolate',
    description: 'Deliberately overloading one flank to draw defenders narrow, then quickly switching play to isolate a 1v1 attacker on the weak side.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Flank Overload', description: 'Multiple players shift to one side, drawing the opponent\'s defensive block toward the ball.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Switch of Play', description: 'A diagonal pass rapidly switches the ball to the underloaded far side of the pitch.' },
      { index: 3, start: 0.65, end: 1.00, name: '1v1 Isolation', description: 'The isolated attacker takes on the lone defender in space on the weak side.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Three to four players shift to the left flank, dragging the opponent\'s defensive shape narrow toward the ball.' },
      { start: 0.25, end: 0.55, text: 'A rapid diagonal switch bypasses the compressed midfield and finds the isolated attacker on the far side.' },
      { start: 0.55, end: 0.80, text: 'The attacker receives in a 1v1 situation with vast open space — the defense cannot recover in time.' },
      { start: 0.80, end: 1.00, text: 'Overloading to isolate manipulates the opponent\'s collective positioning to create individual attacking advantages.' }
    ]
  },
  half_space_exploitation: {
    id: 'half_space_exploitation',
    name: 'Half-Space Exploitation',
    description: 'Attacking through the channels between the center and the wings (half-spaces), which are difficult to defend because they fall between the responsibilities of fullbacks and center-backs.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Width Establishment', description: 'Wingers stretch wide to pin fullbacks, opening up the half-space channels between defense zones.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Half-Space Entry', description: 'A midfielder or inverted winger receives between the lines in the half-space pocket.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Penetrating Action', description: 'From the half-space, the player drives forward or plays a cutback behind the defensive line.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Wingers stretch to the touchline, pulling opposition fullbacks wide and opening half-space channels inside them.' },
      { start: 0.25, end: 0.55, text: 'A midfielder receives between the lines in the half-space — this zone is hard to defend because it falls between CB and FB responsibilities.' },
      { start: 0.55, end: 0.80, text: 'From the half-space, a diagonal cutback or through ball penetrates behind the defense at a dangerous angle.' },
      { start: 0.80, end: 1.00, text: 'Half-spaces are the most dangerous attacking channels because they offer passing, dribbling, and shooting angles simultaneously.' }
    ]
  },
  vertical_tiki_taka: {
    id: 'vertical_tiki_taka',
    name: 'Vertical Tiki-Taka',
    description: 'An evolution of traditional tiki-taka that prioritizes forward vertical passes over lateral circulation, using rapid one-touch combinations to break defensive lines.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Press Baiting', description: 'Short passes in the defensive third draw the opponent\'s press forward, opening space behind their midfield.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Vertical Penetration', description: 'A sharp vertical pass bypasses the opponent\'s midfield line, reaching an attacker between the lines.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Rapid Combination', description: 'One-touch combinations in the final third create a shooting opportunity before the defense can reorganize.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Short passes in the defensive third lure the opponent forward — this is deliberate press-baiting to create space behind them.' },
      { start: 0.25, end: 0.55, text: 'A sharp vertical through ball bypasses the midfield press entirely, finding a runner between the opponent\'s lines.' },
      { start: 0.55, end: 0.80, text: 'Rapid one-touch combinations in the final third exploit the disorganized defense before they can recover their shape.' },
      { start: 0.80, end: 1.00, text: 'Vertical tiki-taka combines possession security with direct attacking intent — slow to build, explosive to finish.' }
    ]
  },
  shadow_striker: {
    id: 'shadow_striker',
    name: 'Shadow Striker',
    description: 'A second striker who operates in the space behind the main forward, making late runs into the box from deep positions to arrive unmarked at the point of delivery.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Deep Starting Position', description: 'The shadow striker positions between midfield and attack, hidden from the opponent\'s center-backs.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Target Man Pin', description: 'The main striker pins the center-backs, creating a pocket of space for the shadow striker to exploit.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Late Arrival', description: 'The shadow striker makes a timed run into the box, arriving unmarked at the point of delivery.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The shadow striker sits between midfield and attack — too deep for center-backs to track, too high for midfielders to mark.' },
      { start: 0.25, end: 0.55, text: 'The target striker pins both center-backs, creating a pocket of space between the defensive and midfield lines.' },
      { start: 0.55, end: 0.80, text: 'The shadow striker times a late run into the box — arriving at speed into the vacated space to receive the delivery.' },
      { start: 0.80, end: 1.00, text: 'Shadow strikers exploit the gap between defensive responsibilities — too deep for CBs, too advanced for CMs.' }
    ]
  },
  pressing_triggers: {
    id: 'pressing_triggers',
    name: 'Pressing Triggers',
    description: 'Specific visual cues (backward passes, heavy touches, closed body shapes) that signal the team to initiate a coordinated high-intensity press.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Passive Monitoring', description: 'The pressing team monitors the opponent\'s build-up, waiting for a trigger moment to initiate the press.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Trigger Recognition', description: 'A pressing trigger is identified — a backward pass, heavy touch, or player receiving with back to goal.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Coordinated Press', description: 'The team presses collectively in response to the trigger, swarming the ball carrier and blocking outlets.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The pressing team holds a mid-block shape, watching for pressing trigger cues from the opponent\'s build-up play.' },
      { start: 0.25, end: 0.55, text: 'A trigger is spotted — the defender receives the ball facing their own goal. This cue activates the collective press.' },
      { start: 0.55, end: 0.80, text: 'Multiple players press simultaneously, cutting off passing lanes and forcing a turnover under pressure.' },
      { start: 0.80, end: 1.00, text: 'Pressing triggers transform reactive defending into proactive ball-winning by reading the opponent\'s body language.' }
    ]
  },
  midfield_rotation: {
    id: 'midfield_rotation',
    name: 'Midfield Rotation',
    description: 'Continuous positional swapping between midfielders to disrupt man-marking systems and create passing lanes through positional unpredictability.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Initial Midfield Shape', description: 'Three midfielders establish their base positions in a triangle formation.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Rotation Cycle', description: 'Midfielders swap positions — the deepest steps wide, the wide player pushes high, and the high player drops deep.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Marking Confusion', description: 'The rotation breaks the opponent\'s marking assignments, freeing a midfielder to receive in space.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'Three central midfielders set up in a standard triangle — this is the starting point before rotation begins.' },
      { start: 0.25, end: 0.55, text: 'The midfielders rotate positions continuously — the deep player goes wide, the wide player pushes forward, creating marking confusion.' },
      { start: 0.55, end: 0.80, text: 'The opponent\'s man-markers lose their assignments — one midfielder receives completely unmarked in a dangerous pocket.' },
      { start: 0.80, end: 1.00, text: 'Midfield rotation breaks rigid marking systems by making player positions unpredictable and constantly shifting.' }
    ]
  },
  sweeper_keeper: {
    id: 'sweeper_keeper',
    name: 'Sweeper Keeper',
    description: 'A goalkeeper who operates as an extra outfield player, coming far off their line to sweep long balls behind a high defensive line and participating in build-up play.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'High Line Setup', description: 'The defensive line pushes high — the keeper positions well outside the penalty area to cover the space behind.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Sweeping Action', description: 'A long ball is played over the high line — the keeper rushes out to clear or intercept before the attacker arrives.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Build-Up Involvement', description: 'The keeper receives back-passes and distributes accurately with their feet, acting as an extra outfield player.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The defense pushes up to the halfway line — the keeper positions at the edge of the penalty area to cover the exposed space behind.' },
      { start: 0.25, end: 0.55, text: 'A long ball is played behind the high line — the sweeper keeper rushes out to intercept, acting as the last line of defense outside the box.' },
      { start: 0.55, end: 0.80, text: 'The keeper collects a back-pass and plays a precise long-range pass to launch a counter-attack, bypassing the opponent\'s press.' },
      { start: 0.80, end: 1.00, text: 'The sweeper keeper enables a high defensive line by providing defensive coverage and distributing like an extra outfield player.' }
    ]
  },
  defensive_transitions: {
    id: 'defensive_transitions',
    name: 'Defensive Transitions',
    description: 'The team\'s immediate response upon losing possession — rapidly reorganizing from an attacking shape into a compact defensive block to prevent counter-attacks.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Ball Loss Moment', description: 'Possession is lost during an attacking phase — the team must react within seconds to prevent a counter-attack.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Delay & Recovery', description: 'The nearest player delays the ball carrier while teammates sprint back to reform the defensive shape.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Block Reformation', description: 'The compact defensive block is restored, with all players behind the ball in a narrow, organized shape.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The ball is lost in the attacking third — the team was in an advanced, spread-out shape and is now exposed.' },
      { start: 0.25, end: 0.55, text: 'The nearest midfielder commits a strategic foul or delays the ball carrier, buying time for the defense to recover.' },
      { start: 0.55, end: 0.80, text: 'Center-backs drop narrow and deep, reforming a compact 4-man block while midfielders sprint back to fill gaps.' },
      { start: 0.80, end: 1.00, text: 'Defensive transitions are about speed of thought — the faster the block reforms, the less dangerous the counter-attack becomes.' }
    ]
  },
  inverted_fullbacks: {
    id: 'inverted_fullbacks',
    name: 'Inverted Fullbacks',
    description: 'Fullbacks who move inside into central midfield during build-up rather than overlapping wide, creating an extra body in midfield and forming a 3-2 or 3-3 build-up structure.',
    phases: [
      { index: 1, start: 0.00, end: 0.30, name: 'Wide Starting Position', description: 'The fullback starts in a traditional wide position during the defensive phase.' },
      { index: 2, start: 0.30, end: 0.65, name: 'Inversion Movement', description: 'Upon gaining possession, the fullback tucks inside alongside the holding midfielder, forming a double pivot.' },
      { index: 3, start: 0.65, end: 1.00, name: 'Central Overload', description: 'The inverted fullback creates a 3v2 central overload, freeing the winger to have the entire flank.' }
    ],
    annotations: [
      { start: 0.00, end: 0.25, text: 'The fullback begins in a standard wide position — but upon winning possession, the inversion begins.' },
      { start: 0.25, end: 0.55, text: 'The fullback moves inside to sit next to the holding midfielder, creating a double pivot and transforming the build-up into a 3-2 shape.' },
      { start: 0.55, end: 0.80, text: 'The central overload draws the opponent\'s midfield press, leaving the winger isolated in a 1v1 on the wing.' },
      { start: 0.80, end: 1.00, text: 'Inverted fullbacks provide structural balance — securing the midfield while allowing wingers freedom to attack wide.' }
    ]
  }
};

export class ComposedTacticalModule implements TacticalModule {
  protected engine: TacticalAnimationEngine | null = null;
  protected activeBranch: 'A' | 'B' = 'A';
  protected compiledData: CompileResult | null = null;
  protected currentLevel: ComplexityLevel = ComplexityLevel.INTERMEDIATE;
  protected visualMode: VisualMode = 'concept';
  
  // Track firing status of analytics events
  protected firedAnalyticsEvents = new Set<string>();
  protected currentPhaseIndex: number = -1;
  protected currentAnnotationText: string = '';
  protected lastPreset: string = '';
  protected isInitialStartFired: boolean = false;

  private unsubscribeTick: (() => void) | null = null;
  private unsubscribeLoop: (() => void) | null = null;
  private unsubscribeState: (() => void) | null = null;

  // Callbacks from orchestrator
  public onPhaseChange: ((phaseIndex: number, phaseName: string) => void) | null = null;
  public onAnnotationChange: ((text: string) => void) | null = null;
  public onAnalyticsEvent: ((eventName: string, data: any) => void) | null = null;
  public onCameraPresetChange: ((presetName: string) => void) | null = null;

  constructor(protected options: ComposedModuleOptions) {
    if (options.visualMode) {
      this.visualMode = options.visualMode;
    }
  }

  public init(engine: TacticalAnimationEngine, conceptId?: string): void {
    // Apply concept-specific overrides if this module is loaded under a different concept
    if (conceptId && CONCEPT_OVERRIDES[conceptId]) {
      const overrides = CONCEPT_OVERRIDES[conceptId];
      if (overrides.id) this.options.id = overrides.id;
      if (overrides.name) this.options.name = overrides.name;
      if (overrides.description) this.options.description = overrides.description;
      if (overrides.phases) this.options.phases = overrides.phases;
      if (overrides.annotations) this.options.annotations = overrides.annotations;
    }

    this.engine = engine;
    this.engine.getTimeline().setDuration(this.options.durationSeconds);
    if ((this.engine as any).setVisualMode) {
      (this.engine as any).setVisualMode(this.visualMode);
    }
    
    this.compileAndLoad();
    this.subscribeToTimelineEvents();
    this.reset();
  }

  public setVisualMode(mode: VisualMode): void {
    if (this.visualMode === mode) return;
    this.visualMode = mode;
    if (this.engine && (this.engine as any).setVisualMode) {
      (this.engine as any).setVisualMode(mode);
    }
    this.compileAndLoad();
    this.reset();
  }

  public getVisualMode(): VisualMode {
    return this.visualMode;
  }

  protected compileAndLoad(): void {
    if (!this.engine) return;

    // Combine global primitives with active branch primitives
    const branchPrims = this.options.branchPrimitives?.[this.activeBranch] || [];
    const allPrims = [...this.options.primitives, ...branchPrims];

    this.compiledData = PrimitiveCompiler.compile(
      allPrims,
      this.options.durationSeconds,
      this.activeBranch,
      this.visualMode
    );


    // If compiler failed validation, log it to help developers debug
    if (!this.compiledData.validationReport.valid) {
      console.error(`[Primitive Compiler Error in Module ${this.options.id}]:`, 
        this.compiledData.validationReport.errors
      );
    }

    const filteredArrows = this.compiledData.arrows.filter(arrow => 
      this.shouldShowOverlayOrArrowForLevel(arrow.id, this.currentLevel)
    );
    const filteredOverlays = this.compiledData.overlays.filter(overlay => 
      this.shouldShowOverlayOrArrowForLevel(overlay.id, this.currentLevel)
    );

    let finalArrows = filteredArrows;
    let finalOverlays = filteredOverlays;

    if (this.visualMode === 'historical') {
      finalArrows = filteredArrows.map(arrow => 
        VisualLanguageRegistry.applyHistoricalToArrow(arrow)
      );
      finalOverlays = filteredOverlays.map(overlay => 
        VisualLanguageRegistry.applyHistoricalToOverlay(overlay)
      );
    }

    let conceptData = {
      players: this.compiledData.players,
      arrows: finalArrows,
      overlays: finalOverlays,
      ball: this.compiledData.ball,
      duration: this.options.durationSeconds
    };

    // Smooth transition from previous coordinates if players exist in engine
    if (this.engine.getPlayerManager().getPlayers().size > 0 && this.visualMode !== 'historical') {
      conceptData = transitionManager.prepareTransition(this.engine, conceptData);
    }

    this.engine.loadConcept(conceptData);
  }

  private subscribeToTimelineEvents(): void {
    if (!this.engine) return;

    this.unsubscribeTick = this.engine.getTimeline().subscribe('tick', (fraction: number) => {
      this.evaluateTimelineTicks(fraction);
    });

    this.unsubscribeLoop = this.engine.getTimeline().subscribe('loop', () => {
      this.triggerAnalytics('animation_completed', { 
        concept_id: this.options.id,
        branch: this.activeBranch 
      });
      this.firedAnalyticsEvents.clear();
      this.isInitialStartFired = false;
    });

    this.unsubscribeState = this.engine.getTimeline().subscribe('stateChange', (isPlaying: boolean) => {
      if (isPlaying && !this.isInitialStartFired) {
        this.triggerAnalytics('animation_started', { 
          concept_id: this.options.id,
          branch: this.activeBranch 
        });
        this.isInitialStartFired = true;
      }
    });
  }

  public setBranch(branch: 'A' | 'B'): void {
    if (this.activeBranch === branch) return;
    this.activeBranch = branch;
    
    this.triggerAnalytics('replay_triggered', { reason: 'branch_switch', branch });
    this.compileAndLoad();
    this.reset();
  }

  public getBranch(): 'A' | 'B' {
    return this.activeBranch;
  }

  public getMetadata() {
    return {
      id: this.options.id,
      name: this.options.name,
      description: this.options.description,
      duration: this.options.durationSeconds
    };
  }

  public getPhaseStarts(): number[] {
    const phases = this.options.phases || [];
    return phases.map(p => p.start);
  }

  public getPhases(): Array<{ index: number; start: number; end: number; name: string; description: string }> {
    return this.options.phases || [];
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
    this.lastPreset = '';
    this.isInitialStartFired = false;
    this.firedAnalyticsEvents.clear();
    
    this.evaluateTimelineTicks(0.0);
  }

  public destroy(): void {
    if (this.unsubscribeTick) this.unsubscribeTick();
    if (this.unsubscribeLoop) this.unsubscribeLoop();
    if (this.unsubscribeState) this.unsubscribeState();
    this.engine = null;
  }

  public getPhaseInfo(t: number): { index: number; name: string; description: string } {
    const phases = this.options.phases || [];
    const active = phases.find((p, idx) => {
      const isLast = idx === phases.length - 1;
      if (isLast) {
        return t >= p.start && t <= p.end;
      }
      return t >= p.start && t < p.end;
    });
    return active || { index: 1, name: 'Setup', description: '' };
  }

  public getTeachingAnnotation(t: number): string {
    const annotations = this.options.annotations || [];
    const active = annotations.find((a, idx) => {
      const isLast = idx === annotations.length - 1;
      if (isLast) {
        return t >= a.start && t <= a.end;
      }
      return t >= a.start && t < a.end;
    });
    return active ? active.text : '';
  }

  public getCameraPresetForFraction(t: number): string {
    const cameras = this.options.cameraPresets || [];
    const active = cameras.find((c, idx) => {
      const isLast = idx === cameras.length - 1;
      if (isLast) {
        return t >= c.start && t <= c.end;
      }
      return t >= c.start && t < c.end;
    });
    return active ? active.preset : 'overview';
  }

  protected applyCameraPreset(_preset: string): void {
    if (!this.engine) return;
    const camera = (this.engine as any).camera;
    const controls = (this.engine as any).controls;
    if (!camera || !controls) return;

    // Always set target and coordinates to overhead view as requested by user
    const targetPos = new THREE.Vector3(0, 135, 0.1);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    transitionManager.transitionCamera(camera, controls, targetPos, targetLookAt, 1200);
  }

  protected evaluateTimelineTicks(fraction: number): void {
    // 1. Phase transitions
    const phase = this.getPhaseInfo(fraction);
    if (phase.index !== this.currentPhaseIndex) {
      this.currentPhaseIndex = phase.index;
      const adaptedName = this.getAdaptedCommentary(phase.name);
      if (this.onPhaseChange) {
        this.onPhaseChange(phase.index, adaptedName);
      }
      this.triggerAnalytics('step_changed', { phaseIndex: phase.index, phaseName: phase.name });
    }

    // 2. Annotations
    const text = this.getTeachingAnnotation(fraction);
    const adaptedText = this.getAdaptedCommentary(text);
    if (adaptedText !== this.currentAnnotationText) {
      this.currentAnnotationText = adaptedText;
      if (this.onAnnotationChange) {
        this.onAnnotationChange(adaptedText);
      }
    }

    // 3. Camera presets
    const preset = this.getCameraPresetForFraction(fraction);
    if (preset !== this.lastPreset) {
      this.lastPreset = preset;
      if (this.onCameraPresetChange) {
        this.onCameraPresetChange(preset);
      }
      this.applyCameraPreset(preset);
    }

    // 4. Analytics Events from decision primitives
    if (this.compiledData) {
      this.compiledData.analyticsEvents.forEach(evt => {
        const key = `${evt.eventName}_${evt.timeFraction}`;
        if (fraction >= evt.timeFraction && !this.firedAnalyticsEvents.has(key)) {
          this.triggerAnalytics(evt.eventName, evt.data);
          this.firedAnalyticsEvents.add(key);
        }
      });
    }
  }

  protected triggerAnalytics(eventName: string, data: any): void {
    if (this.onAnalyticsEvent) {
      this.onAnalyticsEvent(eventName, data);
    }
  }

  public getDebugMetrics(fraction: number): Record<string, any> {
    if (this.options.debugMetricsBuilder) {
      return this.options.debugMetricsBuilder(fraction, this.activeBranch);
    }
    return {
      currentPhase: this.getPhaseInfo(fraction).name,
      timelinePosition: `${(fraction * 100).toFixed(1)}%`
    };
  }

  public getValidationReport(branch: 'A' | 'B' = 'A') {
    if (this.compiledData) {
      return this.compiledData.validationReport;
    }
    const branchPrims = this.options.branchPrimitives?.[branch] || [];
    const allPrims = [...this.options.primitives, ...branchPrims];
    const report = PrimitiveCompiler.compile(allPrims, this.options.durationSeconds, branch);
    return report.validationReport;
  }

  public setComplexityLevel(level: ComplexityLevel): void {
    if (this.currentLevel === level) return;
    this.currentLevel = level;
    this.compileAndLoad();
    this.reset();
  }

  private shouldShowOverlayOrArrowForLevel(id: string, level: ComplexityLevel): boolean {
    const cleanId = id.toLowerCase();
    
    const isAdvanced = 
      cleanId.includes('follow') || 
      cleanId.includes('reaction') || 
      cleanId.includes('hold') || 
      cleanId.includes('reference') || 
      cleanId.includes('overload') || 
      cleanId.includes('numerical') || 
      cleanId.includes('advantage') || 
      cleanId.includes('between_lines') || 
      cleanId.includes('lines') || 
      cleanId.includes('occupation') || 
      cleanId.includes('compactness') || 
      cleanId.includes('grid') || 
      cleanId.includes('trap') || 
      cleanId.includes('trigger') || 
      cleanId.includes('funnel') || 
      cleanId.includes('isolation') || 
      cleanId.includes('shadow') || 
      cleanId.includes('turnover') ||
      cleanId.includes('block_structure');

    if (level === ComplexityLevel.BEGINNER) {
      return !isAdvanced;
    }
    
    if (level === ComplexityLevel.ADVANCED) {
      return isAdvanced;
    }
    
    return true; // Intermediate shows all
  }

  private getAdaptedCommentary(text: string): string {
    if (!text) return '';
    if (this.currentLevel === ComplexityLevel.BEGINNER) {
      return this.translateToBeginnerCommentary(text);
    } else if (this.currentLevel === ComplexityLevel.ADVANCED) {
      return this.translateToAdvancedCommentary(text);
    }
    return text;
  }

  private translateToBeginnerCommentary(text: string): string {
    let res = text;
    const replacements: [RegExp, string][] = [
      [/\bFalse 9\b/g, 'Withdrawn Striker'],
      [/\bfalse 9\b/g, 'withdrawn striker'],
      [/\bFalse9\b/g, 'Withdrawn Striker'],
      [/\bfalse9\b/g, 'withdrawn striker'],
      [/\b[Nn]umerical [Oo]verload\b/g, 'extra player advantage'],
      [/\b[Mm]idfield [Oo]verload\b/g, 'extra midfielder advantage'],
      [/\b[Oo]verload\b/g, 'extra player numbers'],
      [/\b[Ii]nverted [Ww]inger\b/g, 'winger cutting inside'],
      [/\b[Ii]nverted [Ww]ingers\b/g, 'wingers cutting inside'],
      [/\b[Pp]ressing [Tt]rap\b/g, 'defensive trap'],
      [/\b[Pp]ressing [Tt]raps\b/g, 'defensive traps'],
      [/\b[Dd]efensive [Bb]lock\b/g, 'defensive shape'],
      [/\b[Ll]ow [Bb]lock\b/g, 'deep defense shape'],
      [/\b[Cc]ompact [Bb]lock\b/g, 'tight defense shape'],
      [/\b[Cc]ompactness\b/g, 'close teamwork shape'],
      [/\b[Rr]eference [Pp]oints\b/g, 'defenders marking targets'],
      [/\b[Rr]eference [Pp]oint\b/g, 'defender marking target'],
      [/\b[Hh]alf-[Ss]paces\b/g, 'channels between center and side'],
      [/\b[Hh]alf-[Ss]pace\b/g, 'channel between center and side'],
      [/\b[Zz]one 14\b/g, 'area in front of the penalty box'],
      [/\b[Ll]ine [Oo]ccupation\b/g, 'occupying positions'],
      [/\b[Dd]efensive [Tt]riggers\b/g, 'moments to start defending'],
      [/\b[Dd]efensive [Tt]rigger\b/g, 'moment to start defending'],
      [/\b[Gg]egenpressing\b/g, 'winning the ball back immediately'],
      [/\b[Cc]ounter-[Pp]ressing\b/g, 'winning the ball back immediately'],
      [/\b[Vv]ertical [Oo]utlets\b/g, 'forward passing routes'],
      [/\b[Vv]ertical [Oo]utlet\b/g, 'forward passing route'],
      [/\b[Pp]ositional [Aa]ttacks\b/g, 'structured team attacks'],
      [/\b[Pp]ositional [Aa]ttack\b/g, 'structured team attack'],
      [/\b[Cc]entral [Ss]uperiority\b/g, 'extra numbers in the middle'],
      [/\b[Dd]estabilizes\b/g, 'disrupts'],
      [/\b[Dd]estabilize\b/g, 'disrupt'],
      [/\b[Hh]alfspaces\b/g, 'channels between center and side'],
      [/\b[Hh]alfspace\b/g, 'channel between center and side']
    ];
    for (const [regex, replacement] of replacements) {
      res = res.replace(regex, replacement);
    }
    return res;
  }

  private translateToAdvancedCommentary(text: string): string {
    let res = text;
    const replacements: [RegExp, string][] = [
      [/\bstriker drops deep\b/gi, 'False 9 drops deep to manipulate CB reference coordinates'],
      [/\bstriker dropping deep\b/gi, 'False 9 withdrawing to destabilize central defensive reference coordinates'],
      [/\bextra player in midfield\b/gi, 'midfield numerical overload (+1 structural superiority)'],
      [/\bmidfield numerical superiority\b/gi, 'numerical overload (+1 structural superiority) in the central corridor'],
      [/\bdefensive trap\b/gi, 'structured pressing trap enforcing a deterministic turnover trigger'],
      [/\bdefensive traps\b/gi, 'structured pressing traps enforcing deterministic turnover triggers'],
      [/\bdeep defense\b/gi, 'low defensive block optimizing vertical compactness'],
      [/\bdefending deep\b/gi, 'low block structure maintaining line compactness'],
      [/\bdefenders\b/gi, 'defensive reference points'],
      [/\bpassing lanes\b/gi, 'vertical passing corridors/lanes'],
      [/\bmarks the player\b/gi, 'establishes defensive marking reference coordinates'],
      [/\bgap in defense\b/gi, 'exposed defensive line gap due to structural manipulation'],
      [/\bcenter back follows\b/gi, 'center-back is drawn out, compromising defensive reference points']
    ];
    for (const [regex, replacement] of replacements) {
      res = res.replace(regex, replacement);
    }
    return res;
  }

  public getActiveEventTypes(fraction: number): TacticalEventType[] {
    if (!this.compiledData) return [];
    const active: Set<TacticalEventType> = new Set();
    
    // Check arrows
    this.compiledData.arrows.forEach(a => {
      if (fraction >= a.startFrame && fraction <= a.endFrame && a.eventType) {
        active.add(a.eventType as TacticalEventType);
      }
    });

    // Check overlays
    this.compiledData.overlays.forEach(o => {
      if (fraction >= o.startFrame && fraction <= o.endFrame && o.eventType) {
        active.add(o.eventType as TacticalEventType);
      }
    });

    return Array.from(active);
  }
}

