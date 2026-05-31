import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { animationRegistry } from '../../tacticalModules';

const Pitch3D: React.FC = () => {
  const { currentConcept, playState, playSpeed, overlays } = useTacticalStore();
  
  // Resolve active animation coordinates or fallback to null
  const activeAnimation = currentConcept 
    ? animationRegistry[currentConcept.animation_module.module_id] || null 
    : null;

  const { containerRef, canvasRef } = usePitchAnimation({
    animation: activeAnimation,
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

export default Pitch3D;
