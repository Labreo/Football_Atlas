import { ConceptPackage } from '@football-atlas/shared';
import { GegenpressingModule } from '../tacticalModules/GegenpressingModule';

export const gegenpressingPackage: ConceptPackage = {
  manifest: {
    concept_id: 'gegenpressing',
    display_name: 'Gegenpressing',
    category: 'PRESSING',
    complexity: 'ADVANCED',
    animation_module_id: 'gegenpressing',
    related_concepts: ['high_press', 'pressing_trap'],
    learning_objectives: [
      {
        id: 'gegen_obj_1',
        description: 'Understand the core objective of winning the ball within seconds of transition',
        category: 'understand',
      },
      {
        id: 'gegen_obj_2',
        description: 'Identify tactical triggers for initiating the counter-press',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Gegenpressing targets the opponent\'s structural vulnerability at the exact moment they recover the ball.',
        'It prevents the opponent from playing a structured transition outlet pass.',
        'Requires immediate, high-intensity closing down by closest attackers.',
      ],
      common_mistakes: [
        'Counter-pressing individually rather than as a coordinated unit.',
        'Failing to drop and cover spaces behind the press if the initial line is broken.',
      ],
      prerequisites: ['high_press'],
      follow_up_concepts: ['pressing_trap'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['gegenpressing', 'counterpressing', 'counter-press', 'klopp press'],
    },
    estimated_duration_seconds: 15,
  },

  moduleClass: GegenpressingModule,

  vocabulary: {
    en: ['gegenpressing', 'counterpressing', 'counter-press', 'klopp press'],
    de: ['gegenpressing', 'umschaltspiel', 'gegenpressen'],
    es: ['contrapresión', 'gegenpressing', 'presion tras perdida'],
  },
};
