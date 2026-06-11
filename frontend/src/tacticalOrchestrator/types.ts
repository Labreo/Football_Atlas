import { TacticalConcept, ConversationTurn, ComplexityLevel, ToolInvocation } from '@football-atlas/shared';

export interface LearningSession {
  sessionId: string;
  currentConcept: TacticalConcept | null;
  previousConcepts: string[];
  conversationHistory: ConversationTurn[];
  animationState: 'stopped' | 'playing' | 'paused';
  userLevel: ComplexityLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrchestratorTelemetry {
  graniteLatencyMs: number;
  animationLatencyMs: number;
  confidenceScore: number;
  activeConceptId: string;
  loadedModuleId: string;
  sessionState: string;
  mcpToolChain?: ToolInvocation[];
}

export interface OrchestratorConfig {
  autoPlayThreshold: number; // e.g. 0.80
  clarificationThreshold: number; // e.g. 0.50
}
