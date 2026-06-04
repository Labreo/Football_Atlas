import { ConceptPackage } from '@football-atlas/shared';
import { CompactnessPressingLinesModule } from '../tacticalModules/CompactnessPressingLinesModule';

// ────────────────────────────────────────────────────────────
// COMPACTNESS & PRESSING LINES CONCEPT PACKAGE
// ────────────────────────────────────────────────────────────

export const compactnessPressingLinesPackage: ConceptPackage = {
  manifest: {
    concept_id: 'compactness_pressing_lines',
    display_name: 'Compactness & Pressing Lines',
    category: 'DEFENSIVE_SHAPE',
    complexity: 'ADVANCED',
    animation_module_id: 'compactness_pressing_lines',
    related_concepts: ['high_press', 'defensive_block', 'pressing_trap', 'counter_attack_trigger'],
    learning_objectives: [
      {
        id: 'cpl_obj_1',
        description: 'Understand how horizontal and vertical compactness restricts space',
        category: 'understand',
      },
      {
        id: 'cpl_obj_2',
        description: 'Analyze the connection between defensive distances and coordinated pressing',
        category: 'analyze',
      },
      {
        id: 'cpl_obj_3',
        description: 'Observe the creation of dangerous gaps when a player breaks shape individually',
        category: 'understand',
      },
      {
        id: 'cpl_obj_4',
        description: 'Apply shape recovery and space compression after a defensive line is broken',
        category: 'apply',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Compactness is the distance relationship between players and lines.',
        'Pressing succeeds because compactness is maintained.',
        'Defensive structures fail when gaps become too large.',
        'The team shape is more important than any individual defender.',
      ],
      common_mistakes: [
        'Breaking the line individually to press without support.',
        'Allowing horizontal or vertical lines to become stretched.',
        'Failing to drop or push up as a collective unit when the block moves.',
        'Allowing opponents to receive and turn in spaces between the lines.',
      ],
      prerequisites: [],
      follow_up_concepts: ['high_press', 'defensive_block'],
      difficulty_rating: 8,
    },
    granite_keywords: {
      en: ['compactness & pressing lines', 'pressing lines', 'defensive distance', 'line distance', 'team depth', 'shifting block', 'defensive lines'],
      de: ['kompaktheit & presslinien', 'presslinien', 'defensive distanz', 'linienabstand', 'mannschaftstiefe', 'verschiebeblock', 'defensivlinien'],
      es: ['compacidad y líneas de presión', 'lineas de presion', 'distancia defensiva', 'distancia entre lineas', 'profundidad del equipo', 'bloque de basculación', 'lineas defensivas'],
    },
    estimated_duration_seconds: 16,
  },

  moduleClass: CompactnessPressingLinesModule,

  vocabulary: {
    en: ['compactness & pressing lines', 'pressing lines', 'defensive distance', 'line distance', 'team depth', 'shifting block', 'defensive lines'],
    de: ['kompaktheit & presslinien', 'presslinien', 'defensive distanz', 'linienabstand', 'mannschaftstiefe', 'verschiebeblock', 'defensivlinien'],
    es: ['compacidad y líneas de presión', 'lineas de presion', 'distancia defensiva', 'distancia entre lineas', 'profundidad del equipo', 'bloque de basculación', 'lineas defensivas'],
    fr: ['compacité et lignes de pressing', 'lignes de pressing', 'distance défensive', 'distance entre les lignes', 'profondeur de l\'équipe', 'bloc coulissant', 'lignes défensives'],
    it: ['compattezza e linee di pressing', 'linee di pressing', 'distanza difensiva', 'distanza tra le linee', 'profondità della squadra', 'blocco di scivolamento', 'linee difensive'],
  },
};
