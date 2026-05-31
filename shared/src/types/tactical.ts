export interface MatchExample {
  match: string;
  season: string;
  teams: string;
  description: string;
}

export type ConceptCategory = 
  | 'Attacking Shape' 
  | 'Out-of-Possession' 
  | 'Attacking Transition' 
  | 'Defensive Shape' 
  | 'Transition' 
  | 'Formation Mechanics' 
  | 'Attacking Mechanics' 
  | 'Defensive Organization';

export type ComplexityLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface TacticalConcept {
  concept_id: string;
  concept_name: string;
  category: ConceptCategory;
  complexity: ComplexityLevel;
  core_explanation: string;
  key_principles: string[];
  defensive_response: string;
  animation_module: string;
  historical_examples: MatchExample[];
  related_concepts: string[];
  docling_chunks: string[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorResponse {
  explanation: string;
  concept_id?: string;
  detected_level: ComplexityLevel;
  follow_up_suggestions: string[];
}
