import { ConceptPackage } from '@football-atlas/shared';
import { DefensiveBlockModule } from '../tacticalModules/DefensiveBlockModule';

export const restDefensePackage: ConceptPackage = {
  manifest: {
    concept_id: 'rest_defense',
    display_name: 'Rest Defense',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'rest_defense',
    related_concepts: ['defensive_block', 'compactness_pressing_lines'],
    learning_objectives: [
      {
        id: 'rest_obj_1',
        description: 'Understand the concept of defensive preparation during the attacking phase',
        category: 'understand',
      },
      {
        id: 'rest_obj_2',
        description: 'Analyze positional structure of defenders behind the active buildup play',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Rest Defense keeps the team structurally prepared to handle counter-attacks before turnovers happen.',
        'Proper spacing forces opponent counter-attacks wide rather than central.',
        'Saves energy by preventing long vertical sprints through early containment.',
      ],
      common_mistakes: [
        'Defenders stepping too high without tracking opponent forward positions.',
        'Midfielders failing to form a central screening block in front of the center-backs.',
      ],
      prerequisites: ['defensive_block'],
      follow_up_concepts: ['compactness_pressing_lines'],
      difficulty_rating: 9,
    },
    granite_keywords: {
      en: ['rest defense', 'rest-defense', 'preventative defending', 'restverteidigung'],
    },
    estimated_duration_seconds: 14,
  },

  moduleClass: DefensiveBlockModule,

  vocabulary: {
    en: ['rest defense', 'rest-defense', 'preventative defending', 'restverteidigung'],
    de: ['restverteidigung', 'absicherung', 'konterabsicherung'],
    es: ['vigilancias defensivas', 'defensa preventiva', 'rest defense'],
  },
};
