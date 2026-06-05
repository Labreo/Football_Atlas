import React, { useState, useEffect } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useLearningUIStore } from '../../stores/LearningUIStore';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../../tacticalOrchestrator/store';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { tacticalApi } from '../../apiClients/tacticalApi';
import { ConceptRouter } from '../../tacticalOrchestrator/router';
import Pitch3D from '../pitch/Pitch3D';
import PitchControls from '../pitch/PitchControls';
import { conceptLoader } from '../../conceptRuntime/ConceptLoader';
import HistoricalExampleExplorer from './HistoricalExampleExplorer';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { HistoricalBreakdownMode } from './HistoricalBreakdownMode';
import { useLearningJourneyStore } from '../../stores/useLearningJourneyStore';

const PlaybookInterface: React.FC = () => {
  const {
    current_concept,
    current_explanation,
    animation_state,
    current_phase_index,
    current_phase_name,
    current_phase_annotation,
    loading,
    error,
  } = useLearningUIStore();

  const { 
    concepts, 
    isLoading, 
    fetchConcepts, 
    triggerCameraReset 
  } = useTacticalStore();

  const { currentBreakdown } = useBreakdownStore();

  const mastery = useLearningJourneyStore((state) => 
    state.masteries.find((m) => m.concept_id === current_concept?.concept_id)
  );
  const profile = useLearningJourneyStore((state) => state.profile);
  const paths = useLearningJourneyStore((state) => state.paths);

  const [branch, setBranch] = useState<'A' | 'B'>('A');
  const [activeSubTab, setActiveSubTab] = useState<'lecture' | 'examples'>('lecture');

  // Load concepts on mount (no autoplay — board starts clean)
  useEffect(() => {
    fetchConcepts();
    useLearningJourneyStore.getState().loadJourney();
  }, []);

  // Direct playbook concept selection, bypassing Granite LLM
  const handlePlaybookSelect = async (conceptId: string) => {
    analyticsTracker.track('concept_changed', { conceptId, source: 'playbook_click' });
    
    // Set UI loading
    useLearningUIStore.getState().setLoading(true);
    useLearningUIStore.getState().setError(null);
    
    try {
      // Query concept details from local API directly
      const concept = await tacticalApi.getConceptById(conceptId);
      
      // Reset sub-tab to guide
      setActiveSubTab('lecture');

      // Update UI store
      useLearningUIStore.getState().setCurrentConcept(concept);
      useLearningUIStore.getState().setCurrentExplanation(concept.core_explanation);
      useLearningUIStore.getState().setPhaseInfo(1, 'Initial Shape');
      useLearningUIStore.getState().setPhaseAnnotation('');
      
      // Clear follow-up history chain since we are starting a fresh manual lesson
      useLearningUIStore.getState().clearFollowUpChain();
      
      // Set global store and load animation
      const resolvedModule = ConceptRouter.resolveAnimationModule(conceptId);
      useTacticalStore.setState({ 
        currentConcept: concept, 
        playState: resolvedModule ? 'playing' : 'stopped' 
      });
      learningStateStore.getState().setCurrentConcept(concept);
      learningStateStore.getState().setCurrentAnimation(resolvedModule);
      learningStateStore.getState().setAnimationStatus(resolvedModule ? 'playing' : 'stopped');
      
      if (resolvedModule) {
        useLearningUIStore.getState().setAnimationState('playing');
        analyticsTracker.track('lesson_started', { conceptId });
      } else {
        useLearningUIStore.getState().setAnimationState('stopped');
      }
    } catch (err: any) {
      useLearningUIStore.getState().setError(`Failed to load concept: ${err.message}`);
    } finally {
      useLearningUIStore.getState().setLoading(false);
    }
  };

  // Toggle Branch scenarios dynamically for False 9
  const handleBranchChange = (newBranch: 'A' | 'B') => {
    setBranch(newBranch);
    const activeModule = learningOrchestrator.getActiveModule();
    if (activeModule && activeModule.setBranch) {
      activeModule.setBranch(newBranch);
      analyticsTracker.track('branch_toggled', { conceptId: 'false_9', branch: newBranch });
    }
  };

  // Automatically sync branch state if concept shifts
  useEffect(() => {
    setBranch('A');
  }, [current_concept?.concept_id]);

  return (
    <div className="w-full p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 h-full bg-[#0A0D14] select-none">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT COLUMN (lg:col-span-3): Concept Library / Navigator     */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
        <div className="flex-grow flex flex-col bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              Tactical Playbook
            </h2>
            <span className="text-[10px] bg-[#182235] text-slate-400 font-bold px-1.5 py-0.5 rounded border border-[#23324C]/40">
              {concepts.length} Roles
            </span>
          </div>

          <div className="flex-grow overflow-y-auto p-2 space-y-1">
            {isLoading && concepts.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-slate-500 animate-pulse font-mono">Loading playbook...</span>
              </div>
            ) : error ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-red-500 text-center font-semibold">Failed to load playbook.</span>
              </div>
            ) : (
              concepts.map((concept) => (
                <button
                  key={concept.concept_id}
                  onClick={() => handlePlaybookSelect(concept.concept_id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    current_concept?.concept_id === concept.concept_id
                      ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981] shadow-md shadow-[#10B981]/5'
                      : 'border-[#23324C]/40 bg-[#182235]/20 hover:border-slate-700 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex flex-col text-ellipsis overflow-hidden pr-2">
                    <span className="text-xs font-bold font-display truncate">
                      {concept.concept_name}
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold truncate uppercase tracking-wider mt-0.5">
                      {concept.category.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                    concept.complexity.toLowerCase() === 'beginner'
                      ? 'bg-slate-900 border-slate-700 text-slate-400'
                      : concept.complexity.toLowerCase() === 'intermediate'
                      ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}>
                    {concept.complexity}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* CENTER COLUMN (lg:col-span-6): Living 3D Pitch               */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-6 flex flex-col h-full overflow-hidden bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl shadow-lg relative">
        {/* Top Floating Branding */}
        <div className="absolute top-4 left-6 z-10 pointer-events-none flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <h1 className="font-display font-extrabold text-sm tracking-wider text-slate-200 uppercase">
              Football Atlas Playbook
            </h1>
          </div>
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            Interactive Tactical Board
          </span>
        </div>

        {/* Top-Right Camera Controls */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          <button
            onClick={triggerCameraReset}
            className="w-8 h-8 rounded-lg bg-[#121826]/85 backdrop-blur-md border border-[#23324C]/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-colors"
            title="Reset Camera View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* 3D Pitch Player */}
        <div className="flex-1 w-full relative z-0 min-h-[300px]">
          <Pitch3D />
        </div>

        {/* Playback Controls & Phase Annotation (stacked for clarity) */}
        {!currentBreakdown && (
          <div className="bg-[#0E1320] border-t border-[#1E293B]/70 shrink-0 z-10 select-none">
            {/* Phase annotation row */}
            <div className="px-5 pt-3 pb-2 min-h-[44px] flex items-center">
              {current_phase_annotation ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#10B981] font-mono">
                    Phase {current_phase_index} : {current_phase_name}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {current_phase_annotation}
                  </p>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono italic">
                  Timeline inactive. Select a concept on the left to start.
                </span>
              )}
            </div>

            {/* Controls row */}
            <div className="px-5 pb-3 pt-1 border-t border-[#1E293B]/40">
              <PitchControls />
            </div>
          </div>
        )}
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* RIGHT COLUMN (lg:col-span-3): Concept Inspector              */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="lg:col-span-3 flex flex-col bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl overflow-hidden h-full shadow-lg">
        {currentBreakdown ? (
          <HistoricalBreakdownMode onNavigateToConcept={handlePlaybookSelect} />
        ) : (
          <>
            <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
              <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
                Concept Inspector
              </h2>
              {current_concept && (
                <span className="text-[9px] bg-[#1B253B] text-slate-400 font-bold px-2 py-0.5 rounded border border-[#2B3B5E]/30 uppercase tracking-wider font-mono">
                  {current_concept.complexity}
                </span>
              )}
            </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {loading && !current_concept && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Loading Concept details...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-slate-300">
              <p>{error}</p>
            </div>
          )}

          {!current_concept && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4 space-y-2 select-none">
              <span className="text-2xl opacity-45">📖</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select a playbook concept from the library list on the left to inspect its details.
              </p>
            </div>
          )}

          {current_concept && (() => {
            const manifest = conceptLoader.getManifest(current_concept.concept_id);
            const learningObjectives = manifest?.learning_objectives || [];
            
            return (
              <div className="space-y-5 animate-fadeIn">
                {/* Title & Classification */}
                <div>
                  <span className="text-[9px] text-[#10B981] font-mono tracking-widest uppercase font-bold block mb-1">
                    {current_concept.category.replace('_', ' ')}
                  </span>
                  <h3 className="font-display font-extrabold text-sm text-slate-100 tracking-tight leading-tight">
                    {current_concept.concept_name}
                  </h3>
                </div>

                {/* Sub-Tab Navigation (Guide vs Matches) */}
                <div className="flex border-b border-[#23324C]/60 text-xs font-mono select-none">
                  <button
                    onClick={() => setActiveSubTab('lecture')}
                    className={`flex-1 pb-2 font-display font-bold uppercase tracking-wider text-center transition-all ${
                      activeSubTab === 'lecture'
                        ? 'border-b-2 border-[#10B981] text-[#10B981]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Guide
                  </button>
                  <button
                    onClick={() => setActiveSubTab('examples')}
                    className={`flex-1 pb-2 font-display font-bold uppercase tracking-wider text-center transition-all ${
                      activeSubTab === 'examples'
                        ? 'border-b-2 border-[#10B981] text-[#10B981]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Matches
                  </button>
                </div>

                {activeSubTab === 'lecture' ? (
                  <div className="space-y-5">
                    {/* Dynamic Phase / Interactive Branch Scenario Toggle */}
                    {current_concept.concept_id === 'false_9' && (
                      <div className="bg-[#131926] border border-[#23324C]/60 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-slate-400">
                          <span>Active Scenario:</span>
                          <span className="text-[#10B981]">Interactive Toggle</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => handleBranchChange('A')}
                            className={`py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all border ${
                              branch === 'A'
                                ? 'bg-[#FF0055]/10 border-[#FF0055]/30 text-[#FF0055]'
                                : 'bg-[#0B0F19] border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            CB Follows (Gap)
                          </button>
                          <button
                            onClick={() => handleBranchChange('B')}
                            className={`py-2 rounded-lg text-[10px] font-bold tracking-wide transition-all border ${
                              branch === 'B'
                                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                                : 'bg-[#0B0F19] border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            CB Holds (Free)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Animation Progress */}
                    {animation_state !== 'stopped' && (
                      <div className="bg-[#121826]/40 border border-[#222E45]/40 rounded-xl p-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block font-mono">
                            Animation Progress
                          </span>
                          <span className="text-xs font-bold text-slate-200 font-display">
                            {current_phase_name}
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-900 border border-[#222E45] px-2 py-0.5 rounded text-amber-500 font-bold font-mono">
                          Phase {current_phase_index}
                        </span>
                      </div>
                    )}

                    {/* Overview explanation block */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Overview
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans font-light bg-[#121826]/30 border border-[#222E45]/30 p-3 rounded-xl">
                        {current_explanation || current_concept.core_explanation}
                      </p>
                    </div>

                    {/* Learning Objectives */}
                    {learningObjectives.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Learning Objectives
                        </h4>
                        <div className="space-y-1.5">
                          {learningObjectives.map((obj: any) => (
                            <div key={obj.id} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                              <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase font-bold ${
                                obj.category === 'understand' ? 'bg-blue-900/40 text-blue-400 border border-blue-500/20' :
                                obj.category === 'apply' ? 'bg-green-900/40 text-green-400 border border-green-500/20' :
                                'bg-purple-900/40 text-purple-400 border border-purple-500/20'
                              }`}>{obj.category}</span>
                              <span className="font-sans font-light text-[11px]">{obj.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaways list */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Key Takeaways
                      </h4>
                      <div className="space-y-2">
                        {current_concept.key_principles.map((principle, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs bg-[#121826]/20 border border-[#222E45]/20 p-3 rounded-xl leading-relaxed">
                            <span className="text-[#10B981] font-bold select-none pt-0.5">✦</span>
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-200 block font-display">{principle.title}</span>
                              <span className="text-slate-400 text-[11px] font-sans font-light leading-normal block">{principle.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learning Journey Progress & Mastery */}
                    <div className="bg-[#131926] border border-[#23324C]/60 p-4 rounded-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          My Journey Progress
                        </h4>
                        {mastery && (
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                            mastery.completion_percentage === 100
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          }`}>
                            {mastery.completion_percentage === 100 ? 'Mastered' : 'In Progress'}
                          </span>
                        )}
                      </div>

                      {mastery && (
                        <div className="space-y-3">
                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Lesson Progress</span>
                              <span className="font-bold text-slate-200">{mastery.completion_percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex items-center">
                              <div
                                className="h-full bg-gradient-to-r from-[#10B981] to-[#00F3FF] transition-all duration-300"
                                style={{ width: `${mastery.completion_percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Confidence */}
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Mastery Confidence</span>
                            <span className="font-bold text-emerald-400">{mastery.confidence_score}%</span>
                          </div>

                          {/* Path Membership */}
                          {profile?.active_path_id && (() => {
                            const activePathObj = paths.find(p => p.path_id === profile.active_path_id);
                            if (!activePathObj) return null;
                            const inPath = activePathObj.ordered_concepts.includes(current_concept.concept_id);
                            if (!inPath) return null;
                            return (
                              <div className="text-[10px] bg-slate-900 border border-[#23324C]/40 px-2.5 py-1.5 rounded-lg text-slate-400">
                                🎯 Part of your active path: <span className="font-bold text-slate-200">"{activePathObj.title}"</span>
                              </div>
                            );
                          })()}

                          {/* Action Button: Mark Completed */}
                          {mastery.completion_percentage < 100 && (
                            <button
                              onClick={() => useLearningJourneyStore.getState().completeConcept(current_concept.concept_id)}
                              className="w-full py-2 bg-[#10B981] text-white font-display text-[10px] font-extrabold uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md"
                            >
                              ✓ Mark Concept Completed
                            </button>
                          )}
                        </div>
                      )}

                      {/* Prerequisites */}
                      {manifest?.teaching_metadata?.prerequisites && manifest.teaching_metadata.prerequisites.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#23324C]/30">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                            Prerequisites
                          </span>
                          <div className="flex flex-col gap-1">
                            {manifest.teaching_metadata.prerequisites.map((prereqId) => {
                              const isCompleted = profile?.completed_concepts.includes(prereqId);
                              const name = concepts.find(c => c.concept_id === prereqId)?.concept_name || prereqId;
                              return (
                                <div key={prereqId} className="flex items-center justify-between text-[10px]">
                                  <span className="text-slate-300 font-medium">{name}</span>
                                  <span className={`font-bold uppercase tracking-wider text-[8px] px-1.5 py-0.5 rounded ${
                                    isCompleted
                                      ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                                      : 'bg-red-500/10 border border-red-500/25 text-red-400'
                                  }`}>
                                    {isCompleted ? '✓ Met' : '⚠ Locked'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recommended Next Concepts */}
                      {manifest?.teaching_metadata?.follow_up_concepts && manifest.teaching_metadata.follow_up_concepts.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#23324C]/30">
                          <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                            Recommended Next
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {manifest.teaching_metadata.follow_up_concepts.map((followId) => {
                              const name = concepts.find(c => c.concept_id === followId)?.concept_name || followId;
                              return (
                                <button
                                  key={followId}
                                  onClick={() => handlePlaybookSelect(followId)}
                                  className="px-2 py-1 rounded bg-[#182235] hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-mono transition-all"
                                >
                                  {name} &rarr;
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Related Concepts */}
                    {current_concept.related_concepts.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Related Concepts
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {current_concept.related_concepts.map((id) => {
                            const matched = concepts.find(c => c.concept_id === id);
                            if (!matched) return null;
                            return (
                              <button
                                key={id}
                                onClick={() => handlePlaybookSelect(id)}
                                className="px-2.5 py-1 rounded bg-[#1B253B] hover:bg-[#28385A] border border-[#2B3B5E]/30 text-slate-300 text-[10px] font-mono transition-all rounded-lg"
                              >
                                {matched.concept_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <HistoricalExampleExplorer
                    conceptId={current_concept.concept_id}
                    onSelectConcept={handlePlaybookSelect}
                  />
                )}
              </div>
            );
          })()}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PlaybookInterface;
