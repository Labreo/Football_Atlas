import { TacticalAnimation } from './base';

export const highPressAnimation: TacticalAnimation = {
  players: [
    // Build-up Team (Attackers in possession in their own half)
    {
      id: 'att_gk',
      team: 'attack',
      role: 'Goalkeeper',
      number: 1,
      startPos: { x: -40, z: 0 },
      keyFrames: [
        { time: 0.1, x: -40, z: 0 },
        { time: 0.3, x: -38, z: 0 },
        { time: 1.0, x: -38, z: 0 }
      ]
    },
    {
      id: 'att_cb_left',
      team: 'attack',
      role: 'Left Center Back',
      number: 4,
      startPos: { x: -28, z: -12 },
      keyFrames: [
        { time: 0.2, x: -28, z: -12 },
        { time: 0.45, x: -26, z: -14 }, // Receives ball under pressure
        { time: 0.65, x: -27, z: -14 }, // Panics, tries to play forward
        { time: 1.0, x: -20, z: -10 }
      ]
    },
    {
      id: 'att_cb_right',
      team: 'attack',
      role: 'Right Center Back',
      number: 5,
      startPos: { x: -28, z: 12 },
      keyFrames: [
        { time: 0.1, x: -28, z: 12 },
        { time: 0.4, x: -28, z: 10 },
        { time: 1.0, x: -25, z: 8 }
      ]
    },
    // Pressing Team (Defenders out of possession, trying to win the ball)
    {
      id: 'def_striker',
      team: 'defense',
      role: 'Striker',
      number: 9,
      startPos: { x: -12, z: 2 },
      keyFrames: [
        { time: 0.15, x: -12, z: 2 },
        { time: 0.4, x: -22, z: -8 },  // Curved run towards Left CB, blocking right CB return option
        { time: 0.7, x: -25, z: -12 }, // Enforces pressure
        { time: 1.0, x: -18, z: -6 }
      ]
    },
    {
      id: 'def_winger_left',
      team: 'defense',
      role: 'Left Winger',
      number: 11,
      startPos: { x: -15, z: -20 },
      keyFrames: [
        { time: 0.2, x: -15, z: -20 },
        { time: 0.5, x: -22, z: -18 }, // Closes down the left fullback line
        { time: 0.8, x: -24, z: -16 },
        { time: 1.0, x: -20, z: -12 }
      ]
    },
    {
      id: 'def_midfielder',
      team: 'defense',
      role: 'Defensive Midfielder',
      number: 8,
      startPos: { x: 2, z: -4 },
      keyFrames: [
        { time: 0.3, x: 2, z: -4 },
        { time: 0.65, x: -12, z: -8 }, // Anticipates panic pass, steps up to intercept
        { time: 0.8, x: -14, z: -8 },  // Intercepts the ball!
        { time: 1.0, x: -8, z: -4 }
      ]
    }
  ],
  ball: {
    startPos: { x: -40, z: 0 }, // Starts with GK
    keyFrames: [
      { time: 0.15, x: -28, z: -12 }, // GK plays pass to Left CB
      { time: 0.4, x: -28, z: -12 },  // Left CB gets ball
      { time: 0.65, x: -14, z: -8 },  // Left CB tries to pass, intercepted by Def Midfielder No.8
      { time: 0.8, x: -14, z: -8 },   // Intercepted
      { time: 1.0, x: -8, z: -4 }     // Carried forward
    ]
  },
  passingLanes: [
    {
      id: 'pass_gk',
      fromPlayer: 'att_gk',
      toPlayer: 'att_cb_left',
      startFrame: 0.05,
      endFrame: 0.2
    },
    {
      id: 'pass_panicked',
      fromPlayer: 'att_cb_left',
      toPlayer: 'def_midfielder', // Intercepted path
      startFrame: 0.5,
      endFrame: 0.65
    }
  ],
  runningPaths: [
    {
      id: 'run_striker_curve',
      playerId: 'def_striker',
      points: [
        { x: -12, z: 2 },
        { x: -18, z: -4 },
        { x: -22, z: -8 }
      ],
      startFrame: 0.1,
      endFrame: 0.5
    },
    {
      id: 'run_mid_intercept',
      playerId: 'def_midfielder',
      points: [
        { x: 2, z: -4 },
        { x: -12, z: -8 }
      ],
      startFrame: 0.35,
      endFrame: 0.7
    }
  ],
  pressingZones: [
    {
      id: 'press_zone_left_cb',
      center: { x: -28, z: -14 }, // Pressure cooker zone around left CB
      radius: 5,
      startFrame: 0.45,
      endFrame: 0.75,
      color: 'red'
    }
  ]
};
