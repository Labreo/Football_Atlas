import * as THREE from 'three';
import { TacticalModule } from '../tacticalEngine/module';
import { TacticalAnimationEngine } from '../tacticalEngine/engine';
import { PrimitiveCompiler, CompileResult } from './compiler';
import { TacticalPrimitive } from './types';
import { transitionManager } from '../tacticalOrchestrator/TransitionManager';

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
}

export class ComposedTacticalModule implements TacticalModule {
  protected engine: TacticalAnimationEngine | null = null;
  protected activeBranch: 'A' | 'B' = 'A';
  protected compiledData: CompileResult | null = null;
  
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

  constructor(protected options: ComposedModuleOptions) {}

  public init(engine: TacticalAnimationEngine): void {
    this.engine = engine;
    this.engine.getTimeline().setDuration(this.options.durationSeconds);
    
    this.compileAndLoad();
    this.subscribeToTimelineEvents();
    this.reset();
  }

  protected compileAndLoad(): void {
    if (!this.engine) return;

    // Combine global primitives with active branch primitives
    const branchPrims = this.options.branchPrimitives?.[this.activeBranch] || [];
    const allPrims = [...this.options.primitives, ...branchPrims];

    this.compiledData = PrimitiveCompiler.compile(
      allPrims,
      this.options.durationSeconds,
      this.activeBranch
    );

    // If compiler failed validation, log it to help developers debug
    if (!this.compiledData.validationReport.valid) {
      console.error(`[Primitive Compiler Error in Module ${this.options.id}]:`, 
        this.compiledData.validationReport.errors
      );
    }

    let conceptData = {
      players: this.compiledData.players,
      arrows: this.compiledData.arrows,
      overlays: this.compiledData.overlays,
      ball: this.compiledData.ball,
      duration: this.options.durationSeconds
    };

    // Smooth transition from previous coordinates if players exist in engine
    if (this.engine.getPlayerManager().getPlayers().size > 0) {
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

  protected applyCameraPreset(preset: string): void {
    if (!this.engine) return;
    const camera = (this.engine as any).camera;
    const controls = (this.engine as any).controls;
    if (!camera || !controls) return;

    const targetPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    switch (preset) {
      case 'overview':
        targetPos.set(0, 135, 0.1);
        targetLookAt.set(0, 0, 0);
        break;
      case 'press_trigger':
        targetPos.set(-10, 85, 45);
        targetLookAt.set(-10, 0, 0);
        break;
      case 'turnover':
        targetPos.set(5, 80, 40);
        targetLookAt.set(5, 0, 0);
        break;
      case 'central_space':
        targetPos.set(0, 90, 50);
        targetLookAt.set(0, 0, 0);
        break;
      case 'compactness':
        targetPos.set(10, 85, 45);
        targetLookAt.set(10, 0, 0);
        break;
      case 'transition':
        targetPos.set(-15, 85, 45);
        targetLookAt.set(-15, 0, -5);
        break;
      case 'counter_channel':
        targetPos.set(10, 80, 50);
        targetLookAt.set(10, 0, 10);
        break;
      case 'recovery_race':
        targetPos.set(25, 85, 55);
        targetLookAt.set(25, 0, 5);
        break;
      case 'summary':
        targetPos.set(0, 135, 0.1);
        targetLookAt.set(0, 0, 0);
        break;
      case 'defensive_view':
        targetPos.set(-20, 95, 50);
        targetLookAt.set(-20, 0, 0);
        break;
      case 'wingback_view':
        targetPos.set(0, 80, 55);
        targetLookAt.set(5, 0, 15);
        break;
      case 'attacking_view':
        targetPos.set(15, 95, 50);
        targetLookAt.set(15, 0, 0);
        break;
      case 'transformation_view':
        targetPos.set(0, 110, 45);
        targetLookAt.set(0, 0, 0);
        break;
      case 'summary_view':
        targetPos.set(0, 135, 0.1);
        targetLookAt.set(0, 0, 0);
        break;
      case 'triangle_view':
        targetPos.set(-5, 90, 45);
        targetLookAt.set(-5, 0, 0);
        break;
      case 'offball_view':
        targetPos.set(5, 80, 50);
        targetLookAt.set(5, 0, 10);
        break;
      case 'route_view':
        targetPos.set(20, 85, 45);
        targetLookAt.set(20, 0, -5);
        break;
      case 'role_view':
        targetPos.set(12, 85, 48);
        targetLookAt.set(15, 0, 18);
        break;
      case 'halfspace_view':
        targetPos.set(20, 80, 48);
        targetLookAt.set(20, 0, 12);
        break;
      case 'combination_play':
        targetPos.set(15, 85, 45);
        targetLookAt.set(18, 0, 8);
        break;
      case 'overlap_view':
        targetPos.set(25, 80, 55);
        targetLookAt.set(25, 0, 20);
        break;
      case 'attacking_third':
        targetPos.set(30, 80, 48);
        targetLookAt.set(30, 0, 8);
        break;
      case 'horizontal_compactness_view':
        targetPos.set(0, 110, 30);
        targetLookAt.set(0, 0, 0);
        break;
      case 'vertical_compactness_view':
        targetPos.set(20, 100, 40);
        targetLookAt.set(10, 0, 0);
        break;
      case 'pressing_structure_view':
        targetPos.set(-15, 90, 45);
        targetLookAt.set(-10, 0, 0);
        break;
      case 'gap_analysis_view':
        targetPos.set(5, 95, 45);
        targetLookAt.set(5, 0, 0);
        break;
      default:
        targetPos.set(0, 135, 0.1);
        targetLookAt.set(0, 0, 0);
    }

    transitionManager.transitionCamera(camera, controls, targetPos, targetLookAt, 1200);
  }

  protected evaluateTimelineTicks(fraction: number): void {
    // 1. Phase transitions
    const phase = this.getPhaseInfo(fraction);
    if (phase.index !== this.currentPhaseIndex) {
      this.currentPhaseIndex = phase.index;
      if (this.onPhaseChange) {
        this.onPhaseChange(phase.index, phase.name);
      }
      this.triggerAnalytics('step_changed', { phaseIndex: phase.index, phaseName: phase.name });
    }

    // 2. Annotations
    const text = this.getTeachingAnnotation(fraction);
    if (text !== this.currentAnnotationText) {
      this.currentAnnotationText = text;
      if (this.onAnnotationChange) {
        this.onAnnotationChange(text);
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
}
