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
            shape.moveTo(p.x, p.z);
          } else {
            shape.lineTo(p.x, p.z);
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
