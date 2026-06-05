export interface LearnerProfile {
  userId: string;
  completed_concepts: string[];
  completed_breakdowns: string[];
  questions_asked: number;
  learning_time: number; // in minutes
  favorite_topics: string[];
  recommended_concepts: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  active_path_id: string | null;
  started_paths: Record<string, string>; // pathId -> startDate ISO
  completed_paths: Record<string, string>; // pathId -> completionDate ISO
}

export interface ConceptMastery {
  concept_id: string;
  completion_percentage: number; // 0 to 100
  confidence_score: number; // 0 to 100
  last_viewed: string | null; // ISO Date string
  historical_examples_completed: string[];
  breakdowns_completed: string[];
  questions_asked: number;
}

export interface LearningPath {
  path_id: string;
  title: string;
  description: string;
  ordered_concepts: string[];
  recommended_historical_examples: string[];
  recommended_breakdowns: string[];
  estimated_completion_time: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningRecommendations {
  next_concept_id: string | null;
  next_example_id: string | null;
  next_breakdown_id: string | null;
  related_concept_ids: string[];
  explanation: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  activity_type:
    | 'concept_viewed'
    | 'concept_completed'
    | 'breakdown_started'
    | 'breakdown_completed'
    | 'question_asked'
    | 'path_started'
    | 'path_completed';
  concept_id?: string;
  example_id?: string;
  path_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
