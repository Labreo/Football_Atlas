import { create } from 'zustand';
import { TacticalConcept } from '@football-atlas/shared';

export interface LearningUIState {
  current_question: string;
  current_concept: TacticalConcept | null;
  current_explanation: string;
  animation_state: 'stopped' | 'playing' | 'paused';
  current_phase_index: number;
  current_phase_name: string;
  current_phase_annotation: string;
  follow_up_chain: string[];
  loading: boolean;
  error: string | null;

  setCurrentQuestion: (question: string) => void;
  setCurrentConcept: (concept: TacticalConcept | null) => void;
  setCurrentExplanation: (explanation: string) => void;
  setAnimationState: (state: 'stopped' | 'playing' | 'paused') => void;
  setPhaseInfo: (index: number, name: string) => void;
  setPhaseAnnotation: (annotation: string) => void;
  addToFollowUpChain: (question: string) => void;
  clearFollowUpChain: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetUIStore: () => void;
}

export const useLearningUIStore = create<LearningUIState>((set) => ({
  current_question: '',
  current_concept: null,
  current_explanation: '',
  animation_state: 'stopped',
  current_phase_index: 0,
  current_phase_name: 'Initial Shape',
  current_phase_annotation: '',
  follow_up_chain: [],
  loading: false,
  error: null,

  setCurrentQuestion: (current_question) => set({ current_question }),
  setCurrentConcept: (current_concept) => set({ current_concept }),
  setCurrentExplanation: (current_explanation) => set({ current_explanation }),
  setAnimationState: (animation_state) => set({ animation_state }),
  setPhaseInfo: (current_phase_index, current_phase_name) => set({ current_phase_index, current_phase_name }),
  setPhaseAnnotation: (current_phase_annotation) => set({ current_phase_annotation }),
  addToFollowUpChain: (question) => set((state) => ({ follow_up_chain: [...state.follow_up_chain, question] })),
  clearFollowUpChain: () => set({ follow_up_chain: [] }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  resetUIStore: () => set({
    current_question: '',
    current_concept: null,
    current_explanation: '',
    animation_state: 'stopped',
    current_phase_index: 0,
    current_phase_name: 'Initial Shape',
    current_phase_annotation: '',
    follow_up_chain: [],
    loading: false,
    error: null,
  }),
}));
