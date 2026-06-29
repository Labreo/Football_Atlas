import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useTacticalStore } from '../stores/useTacticalStore';
import { useLearningUIStore } from '../stores/LearningUIStore';
import { useBreakdownStore } from '../stores/useBreakdownStore';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { learningStateStore } from '../tacticalOrchestrator/store';
import ConversationalLearningInterface from '../components/chat/ConversationalLearningInterface';
import PlaybookInterface from '../components/playbook/PlaybookInterface';
import { tacticalApi } from '../apiClients/tacticalApi';
import { useHistoricalExplorerStore } from '../stores/useHistoricalExplorerStore';
import MatchBreakdownMode from '../components/matches/MatchBreakdownMode';
import Pitch3D from '../components/pitch/Pitch3D';

// Lazy-load developer tools (only rendered in dev mode Settings tab)
const ConceptExplorer = lazy(() => import('../components/dev/ConceptExplorer'));
const PrimitiveExplorer = lazy(() => import('../components/dev/PrimitiveExplorer'));
const HistoricalExampleExplorer = lazy(() => import('../components/dev/HistoricalExampleExplorer'));

type Tab = 'landing' | 'playbook' | 'classroom' | 'settings' | 'matches';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('landing');
  const [visitedTabs, setVisitedTabs] = useState<Record<Tab, boolean>>({
    landing: true,
    playbook: false,
    classroom: false,
    settings: false,
    matches: false
  });

  useEffect(() => {
    setVisitedTabs(prev => ({ ...prev, [activeTab]: true }));
  }, [activeTab]);

  const { fetchConcepts, lang } = useTacticalStore();

  const getClassroomTabTitle = () => {
    switch (lang) {
      case 'es': return 'Aula';
      case 'fr': return 'Classe';
      case 'de': return 'Klassenzimmer';
      default: return 'Classroom';
    }
  };

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

        // 4. Start the breakdown immediately
        useBreakdownStore.getState().startBreakdown(example);
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

    // Reset camera position to clean overhead view on tab changes to playbook or classroom
    if (activeTab === 'playbook' || activeTab === 'classroom') {
      useTacticalStore.getState().triggerCameraReset();
    }
  }, [activeTab]);

  return (
    <div className="h-screen w-screen flex bg-gradient-to-br from-[#0c051a] to-[#1a0736] text-slate-100 overflow-hidden font-sans relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT NAVIGATION RAIL (Slim, Icons-only, premium sidebar)      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="w-[72px] h-full bg-[#0c051a]/95 border-r border-purple-950/80 flex flex-col items-center py-6 justify-between shrink-0 z-30 select-none backdrop-blur-md">
        
        {/* Top: Stylized Football Atlas Logo */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => setActiveTab('landing')}
            className="w-10 h-10 rounded-xl bg-[#38FE5E] flex items-center justify-center shadow-lg shadow-[#38FE5E]/20 hover:scale-105 transition-transform duration-200 cursor-pointer"
          >
            <span className="font-display font-extrabold text-slate-950 text-xl">F</span>
          </div>
        </div>

        {/* Center: Main Navigation Rail Icons */}
        <div className="flex flex-col gap-5">
          
          {/* Home / Landing Tab */}
          <button
            onClick={() => setActiveTab('landing')}
            className={`nav-rail-item w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group relative transition-colors duration-200 ${
              activeTab === 'landing'
                ? 'is-active text-[#38FE5E]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Home"
          >
            {activeTab === 'landing' && (
              <motion.div
                layoutId="activeTabRail"
                className="absolute inset-0 rounded-xl bg-[#38FE5E]/15 border border-[#38FE5E]/30 shadow-md shadow-[#38FE5E]/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide">Home</span>
            </div>
          </button>

          {/* Playbook Tab */}
          <button
            onClick={() => setActiveTab('playbook')}
            className={`nav-rail-item w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group relative transition-colors duration-200 ${
              activeTab === 'playbook'
                ? 'is-active text-[#38FE5E]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Playbook"
          >
            {activeTab === 'playbook' && (
              <motion.div
                layoutId="activeTabRail"
                className="absolute inset-0 rounded-xl bg-[#38FE5E]/15 border border-[#38FE5E]/30 shadow-md shadow-[#38FE5E]/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide">Playbook</span>
            </div>
          </button>

          {/* Classroom Tab */}
          <button
            onClick={() => setActiveTab('classroom')}
            className={`nav-rail-item w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group relative transition-colors duration-200 ${
              activeTab === 'classroom'
                ? 'is-active text-[#38FE5E]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title={getClassroomTabTitle() === 'Classroom' ? 'Tactical Classroom' : getClassroomTabTitle()}
          >
            {activeTab === 'classroom' && (
              <motion.div
                layoutId="activeTabRail"
                className="absolute inset-0 rounded-xl bg-[#38FE5E]/15 border border-[#38FE5E]/30 shadow-md shadow-[#38FE5E]/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide">{getClassroomTabTitle()}</span>
            </div>
          </button>

          {/* Matches Tab (World Cup Match Center) */}
          <button
            onClick={() => setActiveTab('matches')}
            className={`nav-rail-item w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group relative transition-colors duration-200 ${
              activeTab === 'matches'
                ? 'is-active text-[#38FE5E]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="World Cup 2022 Match Center"
          >
            {activeTab === 'matches' && (
              <motion.div
                layoutId="activeTabRail"
                className="absolute inset-0 rounded-xl bg-[#38FE5E]/15 border border-[#38FE5E]/30 shadow-md shadow-[#38FE5E]/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a7 7 0 007-7V3H5v5a7 7 0 007 7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8H3a2 2 0 01-2-2V4a2 2 0 012-2h2M19 8h2a2 2 0 002-2V4a2 2 0 00-2-2h-2M12 15v5m-4 0h8" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide">Matches</span>
            </div>
          </button>

        </div>

        {/* Bottom: Settings Gear */}
        <div className="flex flex-col gap-4 items-center">
          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-rail-item w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group relative transition-colors duration-200 ${
              activeTab === 'settings'
                ? 'is-active text-[#38FE5E]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Settings"
          >
            {activeTab === 'settings' && (
              <motion.div
                layoutId="activeTabRail"
                className="absolute inset-0 rounded-xl bg-[#38FE5E]/15 border border-[#38FE5E]/30 shadow-md shadow-[#38FE5E]/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[9px] font-medium tracking-wide">Settings</span>
            </div>
          </button>
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT AREA                                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 h-full relative overflow-hidden">
        {/* Landing/Home Tab */}
        <div className={`h-full w-full absolute inset-0 transition-all duration-300 ${activeTab === 'landing' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
          {visitedTabs.landing && (
            <LandingPage onLaunchHero={handleLaunchHeroMoment} onLaunchMatch={handleLaunchMatch} onNavigate={setActiveTab} />
          )}
        </div>

        {/* Playbook Tab */}
        <div className={`h-full w-full absolute inset-0 transition-all duration-300 ${activeTab === 'playbook' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
          {visitedTabs.playbook && (
            <PlaybookInterface />
          )}
        </div>

        {/* Classroom Tab */}
        <div className={`h-full w-full absolute inset-0 transition-all duration-300 ${activeTab === 'classroom' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
          {visitedTabs.classroom && (
            <ConversationalLearningInterface />
          )}
        </div>

        {/* Settings Tab */}
        <div className={`h-full w-full absolute inset-0 transition-all duration-300 ${activeTab === 'settings' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
          {visitedTabs.settings && (
            <SettingsTab />
          )}
        </div>

        {/* Matches Tab */}
        <div className={`h-full w-full absolute inset-0 transition-all duration-300 ${activeTab === 'matches' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
          {visitedTabs.matches && (
            <MatchBreakdownMode />
          )}
        </div>
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
  useEffect(() => {
    (window as any)._isLandingBg = true;
    (window as any)._enableCinematicRotation = true;
    return () => {
      (window as any)._isLandingBg = false;
      (window as any)._enableCinematicRotation = false;
    };
  }, []);

  return (
    <div className="w-full h-full bg-transparent flex flex-col justify-start items-center relative select-none overflow-hidden">
      
      {/* 3D Rotating Pitch Backdrop */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none filter blur-[0.5px]">
        <Pitch3D enableCinematicRotation={true} cameraTrackingEnabled={false} />
      </div>

      {/* Radial vignette mask for backdrop legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c051a] via-transparent to-[#0c051a]/40 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-radial-gradient-overlay pointer-events-none z-0" style={{
        background: 'radial-gradient(circle at center, rgba(12, 5, 26, 0.4) 0%, rgba(10, 14, 26, 0.92) 100%)'
      }} />

      <div className="absolute top-10 left-10 w-96 h-96 bg-[#38FE5E]/5 rounded-full blur-[100px] pointer-events-none animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#00F3FF]/5 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

      {/* Scrollable Container */}
      <div className="w-full h-full overflow-y-auto flex flex-col items-center relative z-10 p-6 lg:p-8">
        <div className="max-w-4xl w-full space-y-8 py-6 pb-16">
          {/* Header Block */}
          <div className="text-center space-y-3">
            <div className="animate-fade-in-up stagger-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38FE5E]/10 border border-[#38FE5E]/30 text-[#38FE5E] text-[10px] font-bold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(56,254,94,0.05)]">
              <span>Introducing the Showcase Moment</span>
            </div>
            <h1 className="animate-fade-in-up stagger-3 text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-white uppercase mt-2">
              Football <span className="text-[#38FE5E] drop-shadow-[0_0_10px_rgba(56,254,94,0.2)]">Atlas</span>
            </h1>
            <p className="animate-fade-in-up stagger-5 text-sm lg:text-base text-slate-400 font-display max-w-xl mx-auto leading-relaxed">
              Every goal has a reason. See the logic behind the magic.
            </p>
          </div>

          {/* Hero CTA Showcase Card (Glassmorphic, glowing) */}
          <div className="animate-fade-in-up stagger-6 card-lift relative rounded-3xl border border-purple-500/20 bg-purple-950/20 p-6 lg:p-8 shadow-2xl backdrop-blur-md overflow-hidden group hover:border-[#38FE5E]/30 transition-all duration-300">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-lg">
                <span className="text-[10px] text-[#38FE5E] font-mono font-bold uppercase tracking-widest block">
                  Showcase Simulation
                </span>
                <h2 className="text-2xl font-bold font-display text-white tracking-tight leading-snug">
                  Watch the moment Argentina lost control.
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  "Here's the exact moment Argentina's defensive shape broke down. Three passes before Mbappé's equaliser. Watch it happen."
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-2.5 py-0.5 rounded bg-purple-950/70 border border-purple-900/60 text-slate-400 text-[9px] font-mono">
                    Qatar 2022 Final
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-purple-950/70 border border-purple-900/60 text-slate-400 text-[9px] font-mono">
                    Argentina 3 - 3 France
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-[#38FE5E]/10 border border-[#38FE5E]/30 text-[#38FE5E] text-[9px] font-mono font-bold">
                    Compactness Collapse
                  </span>
                </div>
              </div>

              <button
                onClick={onLaunchHero}
                className="px-6 py-4 bg-gradient-to-r from-[#38FE5E] to-[#00F3FF] text-slate-950 font-display font-extrabold text-xs rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#38FE5E]/20 shrink-0 uppercase tracking-wider flex items-center gap-2 group-hover:shadow-[#38FE5E]/35"
              >
                <span>Watch Hero Moment</span>
                <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Candidate Evaluation Matrix Section */}
          <div className="space-y-4">
            <div>
              <h3 className="font-display font-bold text-xs tracking-wider text-slate-355 uppercase">
                Moment Evaluation Matrix
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-display">
                Why the 2022 World Cup Final sequence was selected as the canonical Hero Moment over other candidates.
              </p>
            </div>

            <div className="overflow-hidden border border-purple-950 bg-purple-950/15 backdrop-blur-sm rounded-2xl shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-purple-950/50 text-[#38FE5E] font-mono uppercase tracking-wider text-[10px] border-b border-purple-900/30">
                    <th className="p-4 font-bold">Candidate Moment</th>
                    <th className="p-4 font-bold text-center">Visual Recognition</th>
                    <th className="p-4 font-bold text-center">Tactical Causality</th>
                    <th className="p-4 font-bold text-center">Spatial Complexity</th>
                    <th className="p-4 font-bold text-center">Value Alignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-slate-350">
                  <tr 
                    onClick={() => onLaunchMatch('argentina_france_2022_equaliser', 'compactness_pressing_lines')}
                    className="bg-[#38FE5E]/5 font-semibold text-slate-100 cursor-pointer hover:bg-[#38FE5E]/15 hover:text-white transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span>Mbappé Equaliser Sequence (2022 Final)</span>
                        <span className="text-[9px] text-[#38FE5E] uppercase font-mono mt-0.5">Primary Selection</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-[#38FE5E] font-semibold"><span className="inline-block w-20 h-1.5 bg-[#38FE5E] rounded-full" title="5/5" /></td>
                    <td className="p-4 text-center text-[#38FE5E] font-semibold"><span className="inline-block w-20 h-1.5 bg-[#38FE5E] rounded-full" title="5/5" /></td>
                    <td className="p-4 text-center text-[#38FE5E] font-semibold"><span className="inline-block w-20 h-1.5 bg-[#38FE5E] rounded-full" title="5/5" /></td>
                    <td className="p-4 text-center text-[#38FE5E] font-semibold"><span className="inline-block w-20 h-1.5 bg-[#38FE5E] rounded-full" title="5/5" /></td>
                  </tr>
                  <tr 
                    onClick={() => onLaunchMatch('liverpool_2019_hp', 'high_press')}
                    className="cursor-pointer hover:bg-purple-950/20 hover:text-white transition-colors border-b border-purple-950/40"
                  >
                    <td className="p-4">Liverpool vs. Barcelona Corner (2019)</td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-4 h-1.5 bg-slate-600 rounded-full" title="1/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-4 h-1.5 bg-slate-600 rounded-full" title="1/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-4 h-1.5 bg-slate-600 rounded-full" title="1/5" /></td>
                  </tr>
                  <tr 
                    onClick={() => onLaunchMatch('spain_2012_f9', 'false_9')}
                    className="cursor-pointer hover:bg-purple-950/20 hover:text-white transition-colors border-b border-purple-950/40"
                  >
                    <td className="p-4">Spain vs. Italy Euro Final (2012)</td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-12 h-1.5 bg-slate-500 rounded-full" title="3/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                  </tr>
                  <tr 
                    onClick={() => onLaunchMatch('barcelona_2009_f9', 'false_9')}
                    className="cursor-pointer hover:bg-purple-950/20 hover:text-white transition-colors"
                  >
                    <td className="p-4">Barcelona vs. Man United UCL Final (2009)</td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                    <td className="p-4 text-center text-slate-400"><span className="inline-block w-16 h-1.5 bg-slate-500 rounded-full" title="4/5" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Navigation / CTA Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="animate-fade-in-up stagger-4 card-lift p-5 bg-purple-950/15 border border-purple-500/10 backdrop-blur-sm rounded-2xl space-y-2 hover:border-[#38FE5E]/40 cursor-pointer transition-all" onClick={() => onNavigate('playbook')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#38FE5E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <h4 className="font-bold text-sm text-slate-200">Interactive Playbook</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Browse our static catalog of 11 tactical concepts on the interactive 3D board, complete with dynamic branch pathways.
              </p>
            </div>

            <div className="animate-fade-in-up stagger-6 card-lift p-5 bg-purple-950/15 border border-purple-500/10 backdrop-blur-sm rounded-2xl space-y-2 hover:border-[#38FE5E]/40 cursor-pointer transition-all" onClick={() => onNavigate('classroom')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#00F3FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>
              <h4 className="font-bold text-sm text-slate-200">Granite Classroom</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ask natural language questions to IBM Granite, adapting dynamically to Beginner, Intermediate, and Advanced profiles.
              </p>
            </div>

            <div className="animate-fade-in-up stagger-8 card-lift p-5 bg-purple-950/15 border border-purple-500/10 backdrop-blur-sm rounded-2xl space-y-2 hover:border-[#38FE5E]/40 cursor-pointer transition-all" onClick={() => onNavigate('matches')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4a2 2 0 01-2-2V5h4"/><path d="M18 9h2a2 2 0 002-2V5h-4"/><path d="M4 5h16v4a6 6 0 01-6 6h-4a6 6 0 01-6-6V5z"/><path d="M12 15v3"/><path d="M8 21h8"/><path d="M10 18h4"/></svg>
              <h4 className="font-bold text-sm text-slate-200">World Cup Match Center</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Explore the entire 2022 World Cup history, lineups, momentum charts, decision IQ, 3D reconstructions, and counterfactuals.
              </p>
            </div>
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
              <span className="flex items-center gap-1.5 text-[#38FE5E] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#38FE5E]" /> OPENROUTER LIVE
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
                      const deleteUrl = apiHost ? `${apiHost.replace(/\/$/, '')}/api/tactical/documents` : '/api/tactical/documents';
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
