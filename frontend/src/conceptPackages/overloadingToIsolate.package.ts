import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

export const overloadingToIsolatePackage: ConceptPackage = {
  manifest: {
    concept_id: 'overloading_to_isolate',
    display_name: 'Overload to Isolate',
    category: 'ATTACKING_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'overloading_to_isolate',
    related_concepts: ['midfield_overload', 'inverted_winger'],
    learning_objectives: [
      {
        id: 'isolate_obj_1',
        description: 'Understand the strategic purpose of asymmetric team structures',
        category: 'understand',
      },
      {
        id: 'isolate_obj_2',
        description: 'Identify switch triggers that locate the isolated winger in 1v1 space',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Overloading a single flank draws the defending team block over, leaving the weak-side empty.',
        'A quick diagonal cross-field pass isolates a fast winger in a 1v1 duel.',
        'Requires elite horizontal switch-passing capabilities from midfielders.',
      ],
      common_mistakes: [
        'Executing the switch pass too slowly, allowing the defense block to shift across.',
        'The isolated winger standing too narrow, reducing the space advantage.',
      ],
      prerequisites: ['midfield_overload'],
      follow_up_concepts: ['inverted_winger'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['overload to isolate', 'overload-isolate', 'weak side switch', 'diagonal switch'],
    },
    estimated_duration_seconds: 13,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['overload to isolate', 'overload-isolate', 'weak side switch', 'diagonal switch'],
    de: ['überladen zum isolieren', 'seitenwechsel', 'überladen'],
    es: ['sobrecargar para aislar', 'cambio de juego', 'aislar extremo'],
  },
};
