import { ConceptPackage } from '@football-atlas/shared';
import { ThirdManRunModule } from '../tacticalModules/ThirdManRunModule';

// ────────────────────────────────────────────────────────────
// THIRD MAN RUN CONCEPT PACKAGE
//
// Maps concept_id 'third_man_run' (from the shared seed) to
// the ThirdManRunModule animation.
// ────────────────────────────────────────────────────────────

export const thirdManRunPackage: ConceptPackage = {
  manifest: {
    concept_id: 'third_man_run',
    display_name: 'Third Man Run',
    category: 'TRANSITION',
    complexity: 'ADVANCED',
    animation_module_id: 'third_man_run',
    related_concepts: [
      'midfield_overload',
      'false_9',
      'inverted_winger',
      'positional_play',
      'counter_attack_trigger',
    ],
    learning_objectives: [
      {
        id: 'tmr_obj_1',
        description: 'Understand that the player who receives the final pass is often not the player who created the opportunity',
        category: 'understand',
      },
      {
        id: 'tmr_obj_2',
        description: 'Analyze how decoy movement and defender attraction vacate crucial space elsewhere',
        category: 'analyze',
      },
      {
        id: 'tmr_obj_3',
        description: 'Apply understanding of timing and coordination to activate a third-man run from deep',
        category: 'apply',
      },
      {
        id: 'tmr_obj_4',
        description: 'Understand the difference between receiving behind the defensive line versus in front of it based on defender coverage',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Third-man combinations use off-ball movement, timing, and distraction to break compact lines.',
        'The decoy player attracts defenders, shifting their focal point to create space behind them.',
        'The ball is only one part of the tactical picture — off-ball runners make the decisive advantage.',
        'One-touch lay-offs are critical to bypass shifting defenders before they can recover.',
      ],
      common_mistakes: [
        'Third man running too early, getting caught offside or running into closed zones.',
        'Lay-off player taking too many touches, stalling the momentum and allowing defenders to adjust.',
        'Initial pass made under too much pressure, resulting in an immediate midfield turnover.',
      ],
      prerequisites: ['compactness_pressing_lines'],
      follow_up_concepts: ['midfield_overload', 'positional_play', 'counter_attack_trigger'],
      difficulty_rating: 7,
    },
    granite_keywords: {
      en: [
        'third man run',
        'third-man run',
        'third man combination',
        'decoy run',
        'off-ball run',
        'xavi third man',
        'layoff pass',
        'wall pass',
        'one-touch layoff',
      ],
      de: [
        'lauf des dritten mannes',
        'dritter mann',
        'wandspieler',
        'ablagesteilpass',
        'abblaspiel',
      ],
      es: [
        'tercer hombre',
        'desmarque del tercer hombre',
        'pase al tercer hombre',
        'pared rápida',
      ],
    },
    estimated_duration_seconds: 16,
  },

  moduleClass: ThirdManRunModule,

  vocabulary: {
    en: [
      'third man run',
      'third-man run',
      'third man combination',
      'decoy run',
      'off-ball run',
      'xavi third man',
      'layoff pass',
      'wall pass',
      'one-touch layoff',
      'decoy movement',
      'third man route',
      'defender attraction',
      'attracting defenders',
      'wall player',
    ],
    de: [
      'lauf des dritten mannes',
      'dritter mann',
      'wandspieler',
      'ablagesteilpass',
      'abblaspiel',
      'laufweg des dritten mannes',
    ],
    es: [
      'tercer hombre',
      'desmarque del tercer hombre',
      'pase al tercer hombre',
      'pared rápida',
      'combinación tercer hombre',
    ],
    fr: [
      'troisième homme',
      'course du troisième homme',
      'appui remise troisième homme',
      'troisieme homme',
    ],
    it: [
      'terzo uomo',
      'corsa del terzo uomo',
      'inserimento del terzo uomo',
      'sponda del terzo uomo',
    ],
  },
};
