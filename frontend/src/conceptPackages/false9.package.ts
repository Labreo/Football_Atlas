import { ConceptPackage } from '@football-atlas/shared';
import { False9Module } from '../tacticalModules/False9Module';

// ────────────────────────────────────────────────────────────
// FALSE 9 CONCEPT PACKAGE
// Self-contained definition — everything needed to register
// the False 9 concept into the Football Atlas runtime.
// ────────────────────────────────────────────────────────────

export const false9Package: ConceptPackage = {
  manifest: {
    concept_id: 'false_9',
    display_name: 'False 9',
    category: 'ATTACKING_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'false_9',
    related_concepts: ['midfield_overload', 'third_man_run', 'inverted_winger'],
    learning_objectives: [
      {
        id: 'f9_obj_1',
        description: 'Understand why a striker drops deep into midfield space',
        category: 'understand',
      },
      {
        id: 'f9_obj_2',
        description: 'Understand the defender decision-making dilemma created by the False 9',
        category: 'understand',
      },
      {
        id: 'f9_obj_3',
        description: 'Analyze how space is created behind the defensive line for third-man runs',
        category: 'analyze',
      },
      {
        id: 'f9_obj_4',
        description: 'Apply the concept of numerical superiority in midfield via the dropping striker',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'The False 9 creates a numerical overload in midfield by withdrawing the center-forward.',
        'Center-backs face a dilemma: follow the striker and leave space, or hold position and concede passing lanes.',
        'Third-man runners exploit the space vacated by center-backs who follow the dropping striker.',
      ],
      common_mistakes: [
        'Dropping too deep and disconnecting from the attack entirely.',
        'Not having runners ready to exploit the created space.',
        'Attempting the False 9 without sufficient technical quality in midfield.',
      ],
      prerequisites: [],
      follow_up_concepts: ['midfield_overload', 'third_man_run'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: ['false 9', 'false nine', 'dropping striker', 'messi dropping deep', 'dropping center-forward'],
      de: ['falsche neun', 'falscher neuner', 'abkippender stürmer'],
      es: ['falso nueve', 'delantero mentiroso', 'falso 9'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: False9Module,

  vocabulary: {
    en: ['false 9', 'false nine', 'dropping striker', 'messi dropping deep', 'dropping center-forward'],
    de: ['falsche neun', 'falscher neuner', 'abkippender stürmer', 'abkippenden stürmer', 'mitspielender stürmer'],
    es: ['falso nueve', 'delantero mentiroso', 'falso 9', 'nueve mentiroso'],
    fr: ['faux neuf', 'faux 9', 'attaquant de soutien', 'neuf menteur'],
    it: ['falso nove', 'falso 9', 'attaccante di raccordo', 'centravanti di manovra'],
  },
};
