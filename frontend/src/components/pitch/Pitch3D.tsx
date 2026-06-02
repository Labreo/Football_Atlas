import React, { useEffect, useState } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { usePitchAnimation } from '../../hooks/usePitchAnimation';
import { usePitchEngine } from '../../hooks/usePitchEngine';
import { animationRegistry } from '../../tacticalModules';
import { DebugTools } from '../../tacticalEngine/components/DebugTools';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';


const InteractivePitchPlayer: React.FC = () => {
  const { playState, playSpeed, overlays, setPlayState, currentConcept } = useTacticalStore();

  // State values for Interactive Modules
  const [annotation, setAnnotation] = useState<string>('');
  const [phaseInfo, setPhaseInfo] = useState<{ index: number; name: string }>({ index: 1, name: 'Initial Shape' });
  const [branch, setBranch] = useState<'A' | 'B'>('A');
  const [moduleInstance, setModuleInstance] = useState<any | null>(null);

  // Hook: New generic Tactical Engine
  const { containerRef, canvasRef, engine } = usePitchEngine();

  // Dynamic Phase start timeline frames
  const PHASE_STARTS = moduleInstance?.getPhaseStarts
    ? moduleInstance.getPhaseStarts()
    : [0.0, 0.15, 0.40, 0.60, 0.75, 0.90];

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

      setModuleInstance(instance);

      // Setup visual event listeners
      instance.onAnnotationChange = (text: string) => setAnnotation(text);

      const originalOnPhaseChange = instance.onPhaseChange;
      instance.onPhaseChange = (index: number, name: string) => {
        setPhaseInfo({ index, name });
        if (originalOnPhaseChange) {
          originalOnPhaseChange(index, name);
        }
      };

      const originalOnAnalyticsEvent = instance.onAnalyticsEvent;
      instance.onAnalyticsEvent = (name: string, data: any) => {
        console.log(`[Analytics Event] ${name}:`, data);
        if (originalOnAnalyticsEvent) {
          originalOnAnalyticsEvent(name, data);
        }
      };



      // Load initial default branch for False 9
      if (currentConcept.concept_id === 'false_9' && instance.setBranch) {
        instance.setBranch(branch);
      }
    }).catch((err) => {
      console.error('[Pitch3D Orchestration Error] Failed to load animation:', err);
    });

    return () => {
      active = false;
      setModuleInstance(null);
    };
  }, [engine, currentConcept]);

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
    if (moduleInstance && moduleInstance.setBranch) {
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

      {/* 2. Interactive Branch/Scenario Selector (False 9 only) */}
      {currentConcept?.concept_id === 'false_9' && (
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
      )}



      {/* 4. DevTools HUD integration */}
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
  const isInteractive = currentConcept?.concept_id === 'false_9' || 
                        currentConcept?.concept_id === 'high_press' || 
                        currentConcept?.concept_id === 'defensive_block';

  if (isInteractive) {
    return <InteractivePitchPlayer />;
  }

  return <LegacyPitchPlayer />;
};

export default Pitch3D;

