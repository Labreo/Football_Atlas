import { z } from 'zod';

export const LearnerProfileSchema = z.object({
  userId: z.string().min(1),
  completed_concepts: z.array(z.string()),
  completed_breakdowns: z.array(z.string()),
  questions_asked: z.number().nonnegative(),
  learning_time: z.number().nonnegative(),
  favorite_topics: z.array(z.string()),
  recommended_concepts: z.array(z.string()),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']),
  active_path_id: z.string().nullable(),
  started_paths: z.record(z.string(), z.string()),
  completed_paths: z.record(z.string(), z.string()),
});

export const ConceptMasterySchema = z.object({
  concept_id: z.string().min(1),
  completion_percentage: z.number().min(0).max(100),
  confidence_score: z.number().min(0).max(100),
  last_viewed: z.string().nullable(),
  historical_examples_completed: z.array(z.string()),
  breakdowns_completed: z.array(z.string()),
  questions_asked: z.number().nonnegative(),
});

export const LearningPathSchema = z.object({
  path_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  ordered_concepts: z.array(z.string()),
  recommended_historical_examples: z.array(z.string()),
  recommended_breakdowns: z.array(z.string()),
  estimated_completion_time: z.number().positive(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export const LearningRecommendationsSchema = z.object({
  next_concept_id: z.string().nullable(),
  next_example_id: z.string().nullable(),
  next_breakdown_id: z.string().nullable(),
  related_concept_ids: z.array(z.string()),
  explanation: z.string(),
});

export const ActivityLogSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  activity_type: z.enum([
    'concept_viewed',
    'concept_completed',
    'breakdown_started',
    'breakdown_completed',
    'question_asked',
    'path_started',
    'path_completed',
  ]),
  concept_id: z.string().optional(),
  example_id: z.string().optional(),
  path_id: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});
