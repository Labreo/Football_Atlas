import { ConceptPackage } from '@football-atlas/shared';
import { ThirdManRunModule } from '../tacticalModules/ThirdManRunModule';

export const verticalTikiTakaPackage: ConceptPackage = {
  manifest: {
    concept_id: 'vertical_tiki_taka',
    display_name: 'Vertical Tiki-Taka',
    category: 'ATTACKING_SHAPE',
    complexity: 'INTERMEDIATE',
    animation_module_id: 'vertical_tiki_taka',
    related_concepts: ['third_man_run', 'midfield_overload'],
    learning_objectives: [
      {
        id: 'tiki_obj_1',
        description: 'Understand the difference between lateral possession recycling and direct vertical entry',
        category: 'understand',
      },
      {
        id: 'tiki_obj_2',
        description: 'Analyze rapid one-touch combination patterns that break central channels',
        category: 'analyze',
      },
    ],
    teaching_metadata: {
      key_takeaways: [
        'Vertical Tiki-Taka prioritizes forward, line-breaking passes over static horizontal possession.',
        'Uses short passing triangles as bait to attract pressure, releasing runners vertically.',
        'Requires extremely rapid first-touch layoffs and continuous off-the-ball runs.',
      ],
      common_mistakes: [
        'Attempting vertical passes when passing lanes are congested, leading to easy turnovers.',
        'Midfielders taking too many touches, slowing down the transition speed.',
      ],
      prerequisites: ['third_man_run'],
      follow_up_concepts: ['midfield_overload'],
      difficulty_rating: 7,
    },
    granite_keywords: {
      en: ['vertical tiki taka', 'vertical possession', 'sarriball', 'one touch play'],
    },
    estimated_duration_seconds: 14,
  },

  moduleClass: ThirdManRunModule,

  vocabulary: {
    en: ['vertical tiki taka', 'vertical possession', 'sarriball', 'one touch play'],
    de: ['vertikales tiki taka', 'direktspiel', 'schnelles umschalten'],
    es: ['tiki taka vertical', 'posesión vertical', 'fútbol combinativo'],
  },
};
