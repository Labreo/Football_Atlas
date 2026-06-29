import { z } from 'zod';

export const HistoricalExampleSchema = z.object({
  example_id: z.string().min(3).max(50),
  concept_id: z.string().min(3).max(50),
  match_name: z.string().min(3).max(150),
  competition: z.string().min(2).max(100),
  season: z.string().min(4).max(20),
  teams: z.array(z.string().min(2)),
  date: z.string().min(8).max(30),
  coach: z.string().min(2).max(100),
  players: z.array(z.string().min(2)),
  description: z.string().min(10).max(2000),
  tactical_summary: z.string().min(10).max(2000),
  source_references: z.array(z.string().min(5)),
  confidence_score: z.number().min(0).max(100),
  tags: z.array(z.string().min(2)),
  review_status: z.enum(['draft', 'reviewed', 'approved']),
  validation_metadata: z.record(z.any()),
  beginner_friendly: z.boolean()
});

export const HistoricalScenarioDefinitionSchema = z.object({
  match_id: z.string().min(3).max(50),
  concept_id: z.string().min(3).max(50),
  starting_positions: z.record(z.object({
    x: z.number(),
    z: z.number()
  })),
  formation: z.string().min(3).max(20),
  key_movements: z.array(z.object({
    playerId: z.string().min(2),
    targetPos: z.object({
      x: z.number(),
      z: z.number()
    }),
    time: z.number().min(0).max(1)
  })),
  timeline: z.array(z.object({
    time: z.number().min(0).max(1),
    event: z.string().min(3).max(200)
  }))
});

export const WhatIfOptionSchema = z.object({
  option_id: z.string(),
  label: z.string(),
  kind: z.enum(['pass', 'carry', 'shot']),
  from_x: z.number(),
  from_z: z.number(),
  to_x: z.number(),
  to_z: z.number(),
  receiver_name: z.string().optional(),
  viable: z.boolean(),
  value: z.number(),
  value_kind: z.enum(['xT', 'xG']),
  chosen: z.boolean().optional(),
  best: z.boolean().optional()
});

export const BreakdownMomentSchema = z.object({
  moment_id: z.string().min(3),
  timestamp: z.number().min(0).max(1),
  title: z.string().min(3),
  description: z.string().min(5),
  camera_view: z.enum(['overview', 'player_focus', 'tactical_shape', 'passing_lane', 'space_creation']),
  animation_sequence: z.string(),
  granite_context: z.string(),
  annotations: z.array(z.object({
    type: z.enum(['arrow', 'passing_lane', 'player_highlight', 'space_highlight', 'shape_overlay', 'note']),
    target: z.string(),
    color: z.string().optional()
  })),
  what_if_options: z.array(WhatIfOptionSchema).optional()
});

export const HistoricalBreakdownSchema = z.object({
  breakdown_id: z.string().min(3),
  example_id: z.string().min(3),
  concept_id: z.string().min(3),
  title: z.string().min(3),
  description: z.string().min(10),
  timeline: z.array(z.number()),
  key_moments: z.array(BreakdownMomentSchema),
  commentary: z.array(z.string()),
  learning_goals: z.array(z.string())
});

export const HistoricalEvidenceSchema = z.object({
  evidence_id: z.string().min(3),
  example_id: z.string().min(3),
  document_id: z.string().min(3),
  chunk_id: z.string().min(3),
  source_title: z.string().min(3),
  source_type: z.string().min(3),
  coach: z.string().min(2),
  season: z.string().min(4),
  excerpt: z.string().min(10),
  confidence: z.number().min(0).max(1)
});
