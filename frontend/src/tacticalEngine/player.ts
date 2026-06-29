import * as THREE from 'three';
import { PlayerState, TacticalPosition, AnimationFrame } from './types';

const photoCache = new Map<string, string | null>();
const imgCache = new Map<string, HTMLImageElement>();
const fetchPromiseCache = new Map<string, Promise<string | null>>();

function fetchWikiPhotoSrc(name: string): Promise<string | null> {
  const formattedName = name.replace(/_/g, ' ');
  if (photoCache.has(formattedName)) {
    return Promise.resolve(photoCache.get(formattedName)!);
  }
  if (fetchPromiseCache.has(formattedName)) {
    return fetchPromiseCache.get(formattedName)!;
  }
  const promise = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(formattedName.replace(/ /g, '_'))}`)
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      const src = d?.thumbnail?.source || null;
      photoCache.set(formattedName, src);
      return src;
    })
    .catch(() => {
      photoCache.set(formattedName, null);
      return null;
    });
  fetchPromiseCache.set(formattedName, promise);
  return promise;
}

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
   * Draws the detailed player disc onto 2D canvas context
   */
  private drawPlayerDisc(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    number: number,
    team: 'attack' | 'defense' | 'defend',
    name?: string,
    image?: HTMLImageElement
  ) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2 - 8; // leave space for border

    // 1. Draw circular clip for photo or fallback
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 2. Draw image if present, else draw fallback color
    const teamColor = team === 'attack' ? '#1D4ED8' : '#DC2626'; // Blue / Red
    const accentColor = team === 'attack' ? '#3B82F6' : '#EF4444';

    if (image) {
      try {
        const imgAspect = image.width / image.height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (imgAspect > 1) {
          drawWidth = height * imgAspect;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawHeight = width / imgAspect;
          offsetY = (height - drawHeight) / 2;
        }

        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      } catch (err) {
        console.error("Failed to draw player photo, using fallback", err);
        ctx.fillStyle = teamColor;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, radius);
      grad.addColorStop(0, accentColor);
      grad.addColorStop(1, teamColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      if (name) {
        const initials = name
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px "Inter", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, cx, cy - 5);
      }
    }

    ctx.restore();

    // 3. Draw thick team color outer ring
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Inner white border ring for premium details
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Draw a small team-color jersey badge at the bottom center
    const badgeX = cx;
    const badgeY = cy + radius - 15;
    const badgeRadius = 18;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = teamColor;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number.toString(), badgeX, badgeY);
  }

  /**
   * Creates a canvas texture for the shirt number and optional photo on the cylinder top face
   */
  private createPlayerDiscTexture(
    number: number,
    team: 'attack' | 'defense' | 'defend',
    name?: string
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    const texture = new THREE.CanvasTexture(canvas);
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = (THREE as any).SRGBColorSpace || 'srgb';
    } else if ('encoding' in texture) {
      (texture as any).encoding = (THREE as any).sRGBEncoding || 3001;
    }

    if (!ctx) return texture;

    // Draw initial fallback state
    this.drawPlayerDisc(ctx, 128, 128, number, team, name);
    texture.needsUpdate = true;

    if (!name) return texture;

    // Check if image object is already cached
    if (imgCache.has(name)) {
      const img = imgCache.get(name)!;
      this.drawPlayerDisc(ctx, 128, 128, number, team, name, img);
      texture.needsUpdate = true;
      return texture;
    }

    // Fetch and load image
    fetchWikiPhotoSrc(name).then((src) => {
      if (src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          imgCache.set(name, img);
          this.drawPlayerDisc(ctx, 128, 128, number, team, name, img);
          texture.needsUpdate = true;
        };
        img.src = src;
      }
    });

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

    const topTexture = this.createPlayerDiscTexture(p.number, p.team, p.name);
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

    if (p.actor) {
      const pulseGeo = new THREE.RingGeometry(discRadius * 1.15, discRadius * 1.45, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: '#38FE5E',
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.rotation.x = -Math.PI / 2;
      pulseMesh.position.y = 0.05;
      pulseMesh.name = 'actor-pulse';
      playerToken.add(pulseMesh);
    }

    this.playersGroup.add(playerToken);
    this.meshes.set(p.id, playerToken);
  }

  /**
   * Updates player position by interpolating along keyframes
   */
  public update(time: number, teamAVisible: boolean = true, teamBVisible: boolean = true): void {
    // 1. Interpolate base positions and set visibility
    const activePlayers: { id: string; x: number; z: number; team: 'attack' | 'defense' | 'defend' }[] = [];

    this.players.forEach((p, id) => {
      const mesh = this.meshes.get(id);
      if (!mesh) return;

      const pos = this.interpolatePosition(p.keyFrames, p.startPos, time);
      p.currentPos = pos;
      
      const teamVisible = p.team === 'attack' ? teamAVisible : teamBVisible;
      mesh.visible = p.visible && teamVisible;

      if (mesh.visible) {
        activePlayers.push({
          id,
          x: pos.x,
          z: pos.z,
          team: p.team
        });
      }
    });

    // 2. Resolve player icon overlaps using relaxation passes (prevent clumping)
    const minDistance = 2.4; // Prevents heavy intersection while keeping players close
    for (let iter = 0; iter < 4; iter++) {
      for (let i = 0; i < activePlayers.length; i++) {
        for (let j = i + 1; j < activePlayers.length; j++) {
          const p1 = activePlayers[i];
          const p2 = activePlayers[j];
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < minDistance) {
            const overlap = minDistance - dist;
            const ux = dist > 0.001 ? dx / dist : Math.random() > 0.5 ? 1 : -1;
            const uz = dist > 0.001 ? dz / dist : 0;
            
            const pushX = ux * overlap * 0.5;
            const pushZ = uz * overlap * 0.5;
            
            p1.x -= pushX;
            p1.z -= pushZ;
            p2.x += pushX;
            p2.z += pushZ;
          }
        }
      }
    }

    // 3. Set final relaxed positions on meshes with tiny Y height stacking to eliminate Z-fighting
    activePlayers.forEach((ap, idx) => {
      const p = this.players.get(ap.id);
      const mesh = this.meshes.get(ap.id);
      if (p && mesh) {
        p.currentPos = { x: ap.x, z: ap.z };
        
        // Attacking team has slightly different base height from defending team,
        // and each player has a tiny fraction added to guarantee no coplanar faces.
        const teamBaseY = ap.team === 'attack' ? 0.005 : 0.0;
        const stackingY = teamBaseY + idx * 0.001;
        mesh.position.set(ap.x, stackingY, ap.z);

        const pulse = mesh.getObjectByName('actor-pulse');
        if (pulse && pulse instanceof THREE.Mesh) {
          const t = performance.now() * 0.008;
          const scale = 1.0 + Math.sin(t) * 0.15;
          pulse.scale.set(scale, scale, 1.0);
          const mat = pulse.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.8 - (scale - 1.0) * 2.0;
        }
      }
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
