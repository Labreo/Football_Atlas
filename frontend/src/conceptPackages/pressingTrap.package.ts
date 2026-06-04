import { ConceptPackage } from '@football-atlas/shared';
import { PressingTrapModule } from '../tacticalModules/PressingTrapModule';

// ────────────────────────────────────────────────────────────
// PRESSING TRAP CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const pressingTrapPackage: ConceptPackage = {
  manifest: {
    concept_id: 'pressing_trap',
    display_name: 'Pressing Trap',
    category: 'PRESSING',
    complexity: 'ADVANCED',
    animation_module_id: 'pressing_trap',
    related_concepts: ['high_press', 'compactness_pressing_lines', 'counter_press', 'defensive_block'],
    learning_objectives: [
      {
        id: 'pt_obj_1',
        description: 'Understand how pressing traps are created through shape shifting',
        category: 'understand',
      },
      {
        id: 'pt_obj_2',
        description: 'Analyze how teams intentionally force decisions by leaving bait options',
        category: 'analyze',
      },
      {
        id: 'pt_obj_3',
        description: 'Understand why the opponent believes a passing lane is safe when it is not',
        category: 'understand',
      },
      {
        id: 'pt_obj_4',
        description: 'Apply synchronized movement to spring a trap and recover possession',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'A pressing trap is not random pressure; it is a coordinated, deliberate trap.',
        'Defenders restrict wide and backpass options to funnel the ball carrier into a specific choice.',
        'The bait option is intentionally left open, only to be closed from all sides once the pass starts.',
        'Winning the ball in central/trap zones allows instant, high-value transition attacks.',
      ],
      common_mistakes: [
        'Springing the trap too early, allowing the passer to make a different decision.',
        'Defenders not acting simultaneously, leaving escape routes open.',
        'Failing to block backpasses, letting the opponent recycle possession easily.',
      ],
      prerequisites: ['high_press', 'compactness_pressing_lines'],
      follow_up_concepts: ['counter_press', 'defensive_block'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['pressing trap', 'pressing traps', 'sideline trap', 'touchline trap', 'tutor trap', 'tackle trap'],
      de: ['pressingfalle', 'pressingfallen', 'seitenlinie-falle'],
      es: ['trampa de presión', 'trampa de presion', 'embudo de presión'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: PressingTrapModule,

  vocabulary: {
    en: ['pressing trap', 'pressing traps', 'sideline trap', 'touchline trap', 'tutor trap', 'tackle trap', 'lure pass', 'inviting pass'],
    de: ['pressingfalle', 'pressingfallen', 'seitenlinie-falle', 'pressing falle', 'pressing-falle'],
    es: ['trampa de presión', 'trampa de presion', 'embudo de presión', 'trampa presion', 'zona de trampa'],
    fr: ['piège de pressing', 'piege de pressing', 'piège de pressage', 'entonnoir de pressing'],
    it: ['trappola di pressing', 'trappola del pressing', 'zona trappola', 'pressione guidata'],
  },
};
