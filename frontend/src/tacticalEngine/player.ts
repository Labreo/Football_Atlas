import * as THREE from 'three';
import { PlayerState, TacticalPosition, AnimationFrame } from './types';

export class PlayerManager {
  private scene: THREE.Scene;
  private playersGroup: THREE.Group;
  private players: Map<string, PlayerState> = new Map();
  private meshes: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.playersGroup = new THREE.Group();
    this.playersGroup.name = 'tactical-players';
    this.scene.add(this.playersGroup);
  }

  /**
   * Evaluates standard easing functions
   */
  private ease(t: number, type?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'): number {
    if (!type || type === 'linear') return t;
    if (type === 'quadInOut') {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    if (type === 'cubicInOut') {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    if (type === 'sineInOut') {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }
    return t;
  }

  /**
   * Interpolate coordinates between keyframes using the specified easing function
   */
  public interpolatePosition(
    keyFrames: AnimationFrame[],
    startPos: TacticalPosition,
    time: number
  ): TacticalPosition {
    if (keyFrames.length === 0) return startPos;

    // Sort keyframes chronologically
    const sorted = [...keyFrames].sort((a, b) => a.time - b.time);

    if (time <= 0) return { x: startPos.x, z: startPos.z };
    if (time >= 1) {
      const last = sorted[sorted.length - 1];
      return { x: last.x, z: last.z };
    }

    let prev: {
      time: number;
      x: number;
      z: number;
      easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut';
    } = { time: 0, x: startPos.x, z: startPos.z, easing: 'linear' };
    let next = sorted[0];

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].time <= time) {
        prev = {
          time: sorted[i].time,
          x: sorted[i].x,
          z: sorted[i].z,
          easing: sorted[i].easing || 'linear'
        };
      } else {
        next = sorted[i];
        break;
      }
    }

    const range = next.time - prev.time;
    if (range === 0) return { x: prev.x, z: prev.z };

    const t = (time - prev.time) / range;
    const easedT = this.ease(t, next.easing || 'linear');

    return {
      x: prev.x + (next.x - prev.x) * easedT,
      z: prev.z + (next.z - prev.z) * easedT,
    };
  }

  /**
   * Creates a canvas texture for the shirt number on the cylinder top face
   */
  private createPlayerDiscTexture(number: number, team: 'attack' | 'defense' | 'defend'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Clear background with royal blue or tactical red
      ctx.fillStyle = team === 'attack' ? '#1D4ED8' : '#DC2626'; // Blue / Red
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();

      // White border circle
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(64, 64, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Number text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 50px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(number.toString(), 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Sets up or updates the set of rendered players
   */
  public setPlayers(players: PlayerState[]): void {
    this.clear();
    players.forEach((p) => {
      this.players.set(p.id, p);
      this.createPlayerMesh(p);
    });
  }

  private createPlayerMesh(p: PlayerState): void {
    const playerToken = new THREE.Group();
    playerToken.name = p.id;

    const discHeight = 0.35;
    const discRadius = 1.35;
    const sideColor = p.team === 'attack' ? '#1D4ED8' : '#DC2626';

    const sideMat = new THREE.MeshStandardMaterial({
      color: sideColor,
      roughness: 0.15,
      metalness: 0.35
    });

    const topTexture = this.createPlayerDiscTexture(p.number, p.team);
    const topMat = new THREE.MeshStandardMaterial({
      map: topTexture,
      roughness: 0.1
    });

    // materials array: [side, top, bottom]
    const discMaterials = [sideMat, topMat, sideMat];
    const geom = new THREE.CylinderGeometry(discRadius, discRadius, discHeight, 32);
    const tokenMesh = new THREE.Mesh(geom, discMaterials);
    tokenMesh.position.y = discHeight / 2;
    tokenMesh.castShadow = true;
    tokenMesh.receiveShadow = false;
    playerToken.add(tokenMesh);

    playerToken.position.set(p.startPos.x, 0, p.startPos.z);
    playerToken.visible = p.visible;

    this.playersGroup.add(playerToken);
    this.meshes.set(p.id, playerToken);
  }

  /**
   * Updates player position by interpolating along keyframes
   */
  public update(time: number, teamAVisible: boolean = true, teamBVisible: boolean = true): void {
    this.players.forEach((p, id) => {
      const mesh = this.meshes.get(id);
      if (!mesh) return;

      const pos = this.interpolatePosition(p.keyFrames, p.startPos, time);
      p.currentPos = pos;
      mesh.position.set(pos.x, 0, pos.z);

      const teamVisible = p.team === 'attack' ? teamAVisible : teamBVisible;
      mesh.visible = p.visible && teamVisible;
    });
  }

  /**
   * Move player dynamically by appending a target frame
   */
  public movePlayer(
    playerId: string,
    targetPos: TacticalPosition,
    durationFraction: number,
    easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut' = 'linear'
  ): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const currentFraction = player.keyFrames.length > 0
      ? player.keyFrames[player.keyFrames.length - 1].time
      : 0.0;

    const newTime = Math.min(1.0, currentFraction + durationFraction);
    player.keyFrames.push({
      time: newTime,
      x: targetPos.x,
      z: targetPos.z,
      easing
    });
  }

  /**
   * Move multiple players concurrently
   */
  public movePlayers(
    moves: { playerId: string; targetPos: TacticalPosition }[],
    durationFraction: number,
    easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut' = 'linear'
  ): void {
    moves.forEach((move) => {
      this.movePlayer(move.playerId, move.targetPos, durationFraction, easing);
    });
  }

  public getPlayerPosition(playerId: string): TacticalPosition | null {
    const player = this.players.get(playerId);
    return player ? player.currentPos : null;
  }

  public getPlayers(): Map<string, PlayerState> {
    return this.players;
  }

  public clear(): void {
    while (this.playersGroup.children.length > 0) {
      const child = this.playersGroup.children[0];
      child.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((m) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (node.material.map) node.material.map.dispose();
              node.material.dispose();
            }
          }
        }
      });
      this.playersGroup.remove(child);
    }
    this.players.clear();
    this.meshes.clear();
  }

  public destroy(): void {
    this.clear();
    this.scene.remove(this.playersGroup);
  }
}
