import { ConceptPackage } from '@football-atlas/shared';
import { HighPressModule } from '../tacticalModules/HighPressModule';

export const sweeperKeeperPackage: ConceptPackage = {
  manifest: {
    concept_id: 'sweeper_keeper',
    display_name: 'Sweeper-Keeper',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'BEGINNER',
    animation_module_id: 'sweeper_keeper',
    related_concepts: ['high_press', 'defensive_block'],
    learning_objectives: [
      {
        id: 'sweeper_obj_1',
        description: 'Understand the high positioning of the goalkeeper outside the penalty box',
        category: 'understand',
      },
      {
        id: 'sweeper_obj_2',
        description: 'Identify how the goalkeeper supports build-up play as an extra defender',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'A sweeper-keeper positions high up the pitch to sweep balls played behind a high backline.',
        'Acts as a crucial passing outlet, helping bypass opponent pressing lines.',
        'Enables the defensive line to push higher, squeezing space in midfield.',
      ],
      common_mistakes: [
        'Stepping too far forward when the opponent has uncontrolled long-range shooting space.',
        'Misjudging the bounce of vertical long balls, getting bypassed outside the box.',
      ],
      prerequisites: [],
      follow_up_concepts: ['high_press'],
      difficulty_rating: 4,
    },
    granite_keywords: {
      en: ['sweeper keeper', 'sweeper-keeper', 'manuel neuer', 'high goalie'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: HighPressModule,

  vocabulary: {
    en: ['sweeper keeper', 'sweeper-keeper', 'manuel neuer', 'high goalie'],
    de: ['mitspielender torwart', 'mitspielender torhüter', 'sweeper-keeper'],
    es: ['portero líbero', 'portero libre', 'sweeper keeper'],
  },
};
