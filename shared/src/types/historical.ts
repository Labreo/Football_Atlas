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
