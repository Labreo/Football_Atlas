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
  related_concepts: ['pressing_trap', 'compactness_pressing_lines'],
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
  related_concepts: ['high_press', 'compactness_pressing_lines'],
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
  related_concepts: ['false_9', 'compactness_pressing_lines'],
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
  related_concepts: ['compactness_pressing_lines', 'counter_attack_trigger'],
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
  related_concepts: ['compactness_pressing_lines', 'low_block', 'high_press', 'pressing_trap', 'transition_defending'],
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
  related_concepts: ['inverted_winger', 'midfield_overload', 'compactness_pressing_lines', 'high_press', 'positional_play'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-03T00:00:00Z',
  updated_at: '2026-06-03T00:00:00Z'
};

export const compactnessPressingLinesSeed: TacticalConcept = {
  concept_id: 'compactness_pressing_lines',
  concept_name: 'Compactness & Pressing Lines',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A collective defensive strategy focused on maintaining short horizontal and vertical distances between lines and players to restrict space, closing passing channels and enabling coordinated pressing.',
  key_principles: [
    {
      title: 'Horizontal Compactness',
      description: 'Defensive blocks shifting horizontally as a single unit to compress space near the ball, forcing play to wide, low-risk areas.'
    },
    {
      title: 'Vertical Compactness',
      description: 'Minimizing the vertical space between the defensive, midfield, and forward lines to prevent opponents from receiving between the lines.'
    },
    {
      title: 'Pressing Line Coordination',
      description: 'Synchronized forward pressure where the first line presses while supporting lines step higher to close spaces and cover passing options.'
    }
  ],
  defensive_response: {
    response_id: 'break_compactness_switch',
    title: 'Rapid Horizontal Switches',
    description: 'Using quick, long diagonal passes to switch the attack to the underloaded flank, forcing the compact block to shift across a wide distance.',
    effectiveness_rating: 82,
    advantages: [
      'Forces block to sprint and adjust over long distances',
      'Opens temporary channels if players shift at different speeds'
    ],
    risks: [
      'Allows interception if pass is slow or inaccurate',
      'Requires excellent long-range passing quality'
    ]
  },
  animation_module: {
    module_id: 'compactness_pressing_lines',
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
      match_id: 'argentina_france_22',
      title: 'Mbappé Equaliser Sequence (Argentina vs France)',
      competition: 'FIFA World Cup',
      season: '2022',
      teams: 'Argentina vs. France',
      tactical_context: 'France wins the ball three passes before the goal, exploiting Argentina\'s fatigue-induced vertical line disconnection.',
      summary: 'Argentina\'s midfield line became disconnected from their defensive line, leaving central space. Rabiot passed wide to Mbappé, who played inside to Thuram. Thuram\'s wall-pass layout set up Mbappé\'s volley.',
      relevance_score: 98,
      event_timestamps: [
        { name: 'France possession recovery', timestamp: '80:30' },
        { name: 'Mbappé equaliser volley', timestamp: '81:15' }
      ]
    }
  ],
  related_concepts: ['high_press', 'defensive_block', 'pressing_trap', 'counter_attack_trigger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-04T00:00:00Z',
  updated_at: '2026-06-04T00:00:00Z'
};

