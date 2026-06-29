import * as THREE from 'three';
import { OverlayState, OverlayType } from './types';

export class OverlayManager {
  private scene: THREE.Scene;
  private overlaysGroup: THREE.Group;
  private overlays: Map<string, OverlayState> = new Map();
  private meshes: Map<string, THREE.Group> = new Map();

  // Color helper mapping descriptive names to hex codes
  private resolveColor(color: string): string {
    const table: Record<string, string> = {
      cyan: '#00F3FF',
      red: '#FF0055',
      green: '#39FF14',
      blue: '#1D4ED8',
      amber: '#FFB300',
      yellow: '#FFFF00',
      purple: '#D946EF',
      white: '#FFFFFF'
    };
    return table[color.toLowerCase()] || color;
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.overlaysGroup = new THREE.Group();
    this.overlaysGroup.name = 'tactical-overlays';
    this.scene.add(this.overlaysGroup);
  }

  /**
   * Sets up or updates the set of rendered overlays
   */
  public setOverlays(overlays: OverlayState[]): void {
    this.clear();
    overlays.forEach((o) => {
      this.overlays.set(o.id, o);
    });
  }

  /**
   * Updates overlays based on timeline time
   */
  public update(time: number): void {
    this.clearMeshes();

    this.overlays.forEach((overlay) => {
      if (time >= overlay.startFrame && time <= overlay.endFrame) {
        this.renderOverlay(overlay);
      }
    });
  }

