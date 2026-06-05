import React, { useState, useEffect } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useLearningUIStore } from '../../stores/LearningUIStore';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../../tacticalOrchestrator/store';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import Pitch3D from '../pitch/Pitch3D';
import PitchControls from '../pitch/PitchControls';

const ConversationalLearningInterface: React.FC = () => {
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
    conversation,
    detectedLevel,
    followUpSuggestions,
    triggerCameraReset,
    tacticalThread,
  } = useTacticalStore();

  const orchestratorStore = learningStateStore((state) => state.telemetry);

  const [input, setInput] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [branch, setBranch] = useState<'A' | 'B'>('A');

  // Submit new user prompt to the orchestrator loop
  const handleQuerySubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput('');
    learningOrchestrator.askQuestion(query);
  };

  // Trigger lesson from follow-up or suggestion click
  const handleSuggestionClick = (questionText: string) => {
    analyticsTracker.trackQuestionAsked(questionText, { source: 'follow_up_clicked' });
    setInput('');
    learningOrchestrator.askQuestion(questionText);
  };



  // Toggle Branch scenarios dynamically for False 9
  const handleBranchChange = (newBranch: 'A' | 'B') => {
    setBranch(newBranch);
    const activeModule = learningOrchestrator.getActiveModule();
    if (activeModule && activeModule.setBranch) {
      activeModule.setBranch(newBranch);
    }
  };

  // Automatically sync branch state if concept shifts
  useEffect(() => {
    setBranch('A');
  }, [current_concept?.concept_id]);

  // On mount, ensure the classroom starts with a clean slate —
  // no autoplay of stale concept animations from previous tab visits.
  useEffect(() => {
    useLearningUIStore.getState().resetUIStore();
    useTacticalStore.setState({
      currentConcept: null,
      playState: 'stopped',
    });
  }, []);

  return (
    <div className="h-full w-full flex bg-[#0A0D14] text-slate-100 overflow-hidden font-sans relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT / CENTER CORE (70-80% viewport): The Hero Pitch         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full relative flex flex-col overflow-hidden">
        
        {/* Top Floating Branding & Status */}
        <div className="absolute top-4 left-6 z-10 pointer-events-none flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <h1 className="font-display font-extrabold text-sm tracking-wider text-slate-200 uppercase">
              Football Atlas Classroom
            </h1>
          </div>
          <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            Interactive Tactical Board
          </span>
        </div>

        {/* Sleek Glassmorphism Tactical Thread Flow Tracker */}
        {tacticalThread && tacticalThread.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[#121826]/80 backdrop-blur-md border border-[#23324C]/60 px-4 py-2 rounded-full shadow-2xl max-w-[80%] overflow-x-auto scrollbar-thin">
            <span className="text-[9px] uppercase font-extrabold text-[#10B981] tracking-widest font-mono border-r border-[#23324C]/60 pr-2">
              Thread
            </span>
            <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
              {tacticalThread.map((step, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <svg className="w-2.5 h-2.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    idx === tacticalThread.length - 1 ? 'text-slate-100 font-extrabold' : 'text-slate-500'
                  }`}>
                    {step}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Top-Right Tools Trigger (Debug & Camera Controls) */}
        <div className="absolute top-4 right-6 z-20 flex items-center gap-2">
          
          {/* Debug Mode Toggler */}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all ${
              showDebug
                ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg'
                : 'bg-[#121826]/80 backdrop-blur-md border-[#23324C]/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showDebug ? '✕ Close Debug' : '⚙ Inspect Mode'}
          </button>

          {/* Camera Reset */}
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

        {/* Interactive 3D Pitch Canvas */}
        <div className="flex-1 w-full relative z-0 min-h-[300px]">
          <Pitch3D />
        </div>

        {/* Collapsible Debug HUD */}
        {showDebug && (
          <div className="absolute top-16 right-6 z-20 w-[280px] bg-[#0E131F]/95 backdrop-blur-md border border-[#23324C] rounded-xl p-4 shadow-2xl space-y-3 font-mono text-[10px] text-slate-300">
            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider border-b border-[#23324C] pb-1.5">
              Telemetry Debug HUD
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Session State:</span><span className="font-bold text-slate-200">{orchestratorStore.sessionState}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Active Concept:</span><span className="font-bold text-emerald-400">{current_concept?.concept_id || 'none'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Confidence Score:</span><span className="font-bold text-slate-200">{orchestratorStore.confidenceScore ? `${Math.round(orchestratorStore.confidenceScore * 100)}%` : 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Loaded Module:</span><span className="font-bold text-slate-200">{orchestratorStore.loadedModuleId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Granite Latency:</span><span className="font-bold text-[#10B981]">{orchestratorStore.graniteLatencyMs} ms</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Animation Phase:</span><span className="font-bold text-amber-500">#{current_phase_index} {current_phase_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">User Level:</span><span className="font-bold text-slate-200 uppercase">{detectedLevel}</span></div>
            </div>
            {conversation.length > 0 && (
              <div className="border-t border-[#23324C] pt-2 space-y-1">
                <span className="text-slate-500 uppercase tracking-wider text-[9px]">Last Query Turn:</span>
                <p className="text-slate-400 line-clamp-2 italic leading-relaxed">
                  "{conversation[conversation.length - 2]?.content || 'None'}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Structured Playback Controls & Phase Annotation (stacked) */}
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
                Timeline inactive. Ask a question to load a tactical animation.
              </span>
            )}
          </div>

          {/* Controls row */}
          <div className="px-5 pb-3 pt-1 border-t border-[#1E293B]/40">
            <PitchControls />
          </div>
        </div>

        {/* Always Visible Natural Language Question Input Footer */}
        <div className="p-4 border-t border-[#1E293B]/70 bg-[#0B0E17] z-10 shrink-0">
          <form onSubmit={handleQuerySubmit} className="max-w-3xl mx-auto flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a football tactics question... (e.g. 'Why is a False 9 hard to defend?')"
              disabled={loading}
              className="flex-1 h-11 pl-4 pr-12 rounded-xl text-xs font-sans bg-[#131926] border border-[#222E45] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981]/30 transition-all disabled:opacity-50"
            />
            
            {/* Thinking / Processing indicator */}
            {loading && (
              <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-11 px-4 rounded-xl bg-[#10B981] hover:bg-[#0EA271] text-white font-display font-semibold text-xs transition-colors disabled:opacity-40 disabled:hover:bg-[#10B981]"
            >
              Analyze
            </button>
          </form>

          {/* Quick Help Prompts (For discovery) */}
          <div className="max-w-3xl mx-auto mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
            <span className="uppercase font-bold tracking-wider text-slate-600">Examples:</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick("Why is a False 9 hard to defend?")}
              className="hover:text-slate-300 transition-colors"
            >
              "Why is a False 9 hard to defend?"
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick("How does a high press create chances?")}
              className="hover:text-slate-300 transition-colors"
            >
              "How does a high press create chances?"
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSuggestionClick("How does a defensive block work?")}
              className="hover:text-slate-300 transition-colors"
            >
              "How does a defensive block work?"
            </button>
          </div>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* RIGHT COLUMN (20-30% viewport): The Learning Panel           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-[340px] md:w-[380px] h-full bg-[#0C0F17] border-l border-[#1E293B]/70 flex flex-col shrink-0 z-10 shadow-2xl relative select-none">
        
        {/* Panel Header */}
        <div className="p-5 border-b border-[#1E293B]/70 bg-[#0E1320] flex items-center justify-between shrink-0">
          <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
            Tactical Analysis
          </h2>
          {current_concept && (
            <span className="text-[9px] bg-[#1B253B] text-slate-400 font-bold px-2 py-0.5 rounded border border-[#2B3B5E]/30 uppercase tracking-wider font-mono">
              {current_concept.complexity}
            </span>
          )}
        </div>



        {/* Content Feed Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* 1. Loading Slate */}
          {loading && !current_concept && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#10B981] border-t-transparent animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-300">Formulating Tactical Report...</p>
                <p className="text-[10px] text-slate-500">Querying Granite AI Layer</p>
              </div>
            </div>
          )}

          {/* 2. Error Message Container */}
          {error && (
            <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-slate-300 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold font-display uppercase tracking-wide">
                <span>⚠️ Tactical Query Error</span>
              </div>
              <p className="leading-relaxed">
                {error.includes('identify') 
                  ? "I couldn't confidently identify the tactical idea you're asking about. Try asking about one of our supported concepts:"
                  : error.includes('timeout') || error.includes('longer')
                  ? "Tactical analysis is taking longer than expected. Please check your connectivity."
                  : error}
              </p>
              
              {/* Error Actions & Retry */}
              {error.includes('identify') ? (
                <div className="flex flex-col gap-1.5 pt-1.5">
                  <button
                    onClick={() => handleSuggestionClick("Why is a False 9 hard to defend?")}
                    className="w-full text-left py-1.5 px-2.5 rounded bg-slate-900 border border-[#23324C] hover:border-[#10B981] text-[11px] font-semibold text-slate-300 transition-all"
                  >
                    ⚽ False 9
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How does a high press create chances?")}
                    className="w-full text-left py-1.5 px-2.5 rounded bg-slate-900 border border-[#23324C] hover:border-[#10B981] text-[11px] font-semibold text-slate-300 transition-all"
                  >
                    ⚡ High Press
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("How does a defensive block work?")}
                    className="w-full text-left py-1.5 px-2.5 rounded bg-slate-900 border border-[#23324C] hover:border-[#10B981] text-[11px] font-semibold text-slate-300 transition-all"
                  >
                    🛡️ Defensive Block
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleQuerySubmit()}
                  className="px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 text-[10px] font-bold rounded hover:bg-red-500/30 transition-all"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          )}

          {/* 3. Empty state (Introductory prompt) */}
          {!current_concept && !loading && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-4 space-y-3 select-none">
              <span className="text-3xl filter grayscale opacity-45">📖</span>
              <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
                Welcome to the Tactical Board. Select a concept from the playbook catalog above or ask a question to start.
              </p>
            </div>
          )}

          {/* 4. Active Concept Visualizer */}
          {current_concept && (
            <div className="space-y-6">
              
              {/* Title & Classification header */}
              <div>
                <span className="text-[9px] text-[#10B981] font-mono tracking-widest uppercase font-bold block mb-1">
                  {current_concept.category.replace('_', ' ')}
                </span>
                <h3 className="font-display font-extrabold text-lg text-slate-100 tracking-tight leading-tight">
                  {current_concept.concept_name}
                </h3>
              </div>

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

              {/* Dynamic Step phase tracking display */}
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

              {/* Concept explanation block */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Tactics Lecture
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-light bg-[#121826]/30 border border-[#222E45]/30 p-3.5 rounded-xl">
                  {current_explanation || current_concept.core_explanation}
                </p>
              </div>

              {/* Key Takeaways list */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Key Principles
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

              {/* Related Concepts & follow-up prompts */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Explore Related Areas
                </h4>
                <div className="flex flex-col gap-1.5">
                  {followUpSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left py-2 px-3 rounded-xl bg-[#121826]/40 border border-[#222E45]/60 hover:border-[#10B981] text-xs font-semibold text-slate-300 hover:text-[#10B981] transition-all truncate"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ConversationalLearningInterface;
