import { ConceptPackage } from '@football-atlas/shared';
import { InvertedWingerModule } from '../tacticalModules/InvertedWingerModule';

// ────────────────────────────────────────────────────────────
// INVERTED WINGER CONCEPT PACKAGE
//
// Maps concept_id 'inverted_winger' (from the shared seed) to
// the InvertedWingerModule animation. This package integrates
// with the ConceptLoader → AnimationModuleRegistry pipeline so
// that any sidebar click or Granite NLP response for
// 'inverted_winger' automatically loads the lesson.
// ────────────────────────────────────────────────────────────

export const invertedWingerPackage: ConceptPackage = {
  manifest: {
    concept_id: 'inverted_winger',
    display_name: 'Inverted Winger',
    category: 'ATTACKING_SHAPE',
    complexity: 'BEGINNER',
    animation_module_id: 'inverted_winger',
    related_concepts: [
      'midfield_overload',
      'third_man_run',
      'false_9',
      'counter_attack_trigger',
    ],
    learning_objectives: [
      {
        id: 'iw_obj_1',
        description: 'Understand what an inverted winger is and why they play on their weaker flank',
        category: 'understand',
      },
      {
        id: 'iw_obj_2',
        description: 'Analyze how half-space occupation creates a defensive dilemma for the opposing fullback',
        category: 'analyze',
      },
      {
        id: 'iw_obj_3',
        description: 'Apply understanding of structural effects — how one movement reshapes the team\'s entire attacking shape',
        category: 'apply',
      },
      {
        id: 'iw_obj_4',
        description: 'Understand how the overlapping fullback recovers width when the winger inverts',
        category: 'understand',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'An inverted winger is not simply a winger on the wrong foot — the role exists to exploit half-spaces.',
        'The inward movement creates a defensive dilemma: follow inside and expose width, or hold and leave the half-space free.',
        'The fullback automatically becomes a wide threat when the winger vacates the touchline.',
        'One positional decision restructures the entire attacking shape.',
      ],
      common_mistakes: [
        'Cutting inside without a supporting runner exploiting the wide channel.',
        'Moving too early before the fullback has started the overlap run.',
        'Drifting too central and congesting the striker\'s space.',
      ],
      prerequisites: [],
      follow_up_concepts: ['midfield_overload', 'third_man_run', 'false_9'],
      difficulty_rating: 4,
    },
    granite_keywords: {
      en: [
        'inverted winger',
        'inverted winger role',
        'inside cut',
        'half space winger',
        'winger cuts inside',
        'inversion',
        'overlapping fullback',
        'half-space',
        'robben',
        'salah',
        'mane',
      ],
      de: [
        'inverted winger',
        'innenseite stürmer',
        'halbräume',
        'einwärts schneiden',
        'flügelstürmer',
      ],
      es: [
        'extremo invertido',
        'corte interior',
        'mediapunta lateral',
        'espacio entre líneas',
        'banda contraria',
      ],
    },
    estimated_duration_seconds: 16,
  },

  moduleClass: InvertedWingerModule,

  vocabulary: {
    en: [
      'inverted winger',
      'inverted winger role',
      'inside cut',
      'half space winger',
      'winger cuts inside',
      'inversion',
      'overlapping fullback',
      'half-space',
      'half space',
      'opposite foot winger',
      'cutting inside',
      'wide-to-central movement',
      'robben',
      'salah',
      'mane',
      'diagonal run',
      'winger role',
    ],
    de: [
      'inverted winger',
      'innenseite stürmer',
      'halbräume',
      'einwärts schneiden',
      'flügelstürmer',
      'einwärts laufen',
    ],
    es: [
      'extremo invertido',
      'corte interior',
      'mediapunta lateral',
      'espacio entre líneas',
      'banda contraria',
      'corte diagonal',
    ],
    fr: [
      'ailier inversé',
      'ailier qui coupe',
      'demi-espace',
      'chevauchement du latéral',
    ],
    it: [
      'ala accentrata',
      'taglio interno',
      'mezzospazio',
      'terzino sovrapposto',
    ],
  },
};