  private renderOverlay(overlay: OverlayState): void {
    const overlayColor = this.resolveColor(overlay.color);
    const opacity = overlay.opacity !== undefined ? overlay.opacity : 0.3;
    const group = new THREE.Group();
    group.name = `overlay-${overlay.id}`;

    // Base transparent fill material
    const fillMat = new THREE.MeshBasicMaterial({
      color: overlayColor,
      transparent: true,
      opacity: opacity,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // Border line material (slightly brighter outline)
    const borderMat = new THREE.LineBasicMaterial({
      color: overlayColor,
      transparent: true,
      opacity: Math.min(1.0, opacity * 1.8),
      depthWrite: false
    });

    switch (overlay.type) {
      case OverlayType.POLYGON: {
        if (!overlay.points || overlay.points.length < 3) return;
        
        // Build Shape on XZ (mapped to XY shape coordinate system)
        const shape = new THREE.Shape();
        overlay.points.forEach((p, idx) => {
          if (idx === 0) {
            shape.moveTo(p.x, -p.z);
          } else {
            shape.lineTo(p.x, -p.z);
          }
        });
        shape.closePath();

        const geo = new THREE.ShapeGeometry(shape);
        const mesh = new THREE.Mesh(geo, fillMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.02; // slightly above pitch surface
        group.add(mesh);

        // Outline border
        const borderPoints: THREE.Vector3[] = overlay.points.map(p => new THREE.Vector3(p.x, 0.03, p.z));
        borderPoints.push(borderPoints[0].clone()); // close path
        const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const borderLine = new THREE.Line(borderGeo, borderMat);
        group.add(borderLine);
        break;
      }

      case OverlayType.RECTANGLE: {
        const bounds = overlay.bounds;
        if (!bounds) return;

        const w = bounds.width;
        const l = bounds.length;
        const center = overlay.center || { x: 0, z: 0 };
        const rotation = bounds.rotation || 0;

        const geo = new THREE.PlaneGeometry(w, l);
        const mesh = new THREE.Mesh(geo, fillMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -rotation; // maps to Y rotation in 3D pitch coordinate system
        mesh.position.set(center.x, 0.02, center.z);
        group.add(mesh);

        // Outline border
        const edges = new THREE.EdgesGeometry(geo);
        const line = new THREE.LineSegments(edges, borderMat);
        line.rotation.x = -Math.PI / 2;
        line.rotation.z = -rotation;
        line.position.set(center.x, 0.03, center.z);
        group.add(line);
        break;
      }

      case OverlayType.CIRCLE: {
        const center = overlay.center || { x: 0, z: 0 };
        const radius = overlay.radius !== undefined ? overlay.radius : 5.0;

        // Circular disk fill
        const circleGeo = new THREE.CircleGeometry(radius, 32);
        const mesh = new THREE.Mesh(circleGeo, fillMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(center.x, 0.02, center.z);
        group.add(mesh);

        // Thin outer ring border
        const ringGeo = new THREE.RingGeometry(radius - 0.15, radius, 64);
        const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
          color: overlayColor,
          transparent: true,
          opacity: Math.min(1.0, opacity * 2.2),
          side: THREE.DoubleSide,
          depthWrite: false
        }));
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(center.x, 0.03, center.z);
        group.add(ringMesh);
        break;
      }

      case OverlayType.HEAT_AREA: {
        const centerPoints = overlay.points && overlay.points.length > 0
          ? overlay.points
          : [overlay.center || { x: 0, z: 0 }];
        
        const radius = overlay.radius !== undefined ? overlay.radius : 8.0;

        // Custom GLSL Radial Falloff Shader for soft-blend premium heatmaps
        const heatShaderMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(overlayColor) },
            opacity: { value: opacity },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform vec3 color;
            uniform float opacity;
            void main() {
              float dist = distance(vUv, vec2(0.5));
              // soft exponential blending curve
              float intensity = exp(-dist * dist * 9.5);
              if (intensity < 0.01) discard;
              gl_FragColor = vec4(color, intensity * opacity);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        centerPoints.forEach((pt) => {
          const planeGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
          const heatMesh = new THREE.Mesh(planeGeo, heatShaderMat);
          heatMesh.rotation.x = -Math.PI / 2;
          heatMesh.position.set(pt.x, 0.04, pt.z);
          group.add(heatMesh);
        });
        break;
      }

      // ── TVLS: PULSE_RING ──────────────────────────────────────────────────
      // Expanding concentric rings originating from a center point.
      // Used for: PRESS_TRIGGER
      // Distinguishable by: concentric ring shape + timed expansion motion
      case OverlayType.PULSE_RING: {
        const center = overlay.center || { x: 0, z: 0 };
        const baseRadius = overlay.radius !== undefined ? overlay.radius : 5.0;
        const pulseCount = overlay.pulseCount ?? 3;
        const pulsePeriodMs = overlay.pulsePeriodMs ?? 420;
        const now = performance.now();

        for (let i = 0; i < pulseCount; i++) {
          // Each ring is phase-offset so they stagger outward
          const phaseOffset = (i / pulseCount) * pulsePeriodMs;
          const elapsed = (now + phaseOffset) % (pulsePeriodMs * pulseCount);
          const t = Math.min(1.0, elapsed / (pulsePeriodMs * pulseCount));
          const ringRadius = baseRadius * (0.2 + t * 0.8);
          const ringOpacity = opacity * (1.0 - t);

          const ringGeo = new THREE.RingGeometry(ringRadius - 0.2, ringRadius, 48);
          const ringMat = new THREE.MeshBasicMaterial({
            color: overlayColor,
            transparent: true,
            opacity: ringOpacity,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.rotation.x = -Math.PI / 2;
          ring.position.set(center.x, 0.05 + i * 0.01, center.z);
          group.add(ring);
        }
        break;
      }

      // ── TVLS: VACATED_GLOW ────────────────────────────────────────────────
      // A shimmering soft glow in a vacated area.
      // Used for: SPACE_CREATION, SPACE_EXPLOITATION (initial state)
      // Distinguishable by: slow shimmer rhythm (1.2s) + pale gold color
      case OverlayType.VACATED_GLOW: {
        const center = overlay.center || { x: 0, z: 0 };
        const radius = overlay.radius !== undefined ? overlay.radius : 7.0;
        const pulsePeriodMs = overlay.pulsePeriodMs ?? 1200;
        const t = (performance.now() % pulsePeriodMs) / pulsePeriodMs;
        // Sine shimmer: oscillates between 0.4 and 1.0 opacity
        const shimmerFactor = 0.4 + 0.6 * Math.abs(Math.sin(t * Math.PI));

        const vacatedShader = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(overlayColor) },
            opacity: { value: opacity * shimmerFactor },
          },
          vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            varying vec2 vUv;
            uniform vec3 color;
            uniform float opacity;
            void main() {
              float dist = distance(vUv, vec2(0.5));
              float intensity = smoothstep(0.5, 0.1, dist);
              if (intensity < 0.01) discard;
              gl_FragColor = vec4(color, intensity * opacity);
            }
          `,
          transparent: true,
          depthWrite: false,
          side: THREE.DoubleSide,
        });

        const planeGeo = new THREE.PlaneGeometry(radius * 2, radius * 2);
        const glowMesh = new THREE.Mesh(planeGeo, vacatedShader);
        glowMesh.rotation.x = -Math.PI / 2;
        glowMesh.position.set(center.x, 0.04, center.z);
        group.add(glowMesh);
        break;
      }

      // ── TVLS: COMPRESSION_BAND ────────────────────────────────────────────
      // A horizontal or vertical band that squeezes inward over time.
      // Used for: DEFENSIVE_COMPACTNESS
      // Distinguishable by: narrowing shape + inward motion direction
      case OverlayType.COMPRESSION_BAND: {
        const center = overlay.center || { x: 0, z: 0 };
        const bounds = overlay.bounds || { width: 40, length: 20 };
        const axis = overlay.squeezeAxis ?? 'x';
        // Squeeze: render as two edge bars that are closing in
        const compressionRatio = 0.28; // outer bars are 28% of total width

        if (axis === 'x') {
          // Two horizontal bars — top and bottom closing inward
          const barH = bounds.length * compressionRatio;
          const barW = bounds.width;
          [-1, 1].forEach((sign) => {
            const barGeo = new THREE.PlaneGeometry(barW, barH);
            const barMat = new THREE.MeshBasicMaterial({
              color: overlayColor,
              transparent: true,
              opacity: opacity * 1.4,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.rotation.x = -Math.PI / 2;
            bar.position.set(center.x, 0.03, center.z + sign * (bounds.length * 0.5 - barH * 0.5));
            group.add(bar);
          });
        } else {
          // Two vertical bars — left and right closing inward
          const barW = bounds.width * compressionRatio;
          const barH = bounds.length;
          [-1, 1].forEach((sign) => {
            const barGeo = new THREE.PlaneGeometry(barW, barH);
            const barMat = new THREE.MeshBasicMaterial({
              color: overlayColor,
              transparent: true,
              opacity: opacity * 1.4,
              side: THREE.DoubleSide,
              depthWrite: false,
            });
            const bar = new THREE.Mesh(barGeo, barMat);
            bar.rotation.x = -Math.PI / 2;
            bar.position.set(center.x + sign * (bounds.width * 0.5 - barW * 0.5), 0.03, center.z);
            group.add(bar);
          });
        }

        // Central fill at low opacity
        const fillGeo = new THREE.PlaneGeometry(bounds.width, bounds.length);
        const fillMat2 = new THREE.MeshBasicMaterial({
          color: overlayColor,
          transparent: true,
          opacity: opacity * 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const fill = new THREE.Mesh(fillGeo, fillMat2);
        fill.rotation.x = -Math.PI / 2;
        fill.position.set(center.x, 0.02, center.z);
        group.add(fill);
        break;
      }

      // ── TVLS: CONVERGING_ZONE ─────────────────────────────────────────────
      // A zone with inward-pointing vector indicators showing entrapment.
      // Used for: PRESSING_TRAP
      // Distinguishable by: inward-pointing spike shape + convergence motion
      case OverlayType.CONVERGING_ZONE: {
        const center = overlay.center || { x: 0, z: 0 };
        const radius = overlay.radius !== undefined ? overlay.radius : 9.0;

        // Draw soft central fill
        const centralGeo = new THREE.CircleGeometry(radius * 0.65, 32);
        const centralMat = new THREE.MeshBasicMaterial({
          color: overlayColor,
          transparent: true,
          opacity: opacity * 0.6,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const centralMesh = new THREE.Mesh(centralGeo, centralMat);
        centralMesh.rotation.x = -Math.PI / 2;
        centralMesh.position.set(center.x, 0.02, center.z);
        group.add(centralMesh);

        // Draw 6 inward-pointing cones (vectors converging to center)
        const coneCount = 6;
        for (let i = 0; i < coneCount; i++) {
          const angle = (i / coneCount) * Math.PI * 2;
          const cx = center.x + Math.sin(angle) * radius;
          const cz = center.z + Math.cos(angle) * radius;

          const coneGeo = new THREE.ConeGeometry(0.6, 2.2, 8);
          coneGeo.rotateX(Math.PI / 2);
          const coneMat = new THREE.MeshBasicMaterial({
            color: overlayColor,
            transparent: true,
            opacity: Math.min(1.0, opacity * 1.8),
            depthWrite: false,
          });
          const cone = new THREE.Mesh(coneGeo, coneMat);
          cone.position.set(cx, 0.08, cz);
          // Point inward toward center
          cone.rotation.y = -angle;
          group.add(cone);
        }
        break;
      }

      // ── TVLS: FLASH_BURST ─────────────────────────────────────────────────
      // An instant radial flash — possession recovered, attack starts.
      // Used for: COUNTER_ATTACK_TRIGGER
      // Distinguishable by: instant timing (150ms) + radial burst shape
      case OverlayType.FLASH_BURST: {
        const center = overlay.center || { x: 0, z: 0 };
        const radius = overlay.radius !== undefined ? overlay.radius : 8.0;
        const flashDuration = overlay.flashDurationMs ?? 150;
        const now2 = performance.now();
        const t = Math.min(1.0, (now2 % (flashDuration * 4)) / flashDuration);
        const burstOpacity = opacity * Math.max(0, 1.0 - t * 2);

        // Central bright disc
        const discGeo = new THREE.CircleGeometry(radius * 0.4, 24);
        const discMat = new THREE.MeshBasicMaterial({
          color: overlayColor,
          transparent: true,
          opacity: Math.min(1.0, burstOpacity * 1.6),
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(center.x, 0.06, center.z);
        group.add(disc);

        // Expanding outer ring
        const outerRadius = radius * (0.5 + t * 0.5);
        const outerRingGeo = new THREE.RingGeometry(outerRadius - 0.3, outerRadius, 48);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: overlayColor,
          transparent: true,
          opacity: burstOpacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.rotation.x = -Math.PI / 2;
        outerRing.position.set(center.x, 0.05, center.z);
        group.add(outerRing);
        break;
      }

      // ── TVLS: SPLIT_FIELD ─────────────────────────────────────────────────
      // A half-field color transition indicating a tactical phase change.
      // Used for: TRANSITION_MOMENT
      // Distinguishable by: split-field shape + fast bilateral color flip
      case OverlayType.SPLIT_FIELD: {
        const center = overlay.center || { x: 0, z: 0 };
        const halfWidth = 27.5; // half pitch width
        const halfLength = 20;
        const colorA = overlayColor;
        const colorB = this.resolveColor(overlay.colorSecondary ?? '#38FE5E');

        // Left half — "from" color
        const leftGeo = new THREE.PlaneGeometry(halfLength, halfWidth);
        const leftMat = new THREE.MeshBasicMaterial({
          color: colorA,
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const leftMesh = new THREE.Mesh(leftGeo, leftMat);
        leftMesh.rotation.x = -Math.PI / 2;
        leftMesh.position.set(center.x - halfLength * 0.5, 0.02, center.z);
        group.add(leftMesh);

        // Right half — "to" color
        const rightGeo = new THREE.PlaneGeometry(halfLength, halfWidth);
        const rightMat = new THREE.MeshBasicMaterial({
          color: colorB,
          transparent: true,
          opacity: opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const rightMesh = new THREE.Mesh(rightGeo, rightMat);
        rightMesh.rotation.x = -Math.PI / 2;
        rightMesh.position.set(center.x + halfLength * 0.5, 0.02, center.z);
        group.add(rightMesh);

        // Center divider line
        const divPoints = [
          new THREE.Vector3(center.x, 0.04, center.z - halfWidth * 0.5),
          new THREE.Vector3(center.x, 0.04, center.z + halfWidth * 0.5),
        ];
        const divGeo = new THREE.BufferGeometry().setFromPoints(divPoints);
        const divMat = new THREE.LineBasicMaterial({
          color: '#FFFFFF',
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
        });
        group.add(new THREE.Line(divGeo, divMat));
        break;
      }
    }

    this.overlaysGroup.add(group);
    this.meshes.set(overlay.id, group);
  }

  private clearMeshes(): void {
    while (this.overlaysGroup.children.length > 0) {
      const child = this.overlaysGroup.children[0];
      child.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line || node instanceof THREE.LineSegments) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach(m => m.dispose());
            } else {
              node.material.dispose();
            }
          }
        }
      });
      this.overlaysGroup.remove(child);
    }
    this.meshes.clear();
  }

  public getOverlays(): Map<string, OverlayState> {
    return this.overlays;
  }

  public clear(): void {
    this.clearMeshes();
    this.overlays.clear();
  }

  public destroy(): void {
    this.clear();
    this.scene.remove(this.overlaysGroup);
  }
}
