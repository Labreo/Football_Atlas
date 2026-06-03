import { z } from 'zod';

// ────────────────────────────────────────────────────────────
// LEARNING OBJECTIVE SCHEMA
// ────────────────────────────────────────────────────────────

export const LearningObjectiveSchema = z.object({
  id: z.string().min(1).max(100),
  description: z.string().min(5).max(500),
  category: z.enum(['understand', 'apply', 'analyze']),
});

// ────────────────────────────────────────────────────────────
// TEACHING METADATA SCHEMA
// ────────────────────────────────────────────────────────────

export const TeachingMetadataSchema = z.object({
  key_takeaways: z.array(z.string().min(5)).min(1),
  common_mistakes: z.array(z.string().min(5)),
  prerequisites: z.array(z.string().min(1)),
  follow_up_concepts: z.array(z.string().min(1)),
  difficulty_rating: z.number().min(1).max(10),
});

// ────────────────────────────────────────────────────────────
// CONCEPT MANIFEST SCHEMA
// ────────────────────────────────────────────────────────────

export const ConceptManifestSchema = z.object({
  concept_id: z.string().min(2).max(50),
  display_name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  complexity: z.string().min(2).max(30),
  animation_module_id: z.string().min(2).max(50),
  related_concepts: z.array(z.string().min(1)),
  learning_objectives: z.array(LearningObjectiveSchema).min(1),
  teaching_metadata: TeachingMetadataSchema,
  granite_keywords: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  estimated_duration_seconds: z.number().min(1).max(600),
});

// ────────────────────────────────────────────────────────────
// LESSON STEP SCHEMA
// ────────────────────────────────────────────────────────────

export const LessonStepSchema = z.object({
  step_id: z.string().min(1).max(100),
  phase_name: z.string().min(1).max(100),
  annotation: z.string().min(5).max(1000),
  target_fraction: z.number().min(0).max(1),
  branch_options: z.array(z.string()).optional(),
});

// ────────────────────────────────────────────────────────────
// ASSESSMENT HOOK SCHEMA
// ────────────────────────────────────────────────────────────

export const AssessmentHookSchema = z.object({
  hook_id: z.string().min(1).max(100),
  type: z.enum(['quiz', 'observation', 'interaction']),
  prompt: z.string().min(5).max(500),
  expected_concept_ids: z.array(z.string()).optional(),
});

// ────────────────────────────────────────────────────────────
// LESSON DEFINITION SCHEMA
// ────────────────────────────────────────────────────────────

export const LessonDefinitionSchema = z.object({
  lesson_id: z.string().min(1).max(100),
  concept_id: z.string().min(2).max(50),
  learning_objectives: z.array(z.string().min(1)),
  steps: z.array(LessonStepSchema).min(1),
  expected_duration_seconds: z.number().min(1).max(600),
  difficulty: z.string().min(2).max(30),
  assessment_hooks: z.array(AssessmentHookSchema),
});

// ────────────────────────────────────────────────────────────
// CONCEPT PACKAGE SCHEMA (partial — moduleClass validated separately)
// ────────────────────────────────────────────────────────────

export const ConceptPackageSchema = z.object({
  manifest: ConceptManifestSchema,
  vocabulary: z.record(z.string(), z.array(z.string().min(1)).min(1)),
});
