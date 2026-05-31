import { ComplexityLevel } from '@football-atlas/shared';

export interface FootballConceptData {
  concept_id: string;
  concept_name: string;
  complexity: ComplexityLevel;
  user_level: ComplexityLevel;
  animation_module: string;
  explanation: string;
  follow_up_suggestions: string[];
}

export interface GraniteSuccessResponse {
  success: true;
  latency_ms: number;
  data: FootballConceptData & { needs_clarification: false };
}

export interface GraniteClarificationResponse {
  success: true;
  latency_ms: number;
  data: {
    needs_clarification: true;
    clarification_question: string;
  };
}

export type GraniteTestResponse = GraniteSuccessResponse | GraniteClarificationResponse;

export interface ConversationContext {
  conversation_id: string;
  last_questions: string[];
  last_concepts: string[];
  user_level: ComplexityLevel;
}
