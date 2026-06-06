import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EventSignature } from './types';
import { ArrowManager } from '../tacticalEngine/arrow';
import { OverlayManager } from '../tacticalEngine/overlay';
import { useTacticalStore } from '../stores/useTacticalStore';

export const SignatureMiniDemo: React.FC<{ signature: EventSignature }> = ({ signature }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const visualMode = useTacticalStore((state) => state.visualMode);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 200;
    const height = 150;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // slate-900

    // 2. Camera setup
    const camera = new THREE.OrthographicCamera(-10, 10, 7.5, -7.5, 0.1, 100);
    camera.position.set(0, 10, 0);
    camera.lookAt(0, 0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    // 5. Draw Pitch lines (represented by a simple border)
    const pitchGeo = new THREE.PlaneGeometry(18, 13);
    const pitchMat = new THREE.MeshBasicMaterial({ color: '#1e293b', side: THREE.DoubleSide });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = -0.1;
    scene.add(pitch);

    const edges = new THREE.EdgesGeometry(pitchGeo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: '#334155' }));
    line.rotation.x = -Math.PI / 2;
    scene.add(line);

    // 6. Managers
    const arrowManager = new ArrowManager(scene);
    const overlayManager = new OverlayManager(scene);

    // 7. Load signature primitives
    if (signature.arrow) {
      arrowManager.setArrows([{
        id: 'demo-arrow',
        fromPos: { x: -6, z: 2 },
        toPos: { x: 6, z: -2 },
        style: {
          color: signature.arrow.color,
          width: signature.arrow.width,
          dashSpeed: signature.arrow.dashSpeed,
          dashSize: signature.arrow.dashSize,
          gapSize: signature.arrow.gapSize,
          curved: signature.arrow.curved,
        },
        startFrame: 0.0,
        endFrame: 1.0,
        currentProgress: 1.0,
      }]);
    }

    if (signature.stages && signature.stages.length > 0) {
      const arrowsList = signature.stages.map((stage, idx) => {
        const fraction = 1 / signature.stages!.length;
        const startFraction = idx * fraction;
        const endFraction = (idx + 1) * fraction;
        const startX = -6 + 12 * startFraction;
        const endX = -6 + 12 * endFraction;
        return {
          id: `demo-arrow-stage-${idx}`,
          fromPos: { x: startX, z: 2 - 4 * startFraction },
          toPos: { x: endX, z: 2 - 4 * endFraction },
          style: {
            color: stage.arrowStyle.color,
            width: stage.arrowStyle.width,
            dashSpeed: stage.arrowStyle.dashSpeed,
            dashSize: stage.arrowStyle.dashSize,
            gapSize: stage.arrowStyle.gapSize,
            curved: stage.arrowStyle.curved,
          },
          startFrame: startFraction,
          endFrame: endFraction,
          currentProgress: 1.0,
        };
      });
      arrowManager.setArrows(arrowsList);
    }

    if (signature.overlay) {
      overlayManager.setOverlays([{
        id: 'demo-overlay',
        type: signature.overlay.mode as any,
        center: { x: 0, z: 0 },
        radius: 4.5,
        bounds: { width: 10, length: 7, rotation: 0 },
        points: [
          { x: -5, z: -3 },
          { x: 5, z: -3 },
          { x: 3, z: 3 },
          { x: -3, z: 3 }
        ],
        startFrame: 0.0,
        endFrame: 1.0,
        color: signature.overlay.color,
        colorSecondary: signature.overlay.colorSecondary,
        opacity: signature.overlay.opacity,
        pulseCount: signature.overlay.pulseCount,
        pulsePeriodMs: signature.overlay.pulsePeriodMs,
        squeezeAxis: signature.overlay.squeezeAxis,
        flashDurationMs: signature.overlay.flashDurationMs,
      }]);
    }

    // 8. Render loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Loop progress from 0 to 1
      const progress = (now % 3000) / 3000;

      arrowManager.update(progress, dt);
      overlayManager.update(progress);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 9. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      arrowManager.destroy();
      overlayManager.destroy();
      renderer.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [signature, visualMode]);

  return <div ref={containerRef} style={{ width: '200px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }} />;
};
