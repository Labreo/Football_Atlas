import React from 'react';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { useHistoricalExplorerStore } from '../../stores/useHistoricalExplorerStore';
import { useBreakdownStore } from '../../stores/useBreakdownStore';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';


export const EvidencePanel: React.FC = () => {
  const {
    isEvidencePanelOpen,
    activeEvidence,
    selectedEvidenceItem,
    setSelectedEvidenceItem,
    setEvidencePanelOpen,
    concepts,
    selectConcept
  } = useTacticalStore();

  const { setSelectedExample } = useHistoricalExplorerStore();

  if (!isEvidencePanelOpen) return null;

  const currentItem = selectedEvidenceItem || activeEvidence[0];

  React.useEffect(() => {
    if (currentItem) {
      analyticsTracker.trackSourceViewed(currentItem.evidence_id, currentItem.source_title);
    }
  }, [currentItem]);

  const handleClose = () => {
    setEvidencePanelOpen(false);
    setSelectedEvidenceItem(null);
  };

  const handleConceptClick = async (conceptId: string) => {
    analyticsTracker.track('concept_opened', { concept_id: conceptId, source: 'evidence_panel' });
    setEvidencePanelOpen(false);
    setSelectedEvidenceItem(null);
    setSelectedExample(null);
    await selectConcept(conceptId);
  };

  const handleMatchClick = async (exampleId: string) => {
    try {
      const response = await fetch(`/api/tactical/historical/search`);
      if (response.ok) {
        const allExamples = await response.json();
        const example = allExamples.find((ex: any) => ex.example_id === exampleId);
        if (example) {
          analyticsTracker.trackMatchOpened(exampleId, { source: 'evidence_panel' });
          setEvidencePanelOpen(false);
          setSelectedEvidenceItem(null);
          setSelectedExample(example);
          await useBreakdownStore.getState().startBreakdown(example);
        }
      }
    } catch (err) {
      console.error('Failed to open match from evidence panel:', err);
    }
  };



  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#0E1320]/95 backdrop-blur-xl border-l border-[#23324C]/80 shadow-2xl z-50 flex flex-col font-sans select-none animate-slideIn">
      {/* Panel Header */}
      <div className="p-4 bg-[#121826]/90 border-b border-[#23324C]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-xs">🏛️</span>
          <h2 className="font-display font-extrabold text-xs tracking-wider text-slate-200 uppercase">
            Grounding Evidence Panel
          </h2>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-100 text-xs font-mono transition-colors p-1"
        >
          ✕ Close
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-grow overflow-y-auto p-5 space-y-6">
        {activeEvidence.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-2 select-none text-slate-500">
            <span>📖</span>
            <p className="text-xs leading-relaxed">No source evidence loaded for this turn.</p>
          </div>
        ) : (
          <>
            {/* Multiple Sources Tabs */}
            {activeEvidence.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
                  Aggregated Sources ({activeEvidence.length})
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                  {activeEvidence.map((ev, idx) => {
                    const isSelected = currentItem?.evidence_id === ev.evidence_id;
                    return (
                      <button
                        key={ev.evidence_id}
                        onClick={() => {
                          setSelectedEvidenceItem(ev);
                          analyticsTracker.trackEvidenceOpened(ev.example_id, { evidence_id: ev.evidence_id, source_title: ev.source_title });
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold tracking-wide transition-all shrink-0 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                            : 'bg-[#182235]/40 border-[#23324C]/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Doc #{idx + 1} ({Math.round(ev.confidence * 100)}%)
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentItem && (
              <div className="space-y-5 animate-fadeIn">
                {/* Source Title & Meta Card */}
                <div className="p-4 rounded-xl bg-[#111724]/90 border border-amber-500/30 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] bg-amber-500/10 border border-amber-500/35 px-2 py-0.5 rounded text-amber-400 font-bold font-mono uppercase tracking-wider">
                      {currentItem.source_type}
                    </span>
                    <span className="text-[9px] bg-[#162032] border border-[#23324C]/40 px-2 py-0.5 rounded text-slate-400 font-mono">
                      Conf: {Math.round(currentItem.confidence * 100)}%
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight leading-snug">
                      {currentItem.source_title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono block mt-1">
                      ID: {currentItem.document_id}
                    </span>
                  </div>
                </div>

                {/* Relevant Excerpt Card */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
                    Document Excerpt
                  </span>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-[#23324C]/40 text-xs text-slate-300 leading-relaxed font-sans font-light italic relative">
                    <span className="absolute top-2 left-2 text-2xl text-slate-700 font-serif leading-none">“</span>
                    <p className="pl-4 pr-2">{currentItem.excerpt}</p>
                    <span className="absolute bottom-2 right-2 text-2xl text-slate-700 font-serif leading-none">”</span>
                  </div>
                </div>

                {/* Source Metadata grid */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#111724]/40 border border-[#23324C]/40 rounded-xl p-3.5 font-sans font-light">
                  <div>
                    <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">Coach/Subject</span>
                    <span className="text-slate-200 font-semibold">{currentItem.coach}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] font-mono uppercase tracking-wide">Season Context</span>
                    <span className="text-slate-200 font-semibold">{currentItem.season}</span>
                  </div>
                </div>

                {/* Related Concepts */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
                    Related Concepts
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {concepts.map((concept) => {
                      const isMatch = currentItem.excerpt.toLowerCase().includes(concept.concept_name.toLowerCase()) ||
                                      currentItem.excerpt.toLowerCase().includes(concept.concept_id.replace(/_/g, ' '));
                      return (
                        <button
                          key={concept.concept_id}
                          onClick={() => handleConceptClick(concept.concept_id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all rounded-lg border ${
                            isMatch
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-500'
                              : 'bg-[#1B253B] hover:bg-[#28385A] border-[#2B3B5E]/30 text-slate-300'
                          }`}
                        >
                          {concept.concept_name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Related Match Grounding */}
                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-widest block">
                    Related Match Evidence
                  </span>
                  <button
                    onClick={() => handleMatchClick(currentItem.example_id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-[#111724]/60 border border-[#23324C]/40 hover:border-amber-500/40 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#1B253B] group-hover:bg-amber-500/15 border border-[#2B3B5E]/40 group-hover:border-amber-500/35 text-slate-400 group-hover:text-amber-500 text-xs font-display font-black flex items-center justify-center shrink-0 uppercase transition-colors">
                        M
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block truncate leading-tight">
                          {currentItem.example_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                        <span className="text-[10px] text-slate-500 font-sans block truncate mt-0.5">
                          Coach: {currentItem.coach} • {currentItem.season}
                        </span>
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-[#23324C]/60 bg-[#0B0E17]/80 shrink-0 text-center">
        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
          Football Atlas • IBM Docling Grounded Intel
        </span>
      </div>
    </div>
  );
};
