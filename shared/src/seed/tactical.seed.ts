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

export const midfieldOverloadSeed: TacticalConcept = {
  concept_id: 'midfield_overload',
  concept_name: 'Midfield Overload',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'Creating numerical superiority in the middle third by dropping forwards or pushing inverted fullbacks/center-backs into the midfield line, enabling progressive ball circulation and bypassing defensive pressure.',
  key_principles: [
    {
      title: 'Numerical Superiority',
      description: 'Creating passing angles (e.g., 4v3 diamond) in central zones to bypass opposing central midfielders.'
    },
    {
      title: 'Inverted Defender Entry',
      description: 'Full-backs stepping centrally during build-up to form a double pivot, releasing midfielders to push higher.'
    },
    {
      title: 'Zone 14 Overloading',
      description: 'Saturating the space between the opponent backline and midfield to force defenders out of their zonal slots.'
    }
  ],
  defensive_response: {
    response_id: 'man_oriented_jump',
    title: 'Man-Oriented Midfield Jumping',
    description: 'Midfielders jump aggressively to mark dropping players, while backlines step forward to squeeze vertical space.',
    effectiveness_rating: 75,
    advantages: [
      'Immediately challenges the target-man or dropping striker',
      'Restricts horizontal passing channels centrally'
    ],
    risks: [
      'Leaves massive space behind central defenders if they step too far',
      'Vulnerable to rapid diagonal third-man runs'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'mci_rma_2023',
      title: 'Guardiola\'s Box Midfield Overloads Real Madrid',
      competition: 'UEFA Champions League',
      season: '2022-23',
      teams: 'Manchester City vs. Real Madrid',
      tactical_context: 'John Stones pushed from center-back into a double pivot alongside Rodri, creating a 4v3 box midfield overload.',
      summary: 'City dominated possession centrally through the numerical advantage, forcing Modric and Kroos to slide constantly, leading to a 4-0 semi-final win.',
      relevance_score: 97,
      video_url: 'https://video.footballatlas.com/city-madrid-2023-overload.mp4',
      event_timestamps: [
        { name: 'Stones central entry & pivot', timestamp: '12:15' }
      ]
    }
  ],
  related_concepts: ['false_9', 'compactness'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const lowBlockSeed: TacticalConcept = {
  concept_id: 'low_block',
  concept_name: 'Low Block',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'A deep, compact defensive organization where the out-of-possession team drop all eleven players into their own third, minimizing vertical space behind the line to protect central channels and defend the penalty box.',
  key_principles: [
    {
      title: 'Central Corridor Protection',
      description: 'Squeezing the distance between central defenders and midfielders to deny passes into half-spaces or the box.'
    },
    {
      title: 'Touchline Funneling',
      description: 'Inviting passes to wide areas, then shifting aggressively to create sideline double-teams and block crosses.'
    },
    {
      title: 'Vertical Line Squeeze',
      description: 'Defensive and midfield lines staying within 10-15 meters vertically to prevent spaces from opening between the lines.'
    }
  ],
  defensive_response: {
    response_id: 'half_space_cross',
    title: 'Half-Space Diagonal Crosses',
    description: 'Bypassing the block using early, diagonal cross deliveries from half-spaces to isolate attackers at the far post.',
    effectiveness_rating: 80,
    advantages: [
      'Avoids crossing from deep, predictable touchline channels',
      'Forces defenders to run backward toward their own goal'
    ],
    risks: [
      'Gives up central numbers if headers are lost',
      'Leaves team open to immediate counter-attacks on turnover'
    ]
  },
  animation_module: {
    module_id: 'lowBlock',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'che_bar_2012',
      title: 'Di Matteo\'s Deep Defiance at the Camp Nou',
      competition: 'UEFA Champions League',
      season: '2011-12',
      teams: 'Barcelona vs. Chelsea',
      tactical_context: 'Chelsea played with 10 men inside their own box, defending deep and waiting for transition triggers.',
      summary: 'Chelsea packed the box in a 4-5-0 shape, denying Messi central avenues. Barcelona had over 75% possession but couldn\'t break the lines, leading to Torres\' counter-attack goal.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/chelsea-barca-2012-block.mp4',
      event_timestamps: [
        { name: 'Drogba sliding block & Torres break', timestamp: '91:02' }
      ]
    }
  ],
  related_concepts: ['compactness', 'counter_attack_trigger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const invertedWingerSeed: TacticalConcept = {
  concept_id: 'inverted_winger',
  concept_name: 'Inverted Winger',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'A winger deployed on the flank opposite to their dominant shooting foot, designed to cut inside into central half-spaces to shoot or pass, opening wide channels for overlapping full-backs.',
  key_principles: [
    {
      title: 'Half-Space Penetration',
      description: 'Dribbling diagonally into the spaces between the opponent fullbacks and center-backs, breaking lines from wide areas.'
    },
    {
      title: 'Overlapping Lane Creation',
      description: 'Drawing fullbacks inside to open wide passing channels along the touchline for overlapping wingbacks.'
    },
    {
      title: 'Central Shooting Angles',
      description: 'Opening body posture during diagonal cuts to shoot towards the far post or make diagonal through-balls.'
    }
  ],
  defensive_response: {
    response_id: 'show_outside_block',
    title: 'Show Outside Defensive Funneling',
    description: 'Full-backs position their bodies to block inside cutting angles, forcing the winger to go down the touchline on their weaker foot.',
    effectiveness_rating: 80,
    advantages: [
      'Blocks immediate shooting avenues on their dominant foot',
      'Funnels wingers toward the sideline helper'
    ],
    risks: [
      'Vulnerable to sudden cutbacks or underlapping midfielders',
      'Requires agile full-backs'
    ]
  },
  animation_module: {
    module_id: 'invertedWinger',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.PASSING_LANES]
  },
  historical_examples: [
    {
      match_id: 'bay_doc_2013',
      title: 'Robben\'s Inside Cut Decides the UCL Final',
      competition: 'UEFA Champions League',
      season: '2012-13',
      teams: 'Bayern Munich vs. Borussia Dortmund',
      tactical_context: 'Robben operated on the right flank, cutting inside onto his left foot to link up centrally with Müller.',
      summary: 'Robben repeatedly cut inside, creating overloads. In the 89th minute, he made an inside run, bypassed Subotic, and slid in the winning goal.',
      relevance_score: 94,
      video_url: 'https://video.footballatlas.com/robben-cl-2013.mp4',
      event_timestamps: [
        { name: 'Inside cut & link-up play', timestamp: '88:45' }
      ]
    }
  ],
  related_concepts: ['false_9', 'third_man_run'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const thirdManRunSeed: TacticalConcept = {
  concept_id: 'third_man_run',
  concept_name: 'Third Man Run',
  category: TacticalCategory.TRANSITION,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A tactical passing combination where Player A passes to Player B to attract opponent defensive cover, while Player C makes a vertical run into space. Player B plays a one-touch pass into Player C, who receives facing forward.',
  key_principles: [
    {
      title: 'Attract-and-Release Pass',
      description: 'Player A playing a slower, inviting pass to Player B to draw defenders out of their zonal slots.'
    },
    {
      title: 'Blindside Run timing',
      description: 'Player C timing their run to bypass the defender\'s cover shadow exactly as Player B receives the ball.'
    },
    {
      title: 'One-Touch Lay-off',
      description: 'Player B immediately redirecting the ball with a single touch, catching defenders mid-shift.'
    }
  ],
  defensive_response: {
    response_id: 'track_depth_run',
    title: 'Blindside Depth Run Tracking',
    description: 'Defensive midfielders or center-backs pass wide markers and drop early to track third-man runs before the lay-off is played.',
    effectiveness_rating: 85,
    advantages: [
      'Intercepts the critical final release pass',
      'Keeps running midfielders in front of the line'
    ],
    risks: [
      'Gives Player B space to turn and carry if lay-off is aborted',
      'Requires elite communication between backline layers'
    ]
  },
  animation_module: {
    module_id: 'third_man_run',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'bar_mun_2015',
      title: 'Tiki-Taka Third Man Combination against Bayern',
      competition: 'UEFA Champions League',
      season: '2014-15',
      teams: 'Barcelona vs. Bayern Munich',
      tactical_context: 'Xavi, Iniesta, and Messi used third-man combinations to break Guardiola\'s high-press setup.',
      summary: 'Messi played Iniesta centrally, attracting Boateng. Iniesta layed the ball off with one touch to Neymar running in behind, scoring a transition goal.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/barca-bayern-2015-thirdman.mp4',
      event_timestamps: [
        { name: 'Messi pass & Neymar diagonal run', timestamp: '76:44' }
      ]
    }
  ],
  related_concepts: ['false_9', 'inverted_winger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const compactnessSeed: TacticalConcept = {
  concept_id: 'compactness',
  concept_name: 'Compactness',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'Minimizing the vertical and horizontal distance between defending players to restrict internal passing lanes and force opponents to play around the shape.',
  key_principles: [
    {
      title: 'Vertical Distance control',
      description: 'Restricting the distance between the striker and center-backs to under 30 meters when out of possession.'
    },
    {
      title: 'Horizontal Block Shifting',
      description: 'The entire block shifting synchronously towards the ball side to crowd half-spaces and prevent turns.'
    },
    {
      title: 'Cover Shadow Discipline',
      description: 'Defenders positioning themselves in the path of progressive targets to block vertical paths passive-aggressively.'
    }
  ],
  defensive_response: {
    response_id: 'switch_play_overload',
    title: 'Rapid Switch of Play Overload',
    description: 'Attracting the compact block to one side, then quickly switching play using diagonal long balls to an isolated wide winger.',
    effectiveness_rating: 80,
    advantages: [
      'Catches the compact block mid-slide, creating temporary wide channels',
      'Exposes full-backs in 1v1 situations without support'
    ],
    risks: [
      'Gives up possession if diagonal passes lack accuracy',
      'Requires wingers with high-level 1v1 skills'
    ]
  },
  animation_module: {
    module_id: 'compactness',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'atm_rma_2014',
      title: 'Simeone\'s Compact Block Squeezes Real Madrid',
      competition: 'La Liga',
      season: '2013-14',
      teams: 'Atletico Madrid vs. Real Madrid',
      tactical_context: 'Atletico defended in an extremely compact 4-4-2 block, denying Modric and Ronaldo space in half-spaces.',
      summary: 'Gabi and Tiago sat right in front of the center-backs, keeping lines under 20m. Ronaldo had to settle for speculative shots, giving Atletico a 1-0 derby win.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/atletico-madrid-compact.mp4',
      event_timestamps: [
        { name: 'Tiago interception & block shifting', timestamp: '54:12' }
      ]
    }
  ],
  related_concepts: ['low_block', 'high_press'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const defensiveBlockSeed: TacticalConcept = {
  concept_id: 'defensive_block',
  concept_name: 'Defensive Block',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A collective defensive setup where a team forms a compact, disciplined shape (often a 4-4-2) to protect central space, closing the central corridor and half spaces, forcing the opposition to attack down the wings.',
  key_principles: [
    {
      title: 'Compactness Preservation',
      description: 'Keeping horizontal and vertical distances between lines extremely tight (under 10 meters) to deny space.'
    },
    {
      title: 'Central Corridor Denial',
      description: 'Positioning players in central corridors and half spaces to protect the high-value areas of the pitch.'
    },
    {
      title: 'Forcing Wide Play',
      description: 'Steering the opponent\'s progression outwards toward the touchlines where the threat is minimized.'
    }
  ],
  defensive_response: {
    response_id: 'wing_overlap_cross',
    title: 'Overlapping Fullback Crosses',
    description: 'Bypassing the compact block by executing overlaps and double-width winger runs to cross from the touchline.',
    effectiveness_rating: 75,
    advantages: [
      'Stretches the horizontal width of the defensive block',
      'Allows delivery into the box from advanced positions'
    ],
    risks: [
      'Exposes the attacking team to rapid counter-attacks if possession is lost wide'
    ]
  },
  animation_module: {
    module_id: 'defensiveBlock',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'atm_rma_2014_db',
      title: 'Atletico\'s Compact 4-4-2 Defensive Block',
      competition: 'La Liga',
      season: '2013-14',
      teams: 'Atletico Madrid vs. Real Madrid',
      tactical_context: 'Atletico defended in an extremely compact 4-4-2 block, denying Modric and Ronaldo space in central corridors.',
      summary: 'Gabi and Tiago sat right in front of the center-backs, keeping lines under 20m. Ronaldo had to settle for speculative shots, giving Atletico a 1-0 derby win.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/atletico-madrid-compact.mp4',
      event_timestamps: [
        { name: 'Tiago interception & block shifting', timestamp: '54:12' }
      ]
    }
  ],
  related_concepts: ['compactness', 'low_block', 'high_press', 'pressing_trap', 'transition_defending'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const counterAttackTriggerSeed: TacticalConcept = {
  concept_id: 'counter_attack_trigger',
  concept_name: 'Counter-Attack Trigger',
  category: TacticalCategory.TRANSITION,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A transition tactic focused on the immediate moments after winning possession, exploiting the opponent\'s structural disorganization and advanced players before they can recover their defensive shape.',
  key_principles: [
    {
      title: 'Transition Space Exploitation',
      description: 'Attacking the spaces vacated by opponent full-backs and midfielders who pushed high during their attacking phase.'
    },
    {
      title: 'Immediate Vertical Outlet',
      description: 'Playing a rapid release pass to forward outlets to launch the transition, rather than safe possession recycling.'
    },
    {
      title: 'Decisive Numerical Run',
      description: 'Coordinated forward sprints creating a numerical advantage in the final third against a recovering defense.'
    }
  ],
  defensive_response: {
    response_id: 'counter_pressing_stall',
    title: 'Aggressive Counter-Pressing Stall',
    description: 'Immediate ball-oriented pressure by closest attackers to delay the outlet pass and allow the backline to drop and organize.',
    effectiveness_rating: 80,
    advantages: [
      'Stops the direct vertical trigger at its source',
      'Provides crucial seconds for full-backs to sprint back'
    ],
    risks: [
      'Exposes central areas if the initial press is bypassed',
      'Requires high physical energy and coordination'
    ]
  },
  animation_module: {
    module_id: 'counter_attack_trigger',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.PASSING_LANES]
  },
  historical_examples: [
    {
      match_id: 'rma_bay_2014',
      title: 'Real Madrid\'s Lethal Counter-Attack vs. Bayern',
      competition: 'UEFA Champions League',
      season: '2013-14',
      teams: 'Bayern Munich vs. Real Madrid',
      tactical_context: 'Real Madrid defended in a deep compact block, baiting Bayern\'s high possession before triggering transitions.',
      summary: 'Di Maria won the ball and immediately triggered Benzema, who released Ronaldo and Bale in a 3v2 sprint, executing a perfect counter-attacking goal.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/realmadrid-bayern-counter.mp4',
      event_timestamps: [
        { name: 'Di Maria turnover & outlet pass', timestamp: '18:14' }
      ]
    }
  ],
  related_concepts: ['high_press', 'pressing_trap', 'third_man_run', 'inverted_winger', 'transition_defending'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const backThreeWingBackSeed: TacticalConcept = {
  concept_id: 'back_three_wing_back',
  concept_name: 'Back 3 / Wing-Back System',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A tactical system utilizing three central defenders and two wing-backs. The shape transitions dynamically depending on possession, dropping into a compact 5-back defensive structure or expanding into a 3-2-5 attacking shape to dominate the five vertical lanes.',
  key_principles: [
    {
      title: 'Wide Center-back Support',
      description: 'Side center-backs step wide to offer passing lanes, progress the ball, and cover the channels vacated by advanced wing-backs.'
    },
    {
      title: 'Dynamic Wing-back Width',
      description: 'Wing-backs advance aggressively to stretch the opponent horizontally, maintaining numerical balance and creating wide threats.'
    },
    {
      title: 'Continuous Shape Transformation',
      description: 'The structure continuously morphs between a compact defensive block and an expansive five-lane attacking line.'
    }
  ],
  defensive_response: {
    response_id: 'wingback_press_funnel',
    title: 'Touchline Press Funnel',
    description: 'Pressing the wing-backs aggressively against the touchline to isolate them from central midfielders, forcing passing errors.',
    effectiveness_rating: 78,
    advantages: [
      'Forces turnovers far from the central defensive block',
      'Restricts horizontal switches to the opposite side'
    ],
    risks: [
      'Leaves massive diagonal channels open if the first line of press is bypassed',
      'Requires rapid horizontal shifting'
    ]
  },
  animation_module: {
    module_id: 'back_three_wing_back',
    version: '1.0.0',
    required_overlays: [
      RequiredOverlay.DEFENSIVE_LINES,
      RequiredOverlay.SPACE_CONTROL,
      RequiredOverlay.MOVEMENT_ARROWS,
      RequiredOverlay.PASSING_LANES
    ]
  },
  historical_examples: [
    {
      match_id: 'che_eve_2016_back3',
      title: 'Conte\'s 3-4-3 Masterclass vs Everton',
      competition: 'Premier League',
      season: '2016-17',
      teams: 'Chelsea vs. Everton',
      tactical_context: 'Chelsea deployed a dynamic 3-4-3 shape with wing-backs Alonso and Moses pushing aggressively forward.',
      summary: 'Chelsea transitioned seamlessly into a 3-2-5 in possession, stretching Everton horizontally and overloading their backline to secure a 5-0 win.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/conte-chelsea-343.mp4',
      event_timestamps: [
        { name: 'Wing-back advanced positioning', timestamp: '14:20' }
      ]
    }
  ],
  related_concepts: ['inverted_winger', 'midfield_overload', 'compactness', 'high_press', 'positional_play'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-03T00:00:00Z',
  updated_at: '2026-06-03T00:00:00Z'
};

export const allSeeds: TacticalConcept[] = [
  false9Seed, 
  highPressSeed, 
  defensiveBlockSeed,
  pressingTrapSeed,
  midfieldOverloadSeed,
  lowBlockSeed,
  invertedWingerSeed,
  thirdManRunSeed,
  compactnessSeed,
  counterAttackTriggerSeed,
  backThreeWingBackSeed
];

