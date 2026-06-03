import { ConceptPackage } from '@football-atlas/shared';
import { DefensiveBlockModule } from '../tacticalModules/DefensiveBlockModule';

// ────────────────────────────────────────────────────────────
// DEFENSIVE BLOCK CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const defensiveBlockPackage: ConceptPackage = {
  manifest: {
    concept_id: 'defensive_block',
    display_name: 'Defensive Block',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'defensive_block',
    related_concepts: ['low_block', 'compactness', 'pressing_trap'],
    learning_objectives: [
      {
        id: 'db_obj_1',
        description: 'Understand how a compact defensive block denies space to the opposition',
        category: 'understand',
      },
      {
        id: 'db_obj_2',
        description: 'Analyze ball-oriented compression and how the block shifts laterally',
        category: 'analyze',
      },
      {
        id: 'db_obj_3',
        description: 'Understand the role of cover shadow utilization within a defensive block',
        category: 'understand',
      },
      {
        id: 'db_obj_4',
        description: 'Apply pressing triggers from within a compact defensive structure',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'The defensive block compresses space around the ball, denying time and passing angles.',
        'Ball-oriented shifting ensures the block tracks the ball position laterally.',
        'Cover shadows block passing lanes to midfielders behind pressing players.',
        'Pressing triggers from within the block create turnover opportunities.',
      ],
      common_mistakes: [
        'Allowing gaps between defensive and midfield lines.',
        'Shifting too slowly and leaving the weak side exposed.',
        'Pressing out of the block without coordinating the shift.',
        'Sitting too deep and allowing the opposition to build play unchallenged.',
      ],
      prerequisites: [],
      follow_up_concepts: ['low_block', 'compactness'],
      difficulty_rating: 5,
    },
    granite_keywords: {
      en: ['defensive block', 'compact block', 'compact defense', 'defensive shape'],
      de: ['abwehrblock', 'kompakter block', 'defensivblock'],
      es: ['bloque defensivo', 'bloque compacto', 'organización defensiva'],
    },
    estimated_duration_seconds: 15,
  },

  moduleClass: DefensiveBlockModule,

  vocabulary: {
    en: ['defensive block', 'compact block', 'compact defense', 'defensive shape', 'compactness shape', 'midfield defensive block'],
    de: ['abwehrblock', 'kompakter block', 'defensivblock', 'kompakter abwehrblock'],
    es: ['bloque defensivo', 'bloque compacto', 'bloque defensivo compacto', 'organización defensiva'],
    fr: ['bloc défensif', 'bloc compact', 'bloc defensif', 'organisation défensive'],
    it: ['blocco difensivo', 'blocco compatto', 'blocco difensivo compatto', 'fase difensiva di blocco'],
  },
};
