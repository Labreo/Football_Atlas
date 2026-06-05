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
