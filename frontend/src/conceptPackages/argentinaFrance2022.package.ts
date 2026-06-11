import { ConceptPackage } from '@football-atlas/shared';
import { ArgentinaFrance2022Module } from '../tacticalModules/ArgentinaFrance2022Module';

export const argentinaFrance2022Package: ConceptPackage = {
  manifest: {
    concept_id: 'argentina_france_2022_equaliser',
    display_name: 'Mbappé Equaliser Sequence',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'argentina_france_2022_equaliser',
    related_concepts: ['compactness_pressing_lines', 'defensive_block', 'counter_attack_trigger'],
    learning_objectives: [
      {
        id: 'afe_obj_1',
        description: 'Understand how fatigue compromises vertical block compactness.',
        category: 'understand',
      },
      {
        id: 'afe_obj_2',
        description: 'Identify the spatial triggers that lead to central shape distortion.',
        category: 'understand',
      },
      {
        id: 'afe_obj_3',
        description: 'Analyze how one-touch wall passes exploit vertical line disconnections.',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Argentina\'s midfield line became disconnected from their backline, exposing central corridors.',
        'Kylian Mbappé and the No. 9 exploited the gap with a rapid, vertical one-two combination.',
        'Romero\'s step forward left a vacated pocket that was immediately penetrated.',
      ],
      common_mistakes: [
        'Failing to drop midfielders to cover the space in front of the backline.',
        'Defenders stepping up individually without support coverage.',
      ],
      prerequisites: ['compactness_pressing_lines'],
      follow_up_concepts: ['counter_attack_trigger'],
      difficulty_rating: 7,
    },
    granite_keywords: {
      en: ['equaliser', 'mbappe volley', 'argentina vs france', 'shape collapse', 'disconnect'],
      de: ['mbappe ausgleich', 'argentinien gegen frankreich'],
      es: ['empate mbappe', 'argentina contra francia'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: ArgentinaFrance2022Module,

  vocabulary: {
    en: ['equaliser', 'mbappe volley', 'argentina vs france', 'shape collapse', 'disconnect'],
    de: ['mbappe ausgleich', 'argentinien gegen frankreich'],
    es: ['empate mbappe', 'argentina contra francia'],
  },
};
