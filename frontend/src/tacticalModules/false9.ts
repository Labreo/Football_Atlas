import { TacticalAnimation } from './base';

export const false9Animation: TacticalAnimation = {
  players: [
    // Attacking Team (Blue/Cyan styling)
    {
      id: 'att_passer',
      team: 'attack',
      role: 'Central Midfielder',
      number: 8,
      startPos: { x: -15, z: 0 },
      keyFrames: [
        { time: 0.2, x: -10, z: 0 },
        { time: 0.4, x: -8, z: 0 },
        { time: 1.0, x: -5, z: 2 }
      ]
    },
    {
      id: 'att_false9',
      team: 'attack',
      role: 'False 9',
      number: 9,
      startPos: { x: 20, z: 0 }, // Starts high
      keyFrames: [
        { time: 0.2, x: 20, z: 0 },
        { time: 0.5, x: 2, z: -2 }, // Drops deep to receive
        { time: 0.7, x: 1, z: -2 }, // Turns and plays pass
        { time: 1.0, x: 8, z: 5 }
      ]
    },
    {
      id: 'att_winger',
      team: 'attack',
      role: 'Left Winger',
      number: 7,
      startPos: { x: 15, z: -22 },
      keyFrames: [
        { time: 0.4, x: 15, z: -22 },
        { time: 0.7, x: 22, z: -10 }, // Begins diagonal run
        { time: 0.9, x: 32, z: -4 },  // Receives in open space
        { time: 1.0, x: 38, z: -2 }
      ]
    },
    // Defensive Team (Red styling)
    {
      id: 'def_cb_left',
      team: 'defense',
      role: 'Left Center Back',
      number: 4,
      startPos: { x: 25, z: -6 },
      keyFrames: [
        { time: 0.2, x: 25, z: -6 },
        { time: 0.55, x: 12, z: -5 }, // Follows False 9 deep (Mistake!)
        { time: 0.8, x: 16, z: -8 },  // Realizes mistake, attempts recovery
        { time: 1.0, x: 25, z: -5 }
      ]
    },
    {
      id: 'def_cb_right',
      team: 'defense',
      role: 'Right Center Back',
      number: 5,
      startPos: { x: 25, z: 6 },
      keyFrames: [
        { time: 0.2, x: 25, z: 6 },
        { time: 0.6, x: 22, z: 4 },
        { time: 0.9, x: 20, z: 1 },
        { time: 1.0, x: 21, z: 0 }
      ]
    },
    {
      id: 'def_lb',
      team: 'defense',
      role: 'Left Back',
      number: 3,
      startPos: { x: 20, z: -18 },
      keyFrames: [
        { time: 0.4, x: 20, z: -18 },
        { time: 0.8, x: 24, z: -14 },
        { time: 1.0, x: 28, z: -10 }
      ]
    }
  ],
  ball: {
    startPos: { x: -15, z: 0 }, // Starts with passer
    keyFrames: [
      { time: 0.2, x: -10, z: 0 },
      { time: 0.4, x: 2, z: -2 },   // Pass from Midfielder to False 9
      { time: 0.6, x: 1, z: -2 },   // False 9 controls it
      { time: 0.8, x: 32, z: -4 },  // Pass through to running winger
      { time: 0.9, x: 32, z: -4 },  // Winger receives
      { time: 1.0, x: 38, z: -2 }
    ]
  },
  passingLanes: [
    {
      id: 'lane_1',
      fromPlayer: 'att_passer',
      toPlayer: 'att_false9',
      startFrame: 0.2,
      endFrame: 0.4
    },
    {
      id: 'lane_2',
      fromPlayer: 'att_false9',
      toPlayer: 'att_winger',
      startFrame: 0.6,
      endFrame: 0.8
    }
  ],
  runningPaths: [
    {
      id: 'run_winger',
      playerId: 'att_winger',
      points: [
        { x: 15, z: -22 },
        { x: 22, z: -10 },
        { x: 32, z: -4 }
      ],
      startFrame: 0.4,
      endFrame: 0.9
    },
    {
      id: 'run_defender_drag',
      playerId: 'def_cb_left',
      points: [
        { x: 25, z: -6 },
        { x: 12, z: -5 }
      ],
      startFrame: 0.35,
      endFrame: 0.55
    }
  ],
  pressingZones: [
    {
      id: 'space_exploit',
      center: { x: 25, z: -10 }, // Highlight vacated space
      radius: 6,
      startFrame: 0.55,
      endFrame: 0.95,
      color: 'green'
    }
  ]
};
