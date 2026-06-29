import { HistoricalBreakdown } from '@football-atlas/shared';
import { historicalBreakdownRepository } from '../repositories/historicalBreakdown.repository';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';

// Concept-specific annotation targets and camera view routes to keep annotations high-fidelity
const CONCEPT_MAPPINGS: Record<string, { player: string; arrow: string; space: string; view1: string; view2: string; view3: string }> = {
  false_9: {
    player: 'att_false9',
    arrow: 'arrow_f9_drop',
    space: 'overlay_vacated_space',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'tactical_shape'
  },
  high_press: {
    player: 'blue_cf',
    arrow: 'arrow_blue_rw_press',
    space: 'overlay_trigger_area',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'passing_lane'
  },
  defensive_block: {
    player: 'blue_r_st',
    arrow: 'red_rcb',
    space: 'overlay_compact_defense',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'space_creation'
  },
  pressing_trap: {
    player: 'red_cf',
    arrow: 'arrow_blocked_lane_dm',
    space: 'overlay_trap_zone',
    view1: 'overview',
    view2: 'passing_lane',
    view3: 'player_focus'
  },
  midfield_overload: {
    player: 'att_mid_left',
    arrow: 'arrow_mid_overload',
    space: 'overlay_midfield_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  },
  counter_attack_trigger: {
    player: 'att_winger',
    arrow: 'arrow_counter_run',
    space: 'overlay_counter_zone',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'space_creation'
  },
  inverted_winger: {
    player: 'att_winger_r',
    arrow: 'arrow_cut_inside',
    space: 'overlay_half_space',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'tactical_shape'
  },
  back_three_wing_back: {
    player: 'att_wingback_l',
    arrow: 'arrow_wb_overlap',
    space: 'overlay_flank_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'space_creation'
  },
  third_man_run: {
    player: 'att_third_man',
    arrow: 'arrow_third_run',
    space: 'overlay_run_zone',
    view1: 'overview',
    view2: 'passing_lane',
    view3: 'space_creation'
  },
  compactness_pressing_lines: {
    player: 'def_cb_l',
    arrow: 'arrow_compact_shift',
    space: 'overlay_compact_block',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  },
  gegenpressing: {
    player: 'blue_cf',
    arrow: 'arrow_blue_rw_press',
    space: 'overlay_trigger_area',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'passing_lane'
  },
  rest_defense: {
    player: 'blue_r_st',
    arrow: 'red_rcb',
    space: 'overlay_compact_defense',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'space_creation'
  },
  positional_play: {
    player: 'att_mid_left',
    arrow: 'arrow_mid_overload',
    space: 'overlay_midfield_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  },
  box_midfield: {
    player: 'att_mid_left',
    arrow: 'arrow_mid_overload',
    space: 'overlay_midfield_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  },
  overlapping_runs: {
    player: 'att_wingback_l',
    arrow: 'arrow_wb_overlap',
    space: 'overlay_flank_space',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'space_creation'
  },
  overloading_to_isolate: {
    player: 'att_winger_r',
    arrow: 'arrow_cut_inside',
    space: 'overlay_half_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'space_creation'
  },
  half_space_exploitation: {
    player: 'att_winger_r',
    arrow: 'arrow_cut_inside',
    space: 'overlay_half_space',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'tactical_shape'
  },
  vertical_tiki_taka: {
    player: 'att_third_man',
    arrow: 'arrow_third_run',
    space: 'overlay_run_zone',
    view1: 'overview',
    view2: 'passing_lane',
    view3: 'space_creation'
  },
  shadow_striker: {
    player: 'att_false9',
    arrow: 'arrow_f9_drop',
    space: 'overlay_vacated_space',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'space_creation'
  },
  pressing_triggers: {
    player: 'blue_cf',
    arrow: 'arrow_blue_rw_press',
    space: 'overlay_trigger_area',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'passing_lane'
  },
  midfield_rotation: {
    player: 'att_mid_left',
    arrow: 'arrow_mid_overload',
    space: 'overlay_midfield_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  },
  sweeper_keeper: {
    player: 'blue_cf',
    arrow: 'arrow_blue_rw_press',
    space: 'overlay_trigger_area',
    view1: 'overview',
    view2: 'player_focus',
    view3: 'tactical_shape'
  },
  defensive_transitions: {
    player: 'blue_r_st',
    arrow: 'red_rcb',
    space: 'overlay_compact_defense',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'space_creation'
  },
  inverted_fullbacks: {
    player: 'att_mid_left',
    arrow: 'arrow_mid_overload',
    space: 'overlay_midfield_space',
    view1: 'overview',
    view2: 'tactical_shape',
    view3: 'passing_lane'
  }
};

export class HistoricalBreakdownService {
  private static instance: HistoricalBreakdownService;

  private constructor() {}

  public static getInstance(): HistoricalBreakdownService {
    if (!HistoricalBreakdownService.instance) {
      HistoricalBreakdownService.instance = new HistoricalBreakdownService();
    }
    return HistoricalBreakdownService.instance;
  }

  public getBreakdownByExampleId(exampleId: string): HistoricalBreakdown | undefined {
    // 1. Attempt lookup in seeded breakdowns map
    const seeded = historicalBreakdownRepository.getByExampleId(exampleId);
    if (seeded) return seeded;

    // 2. Fallback: retrieve the historical example from repository
    const example = historicalExampleRepository.getById(exampleId);
    if (example) {
      return this.generateDynamicBreakdown(example);
    }

    return undefined;
  }

  public getAllBreakdowns(): HistoricalBreakdown[] {
    return historicalBreakdownRepository.getAll();
  }

  private generateDynamicBreakdown(example: any): HistoricalBreakdown {
    const conceptName = example.concept_id.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const mapping = CONCEPT_MAPPINGS[example.concept_id] || {
      player: 'att_player',
      arrow: 'arrow_movement',
      space: 'overlay_active_zone',
      view1: 'overview',
      view2: 'player_focus',
      view3: 'tactical_shape'
    };

    return {
      breakdown_id: `dynamic_${example.example_id}`,
      example_id: example.example_id,
      concept_id: example.concept_id,
      title: `Tactical Analysis: ${example.match_name}`,
      description: `A detailed breakdown of ${example.coach}'s implementation of the ${conceptName} system, focusing on key structural patterns during this fixture.`,
      timeline: [0.15, 0.50, 0.85],
      key_moments: [
        {
          moment_id: `${example.example_id}_m1`,
          timestamp: 0.15,
          title: "Initial Spacing & Spacial Context",
          description: `Establishing the tactical block. Under ${example.coach}, the team set up structure to facilitate the ${conceptName} pattern. Key personnel involved: ${example.players.slice(0, 3).join(', ')}.`,
          camera_view: mapping.view1 as any,
          animation_sequence: "setup",
          granite_context: `Initial phase of play: Observe how the spaces are occupied to open up passing lanes and pull the opponents out of shape.`,
          annotations: [
            {
              type: "player_highlight",
              target: mapping.player
            }
          ]
        },
        {
          moment_id: `${example.example_id}_m2`,
          timestamp: 0.50,
          title: "Pattern Trigger & Execution",
          description: example.description,
          camera_view: mapping.view2 as any,
          animation_sequence: "trigger",
          granite_context: `The decisive trigger: ${example.description}`,
          annotations: [
            {
              type: "arrow",
              target: mapping.arrow
            }
          ]
        },
        {
          moment_id: `${example.example_id}_m3`,
          timestamp: 0.85,
          title: "Exploiting Superiority",
          description: example.tactical_summary,
          camera_view: mapping.view3 as any,
          animation_sequence: "exploitation",
          granite_context: `Outcome: The team exploits positional superiority to successfully penetrate: ${example.tactical_summary}`,
          annotations: [
            {
              type: "space_highlight",
              target: mapping.space
            }
          ]
        }
      ],
      commentary: [
        `Teams set up in their primary shapes, preparing to exploit specific tactical trigger zones.`,
        `The tactical movement of key players disrupts the opponent's defensive organization.`,
        `Space is successfully created and exploited, achieving a clear positional advantage.`
      ],
      learning_goals: [
        `Observe the structural setup required for ${conceptName}.`,
        `Analyze the decision-making dilemma created for the opponents.`,
        `Understand the transition from building play to exploiting space.`
      ]
    };
  }
}

export const historicalBreakdownService = HistoricalBreakdownService.getInstance();
