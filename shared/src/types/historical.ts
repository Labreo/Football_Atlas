export interface HistoricalExample {
  example_id: string;
  concept_id: string;
  match_name: string;
  competition: string;
  season: string;
  teams: string[];
  date: string;
  coach: string;
  players: string[];
  description: string;
  tactical_summary: string;
  source_references: string[];
  confidence_score: number;
  tags: string[];
  review_status: 'draft' | 'reviewed' | 'approved';
  validation_metadata: Record<string, any>;
  beginner_friendly: boolean;
}

export interface HistoricalScenarioDefinition {
  match_id: string;
  concept_id: string;
  starting_positions: Record<string, { x: number; z: number }>;
  formation: string;
  key_movements: Array<{
    playerId: string;
    targetPos: { x: number; z: number };
    time: number;
  }>;
  timeline: Array<{
    time: number;
    event: string;
  }>;
}

export interface WhatIfOption {
  option_id: string;
  label: string;
  kind: 'pass' | 'carry' | 'shot';
  from_x: number;
  from_z: number;
  to_x: number;
  to_z: number;
  receiver_name?: string;
  viable: boolean;
  value: number;
  value_kind: 'xT' | 'xG';
  chosen?: boolean;
  best?: boolean;
}

export interface BreakdownMoment {
  moment_id: string;
  timestamp: number;
  title: string;
  description: string;
  camera_view: 'overview' | 'player_focus' | 'tactical_shape' | 'passing_lane' | 'space_creation';
  animation_sequence: string;
  granite_context: string;
  annotations: Array<{
    type: 'arrow' | 'passing_lane' | 'player_highlight' | 'space_highlight' | 'shape_overlay' | 'note';
    target: string;
    color?: string;
  }>;
  what_if_options?: WhatIfOption[];
}

export interface HistoricalBreakdown {
  breakdown_id: string;
  example_id: string;
  concept_id: string;
  title: string;
  description: string;
  timeline: number[];
  key_moments: BreakdownMoment[];
  commentary: string[];
  learning_goals: string[];
}

export interface HistoricalEvidence {
  evidence_id: string;
  example_id: string;
  document_id: string;
  chunk_id: string;
  source_title: string;
  source_type: string;
  coach: string;
  season: string;
  excerpt: string;
  confidence: number;
}

export interface DoclingChunk {
  chunk_id: string;
  document_id: string;
  content: string;
  section_title: string;
  page_number: number;
  word_count: number;
  concept_tags: string[];
  language?: string;
  original_language?: string;
  historical_tags?: string[];
  match_tags?: string[];
  coach_tags?: string[];
  player_tags?: string[];
}

export interface DoclingDocument {
  document_id: string;
  metadata: {
    title: string;
    source: string;
    author: string;
    publication_year: number;
    document_type: string;
    upload_timestamp: string;
    processing_status: string;
    language?: string;
    original_language?: string;
  };
  chunk_ids: string[];
}

export type ConceptTags = string[];
export type HistoricalTags = string[];
export type MatchTags = string[];
export type CoachTags = string[];
export type PlayerTags = string[];
