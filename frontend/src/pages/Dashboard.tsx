import React, { useEffect } from 'react';
import { useTacticalStore } from '../stores/useTacticalStore';
import Header from '../components/common/Header';
import Pitch3D from '../components/pitch/Pitch3D';
import ChatConsole from '../components/chat/ChatConsole';

const Dashboard: React.FC = () => {
  const { 
    concepts, 
    currentConcept, 
    isLoading, 
    error, 
    fetchConcepts, 
    selectConcept 
  } = useTacticalStore();

  useEffect(() => {
    fetchConcepts();
  }, [fetchConcepts]);

  return (
    <div className="h-screen w-screen flex flex-col bg-pitch-dark text-slate-100 overflow-hidden">
      <Header />

      {/* Main Grid Workspace */}
      <div className="flex-1 w-full p-4 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN (lg:col-span-3): Concept Library + Chat Console */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
          {/* Concept Navigator */}
          <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border border-pitch-border">
            <div className="p-3.5 bg-pitch-card border-b border-pitch-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-xs tracking-wider text-slate-300 uppercase">
                Tactical Library
              </h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.5 rounded-md border border-slate-700/50">
                {concepts.length} Roles
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading && concepts.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                  <span className="text-xs text-slate-500 animate-pulse">Loading playbook...</span>
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center p-4">
                  <span className="text-xs text-pitch-neonRed text-center">Failed to load playbook.</span>
                </div>
              ) : (
                concepts.map((concept) => (
                  <button
                    key={concept.concept_id}
                    onClick={() => selectConcept(concept.concept_id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                      currentConcept?.concept_id === concept.concept_id
                        ? 'bg-pitch-neonCyan/10 border-pitch-neonCyan text-pitch-neonCyan shadow-[0_0_8px_rgba(0,243,255,0.08)]'
                        : 'bg-transparent border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold font-display">
                        {concept.concept_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {concept.category}
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                      concept.complexity === 'Beginner'
                        ? 'bg-slate-900 border-slate-700 text-slate-400'
                        : concept.complexity === 'Intermediate'
                        ? 'bg-pitch-neonCyan/10 border-pitch-neonCyan/30 text-pitch-neonCyan'
                        : 'bg-pitch-neonAmber/10 border-pitch-neonAmber/30 text-pitch-neonAmber'
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
        <div className="lg:col-span-6 flex flex-col h-full overflow-hidden">
          <Pitch3D />
        </div>

        {/* RIGHT COLUMN (lg:col-span-3): Concept Inspector */}
        <div className="lg:col-span-3 flex flex-col glass-panel rounded-2xl border border-pitch-border overflow-hidden h-full">
          <div className="p-3.5 bg-pitch-card border-b border-pitch-border">
            <h2 className="font-display font-semibold text-xs tracking-wider text-slate-300 uppercase">
              Concept Inspector
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentConcept ? (
              <div className="space-y-4">
                {/* Concept Identification */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-lg text-slate-100">
                      {currentConcept.concept_name}
                    </h3>
                    <span className="text-[10px] bg-pitch-surface text-slate-300 border border-pitch-border px-2 py-0.5 rounded font-semibold font-display uppercase">
                      {currentConcept.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed bg-pitch-surface/40 p-3 rounded-xl border border-slate-800/80">
                    {currentConcept.core_explanation}
                  </p>
                </div>

                {/* Key Principles */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pitch-neonCyan">
                    Key Principles
                  </h4>
                  <ul className="space-y-1.5">
                    {currentConcept.key_principles.map((principle, index) => (
                      <li key={index} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="text-pitch-neonCyan mt-0.5">✦</span>
                        <span>{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Defensive Counter */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pitch-neonRed">
                    Opposition Counters
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-pitch-neonRed/5 p-2.5 rounded-xl border border-pitch-neonRed/20">
                    {currentConcept.defensive_response}
                  </p>
                </div>

                {/* Historical Match Example */}
                {currentConcept.historical_examples && currentConcept.historical_examples.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-pitch-neonAmber">
                      Match Benchmark Case
                    </h4>
                    {currentConcept.historical_examples.map((ex, i) => (
                      <div key={i} className="bg-pitch-surface p-3 rounded-xl border border-pitch-border space-y-1.5 shadow-md">
                        <div className="flex items-center justify-between text-[11px] font-bold font-display">
                          <span className="text-pitch-neonAmber">{ex.match}</span>
                          <span className="text-slate-400">{ex.season}</span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                          {ex.teams}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {ex.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Docling Literature Grounding */}
                {currentConcept.docling_chunks && currentConcept.docling_chunks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">
                      Docling Source Grounding
                    </h4>
                    {currentConcept.docling_chunks.map((chunk, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-900 text-[10px] text-slate-400 leading-relaxed font-sans italic">
                        {chunk}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 py-16 space-y-2">
                <span className="text-2xl">⚽</span>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                  No concept currently selected. Pick a play from the library or type a query to inspect tactical dimensions.
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
