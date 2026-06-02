import * as THREE from 'three';
import { Timeline } from './timeline';
import { PlayerManager } from './player';
import { ArrowManager } from './arrow';
import { OverlayManager } from './overlay';
import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  TacticalPosition, 
  AnimationFrame, 
  EngineTelemetry 
} from './types';

export class TacticalAnimationEngine {
  private scene: THREE.Scene;
  private timeline: Timeline;
  
  // Managers
  private playerManager: PlayerManager;
  private arrowManager: ArrowManager;
  private overlayManager: OverlayManager;

  // Ball
  private ballMesh: THREE.Mesh | null = null;
  private ballStartPos: TacticalPosition = { x: 0, z: 0 };
  private ballKeyFrames: AnimationFrame[] = [];
  private ballCurrentPos: TacticalPosition = { x: 0, z: 0 };
  private ballHeight: number = 0.275;

  // Configuration
  private teamAVisible: boolean = true;
  private teamBVisible: boolean = true;

  // Performance Telemetry tracking
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private currentFps: number = 60;
  private telemetryCallbacks: Set<(telemetry: EngineTelemetry) => void> = new Set();
  private isDestroyed: boolean = false;

  constructor(scene: THREE.Scene, durationSeconds: number = 10.0) {
    this.scene = scene;
    this.timeline = new Timeline(durationSeconds);

    this.playerManager = new PlayerManager(this.scene);
    this.arrowManager = new ArrowManager(this.scene);
    this.overlayManager = new OverlayManager(this.scene);

    this.setupBall();
    this.subscribeToTimeline();
  }

