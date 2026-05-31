import { create } from 'zustand';
import { TacticalConcept, ConversationTurn, ComplexityLevel } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';

interface TacticalState {
  concepts: TacticalConcept[];
  currentConcept: TacticalConcept | null;
  playState: 'playing' | 'paused' | 'stopped';
  playSpeed: number;
  overlays: {
    passingLanes: boolean;
    movementPaths: boolean;
    pressingZones: boolean;
  };
  conversation: ConversationTurn[];
  detectedLevel: ComplexityLevel;
  isLoading: boolean;
  error: string | null;

  fetchConcepts: () => Promise<void>;
  selectConcept: (conceptId: string) => Promise<void>;
  setPlayState: (state: 'playing' | 'paused' | 'stopped') => void;
  setPlaySpeed: (speed: number) => void;
  toggleOverlay: (overlay: 'passingLanes' | 'movementPaths' | 'pressingZones') => void;
  askQuestion: (prompt: string) => Promise<void>;
  clearConversation: () => void;
}

export const useTacticalStore = create<TacticalState>((set, get) => ({
  concepts: [],
  currentConcept: null,
  playState: 'stopped',
  playSpeed: 1,
  overlays: {
    passingLanes: true,
    movementPaths: true,
    pressingZones: true
  },
  conversation: [
    {
      role: 'assistant',
      content: "Welcome to Football Atlas! I'm your AI tactical tutor powered by IBM Granite. Ask me questions like 'Why is a False 9 hard to defend?' or 'How does a high press work?' to begin!"
    }
  ],
  detectedLevel: ComplexityLevel.BEGINNER,
  isLoading: false,
  error: null,

  fetchConcepts: async () => {
    set({ isLoading: true, error: null });
    try {
      const concepts = await tacticalApi.getConcepts();
      set({ concepts, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  selectConcept: async (conceptId: string) => {
    set({ isLoading: true, error: null, playState: 'stopped' });
    try {
      const concept = await tacticalApi.getConceptById(conceptId);
      set({ currentConcept: concept, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setPlayState: (playState) => set({ playState }),
  setPlaySpeed: (playSpeed) => set({ playSpeed }),
  
  toggleOverlay: (overlay) => set((state) => ({
    overlays: {
      ...state.overlays,
      [overlay]: !state.overlays[overlay]
    }
  })),

  askQuestion: async (prompt: string) => {
    const { conversation } = get();
    const newHistory: ConversationTurn[] = [...conversation, { role: 'user', content: prompt }];
    set({ isLoading: true, conversation: newHistory });

    try {
      const response = await tacticalApi.askTutor(prompt, conversation);
      set({
        conversation: [...newHistory, { role: 'assistant', content: response.explanation }],
        detectedLevel: response.detected_level,
        isLoading: false
      });
      if (response.concept_id) {
        // Auto-load matching concept details & trigger playing status
        const concept = await tacticalApi.getConceptById(response.concept_id);
        set({ currentConcept: concept, playState: 'playing' });
      }
    } catch (err: any) {
      set({
        conversation: [...newHistory, { role: 'assistant', content: "I had trouble talking to the tutoring backend server. Make sure the Node server is up and listening on port 3001." }],
        isLoading: false
      });
    }
  },

  clearConversation: () => set({ conversation: [] })
}));
