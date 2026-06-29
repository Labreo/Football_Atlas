import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { usePitchEngine } from '../../hooks/usePitchEngine';
import { animationRegistry } from '../../tacticalModules';

import TransitionInspector from '../../tacticalEngine/components/TransitionInspector';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { animationModuleRegistry } from '../../tacticalOrchestrator/registry';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { audioCommentaryManager } from '../../audioCommentary/AudioCommentaryManager';


interface Pitch3DProps {
  cameraTrackingEnabled?: boolean;
  enableCinematicRotation?: boolean;
}

const InteractivePitchPlayer: React.FC<Pitch3DProps> = ({
  cameraTrackingEnabled = false,
  enableCinematicRotation = false,
}) => {
  const { playState, playSpeed, overlays, currentConcept, detectedLevel } = useTacticalStore();
  const { currentBreakdown } = useBreakdownStore();

  const [moduleInstance, setModuleInstance] = useState<any | null>(null);

  // Hook: New generic Tactical Engine
  const { containerRef, canvasRef, engine } = usePitchEngine({
    cameraTrackingEnabled,
    enableCinematicRotation,
  });

  // Initialize learning orchestrator and audio commentary manager with the pitch engine
  useEffect(() => {
    if (!engine) return;
    learningOrchestrator.init(engine);
    audioCommentaryManager.init(engine);
    (window as any)._tacticalEngineInstance = engine;
    return () => {
      learningOrchestrator.destroy();
      audioCommentaryManager.destroy();
      if ((window as any)._tacticalEngineInstance === engine) {
        (window as any)._tacticalEngineInstance = null;
      }
    };
  }, [engine]);

  // Setup Module lifecycle based on concept_id via the Orchestrator
  useEffect(() => {
    if (!engine || !currentConcept) return;

    let active = true;

    learningOrchestrator.loadConceptAnimation(currentConcept.concept_id).then(() => {
      if (!active) return;
      const instance = learningOrchestrator.getActiveModule();
      if (!instance) return;

      // Ensure initial level is set immediately upon load
      if (typeof instance.setComplexityLevel === 'function') {
        instance.setComplexityLevel(useTacticalStore.getState().detectedLevel);
      }

      setModuleInstance(instance);
    }).catch((err) => {
      console.error('[Pitch3D Orchestration Error] Failed to load animation:', err);
    });

    return () => {
      active = false;
      setModuleInstance(null);
    };
  }, [engine, currentConcept]);

  useEffect(() => {
    if (!moduleInstance || currentBreakdown) return;
    audioCommentaryManager.prepareConceptNarration();
  }, [moduleInstance, currentBreakdown]);

  // Synchronize complexity level from Zustand store to our active module instance
  useEffect(() => {
    if (!moduleInstance) return;
    if (typeof moduleInstance.setComplexityLevel === 'function') {
      moduleInstance.setComplexityLevel(detectedLevel);
    }
  }, [detectedLevel, moduleInstance]);

  // Synchronize playback timeline controls from Zustand store to our Engine
  useEffect(() => {
    if (!engine || !moduleInstance || currentBreakdown) return;

    if (playState === 'playing') {
      engine.play();
    } else if (playState === 'paused') {
      engine.pause();
    } else if (playState === 'stopped') {
      engine.reset();
      moduleInstance.reset();
    }
  }, [playState, engine, moduleInstance, currentBreakdown]);

  // Synchronize speed rates
  useEffect(() => {
    if (!engine) return;
    engine.setSpeed(playSpeed);
  }, [playSpeed, engine]);

  // Synchronize team visibility settings on overlays toggle
  useEffect(() => {
    if (!engine) return;
    engine.setTeamVisibility('attack', true);
    engine.setTeamVisibility('defense', true);
  }, [overlays, engine]);

  // Synchronize What-If Ghost Arrows & Corridor Polygons
  const { selectedWhatIfOption } = useBreakdownStore();
  useEffect(() => {
    if (!engine) return;
    const arrowManager = engine.getArrowManager();
    const overlayManager = engine.getOverlayManager();
    if (!arrowManager || !overlayManager) return;

    if (selectedWhatIfOption) {
      const color = selectedWhatIfOption.viable ? '#39FF14' : '#EF4444';
      const style = {
        color: color,
        width: 3.5,
        opacity: 0.9,
        curved: selectedWhatIfOption.kind === 'pass',
        dashSize: selectedWhatIfOption.viable ? undefined : 1.5,
        gapSize: selectedWhatIfOption.viable ? undefined : 1.0,
        dashSpeed: selectedWhatIfOption.viable ? undefined : 0.8
      };

      const ghostArrow = {
        id: 'whatif-ghost-arrow',
        fromPos: { x: selectedWhatIfOption.from_x, z: selectedWhatIfOption.from_z },
        toPos: { x: selectedWhatIfOption.to_x, z: selectedWhatIfOption.to_z },
        startFrame: 0.0,
        endFrame: 1.0,
        style: style
      };

      arrowManager.getArrows().set(ghostArrow.id, ghostArrow as any);

      // Real-time calculation of the passing lane corridor geometry
      const to = { x: selectedWhatIfOption.to_x, z: selectedWhatIfOption.to_z };
      const from = { x: selectedWhatIfOption.from_x, z: selectedWhatIfOption.from_z };
      const dx = to.x - from.x;
      const dz = to.z - from.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / dist;
      const nz = dx / dist;
      const width = 1.6;

      const points = [
        { x: from.x + nx * width, z: from.z + nz * width },
        { x: to.x + nx * width, z: to.z + nz * width },
        { x: to.x - nx * width, z: to.z - nz * width },
        { x: from.x - nx * width, z: from.z - nz * width }
      ];

      const overlayColor = selectedWhatIfOption.viable ? 'green' : 'red';
      const ghostOverlay = {
        id: 'whatif-ghost-lane',
        type: 'POLYGON',
        points,
        startFrame: 0.0,
        endFrame: 100.0,
        color: overlayColor,
        opacity: 0.22
      };

      const activeOverlays = Array.from(overlayManager.getOverlays().values());
      const updatedOverlays = activeOverlays.filter(o => o.id !== 'whatif-ghost-lane');
      updatedOverlays.push(ghostOverlay as any);
      overlayManager.setOverlays(updatedOverlays);

      engine.seek(engine.getTimeline().getCurrentTime());
    } else {
      arrowManager.getArrows().delete('whatif-ghost-arrow');
      const activeOverlays = Array.from(overlayManager.getOverlays().values());
      const updatedOverlays = activeOverlays.filter(o => o.id !== 'whatif-ghost-lane');
      overlayManager.setOverlays(updatedOverlays);

      engine.seek(engine.getTimeline().getCurrentTime());
    }
  }, [selectedWhatIfOption, engine]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />



      {/* Transition Inspector HUD (backtick to toggle) */}
      {process.env.NODE_ENV === 'development' && <TransitionInspector />}
    </div>
  );
};

