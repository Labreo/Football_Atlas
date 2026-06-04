import { ConceptPackage } from '@football-atlas/shared';
import { MidfieldOverloadModule } from '../tacticalModules/MidfieldOverloadModule';

// ────────────────────────────────────────────────────────────
// MIDFIELD OVERLOAD CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const midfieldOverloadPackage: ConceptPackage = {
  manifest: {
    concept_id: 'midfield_overload',
    display_name: 'Midfield Overload',
    category: 'ATTACKING_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'midfield_overload',
    related_concepts: ['false_9', 'third_man_run', 'positional_play', 'inverted_winger', 'compactness_pressing_lines'],
    learning_objectives: [
      {
        id: 'mo_obj_1',
        description: 'Understand the concept of numerical superiority in central midfield zones',
        category: 'understand',
      },
      {
        id: 'mo_obj_2',
        description: 'Analyze how positional superiority is achieved through rotations and winger narrowing',
        category: 'analyze',
      },
      {
        id: 'mo_obj_3',
        description: 'Identify the creation of free players when manipulating opponent defensive structures',
        category: 'understand',
      },
      {
        id: 'mo_obj_4',
        description: 'Apply midfield overload strategies to achieve clean progression rather than idle possession',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'An overload creates more attackers than defenders in a specific zone to bypass pressure.',
        'Midfield rotations and wingers narrowing draw defenders out of position, creating free players.',
        'Defenders must either follow the run and leave space behind, or hold shape and leave the receiver free.',
        'Overloads are used as a means of progression to break lines, not simply to keep possession.',
      ],
      common_mistakes: [
        'Overloading a zone without dynamic rotations, making the shape static and easy to mark.',
        'Failing to find the free player once the numerical advantage is established.',
        'Keeping possession within the overload without looking for forward progression paths.',
      ],
      prerequisites: ['compactness_pressing_lines'],
      follow_up_concepts: ['false_9', 'third_man_run'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['midfield overload', 'numerical superiority', 'positional superiority', 'overloading midfield', 'midfield overload zone', 'box midfield', 'overload'],
      de: ['mittelfeldüberzahl', 'überzahl im mittelfeld', 'mittelfeldüberlastung', 'überzahl'],
      es: ['superioridad numérica', 'superioridad numerica', 'sobrecarga en mediocampo', 'sobrecarga'],
    },
    estimated_duration_seconds: 12,
  },

  moduleClass: MidfieldOverloadModule,

  vocabulary: {
    en: ['midfield overload', 'numerical superiority', 'positional superiority', 'overloading midfield', 'midfield overload zone', 'box midfield', 'overload', 'free player', 'manipulating defense'],
    de: ['mittelfeldüberzahl', 'überzahl im mittelfeld', 'mittelfeldüberlastung', 'überzahl', 'freier spieler'],
    es: ['superioridad numérica', 'superioridad numerica', 'sobrecarga en mediocampo', 'sobrecarga', 'hombre libre'],
    fr: ['surnombre au milieu', 'supériorité numérique', 'overload milieu', 'homme libre'],
    it: ['superiorità numerica', 'sovraccarico a centrocampo', 'uomo libero', 'progressione di gioco'],
  },
};
