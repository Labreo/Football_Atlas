import React, { useState, useEffect } from 'react';
import { tacticalApi } from '../../apiClients/tacticalApi';
import { HistoricalExample, TacticalConcept } from '@football-atlas/shared';

// ────────────────────────────────────────────────────────────
// HISTORICAL EXAMPLE EXPLORER — Developer-only panel
// Audits concept coverage, reviews status, and lists curated
// real-world examples.
// ────────────────────────────────────────────────────────────

const HistoricalExampleExplorer: React.FC = () => {
  const [concepts, setConcepts] = useState<TacticalConcept[]>([]);
  const [examples, setExamples] = useState<HistoricalExample[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'player' | 'coach' | 'team'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedConcepts, fetchedExamples] = await Promise.all([
          tacticalApi.getConcepts(),
          tacticalApi.searchHistoricalExamples({})
        ]);
        setConcepts(fetchedConcepts);
        setExamples(fetchedExamples);
      } catch (err: any) {
        setError(err.message || 'Failed to load historical explorer data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Compute Coverage Statistics
  const totalConcepts = concepts.length;
  const conceptsWithExamples = concepts.filter(concept => 
    examples.some(ex => ex.concept_id === concept.concept_id)
  ).length;
  const coveragePercentage = totalConcepts > 0 ? Math.round((conceptsWithExamples / totalConcepts) * 100) : 0;

  const approvedCount = examples.filter(ex => ex.review_status === 'approved').length;
  const reviewedCount = examples.filter(ex => ex.review_status === 'reviewed').length;
  const draftCount = examples.filter(ex => ex.review_status === 'draft').length;

  const avgConfidence = examples.length > 0 
    ? Math.round(examples.reduce((sum, ex) => sum + ex.confidence_score, 0) / examples.length)
    : 0;

  // Filter Examples based on active UI selections
  const filteredExamples = examples.filter(ex => {
    // 1. Concept Filter
    if (selectedConcept !== 'all' && ex.concept_id !== selectedConcept) {
      return false;
    }

    // 2. Search Text Filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (searchFilter === 'player') {
      return ex.players.some(p => p.toLowerCase().includes(query));
    }
    if (searchFilter === 'coach') {
      return ex.coach.toLowerCase().includes(query);
    }
    if (searchFilter === 'team') {
      return ex.teams.some(t => t.toLowerCase().includes(query));
    }
    
    // 'all' search filter
    return (
      ex.match_name.toLowerCase().includes(query) ||
      ex.coach.toLowerCase().includes(query) ||
      ex.players.some(p => p.toLowerCase().includes(query)) ||
      ex.teams.some(t => t.toLowerCase().includes(query)) ||
      ex.competition.toLowerCase().includes(query) ||
      ex.tags.some(tag => tag.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-xs">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="font-display text-base font-semibold text-white tracking-wide">
          📚 Historical Match Explorer
        </h3>
        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono uppercase tracking-widest">
          Knowledge Base
        </span>
      </div>

      {/* Coverage & Audit Metrics */}
      <div className="p-3 rounded-lg bg-[#111827] border border-[#1E293B]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Database Coverage & Audit
          </span>
          <span className="text-xs font-mono text-cyan-400">
            {conceptsWithExamples}/{totalConcepts} Concepts Covered ({coveragePercentage}%)
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-slate-900/50">
            <div className="text-lg font-bold font-display text-cyan-400">{examples.length}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Total Examples</div>
          </div>
          <div className="p-2 rounded bg-slate-900/50">
            <div className="text-lg font-bold font-display text-emerald-400">{approvedCount}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Approved</div>
          </div>
          <div className="p-2 rounded bg-slate-900/50">
            <div className="text-lg font-bold font-display text-amber-400">{draftCount + reviewedCount}</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Under Review</div>
          </div>
          <div className="p-2 rounded bg-slate-900/50">
            <div className="text-lg font-bold font-display text-indigo-400">{avgConfidence}%</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Avg Confidence</div>
          </div>
        </div>
      </div>

      {/* Concept Coverage Table */}
      <div className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] space-y-2">
        <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono block">
          Concept Coverage Status
        </span>
        <div className="max-h-36 overflow-y-auto pr-1 space-y-1 font-mono text-[11px]">
          {concepts.map(c => {
            const conceptExamples = examples.filter(ex => ex.concept_id === c.concept_id);
            const hasApproved = conceptExamples.some(ex => ex.review_status === 'approved');
            let statusBadge = (
              <span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400">No Examples</span>
            );
            if (conceptExamples.length > 0) {
              statusBadge = hasApproved ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-400">Fully Covered ({conceptExamples.length})</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400">Needs Review ({conceptExamples.length})</span>
              );
            }

            return (
              <div key={c.concept_id} className="flex justify-between items-center py-1 border-b border-[#1E293B]/50">
                <span className="text-slate-300 font-medium truncate max-w-[200px]">
                  {c.concept_name}
                </span>
                {statusBadge}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-[#111827] border border-[#1E293B]">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={selectedConcept}
            onChange={(e) => setSelectedConcept(e.target.value)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-[#1E293B] text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Concepts</option>
            {concepts.map(c => (
              <option key={c.concept_id} value={c.concept_id}>
                {c.concept_name}
              </option>
            ))}
          </select>

          <select
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded bg-slate-900 border border-[#1E293B] text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Fields</option>
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="team">Team</option>
          </select>

          <input
            type="text"
            placeholder="Search match data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-[#1E293B] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Filtered Examples List */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase text-slate-500 tracking-widest font-mono">
            curated examples ({filteredExamples.length})
          </span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {filteredExamples.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 italic bg-[#111827] rounded-lg border border-[#1E293B]">
              No examples match the active filters.
            </div>
          ) : (
            filteredExamples.map(ex => {
              const matchedConcept = concepts.find(c => c.concept_id === ex.concept_id);
              return (
                <div key={ex.example_id} className="p-3 rounded-lg bg-[#111827] border border-[#1E293B] hover:border-slate-700 transition-all space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{ex.match_name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {ex.competition} • {ex.season} • {ex.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                        ex.review_status === 'approved' 
                          ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-900/40 text-amber-400 border border-amber-500/20'
                      }`}>
                        {ex.review_status}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 text-cyan-400 font-mono border border-cyan-500/20">
                        {ex.confidence_score}% Match
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 line-clamp-3">
                    <span className="text-slate-500 font-medium">Description: </span>
                    {ex.description}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[#1E293B]/50 font-mono">
                    <div>
                      <span className="text-slate-500">Coach: </span>
                      <span className="text-slate-300">{ex.coach}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Concept: </span>
                      <span className="text-cyan-400">{matchedConcept?.concept_name || ex.concept_id}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Key Players: </span>
                      <span className="text-slate-300">{ex.players.join(', ')}</span>
                    </div>
                  </div>

                  {ex.source_references.length > 0 && (
                    <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1E293B]/30 truncate">
                      <span className="font-semibold">References:</span> {ex.source_references.join(' | ')}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalExampleExplorer;
