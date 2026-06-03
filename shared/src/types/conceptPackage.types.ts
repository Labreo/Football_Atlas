// Football Atlas Runtime Framework — Shared Type Contracts
// These types define the self-registering concept package system.

// ────────────────────────────────────────────────────────────
// LEARNING OBJECTIVE
// ────────────────────────────────────────────────────────────

export type LearningObjectiveCategory = 'understand' | 'apply' | 'analyze';

export interface LearningObjective {
  id: string;
  description: string;
  category: LearningObjectiveCategory;
}

// ────────────────────────────────────────────────────────────
// TEACHING METADATA
// ────────────────────────────────────────────────────────────

export interface TeachingMetadata {
  key_takeaways: string[];
  common_mistakes: string[];
  prerequisites: string[];       // concept_ids that should be learned first
  follow_up_concepts: string[];  // concept_ids to explore next
  difficulty_rating: number;     // 1-10 scale
}

// ────────────────────────────────────────────────────────────
// CONCEPT MANIFEST
// ────────────────────────────────────────────────────────────

export interface ConceptManifest {
  concept_id: string;
  display_name: string;
  category: string;
  complexity: string;
  animation_module_id: string;
  related_concepts: string[];
  learning_objectives: LearningObjective[];
  teaching_metadata: TeachingMetadata;
  granite_keywords: Record<string, string[]>;  // language code → keyword list
  estimated_duration_seconds: number;
}

// ────────────────────────────────────────────────────────────
// LESSON DEFINITIONS
// ────────────────────────────────────────────────────────────

export interface LessonStep {
  step_id: string;
  phase_name: string;
  annotation: string;
  target_fraction: number;       // 0-1 timeline position
  branch_options?: string[];     // optional branch IDs
}

export interface AssessmentHook {
  hook_id: string;
  type: 'quiz' | 'observation' | 'interaction';
  prompt: string;
  expected_concept_ids?: string[];
}

export interface LessonDefinition {
  lesson_id: string;
  concept_id: string;
  learning_objectives: string[]; // references LearningObjective.id
  steps: LessonStep[];
  expected_duration_seconds: number;
  difficulty: string;
  assessment_hooks: AssessmentHook[];
}

// ────────────────────────────────────────────────────────────
// CONCEPT PACKAGE — The unified self-registering contract
// ────────────────────────────────────────────────────────────

export interface ConceptPackage {
  manifest: ConceptManifest;
  moduleClass: new () => any;    // Constructor for TacticalModule implementation
  vocabulary: Record<string, string[]>;  // language code → keywords for Granite
  lessons?: LessonDefinition[];
}

// ────────────────────────────────────────────────────────────
// RUNTIME HEALTH REPORT
// ────────────────────────────────────────────────────────────

export interface ConceptHealthStatus {
  concept_id: string;
  manifest_valid: boolean;
  module_loadable: boolean;
  vocabulary_present: boolean;
  seed_exists: boolean;
  prerequisites_satisfied: boolean;
  errors: string[];
}

export interface RuntimeHealthReport {
  total_concepts: number;
  valid_concepts: number;
  invalid_concepts: number;
  concepts: ConceptHealthStatus[];
  boot_time_ms: number;
  timestamp: string;
}

// ────────────────────────────────────────────────────────────
// ANALYTICS EVENT TYPES
// ────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'concept_loaded'
  | 'concept_switched'
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_step_reached'
  | 'concept_abandoned'
  | 'follow_up_selected'
  | 'runtime_boot'
  | 'runtime_error'
  | 'validation_failure';

export interface AnalyticsEvent {
  event: AnalyticsEventType;
  concept_id?: string;
  data: Record<string, any>;
  timestamp: string;
  session_id: string;
}
