import { ConceptPackage } from '@football-atlas/shared';
import { DefensiveBlockModule } from '../tacticalModules/DefensiveBlockModule';

export const defensiveTransitionsPackage: ConceptPackage = {
  manifest: {
    concept_id: 'defensive_transitions',
    display_name: 'Defensive Transitions',
    category: 'TRANSITION',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'defensive_transitions',
    related_concepts: ['defensive_block', 'counter_attack_trigger'],
    learning_objectives: [
      {
        id: 'trans_obj_1',
        description: 'Understand team priorities immediately after losing possession',
        category: 'understand',
      },
      {
        id: 'trans_obj_2',
        description: 'Analyze recovery running lines of fullbacks and midfielders',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Defensive transitions focus on delaying counter-attacks and recovering shape.',
        'The closest player applies immediate delay pressure while teammates execute recovery sprints.',
        'Squeezing central corridors prevents the opponent from playing direct vertical passes.',
      ],
      common_mistakes: [
        'All players chasing the ball, leaving massive open corridors behind.',
        'Failing to drop quickly, allowing opponent wingers to exploit the space behind fullbacks.',
      ],
      prerequisites: ['defensive_block'],
      follow_up_concepts: ['counter_attack_trigger'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: ['defensive transitions', 'defensive transition', 'recovery run', 'transition defending'],
    },
    estimated_duration_seconds: 13,
  },

  moduleClass: DefensiveBlockModule,

  vocabulary: {
    en: ['defensive transitions', 'defensive transition', 'recovery run', 'transition defending'],
    de: ['defensive umschaltbewegung', 'umschalten defensiv', 'rückwärtsbewegung'],
    es: ['transición defensiva', 'repliegue defensivo', 'transición defensiva'],
  },
};
