import React, { useState, useEffect } from 'react';
import { animationModuleRegistry } from '../../tacticalOrchestrator/registry';
import { PRIMITIVE_STYLE_CONFIG } from '../../tacticalPrimitives/config';

interface PrimitiveItem {
  name: string;
  category: string;
  description: string;
  params: string[];
}

const PRIMITIVE_CATALOG: PrimitiveItem[] = [
  // Player Movement
  { name: 'MovePlayer', category: 'Player Movement', description: 'Moves a player to target coordinates over a time interval.', params: ['playerId', 'targetPos', 'startTime', 'endTime', 'easing'] },
  { name: 'MoveGroup', category: 'Player Movement', description: 'Shifts a group of players concurrently by an offset.', params: ['playerIds', 'offset', 'startTime', 'endTime', 'easing'] },
  { name: 'DropDeep', category: 'Player Movement', description: 'Drops a player deep towards their own goal line.', params: ['playerId', 'distance', 'startTime', 'endTime', 'easing'] },
  { name: 'PushForward', category: 'Player Movement', description: 'Pushes a player forward towards the opponent goal line.', params: ['playerId', 'distance', 'startTime', 'endTime', 'easing'] },
  { name: 'Overlap', category: 'Player Movement', description: 'Runs a fullback around a winger along the outside flank.', params: ['fullbackId', 'wingerId', 'startTime', 'endTime', 'distance', 'easing'] },
  { name: 'Underlap', category: 'Player Movement', description: 'Runs a fullback inside a winger towards the central corridor.', params: ['fullbackId', 'wingerId', 'startTime', 'endTime', 'distance', 'easing'] },
  { name: 'RotatePositions', category: 'Player Movement', description: 'Rotates positions cyclically among a group of players.', params: ['playerIds', 'startTime', 'endTime', 'easing'] },
  { name: 'ShiftBlock', category: 'Player Movement', description: 'Shifts the entire defensive/midfield block collectively.', params: ['team', 'offset', 'startTime', 'endTime', 'easing'] },
  { name: 'CompressShape', category: 'Player Movement', description: 'Compresses a team block layout closer to their centroid.', params: ['team', 'startTime', 'endTime', 'factor', 'customCentroid', 'easing'] },
  { name: 'ExpandShape', category: 'Player Movement', description: 'Expands a team block layout away from their centroid.', params: ['team', 'startTime', 'endTime', 'factor', 'customCentroid', 'easing'] },
  { name: 'TriggerRun', category: 'Player Movement', description: 'Semantic run showing a sudden forward sprint.', params: ['playerId', 'targetPos', 'startTime', 'endTime', 'easing'] },
  { name: 'SupportRun', category: 'Player Movement', description: 'Semantic run moving to support a ball carrier.', params: ['playerId', 'targetPos', 'startTime', 'endTime', 'easing'] },
  { name: 'RecoveryRun', category: 'Player Movement', description: 'Semantic recovery sprint back to defensive position.', params: ['playerId', 'targetPos', 'startTime', 'endTime', 'easing'] },
  
  // Spatial Highlights
  { name: 'HighlightZone', category: 'Spatial Highlight', description: 'Draws a circle, rectangle, or polygon highlight overlay.', params: ['id', 'overlayType', 'options', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightHalfSpace', category: 'Spatial Highlight', description: 'Highlights Left or Right half-spaces in the final third.', params: ['side', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightChannel', category: 'Spatial Highlight', description: 'Highlights vertical channels (wings, center, half-spaces).', params: ['channel', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightDangerZone', category: 'Spatial Highlight', description: 'Highlights Zone 14 / central danger area.', params: ['startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightPassingLane', category: 'Spatial Highlight', description: 'Highlights passing corridor between two players.', params: ['fromPlayerId', 'toPlayerId', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightPressingArea', category: 'Spatial Highlight', description: 'Highlights pressing circle around ball or player.', params: ['center', 'radius', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightCompactness', category: 'Spatial Highlight', description: 'Draws dynamic convex shape enclosing a team block.', params: ['team', 'startTime', 'endTime', 'color', 'opacity'] },
  { name: 'HighlightNumericalAdvantage', category: 'Spatial Highlight', description: 'Highlights circles indicating positional overloads.', params: ['center', 'radius', 'startTime', 'endTime', 'color', 'opacity'] },

  // Decision Events
  { name: 'DefenderFollows', category: 'Decision Event', description: 'Fires an analytics step choice representing defender following F9.', params: ['time', 'data'] },
  { name: 'DefenderHolds', category: 'Decision Event', description: 'Fires an analytics step choice representing defender holding line.', params: ['time', 'data'] },
  { name: 'PressTriggered', category: 'Decision Event', description: 'Logs a press trigger activation.', params: ['time', 'data'] },
  { name: 'TrapActivated', category: 'Decision Event', description: 'Logs a pressing trap activation.', params: ['time', 'data'] },
  { name: 'CounterAttackTriggered', category: 'Decision Event', description: 'Logs counter-attack trigger.', params: ['time', 'data'] },
  { name: 'PossessionWon', category: 'Decision Event', description: 'Logs turnover won event.', params: ['time', 'data'] },
  { name: 'PossessionLost', category: 'Decision Event', description: 'Logs possession lost event.', params: ['time', 'data'] },

  // Arrows
  { name: 'MovementArrow', category: 'Arrow Style', description: 'Draws a green dashed movement direction arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },
  { name: 'PassingArrow', category: 'Arrow Style', description: 'Draws a cyan solid ball passing path arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },
  { name: 'PressingArrow', category: 'Arrow Style', description: 'Draws a red pressing pressure arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },
  { name: 'RotationArrow', category: 'Arrow Style', description: 'Draws a curved orange rotation arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },
  { name: 'SupportArrow', category: 'Arrow Style', description: 'Draws support direction run arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },
  { name: 'CounterArrow', category: 'Arrow Style', description: 'Draws fast counter attack transition arrow.', params: ['id', 'from', 'to', 'startTime', 'endTime', 'customStyle', 'curved'] },

  // Formations
  { name: 'FormationState', category: 'Formation', description: 'Lays out a team in a pre-configured formation grid.', params: ['team', 'formation', 'side', 'customPositions'] },
  { name: 'ShapeTransition', category: 'Formation', description: 'Animates a collective layout transition to a target formation.', params: ['team', 'targetFormation', 'side', 'startTime', 'endTime', 'easing'] },
  { name: 'FormationShift', category: 'Formation', description: 'Shifts the entire formation layout horizontally or vertically.', params: ['team', 'offset', 'startTime', 'endTime', 'easing'] },
  { name: 'LineCompression', category: 'Formation', description: 'Shrinks spacing between defense or midfield lines.', params: ['team', 'targetLine', 'compressionFactor', 'startTime', 'endTime', 'easing'] },
  { name: 'LineExpansion', category: 'Formation', description: 'Expands spacing between defense or midfield lines.', params: ['team', 'targetLine', 'expansionFactor', 'startTime', 'endTime', 'easing'] },

  // Timeline
  { name: 'Sequence', category: 'Timeline Sequencing', description: 'Executes child primitives sequentially.', params: ['children'] },
  { name: 'ParallelSequence', category: 'Timeline Sequencing', description: 'Executes child primitives concurrently.', params: ['children'] },
  { name: 'ConditionalSequence', category: 'Timeline Sequencing', description: 'Executes child primitives only on matching active branch.', params: ['branch', 'children'] },
  { name: 'Delay', category: 'Timeline Sequencing', description: 'Delays child execution by a duration offset.', params: ['duration', 'child'] },
  { name: 'Repeat', category: 'Timeline Sequencing', description: 'Repeats a child primitive sequence several times.', params: ['times', 'child'] },
  { name: 'Branch', category: 'Timeline Sequencing', description: 'Splits execution paths based on branch state (A or B).', params: ['branches'] },

  // Ball
  { name: 'PassBall', category: 'Ball Physics', description: 'Passes the ball from player A to player B.', params: ['fromPlayerId', 'toPlayerId', 'startTime', 'endTime'] },
  { name: 'DribbleBall', category: 'Ball Physics', description: 'Attaches the ball to dribbler\'s coordinate paths.', params: ['playerId', 'startTime', 'endTime'] },
  { name: 'SetBallPosition', category: 'Ball Physics', description: 'Places the ball at a coordinate or player position.', params: ['pos', 'startTime'] },
];

const PrimitiveExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'validation' | 'styles'>('validation');
  const [validationReports, setValidationReports] = useState<Record<string, { valid: boolean; errors: string[]; warnings: string[] }>>({});
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  // Run lazy primitive compilations on registered concept classes to check health
  const runValidations = () => {
    const ids = animationModuleRegistry.getRegisteredIds();
    const reports: typeof validationReports = {};

    ids.forEach(id => {
      try {
        const ModuleClass = animationModuleRegistry.getModule(id);
        if (ModuleClass) {
          const instance = new ModuleClass() as any;
          if (typeof instance.getValidationReport === 'function') {
            const reportA = instance.getValidationReport('A');
            const reportB = instance.getValidationReport('B');
            
            // Merge errors and warnings from both branches
            const errors = [...new Set([...reportA.errors, ...reportB.errors])];
            const warnings = [...new Set([...reportA.warnings, ...reportB.warnings])];
            const valid = reportA.valid && reportB.valid;

            reports[id] = { valid, errors, warnings };
          }
        }
      } catch (err: any) {
        reports[id] = {
          valid: false,
          errors: [`Failed to instantiate module: ${err.message || err}`],
          warnings: []
        };
      }
    });

    setValidationReports(reports);
  };

  useEffect(() => {
    runValidations();
  }, []);

  return (
    <div className="space-y-4 pt-2 border-t border-[#23324C]/60">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-base font-semibold text-white tracking-wide">
            🧩 Primitive Library Explorer
          </h3>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
            Primitives
          </span>
        </div>
        <button 
          onClick={runValidations}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-all"
        >
          🔄 Re-validate
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E293B] gap-4 text-xs font-medium">
        <button 
          onClick={() => setActiveTab('validation')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'validation' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Runtime Validation
        </button>
        <button 
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'catalog' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Primitive Catalog
        </button>
        <button 
          onClick={() => setActiveTab('styles')}
          className={`pb-2 border-b-2 transition-all ${
            activeTab === 'styles' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Visual Style config
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'validation' && (
        <div className="space-y-2">
          {Object.keys(validationReports).length === 0 ? (
            <div className="text-xs text-slate-500 italic py-4">No modules registered in the system.</div>
          ) : (
            Object.entries(validationReports).map(([id, report]) => {
              const isExpanded = expandedConcept === id;
              return (
                <div 
                  key={id} 
                  className={`rounded-lg p-3 bg-[#111827] border ${
                    report.valid ? 'border-[#1E293B]' : 'border-red-500/30'
                  }`}
                >
                  <div 
                    onClick={() => setExpandedConcept(isExpanded ? null : id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        report.valid ? 'bg-emerald-400' : 'bg-red-400'
                      }`} />
                      <span className="text-sm font-semibold text-white font-mono">{id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        {report.errors.length} err | {report.warnings.length} warn
                      </span>
                      <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs font-mono">
                      {report.valid && report.errors.length === 0 && (
                        <div className="text-emerald-400">✓ Primitive composition compiled and validated successfully.</div>
                      )}
                      
                      {report.errors.map((err, i) => (
                        <div key={i} className="text-red-400 flex gap-1.5">
                          <span>❌</span>
                          <span>{err}</span>
                        </div>
                      ))}
                      
                      {report.warnings.map((warn, i) => (
                        <div key={i} className="text-amber-400 flex gap-1.5">
                          <span>⚠️</span>
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 select-none">
          {PRIMITIVE_CATALOG.map((prim, i) => (
            <div key={i} className="p-2.5 rounded bg-[#111827] border border-[#1E293B] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white font-mono">{prim.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-800 text-slate-400 font-mono uppercase">{prim.category}</span>
              </div>
              <div className="text-xs text-slate-400">{prim.description}</div>
              <div className="text-[10px] text-cyan-400/80 font-mono">
                params: {prim.params.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'styles' && (
        <div className="space-y-3 p-3 rounded-lg bg-[#111827] border border-[#1E293B] text-xs font-mono">
          <div>
            <div className="text-slate-400 text-[10px] uppercase mb-1.5 tracking-wider">Default Colors</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(PRIMITIVE_STYLE_CONFIG.colors).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-slate-700" style={{ backgroundColor: val }} />
                  <span className="text-slate-300">{key}:</span>
                  <span className="text-slate-500">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3">
            <div className="text-slate-400 text-[10px] uppercase mb-1.5 tracking-wider">Default Arrow Widths</div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div>Movement: <span className="text-cyan-400">{PRIMITIVE_STYLE_CONFIG.arrows.movement.width}px</span></div>
              <div>Passing: <span className="text-cyan-400">{PRIMITIVE_STYLE_CONFIG.arrows.passing.width}px</span></div>
              <div>Pressing: <span className="text-cyan-400">{PRIMITIVE_STYLE_CONFIG.arrows.pressing.width}px</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrimitiveExplorer;
