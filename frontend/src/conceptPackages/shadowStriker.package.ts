import { ConceptPackage } from '@football-atlas/shared';
import { False9Module } from '../tacticalModules/False9Module';

export const shadowStrikerPackage: ConceptPackage = {
  manifest: {
    concept_id: 'shadow_striker',
    display_name: 'Shadow Striker',
    category: 'ATTACKING_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'shadow_striker',
    related_concepts: ['false_9', 'third_man_run'],
    learning_objectives: [
      {
        id: 'shadow_obj_1',
        description: 'Understand the role of space interpreter (Raumdeuter)',
        category: 'understand',
      },
      {
        id: 'shadow_obj_2',
        description: 'Analyze timing of late vertical runs behind the striker pivot',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'A shadow striker starts from a deeper or wider position, making late runs into central spaces.',
        'Exploits defensive coverage focus on the focal center-forward.',
        'Relies on superb scanning, space interpretation, and clinical finishing.',
      ],
      common_mistakes: [
        'Running too early, joining the striker line and becoming easy to mark.',
        'Failing to read the movements of center-backs, running into congested channels.',
      ],
      prerequisites: ['false_9'],
      follow_up_concepts: ['third_man_run'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: ['shadow striker', 'raumdeuter', 'second striker', 'second forward'],
    },
    estimated_duration_seconds: 13,
  },

  moduleClass: False9Module,

  vocabulary: {
    en: ['shadow striker', 'raumdeuter', 'second striker', 'second forward'],
    de: ['hängende spitze', 'raumdeuter', 'zweiter stürmer'],
    es: ['segundo delantero', 'raumdeuter', 'media punta'],
  },
};
