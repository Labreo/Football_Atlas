import React, { useState, useEffect, useRef } from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useLearningUIStore } from '../../stores/LearningUIStore';
import { learningOrchestrator } from '../../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../../tacticalOrchestrator/store';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { tacticalApi } from '../../apiClients/tacticalApi';
import { ClassroomAction } from '@football-atlas/shared';
import { HistoricalBreakdownMode } from '../playbook/HistoricalBreakdownMode';
import Pitch3D from '../pitch/Pitch3D';
import PitchControls from '../pitch/PitchControls';
import { EvidencePanel } from '../common/EvidencePanel';

const ConversationalLearningInterface: React.FC = () => {
  const {
    current_concept,
    current_phase_index,
    current_phase_name,
    current_phase_annotation,
    loading,
  } = useLearningUIStore();

  const {
    conversation,
    detectedLevel,
    followUpSuggestions,
    triggerCameraReset,
    tacticalThread,
    visualMode,
  } = useTacticalStore();

  const orchestratorStore = learningStateStore((state) => state.telemetry);
  const { currentBreakdown } = useBreakdownStore();

  const [input, setInput] = useState('');
  const [showDebug, setShowDebug] = useState(false);

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

  // On mount, ensure the classroom starts with a clean slate —
  // no autoplay of stale concept animations from previous tab visits.
  useEffect(() => {
    useLearningUIStore.getState().resetUIStore();
    useTacticalStore.setState({
      currentConcept: null,
      playState: 'stopped',
    });
  }, []);

  // Scroll to bottom of chat feed when new turns are added
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length]);

  const handleLaunchHistoricalBreakdown = async (exampleId: string, conceptId?: string) => {
    analyticsTracker.track('breakdown_launched', { example_id: exampleId });
    try {
      let example;
      if (conceptId) {
        const examples = await tacticalApi.getHistoricalExamplesByConcept(conceptId);
        example = examples.find(e => e.example_id === exampleId);
      }
      if (!example) {
        const allEx = await tacticalApi.searchHistoricalExamples({});
        example = allEx.find(e => e.example_id === exampleId);
      }
      if (example) {
        analyticsTracker.trackGroundedExampleUsed(exampleId);
        await useBreakdownStore.getState().startBreakdown(example);
      } else {
        console.error('Historical example not found:', exampleId);
      }
    } catch (err) {
      console.error('Failed to launch historical breakdown:', err);
    }
  };

  const handleActionClick = async (action: ClassroomAction) => {
    switch (action.type) {
      case 'LAUNCH_CONCEPT':
        if (action.payload.concept_id) {
          analyticsTracker.trackConceptOpened(action.payload.concept_id);
          await learningOrchestrator.loadConceptAnimation(action.payload.concept_id);
        }
        break;
      case 'LAUNCH_HISTORICAL_BREAKDOWN':
      case 'LAUNCH_BREAKDOWN':
        if (action.payload.example_id) {
          await handleLaunchHistoricalBreakdown(action.payload.example_id, action.payload.concept_id);
        }
        break;
      case 'OPEN_RELATED_CONCEPT':
        if (action.payload.concept_id) {
          analyticsTracker.trackRelatedConceptOpened(
            current_concept?.concept_id || 'unknown',
            action.payload.concept_id
          );
          await learningOrchestrator.loadConceptAnimation(action.payload.concept_id);
        }
        break;
      case 'LAUNCH_MATCH':
        // Reset target views
        useBreakdownStore.getState().stopBreakdown();
        triggerCameraReset();
        break;
      case 'VIEW_SOURCE':
      case 'OPEN_EVIDENCE':
      case 'RELATED_DOCUMENT':
        if (action.payload.example_id) {
          const { fetchEvidenceForExample, setEvidencePanelOpen } = useTacticalStore.getState();
          await fetchEvidenceForExample(action.payload.example_id);
          setEvidencePanelOpen(true);
           analyticsTracker.trackEvidenceOpened(action.payload.example_id, {
            action_type: action.type
          });
        }
        break;
      case 'OPEN_MATCH':
        if (action.payload.example_id) {
          analyticsTracker.track('match_opened', { example_id: action.payload.example_id });
          await handleLaunchHistoricalBreakdown(action.payload.example_id, action.payload.concept_id);
        }
        break;
      default:
        console.warn('Unhandled action type:', action.type);
    }
  };

  return (
    <div className={`h-full w-full flex bg-[#0A0D14] text-slate-100 overflow-hidden font-sans relative ${visualMode === 'historical' ? 'historical-mode' : ''}`}>
      {visualMode === 'historical' && (
        <div className="historical-mode-watermark select-none pointer-events-none">
          🏛️ Grounded Historical Intel
        </div>
      )}
      
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
        {currentBreakdown ? (
          <HistoricalBreakdownMode onNavigateToConcept={async (id) => {
            await learningOrchestrator.loadConceptAnimation(id);
          }} />
        ) : (
          <>
            {/* Panel Header */}
            <div className="p-5 border-b border-[#1E293B]/70 bg-[#0E1320] flex items-center justify-between shrink-0">
              <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
                Classroom Chat
              </h2>
              {current_concept && (
                <span className="text-[9px] bg-[#1B253B] text-slate-400 font-bold px-2 py-0.5 rounded border border-[#2B3B5E]/30 uppercase tracking-wider font-mono">
                  {current_concept.complexity}
                </span>
              )}
            </div>

            {/* Content Feed Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {conversation.map((turn, turnIdx) => {
                const isUser = turn.role === 'user';
                return (
                  <div
                    key={turnIdx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Header (Sender Name) */}
                    <span className="text-[9px] font-mono text-slate-500 uppercase px-1">
                      {isUser ? 'You' : 'Granite AI Analyst'}
                    </span>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-sans ${
                        isUser
                          ? 'bg-[#1E293B]/50 border border-[#334155]/45 text-slate-200 rounded-tr-none'
                          : 'bg-[#0E1624] border border-[#23324C]/50 text-slate-300 rounded-tl-none shadow-md'
                      }`}
                    >
                      {turn.content}

                      {/* Contextual Action Cards */}
                      {!isUser && turn.actions && turn.actions.length > 0 && (
                        <div className="mt-3.5 space-y-2.5">
                          {turn.actions.map((action, actionIdx) => {
                            if (action.type === 'LAUNCH_MATCH') {
                              return (
                                <MatchCard
                                  key={actionIdx}
                                  action={action}
                                  onLaunchBreakdown={handleLaunchHistoricalBreakdown}
                                />
                              );
                            }
                            return (
                              <ActionButton
                                key={actionIdx}
                                action={action}
                                onActionClick={handleActionClick}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator when assistant is writing */}
              {loading && (
                <div className="flex flex-col items-start space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 uppercase px-1">
                    Granite AI Analyst
                  </span>
                  <div className="bg-[#0E1624] border border-[#23324C]/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Anchor to scroll to */}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom Suggested follow-ups */}
            {followUpSuggestions.length > 0 && (
              <div className="p-4 border-t border-[#1E293B]/70 bg-[#0A0D15] space-y-2 shrink-0">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider block">
                  Suggested Follow-ups
                </span>
                <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto scrollbar-thin">
                  {followUpSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left py-1.5 px-3 rounded-lg bg-[#121826]/40 border border-[#222E45]/60 hover:border-[#10B981]/50 text-[11px] font-semibold text-slate-300 hover:text-[#10B981] transition-all truncate"
                    >
                      💡 {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <EvidencePanel />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// ACTION CARD & MATCH CARD HELPER COMPONENTS
// ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  action: ClassroomAction;
  onActionClick: (action: ClassroomAction) => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onActionClick }) => {
  const handleClick = () => {
    onActionClick(action);
  };

  const getIcon = () => {
    switch (action.type) {
      case 'LAUNCH_CONCEPT':
        return (
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'LAUNCH_HISTORICAL_BREAKDOWN':
        return (
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'OPEN_RELATED_CONCEPT':
        return (
          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3 bg-[#111827]/40 hover:bg-[#1f2937]/60 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-xs font-semibold text-slate-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.15)] backdrop-blur-md"
    >
      <span className="shrink-0 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/30">
        {getIcon()}
      </span>
      <span className="flex-1 text-left truncate leading-tight">{action.label}</span>
      <svg className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

interface MatchCardProps {
  action: ClassroomAction;
  onLaunchBreakdown: (exampleId: string, conceptId?: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ action, onLaunchBreakdown }) => {
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!action.payload.example_id) return;
      setLoading(true);
      try {
        const allEx = await tacticalApi.searchHistoricalExamples({});
        const ex = allEx.find(e => e.example_id === action.payload.example_id);
        if (ex) {
          setMatchDetails(ex);
        }
      } catch (err) {
        console.error('Error fetching match details for card:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatchDetails();
  }, [action.payload.example_id]);

  if (loading) {
    return (
      <div className="w-full p-4 rounded-xl border border-slate-700/30 bg-[#0B0F19]/40 backdrop-blur-md flex items-center justify-center py-6">
        <div className="w-5 h-5 rounded-full border border-slate-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!matchDetails) {
    return (
      <div className="w-full p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-slate-400 text-[11px] leading-relaxed">
        Could not load match metadata for {action.payload.example_id}.
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-[#23324C]/60 bg-[#121826]/75 backdrop-blur-md overflow-hidden shadow-2xl transition-all hover:border-[#10B981]/40 duration-300">
      <div className="px-4 py-3 bg-[#162032]/45 border-b border-[#23324C]/40 flex items-center justify-between">
        <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
          {matchDetails.concept_id.replace(/_/g, ' ')} Match
        </span>
        <span className="text-[9px] text-slate-500 font-mono uppercase">
          Match Card
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h4 className="text-slate-100 font-display font-extrabold text-sm tracking-tight leading-snug">
            {matchDetails.match_name}
          </h4>
          <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
            Coach: <strong className="text-slate-300 font-semibold">{matchDetails.coach}</strong>
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-light">
          {matchDetails.description}
        </p>

        <div className="space-y-1">
          <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">Key Players</span>
          <div className="flex flex-wrap gap-1">
            {matchDetails.players.map((p: string, idx: number) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-[#1B253B] border border-[#2B3B5E]/30 text-slate-300 text-[10px] font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => onLaunchBreakdown(matchDetails.example_id, matchDetails.concept_id)}
          type="button"
          className="w-full mt-2 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#11C489] hover:to-[#05A372] text-slate-950 font-display font-extrabold text-[10px] tracking-wider uppercase rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View Tactical Breakdown
        </button>
      </div>
    </div>
  );
};

export default ConversationalLearningInterface;
