import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { usePitchEngine } from '../../hooks/usePitchEngine';
import { animationRegistry } from '../../tacticalModules';
import { False9Module } from '../../tacticalModules/False9Module';
import { DebugTools } from '../../tacticalEngine/components/DebugTools';

const InteractivePitchPlayer: React.FC = () => {
  const { playState, playSpeed, overlays, setPlayState } = useTacticalStore();

  // State values for False 9 Interactive Module
  const [annotation, setAnnotation] = useState<string>('');
  const [phaseInfo, setPhaseInfo] = useState<{ index: number; name: string }>({ index: 1, name: 'Initial Shape' });
  const [branch, setBranch] = useState<'A' | 'B'>('A');
  const [moduleInstance, setModuleInstance] = useState<False9Module | null>(null);

  // Hook: New generic Tactical Engine
  const { containerRef, canvasRef, engine } = usePitchEngine();

  // Phase start timeline frames
  const PHASE_STARTS = [0.0, 0.15, 0.40, 0.60, 0.75, 0.90];

  const handlePrevPhase = () => {
    if (!engine) return;
    const t = engine.getTimeline().getCurrentTime();
    const idx = phaseInfo.index - 1;

    setPlayState('paused');

    const currentStart = PHASE_STARTS[idx];
    if (t > currentStart + 0.03) {
      engine.seek(currentStart);
    } else if (idx > 0) {
      engine.seek(PHASE_STARTS[idx - 1]);
    } else {
      engine.seek(0.0);
    }
  };

  const handleNextPhase = () => {
    if (!engine) return;
    const idx = phaseInfo.index - 1;

    setPlayState('paused');

    if (idx < PHASE_STARTS.length - 1) {
      engine.seek(PHASE_STARTS[idx + 1]);
    } else {
      engine.seek(0.0);
    }
  };

  // Setup False9Module lifecycle
  useEffect(() => {
    if (!engine) return;

    const f9 = new False9Module();
    f9.init(engine);
    setModuleInstance(f9);

    // Setup visual event listeners
    f9.onAnnotationChange = (text) => setAnnotation(text);
    f9.onPhaseChange = (index, name) => setPhaseInfo({ index, name });
    f9.onAnalyticsEvent = (name, data) => {
      console.log(`[Analytics Event] ${name}:`, data);
    };

    // Load initial default branch
    f9.setBranch(branch);

    return () => {
      f9.destroy();
      setModuleInstance(null);
    };
  }, [engine]);

  // Synchronize playback timeline controls from Zustand store to our Engine
  useEffect(() => {
    if (!engine || !moduleInstance) return;

    if (playState === 'playing') {
      engine.play();
    } else if (playState === 'paused') {
      engine.pause();
    } else if (playState === 'stopped') {
      engine.reset();
      moduleInstance.reset();
    }
  }, [playState, engine, moduleInstance]);

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

  const handleBranchChange = (newBranch: 'A' | 'B') => {
    setBranch(newBranch);
    if (moduleInstance) {
      moduleInstance.setBranch(newBranch);
      // Force sync playState to resume playback if timeline reset paused it
      if (playState === 'playing') {
        engine?.play();
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-transparent overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* 1. Subtitles / Instructional Annotations Overlay */}
      {annotation && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-10">
          <div className="bg-[#0B0F19]/85 backdrop-blur-md border border-[#23324C]/60 px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4 text-center">
            
            {/* Prev Phase Button */}
            <button
              onClick={handlePrevPhase}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors pointer-events-auto shrink-0"
              title="Previous Phase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Central Subtitle Info */}
            <div className="flex-1 flex flex-col items-center gap-1 select-none">
              <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#10B981] font-mono">
                Phase {phaseInfo.index} : {phaseInfo.name}
              </span>
              <p className="text-xs text-slate-100 leading-relaxed font-sans font-medium">
                {annotation}
              </p>
            </div>

            {/* Next Phase Button */}
            <button
              onClick={handleNextPhase}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors pointer-events-auto shrink-0"
              title="Next Phase"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

          </div>
        </div>
      )}

      {/* 2. Interactive Branch/Scenario Selector */}
      <div className="absolute top-4 right-4 z-20 flex bg-[#0B0F19]/90 border border-[#23324C]/60 p-1 rounded-xl shadow-xl backdrop-blur-md items-center gap-1 font-sans">
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 px-2 select-none">
          Defensive Reaction:
        </span>
        <button
          onClick={() => handleBranchChange('A')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            branch === 'A'
              ? 'bg-[#FF0055]/15 text-[#FF0055] border border-[#FF0055]/30 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          CB Follows (Gap)
        </button>
        <button
          onClick={() => handleBranchChange('B')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
            branch === 'B'
              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md'
              : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-slate-800/40'
          }`}
        >
          CB Holds (Free)
        </button>
      </div>

      {/* 3. DevTools HUD integration */}
      <DebugTools engine={engine} />
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
  const isFalse9 = currentConcept?.concept_id === 'false_9';

  if (isFalse9) {
    return <InteractivePitchPlayer />;
  }

  return <LegacyPitchPlayer />;
};

export default Pitch3D;
