import React, { useEffect, useState } from 'react';
import { TacticalAnimationEngine } from '../engine';
import { EngineTelemetry } from '../types';
import { useOrchestratorStore } from '../../tacticalOrchestrator/store';
import { useTacticalStore } from '../../stores/useTacticalStore';


interface DebugToolsProps {
  engine: TacticalAnimationEngine | null;
  moduleInstance?: any;
}

export const DebugTools: React.FC<DebugToolsProps> = ({ engine, moduleInstance }) => {
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
  const [selectedTab, setSelectedTab] = useState<'telemetry' | 'players' | 'entities' | 'orchestrator' | 'mcp'>('telemetry');
  const [mcpTools, setMcpTools] = useState<Array<{ name: string; description: string; inputSchema: any }>>([]);

  const mcpToolChain = useOrchestratorStore((state) => state.mcpToolChain);

  useEffect(() => {
    const apiHost = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_HOST || '';
    const mcpUrl = apiHost ? `${apiHost.replace(/\/$/, '')}/api/tactical/mcp/tools` : '/api/tactical/mcp/tools';
    fetch(mcpUrl)
      .then(res => res.json())
      .then(data => setMcpTools(data))
      .catch(err => console.error('Failed to fetch MCP tools:', err));
  }, []);

  const orchTelemetry = useOrchestratorStore((state) => state.telemetry);
  const conversationHistory = useTacticalStore((state) => state.conversation);

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
    <div className="absolute top-4 right-40 z-50 flex flex-col items-end font-mono select-none">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider shadow-lg transition-all duration-200 border ${
          isOpen
            ? 'bg-rose-500/25 border-rose-500/50 text-rose-200 hover:bg-rose-500/40'
            : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:bg-slate-800'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-rose-400 animate-pulse' : 'bg-slate-400'}`} />
        {isOpen ? 'Close Engine Debug' : 'Engine Debug HUD'}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="mt-3 w-[350px] bg-slate-950/90 border border-slate-800/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col text-slate-200 text-xs text-left">
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
          <div className="flex border-b border-slate-900 bg-slate-900/50 text-[9px] text-center">
            {(['telemetry', 'players', 'entities', 'orchestrator', 'mcp'] as const).map((tab) => (
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
                {moduleInstance && typeof moduleInstance.getDebugMetrics === 'function' && (
                  <div className="mt-3 pt-2.5 border-t border-[#23324C]/60 space-y-1.5 font-mono">
                    <h4 className="text-[9px] font-bold text-[#00F3FF] uppercase tracking-wider mb-1">Tactical Metrics</h4>
                    {Object.entries(moduleInstance.getDebugMetrics(telemetry.currentTime)).map(([key, val]: any) => (
                      <div key={key} className="flex justify-between border-b border-slate-900/50 pb-0.5 last:border-b-0">
                        <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-slate-100 font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Tab: Orchestrator panel */}
            {selectedTab === 'orchestrator' && (
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Session State</span>
                  <span className="text-emerald-400 font-bold uppercase">{orchTelemetry.sessionState}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Active Concept</span>
                  <span className="text-slate-100 font-bold">{orchTelemetry.activeConceptId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Confidence Score</span>
                  <span className="text-slate-100 font-bold">{(orchTelemetry.confidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Loaded Module</span>
                  <span className="text-slate-100 font-bold">{orchTelemetry.loadedModuleId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Granite Latency</span>
                  <span className="text-slate-100 font-bold">{orchTelemetry.graniteLatencyMs} ms</span>
                </div>
                <div className="flex justify-between border-b border-slate-900/80 pb-1">
                  <span className="text-slate-400">Animation Latency</span>
                  <span className="text-slate-100 font-bold">{orchTelemetry.animationLatencyMs} ms</span>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-900">
                  <span className="text-slate-400 block mb-1.5 uppercase tracking-wider font-bold text-[9px]">Conversation History</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {conversationHistory.map((turn, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-900/50 border border-slate-900/80 text-[9.5px] leading-relaxed">
                        <span className={`font-bold ${turn.role === 'user' ? 'text-sky-400' : 'text-emerald-400'}`}>
                          {turn.role.toUpperCase()}:
                        </span>{' '}
                        <span className="text-slate-300">{turn.content}</span>
                      </div>
                    ))}
                    {conversationHistory.length === 0 && (
                      <div className="text-slate-600 text-center py-2">No conversation history</div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Tab: MCP Tools */}
            {selectedTab === 'mcp' && (
              <div className="space-y-3 text-[10px]">
                {/* Server Status */}
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">MCP Gateway:</span>
                    <span className="text-[#10B981] font-bold">Context Forge</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">MCP Server:</span>
                    <span className="text-sky-400 font-bold font-mono">FootballAtlasMCPServer</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CONNECTED
                    </span>
                  </div>
                </div>

                {/* Tool Invocations Timeline */}
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Tool Invocations</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {mcpToolChain?.map((inv, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sky-300 font-bold font-mono">{inv.tool_name}</span>
                          <span className={`px-1 rounded text-[8px] font-bold font-mono ${
                            inv.status === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                            inv.status === 'failure' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                            'bg-blue-950 text-blue-400 border border-blue-500/30 animate-pulse'
                          }`}>
                            {inv.status.toUpperCase()} ({inv.latency_ms}ms)
                          </span>
                        </div>
                        <div className="text-[8.5px] text-slate-500 font-mono">
                          Args: {JSON.stringify(inv.arguments)}
                        </div>
                        {inv.error_message && (
                          <div className="text-[8.5px] text-red-400 font-mono bg-red-950/20 p-1 rounded border border-red-900/30">
                            Error: {inv.error_message}
                          </div>
                        )}
                      </div>
                    ))}
                    {(!mcpToolChain || mcpToolChain.length === 0) && (
                      <div className="text-slate-600 text-center py-3">No tools invoked yet in this session.</div>
                    )}
                  </div>
                </div>

                {/* Registered Tools */}
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Registered Tools ({mcpTools.length})</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {mcpTools.map((t) => (
                      <div key={t.name} className="p-1.5 rounded bg-slate-900/50 border border-slate-800/80 space-y-1">
                        <div className="font-bold text-slate-200 font-mono">{t.name}</div>
                        <div className="text-slate-400 text-[9px] font-sans leading-relaxed">{t.description}</div>
                      </div>
                    ))}
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
