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
  related_concepts: ['compactness', 'counter_attack'],
  docling_chunks: [],
  schema_version: '1.0.0',
  created_at: '2026-05-31T00:00:00Z',
  updated_at: '2026-05-31T00:00:00Z'
};

export const counterAttackSeed: TacticalConcept = {
  concept_id: 'counter_attack',
  concept_name: 'Counter-Attack',
  category: TacticalCategory.TRANSITION,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'An offensive transition initiated immediately upon winning possession, moving the ball vertically and at high speed to exploit opponent disorganization before they can recover their defensive shape.',
  key_principles: [
    {
      title: 'Vertical Release Pass',
      description: 'First pass made forward out of pressure to trigger runs, rather than playing lateral safety circulations.'
    },
    {
      title: 'Half-Space Exploding Runs',
      description: 'Wingers making high-speed runs into wide channels, drawing remaining central defenders out of shape.'
    },
    {
      title: 'Third-Man Support Runs',
      description: 'Midfielders making runs from deep to create trailing shooting options at the edge of the area.'
    }
  ],
  defensive_response: {
    response_id: 'tactical_foul_rest',
    title: 'Tactical Fouling & Rest Defense',
    description: 'Applying immediate counter-pressing to stall transitions, or making tactical fouls in the opponent half to allow regrouping.',
    effectiveness_rating: 85,
    advantages: [
      'Halts vertical breaks at their source',
      'Keeps defensive lines high and organized'
    ],
    risks: [
      'Results in multiple yellow cards for central players',
      'Vulnerable if initial counter-pressing jumps are bypassed'
    ]
  },
  animation_module: {
    module_id: 'counterTrigger',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.MOVEMENT_ARROWS, RequiredOverlay.PASSING_LANES]
  },
  historical_examples: [
    {
      match_id: 'lei_mci_2016',
      title: 'Ranieri\'s Direct Transition Masterclass',
      competition: 'Premier League',
      season: '2015-16',
      teams: 'Manchester City vs. Leicester City',
      tactical_context: 'Leicester sat in a deep mid-block, baiting City\'s fullbacks forward to release Vardy on direct vertical passes.',
      summary: 'Kante intercepted in midfield and released Mahrez, who set up Jamie Vardy behind the high City line, securing a historic 3-1 win.',
      relevance_score: 95,
      video_url: 'https://video.footballatlas.com/leicester-city-counter.mp4',
      event_timestamps: [
        { name: 'Kante interception & vertical release', timestamp: '47:18' }
      ]
    }
  ],
  related_concepts: ['low_block', 'high_press'],
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

export const backThreeSeed: TacticalConcept = {
  concept_id: 'back_three',
  concept_name: 'Back Three',
  category: TacticalCategory.DEFENSIVE_SHAPE,
  complexity: ComplexityLevel.INTERMEDIATE,
  core_explanation: 'A defensive structure utilizing three central defenders to build play and cover wide spaces, morphing into a back five in low block phases when wingbacks drop.',
  key_principles: [
    {
      title: 'Wide CB Progression',
      description: 'Left and right center-backs carrying the ball into midfield to provoke pressing responses.'
    },
    {
      title: 'Wingback Cover Switch',
      description: 'Wingbacks covering wide touchline paths, releasing central defenders to stay compact in central corridors.'
    },
    {
      title: 'Central Coverage Ratio',
      description: 'Maintaining a 3v2 overload against dual-striker setups, ensuring a spare defender is always free.'
    }
  ],
  defensive_response: {
    response_id: 'isolate_wide_cb',
    title: 'Wide Center-back Isolate Press',
    description: 'Pressing the side center-backs aggressively against the touchline, cutting off paths back to the central sweeper.',
    effectiveness_rating: 75,
    advantages: [
      'Forces central errors far from the central anchor',
      'Isolates side CBs in wide areas where they lack fullback support'
    ],
    risks: [
      'Leaves massive diagonal channels open if the press is late',
      'Vulnerable to long diagonal switches to opposite wingbacks'
    ]
  },
  animation_module: {
    module_id: 'backThree',
    version: '1.0.0',
    required_overlays: [RequiredOverlay.DEFENSIVE_LINES, RequiredOverlay.SPACE_CONTROL]
  },
  historical_examples: [
    {
      match_id: 'che_eve_2016',
      title: 'Conte\'s 3-4-3 Shape Dismantles Everton',
      competition: 'Premier League',
      season: '2016-17',
      teams: 'Chelsea vs. Everton',
      tactical_context: 'Antonio Conte shifted Chelsea to a 3-4-3, giving Alonso and Moses complete freedom to advance as wingbacks.',
      summary: 'Chelsea\'s back three built play comfortably, releasing Moses and Alonso wide to stretch Everton\'s defense, yielding a dominant 5-0 win.',
      relevance_score: 93,
      video_url: 'https://video.footballatlas.com/conte-chelsea-343.mp4',
      event_timestamps: [
        { name: 'Moses overlap & CB progression', timestamp: '22:10' }
      ]
    }
  ],
  related_concepts: ['low_block', 'midfield_overload'],
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
    module_id: 'thirdManRun',
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

export const allSeeds: TacticalConcept[] = [
  false9Seed, 
  highPressSeed, 
  pressingTrapSeed,
  midfieldOverloadSeed,
  lowBlockSeed,
  counterAttackSeed,
  invertedWingerSeed,
  backThreeSeed,
  thirdManRunSeed,
  compactnessSeed
];