const LegacyPitchPlayer: React.FC = () => {
  const { currentConcept, playState, playSpeed, overlays } = useTacticalStore();
  const legacyAnimation = currentConcept 
    ? animationRegistry[currentConcept.animation_module.module_id] || null 
    : null;

  const { containerRef, canvasRef } = usePitchAnimation({
    animation: legacyAnimation,
    playState,
    playSpeed,
    overlays
  });

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

const Pitch3D: React.FC<Pitch3DProps> = ({
  cameraTrackingEnabled = false,
  enableCinematicRotation = false,
}) => {
  const { currentConcept } = useTacticalStore();

  // Dynamic check — any concept with a registered animation module
  // is routed to the interactive engine. No hardcoded IDs.
  // We ALSO default to the interactive engine if there is no selected concept yet,
  // which ensures the learningOrchestrator's animation engine is initialized and ready.
  const isInteractive = !currentConcept || !!(currentConcept && 
    animationModuleRegistry.getModule(currentConcept.concept_id));

  if (isInteractive) {
    return (
      <InteractivePitchPlayer
        cameraTrackingEnabled={cameraTrackingEnabled}
        enableCinematicRotation={enableCinematicRotation}
      />
    );
  }

  return <LegacyPitchPlayer />;
};

export default Pitch3D;

