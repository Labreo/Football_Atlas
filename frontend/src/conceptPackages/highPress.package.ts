import { ConceptPackage } from '@football-atlas/shared';
import { HighPressModule } from '../tacticalModules/HighPressModule';

// ────────────────────────────────────────────────────────────
// HIGH PRESS CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const highPressPackage: ConceptPackage = {
  manifest: {
    concept_id: 'high_press',
    display_name: 'High Press',
    category: 'PRESSING',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'high_press',
    related_concepts: ['pressing_trap', 'counter_attack_trigger', 'compactness_pressing_lines'],
    learning_objectives: [
      {
        id: 'hp_obj_1',
        description: 'Understand the principles of pressing high up the pitch to win possession',
        category: 'understand',
      },
      {
        id: 'hp_obj_2',
        description: 'Analyze pressing triggers that initiate coordinated team pressing',
        category: 'analyze',
      },
      {
        id: 'hp_obj_3',
        description: 'Understand cover shadow positioning to cut off passing lanes while pressing',
        category: 'understand',
      },
      {
        id: 'hp_obj_4',
        description: 'Apply high press concepts to win possession in the final third',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'High pressing forces opponents into rushed decisions near their own goal.',
        'Pressing triggers — backward passes, weak-foot receptions — initiate the coordinated press.',
        'Cover shadow positioning blocks passing lanes without needing to tackle.',
        'The entire team must press as a unit to avoid exposing gaps.',
      ],
      common_mistakes: [
        'Pressing individually without coordinating with teammates.',
        'Pressing without a clear trigger, wasting energy.',
        'Leaving the backline too high without covering the space behind.',
        'Not recognizing when to drop off and reset the defensive shape.',
      ],
      prerequisites: [],
      follow_up_concepts: ['pressing_trap', 'counter_attack_trigger'],
      difficulty_rating: 5,
    },
    granite_keywords: {
      en: ['high press', 'pressing high', 'gegenpress', 'pressing trigger', 'counter-press'],
      de: ['gegenpressing', 'hohes pressen', 'pressingauslöser'],
      es: ['presión alta', 'presión en bloque alto', 'presionar arriba'],
    },
    estimated_duration_seconds: 15,
  },

  moduleClass: HighPressModule,

  vocabulary: {
    en: ['high press', 'pressing high', 'gegenpress', 'pressing trigger', 'counter-press'],
    de: ['gegenpressing', 'hohes pressen', 'pressingauslöser', 'gegenpress', 'hohes gegenpressing'],
    es: ['presión alta', 'presión en bloque alto', 'presion alta', 'presionar arriba'],
    fr: ['pressing haut', 'contre-pressing', 'pressing en bloc haut', 'contre pressing'],
    it: ['pressing alto', 'riaggressione', 'pressione alta', 'pressing ultra-offensivo'],
  },
};
