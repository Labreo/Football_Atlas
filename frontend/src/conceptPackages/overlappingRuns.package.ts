import { ConceptPackage } from '@football-atlas/shared';
import { ThirdManRunModule } from '../tacticalModules/ThirdManRunModule';

export const overlappingRunsPackage: ConceptPackage = {
  manifest: {
    concept_id: 'overlapping_runs',
    display_name: 'Overlapping Runs',
    category: 'ATTACKING_SHAPE',
    complexity: 'BEGINNER',
    animation_module_id: 'overlapping_runs',
    related_concepts: ['third_man_run', 'inverted_winger'],
    learning_objectives: [
      {
        id: 'over_obj_1',
        description: 'Understand the concept and timing of overlapping fullback runs',
        category: 'understand',
      },
      {
        id: 'over_obj_2',
        description: 'Identify how the overlap stretches defensive blocks wide',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'An off-the-ball player sprints around the outside of the ball carrier.',
        'Stretches the opponent block horizontally and opens cross delivery lines.',
        'Forces the defending fullback into a difficult 2v1 coverage scenario.',
      ],
      common_mistakes: [
        'Starting the overlap sprint too early, running into offside positions.',
        'Failing to cover the vacated fullback zone behind the run.',
      ],
      prerequisites: [],
      follow_up_concepts: ['third_man_run'],
      difficulty_rating: 3,
    },
    granite_keywords: {
      en: ['overlapping runs', 'overlapping', 'overlap run', 'outside run'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: ThirdManRunModule,

  vocabulary: {
    en: ['overlapping runs', 'overlapping', 'overlap run', 'outside run'],
    de: ['hinterlaufen', 'hinterlaufende läufe', 'überlappung'],
    es: ['desdoblamiento', 'overlap', 'carrera de solapamiento'],
  },
};
