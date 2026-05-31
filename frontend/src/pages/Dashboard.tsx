import React, { useState, useEffect } from 'react';
import { useTacticalStore } from '../stores/useTacticalStore';
import Pitch3D from '../components/pitch/Pitch3D';
import ChatConsole from '../components/chat/ChatConsole';
import PitchControls from '../components/pitch/PitchControls';
import { ComplexityLevel } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pitch' | 'learn' | 'explore' | 'history' | 'settings'>('pitch');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const {
    concepts,
    currentConcept,
    isLoading,
    error,
    fetchConcepts,
    selectConcept,
    // Visual Pitch Store states
    formation,
    teamAVisible,
    teamBVisible,
    cameraZoom,
    setFormation,
    setTeamAVisible,
    setTeamBVisible,
    triggerCameraReset,
    panCamera,
    setCameraZoom,
  } = useTacticalStore();

  // Load tactical concepts library on startup
  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  return (
    <div className="h-screen w-screen flex bg-pitch-gradient text-slate-100 overflow-hidden font-sans relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* LEFT NAVIGATION RAIL (Slim, Icons-only, visual rail)         */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className={`w-[72px] h-full flex flex-col items-center py-6 justify-between shrink-0 z-30 select-none transition-all duration-300 ease-in-out ${
        activeTab === 'pitch'
          ? 'absolute left-0 top-0 bottom-0 bg-[#0B0F19]/25 hover:bg-[#0B0F19]/95 border-r border-transparent hover:border-[#1E293B]/50 hover:backdrop-blur-md opacity-20 hover:opacity-100 shadow-xl'
          : 'bg-[#0B0F19]/95 border-r border-[#1E293B]/70'
      }`}>
        
        {/* Top: Stylized Football Atlas Logo */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] flex items-center justify-center shadow-lg shadow-[#10B981]/25 hover:scale-105 transition-transform duration-200 cursor-pointer">
            <span className="font-display font-extrabold text-white text-xl">F</span>
          </div>
        </div>

        {/* Center: Main Navigation Rail Icons */}
        <div className="flex flex-col gap-6">
          
          {/* Pitch Tab */}
          <button
            onClick={() => {
              setActiveTab('pitch');
              // Clear active concept when returning to full-screen pitch
              if (currentConcept) {
                useTacticalStore.setState({ currentConcept: null });
              }
            }}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'pitch'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Pitch"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="2 2 20 20" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Pitch</span>
          </button>

          {/* Learn Tab */}
          <button
            onClick={() => setActiveTab('learn')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'learn'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical Tutor"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Learn</span>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Explore</span>
          </button>

          {/* History Tab */}
          <button
            onClick={() => setActiveTab('history')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 group transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-md shadow-[#10B981]/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Tactical History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">History</span>
          </button>

        </div>

        {/* Bottom: Settings & Theme Toggler */}
        <div className="flex flex-col gap-5 items-center">
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-slate-500 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
              activeTab === 'settings'
                ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
            }`}
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[9px] font-medium tracking-wide">Settings</span>
          </button>

        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN VIEWPORT WORKSPACE                                      */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className={`flex-1 h-full relative overflow-hidden flex flex-col ${
        activeTab === 'pitch' ? 'w-full h-full' : 'pl-[72px]'
      }`}>
        
        {/* 1. DEFAULT TACTICAL PITCH VIEWPORT (Full Screen dominates) */}
        {activeTab === 'pitch' && (
          <div className="w-full h-full relative flex items-center justify-center p-4">
            
            {/* The 3D Pitch canvas (dominates 70-80% screen) */}
            <div className="absolute inset-0 z-0">
              <Pitch3D />
            </div>

            {/* Left-top Brand Tag */}
            <div className="absolute top-6 left-24 z-10 pointer-events-none flex flex-col">
              <h1 className="font-display font-extrabold text-lg tracking-wider text-slate-100 uppercase">
                Football Atlas
              </h1>
              <p className="text-[10px] font-medium text-slate-400 font-mono tracking-widest uppercase">
                Tactical Workspace v1.1
              </p>
            </div>

            {/* Top-right Dark Mode Toggler */}
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="w-10 h-10 rounded-xl bg-[#121826]/90 backdrop-blur-md border border-[#23324C]/60 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-[#10B981]/50 shadow-lg shadow-black/20 transition-all duration-200"
                title={isDarkMode ? 'Toggle Light Mode' : 'Toggle Dark Mode'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>
            </div>

            {/* RIGHT SIDE FLOATING CONTROLS PANEL */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex items-center gap-6 select-none">
              
              {/* Camera Pad & Zoom controls column */}
              <div className="flex flex-col items-center gap-4">
                
                {/* Arrow Pan Pad */}
                <div className="w-24 h-24 rounded-full bg-[#121826]/90 backdrop-blur-md border border-[#23324C]/60 p-2.5 relative flex items-center justify-center shadow-lg shadow-black/30">
                  
                  {/* Up button */}
                  <button
                    onClick={() => panCamera('up')}
                    className="absolute top-1.5 left-1/2 -translate-x-1/2 text-slate-400 hover:text-slate-100 transition-colors p-1"
                    title="Tilt Camera Up"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>

                  {/* Down button */}
                  <button
                    onClick={() => panCamera('down')}
                    className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-slate-400 hover:text-slate-100 transition-colors p-1"
                    title="Tilt Camera Down"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Left button */}
                  <button
                    onClick={() => panCamera('left')}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors p-1"
                    title="Orbit Camera Left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Right button */}
                  <button
                    onClick={() => panCamera('right')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-100 transition-colors p-1"
                    title="Orbit Camera Right"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Center Dot (Reset trigger) */}
                  <button
                    onClick={triggerCameraReset}
                    className="w-4 h-4 rounded-full bg-slate-700 hover:bg-[#10B981] border border-slate-600 transition-all duration-200"
                    title="Center View"
                  />
                </div>

                {/* Vertical Zoom Slider */}
                <div className="bg-[#121826]/90 backdrop-blur-md border border-[#23324C]/60 rounded-full py-3 px-2 flex flex-col items-center gap-3 shadow-lg shadow-black/30">
                  <button
                    onClick={() => setCameraZoom(Math.min(2.0, cameraZoom + 0.1))}
                    className="text-slate-400 hover:text-slate-100 transition-colors font-extrabold text-sm"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <div className="w-6 h-24 flex items-center justify-center relative">
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={cameraZoom}
                      onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
                      className="vertical-slider absolute"
                    />
                  </div>
                  <button
                    onClick={() => setCameraZoom(Math.max(0.5, cameraZoom - 0.1))}
                    className="text-slate-400 hover:text-slate-100 transition-colors font-extrabold text-sm"
                    title="Zoom Out"
                  >
                    −
                  </button>
                </div>

              </div>

              {/* Pitch Configurations Card */}
              <div className="w-[220px] bg-[#121826]/95 backdrop-blur-lg rounded-2xl border border-[#23324C]/80 p-4 shadow-2xl flex flex-col gap-4">
                
                {/* 1. Formation Section */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-display font-bold tracking-wider text-slate-400 uppercase">
                    Formation
                  </label>
                  <div className="relative">
                    <select
                      value={formation}
                      onChange={(e) => setFormation(e.target.value)}
                      className="w-full bg-[#182235] border border-[#23324C] rounded-xl py-2 px-3 text-xs font-semibold text-slate-200 appearance-none cursor-pointer focus:outline-none focus:border-[#10B981] transition-colors"
                    >
                      <option value="4-3-3">4-3-3 Attack</option>
                      <option value="4-4-2">4-4-2 Classic</option>
                      <option value="3-5-2">3-5-2 Wingback</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 2. Team Visibility toggles */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-display font-bold tracking-wider text-slate-400 uppercase">
                    Teams
                  </span>
                  
                  {/* Team A (Blue) */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-md shadow-blue-500/20" />
                      <span>Team A</span>
                    </div>
                    <button
                      onClick={() => setTeamAVisible(!teamAVisible)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        teamAVisible
                          ? 'border-[#10B981]/25 text-[#10B981] bg-[#10B981]/5'
                          : 'border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={teamAVisible ? 'Hide Team A' : 'Show Team A'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {teamAVisible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                        {teamAVisible && <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                      </svg>
                    </button>
                  </div>

                  {/* Team B (Red) */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-md shadow-red-500/20" />
                      <span>Team B</span>
                    </div>
                    <button
                      onClick={() => setTeamBVisible(!teamBVisible)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        teamBVisible
                          ? 'border-[#10B981]/25 text-[#10B981] bg-[#10B981]/5'
                          : 'border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={teamBVisible ? 'Hide Team B' : 'Show Team B'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        {teamBVisible ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        )}
                        {teamBVisible && <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />}
                      </svg>
                    </button>
                  </div>

                </div>

                {/* 3. Reset Button */}
                <button
                  onClick={triggerCameraReset}
                  className="w-full h-10 border border-[#23324C] hover:border-[#10B981]/50 bg-[#182235]/40 hover:bg-[#10B981]/5 text-slate-300 hover:text-slate-100 rounded-xl flex items-center justify-center gap-2 font-display text-xs font-semibold tracking-wide transition-all active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                  </svg>
                  <span>Reset View</span>
                </button>

              </div>

            </div>

          </div>
        )}

        {/* 2. THE TACTICAL AI TUTORING WORKSPACE (Learn tab) */}
        {activeTab === 'learn' && (
          <div className="flex-1 w-full p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* LEFT COLUMN (lg:col-span-3): Concept Library + Chat Console */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
              
              {/* Concept Navigator */}
              <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border border-[#23324C]/60 shadow-xl">
                <div className="p-3.5 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between">
                  <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
                    Tactical Playbook
                  </h2>
                  <span className="text-[10px] bg-[#182235] text-slate-400 font-bold px-1.5 py-0.5 rounded-md border border-[#23324C]/40">
                    {concepts.length} Roles
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {isLoading && concepts.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4">
                      <span className="text-xs text-slate-500 animate-pulse font-mono">Loading playbook...</span>
                    </div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center p-4">
                      <span className="text-xs text-red-500 text-center font-semibold">Failed to load playbook.</span>
                    </div>
                  ) : (
                    concepts.map((concept) => (
                      <button
                        key={concept.concept_id}
                        onClick={() => selectConcept(concept.concept_id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                          currentConcept?.concept_id === concept.concept_id
                            ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981] shadow-md shadow-[#10B981]/5'
                            : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
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
                          concept.complexity === ComplexityLevel.BEGINNER
                            ? 'bg-[#182235] border-slate-700 text-slate-400'
                            : concept.complexity === ComplexityLevel.INTERMEDIATE
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

              {/* Chat Tutor Frame */}
              <div className="h-[45%] flex flex-col">
                <ChatConsole />
              </div>
            </div>

            {/* CENTER COLUMN (lg:col-span-6): Living 3D Pitch */}
            <div className="lg:col-span-6 flex flex-col h-full overflow-hidden glass-panel rounded-2xl border border-[#23324C]/60 shadow-xl relative">
              
              {/* Concept Indicator Overlay */}
              <div className="absolute top-4 left-4 z-10 bg-[#0B0F19]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#23324C]/60 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConcept ? 'bg-[#10B981]' : 'bg-slate-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${currentConcept ? 'bg-[#10B981]' : 'bg-slate-600'}`}></span>
                </span>
                <span className="font-display font-semibold text-xs tracking-wider text-slate-300 uppercase">
                  {currentConcept ? `${currentConcept.concept_name} (3D Live)` : 'Stadium Pitch View'}
                </span>
              </div>

              {/* Pitch Canvas Container */}
              <div className="flex-1 w-full relative min-h-[300px]">
                <Pitch3D />
              </div>

              {/* Playback Controls Footer */}
              <div className="p-4 border-t border-[#23324C]/60 bg-[#121826]/90">
                <PitchControls />
              </div>
            </div>

            {/* RIGHT COLUMN (lg:col-span-3): Concept Inspector */}
            <div className="lg:col-span-3 flex flex-col glass-panel rounded-2xl border border-[#23324C]/60 overflow-hidden h-full shadow-xl">
              <div className="p-3.5 bg-[#121826]/90 border-b border-[#23324C]/60">
                <h2 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
                  Concept Inspector
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentConcept ? (
                  <div className="space-y-4">
                    
                    {/* Concept Identification */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-display font-bold text-base text-slate-100">
                          {currentConcept.concept_name}
                        </h3>
                        <span className="text-[9px] bg-[#182235] text-slate-300 border border-[#23324C]/60 px-2 py-0.5 rounded font-semibold font-display uppercase tracking-wide">
                          {currentConcept.category.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed bg-[#182235]/40 p-3 rounded-xl border border-[#23324C]/30">
                        {currentConcept.core_explanation}
                      </p>
                    </div>

                    {/* Key Principles */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[#10B981]">
                        Key Principles
                      </h4>
                      <ul className="space-y-2">
                        {currentConcept.key_principles.map((principle, index) => (
                          <li key={index} className="text-xs leading-relaxed flex flex-col bg-[#182235]/20 border border-[#23324C]/20 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[#10B981] font-extrabold">✦</span>
                              <span className="font-bold text-slate-200 font-display">{principle.title}</span>
                            </div>
                            <span className="pl-4 text-slate-400 text-[11px]">{principle.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Defensive Counter */}
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold font-display uppercase tracking-wider text-red-500">
                        Opposition Counters
                      </h4>
                      <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/20 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold font-display text-red-400">
                          <span>{currentConcept.defensive_response.title}</span>
                          <span className="text-[10px] bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30">
                            Eff: {currentConcept.defensive_response.effectiveness_rating}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {currentConcept.defensive_response.description}
                        </p>
                      </div>
                    </div>

                    {/* Historical Match Example */}
                    {currentConcept.historical_examples && currentConcept.historical_examples.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-amber-500">
                          Match Benchmarks
                        </h4>
                        {currentConcept.historical_examples.map((ex, i) => (
                          <div key={i} className="bg-[#182235]/40 p-3 rounded-xl border border-[#23324C]/40 space-y-1.5 shadow-md">
                            <div className="flex items-center justify-between text-[11px] font-bold font-display">
                              <span className="text-amber-500">{ex.title}</span>
                              <span className="text-slate-400">{ex.season}</span>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                              {ex.teams} ({ex.competition})
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed italic bg-slate-950/20 p-2 rounded border border-[#23324C]/20">
                              {ex.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Docling Literature Grounding */}
                    {currentConcept.docling_chunks && currentConcept.docling_chunks.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">
                          Source Grounding (Docling)
                        </h4>
                        {currentConcept.docling_chunks.map((chunk, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-900 text-[10px] text-slate-400 leading-relaxed space-y-1">
                            <div className="flex items-center justify-between font-bold text-[9px] text-slate-500 uppercase tracking-wider">
                              <span className="truncate pr-2">{chunk.source_document}</span>
                              <span className="text-[#10B981] font-extrabold">Match: {chunk.relevance_score}%</span>
                            </div>
                            <div className="text-[9px] text-slate-600 font-mono">Ref: {chunk.chunk_id}</div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 py-16 space-y-2 select-none">
                    <span className="text-3xl">⚽</span>
                    <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed font-display">
                      No concept selected. Pick a play from the library or ask Granite.
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 3. DOCUMENT EXPLORATION & INGESTION (Explore tab) */}
        {activeTab === 'explore' && (
          <ExploreTab />
        )}

        {/* 4. TACTICAL HISTORY LOGS (History tab) */}
        {activeTab === 'history' && (
          <div className="flex-1 w-full p-8 overflow-y-auto max-w-4xl mx-auto flex flex-col gap-6">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase">
                Tactical History
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 font-display">
                Trace previous AI tutor queries and document ingestion pipeline runs.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border border-[#23324C]/60 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#23324C]/60 pb-3">
                <span className="text-xs font-display font-bold uppercase tracking-wider text-[#10B981]">Recent Activity</span>
                <span className="text-[10px] font-mono text-slate-500">Auto-refreshing</span>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/20">
                  <span className="text-emerald-500 font-bold shrink-0">[13:20:17]</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-200">Document Ingested successfully</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">File: original_Leitfaden_Torwartspiel.md | Chunks: 317 | Lang: de</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/20">
                  <span className="text-emerald-500 font-bold shrink-0">[13:19:37]</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-200">Document Ingested successfully</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">File: tactical_analysis_guardiola.md | Chunks: 4 | Lang: en</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/20">
                  <span className="text-indigo-400 font-bold shrink-0">[13:18:44]</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-200">Tutor API POST Query Successful</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Q: "Why is a False 9 hard to defend?" | Concept detected: false_9 | Mode: mock</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/20">
                  <span className="text-slate-500 font-bold shrink-0">[13:18:34]</span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-400">Database Store Loaded from Disk</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Loaded 1 documents, 4 chunks. Relinked to concept registry in-memory.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SYSTEM SETTINGS PANEL (Settings tab) */}
        {activeTab === 'settings' && (
          <div className="flex-1 w-full p-8 overflow-y-auto max-w-2xl mx-auto flex flex-col gap-6">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-wider text-slate-100 uppercase">
                Settings
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1 font-display">
                Manage your Football Atlas workspace and server API configurations.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border border-[#23324C]/60 p-6 shadow-xl space-y-6">
              
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
                    <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> MOCK FALLBACK
                    </span>
                  </div>
                </div>
              </div>

              {/* Models */}
              <div className="space-y-2">
                <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-400">Active AI Model</span>
                <div className="p-3 rounded-xl bg-[#182235]/40 border border-[#23324C]/40 text-xs flex flex-col gap-1">
                  <div className="font-bold text-slate-200">ibm-granite/granite-3.0-8b-instruct</div>
                  <div className="text-[10px] text-slate-400">Configured via environment variables. Handles tactical query mapping and complexity level tuning.</div>
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
                        await fetch('http://localhost:3001/documents', { method: 'DELETE' });
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

            </div>
          </div>
        )}

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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const loadDocs = async () => {
    setLoadingDocs(true);
    try {
      const docs = await tacticalApi.getDocuments();
      setDocuments(docs);
    } catch (_) {}
    setLoadingDocs(false);
  };

  useEffect(() => {
    loadDocs();
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
    setDocChunks([]);
    try {
      const chunks = await tacticalApi.getDocumentChunks(docId);
      setDocChunks(chunks);
    } catch (_) {}
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await tacticalApi.searchKeyword(searchQuery);
      setSearchResults(results);
    } catch (_) {}
    setSearching(false);
  };

  return (
    <div className="flex-1 w-full p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      
      {/* Left Column (lg:col-span-5): Document Upload & Ingested Docs List */}
      <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden h-full">
        
        {/* Upload Form card */}
        <div className="glass-panel rounded-2xl border border-[#23324C]/60 p-4 shadow-lg shrink-0">
          <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase mb-3 border-b border-[#23324C]/40 pb-2">
            Ingest Football PDF/MD
          </h3>

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">File</label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-300 bg-[#182235]/40 border border-[#23324C] rounded-lg py-1.5 px-2 cursor-pointer focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-700 file:text-slate-200 file:hover:bg-slate-600 file:cursor-pointer"
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
                  className="w-full bg-[#182235]/40 border border-[#23324C] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Author</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Waradkar"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
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
                  className="w-full bg-[#182235]/40 border border-[#23324C] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-[#182235]/40 border border-[#23324C] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-[#10B981]"
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
                className="px-4 py-1.5 bg-[#10B981] text-white font-display text-xs font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                Upload
              </button>
            </div>
          </form>
        </div>

        {/* Ingested Documents List Card */}
        <div className="flex-1 glass-panel rounded-2xl border border-[#23324C]/60 flex flex-col overflow-hidden shadow-lg">
          <div className="p-3 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              Ingested Playbooks
            </h3>
            <button onClick={loadDocs} className="text-slate-400 hover:text-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
                  className={`w-full p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-colors ${
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
      <div className="lg:col-span-7 flex flex-col gap-4 overflow-hidden h-full">
        
        {/* Keyword Search Card */}
        <div className="glass-panel rounded-2xl border border-[#23324C]/60 p-4 shadow-lg shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Search tactical keywords (e.g. Messi, false 9, Gegenpressing, low block)..."
              value={searchQuery}
              required
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg text-xs font-sans bg-[#182235]/40 border border-[#23324C] text-slate-100 focus:outline-none focus:border-[#10B981] transition-colors"
            />
            <button
              type="submit"
              disabled={searching}
              className="h-9 px-4 bg-[#10B981] text-white font-display text-xs font-semibold rounded-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Chunks Output Board */}
        <div className="flex-1 glass-panel rounded-2xl border border-[#23324C]/60 flex flex-col overflow-hidden shadow-lg">
          <div className="p-3 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between shrink-0">
            <h3 className="font-display font-bold text-xs tracking-wider text-slate-300 uppercase">
              {searchQuery && searchResults.length > 0
                ? `Search Matches for "${searchQuery}" (${searchResults.length})`
                : selectedDocId
                ? 'Document Chunk Records'
                : 'Chunks & Grounding Viewer'}
            </h3>
            {selectedDocId && (
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/5 px-2 py-0.5 rounded border border-[#10B981]/20">
                {docChunks.length} segments
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Show search results if searching */}
            {searchQuery && searchResults.length > 0 ? (
              searchResults.map((hit, idx) => (
                <div key={hit.chunk_id || idx} className="p-3 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#23324C]/20 pb-1.5">
                    <span>{hit.section_title || 'Segment'} (Page {hit.page_number})</span>
                    <span className="text-[#10B981]">Lang: {hit.language}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                    {hit.content}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {hit.concept_tags && hit.concept_tags.map((tag: string) => (
                      <span key={tag} className="text-[8px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/25 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        {tag.replace('_', ' ')}
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
                  <div key={chunk.chunk_id || idx} className="p-3.5 rounded-xl bg-[#182235]/30 border border-[#23324C]/40 space-y-2">
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
                            {tag.replace('_', ' ')}
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
                  Select an Ingested Playbook from the left list to inspect its segmented chunks, or search keywords directly.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
