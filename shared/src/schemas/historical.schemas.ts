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
