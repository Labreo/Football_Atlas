import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

export const invertedFullbacksPackage: ConceptPackage = {
  manifest: {
    concept_id: 'inverted_fullbacks',
    display_name: 'Inverted Fullbacks',
    category: 'ATTACKING_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'inverted_fullbacks',
    related_concepts: ['midfield_overload', 'box_midfield'],
    learning_objectives: [
      {
        id: 'inv_obj_1',
        description: 'Understand why a fullback moves centrally into the midfield pivot space',
        category: 'understand',
      },
      {
        id: 'inv_obj_2',
        description: 'Identify the structural protection inverted fullbacks offer against counters',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Fullbacks step inside into midfield corridors during build-up to form a double pivot.',
        'Creates central numerical overloads and protects against central counter-attacks.',
        'Frees up advanced midfielders to push higher and play in half-spaces.',
      ],
      common_mistakes: [
        'Inverting when the midfield is already congested, creating crowding.',
        'Fullbacks failing to track back wide if possession is turned over rapidly.',
      ],
      prerequisites: ['midfield_overload'],
      follow_up_concepts: ['box_midfield'],
      difficulty_rating: 7,
    },
    granite_keywords: {
      en: ['inverted fullbacks', 'inverted fullback', 'inverted full-back', 'pep fullbacks'],
    },
    estimated_duration_seconds: 14,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['inverted fullbacks', 'inverted fullback', 'inverted full-back', 'pep fullbacks'],
    de: ['einrückende außenverteidiger', 'inverser außenverteidiger', 'einrückender fullback'],
    es: ['lateral invertido', 'lateral hacia dentro', 'inverted fullback'],
  },
};
