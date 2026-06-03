import React, { useState, useEffect } from 'react';
import { conceptLoader } from '../../conceptRuntime/ConceptLoader';
import { runtimeValidator } from '../../conceptRuntime/RuntimeValidator';
import { conceptGraph } from '../../conceptRuntime/ConceptGraph';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { animationModuleRegistry } from '../../tacticalOrchestrator/registry';
import { RuntimeHealthReport, ConceptManifest } from '@football-atlas/shared';

// ────────────────────────────────────────────────────────────
// CONCEPT EXPLORER — Developer-only panel
// Shows registered concepts, dependencies, runtime health,
// and validation status.
// ────────────────────────────────────────────────────────────

const ConceptExplorer: React.FC = () => {
  const [healthReport, setHealthReport] = useState<RuntimeHealthReport | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [manifests, setManifests] = useState<ConceptManifest[]>([]);

  useEffect(() => {
    setManifests(conceptLoader.getLoadedManifests());
    setHealthReport(runtimeValidator.validate());
  }, []);

  const loadReport = conceptLoader.getLoadReport();
  const selectedManifest = selectedConcept ? conceptLoader.getManifest(selectedConcept) : null;
  const selectedHealth = healthReport?.concepts.find((c: any) => c.concept_id === selectedConcept);
  const prerequisites = selectedConcept ? conceptGraph.getPrerequisites(selectedConcept) : [];
  const related = selectedConcept ? conceptGraph.getRelatedConcepts(selectedConcept) : [];
  const nextConcepts = selectedConcept ? conceptGraph.getNextConcepts(selectedConcept) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="font-display text-base font-semibold text-white tracking-wide">
          ⚙️ Concept Explorer
        </h3>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-mono uppercase tracking-widest">
          Dev Only
        </span>
      </div>

      {/* Runtime Health Summary */}
      {healthReport && (
        <div className="p-3 rounded-lg bg-[#111827] border border-[#1E293B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Runtime Health
            </span>
            <span className={`text-xs font-mono ${
              healthReport.invalid_concepts === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {healthReport.valid_concepts}/{healthReport.total_concepts} valid
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <StatCard label="Loaded" value={healthReport.valid_concepts} color="emerald" />
            <StatCard label="Invalid" value={healthReport.invalid_concepts} color="red" />
            <StatCard label="Boot (ms)" value={loadReport?.total_time_ms || 0} color="cyan" />
            <StatCard label="Registered" value={animationModuleRegistry.getRegisteredIds().length} color="slate" />
          </div>
        </div>
      )}

      {/* Concept Grid */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
          Registered Concepts
        </span>
        <div className="grid grid-cols-1 gap-1.5">
          {manifests.map((manifest) => {
            const health = healthReport?.concepts.find((c: any) => c.concept_id === manifest.concept_id);
            const isSelected = selectedConcept === manifest.concept_id;

            return (
              <button
                key={manifest.concept_id}
                onClick={() => setSelectedConcept(isSelected ? null : manifest.concept_id)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'bg-[#1E293B] border border-cyan-500/30'
                    : 'bg-[#111827] border border-[#1E293B] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    health?.errors.length === 0 ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm text-white font-medium">{manifest.display_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{manifest.concept_id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">
                    {manifest.category}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 font-mono">
                    {manifest.complexity}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Concept Detail */}
      {selectedManifest && (
        <div className="space-y-3 p-3 rounded-lg bg-[#111827] border border-[#1E293B]">
          {/* Health Status */}
          {selectedHealth && (
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
                Validation Status
              </span>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge label="Manifest" ok={selectedHealth.manifest_valid} />
                <StatusBadge label="Module" ok={selectedHealth.module_loadable} />
                <StatusBadge label="Vocabulary" ok={selectedHealth.vocabulary_present} />
                <StatusBadge label="Seed Data" ok={selectedHealth.seed_exists} />
                <StatusBadge label="Prerequisites" ok={selectedHealth.prerequisites_satisfied} />
              </div>
              {selectedHealth.errors.length > 0 && (
                <div className="mt-1.5 text-[11px] text-red-400 font-mono space-y-0.5">
                  {selectedHealth.errors.map((err: string, i: number) => (
                    <div key={i}>❌ {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Learning Objectives */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
              Learning Objectives ({selectedManifest.learning_objectives.length})
            </span>
            <div className="space-y-1">
              {selectedManifest.learning_objectives.map((obj: any) => (
                <div key={obj.id} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className={`mt-0.5 px-1 py-0.5 rounded text-[9px] font-mono uppercase ${
                    obj.category === 'understand' ? 'bg-blue-900/40 text-blue-400' :
                    obj.category === 'apply' ? 'bg-green-900/40 text-green-400' :
                    'bg-purple-900/40 text-purple-400'
                  }`}>{obj.category}</span>
                  <span>{obj.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Concept Graph */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
              Concept Graph
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <GraphColumn title="Prerequisites" nodes={prerequisites} />
              <GraphColumn title="Related" nodes={related} />
              <GraphColumn title="Follow-ups" nodes={nextConcepts} />
            </div>
          </div>

          {/* Teaching Metadata */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
              Teaching Metadata
            </span>
            <div className="text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">Difficulty:</span>{' '}
                <span className="text-white">{selectedManifest.teaching_metadata.difficulty_rating}/10</span>
              </div>
              <div>
                <span className="text-slate-500">Duration:</span>{' '}
                <span className="text-white">{selectedManifest.estimated_duration_seconds}s</span>
              </div>
              <div>
                <span className="text-slate-500">Key Takeaways:</span>{' '}
                <span className="text-white">{selectedManifest.teaching_metadata.key_takeaways.length}</span>
              </div>
              <div>
                <span className="text-slate-500">Common Mistakes:</span>{' '}
                <span className="text-white">{selectedManifest.teaching_metadata.common_mistakes.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Buffer */}
      <div className="p-3 rounded-lg bg-[#111827] border border-[#1E293B]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
            Analytics Buffer
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {analyticsTracker.getBufferSize()} events | {analyticsTracker.getSessionId().slice(0, 20)}...
          </span>
        </div>
      </div>
    </div>
  );
};

// ──────────────── Sub-components ────────────────

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="p-2 rounded bg-slate-900/50">
    <div className={`text-lg font-bold font-display text-${color}-400`}>{value}</div>
    <div className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</div>
  </div>
);

const StatusBadge: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
    ok ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'
  }`}>
    {ok ? '✓' : '✗'} {label}
  </span>
);

const GraphColumn: React.FC<{ title: string; nodes: Array<{ concept_id: string; display_name: string }> }> = ({ title, nodes }) => (
  <div>
    <div className="text-[9px] text-slate-500 uppercase mb-1">{title}</div>
    {nodes.length === 0 ? (
      <span className="text-slate-600 text-[10px] italic">None</span>
    ) : (
      nodes.map((n) => (
        <div key={n.concept_id} className="text-slate-300 text-[11px] py-0.5">
          {n.display_name}
        </div>
      ))
    )}
  </div>
);

export default ConceptExplorer;
