import { z } from 'zod';
import {
  KeyPrincipleSchema,
  DefensiveResponseSchema,
  EventTimestampSchema,
  HistoricalMatchSchema,
  DoclingChunkReferenceSchema,
  AnimationModuleReferenceSchema,
  TacticalConceptSchema,
  GraniteResponseSchema
} from '../schemas/tactical.schemas';
import { ComplexityLevel } from '../enums/tactical.enums';

export type KeyPrinciple = z.infer<typeof KeyPrincipleSchema>;
export type DefensiveResponse = z.infer<typeof DefensiveResponseSchema>;
export type EventTimestamp = z.infer<typeof EventTimestampSchema>;
export type HistoricalMatch = z.infer<typeof HistoricalMatchSchema>;
export type DoclingChunkReference = z.infer<typeof DoclingChunkReferenceSchema>;
export type AnimationModuleReference = z.infer<typeof AnimationModuleReferenceSchema>;
export type TacticalConcept = z.infer<typeof TacticalConceptSchema>;
export type GraniteResponse = z.infer<typeof GraniteResponseSchema>;

export interface ClassroomAction {
  type:
    | 'LAUNCH_CONCEPT'
    | 'LAUNCH_MATCH'
    | 'LAUNCH_HISTORICAL_EXAMPLE'
    | 'LAUNCH_HISTORICAL_BREAKDOWN'
    | 'OPEN_RELATED_CONCEPT'
    | 'VIEW_SOURCE'
    | 'OPEN_EVIDENCE'
    | 'OPEN_MATCH'
    | 'LAUNCH_BREAKDOWN'
    | 'RELATED_DOCUMENT';
  label: string;
  payload: {
    concept_id?: string;
    match_id?: string;
    example_id?: string;
    breakdown_id?: string;
    document_id?: string;
    chunk_id?: string;
    evidence_id?: string;
  };
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  actions?: ClassroomAction[];
  mcp_tool_chain?: ToolInvocation[];
}

export interface ToolInvocation {
  tool_name: string;
  arguments: any;
  status: 'success' | 'failure' | 'running';
  latency_ms: number;
  error_message?: string;
  response?: any;
  timestamp: string;
}

export interface TutorResponse {
  explanation: string;
  concept_id?: string;
  detected_level: ComplexityLevel;
  follow_up_suggestions: string[];
  confidence_score?: number;
  actions?: ClassroomAction[];
  followup_detected?: boolean;
  reference_resolved?: boolean;
  clarification_requested?: boolean;
  context_recovered?: boolean;
  concept_transition?: boolean;
  breakdown_followup?: boolean;
  resolved_references?: string[];
  conversation_thread?: string[];
  mcp_tool_chain?: ToolInvocation[];
}

export interface ConversationContext {
  active_concept: string | null;
  previous_concepts: string[];
  active_match: string | null;
  active_breakdown: string | null;
  active_example: string | null;
  conversation_summary: string;
  user_intent: string | null;
  conversation_depth: number;
}
