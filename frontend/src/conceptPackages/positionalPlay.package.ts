import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

export const positionalPlayPackage: ConceptPackage = {
  manifest: {
    concept_id: 'positional_play',
    display_name: 'Positional Play',
    category: 'ATTACKING_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'positional_play',
    related_concepts: ['midfield_overload', 'false_9'],
    learning_objectives: [
      {
        id: 'pos_obj_1',
        description: 'Understand the concept of spatial layout and Zones of Positional Play',
        category: 'understand',
      },
      {
        id: 'pos_obj_2',
        description: 'Analyze how zone occupancy rules dictate player spacing and support triangles',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Positional Play divides the pitch into a grid to regulate player positioning.',
        'No more than three players should occupy the same horizontal line to avoid passing redundancies.',
        'No more than two players should occupy the same vertical channel.',
      ],
      common_mistakes: [
        'Stagnant positioning where players fail to rotate dynamically into vacant zones.',
        'Over-congesting central spaces, making defensive coverage easy.',
      ],
      prerequisites: ['midfield_overload'],
      follow_up_concepts: ['false_9'],
      difficulty_rating: 9,
    },
    granite_keywords: {
      en: ['positional play', 'juego de posicion', 'positionspiel', 'spatial play'],
    },
    estimated_duration_seconds: 15,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['positional play', 'juego de posicion', 'positionspiel', 'spatial play'],
    de: ['positionsspiel', 'raumaufteilung', 'juego de posicion'],
    es: ['juego de posición', 'juego de posicion', 'posición del jugador'],
  },
};
