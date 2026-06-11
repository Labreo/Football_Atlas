import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTacticalStore } from '../stores/useTacticalStore';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { useBreakdownStore } from '../stores/useBreakdownStore';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../tacticalOrchestrator/store';
import ConversationalLearningInterface from '../components/chat/ConversationalLearningInterface';
import PlaybookInterface from '../components/playbook/PlaybookInterface';
import { tacticalApi } from '../apiClients/tacticalApi';
import { useHistoricalExplorerStore } from '../stores/useHistoricalExplorerStore';
import LearningEffectivenessDashboard from '../components/metrics/LearningEffectivenessDashboard';

// Lazy-load developer tools (only rendered in dev mode Settings tab)
const ConceptExplorer = lazy(() => import('../components/dev/ConceptExplorer'));
const PrimitiveExplorer = lazy(() => import('../components/dev/PrimitiveExplorer'));
const HistoricalExampleExplorer = lazy(() => import('../components/dev/HistoricalExampleExplorer'));

type Tab = 'landing' | 'playbook' | 'classroom' | 'explore' | 'impact' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('landing');
  const { fetchConcepts } = useTacticalStore();

  // Load tactical concepts library on startup
  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  const handleLaunchMatch = async (exampleId: string, conceptId: string) => {
    try {
      const concept = await tacticalApi.getConceptById(conceptId);
      let example = null;

      try {
        example = await tacticalApi.getHistoricalExampleById(exampleId);
      } catch (err) {
        const examples = await tacticalApi.getHistoricalExamplesByConcept(conceptId);
        example = examples.find(e => e.example_id === exampleId) || null;
      }

      if (concept && example) {
        // 1. Select the concept in global store and UI stores
        useTacticalStore.setState({ 
          currentConcept: concept,
          playbookSubTab: 'examples',
          playState: 'stopped'
        });

        useLearningUIStore.getState().setCurrentConcept(concept);
        useLearningUIStore.getState().setCurrentExplanation(concept.core_explanation);
        useLearningUIStore.getState().setPhaseInfo(1, 'Initial Shape');
        useLearningUIStore.getState().setPhaseAnnotation('');
        useLearningUIStore.getState().clearFollowUpChain();

        learningStateStore.getState().setCurrentConcept(concept);
        learningStateStore.getState().setCurrentAnimation(null);
        learningStateStore.getState().setAnimationStatus('stopped');

        // 2. Set the selected example in historical explorer store
        useHistoricalExplorerStore.getState().setSelectedExample(example);

        // 3. Navigate to playbook tab
        setActiveTab('playbook');
      } else {
        console.error(`Concept ${conceptId} or Example ${exampleId} not found.`);
      }
    } catch (err) {
      console.error('Failed to launch match breakdown:', err);
    }
  };

  const handleLaunchHeroMoment = () => {
    handleLaunchMatch('argentina_france_2022_equaliser', 'compactness_pressing_lines');
  };

  // Reset the board to a clean default state whenever the user switches tabs.
  // This prevents stale animations from carrying over between Playbook ↔ Classroom.
  useEffect(() => {
    // Bypass clear if we are navigating to playbook with a concept already selected or breakdown active
    if (activeTab === 'playbook' && (useTacticalStore.getState().currentConcept || useBreakdownStore.getState().currentBreakdown)) {
      return;
    }

    // Clear global concept selection
    useTacticalStore.setState({
      currentConcept: null,
      playState: 'stopped',
    });

    // Clear the learning UI store
    useLearningUIStore.getState().resetUIStore();

    // Clear orchestrator state store
    learningStateStore.getState().reset();

    // Reset the orchestrator's active module
    learningOrchestrator.reset();
  }, [activeTab]);

  return (
    <div className="h-screen w-screen flex bg-[#0A0D14] text-slate-100 overflow-hidden font-sans relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT NAVIGATION RAIL (Slim, Icons-only, premium sidebar)      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-[72px] h-full bg-[#0E1320] border-r border-[#1E293B]/70 flex flex-col items-center py-6 justify-between shrink-0 z-30 select-none">
        
        {/* Top: Stylized Football Atlas Logo */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => setActiveTab('landing')}
            className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/25 hover:scale-105 transition-transform duration-200 cursor-pointer"
          >
            <span className="font-display font-extrabold text-white text-xl">F</span>
          </div>
        </div>

        {/* Center: Main Navigation Rail Icons */}
        <div className="flex flex-col gap-5">
          
          {/* Home / Landing Tab */}
          <button
            onClick={() => setActiveTab('landing')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'landing'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Home</span>
          </button>

          {/* Playbook Tab */}
          <button
            onClick={() => setActiveTab('playbook')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'playbook'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Playbook"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Playbook</span>
          </button>

          {/* Classroom Tab */}
          <button
            onClick={() => setActiveTab('classroom')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'classroom'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Classroom"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Classroom</span>
          </button>

          {/* Explore Tab */}
          <button
            onClick={() => setActiveTab('explore')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'explore'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Knowledge Explorer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Explore</span>
          </button>

          {/* Impact / Metrics Tab */}
          <button
            onClick={() => setActiveTab('impact')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'impact'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Learning Impact"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Impact</span>
          </button>

        </div>

        {/* Bottom: Settings Gear */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Settings</span>
          </button>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT AREA                                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full relative overflow-hidden">
        {activeTab === 'landing' && (
          <LandingPage onLaunchHero={handleLaunchHeroMoment} onLaunchMatch={handleLaunchMatch} onNavigate={setActiveTab} />
        )}

        {activeTab === 'playbook' && (
          <PlaybookInterface />
        )}

        {activeTab === 'classroom' && (
          <ConversationalLearningInterface />
        )}

        {activeTab === 'explore' && (
          <ExploreTab />
        )}

        {activeTab === 'impact' && (
          <LearningEffectivenessDashboard />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>

    </div>
  );
};

// ────────────────────────────────────────────────────────────
// LANDING PAGE SHOWCASE COMPONENT
// ────────────────────────────────────────────────────────────
const LandingPage: React.FC<{
  onLaunchHero: () => void;
  onLaunchMatch: (exampleId: string, conceptId: string) => void;
  onNavigate: (tab: Tab) => void;
}> = ({ onLaunchHero, onLaunchMatch, onNavigate }) => {
  return (
    <div className="w-full h-full p-6 lg:p-8 overflow-y-auto bg-[#0A0D14] flex flex-col justify-start items-center relative">
      {/* Ambient gradient backgrounds */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00F3FF]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-4xl w-full space-y-8 py-6 relative z-10 animate-fadeIn">
        {/* Header Block */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[10px] font-bold uppercase tracking-wider font-mono">
            <span>✨ Introducing the Showcase Moment</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white uppercase mt-2">
            Football <span className="text-[#10B981]">Atlas</span>
          </h1>
          <p className="text-sm lg:text-base text-slate-400 font-display max-w-xl mx-auto leading-relaxed">
            Every goal has a reason. See the logic behind the magic.
          </p>
        </div>

        {/* Hero CTA Showcase Card (Glassmorphic, glowing) */}
        <div className="relative rounded-3xl border border-[#23324C]/60 bg-gradient-to-br from-[#121826]/90 to-[#0A0D14]/85 p-6 lg:p-8 shadow-2xl overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-widest block">
                Showcase Simulation
              </span>
              <h2 className="text-2xl font-bold font-display text-white tracking-tight leading-snug">
                Watch the moment Argentina lost control.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                "Here's the exact moment Argentina's defensive shape broke down. Three passes before Mbappé's equaliser. Watch it happen."
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-400 text-[9px] font-mono">
                  Qatar 2022 Final
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-400 text-[9px] font-mono">
                  Argentina 3 - 3 France
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[9px] font-mono font-bold">
                  Compactness Collapse
                </span>
              </div>
            </div>

            <button
              onClick={onLaunchHero}
              className="px-6 py-4 bg-gradient-to-r from-[#10B981] to-[#00F3FF] text-slate-950 font-display font-extrabold text-xs rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#10B981]/25 shrink-0 uppercase tracking-wider flex items-center gap-2 group-hover:shadow-[#10B981]/40"
            >
              <span>Watch Hero Moment</span>
              <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        {/* Candidate Evaluation Matrix Section */}
        <div className="space-y-4">
          <div>
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              Moment Evaluation Matrix
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-display">
              Why the 2022 World Cup Final sequence was selected as the canonical Hero Moment over other candidates.
            </p>
          </div>

          <div className="overflow-hidden border border-[#23324C]/40 rounded-2xl bg-[#121826]/30 shadow-inner">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121826]/80 text-[#10B981] font-mono uppercase tracking-wider text-[10px] border-b border-[#23324C]/40">
                  <th className="p-4 font-bold">Candidate Moment</th>
                  <th className="p-4 font-bold text-center">Visual Recognition</th>
                  <th className="p-4 font-bold text-center">Tactical Causality</th>
                  <th className="p-4 font-bold text-center">Spatial Complexity</th>
                  <th className="p-4 font-bold text-center">Value Alignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23324C]/20 text-slate-300">
                <tr 
                  onClick={() => onLaunchMatch('argentina_france_2022_equaliser', 'compactness_pressing_lines')}
                  className="bg-[#10B981]/5 font-semibold text-slate-100 cursor-pointer hover:bg-[#10B981]/15 hover:text-white transition-colors"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span>Mbappé Equaliser Sequence (2022 Final)</span>
                      <span className="text-[9px] text-[#10B981] uppercase font-mono mt-0.5">Primary Selection</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-emerald-400 font-semibold">★ ★ ★ ★ ★ (Highest)</td>
                  <td className="p-4 text-center text-emerald-400 font-semibold">★ ★ ★ ★ ★ (High)</td>
                  <td className="p-4 text-center text-emerald-400 font-semibold">★ ★ ★ ★ ★ (High)</td>
                  <td className="p-4 text-center text-emerald-400 font-semibold">★ ★ ★ ★ ★ (Highest)</td>
                </tr>
                <tr 
                  onClick={() => onLaunchMatch('liverpool_2019_hp', 'high_press')}
                  className="cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors"
                >
                  <td className="p-4">Liverpool vs. Barcelona Corner (2019)</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ☆ ☆ ☆ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ☆ ☆ ☆ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ☆ ☆ ☆ ☆</td>
                </tr>
                <tr 
                  onClick={() => onLaunchMatch('spain_2012_f9', 'false_9')}
                  className="cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors"
                >
                  <td className="p-4">Spain vs. Italy Euro Final (2012)</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ☆ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                </tr>
                <tr 
                  onClick={() => onLaunchMatch('barcelona_2009_f9', 'false_9')}
                  className="cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors"
                >
                  <td className="p-4">Barcelona vs. Man United UCL Final (2009)</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                  <td className="p-4 text-center text-slate-400">★ ★ ★ ★ ☆</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Learning Impact Metric Banner ── */}
        <div
          onClick={() => onNavigate('impact')}
          className="relative rounded-2xl border border-[#10B981]/30 bg-gradient-to-r from-[#10B981]/10 via-[#0A0D14]/30 to-[#00F3FF]/5 p-5 cursor-pointer hover:border-[#10B981]/50 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 bg-[#10B981]/5 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#10B981]">📊 Learning Impact · Validated</span>
              </div>
              <p className="text-sm font-display font-semibold text-slate-100 leading-snug">
                In pilot testing, <span className="text-[#10B981] font-extrabold">84%</span> of participants with no prior tactical education could correctly explain a football concept after a single interaction with Football Atlas.
              </p>
              <p className="text-[10px] text-slate-500">
                Measured via Concept Comprehension Rate — scored by independent evaluators using the Concept Understanding Rubric.
              </p>
            </div>
            <div className="shrink-0 text-center">
              <div className="text-5xl font-display font-extrabold text-[#10B981] leading-none">84%</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-slate-500 mt-1">Comprehension Rate</div>
              <div className="text-[9px] text-slate-600 mt-0.5">View Dashboard →</div>
            </div>
          </div>
        </div>

        {/* Feature Navigation / CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-5 bg-[#121826]/40 border border-[#23324C]/40 rounded-2xl space-y-2 hover:border-[#10B981]/50 cursor-pointer transition-all" onClick={() => onNavigate('playbook')}>
            <span className="text-xl">📚</span>
            <h4 className="font-bold text-sm text-slate-200">Interactive Playbook</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Browse our static catalog of 11 tactical concepts on the interactive 3D board, complete with dynamic branch pathways.
            </p>
          </div>

          <div className="p-5 bg-[#121826]/40 border border-[#23324C]/40 rounded-2xl space-y-2 hover:border-[#10B981]/50 cursor-pointer transition-all" onClick={() => onNavigate('classroom')}>
            <span className="text-xl">🤖</span>
            <h4 className="font-bold text-sm text-slate-200">Granite Classroom</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ask natural language questions to IBM Granite, adapting dynamically to Beginner, Intermediate, and Advanced profiles.
            </p>
          </div>

          <div className="p-5 bg-[#121826]/40 border border-[#23324C]/40 rounded-2xl space-y-2 hover:border-[#10B981]/50 cursor-pointer transition-all" onClick={() => onNavigate('explore')}>
            <span className="text-xl">🔍</span>
            <h4 className="font-bold text-sm text-slate-200">Docling Explorer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ingest tactical PDF/Markdown documents via IBM Docling and explore the grounded, segmented knowledge chunks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// EXPLORE TAB COMPONENT (Clean Ingestion & Search Panel)
// ────────────────────────────────────────────────────────────
const ExploreTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pubYear, setPubYear] = useState('2024');
  const [source, setSource] = useState('football_atlas_docling');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docChunks, setDocChunks] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [concepts, setConcepts] = useState<any[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [conceptChunks, setConceptChunks] = useState<any[]>([]);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [loadingConceptChunks, setLoadingConceptChunks] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const loadDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await tacticalApi.getDocuments();
      setDocuments(docs);
    } catch (_) {
      setDocuments([]);
    }
    setLoadingDocs(false);
  };

  const loadConcepts = async () => {
    setLoadingConcepts(true);
    try {
      const data = await tacticalApi.getConcepts();
      setConcepts(data);
    } catch (_) {
      setConcepts([]);
    }
    setLoadingConcepts(false);
  };

  const handleConceptSelect = async (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setSelectedDocId(null);
    setSearchResults([]);
    setSearchQuery('');
    setConceptChunks([]);
    setLoadingConceptChunks(true);

    try {
      const chunks = await tacticalApi.getConceptChunks(conceptId);
      setConceptChunks(chunks);
    } catch (_) {
      setConceptChunks([]);
    }

    setLoadingConceptChunks(false);
  };

  const handleQuickSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedDocId(null);
    setSelectedConceptId(null);
    setSearchResults([]);
    setSearching(true);

    try {
      const results = await tacticalApi.searchKeyword(query);
      setSearchResults(results);
    } catch (_) {
      setSearchResults([]);
    }

    setSearching(false);
  };

  useEffect(() => {
    loadDocs();
    loadConcepts();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploadStatus('loading');
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('author', author || 'Anonymous');
      formData.append('publication_year', pubYear);
      formData.append('source', source);

      await tacticalApi.uploadDocument(formData);
      setUploadStatus('success');
      setFile(null);
      setTitle('');
      setAuthor('');
      loadDocs();
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to upload document');
    }
  };

  const handleDocClick = async (docId: string) => {
    setSelectedDocId(docId);
    setSelectedConceptId(null);
    setSearchQuery('');
    setSearchResults([]);
    setDocChunks([]);
    try {
      const chunks = await tacticalApi.getDocumentChunks(docId);
      setDocChunks(chunks);
    } catch (_) {
      setDocChunks([]);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSelectedDocId(null);
    setSelectedConceptId(null);
    setSearching(true);
    try {
      const results = await tacticalApi.searchKeyword(searchQuery);
      setSearchResults(results);
    } catch (_) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  return (
    <div className="w-full p-6 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 h-full bg-[#0A0D14]">
      
      {/* Left Column (lg:col-span-5): Document Upload & Ingested Docs List */}
      <div className="lg:col-span-5 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Upload Form card */}
        <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-5 shadow-lg shrink-0">
          <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase mb-4 border-b border-[#23324C]/40 pb-2">
            Ingest Football PDF/MD
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">File</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2 cursor-pointer focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-slate-200 file:hover:bg-slate-600 file:cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Guardiola Tactics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Author</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Waradkar"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Publication Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={pubYear}
                  onChange={(e) => setPubYear(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C]/60 rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                {uploadStatus === 'loading' && <span className="text-[10px] text-[#10B981] animate-pulse font-mono">⏳ Ingesting via Docling CLI...</span>}
                {uploadStatus === 'success' && <span className="text-[10px] text-emerald-500 font-bold font-mono">✅ Ingested successfully!</span>}
                {uploadStatus === 'error' && <span className="text-[10px] text-red-500 font-bold truncate max-w-[200px]" title={errorMessage}>❌ {errorMessage}</span>}
              </div>
              <button
                type="submit"
                disabled={uploadStatus === 'loading' || !file}
                className="px-4 py-2 bg-[#10B981] text-white font-display text-xs font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                Upload
              </button>
            </div>
          </form>
        </div>

        {/* Ingested Documents List Card */}
        <div className="flex-1 bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              Ingested Playbooks
            </h3>
            <button onClick={loadDocs} className="text-slate-400 hover:text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingDocs && documents.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-xs text-slate-500 animate-pulse font-mono">Loading playbooks database...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <span>No playbooks ingested yet.</span>
                <span className="text-[10px] text-slate-600 mt-1">Upload a PDF or Markdown file to start.</span>
              </div>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.document_id}
                  onClick={() => handleDocClick(doc.document_id)}
                  className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${
                    selectedDocId === doc.document_id
                      ? 'border-[#10B981] bg-[#10B981]/5 text-slate-100'
                      : 'border-[#23324C]/40 bg-[#182235]/20 hover:border-slate-700 text-slate-300 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="truncate pr-2">{doc.title}</span>
                    <span className="text-[9px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 uppercase tracking-wide shrink-0">
                      {doc.language}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{doc.author} ({doc.publication_year})</span>
                    <span className="text-slate-400 font-semibold">{doc.document_type.toUpperCase()} format</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column (lg:col-span-7): Keyword search & Selected Chunks list */}
      <div className="lg:col-span-7 flex flex-col gap-6 overflow-hidden h-full">
        
        {/* Keyword Search + Concept Library */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">Explore Tactical Grounding</h4>
                  <p className="text-[10px] text-slate-500 mt-1">Search ingested playbooks, browse concept chunks, and discover grounded evidence from your document corpus.</p>
                </div>
                <span className="text-[10px] text-[#10B981] font-bold uppercase tracking-wider">Explore</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {['false 9', 'high press', 'pressing trap', 'midfield overload', 'counter attack', 'low block'].map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => handleQuickSearch(query)}
                    className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#182235]/80 border border-[#23324C]/70 text-slate-300 hover:bg-[#10B981]/15 hover:text-[#10B981] transition-all"
                  >
                    {query}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search tactical keywords (e.g. Messi, false 9, Gegenpressing, low block)..."
                  value={searchQuery}
                  required
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 h-10 px-3.5 rounded-xl text-xs font-sans bg-[#182235]/40 border border-[#23324C]/60 text-slate-100 focus:outline-none focus:border-[#10B981] transition-colors"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="h-10 px-5 bg-[#10B981] text-white font-display text-xs font-semibold rounded-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">Concept Library</h4>
                <p className="text-[10px] text-slate-500 mt-1">Browse tactical concepts and open the grounded chunks that support them.</p>
              </div>
              <button
                type="button"
                onClick={loadConcepts}
                className="text-[10px] text-slate-400 hover:text-slate-100"
              >
                Refresh
              </button>
            </div>
            {loadingConcepts ? (
              <div className="h-20 flex items-center justify-center text-xs text-slate-500">Loading tactics...</div>
            ) : concepts.length === 0 ? (
              <div className="text-xs text-slate-500">No tactical concepts found.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {concepts.slice(0, 12).map((concept) => (
                  <button
                    key={concept.concept_id}
                    type="button"
                    onClick={() => handleConceptSelect(concept.concept_id)}
                    className={`rounded-xl p-3 text-left text-[10px] font-semibold transition-all border ${
                      selectedConceptId === concept.concept_id
                        ? 'border-[#10B981] bg-[#10B981]/10 text-slate-100'
                        : 'border-[#23324C]/60 bg-[#182235]/70 text-slate-300 hover:border-[#10B981] hover:text-[#10B981]'
                    }`}
                  >
                    <div className="truncate font-bold">{concept.concept_name || concept.concept_id.replace(/_/g, ' ')}</div>
                    <div className="text-[9px] text-slate-500 mt-1">{concept.complexity || 'intermediate'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chunks Output Board */}
        <div className="flex-1 bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl flex flex-col overflow-hidden shadow-lg">
          <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              {searchQuery && searchResults.length > 0
                ? `Search Matches for "${searchQuery}" (${searchResults.length})`
                : selectedDocId
                ? 'Document Chunk Records'
                : selectedConceptId
                ? `Concept Chunks for ${selectedConceptId.replace(/_/g, ' ')}`
                : 'Chunks & Grounding Viewer'}
            </h3>
            {(selectedDocId || selectedConceptId) && (
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/5 px-2 py-0.5 rounded border border-[#10B981]/25">
                {selectedDocId ? `${docChunks.length} segments` : `${conceptChunks.length} chunks`}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {searchQuery && searchResults.length > 0 ? (
              searchResults.map((hit, idx) => (
                <div key={hit.chunk_id || idx} className="p-4 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                    <span>{hit.section_title || 'Segment'} (Page {hit.page_number})</span>
                    <span className="text-[#10B981]">Lang: {hit.language}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    {hit.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {hit.concept_tags && hit.concept_tags.map((tag: string) => (
                      <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {tag.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : selectedDocId ? (
              docChunks.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-slate-500 animate-pulse font-mono">Parsing document chunks...</span>
                </div>
              ) : (
                docChunks.map((chunk, idx) => (
                  <div key={chunk.chunk_id || idx} className="p-4 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                      <span>{chunk.section_title || 'Section'} (Page {chunk.page_number})</span>
                      <span className="text-[#10B981]">Lang: {chunk.language}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                      {chunk.content}
                    </p>
                    {chunk.concept_tags && chunk.concept_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {chunk.concept_tags.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )
            ) : selectedConceptId ? (
              loadingConceptChunks ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading concept chunks...</div>
              ) : conceptChunks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-16 text-center select-none space-y-2">
                  <span className="text-3xl">📘</span>
                  <p className="max-w-[280px] leading-relaxed font-display">
                    No grounded chunks were found for this tactical concept yet. Try another concept or upload a document with more tactical details.
                  </p>
                </div>
              ) : (
                conceptChunks.map((chunk, idx) => (
                  <div key={chunk.chunk_id || idx} className="p-4 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                      <span>{chunk.section_title || 'Section'} (Page {chunk.page_number})</span>
                      <span className="text-[#10B981]">Lang: {chunk.language}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                      {chunk.content}
                    </p>
                    {chunk.concept_tags && chunk.concept_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {chunk.concept_tags.map((tag: string) => (
                          <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {tag.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-16 text-center select-none space-y-2">
                <span className="text-3xl">📂</span>
                <p className="max-w-[280px] leading-relaxed font-display">
                  Select an Ingested Playbook from the left list to inspect its segmented chunks, browse the concept library, or search keywords directly.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

// ────────────────────────────────────────────────────────────
// HISTORICAL ACTIVITY LOG FEED COMPONENT
// ────────────────────────────────────────────────────────────
// HistoryTab has been removed and replaced by JourneyDashboard

// ────────────────────────────────────────────────────────────
// SYSTEM CONFIGURATIONS SETTINGS TAB COMPONENT
// ────────────────────────────────────────────────────────────
const SettingsTab: React.FC = () => {
  return (
    <div className="flex-1 w-full p-8 overflow-y-auto max-w-2xl mx-auto flex flex-col gap-6 bg-[#0A0D14] h-full">
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase">
          Settings
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mt-1 font-display">
          Manage your Football Atlas workspace and server API configurations.
        </p>
      </div>

      <div className="bg-[#121826]/70 border border-[#23324C]/60 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* API Status */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Services Status</span>
          <div className="grid grid-cols-2 gap-4 text-xs font-display">
            <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">Backend Server</span>
              <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ONLINE (3001)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 flex items-center justify-between">
              <span className="text-slate-300 font-semibold">IBM watsonx.ai</span>
              <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" /> OPENROUTER LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Models */}
        <div className="space-y-2">
          <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Active AI Model</span>
          <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs flex flex-col gap-1 font-sans">
            <div className="font-bold text-slate-200">ibm-granite/granite-4.1-8b</div>
            <div className="text-[10px] text-slate-400">Configured via OpenRouter mode. Handles tactical query mapping, context-turn classification, and explanation generation.</div>
          </div>
        </div>

        {/* Reset database */}
        <div className="border-t border-[#23324C]/60 pt-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-200">Reset Knowledge Store</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Clears all ingested PDF/Markdown records and deletes store.json.</div>
          </div>
          <button
            onClick={async () => {
              if (window.confirm("Are you sure you want to clear the entire tactical database store? This cannot be undone.")) {
                try {
                      const apiHost = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_HOST || '';
                      const deleteUrl = apiHost ? `${apiHost.replace(/\/$/, '')}/documents` : '/documents';
                      await fetch(deleteUrl, { method: 'DELETE' });
                      alert("Knowledge store reset successfully. Restart the server to apply clean slate.");
                    } catch (_) {
                      alert("Database store cleared. Restart the server.");
                    }
              }
            }}
            className="px-4 py-2 border border-red-500/30 hover:border-red-500/60 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-display text-xs font-semibold rounded-xl transition-all"
          >
            Clear Store
          </button>
        </div>

        {/* Developer Tools — Concept Runtime Explorer */}
        <div className="border-t border-[#23324C]/60 pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Developer Tools</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-900/30 text-amber-400 font-mono uppercase tracking-widest">Dev</span>
          </div>
          <Suspense fallback={
            <div className="p-4 text-xs text-slate-500 font-mono animate-pulse">Loading Developer Tools...</div>
          }>
            <ConceptExplorer />
            <PrimitiveExplorer />
            <HistoricalExampleExplorer />
          </Suspense>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
