import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { animationRegistry } from '../../tacticalModules';
import PitchControls from './PitchControls';

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
    <div className="relative w-full h-full flex flex-col glass-panel rounded-2xl overflow-hidden shadow-2xl">
      {/* Active concept indicator overlay */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-pitch-border flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConcept ? 'bg-pitch-neonCyan' : 'bg-slate-500'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentConcept ? 'bg-pitch-neonCyan' : 'bg-slate-600'}`}></span>
        </span>
        <span className="font-display font-semibold text-xs tracking-wider text-slate-300 uppercase">
          {currentConcept ? `${currentConcept.concept_name} (3D Live)` : 'Stadium Pitch View'}
        </span>
      </div>

      {/* Main 3D Canvas wrapper */}
      <div ref={containerRef} className="flex-1 w-full relative min-h-[380px] bg-pitch-dark">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {!currentConcept && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs pointer-events-none">
            <p className="text-sm text-slate-400 font-display font-medium max-w-xs text-center border border-dashed border-slate-700/50 p-4 rounded-xl">
              Select a tactical concept from the side list or ask Granite to visualize an animation.
            </p>
          </div>
        )}
      </div>

      {/* Control console panel */}
      <div className="p-4 border-t border-pitch-border bg-pitch-card/90">
        <PitchControls />
      </div>
    </div>
  );
};

export default Pitch3D;
