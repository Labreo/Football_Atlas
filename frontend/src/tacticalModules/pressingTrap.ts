import { TacticalAnimation } from './base';

export const pressingTrapAnimation: TacticalAnimation = {
  players: [
    // Attacking Team (Blue - in possession initially)
    {
      id: 'att_gk',
      team: 'attack',
      role: 'Goalkeeper',
      number: 1,
      startPos: { x: -40, z: 0 },
      keyFrames: [
        { time: 0.0, x: -40, z: 0 },
        { time: 1.0, x: -40, z: 0 }
      ]
    },
    {
      id: 'att_cb_left',
      team: 'attack',
      role: 'Left Center Back',
      number: 4,
      startPos: { x: -25, z: -15 },
      keyFrames: [
        { time: 0.0, x: -25, z: -15 },
        { time: 0.3, x: -23, z: -14 },
        { time: 0.6, x: -24, z: -14 },
        { time: 1.0, x: -22, z: -10 }
      ]
    },
    {
      id: 'att_cb_right',
      team: 'attack',
      role: 'Right Center Back',
      number: 5,
      startPos: { x: -25, z: 15 },
      keyFrames: [
        { time: 0.0, x: -25, z: 15 },
        { time: 1.0, x: -23, z: 12 }
      ]
    },
    {
      id: 'att_mid',
      team: 'attack',
      role: 'Central Midfielder',
      number: 6,
      startPos: { x: -6, z: -2 },
      keyFrames: [
        { time: 0.0, x: -6, z: -2 },
        { time: 0.35, x: -12, z: -5 }, // Drops deep to receive, baiting the trap
        { time: 0.6, x: -12, z: -5 },  // Surrounded and tackled
        { time: 1.0, x: -15, z: -3 }
      ]
    },
    // Pressing Team (Red - out of possession, baiting the trap)
    {
      id: 'def_striker',
      team: 'defense',
      role: 'Striker',
      number: 9,
      startPos: { x: -3, z: -14 },
      keyFrames: [
        { time: 0.0, x: -3, z: -14 },
        { time: 0.2, x: -8, z: -12 },  // Angles run to block backpass to Left CB
        { time: 0.45, x: -15, z: -8 }, // Converges on the Midfielder from behind
        { time: 1.0, x: -10, z: -2 }
      ]
    },
    {
      id: 'def_mid_right',
      team: 'defense',
      role: 'Right Midfielder',
      number: 8,
      startPos: { x: 5, z: -6 },
      keyFrames: [
        { time: 0.0, x: 5, z: -6 },
        { time: 0.45, x: -8, z: -5 },  // Steps up from front to close down receiver
        { time: 0.65, x: -9, z: -5 },  // Tackles and wins the ball!
        { time: 1.0, x: -2, z: -2 }    // Launches counter transition
      ]
    },
    {
      id: 'def_mid_left',
      team: 'defense',
      role: 'Left Midfielder',
      number: 10,
      startPos: { x: -6, z: 10 },
      keyFrames: [
        { time: 0.0, x: -6, z: 10 },
        { time: 0.2, x: -7, z: 5 },
        { time: 0.45, x: -11, z: -1 }, // Sprints in from blindside to block side exit
        { time: 1.0, x: -6, z: -4 }
      ]
    }
  ],
  ball: {
    startPos: { x: -25, z: -15 }, // Starts with Left CB
    keyFrames: [
      { time: 0.15, x: -25, z: -15 },
      { time: 0.35, x: -12, z: -5 }, // Traveled to Att Midfielder
      { time: 0.55, x: -12, z: -5 }, // Att Midfielder tries to turn, tackled
      { time: 0.75, x: -9, z: -5 },  // Won by Def Midfielder 8
      { time: 1.0, x: -2, z: -2 }    // Passed forward on counter
    ]
  },
  passingLanes: [
    {
      id: 'pass_cb_to_mid',
      fromPlayer: 'att_cb_left',
      toPlayer: 'att_mid',
      startFrame: 0.1,
      endFrame: 0.35
    },
    {
      id: 'pass_counter_trigger',
      fromPlayer: 'def_mid_right',
      toPlayer: 'def_mid_left',
      startFrame: 0.75,
      endFrame: 1.0
    }
  ],
  runningPaths: [
    {
      id: 'run_striker_trap',
      playerId: 'def_striker',
      points: [
        { x: -3, z: -14 },
        { x: -8, z: -12 },
        { x: -15, z: -8 }
      ],
      startFrame: 0.1,
      endFrame: 0.45
    },
    {
      id: 'run_mid_right_trap',
      playerId: 'def_mid_right',
      points: [
        { x: 5, z: -6 },
        { x: -8, z: -5 }
      ],
      startFrame: 0.1,
      endFrame: 0.45
    },
    {
      id: 'run_mid_left_trap',
      playerId: 'def_mid_left',
      points: [
        { x: -6, z: 10 },
        { x: -7, z: 5 },
        { x: -11, z: -1 }
      ],
      startFrame: 0.1,
      endFrame: 0.45
    }
  ],
  pressingZones: [
    {
      id: 'trap_zone_mid',
      center: { x: -12, z: -5 }, // The pressing trap enclosing the midfielder
      radius: 4.8,
      startFrame: 0.35,
      endFrame: 0.75,
      color: 'red'
    }
  ]
};
