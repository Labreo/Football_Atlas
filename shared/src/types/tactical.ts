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

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorResponse {
  explanation: string;
  concept_id?: string;
  detected_level: ComplexityLevel;
  follow_up_suggestions: string[];
  confidence_score?: number;
}
