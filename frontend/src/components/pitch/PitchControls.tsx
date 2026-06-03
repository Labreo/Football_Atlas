import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useLearningUIStore } from '../../stores/LearningUIStore';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';

const PitchControls: React.FC = () => {
  const { 
    currentConcept, 
    playState, 
    playSpeed, 
    overlays, 
    setPlayState, 
    setPlaySpeed, 
    toggleOverlay,
    cameraZoom,
    setCameraZoom
  } = useTacticalStore();

  const { current_phase_index } = useLearningUIStore();
  const isLoaded = !!currentConcept;

  const activeModule = learningOrchestrator.getActiveModule();
  const phases = activeModule ? activeModule.getPhases() : [];

  return (
    <div className="flex flex-col gap-4 select-none w-full">
      {/* 1. Stop-Motion Phase Navigation Timeline */}
      {isLoaded && phases.length > 0 && (
        <div className="flex items-center gap-2 border-b border-[#1E293B]/45 pb-3">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest shrink-0">
            Timeline Steps:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {phases.map((p: any) => (
              <button
                key={p.index}
                onClick={() => {
                  learningOrchestrator.seek(p.start);
                  setPlayState('paused'); // Pause to allow stop-motion inspection
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all border ${
                  current_phase_index === p.index
                    ? 'bg-[#10B981]/25 border-[#10B981] text-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-[#111622] border-[#222E45]/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
                title={p.description}
              >
                Phase {p.index}: {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. Main Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Playback Controls & Speed Group */}
        <div className="flex items-center gap-3 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl p-1.5 shrink-0">
          <button
            onClick={() => setPlayState(playState === 'playing' ? 'paused' : 'playing')}
            disabled={!isLoaded}
            className={`flex items-center justify-center h-8 px-4 rounded-lg font-display text-xs font-bold transition-all ${
              playState === 'playing'
                ? 'bg-[#00F3FF] text-[#090D14] shadow-[0_0_12px_rgba(0,243,255,0.25)] hover:brightness-110'
                : 'bg-[#182235] text-slate-200 hover:bg-[#222E45]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {playState === 'playing' ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            onClick={() => setPlayState('stopped')}
            disabled={!isLoaded}
            className="flex items-center justify-center h-8 w-8 rounded-lg bg-[#182235] text-slate-400 hover:text-slate-200 hover:bg-[#222E45] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Reset Animation"
          >
            ■
          </button>

          <div className="h-4 w-[1px] bg-[#222E45]/60" />

          {/* Speed Modifiers */}
          <div className="flex items-center gap-1">
            {([0.5, 1, 1.5, 2] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                disabled={!isLoaded}
                className={`h-7 px-2.5 rounded text-[11px] font-bold transition-all ${
                  playSpeed === speed
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Camera Zoom Control Slider (Always active/accessible) */}
        <div className="flex items-center gap-2.5 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl h-11 px-3.5 shrink-0">
          <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest">Zoom</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={cameraZoom}
            onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
            className="horizontal-zoom-slider"
          />
          <span className="text-[10px] text-[#10B981] font-mono w-8 text-right font-extrabold">
            {cameraZoom.toFixed(2)}x
          </span>
        </div>

        {/* Visual Overlay Toggles */}
        <div className="flex items-center gap-2 bg-[#111622]/85 border border-[#222E45]/40 rounded-xl p-1.5 shrink-0">
          <button
            onClick={() => toggleOverlay('passingLanes')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.passingLanes
                ? 'bg-slate-800 border-[#00F3FF] text-[#00F3FF] shadow-[0_0_8px_rgba(0,243,255,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Passing Lanes
          </button>

          <button
            onClick={() => toggleOverlay('movementPaths')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.movementPaths
                ? 'bg-slate-800 border-[#39FF14] text-[#39FF14] shadow-[0_0_8px_rgba(57,255,20,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Movement Paths
          </button>

          <button
            onClick={() => toggleOverlay('pressingZones')}
            disabled={!isLoaded}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
              overlays.pressingZones
                ? 'bg-slate-800 border-[#FF0055] text-[#FF0055] shadow-[0_0_8px_rgba(255,0,85,0.15)]'
                : 'bg-[#182235] border-transparent text-slate-400 hover:text-slate-200'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Tactical Zones
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchControls;