export const gegenpressingSeed: TacticalConcept = {
  concept_id: 'gegenpressing',
  concept_name: 'Gegenpressing',
  category: TacticalCategory.PRESSING,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A counter-pressing tactic where a team immediately attempts to win back possession of the ball within seconds of losing it, exploiting the opponent\'s temporary transition instability before they can form a clean buildup shape.',
  key_principles: [
    {
      title: 'Five-Second Rule',
      description: 'Applying maximum intensity pressure on the ball carrier within five seconds of losing possession.'
    },
    {
      title: 'Zonal Suffocation',
      description: 'Surrounding the immediate area around the lost ball to shut down short and intermediate passing outlets.'
    },
    {
      title: 'Anticipatory Shifting',
      description: 'Behind the press, the rest of the defensive line shifts forward to keep vertical space compressed.'
    }
  ],
  defensive_response: {
    response_id: 'first_touch_release',
    title: 'First-Touch Release Switch',
    description: 'Playing a rapid, pre-planned diagonal first-touch pass out of the high-pressure zone to the weak-side fullback.',
    effectiveness_rating: 80,
    advantages: [
      'Bypasses the counter-pressing swarm completely',
      'Exposes massive space on the underloaded flank'
    ],
    risks: [
      'Extremely high turnover danger in the defensive third if the pass is slightly off'
    ]
  },
  animation_module: {
    module_id: 'highPress',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PRESSING_ZONES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'rma_barca_2011',
      title: 'Guardiola\'s Barca Counter-Pressing Dominance',
      competition: 'La Liga',
      season: '2011-12',
      teams: 'Real Madrid vs. Barcelona',
      tactical_context: 'Barcelona used Gegenpressing to neutralize Real Madrid\'s rapid transition threats at the Bernabéu.',
      summary: 'Messi and Busquets pressed Alonso immediately after turnovers, preventing Madrid from releasing Ronaldo, leading to a 3-1 Barcelona victory.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/barca-counter-press-2011.mp4',
      event_timestamps: [
        { name: 'Busquets recovery & assist', timestamp: '53:10' }
      ]
    }
  ],
  related_concepts: ['high_press', 'pressing_trap'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const restDefenseSeed: TacticalConcept = {
  concept_id: 'rest_defense',
  concept_name: 'Rest Defense',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'The structure and positioning of a team\'s defensive players while they are still in possession of the ball, preparing them to block counter-attacks and secure defensive compactness the moment the ball is turned over.',
  key_principles: [
    {
      title: 'Counter-Attack Prevention',
      description: 'Defenders keeping a strict distance to the opponent\'s forwards, preparing to jump or drop on turnovers.'
    },
    {
      title: 'Rest Structure Formations',
      description: 'Forming horizontal lines in front of the center-backs to cover half-spaces and lock down central avenues.'
    },
    {
      title: 'Zonal Screening Support',
      description: 'Rest defense midfielders screening passes to dropping strikers, cutting the supply line early.'
    }
  ],
  defensive_response: {
    response_id: 'wide_winger_isolation',
    title: 'Wide Winger Isolation Release',
    description: 'Bypassing the rest defense screen by playing immediate diagonal high passes to isolated wide wingers on the touchline.',
    effectiveness_rating: 75,
    advantages: [
      'Exploits the narrow structure of the rest defense pivot',
      'Forces center-backs into 1v1 wide duels'
    ],
    risks: [
      'Wingers can get doubled up quickly if the wingback recovers'
    ]
  },
  animation_module: {
    module_id: 'defensiveBlock',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'mci_ars_2024',
      title: 'Arteta\'s Rest-Defense Wall at the Etihad',
      competition: 'Premier League',
      season: '2023-24',
      teams: 'Manchester City vs. Arsenal',
      tactical_context: 'Arsenal deployed a strict rest defense layout to shut down City\'s counter-attacking speed.',
      summary: 'Gabriel and Saliba remained deep, supported by Rice, completely neutralizing Haaland and De Bruyne in transition, securing a 0-0 draw.',
      relevance_score: 93,
      video_url: 'https://video.footballatlas.com/arsenal-rest-defense-2024.mp4',
      event_timestamps: [
        { name: 'Saliba transition intercept', timestamp: '34:15' }
      ]
    }
  ],
  related_concepts: ['defensive_block', 'compactness_pressing_lines'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const positionalPlaySeed: TacticalConcept = {
  concept_id: 'positional_play',
  concept_name: 'Positional Play',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A tactical framework (Juego de Posición) where the pitch is divided into zones, and players occupy specific spaces to create passing lanes, maintain positional superiority, and dynamically adjust to team movements.',
  key_principles: [
    {
      title: 'Positional Superiority Shape',
      description: 'Players occupying different vertical and horizontal lines to always offer passing options and triangles.'
    },
    {
      title: 'Free Man Creation',
      description: 'Circulating the ball side-to-side to draw opponents out, finding a free teammate between the lines.'
    },
    {
      title: 'Dynamic Zone Occupation',
      description: 'No more than three players occupying the same horizontal line, and no more than two in the same vertical channel.'
    }
  ],
  defensive_response: {
    response_id: 'zonal_shifting_block',
    title: 'Ultra-Compact Zonal Shifting',
    description: 'Defending in a narrow, horizontal block that slides in unison to deny spaces between lines, ignoring the far-side outlets.',
    effectiveness_rating: 80,
    advantages: [
      'Closes down all high-value spaces in the central channels',
      'Minimizes the danger of penetrative passes'
    ],
    risks: [
      'Leaves the opposite flank completely open to quick diagonal switch balls'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'bar_bay_2009',
      title: 'Guardiola\'s Positional Play Masterclass',
      competition: 'UEFA Champions League',
      season: '2008-09',
      teams: 'Barcelona vs. Bayern Munich',
      tactical_context: 'Barcelona deployed strict positional play guidelines to pull Bayern\'s defense out of shape.',
      summary: 'Henry and Eto\'o held maximum width, opening up passing channels for Messi and Iniesta to exploit the central spaces, resulting in a 4-0 first-half lead.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/barcelona-bayern-2009.mp4',
      event_timestamps: [
        { name: 'Messi central overload goal', timestamp: '08:42' }
      ]
    }
  ],
  related_concepts: ['midfield_overload', 'false_9'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const boxMidfieldSeed: TacticalConcept = {
  concept_id: 'box_midfield',
  concept_name: 'Box Midfield',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'An attacking shape where four midfielders form a square or rectangular box (e.g. 3-2-2-3 WM formation), creating numerical advantages, progressive pass options, and counter-pressing structural security.',
  key_principles: [
    {
      title: 'Four-Midfielder Box Structure',
      description: 'Using two deep pivots and two attacking midfielders to form a box, overloading opposing midfield blocks.'
    },
    {
      title: 'Vertical Passing Diamonds',
      description: 'Creating passing combinations and triangles that bypass opposing midfielders and access half-spaces.'
    },
    {
      title: 'Inverted Fullback Centralization',
      description: 'Utilizing fullbacks stepping inside to construct the base of the box, freeing attacking midfielders to play higher.'
    }
  ],
  defensive_response: {
    response_id: 'box_mirroring_def',
    title: 'Box Mirroring Central Press',
    description: 'Mirroring the opponent\'s structure by deploying two defensive midfielders and two advanced screeners to lock down the box.',
    effectiveness_rating: 85,
    advantages: [
      'Ensures direct 1v1 defensive assignments centrally',
      'Prevents the free man from turning in Zone 14'
    ],
    risks: [
      'Leaves defensive wings completely exposed to overlapping fullbacks'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'mci_rma_2023_box',
      title: 'Stones Box Midfield Supremacy vs. Real Madrid',
      competition: 'UEFA Champions League',
      season: '2022-23',
      teams: 'Manchester City vs. Real Madrid',
      tactical_context: 'John Stones pushed forward to form a central box with Rodri, Gundogan, and De Bruyne.',
      summary: 'The box midfield created a 4v3 overload against Madrid\'s trio of Kroos, Modric, and Valverde, allowing City to dominate possession and win 4-0.',
      relevance_score: 97,
      video_url: 'https://video.footballatlas.com/city-madrid-box-2023.mp4',
      event_timestamps: [
        { name: 'Stones central transition pivot', timestamp: '14:35' }
      ]
    }
  ],
  related_concepts: ['midfield_overload', 'inverted_fullbacks'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const overlappingRunsSeed: TacticalConcept = {
  concept_id: 'overlapping_runs',
  concept_name: 'Overlapping Runs',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'An attacking combination where an off-the-ball player (typically a fullback) sprints around the outside of a teammate with the ball (typically a winger), stretching the defense wide and creating crossing opportunities.',
  key_principles: [
    {
      title: 'Outside Flank Expansion',
      description: 'Sprinting outside the ball carrier to offer wide crossing avenues and create 2v1 overloads against fullbacks.'
    },
    {
      title: 'Decoy Running Timing',
      description: 'Using the outside sprint to draw defensive cover, allowing the winger to cut inside and shoot.'
    },
    {
      title: 'Overlap Release Delivery',
      description: 'Precisely timed pass into the running path of the overlapping player to cross from the touchline.'
    }
  ],
  defensive_response: {
    response_id: 'winger_tracking_run',
    title: 'Winger Track-Back Double-Up',
    description: 'The defending team\'s winger sprints back to track the overlapping run, maintaining numerical parity.',
    effectiveness_rating: 85,
    advantages: [
      'Neutralizes the 2v1 overlap attempt before the cross',
      'Keeps defenders inside their standard zonal slots'
    ],
    risks: [
      'Exposes spaces in midfield if midfielders fail to shift across'
    ]
  },
  animation_module: {
    module_id: 'third_man_run',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.PASSING_LANES]
  },
  historical_examples: [
    {
      match_id: 'bra_ita_1970',
      title: 'Carlos Alberto\'s Legendary World Cup Overlap',
      competition: 'FIFA World Cup',
      season: '1970',
      teams: 'Brazil vs. Italy',
      tactical_context: 'Pele held the ball centrally, drawing the Italian defense, waiting for the fullback overlap.',
      summary: 'Carlos Alberto sprinted down the right flank completely unmarked. Pele played a blindside pass into his path, leading to the legendary fourth goal.',
      relevance_score: 98,
      video_url: 'https://video.footballatlas.com/brazil-italy-1970.mp4',
      event_timestamps: [
        { name: 'Pele blind pass & Alberto finish', timestamp: '86:12' }
      ]
    }
  ],
  related_concepts: ['third_man_run', 'inverted_winger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const overloadingToIsolateSeed: TacticalConcept = {
  concept_id: 'overloading_to_isolate',
  concept_name: 'Overload to Isolate',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'An attacking strategy where a team clusters multiple players on one side of the pitch to draw the opponent\'s defensive structure, then rapidly switches play to an isolated, high-quality winger on the opposite flank in a 1v1 scenario.',
  key_principles: [
    {
      title: 'Asymmetric Clustered Build-up',
      description: 'Positioning 4-5 players close together on one flank to invite defensive pressure and compacting.'
    },
    {
      title: 'Rapid Weak-side Switch',
      description: 'Using long diagonal switch passes to quickly bypass the congested side and find the isolated player.'
    },
    {
      title: 'Direct 1v1 Winger Exploitation',
      description: 'Giving the isolated winger immediate license to drive at the fullback before defensive support shifts over.'
    }
  ],
  defensive_response: {
    response_id: 'prevent_diagonal_switch',
    title: 'Diagonal Switch Interception Line',
    description: 'Defensive midfielders position themselves higher up the pitch to block passing lanes for diagonal switches.',
    effectiveness_rating: 80,
    advantages: [
      'Intercepts the release pass before it can travel to the weak side',
      'Locks the attacking team in the congested flank'
    ],
    risks: [
      'Opens central spaces if midfielders step too far forward'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'rma_bay_2014_isolate',
      title: 'Ancelotti\'s Overload to Isolate Ronaldo',
      competition: 'UEFA Champions League',
      season: '2013-14',
      teams: 'Real Madrid vs. Bayern Munich',
      tactical_context: 'Real Madrid overloaded the right flank with Modric and Carvajal, isolating Cristiano Ronaldo on the left.',
      summary: 'Madrid drew Bayern\'s block completely to the right, then Alonso executed a diagonal switch to Ronaldo, who drove past Lahm to score.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/realmadrid-bayern-isolate.mp4',
      event_timestamps: [
        { name: 'Alonso diagonal switch to Ronaldo', timestamp: '19:15' }
      ]
    }
  ],
  related_concepts: ['midfield_overload', 'inverted_winger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const halfSpaceExploitationSeed: TacticalConcept = {
  concept_id: 'half_space_exploitation',
  concept_name: 'Half-Space Exploitation',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'Attacking the spaces on the pitch located between the central corridor and the wide flanks. These corridors offer optimal angles for passing, shooting, and cutting inside to bypass defensive lines.',
  key_principles: [
    {
      title: 'Diagonal Half-space Channeling',
      description: 'Receiving the ball in the half-space facing forward, opening up diagonal passes to both wide and central options.'
    },
    {
      title: 'Defensive Line Distortions',
      description: 'Positioning midfielders in half-spaces to draw fullbacks inside, creating space for wide wingers.'
    },
    {
      title: 'Early Cross Delivery Angles',
      description: 'Delivering diagonal early crosses behind the defensive line from deep half-space zones.'
    }
  ],
  defensive_response: {
    response_id: 'half_space_squeezing',
    title: 'Half-Space Squeezing Cover',
    description: 'Central defenders and fullbacks narrow their distance to close the half-spaces, with midfielders dropping to screen.',
    effectiveness_rating: 82,
    advantages: [
      'Closes the critical channel to prevent simple vertical entries',
      'Maintains double coverage on inside forwards'
    ],
    risks: [
      'Surrenders wide crossing channels to overlapping fullbacks'
    ]
  },
  animation_module: {
    module_id: 'invertedWinger',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.PASSING_LANES]
  },
  historical_examples: [
    {
      match_id: 'mci_tot_2019',
      title: 'De Bruyne\'s Masterclass from the Right Half-Space',
      competition: 'Premier League',
      season: '2019-20',
      teams: 'Manchester City vs. Tottenham',
      tactical_context: 'Kevin De Bruyne repeatedly occupied the right half-space to pick out diagonal crosses.',
      summary: 'De Bruyne received in the half-space and delivered early diagonal crosses behind Tottenham\'s backline, assisting Sterling and Aguero.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/debruyne-halfspace-2019.mp4',
      event_timestamps: [
        { name: 'De Bruyne diagonal cross assist', timestamp: '20:10' }
      ]
    }
  ],
  related_concepts: ['inverted_winger', 'midfield_overload'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const verticalTikiTakaSeed: TacticalConcept = {
  concept_id: 'vertical_tiki_taka',
  concept_name: 'Vertical Tiki-Taka',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A direct possession style that combines short passing triangles with rapid vertical breakthroughs, moving the ball quickly through lines to exploit structural disorganization.',
  key_principles: [
    {
      title: 'Vertical Passing Outlets',
      description: 'Using rapid, forward passes to break lines, rather than side-to-side lateral possession recycling.'
    },
    {
      title: 'Dynamic Shifting Triangles',
      description: 'Midfielders constantly shifting to form passing options around the ball carrier to support vertical options.'
    },
    {
      title: 'First-touch Vertical Release',
      description: 'One-touch forward lay-offs to players running from deep, catching defensive blocks mid-shift.'
    }
  ],
  defensive_response: {
    response_id: 'vertical_denial_mid',
    title: 'Midfield Passing Lane Denial',
    description: 'Midfielders defend in a compact screen, stepping into vertical channels to intercept forward balls.',
    effectiveness_rating: 80,
    advantages: [
      'Intercepts the critical penetrative pass before the final third',
      'Triggers immediate transitions through interceptions'
    ],
    risks: [
      'Exposes space behind the midfield line if screen is bypassed'
    ]
  },
  animation_module: {
    module_id: 'third_man_run',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'ita_esp_2021',
      title: 'Mancini\'s Vertical Tiki-Taka vs. Spain',
      competition: 'UEFA Euro',
      season: '2020',
      teams: 'Italy vs. Spain',
      tactical_context: 'Italy combined possession patterns with quick forward switches to break Spain\'s high counterpress.',
      summary: 'Jorginho and Verratti drew Spanish midfielders close, then played vertical line-breaking passes to Insigne and Chiesa to create goals.',
      relevance_score: 94,
      video_url: 'https://video.footballatlas.com/italy-euro-2021.mp4',
      event_timestamps: [
        { name: 'Jorginho vertical build-up play', timestamp: '59:45' }
      ]
    }
  ],
  related_concepts: ['third_man_run', 'midfield_overload'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const shadowStrikerSeed: TacticalConcept = {
  concept_id: 'shadow_striker',
  concept_name: 'Shadow Striker',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'An attacking role (like Thomas Müller\'s Raumdeuter) where a player starts in a deeper or wide position but makes late, vertical runs into the box behind a focal center-forward to score.',
  key_principles: [
    {
      title: 'Late Runs into the Box',
      description: 'Timing forward sprints to enter the box exactly as a teammate crosses, bypassing static markers.'
    },
    {
      title: 'Target Man Screen Decoy',
      description: 'Using the center-forward to occupy center-backs, opening space behind them for the shadow striker.'
    },
    {
      title: 'Space Interpretation',
      description: 'Constantly scanning for gaps left between defensive lines and shifting horizontally into open zones.'
    }
  ],
  defensive_response: {
    response_id: 'zonal_handover_def',
    title: 'Midfielder Zonal Tracking Handover',
    description: 'Midfielders track the shadow striker\'s runs deep into the defensive line, handing them over to defenders.',
    effectiveness_rating: 84,
    advantages: [
      'Ensures the shadow striker is never left unmarked in the box',
      'Keeps central defenders focused on the target forward'
    ],
    risks: [
      'Midfielders can drop too deep, leaving spaces at the edge of the box'
    ]
  },
  animation_module: {
    module_id: 'false9',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'bay_barca_2013',
      title: 'Thomas Müller\'s Space Interpretation Masterclass',
      competition: 'UEFA Champions League',
      season: '2012-13',
      teams: 'Bayern Munich vs. Barcelona',
      tactical_context: 'Müller played behind Gomez, scanning and exploiting space in Barcelona\'s backline.',
      summary: 'Müller made late runs into the box, using Gomez\'s physical presence to escape Pique, scoring twice to secure a historic 4-0 win.',
      relevance_score: 96,
      video_url: 'https://video.footballatlas.com/muller-raumdeuter-2013.mp4',
      event_timestamps: [
        { name: 'Müller diagonal sprint goal', timestamp: '48:30' }
      ]
    }
  ],
  related_concepts: ['false_9', 'third_man_run'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const pressingTriggersSeed: TacticalConcept = {
  concept_id: 'pressing_triggers',
  concept_name: 'Pressing Triggers',
  category: TacticalCategory.PRESSING,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'Specific contextual cues (such as a slow pass, a player receiving with their back to goal, or control on a weak foot) that signal a team to immediately transition from zonal containment to high-intensity pressing.',
  key_principles: [
    {
      title: 'Contextual Cue Scanning',
      description: 'Players scanning opponent body language and pass quality to identify moments of vulnerability.'
    },
    {
      title: 'Immediate Pressing Acceleration',
      description: 'Sprinting aggressively to close down the ball carrier the moment a trigger event occurs.'
    },
    {
      title: 'Cover Shadow Squeezing',
      description: 'Supporting players stepping up behind the presser to close simple passing options.'
    }
  ],
  defensive_response: {
    response_id: 'first_touch_layoff',
    title: 'First-Touch Lay-off Escape',
    description: 'Using precise, first-touch backpasses or lay-offs to escape the press before the opponent can close down.',
    effectiveness_rating: 85,
    advantages: [
      'Bypasses the high-intensity presser at the moment of entry',
      'Leaves the presser out of position, exposing space behind'
    ],
    risks: [
      'A minor touch error leads to an immediate high-turnover shot'
    ]
  },
  animation_module: {
    module_id: 'highPress',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PRESSING_ZONES, RequiredOverlay.DEFENSIVE_LINES]
  },
  historical_examples: [
    {
      match_id: 'liv_barca_2019',
      title: 'Liverpool\'s Pressing Triggers Shock Barcelona',
      competition: 'UEFA Champions League',
      season: '2018-19',
      teams: 'Liverpool vs. Barcelona',
      tactical_context: 'Liverpool pressed Barcelona at Anfield, reacting instantly to slow passes to Alba and Busquets.',
      summary: 'Henderson pressed Busquets on a weak backpass, recovering the ball high up the pitch, triggering rapid attacks to secure a 4-0 comeback win.',
      relevance_score: 97,
      video_url: 'https://video.footballatlas.com/liverpool-barca-triggers-2019.mp4',
      event_timestamps: [
        { name: 'Alba turnover & Wijnaldum goal', timestamp: '53:40' }
      ]
    }
  ],
  related_concepts: ['high_press', 'pressing_trap'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const midfieldRotationSeed: TacticalConcept = {
  concept_id: 'midfield_rotation',
  concept_name: 'Midfield Rotation',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.ADVANCED,
  core_explanation: 'A positional rotation tactic where central midfielders exchange positions dynamically to shake off man-marking, create passing lines, and progress the ball through the middle third.',
  key_principles: [
    {
      title: 'Positional Rotation Patterns',
      description: 'Midfielders switching horizontal and vertical roles (e.g. 6 drops, 8 steps high, 10 rotates wide).'
    },
    {
      title: 'Man-Marking Disruption',
      description: 'Dragging defenders out of position through continuous off-the-ball movements and swaps.'
    },
    {
      title: 'Progressive Pass Creation',
      description: 'Opening passing lines to central forwards by pulling defensive midfielders wide.'
    }
  ],
  defensive_response: {
    response_id: 'zonal_mid_handover',
    title: 'Strict Zonal Midfield Handover',
    description: 'Midfielders maintain zonal slots, handing off rotating players to teammates instead of following them.',
    effectiveness_rating: 85,
    advantages: [
      'Preserves the defensive shape centrally',
      'Avoids getting dragged out of position'
    ],
    risks: [
      'Gives the opponent time to receive if handover is late'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'rma_juv_2017',
      title: 'Real Madrid\'s Midfield Rotation vs. Juventus',
      competition: 'UEFA Champions League',
      season: '2016-17',
      teams: 'Real Madrid vs. Juventus',
      tactical_context: 'Kroos, Modric, and Isco rotated roles to break down Juve\'s compact block.',
      summary: 'Continuous swaps between Kroos dropping deep and Isco pushing wide disrupted Juventus\' midfield, leading to a 4-1 Champions League final win.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/realmadrid-rotation-2017.mp4',
      event_timestamps: [
        { name: 'Kroos drop & Casemiro goal', timestamp: '60:15' }
      ]
    }
  ],
  related_concepts: ['midfield_overload', 'positional_play'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const sweeperKeeperSeed: TacticalConcept = {
  concept_id: 'sweeper_keeper',
  concept_name: 'Sweeper-Keeper',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.BEGINNER,
  core_explanation: 'A goalkeeper who plays high up the pitch, actively sweeping up balls played behind a high defensive line, and contributing to build-up play as an extra passing option.',
  key_principles: [
    {
      title: 'High Clearance Sweep',
      description: 'Positioning high outside the box to clear long balls played behind the defensive line.'
    },
    {
      title: 'Build-up Passing Outlet',
      description: 'Functioning as an extra center-back in possession, creating numerical advantages.'
    },
    {
      title: 'Vertical Line Support',
      description: 'Allowing the defensive line to push high up the pitch, narrowing the space in midfield.'
    }
  ],
  defensive_response: {
    response_id: 'early_long_shot',
    title: 'First-Time Long range Shot',
    description: 'Exploiting the goalkeeper\'s high position by attempting long-range shots from the midfield line upon turnovers.',
    effectiveness_rating: 70,
    advantages: [
      'Catches the sweeper-keeper out of position, far from goal',
      'Forces keepers to play more conservatively'
    ],
    risks: [
      'Speculative and often yields easy recoveries if inaccurate'
    ]
  },
  animation_module: {
    module_id: 'highPress',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'ger_alg_2014',
      title: 'Neuer\'s Sweeper-Keeper Masterclass vs. Algeria',
      competition: 'FIFA World Cup',
      season: '2014',
      teams: 'Germany vs. Algeria',
      tactical_context: 'Neuer played far outside his box to sweep behind Germany\'s high line.',
      summary: 'Neuer cleared five long Algerian transition passes outside the box, protecting Germany\'s backline to secure a 2-1 victory.',
      relevance_score: 98,
      video_url: 'https://video.footballatlas.com/neuer-sweeper-2014.mp4',
      event_timestamps: [
        { name: 'Neuer slide tackle outside box', timestamp: '08:50' }
      ]
    }
  ],
  related_concepts: ['high_press', 'defensive_block'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const defensiveTransitionsSeed: TacticalConcept = {
  concept_id: 'defensive_transitions',
  concept_name: 'Defensive Transitions',
  category: TacticalCategory.TRANSITION,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'The critical phase immediately following a turnover, where the team focuses on delaying the opponent\'s counter-attack and rapidly recovering their defensive shape.',
  key_principles: [
    {
      title: 'Immediate Ball Delay',
      description: 'Closest defender applying pressure to delay the vertical outlet pass, rather than winning the ball.'
    },
    {
      title: 'Rapid Recovery Sprints',
      description: 'Midfielders and full-backs executing sprints to recover positions behind the ball.'
    },
    {
      title: 'Horizontal Compactness Shifting',
      description: 'Shifting central defenders inside to protect the box against direct runners.'
    }
  ],
  defensive_response: {
    response_id: 'tactical_foul_stall',
    title: 'Tactical Interruption Delay',
    description: 'Using small, tactical fouls in midfield to break the transition momentum and allow the team to regroup.',
    effectiveness_rating: 88,
    advantages: [
      'Stops the transition instantly in a low-risk zone',
      'Provides crucial seconds to organize the block'
    ],
    risks: [
      'Leads to cards and set-piece opportunities if overused'
    ]
  },
  animation_module: {
    module_id: 'defensiveBlock',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'rma_mci_2022',
      title: 'Ancelotti\'s Transition Stall vs. Manchester City',
      competition: 'UEFA Champions League',
      season: '2021-22',
      teams: 'Real Madrid vs. Manchester City',
      tactical_context: 'Madrid used quick transition recovery lines to absorb City\'s vertical counter-attacks.',
      summary: 'Casemiro delayed De Bruyne\'s transitions, giving Carvajal and Nacho time to sprint back, neutralizing City\'s breakaway threat.',
      relevance_score: 93,
      video_url: 'https://video.footballatlas.com/realmadrid-transitions-2022.mp4',
      event_timestamps: [
        { name: 'Casemiro transition block', timestamp: '24:10' }
      ]
    }
  ],
  related_concepts: ['defensive_block', 'counter_attack_trigger'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
};

export const invertedFullbacksSeed: TacticalConcept = {
  concept_id: 'inverted_fullbacks',
  concept_name: 'Inverted Fullbacks',
  category: TacticalCategory.ATTACKING_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'Fullbacks who step inside into central midfield during the build-up phase, forming a double pivot to control possession and cover transition spaces.',
  key_principles: [
    {
      title: 'Double Pivot Formation',
      description: 'Fullbacks stepping inside to sit alongside the defensive midfielder, creating a 3-2 structure.'
    },
    {
      title: 'Central Passing Superiority',
      description: 'Creating overloads centrally to draw out opposing midfielders, freeing up wingers wide.'
    },
    {
      title: 'Central Transition Security',
      description: 'Positioning fullbacks centrally to intercept central transitions and lock down counter-attacks.'
    }
  ],
  defensive_response: {
    response_id: 'wide_wing_press_inf',
    title: 'Wide Flank Containment Press',
    description: 'Opponent wingers block inside passing angles, forcing fullbacks to play long diagonal passes wide.',
    effectiveness_rating: 80,
    advantages: [
      'Prevents fullbacks from stepping inside centrally',
      'Isolates build-up play to low-risk wide channels'
    ],
    risks: [
      'Exposes spaces behind pressing wingers to overlapping midfielders'
    ]
  },
  animation_module: {
    module_id: 'midfieldOverload',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.PASSING_LANES, RequiredOverlay.MOVEMENT_ARROWS]
  },
  historical_examples: [
    {
      match_id: 'ars_mci_2023',
      title: 'Zinchenko\'s Inverted Fullback Masterclass vs. City',
      competition: 'Premier League',
      season: '2022-23',
      teams: 'Arsenal vs. Manchester City',
      tactical_context: 'Arteta deployed Zinchenko as an inverted left-back to form a double pivot during build-up.',
      summary: 'Zinchenko repeatedly stepped centrally alongside Jorginho, overloading City\'s midfield line and helping Arsenal control the build-up phase.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/zinchenko-inverted-2023.mp4',
      event_timestamps: [
        { name: 'Zinchenko central transition entry', timestamp: '12:20' }
      ]
    }
  ],
  related_concepts: ['midfield_overload', 'box_midfield'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z'
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
  counterAttackTriggerSeed,
  backThreeWingBackSeed,
  compactnessPressingLinesSeed,
  gegenpressingSeed,
  restDefenseSeed,
  positionalPlaySeed,
  boxMidfieldSeed,
  overlappingRunsSeed,
  overloadingToIsolateSeed,
  halfSpaceExploitationSeed,
  verticalTikiTakaSeed,
  shadowStrikerSeed,
  pressingTriggersSeed,
  midfieldRotationSeed,
  sweeperKeeperSeed,
  defensiveTransitionsSeed,
  invertedFullbacksSeed
];

