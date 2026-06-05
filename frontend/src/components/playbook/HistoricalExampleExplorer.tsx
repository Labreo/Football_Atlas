import React, { useState, useEffect, useMemo } from 'react';
import { useHistoricalExplorerStore } from '../../stores/useHistoricalExplorerStore';
import { useTacticalStore } from '../../stores/useTacticalStore';
import { HistoricalExample } from '@football-atlas/shared';
import { tacticalApi } from '../../apiClients/tacticalApi';
import { analyticsTracker } from '../../tacticalOrchestrator/analytics';
import { useBreakdownStore } from '../../stores/useBreakdownStore';

interface HistoricalExampleExplorerProps {
  conceptId?: string;
  onSelectConcept: (conceptId: string) => void;
}

const HistoricalExampleExplorer: React.FC<HistoricalExampleExplorerProps> = ({
  conceptId,
  onSelectConcept,
}) => {
  const {
    selectedExample,
    activeFilters,
    searchQuery,
    sortMode,
    setSelectedExample,
    setFilter,
    clearFilters,
    setSearchQuery,
    setSortMode,
  } = useHistoricalExplorerStore();

  const { concepts } = useTacticalStore();
  const [examples, setExamples] = useState<HistoricalExample[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterByConcept, setFilterByConcept] = useState<boolean>(!!conceptId);

  // Sync state if concept changes
  useEffect(() => {
    setFilterByConcept(!!conceptId);
  }, [conceptId]);

  // Load all historical examples from database
  useEffect(() => {
    const fetchExamples = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await tacticalApi.searchHistoricalExamples({});
        setExamples(fetched);
      } catch (err: any) {
        setError(err.message || 'Failed to load historical database.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchExamples();
  }, []);

  // Dynamically compute unique values from database for filter options
  const filterOptions = useMemo(() => {
    const competitions = new Set<string>();
    const teams = new Set<string>();
    const coaches = new Set<string>();
    const players = new Set<string>();
    const seasons = new Set<string>();
    const difficulties = new Set<string>();

    examples.forEach((ex) => {
      if (ex.competition) competitions.add(ex.competition);
      if (ex.teams) ex.teams.forEach((t) => teams.add(t));
      if (ex.coach) coaches.add(ex.coach);
      if (ex.players) ex.players.forEach((p) => players.add(p));
      if (ex.season) seasons.add(ex.season);
      
      const difficulty = ex.validation_metadata?.difficulty || (ex.beginner_friendly ? 'beginner' : 'advanced');
      if (difficulty) difficulties.add(difficulty);
    });

    return {
      competitions: Array.from(competitions).sort(),
      teams: Array.from(teams).sort(),
      coaches: Array.from(coaches).sort(),
      players: Array.from(players).sort(),
      seasons: Array.from(seasons).sort(),
      difficulties: Array.from(difficulties).sort(),
    };
  }, [examples]);

  // Search & Filter Pipeline
  const processedExamples = useMemo(() => {
    let result = [...examples];

    // 1. Concept ID Context Filter
    if (filterByConcept && conceptId) {
      result = result.filter((ex) => ex.concept_id === conceptId);
    }

    // 2. Dropdown Filters
    if (activeFilters.competition !== 'all') {
      result = result.filter((ex) => ex.competition === activeFilters.competition);
    }
    if (activeFilters.team !== 'all') {
      result = result.filter((ex) => ex.teams.includes(activeFilters.team));
    }
    if (activeFilters.coach !== 'all') {
      result = result.filter((ex) => ex.coach === activeFilters.coach);
    }
    if (activeFilters.player !== 'all') {
      result = result.filter((ex) => ex.players.includes(activeFilters.player));
    }
    if (activeFilters.season !== 'all') {
      result = result.filter((ex) => ex.season === activeFilters.season);
    }
    if (activeFilters.difficulty !== 'all') {
      result = result.filter((ex) => {
        const diff = ex.validation_metadata?.difficulty || (ex.beginner_friendly ? 'beginner' : 'advanced');
        return diff === activeFilters.difficulty;
      });
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((ex) => {
        return (
          ex.match_name.toLowerCase().includes(q) ||
          ex.coach.toLowerCase().includes(q) ||
          ex.competition.toLowerCase().includes(q) ||
          ex.players.some((p) => p.toLowerCase().includes(q)) ||
          ex.teams.some((t) => t.toLowerCase().includes(q)) ||
          ex.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }

    // 4. Sort mode
    if (sortMode === 'confidence') {
      result.sort((a, b) => b.confidence_score - a.confidence_score);
    } else if (sortMode === 'date') {
      result.sort((a, b) => b.date.localeCompare(a.date));
    } else if (sortMode === 'relevance') {
      // Sort approved first, then by confidence score
      result.sort((a, b) => {
        if (a.review_status === 'approved' && b.review_status !== 'approved') return -1;
        if (a.review_status !== 'approved' && b.review_status === 'approved') return 1;
        return b.confidence_score - a.confidence_score;
      });
    }

    return result;
  }, [examples, conceptId, activeFilters, searchQuery, sortMode]);

  // Navigate to related concept
  const handleConceptJump = (targetConceptId: string) => {
    const matchedConcept = concepts.find(c => c.concept_id === targetConceptId);
    if (matchedConcept) {
      analyticsTracker.trackRelatedConceptOpened(selectedExample?.concept_id || '', targetConceptId, {
        source_concept_id: selectedExample?.concept_id,
      });
      setSelectedExample(null);
      onSelectConcept(targetConceptId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-2 select-none">
        <div className="w-6 h-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
        <span className="text-[10px] text-slate-500 font-mono">LOADING DATABASE...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-[11px] text-red-400 font-mono">
        ⚠️ {error}
      </div>
    );
  }

  // Render Details Panel view if an example is selected
  if (selectedExample) {
    const conceptObj = concepts.find((c) => c.concept_id === selectedExample.concept_id);
    const difficulty = selectedExample.validation_metadata?.difficulty || (selectedExample.beginner_friendly ? 'Beginner' : 'Advanced');

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Back header */}
        <button
          onClick={() => setSelectedExample(null)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors font-display font-semibold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>

        {/* Match Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] bg-slate-900 border border-[#222E45] px-2 py-0.5 rounded text-cyan-400 font-bold font-mono uppercase tracking-wider">
              {selectedExample.competition}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{selectedExample.season}</span>
          </div>
          <h3 className="text-base font-extrabold text-white tracking-tight leading-tight">
            {selectedExample.match_name}
          </h3>
          <span className="text-[11px] text-slate-400 font-sans block">{selectedExample.date}</span>
        </div>

        {/* Tactical Summary */}
        <div className="p-3.5 rounded-xl bg-[#111724]/90 border border-[#23324C]/60 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Tactical Relevance
            </h4>
            <span className="text-[9px] bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
              {selectedExample.confidence_score}% Match
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans font-light">
            {selectedExample.tactical_summary}
          </p>
        </div>

        {/* Historical Context Description */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Historical Context & Action
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans font-light bg-[#121826]/30 border border-[#222E45]/20 p-3 rounded-xl">
            {selectedExample.description}
          </p>
        </div>

        {/* Match Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-[#111724]/50 border border-[#222E45]/30 rounded-xl p-3.5 font-sans font-light">
          <div>
            <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wide">Coach</span>
            <span className="text-slate-200 font-semibold">{selectedExample.coach}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wide">Difficulty</span>
            <span className="text-slate-200 font-semibold capitalize">{difficulty}</span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wide">Key Players</span>
            <span className="text-slate-200 font-semibold leading-relaxed">
              {selectedExample.players.join(', ')}
            </span>
          </div>
          {selectedExample.validation_metadata?.educational_value && (
            <div className="col-span-2 pt-2 border-t border-[#222E45]/30">
              <span className="text-slate-500 block text-[10px] font-mono uppercase tracking-wide">Educational Value</span>
              <span className="text-slate-300 text-[11px] leading-relaxed block mt-0.5">
                {selectedExample.validation_metadata.educational_value}
              </span>
            </div>
          )}
        </div>

        {/* Key Tactical Concepts (Active Jump Links) */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
            Key Tactical Concepts
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {conceptObj && (
              <button
                onClick={() => handleConceptJump(conceptObj.concept_id)}
                className="px-2.5 py-1 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-semibold transition-all rounded-lg"
              >
                Focus Concept: {conceptObj.concept_name}
              </button>
            )}
            {selectedExample.tags.map((tag) => {
              // Try to resolve tag to an active concept
              const matchedC = concepts.find(
                (c) => c.concept_id.replace(/_/g, '').includes(tag.replace(/-/g, '')) ||
                       tag.replace(/-/g, '_') === c.concept_id
              );

              if (matchedC && matchedC.concept_id !== conceptId) {
                return (
                  <button
                    key={tag}
                    onClick={() => handleConceptJump(matchedC.concept_id)}
                    className="px-2.5 py-1 rounded bg-[#1B253B] hover:bg-[#28385A] border border-[#2B3B5E]/50 text-slate-300 text-[10px] font-mono transition-all rounded-lg"
                  >
                    Related: {matchedC.concept_name}
                  </button>
                );
              }
              return (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-[#222E45] text-slate-500 text-[10px] font-mono"
                >
                  #{tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* View Tactical Breakdown Button (Interactive Breakdown Mode) */}
        <button
          onClick={() => {
            useBreakdownStore.getState().startBreakdown(selectedExample);
          }}
          className="w-full py-3 bg-[#10B981] hover:bg-[#0F9E6E] active:bg-[#0D875C] text-slate-900 font-display font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          View Tactical Breakdown
        </button>
      </div>
    );
  }

  // Render list, filters and search
  return (
    <div className="space-y-4 font-sans font-light">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search match, coach, player..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/60 border border-[#222E45]/60 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition-all font-sans"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        )}
      </div>

      {/* Concept Filtering Toggle */}
      {conceptId && (
        <div className="flex items-center gap-1.5 text-[10px] bg-slate-900/40 p-2 rounded-lg border border-[#222E45]/20 select-none">
          <input
            type="checkbox"
            id="filterByConcept"
            checked={filterByConcept}
            onChange={(e) => setFilterByConcept(e.target.checked)}
            className="rounded bg-slate-900 border-[#222E45] text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="filterByConcept" className="text-slate-400 cursor-pointer select-none font-medium">
            Only show matches for this concept
          </label>
        </div>
      )}

      {/* Filter Row Dropdowns (FotMob design - compact & scrollable or wrap) */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {/* Competition */}
        <select
          value={activeFilters.competition}
          onChange={(e) => setFilter('competition', e.target.value)}
          className="px-2 py-1 rounded bg-[#111724]/75 border border-[#222E45]/40 text-slate-400 focus:outline-none focus:border-cyan-500/60"
        >
          <option value="all">Competition</option>
          {filterOptions.competitions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Coach */}
        <select
          value={activeFilters.coach}
          onChange={(e) => setFilter('coach', e.target.value)}
          className="px-2 py-1 rounded bg-[#111724]/75 border border-[#222E45]/40 text-slate-400 focus:outline-none focus:border-cyan-500/60"
        >
          <option value="all">Coach</option>
          {filterOptions.coaches.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Team */}
        <select
          value={activeFilters.team}
          onChange={(e) => setFilter('team', e.target.value)}
          className="px-2 py-1 rounded bg-[#111724]/75 border border-[#222E45]/40 text-slate-400 focus:outline-none focus:border-cyan-500/60"
        >
          <option value="all">Team</option>
          {filterOptions.teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Difficulty */}
        <select
          value={activeFilters.difficulty}
          onChange={(e) => setFilter('difficulty', e.target.value)}
          className="px-2 py-1 rounded bg-[#111724]/75 border border-[#222E45]/40 text-slate-400 focus:outline-none focus:border-cyan-500/60"
        >
          <option value="all">Difficulty</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        {/* Clear Filters */}
        {(activeFilters.competition !== 'all' ||
          activeFilters.coach !== 'all' ||
          activeFilters.team !== 'all' ||
          activeFilters.difficulty !== 'all') && (
          <button
            onClick={clearFilters}
            className="px-2 py-1 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 font-mono transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Sorting Control & Result Count */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-[#222E45]/30 pb-2">
        <span className="font-mono">{processedExamples.length} matches found</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortMode('confidence')}
            className={`transition-colors ${sortMode === 'confidence' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-300'}`}
          >
            Match %
          </button>
          <span>|</span>
          <button
            onClick={() => setSortMode('date')}
            className={`transition-colors ${sortMode === 'date' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-300'}`}
          >
            Date
          </button>
          <span>|</span>
          <button
            onClick={() => setSortMode('relevance')}
            className={`transition-colors ${sortMode === 'relevance' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-300'}`}
          >
            Status
          </button>
        </div>
      </div>

      {/* Match Rows List */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {processedExamples.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-600 italic">
            No matches fit the selected criteria.
          </div>
        ) : (
          processedExamples.map((ex) => {
            const primaryTeam = ex.teams[0] || 'Team';
            const initialLetter = primaryTeam.charAt(0);

            return (
              <button
                key={ex.example_id}
                onClick={() => setSelectedExample(ex)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#111724]/40 hover:bg-[#1C2539]/60 border border-transparent hover:border-[#222E45]/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* FotMob Round Badge */}
                  <div className="w-7 h-7 rounded-full bg-[#1B253B] group-hover:bg-[#28385A] border border-[#2B3B5E]/40 text-slate-300 text-xs font-display font-black flex items-center justify-center shrink-0 uppercase transition-colors">
                    {initialLetter}
                  </div>
                  
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors block truncate leading-tight">
                      {ex.match_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans block truncate leading-normal">
                      {ex.competition} • {ex.coach}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="text-[10px] text-slate-600 group-hover:text-cyan-400 font-mono transition-colors">
                    {ex.confidence_score}%
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoricalExampleExplorer;
