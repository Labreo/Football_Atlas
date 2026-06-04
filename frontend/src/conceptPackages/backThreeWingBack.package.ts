import { ConceptPackage } from '@football-atlas/shared';
import { BackThreeWingBackModule } from '../tacticalModules/BackThreeWingBackModule';

// ────────────────────────────────────────────────────────────
// BACK THREE / WING-BACK SYSTEM CONCEPT PACKAGE
//
// Maps concept_id 'back_three_wing_back' (from the shared seed) to
// the BackThreeWingBackModule animation.
// ────────────────────────────────────────────────────────────

export const backThreeWingBackPackage: ConceptPackage = {
  manifest: {
    concept_id: 'back_three_wing_back',
    display_name: 'Back 3 / Wing-Back System',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'back_three_wing_back',
    related_concepts: [
      'inverted_winger',
      'midfield_overload',
      'compactness_pressing_lines',
      'high_press',
      'positional_play',
    ],
    learning_objectives: [
      {
        id: 'bwb_obj_1',
        description: 'Understand that a Back 3 system is not simply three defenders, but a dynamic team structure',
        category: 'understand',
      },
      {
        id: 'bwb_obj_2',
        description: 'Analyze how the team shape transforms between defensive (5-back) and attacking (3-2-5) structures',
        category: 'analyze',
      },
      {
        id: 'bwb_obj_3',
        description: 'Understand the critical role of wing-backs in maintaining width, balance, and vertical coverage',
        category: 'understand',
      },
      {
        id: 'bwb_obj_4',
        description: 'Evaluate the structural advantages and tradeoffs of the system, such as central stability versus physical demands',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'A Back 3 system changes shape continuously depending on who has possession of the ball.',
        'Wing-backs are critical to providing width and maintaining balance, running the entire length of the flanks.',
        'In possession, the shape expands into a 3-2-5, occupying all five attacking lanes to stretch the defensive block.',
        'Out of possession, the wing-backs drop deep to form a compact 5-back line, providing central security and numerical superiority.',
      ],
      common_mistakes: [
        'Wing-backs failing to recover defensively, leaving the side center-backs exposed in 1v1 situations in wide channels.',
        'Wide center-backs stepping too far central, leaving the flanks completely unprotected.',
        'Double-pivot midfielders failing to drop and screen, exposing the backline to direct central transitions.',
      ],
      prerequisites: ['compactness_pressing_lines'],
      follow_up_concepts: ['inverted_winger', 'midfield_overload', 'positional_play'],
      difficulty_rating: 6,
    },
    granite_keywords: {
      en: [
        'back three',
        'back 3',
        'wing back',
        'wingback',
        'three center backs',
        '3-4-3',
        '3-5-2',
        'wingback system',
        'back three system',
        'antonio conte',
        'wing back role',
        'wingbacks',
      ],
      de: [
        'dreierkette',
        'flügelverteidiger',
        'dreierlinie',
        '3-4-3 system',
        'wing-back rolle',
      ],
      es: [
        'tres centrales',
        'carrilero',
        'sistema de tres defensas',
        'carrileros',
        'defensa de tres',
      ],
    },
    estimated_duration_seconds: 16,
  },

  moduleClass: BackThreeWingBackModule,

  vocabulary: {
    en: [
      'back three',
      'back 3',
      'wing back',
      'wingback',
      'three center backs',
      '3-4-3',
      '3-5-2',
      'wingback system',
      'back three system',
      'antonio conte',
      'wing back role',
      'wingbacks',
      'three center-backs',
      'dynamic wingbacks',
      '3-2-5 attacking shape',
      'shape transformation',
      'defensive shape transformation',
      'attacking shape transformation',
    ],
    de: [
      'dreierkette',
      'flügelverteidiger',
      'dreierlinie',
      '3-4-3 system',
      'wing-back rolle',
      'dreierabwehr',
      'flankenspieler',
    ],
    es: [
      'tres centrales',
      'carrilero',
      'sistema de tres defensas',
      'carrileros',
      'defensa de tres',
      'carrileros adelantados',
      'tres defensores',
    ],
    fr: [
      'défense à trois',
      'piston',
      'système à trois défenseurs',
      'pistons',
      '3-4-3 système',
      'défenseurs centraux excentrés',
    ],
    it: [
      'difesa a tre',
      'esterno di centrocampo',
      'sistema a tre difensori',
      'quinti',
      'esterni a tutta fascia',
      'difesa a 5',
    ],
  },
};
