import { create } from 'zustand';
import { HistoricalExample } from '@football-atlas/shared';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import { useTacticalStore } from './useTacticalStore';

interface HistoricalExplorerState {
  selectedExample: HistoricalExample | null;
  activeFilters: {
    competition: string;
    team: string;
    coach: string;
    player: string;
    season: string;
    difficulty: string;
  };
  searchQuery: string;
  currentConceptId: string | null;
  sortMode: 'relevance' | 'confidence' | 'date';

  setSelectedExample: (example: HistoricalExample | null) => void;
  setFilter: (key: keyof HistoricalExplorerState['activeFilters'], value: string) => void;
  clearFilters: () => void;
  setSearchQuery: (query: string) => void;
  setCurrentConceptId: (conceptId: string | null) => void;
  setSortMode: (mode: 'relevance' | 'confidence' | 'date') => void;
}

const initialFilters = {
  competition: 'all',
  team: 'all',
  coach: 'all',
  player: 'all',
  season: 'all',
  difficulty: 'all',
};

export const useHistoricalExplorerStore = create<HistoricalExplorerState>((set) => ({
  selectedExample: null,
  activeFilters: { ...initialFilters },
  searchQuery: '',
  currentConceptId: null,
  sortMode: 'confidence',

  setSelectedExample: (example) => {
    set({ selectedExample: example });
    if (example) {
      useTacticalStore.getState().setVisualMode('historical');
      analyticsTracker.trackHistoricalExampleViewed(example.example_id, {
        concept_id: example.concept_id,
        match_name: example.match_name,
      });
      analyticsTracker.trackMatchOpened(example.example_id, {
        concept_id: example.concept_id,
        match_name: example.match_name,
      });
      analyticsTracker.trackGroundedExampleUsed(example.example_id);
    } else {
      // Revert if no active breakdown is playing
      const { useBreakdownStore } = require('./useBreakdownStore');
      if (!useBreakdownStore.getState().currentBreakdown) {
        useTacticalStore.getState().setVisualMode('concept');
      }
    }
  },

  setFilter: (key, value) => {
    set((state) => {
      const updatedFilters = {
        ...state.activeFilters,
        [key]: value,
      };
      return { activeFilters: updatedFilters };
    });
  },

  clearFilters: () => {
    set({ activeFilters: { ...initialFilters } });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setCurrentConceptId: (conceptId) => {
    set({ currentConceptId: conceptId });
  },

  setSortMode: (mode) => {
    set({ sortMode: mode });
  },
}));
