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
import { VisualMode } from '../visualLanguage/types';


export class TacticalAnimationEngine {
  private scene: THREE.Scene;
  private timeline: Timeline;
  
  // Managers
  private playerManager: PlayerManager;
  private arrowManager: ArrowManager;
  private overlayManager: OverlayManager;

  // Ball
  private ballMesh: THREE.Mesh | null = null;
  private ballRingMesh: THREE.Mesh | null = null;
  private ballMarkerMesh: THREE.Mesh | null = null;
  private ballStartPos: TacticalPosition = { x: 0, z: 0 };
  private ballKeyFrames: AnimationFrame[] = [];
  private ballCurrentPos: TacticalPosition = { x: 0, z: 0 };
  private ballHeight: number = 0.275;

  // Configuration
  private teamAVisible: boolean = true;
  private teamBVisible: boolean = true;
  private visualMode: VisualMode = 'concept';

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

    // Create the procedural Adidas Trionda 2026 World Cup match ball texture
    const texCanvas = document.createElement('canvas');
    texCanvas.width = 512;
    texCanvas.height = 256;
    const ctx = texCanvas.getContext('2d')!;

    // 1. Premium white base
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(0, 0, 512, 256);

    // 2. Draw sweeping "la ola" (stadium wave) panel seams (curved lines)
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2.0;
    
    const drawSeam = (startY: number, controlY1: number, controlY2: number, endY: number) => {
      ctx.beginPath();
      ctx.moveTo(0, startY);
      ctx.bezierCurveTo(128, controlY1, 384, controlY2, 512, endY);
      ctx.stroke();
    };
    drawSeam(64, 180, 80, 64);
    drawSeam(192, 80, 180, 192);
    drawSeam(0, 128, 128, 256);
    drawSeam(256, 128, 128, 0);

