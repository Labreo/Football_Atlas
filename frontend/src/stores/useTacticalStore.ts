import { create } from 'zustand';
import { TacticalConcept, ConversationTurn, ComplexityLevel, HistoricalEvidence } from '@football-atlas/shared';
import { tacticalApi } from '../apiClients/tacticalApi';
import { learningOrchestrator } from '../tacticalOrchestrator/orchestrator';
import { VisualMode } from '../visualLanguage/types';
import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import { useBreakdownStore } from './useBreakdownStore';

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
  followUpSuggestions: string[];
  isLoading: boolean;
  error: string | null;

  // New visual pitch state
  formation: string;
  teamAVisible: boolean;
  teamBVisible: boolean;
  cameraResetTrigger: number;
  cameraPanDirection: { dir: 'up' | 'down' | 'left' | 'right' | null; count: number };
  cameraZoom: number;

  fetchConcepts: () => Promise<void>;
  selectConcept: (conceptId: string) => Promise<void>;
  setPlayState: (state: 'playing' | 'paused' | 'stopped') => void;
  setPlaySpeed: (speed: number) => void;
  toggleOverlay: (overlay: 'passingLanes' | 'movementPaths' | 'pressingZones') => void;
  askQuestion: (prompt: string) => Promise<void>;
  clearConversation: () => void;

  // New visual pitch actions
  setFormation: (formation: string) => void;
  setTeamAVisible: (visible: boolean) => void;
  setTeamBVisible: (visible: boolean) => void;
  triggerCameraReset: () => void;
  panCamera: (dir: 'up' | 'down' | 'left' | 'right') => void;
  setCameraZoom: (zoom: number) => void;

  // Concept Chaining visual thread
  tacticalThread: string[];
  setTacticalThread: (thread: string[]) => void;

  // TVLS: Visual Mode state & action
  visualMode: VisualMode;
  setVisualMode: (mode: VisualMode) => void;

  // Sub-tab selection in Playbook
  playbookSubTab: 'lecture' | 'examples';
  setPlaybookSubTab: (tab: 'lecture' | 'examples') => void;

  // Grounded Historical Intelligence Layer
  activeEvidence: HistoricalEvidence[];
  selectedEvidenceItem: HistoricalEvidence | null;
  isEvidencePanelOpen: boolean;
  fetchEvidenceForExample: (exampleId: string) => Promise<void>;
  setSelectedEvidenceItem: (item: HistoricalEvidence | null) => void;
  setEvidencePanelOpen: (isOpen: boolean) => void;
}

export const useTacticalStore = create<TacticalState>((set) => ({
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
  followUpSuggestions: [
    "Why is a False 9 hard to defend?",
    "How does a high press create chances?",
    "Can you show me a pressing trap?",
    "What is a low block?"
  ],
  detectedLevel: ComplexityLevel.BEGINNER,
  isLoading: false,
  error: null,

  // New state values
  formation: '4-3-3',
  teamAVisible: true,
  teamBVisible: true,
  cameraResetTrigger: 0,
  cameraPanDirection: { dir: null, count: 0 },
  cameraZoom: 1.0,
  tacticalThread: [],
  visualMode: 'concept',
  playbookSubTab: 'lecture',
  setPlaybookSubTab: (playbookSubTab) => set({ playbookSubTab }),


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
    useBreakdownStore.getState().stopBreakdown(false);
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

  setFormation: (formation) => set({ formation }),
  setTeamAVisible: (teamAVisible) => set({ teamAVisible }),
  setTeamBVisible: (teamBVisible) => set({ teamBVisible }),
  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1, cameraZoom: 1.0 })),
  panCamera: (dir) => set((state) => ({
    cameraPanDirection: { dir, count: state.cameraPanDirection.count + 1 }
  })),
  setCameraZoom: (cameraZoom) => set({ cameraZoom }),

  setTacticalThread: (tacticalThread) => set({ tacticalThread }),

  setVisualMode: (visualMode) => {
    const prevMode = useTacticalStore.getState().visualMode;
    set({ visualMode });
    const activeModule = learningOrchestrator.getActiveModule();
    if (activeModule && activeModule.setVisualMode) {
      activeModule.setVisualMode(visualMode);
    }
    if (visualMode === 'historical' && prevMode !== 'historical') {
      analyticsTracker.trackHistoricalModeEntered(
        useTacticalStore.getState().currentConcept?.concept_id || 'none'
      );
    }
  },


  // Grounded Historical Intelligence Layer initial state
  activeEvidence: [],
  selectedEvidenceItem: null,
  isEvidencePanelOpen: false,

  fetchEvidenceForExample: async (exampleId: string) => {
    try {
      const activeEvidence = await tacticalApi.getHistoricalEvidence(exampleId);
      set({ activeEvidence });
    } catch (err) {
      console.error('Failed to fetch evidence for example:', err);
    }
  },
  setSelectedEvidenceItem: (selectedEvidenceItem) => set({ selectedEvidenceItem }),
  setEvidencePanelOpen: (isEvidencePanelOpen) => set({ isEvidencePanelOpen }),

  askQuestion: async (prompt: string) => {
    // Delegate fully to the orchestrator layer to handle the end-to-end loop
    await learningOrchestrator.askQuestion(prompt);
  },

  clearConversation: () => set({ conversation: [] })
}));
