import React, { useEffect, useState } from 'react';
import { TacticalAnimationEngine } from '../engine';
import { EngineTelemetry } from '../types';

interface DebugToolsProps {
  engine: TacticalAnimationEngine | null;
}

export const DebugTools: React.FC<DebugToolsProps> = ({ engine }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<EngineTelemetry>({
    fps: 0,
    activePlayers: 0,
    activeArrows: 0,
    activeOverlays: 0,
    currentTime: 0.0,
    isPlaying: false
  });
  
  // Re-sync states for controls
  const [speed, setSpeed] = useState(1.0);
  const [selectedTab, setSelectedTab] = useState<'telemetry' | 'players' | 'entities'>('telemetry');

  useEffect(() => {
    if (!engine) return;

    // Subscribe to engine telemetry events
    const unsubscribe = engine.subscribeTelemetry((tel) => {
      setTelemetry({ ...tel });
    });

    return () => {
      unsubscribe();
    };
  }, [engine]);

  if (!engine) return null;

  const handlePlayPause = () => {
    if (telemetry.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    engine.seek(val);
  };

  const handleSpeedChange = (newSpeed: number) => {
    engine.setSpeed(newSpeed);
    setSpeed(newSpeed);
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-400';
    if (fps >= 40) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="absolute bottom-6 left-6 z-50 flex flex-col items-start font-mono select-none">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider shadow-lg transition-all duration-200 border ${
          isOpen
            ? 'bg-rose-500/25 border-rose-500/50 text-rose-200 hover:bg-rose-500/40'
            : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-rose-400 animate-pulse' : 'bg-slate-400'}`} />
        {isOpen ? 'Close Engine Debug' : 'Engine Debug HUD'}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="mt-3 w-80 bg-slate-950/90 border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col text-slate-200 text-xs">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/85 border-b border-slate-800/85 flex items-center justify-between">
            <span className="font-bold text-slate-100 uppercase tracking-widest text-[10px]">Animation Telemetry</span>
            <span className={`font-bold ${getFpsColor(telemetry.fps)}`}>
              {telemetry.fps} FPS
            </span>
          </div>

          {/* Timeline Scrub Controller */}
          <div className="p-4 border-b border-slate-900 flex flex-col gap-2 bg-slate-900/40">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>TIMELINE SCRUB</span>
              <span className="text-sky-400 font-bold">{(telemetry.currentTime * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={telemetry.currentTime}
              onChange={handleScrub}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            
            {/* Playback Buttons */}
            <div className="flex gap-2 mt-1">
              <button
                onClick={handlePlayPause}
                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700/50 rounded transition-colors text-[10px]"
              >
                {telemetry.isPlaying ? 'PAUSE' : 'PLAY'}
              </button>
              <button
                onClick={() => engine.reset()}
                className="px-2 py-1 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-700/40 rounded transition-colors text-[10px]"
              >
                RESET
              </button>
              <button
                onClick={() => engine.restart()}
                className="px-2 py-1 bg-slate-850 hover:bg-slate-800 active:bg-slate-900 border border-slate-700/40 rounded transition-colors text-[10px]"
              >
                RESTART
              </button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex gap-1 justify-between mt-1.5 text-[9px] text-slate-400">
              <span>SPEED:</span>
              <div className="flex gap-1.5">
                {[0.5, 1.0, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-1.5 rounded transition-all ${
                      speed === s 
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30' 
                        : 'hover:text-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-900 bg-slate-900/50 text-[10px] text-center">
            {(['telemetry', 'players', 'entities'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`flex-1 py-1.5 border-b-2 font-bold uppercase transition-all ${
                  selectedTab === tab
                    ? 'border-sky-500 text-sky-400 bg-slate-950'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Scrollable Details Panel */}
          <div className="p-3 max-h-56 overflow-y-auto space-y-2.5">
            {/* Tab: Telemetry Stats */}
            {selectedTab === 'telemetry' && (
              <div className="space-y-1.5">
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Active Players</span>
                  <span className="text-slate-100 font-bold">{telemetry.activePlayers} / 22</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Active Arrows</span>
                  <span className="text-slate-100 font-bold">{telemetry.activeArrows}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Active Overlays</span>
                  <span className="text-slate-100 font-bold">{telemetry.activeOverlays}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Time Index</span>
                  <span className="text-slate-100 font-bold">{telemetry.currentTime.toFixed(4)}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400">Ball Translation</span>
                  <span className="text-slate-100 font-bold">
                    {engine.getBallPosition().x.toFixed(1)}, {engine.getBallPosition().y.toFixed(1)}, {engine.getBallPosition().z.toFixed(1)}
                  </span>
                </div>
              </div>
            )}

            {/* Tab: Players Grid */}
            {selectedTab === 'players' && (
              <div className="space-y-1 text-[10px]">
                {Array.from(engine.getPlayerManager().getPlayers().values()).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-0.5 border-b border-slate-900/50">
                    <div className="flex gap-1.5 items-center">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.team === 'attack' ? 'bg-blue-500' : 'bg-red-500'}`} />
                      <span className="text-slate-300 font-bold">#{p.number}</span>
                      <span className="text-slate-400 truncate max-w-[80px]">{p.role}</span>
                    </div>
                    <span className="text-sky-300">
                      [{p.currentPos.x.toFixed(1)}, {p.currentPos.z.toFixed(1)}]
                    </span>
                  </div>
                ))}
                {engine.getPlayerManager().getPlayers().size === 0 && (
                  <div className="text-center text-slate-500 py-3">No active players loaded</div>
                )}
              </div>
            )}

            {/* Tab: General Entities list */}
            {selectedTab === 'entities' && (
              <div className="space-y-2">
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1">Active Tactical Arrows</h4>
                  <div className="space-y-1">
                    {Array.from(engine.getArrowManager().getArrows().values())
                      .filter(a => telemetry.currentTime >= a.startFrame && telemetry.currentTime <= a.endFrame)
                      .map((a) => (
                        <div key={a.id} className="flex justify-between text-[10px] bg-slate-900/40 p-1 rounded border border-slate-900">
                          <span className="text-emerald-400 truncate max-w-[120px]">{a.id}</span>
                          <span className="text-slate-400 font-bold">{(a.currentProgress * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    {Array.from(engine.getArrowManager().getArrows().values())
                      .filter(a => telemetry.currentTime >= a.startFrame && telemetry.currentTime <= a.endFrame)
                      .length === 0 && (
                      <div className="text-[9px] text-slate-600">No active arrows inside frame</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1">Active Spatial Overlays</h4>
                  <div className="space-y-1">
                    {Array.from(engine.getOverlayManager().getOverlays().values())
                      .filter(o => telemetry.currentTime >= o.startFrame && telemetry.currentTime <= o.endFrame)
                      .map((o) => (
                        <div key={o.id} className="flex justify-between text-[10px] bg-slate-900/40 p-1 rounded border border-slate-900">
                          <span className="text-cyan-400 truncate max-w-[150px]">{o.id}</span>
                          <span className="text-slate-400 text-[9px]">{o.type}</span>
                        </div>
                      ))}
                    {Array.from(engine.getOverlayManager().getOverlays().values())
                      .filter(o => telemetry.currentTime >= o.startFrame && telemetry.currentTime <= o.endFrame)
                      .length === 0 && (
                      <div className="text-[9px] text-slate-600">No active overlays inside frame</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
