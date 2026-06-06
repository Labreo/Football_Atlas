import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { usePitchEngine } from '../../hooks/usePitchEngine';
import { animationRegistry } from '../../tacticalModules';
import { DebugTools } from '../../tacticalEngine/components/DebugTools';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { animationModuleRegistry } from '../../tacticalOrchestrator/registry';
import { useBreakdownStore } from '../../stores/useBreakdownStore';


const InteractivePitchPlayer: React.FC = () => {
  const { playState, playSpeed, overlays, currentConcept, detectedLevel } = useTacticalStore();
  const { currentBreakdown } = useBreakdownStore();

  const [moduleInstance, setModuleInstance] = useState<any | null>(null);

  // Hook: New generic Tactical Engine
  const { containerRef, canvasRef, engine } = usePitchEngine();

  // Initialize learning orchestrator with the pitch engine
  useEffect(() => {
    if (!engine) return;
    learningOrchestrator.init(engine);
    return () => {
      learningOrchestrator.destroy();
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

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* DevTools HUD integration */}
      <DebugTools engine={engine} moduleInstance={moduleInstance} />
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

const Pitch3D: React.FC = () => {
  const { currentConcept } = useTacticalStore();

  // Dynamic check — any concept with a registered animation module
  // is routed to the interactive engine. No hardcoded IDs.
  const isInteractive = !!(currentConcept && 
    animationModuleRegistry.getModule(currentConcept.concept_id));

  if (isInteractive) {
    return <InteractivePitchPlayer />;
  }

  return <LegacyPitchPlayer />;
};

export default Pitch3D;

