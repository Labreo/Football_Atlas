import { TacticalConcept } from '../types/tactical';
import { TacticalCategory, ComplexityLevel, RequiredOverlay } from '../enums/tactical.enums';

export const false9Seed: TacticalConcept = {
  concept_id: 'false_9',
  concept_name: 'False 9',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A center-forward who drops deep into the space between the opponent\'s defensive line and midfield (Zone 14). By dropping deep, this player creates a numerical superiority in central midfield and disrupts the defensive marking scheme by forcing center-backs to choose between following the run or conceding space.',
  key_principles: [
    {
      title: 'Numerical Midfield Overload',
      description: 'Dropping deep to form a passing diamond in midfield, turning a standard 3v3 into a 4v3 numerical advantage.'
    },
    {
      title: 'Defensive Disorganization',
      description: 'Dragging an opposing central defender out of the backline, creating gaping vertical channels in their structure.'
    },
    {
      title: 'Third Man Exploitation',
      description: 'Utilizing inside forwards or overlapping wingbacks to run directly into the space vacated by the center-back.'
    }
  ],
  defensive_response: {
    response_id: 'zonal_handover_screen',
    title: 'Zonal Midfield Screening Handover',
    description: 'Central defenders maintain vertical shape while passing the dropping striker to a defensive midfielder who drops to screen the passing lanes.',
    effectiveness_rating: 85,
    advantages: [
      'Preserves the defensive line\'s horizontal alignment',
      'Prevents gaps from opening behind the central defenders'
    ],
    risks: [
      'Gives the False 9 time to turn and build play if the midfielder is late to step up',
      'Leaves the defensive midfielder overloaded'
    ]
  },
  animation_module: {
    module_id: 'false9',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'el_clasico_2009',
      title: 'Messi\'s False 9 Masterclass at the Bernabéu',
      competition: 'La Liga',
      season: '2008-09',
      teams: 'Real Madrid vs. Barcelona',
      tactical_context: 'Pep Guardiola deployed Lionel Messi centrally but instructed him to drop into midfield, completely bypassing Real Madrid\'s center-back marking.',
      summary: 'Messi dropped into Zone 14 repeatedly. Cannavaro followed him, creating space behind which Thierry Henry and Samuel Eto\'o exploited to secure a historic 6-2 victory.',
      relevance_score: 98,
      video_url: 'https://video.footballatlas.com/clasico-2009-f9.mp4',
      event_timestamps: [
        { name: 'Messi drop & Henry run trigger', timestamp: '18:42' },
        { name: 'Turnover & exploit transition goal', timestamp: '56:15' }
      ]
    }
  ],
  related_concepts: ['third_man_run', 'midfield_overload'],
  docling_chunks: [
    {
      chunk_id: 'doc_f9_pos_play_12',
      source_document: 'Juego_de_Posicion_Manual_v2.pdf',
      relevance_score: 96
    }
  ],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const highPressSeed: TacticalConcept = {
  concept_id: 'high_press',
  concept_name: 'High Press',
  category: TacticalCategory.PRESSING,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A defensive strategy where the out-of-possession team positions their defensive lines high up the pitch, applying immediate pressure on the opponent center-backs and goalkeeper to win possession close to the opponent\'s box.',
  key_principles: [
    {
      title: 'Ball-Oriented Compression',
      description: 'Shifting the entire team block towards the location of the ball, denying the opponent space to turn.'
    },
    {
      title: 'Cover Shadow Utilization',
      description: 'Positioning pressing players to block passing lines to midfielders behind them using their body orientation.'
    },
    {
      title: 'Pressing Triggers',
      description: 'Initiating immediate max-intensity closing speed upon specific triggers, such as a slow lateral pass or a reception on a weak foot.'
    }
  ],
  defensive_response: {
    response_id: 'long_ball_bypass',
    title: 'Direct Long Buildup Bypass',
    description: 'Playing direct vertical long balls over the pressing lines to target-men attackers, bypassing the high block completely.',
    effectiveness_rating: 80,
    advantages: [
      'Bypasses the high-density press immediately',
      'Isolates pressing defenders in 1v1 duels in their own half'
    ],
    risks: [
      'Results in high turnover rates if direct aerial duels are lost',
      'Requires elite physical hold-up strikers'
    ]
  },
  animation_module: {
    module_id: 'highPress',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PRESSING_ZONES, RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.DEFENSIVE_LINES]
  },
  historical_examples: [
    {
      match_id: 'liv_mci_2018',
      title: 'Klopp\'s Relentless Pressing vs. Guardiola\'s Build-up',
      competition: 'Premier League',
      season: '2017-18',
      teams: 'Liverpool vs. Manchester City',
      tactical_context: 'Liverpool applied intensive counter-pressing to disrupt Manchester City\'s deep build-up play.',
      summary: 'Firmino, Salah, and Mané pressed City\'s backline, forcing passing mistakes from Stones and Ederson, leading to three goals in a chaotic 10-minute spell.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/liverpool-city-2018-press.mp4',
      event_timestamps: [
        { name: 'Salah interception & goal', timestamp: '62:10' }
      ]
    }
  ],
  related_concepts: ['pressing_trap', 'compactness'],
  docling_chunks: [
    {
      chunk_id: 'doc_press_klopp_09',
      source_document: 'Gegenpressing_Tactics_Study.pdf',
      relevance_score: 92
    }
  ],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const pressingTrapSeed: TacticalConcept = {
  concept_id: 'pressing_trap',
  concept_name: 'Pressing Trap',
  category: TacticalCategory.PRESSING,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'An intentional out-of-possession structure where the pressing team leaves a specific opponent player or space seemingly open to invite a pass, only to close down the receiver simultaneously with multiple players as soon as the pass is played.',
  key_principles: [
    {
      title: 'Flank Funneling',
      description: 'Funneling opponent passes toward the touchlines, using the boundary lines as an extra defender to restrict escape routes.'
    },
    {
      title: 'Passive Baiting',
      description: 'Intentionally leaving a midfielder free, then closing them down from the blindside immediately upon receiving the ball.'
    },
    {
      title: 'Coordinated Closure',
      description: 'Synchronized closing of passing lanes by adjacent defenders, forcing the ball carrier to turn over possession.'
    }
  ],
  defensive_response: {
    response_id: 'third_man_escape',
    title: 'Third Man Combination Escape',
    description: 'Using quick, one-touch wall passes to find a third-man player who is positioned outside the pressing trap\'s density.',
    effectiveness_rating: 90,
    advantages: [
      'Bypasses the trap, catching pressing players out of position',
      'Opens wide spaces for counter-attacks once trap is broken'
    ],
    risks: [
      'Extremely technical and requires precise, mistake-free one-touch passing',
      'A single interception leads to immediate transition chances inside the box'
    ]
  },
  animation_module: {
    module_id: 'pressingTrap',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PRESSING_ZONES, RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'inter_barca_2010',
      title: 'Mourinho\'s Tactile Trap vs. Guardiola\'s Barca',
      competition: 'UEFA Champions League',
      season: '2009-10',
      teams: 'Inter Milan vs. Barcelona',
      tactical_context: 'Mourinho set up traps in the half-spaces, letting Barcelona circulate the ball wide and double-teaming Messi when he entered the channels.',
      summary: 'Inter allowed Xavi to pass to wide fullbacks, then closed them down with double-teams. Sneijder and Cambiasso intercepted central outlets to neutralize Messi\'s threat.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/inter-barca-2010-trap.mp4',
      event_timestamps: [
        { name: 'Cambiasso interception on half-space pass', timestamp: '24:50' }
      ]
    }
  ],
  related_concepts: ['high_press', 'compactness'],
  docling_chunks: [
    {
      chunk_id: 'doc_mourinho_tactics_04',
      source_document: 'Inter_Tactical_Periodization.pdf',
      relevance_score: 94
    }
  ],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const allSeeds: TacticalConcept[] = [false9Seed, highPressSeed, pressingTrapSeed];
