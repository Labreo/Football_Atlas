import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

export const boxMidfieldPackage: ConceptPackage = {
  manifest: {
    concept_id: 'box_midfield',
    display_name: 'Box Midfield',
    category: 'ATTACKING_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'box_midfield',
    related_concepts: ['midfield_overload', 'inverted_fullbacks'],
    learning_objectives: [
      {
        id: 'box_obj_1',
        description: 'Identify the structural elements of a box midfield',
        category: 'understand',
      },
      {
        id: 'box_obj_2',
        description: 'Understand how a box midfield creates numerical advantages centrally',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Formed by two defensive midfielders (pivots) and two attacking midfielders.',
        'Overloads standard three-midfielder defensive blocks by creating a 4v3.',
        'Secures central passing corridors and half-spaces for quick combination play.',
      ],
      common_mistakes: [
        'Attacking midfielders dropping too low, flattening the box.',
        'Pivots failing to step wide when the fullback steps inside.',
      ],
      prerequisites: ['midfield_overload'],
      follow_up_concepts: ['inverted_fullbacks'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['box midfield', 'box-midfield', '3-2-2-3', 'WM formation', 'box structure'],
    },
    estimated_duration_seconds: 14,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['box midfield', 'box-midfield', '3-2-2-3', 'WM formation', 'box structure'],
    de: ['box-mittelfeld', 'wm-formation', 'boxmittelfeld'],
    es: ['cuadrado en el medio', 'medio campo en caja', 'box midfield'],
  },
};
