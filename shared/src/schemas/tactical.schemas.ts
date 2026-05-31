import { z } from 'zod';
import { TacticalCategory, ComplexityLevel, RequiredOverlay } from '../enums/tactical.enums';

// 1. Semver and Date Validators
const semverRegex = /^\d+\.\d+\.\d+$/;
const SemverSchema = z.string().regex(semverRegex, { message: 'Must be a valid semver string (e.g., 1.0.0)' });
const IsoDateSchema = z.string().datetime({ message: 'Must be a valid ISO 8601 date string' });

// 2. Key Principles Schema
export const KeyPrincipleSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000)
});

// 3. Defensive Response Counter Schema
export const DefensiveResponseSchema = z.object({
  response_id: z.string().min(3).max(50),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  effectiveness_rating: z.number().int().min(1).max(100),
  advantages: z.array(z.string().min(5)),
  risks: z.array(z.string().min(5))
});

// 4. Historical Match Example Schema
export const EventTimestampSchema = z.object({
  name: z.string().min(3).max(100),
  timestamp: z.string().regex(/^(?:\d{1,2}:)?\d{2}:\d{2}$/, { message: 'Must be in MM:SS or HH:MM:SS format' })
});

export const HistoricalMatchSchema = z.object({
  match_id: z.string().min(3).max(50),
  title: z.string().min(3).max(150),
  competition: z.string().min(2).max(100),
  season: z.string().min(4).max(20),
  teams: z.string().min(5).max(150),
  tactical_context: z.string().min(10).max(1000),
  summary: z.string().min(10).max(2000),
  relevance_score: z.number().min(0).max(100),
  video_url: z.string().url().optional(),
  event_timestamps: z.array(EventTimestampSchema).optional()
});

// 5. Docling Chunk Reference Schema (for vector DB grounding)
export const DoclingChunkReferenceSchema = z.object({
  chunk_id: z.string().min(3).max(100),
  source_document: z.string().min(3).max(200),
  relevance_score: z.number().min(0).max(100)
});

// 6. Animation Module Reference Schema
export const AnimationModuleReferenceSchema = z.object({
  module_id: z.string().min(3).max(50),
  version: SemverSchema,
  required_overlays: z.array(z.nativeEnum(RequiredOverlay))
});

// 7. Core Tactical Concept Schema (Unified Platform Contract)
export const TacticalConceptSchema = z.object({
  concept_id: z.string().min(3).max(50),
  concept_name: z.string().min(3).max(100),
  category: z.nativeEnum(TacticalCategory),
  complexity: z.nativeEnum(ComplexityLevel),
  core_explanation: z.string().min(20).max(2500),
  key_principles: z.array(KeyPrincipleSchema).nonempty(),
  defensive_response: DefensiveResponseSchema,
  animation_module: AnimationModuleReferenceSchema,
  historical_examples: z.array(HistoricalMatchSchema),
  related_concepts: z.array(z.string().min(3)),
  docling_chunks: z.array(DoclingChunkReferenceSchema),
  schema_version: SemverSchema,
  created_at: IsoDateSchema,
  updated_at: IsoDateSchema
});

// 8. IBM Granite Generation Output Schema Contract
export const GraniteResponseSchema = z.object({
  concept_id: z.string().min(3).max(50),
  confidence_score: z.number().min(0).max(100),
  explanation: z.string().min(20).max(1500),
  recommended_animation: z.string().min(3).max(50),
  follow_up_concepts: z.array(z.string().min(3))
});