    // 3. Draw interweaving red, green, and blue stadium waves (Trionda ribbon shapes)
    const drawTriondaWave = (yOffset: number, color: string, amp: number, phase: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 128 + yOffset);
      for (let x = 0; x <= 512; x += 8) {
        const y = 128 + yOffset + Math.sin((x / 512) * Math.PI * 2 + phase) * amp;
        ctx.lineTo(x, y);
      }
      for (let x = 512; x >= 0; x -= 8) {
        const y = 128 + yOffset + Math.sin((x / 512) * Math.PI * 2 + phase) * amp + 14;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    // Red Wave (Canada)
    drawTriondaWave(-20, 'rgba(239, 68, 68, 0.85)', 25, 0);
    // Green Wave (Mexico)
    drawTriondaWave(0, 'rgba(16, 185, 129, 0.85)', 30, Math.PI * 0.6);
    // Blue Wave (USA)
    drawTriondaWave(20, 'rgba(37, 99, 235, 0.85)', 25, Math.PI * 1.2);

    // 4. Draw host nation icons (USA Star, Canada Maple Leaf, Mexico Eagle)
    const drawStar = (cx: number, cy: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        const a2 = a + Math.PI / 5;
        ctx.lineTo(cx + (r / 2) * Math.cos(a2), cy + (r / 2) * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
    };

    const drawMapleLeaf = (cx: number, cy: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r * 0.3, cy - r * 0.4);
      ctx.lineTo(cx + r * 0.8, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.5, cy - r * 0.1);
      ctx.lineTo(cx + r * 0.9, cy + r * 0.2);
      ctx.lineTo(cx + r * 0.3, cy + r * 0.2);
      ctx.lineTo(cx + r * 0.1, cy + r * 0.7); // stem
      ctx.lineTo(cx - r * 0.1, cy + r * 0.7);
      ctx.lineTo(cx - r * 0.3, cy + r * 0.2);
      ctx.lineTo(cx - r * 0.9, cy + r * 0.2);
      ctx.lineTo(cx - r * 0.5, cy - r * 0.1);
      ctx.lineTo(cx - r * 0.8, cy - r * 0.5);
      ctx.lineTo(cx - r * 0.3, cy - r * 0.4);
      ctx.closePath();
      ctx.fill();
    };

    const drawEagle = (cx: number, cy: number, r: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(cx, cy - r * 0.3);
      ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 0.8, cx + r, cy - r * 0.5);
      ctx.lineTo(cx + r * 0.7, cy);
      ctx.lineTo(cx + r * 0.4, cy - r * 0.1);
      ctx.lineTo(cx, cy + r * 0.5);
      ctx.lineTo(cx - r * 0.4, cy - r * 0.1);
      ctx.lineTo(cx - r * 0.7, cy);
      ctx.lineTo(cx - r, cy - r * 0.5);
      ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.8, cx, cy - r * 0.3);
      ctx.closePath();
      ctx.fill();
    };

    // Draw icons scattered in the panels
    drawStar(100, 60, 6, '#F59E0B');
    drawStar(360, 180, 6, '#F59E0B');
    drawMapleLeaf(240, 60, 7, '#EF4444');
    drawMapleLeaf(440, 190, 7, '#EF4444');
    drawEagle(150, 180, 7, '#10B981');
    drawEagle(380, 60, 7, '#10B981');

    // 5. Connected ball sensor chip in the center
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#06B6D4';
    ctx.fillStyle = '#06B6D4';
    const chipX = 256;
    const chipY = 128;
    ctx.fillRect(chipX - 6, chipY - 6, 12, 12);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(chipX - 4, chipY - 4, 8, 8);
    
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 1.0;
    const drawTrace = (sx: number, sy: number, ex: number, ey: number) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    };
    drawTrace(chipX - 6, chipY, chipX - 22, chipY);
    drawTrace(chipX + 6, chipY, chipX + 22, chipY);
    drawTrace(chipX, chipY - 6, chipX, chipY - 22);
    drawTrace(chipX, chipY + 6, chipX, chipY + 22);

    const ballTex = new THREE.CanvasTexture(texCanvas);
    ballTex.wrapS = THREE.RepeatWrapping;
    ballTex.wrapT = THREE.RepeatWrapping;
    if ('colorSpace' in ballTex) {
      (ballTex as any).colorSpace = THREE.SRGBColorSpace;
    }

    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.35,
      metalness: 0.05,
      bumpMap: ballTex,
      bumpScale: 0.015,
    });
    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.name = 'tactical-ball';
    this.ballMesh.castShadow = true;
    this.ballMesh.position.set(0, 0.275, 0);
    this.scene.add(this.ballMesh);

    // Glowing tracker ring directly on the turf below the ball
    const ringGeo = new THREE.RingGeometry(0.8, 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#06B6D4', // Glowing electric cyan
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    this.ballRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ballRingMesh.rotation.x = -Math.PI / 2;
    this.ballRingMesh.position.y = 0.02; // sit flat on pitch surface
    this.scene.add(this.ballRingMesh);

    // Floating double-cone/diamond marker directly above the ball
    const markerGeo = new THREE.OctahedronGeometry(0.42, 0); // double-cone/diamond
    const markerMat = new THREE.MeshBasicMaterial({
      color: '#F59E0B', // Glowing amber gold
      toneMapped: false
    });
    this.ballMarkerMesh = new THREE.Mesh(markerGeo, markerMat);
    this.scene.add(this.ballMarkerMesh);
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

    // Update ring tracker to follow ball horizontally on the ground
    if (this.ballRingMesh) {
      this.ballRingMesh.position.set(pos.x, 0.02, pos.z);
    }

    // Update floating marker to sit above the ball and pulse/bob up and down
    if (this.ballMarkerMesh) {
      const bobbing = Math.sin(performance.now() * 0.005) * 0.15;
      const markerY = yHeight + 1.6 + bobbing;
      this.ballMarkerMesh.position.set(pos.x, markerY, pos.z);
      this.ballMarkerMesh.rotation.y = performance.now() * 0.0015;
    }
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

  public setVisualMode(mode: VisualMode): void {
    this.visualMode = mode;
  }

  public getVisualMode(): VisualMode {
    return this.visualMode;
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

    if (this.ballRingMesh) {
      if (this.ballRingMesh.geometry) this.ballRingMesh.geometry.dispose();
      if (this.ballRingMesh.material) {
        (this.ballRingMesh.material as THREE.Material).dispose();
      }
      this.scene.remove(this.ballRingMesh);
      this.ballRingMesh = null;
    }

    if (this.ballMarkerMesh) {
      if (this.ballMarkerMesh.geometry) this.ballMarkerMesh.geometry.dispose();
      if (this.ballMarkerMesh.material) {
        (this.ballMarkerMesh.material as THREE.Material).dispose();
      }
      this.scene.remove(this.ballMarkerMesh);
      this.ballMarkerMesh = null;
    }
  }
}
