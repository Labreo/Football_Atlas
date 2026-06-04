import { ConceptPackage } from '@football-atlas/shared';
import { CounterAttackTriggerModule } from '../tacticalModules/CounterAttackTriggerModule';

// ────────────────────────────────────────────────────────────
// COUNTER-ATTACK TRIGGER CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const counterAttackTriggerPackage: ConceptPackage = {
  manifest: {
    concept_id: 'counter_attack_trigger',
    display_name: 'Counter-Attack Trigger',
    category: 'TRANSITION',
    complexity: 'ADVANCED',
    animation_module_id: 'counter_attack_trigger',
    related_concepts: ['high_press', 'pressing_trap', 'third_man_run', 'inverted_winger', 'compactness_pressing_lines'],
    learning_objectives: [
      {
        id: 'cat_obj_1',
        description: 'Analyze transition moments and the instant switch from defense to attack',
        category: 'analyze',
      },
      {
        id: 'cat_obj_2',
        description: 'Understand how opponent attacking commitment causes temporary defensive disorganization',
        category: 'understand',
      },
      {
        id: 'cat_obj_3',
        description: 'Identify and exploit available attacking space and open vertical channels',
        category: 'apply',
      },
      {
        id: 'cat_obj_4',
        description: 'Understand how timing advantage allows attackers to outrun defensive reorganization',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Counter-attacks succeed primarily because the opponent is caught temporarily out of shape.',
        'The critical advantage is timing; progression must be immediate and vertical to exploit disorganization.',
        'Win the ball, identify the free transition space, and release runners into channels instantly.',
        'Delayed outlet passes allow the defense to recover shape, neutralizing the transition advantage.',
      ],
      common_mistakes: [
        'Aimless running without vertical outlet passing targets.',
        'Delaying the first progression pass, allowing the opponent to counter-press and drop.',
        'Failing to occupy wide transition channels to stretch the recovering line.',
      ],
      prerequisites: ['compactness_pressing_lines'],
      follow_up_concepts: ['high_press', 'pressing_trap'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['counter-attack trigger', 'counter attack trigger', 'transition moment', 'counter-attacking trigger', 'counter trigger', 'outlet pass', 'possession recovery'],
      de: ['konterauslöser', 'konter auslöser', 'umschaltmoment', 'konterangriff'],
      es: ['gatillo de contraataque', 'transición ofensiva', 'recuperación de balón', 'contraataque'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: CounterAttackTriggerModule,

  vocabulary: {
    en: ['counter-attack trigger', 'counter attack trigger', 'transition moment', 'counter-attacking trigger', 'counter trigger', 'outlet pass', 'possession recovery', 'recovery race', 'disorganization'],
    de: ['konterauslöser', 'konter auslöser', 'umschaltmoment', 'konterangriff', 'gegenangriff'],
    es: ['gatillo de contraataque', 'transición ofensiva', 'recuperación de balón', 'contraataque', 'hombre desmarcado'],
    fr: ['déclencheur de contre-attaque', 'transition offensive', 'contre-attaque', 'moment de umschalt'],
    it: ['transizione positiva', 'ripartenza veloce', 'contropiede', 'momento di umschalt'],
  },
};
