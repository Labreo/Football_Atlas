import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

export const midfieldRotationPackage: ConceptPackage = {
  manifest: {
    concept_id: 'midfield_rotation',
    display_name: 'Midfield Rotation',
    category: 'ATTACKING_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'midfield_rotation',
    related_concepts: ['midfield_overload', 'positional_play'],
    learning_objectives: [
      {
        id: 'rotate_obj_1',
        description: 'Understand how dynamic midfielder swaps shake off man-markers',
        category: 'understand',
      },
      {
        id: 'rotate_obj_2',
        description: 'Analyze positional rotation structures that create vertical channels',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Central midfielders swap positions dynamically (e.g. 6 drops, 8 steps high, 10 rotates wide).',
        'Disrupts man-marking schemes by forcing defenders to hand over assignments.',
        'Requires continuous scanning, high technical quality, and strong spatial awareness.',
      ],
      common_mistakes: [
        'Swapping positions at the wrong time, leaving the center of the pitch completely empty.',
        'Failing to occupy the defensive screening zone during transitions.',
      ],
      prerequisites: ['midfield_overload'],
      follow_up_concepts: ['positional_play'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['midfield rotation', 'interchanging positions', 'midfield swaps', 'fluid midfield'],
    },
    estimated_duration_seconds: 14,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['midfield rotation', 'interchanging positions', 'midfield swaps', 'fluid midfield'],
    de: ['mittelfeldrotation', 'positionswechsel', 'rotierendes mittelfeld'],
    es: ['rotación de mediocampo', 'intercambio de posiciones', 'mediocampo fluido'],
  },
};
