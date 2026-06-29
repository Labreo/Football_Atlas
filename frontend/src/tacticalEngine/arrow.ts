import * as THREE from 'three';
import { ArrowState } from './types';

export class ArrowManager {
  private scene: THREE.Scene;
  private arrowsGroup: THREE.Group;
  private arrows: Map<string, ArrowState> = new Map();
  private meshes: Map<string, THREE.Group> = new Map();
  private dashOffset: number = 0.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.arrowsGroup = new THREE.Group();
    this.arrowsGroup.name = 'tactical-arrows';
    this.scene.add(this.arrowsGroup);
  }

  /**
   * Sets up or updates the set of rendered arrows
   */
  public setArrows(arrows: ArrowState[]): void {
    this.clear();
    arrows.forEach((a) => {
      this.arrows.set(a.id, a);
    });
  }

  /**
   * Updates all arrows based on the current timeline progress
   */
  public update(time: number, deltaTime: number): void {
    // Increment dash offset for moving dashes
    this.dashOffset -= deltaTime * 12.0;

    // Clear meshes from the group, we will rebuild active ones
    // To achieve high performance, we dispose and rebuild only active ones,
    // or keep a pool. Since arrows are dynamic and rebuilds are simple,
    // we can dispose and reconstruct active ones on demand.
    this.clearMeshes();

    this.arrows.forEach((arrow) => {
      if (time < arrow.startFrame || time > arrow.endFrame) {
        return; // Invisible outside frame range
      }

      // Calculate progress of expansion (0.0 to 1.0)
      const duration = arrow.endFrame - arrow.startFrame;
      let progress = duration > 0 
        ? Math.min(1.0, (time - arrow.startFrame) / duration)
        : 1.0;

      // Force match moment arrows to be fully drawn (visible trajectory immediately)
      if (
        arrow.id === 'main-action-arrow' || 
        arrow.id === 'whatif-ghost-arrow' || 
        arrow.id === 'movement-run-path' || 
        arrow.id.startsWith('lane-')
      ) {
        progress = 1.0;
      }

      arrow.currentProgress = progress;
      if (progress <= 0) return;

      this.renderArrow(arrow, progress);
    });
  }

  private renderArrow(arrow: ArrowState, progress: number): void {
    const arrowGroup = new THREE.Group();
    arrowGroup.name = `arrow-${arrow.id}`;

    // 1. Generate path points
    const points: THREE.Vector3[] = [];
    const height = 0.4;
    
    if (arrow.points && arrow.points.length > 0) {
      // Use predefined path points
      arrow.points.forEach(p => points.push(new THREE.Vector3(p.x, height, p.z)));
    } else if (arrow.style.curved) {
      // Generate a curved arc perpendicular to the straight line direction
      const start = new THREE.Vector3(arrow.fromPos.x, height, arrow.fromPos.z);
      const end = new THREE.Vector3(arrow.toPos.x, height, arrow.toPos.z);
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      
      const dir = new THREE.Vector3().subVectors(end, start);
      const len = dir.length();
      
      // Calculate perpendicular horizontal vector
      const perp = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
      // Offset midpoint horizontally (18%) and vertically (15%) for a beautiful 3D trajectory
      mid.addScaledVector(perp, len * 0.18);
      mid.y = height + len * 0.12;

      points.push(start, mid, end);
    } else {
      // Straight path
      points.push(
        new THREE.Vector3(arrow.fromPos.x, height, arrow.fromPos.z),
        new THREE.Vector3(arrow.toPos.x, height, arrow.toPos.z)
      );
    }

    if (points.length < 2) return;

    // Create curve
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    
    // Sample points up to the current progress fraction
    const rawPoints = curve.getPoints(100); // Full curve
    
    // Get sub-points representing progress
    const subPoints: THREE.Vector3[] = [];
    const targetLength = curve.getLength() * progress;
    
    let currentLength = 0;
    subPoints.push(rawPoints[0].clone());
    for (let i = 1; i < rawPoints.length; i++) {
      const dist = rawPoints[i].distanceTo(rawPoints[i - 1]);
      if (currentLength + dist >= targetLength) {
        // Interpolate final point
        const ratio = (targetLength - currentLength) / dist;
        const finalPt = new THREE.Vector3().lerpVectors(rawPoints[i - 1], rawPoints[i], ratio);
        subPoints.push(finalPt);
        break;
      }
      subPoints.push(rawPoints[i].clone());
      currentLength += dist;
    }

    if (subPoints.length < 2) return;

    // 2. Create line mesh
    const isDashed = arrow.style.dashSize !== undefined || arrow.style.dashSpeed !== undefined;
    let lineObj: THREE.Object3D;

    if (arrow.style.curved) {
      // Create a premium 3D volumetric tube geometry for curved trajectories (e.g. goals/passes)
      // This overcomes WebGL 1px line limits and creates an incredibly sleek, premium look.
      const progressCurve = new THREE.CatmullRomCurve3(subPoints, false, 'centripetal');
      // Thicken based on style.width
      const tubeRadius = (arrow.style.width || 3.5) * 0.08;
      const tubeGeo = new THREE.TubeGeometry(progressCurve, 64, tubeRadius, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: arrow.style.color,
        transparent: true,
        opacity: arrow.style.opacity !== undefined ? arrow.style.opacity : 0.85,
        depthWrite: true
      });
      lineObj = new THREE.Mesh(tubeGeo, tubeMat);
    } else {
      const curveGeo = new THREE.BufferGeometry().setFromPoints(subPoints);
      let lineMat: THREE.Material;

      if (isDashed) {
        const dashSize = arrow.style.dashSize || 1.5;
        const gapSize = arrow.style.gapSize || 1.0;
        const speed = arrow.style.dashSpeed || 1.0;
        
        // Dynamic moving dash shader material
        lineMat = new THREE.ShaderMaterial({
          uniforms: {
            color: { value: new THREE.Color(arrow.style.color) },
            dashSize: { value: dashSize },
            gapSize: { value: gapSize },
            dashOffset: { value: this.dashOffset * speed },
            opacity: { value: arrow.style.opacity !== undefined ? arrow.style.opacity : 0.95 }
          },
          vertexShader: `
            attribute float lineDistance;
            varying float vLineDistance;
            void main() {
              vLineDistance = lineDistance;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color;
            uniform float dashSize;
            uniform float gapSize;
            uniform float dashOffset;
            uniform float opacity;
            varying float vLineDistance;
            void main() {
              float totalSize = dashSize + gapSize;
              float d = mod(vLineDistance + dashOffset, totalSize);
              if (d > dashSize) {
                discard;
              }
              gl_FragColor = vec4(color, opacity);
            }
          `,
          transparent: true,
          depthWrite: false
        });
      } else {
        lineMat = new THREE.LineBasicMaterial({
          color: arrow.style.color,
          linewidth: arrow.style.width || 3,
          transparent: true,
          opacity: arrow.style.opacity !== undefined ? arrow.style.opacity : 0.85,
          depthWrite: false
        });
      }

      const line = new THREE.Line(curveGeo, lineMat);
      if (isDashed) {
        line.computeLineDistances();
      }
      lineObj = line;
    }

    arrowGroup.add(lineObj);

    // 3. Render arrowhead cone at the end coordinates pointing along the tangent vector
    const endPoint = subPoints[subPoints.length - 1];
    const tangentPoint = progress > 0.05 ? progress - 0.01 : progress;
    const tangent = curve.getTangentAt(tangentPoint).normalize();

    const headLength = 1.3 + (arrow.style.width * 0.1);
    const headWidth = 0.7 + (arrow.style.width * 0.05);

    const arrowHeadGeo = new THREE.ConeGeometry(headWidth, headLength, 12);
    // Rotate cone to point along the line rather than vertically
    arrowHeadGeo.rotateX(Math.PI / 2); 

    const arrowHeadMat = new THREE.MeshBasicMaterial({
      color: arrow.style.color,
      transparent: true,
      opacity: arrow.style.opacity !== undefined ? arrow.style.opacity : 0.9,
      depthWrite: true
    });

    const arrowHead = new THREE.Mesh(arrowHeadGeo, arrowHeadMat);
    arrowHead.position.copy(endPoint);
    
    // Set rotation to face the direction vector
    const direction = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
    const angle = Math.atan2(direction.x, direction.z);
    arrowHead.rotation.y = angle;

    arrowGroup.add(arrowHead);

    this.arrowsGroup.add(arrowGroup);
    this.meshes.set(arrow.id, arrowGroup);
  }

  private clearMeshes(): void {
    while (this.arrowsGroup.children.length > 0) {
      const child = this.arrowsGroup.children[0];
      child.traverse((node) => {
        if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
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
      this.arrowsGroup.remove(child);
    }
    this.meshes.clear();
  }

  public getArrows(): Map<string, ArrowState> {
    return this.arrows;
  }

  public clear(): void {
    this.clearMeshes();
    this.arrows.clear();
  }

  public destroy(): void {
    this.clear();
    this.scene.remove(this.arrowsGroup);
  }
}
