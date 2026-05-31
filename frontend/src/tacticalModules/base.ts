export interface TacticalPosition {
  x: number;
  z: number;
}

export interface TacticalPlayer {
  id: string;
  team: 'attack' | 'defense';
  role: string;
  number: number;
  startPos: TacticalPosition;
  keyFrames: Array<{
    time: number; // float from 0 to 1
    x: number;
    z: number;
  }>;
}

export interface PassingLane {
  id: string;
  fromPlayer: string;
  toPlayer: string;
  startFrame: number; // time fraction (0 to 1)
  endFrame: number;
}

export interface RunningPath {
  id: string;
  playerId: string;
  points: TacticalPosition[];
  startFrame: number;
  endFrame: number;
}

export interface PressingZone {
  id: string;
  center: TacticalPosition;
  radius: number;
  startFrame: number;
  endFrame: number;
  color: string; // e.g., 'cyan', 'red', 'green', 'amber'
}

export interface TacticalAnimation {
  players: TacticalPlayer[];
  ball: {
    startPos: TacticalPosition;
    keyFrames: Array<{
      time: number;
      x: number;
      z: number;
    }>;
  };
  passingLanes: PassingLane[];
  runningPaths: RunningPath[];
  pressingZones: PressingZone[];
}

/**
 * Linear interpolation helper for keyframe interpolation
 */
export function interpolatePosition(
  keyframes: Array<{ time: number; x: number; z: number }>,
  startPos: TacticalPosition,
  time: number
): TacticalPosition {
  if (keyframes.length === 0) return startPos;
  
  // Sort keyframes by time
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  
  // If before first keyframe, interpolate between startPos and first keyframe
  if (time <= 0) return startPos;
  if (time >= 1) return sorted[sorted.length - 1];

  // Find surrounding keyframes
  let prev = { time: 0, x: startPos.x, z: startPos.z };
  let next = sorted[0];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].time <= time) {
      prev = sorted[i];
    } else {
      next = sorted[i];
      break;
    }
  }

  const range = next.time - prev.time;
  if (range === 0) return prev;
  
  const pct = (time - prev.time) / range;
  return {
    x: prev.x + (next.x - prev.x) * pct,
    z: prev.z + (next.z - prev.z) * pct,
  };
}
