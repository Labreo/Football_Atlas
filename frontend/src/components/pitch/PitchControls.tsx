import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';

const PitchControls: React.FC = () => {
  const { 
    currentConcept, 
    playState, 
    playSpeed, 
    overlays, 
    setPlayState, 
    setPlaySpeed, 
    toggleOverlay 
  } = useTacticalStore();

  const isLoaded = !!currentConcept;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
      {/* 1. Playback State Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPlayState(playState === 'playing' ? 'paused' : 'playing')}
          disabled={!isLoaded}
          className={`flex items-center justify-center h-10 w-24 rounded-lg font-display text-sm font-semibold transition-all ${
            playState === 'playing'
              ? 'bg-pitch-neonCyan text-pitch-dark shadow-glow-cyan hover:brightness-110'
              : 'bg-pitch-surface text-slate-200 border border-pitch-border hover:bg-slate-700/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {playState === 'playing' ? '⏸ Pause' : '▶ Play'}
        </button>

        <button
          onClick={() => setPlayState('stopped')}
          disabled={!isLoaded}
          className="flex items-center justify-center h-10 w-10 rounded-lg bg-pitch-surface text-slate-400 border border-pitch-border hover:text-slate-200 hover:bg-slate-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Reset Animation"
        >
          ■
        </button>

        {/* Speed Modifiers */}
        <div className="flex items-center bg-pitch-surface border border-pitch-border rounded-lg p-0.5">
          {([0.5, 1, 1.5, 2] as const).map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaySpeed(speed)}
              disabled={!isLoaded}
              className={`px-2.5 py-1 rounded text-xs font-semibold font-display transition-all ${
                playSpeed === speed
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 2. Visual Overlay Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => toggleOverlay('passingLanes')}
          disabled={!isLoaded}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display border transition-all ${
            overlays.passingLanes
              ? 'bg-slate-800 border-pitch-neonCyan text-pitch-neonCyan shadow-[0_0_8px_rgba(0,243,255,0.15)]'
              : 'bg-pitch-surface border-pitch-border text-slate-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Passing Lanes
        </button>

        <button
          onClick={() => toggleOverlay('movementPaths')}
          disabled={!isLoaded}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display border transition-all ${
            overlays.movementPaths
              ? 'bg-slate-800 border-pitch-neonGreen text-pitch-neonGreen shadow-[0_0_8px_rgba(57,255,20,0.15)]'
              : 'bg-pitch-surface border-pitch-border text-slate-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Movement Paths
        </button>

        <button
          onClick={() => toggleOverlay('pressingZones')}
          disabled={!isLoaded}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-display border transition-all ${
            overlays.pressingZones
              ? 'bg-slate-800 border-pitch-neonRed text-pitch-neonRed shadow-[0_0_8px_rgba(255,0,85,0.15)]'
              : 'bg-pitch-surface border-pitch-border text-slate-400'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Tactical Zones
        </button>
      </div>
    </div>
  );
};

export default PitchControls;
