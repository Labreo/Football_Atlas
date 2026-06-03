import { ConceptPackage } from '@football-atlas/shared';
import { CounterAttackTriggerModule } from '../tacticalModules/CounterAttackTriggerModule';

// ────────────────────────────────────────────────────────────
// COUNTER-ATTACK CONCEPT PACKAGE
//
// Maps the legacy `counter_attack` concept ID (which ships in
// the shared seed and appears as "Counter-Attack" in the
// sidebar) to the CounterAttackTriggerModule animation.
//
// Without this package, clicking "Counter-Attack" shows a dead
// timeline because animationModuleRegistry has no entry for
// 'counter_attack'. Both this and counterAttackTrigger.package
// use the same module class, so the animation is identical.
// ────────────────────────────────────────────────────────────

export const counterAttackPackage: ConceptPackage = {
  manifest: {
    concept_id: 'counter_attack',
    display_name: 'Counter-Attack',
    category: 'TRANSITION',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'counter_attack_trigger',
    related_concepts: ['low_block', 'high_press', 'pressing_trap', 'counter_attack_trigger'],
    learning_objectives: [
      {
        id: 'ca_obj_1',
        description: 'Understand how transition moments create scoring opportunities through opponent disorganization',
        category: 'understand',
      },
      {
        id: 'ca_obj_2',
        description: 'Analyze how timing advantage allows attackers to outrun defensive recovery',
        category: 'analyze',
      },
      {
        id: 'ca_obj_3',
        description: 'Apply vertical passing triggers to exploit space behind a high attacking line',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Counter-attacks succeed because the opponent is temporarily out of shape.',
        'Timing is everything — the vertical outlet must be immediate.',
        'Delayed passes allow the defense to recover, neutralizing the transition advantage.',
      ],
      common_mistakes: [
        'Lateral safety passes that allow the opponent to reorganize.',
        'Failing to release the ball vertically in the first two seconds of possession.',
        'Runners not anticipating the transition before the ball is won.',
      ],
      prerequisites: [],
      follow_up_concepts: ['counter_attack_trigger', 'high_press', 'pressing_trap'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: ['counter attack', 'counter-attack', 'transition', 'vertical pass', 'fast break', 'outlet pass'],
      de: ['konterangriff', 'gegenangriff', 'umschalten', 'vertikalpassing'],
      es: ['contraataque', 'contra ataque', 'transición', 'pase vertical'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: CounterAttackTriggerModule,

  vocabulary: {
    en: ['counter attack', 'counter-attack', 'transition', 'vertical pass', 'fast break', 'outlet pass', 'possession recovery', 'counter trigger'],
    de: ['konterangriff', 'gegenangriff', 'umschalten', 'vertikalpassing', 'konter'],
    es: ['contraataque', 'contra ataque', 'transición', 'pase vertical', 'robo de balón'],
    fr: ['contre-attaque', 'transition offensive', 'passe verticale'],
    it: ['contropiede', 'transizione positiva', 'passo verticale'],
  },
};