  private setupBall(): void {
    const ballGeo = new THREE.SphereGeometry(0.55, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.25,
      metalness: 0.1
    });
    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.name = 'tactical-ball';
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(0, 0.275, 0);
    this.scene.add(this.ballMesh);
  }

  private subscribeToTimeline(): void {
    // Whenever the timeline fires a tick, update all managers
    this.timeline.subscribe('tick', (fraction: number) => {
      this.playerManager.update(fraction, this.teamAVisible, this.teamBVisible);
      this.overlayManager.update(fraction);

      // Determine delta time to update moving dashes in arrows
      const now = performance.now();
      const dt = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0.016;
      
      this.arrowManager.update(fraction, dt);
      this.updateBall(fraction);
      this.dispatchTelemetry(fraction);
    });
  }

  /**
   * Smart ball physics interpolator with automatic lofted pass arcs
   */
  private updateBall(time: number): void {
    if (!this.ballMesh) return;

    // Reuse PlayerManager keyframe interpolator for coordinate translations
    const pos = this.playerManager.interpolatePosition(
      this.ballKeyFrames,
      this.ballStartPos,
      time
    );
    this.ballCurrentPos = pos;

    // Parabolic arc (loft) height calculations
    let yHeight = 0.275;

    if (this.ballKeyFrames.length > 0) {
      const sorted = [...this.ballKeyFrames].sort((a, b) => a.time - b.time);
      
      // Determine surrounding keyframes
      let prev = { time: 0, x: this.ballStartPos.x, z: this.ballStartPos.z };
      let next = sorted[0];

      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].time <= time) {
          prev = sorted[i];
        } else {
          next = sorted[i];
          break;
        }
      }

      const segmentDuration = next.time - prev.time;
      if (segmentDuration > 0) {
        // Calculate segment progress
        const u = (time - prev.time) / segmentDuration;
        
        // Calculate horizontal distance between keyframes
        const dx = next.x - prev.x;
        const dz = next.z - prev.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        // If distance is significant (e.g. > 8 units), add a loft curve
        if (dist > 8.0) {
          const maxLoft = Math.min(4.0, dist * 0.22); // Cap height scale
          yHeight = 0.275 + Math.sin(u * Math.PI) * maxLoft;
        }
      }
    }

    this.ballHeight = yHeight;
    this.ballMesh.position.set(pos.x, yHeight, pos.z);
  }

  /**
   * Feeds structured data into the animation engine
   */
  public loadConcept(data: {
    players: PlayerState[];
    arrows: ArrowState[];
    overlays: OverlayState[];
    ball?: {
      startPos: TacticalPosition;
      keyFrames: AnimationFrame[];
    };
    duration?: number;
  }): void {
    const wasPlaying = this.timeline.isPlaying();
    this.timeline.reset();
    
    if (data.duration) {
      this.timeline.setDuration(data.duration);
    }

    this.playerManager.setPlayers(data.players);
    this.arrowManager.setArrows(data.arrows);
    this.overlayManager.setOverlays(data.overlays);

    if (data.ball) {
      this.ballStartPos = data.ball.startPos;
      this.ballKeyFrames = data.ball.keyFrames;
    } else {
      this.ballStartPos = { x: 0, z: 0 };
      this.ballKeyFrames = [];
    }

    // Force redraw first frame
    this.timeline.seek(0.0);

    if (wasPlaying) {
      this.timeline.play();
    }
  }

  /**
   * Main ticking driver. Call this inside your requestAnimationFrame loop.
   */
  public tick(deltaTimeSeconds: number): void {
    if (this.isDestroyed) return;

    // Track FPS metrics
    const now = performance.now();
    this.frameTimes.push(now);
    while (this.frameTimes.length > 0 && this.frameTimes[0] < now - 1000) {
      this.frameTimes.shift();
    }
    this.currentFps = this.frameTimes.length;
    this.lastFrameTime = now;

    // Advance timeline
    this.timeline.update(deltaTimeSeconds);
  }

  // Playback Control delegation
  public play(): void {
    this.timeline.play();
  }

  public pause(): void {
    this.timeline.pause();
  }

  public reset(): void {
    this.timeline.reset();
  }

  public restart(): void {
    this.timeline.restart();
  }

  public seek(fraction: number): void {
    this.timeline.seek(fraction);
  }

  public setSpeed(multiplier: number): void {
    this.timeline.setSpeed(multiplier);
  }

  public setTeamVisibility(team: 'attack' | 'defense', visible: boolean): void {
    if (team === 'attack') this.teamAVisible = visible;
    if (team === 'defense') this.teamBVisible = visible;
    this.timeline.seek(this.timeline.getCurrentTime()); // Refresh frame
  }

  // Getters
  public getTimeline(): Timeline {
    return this.timeline;
  }

  public getPlayerManager(): PlayerManager {
    return this.playerManager;
  }

  public getArrowManager(): ArrowManager {
    return this.arrowManager;
  }

  public getOverlayManager(): OverlayManager {
    return this.overlayManager;
  }

  public getBallPosition(): TacticalPosition & { y: number } {
    return { ...this.ballCurrentPos, y: this.ballHeight };
  }

  // Telemetry event stream
  public subscribeTelemetry(callback: (telemetry: EngineTelemetry) => void): () => void {
    this.telemetryCallbacks.add(callback);
    return () => {
      this.telemetryCallbacks.delete(callback);
    };
  }

  private dispatchTelemetry(fraction: number): void {
    const activePlayers = Array.from(this.playerManager.getPlayers().values())
      .filter(p => p.visible && (p.team === 'attack' ? this.teamAVisible : this.teamBVisible)).length;
    
    const activeArrows = Array.from(this.arrowManager.getArrows().values())
      .filter(a => fraction >= a.startFrame && fraction <= a.endFrame).length;

    const activeOverlays = Array.from(this.overlayManager.getOverlays().values())
      .filter(o => fraction >= o.startFrame && fraction <= o.endFrame).length;

    const telemetry: EngineTelemetry = {
      fps: this.currentFps,
      activePlayers,
      activeArrows,
      activeOverlays,
      currentTime: fraction,
      isPlaying: this.timeline.isPlaying()
    };

    this.telemetryCallbacks.forEach(cb => cb(telemetry));
  }

  /**
   * Recovers memory by disposing geometry and materials
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.timeline.pause();
    this.telemetryCallbacks.clear();

    this.playerManager.destroy();
    this.arrowManager.destroy();
    this.overlayManager.destroy();

    if (this.ballMesh) {
      if (this.ballMesh.geometry) this.ballMesh.geometry.dispose();
      if (this.ballMesh.material) {
        if (Array.isArray(this.ballMesh.material)) {
          this.ballMesh.material.forEach(m => m.dispose());
        } else {
          this.ballMesh.material.dispose();
        }
      }
      this.scene.remove(this.ballMesh);
      this.ballMesh = null;
    }
  }
}
