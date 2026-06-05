import { create } from 'zustand';
import { HistoricalExample } from '@football-atlas/shared';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';

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
      analyticsTracker.track('historical_example_selected', {
        example_id: example.example_id,
        concept_id: example.concept_id,
        match_name: example.match_name,
      });
      analyticsTracker.track('historical_example_viewed', {
        example_id: example.example_id,
        concept_id: example.concept_id,
      });
    }
  },

  setFilter: (key, value) => {
    set((state) => {
      const updatedFilters = {
        ...state.activeFilters,
        [key]: value,
      };
      
      analyticsTracker.track('historical_example_filtered', {
        filter_key: key,
        filter_value: value,
        active_filters: updatedFilters,
      });

      return { activeFilters: updatedFilters };
    });
  },

  clearFilters: () => {
    set({ activeFilters: { ...initialFilters } });
    analyticsTracker.track('historical_example_filtered', {
      action: 'clear_all',
      active_filters: { ...initialFilters },
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (query.trim().length > 2) {
      analyticsTracker.track('historical_example_searched', {
        search_query: query,
      });
    }
  },

  setCurrentConceptId: (conceptId) => {
    set({ currentConceptId: conceptId });
  },

  setSortMode: (mode) => {
    set({ sortMode: mode });
  },
}));
