import { ConceptPackage } from '@football-atlas/shared';
import { HighPressModule } from '../tacticalModules/HighPressModule';

export const pressingTriggersPackage: ConceptPackage = {
  manifest: {
    concept_id: 'pressing_triggers',
    display_name: 'Pressing Triggers',
    category: 'PRESSING',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'pressing_triggers',
    related_concepts: ['high_press', 'pressing_trap'],
    learning_objectives: [
      {
        id: 'trigger_obj_1',
        description: 'Identify common tactical cues for triggering a press',
        category: 'understand',
      },
      {
        id: 'trigger_obj_2',
        description: 'Understand defensive line coordination following a trigger event',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Pressing triggers are cues that signal the entire team to instantly close spaces.',
        'Common cues include back-to-play receptions, slow passes, or weak-foot controls.',
        'Requires synchronized forward movements to prevent escape passes.',
      ],
      common_mistakes: [
        'Pressing when the ball carrier is in full control, leaving gaps behind.',
        'Failing to back up the first line of press, creating vertical gaps.',
      ],
      prerequisites: ['high_press'],
      follow_up_concepts: ['pressing_trap'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: ['pressing triggers', 'pressing cue', 'defensive triggers', 'pressing trigger'],
    },
    estimated_duration_seconds: 13,
  },

  moduleClass: HighPressModule,

  vocabulary: {
    en: ['pressing triggers', 'pressing cue', 'defensive triggers', 'pressing trigger'],
    de: ['pressingsignale', 'pressingauslöser', 'auslöser'],
    es: ['desencadenantes de presion', 'disparador de presion', 'pressing triggers'],
  },
};
