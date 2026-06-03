import { 
  PlayerState, 
  ArrowState, 
  OverlayState, 
  TacticalPosition, 
  AnimationFrame 
} from '../tacticalEngine/types';
import { 
  PrimitiveCompileContext, 
  TacticalPrimitive, 
  PhaseInfo, 
  AnnotationInfo, 
  AnalyticsEventInfo, 
  CameraPresetInfo 
} from './types';

// Helper to ease timings
function ease(t: number, type?: string): number {
  if (!type || type === 'linear') return t;
  if (type === 'quadInOut') {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  if (type === 'cubicInOut') {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  if (type === 'sineInOut') {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }
  return t;
}

export function interpolatePlayerPosition(
  keyframes: AnimationFrame[],
  startPos: TacticalPosition,
  time: number
): TacticalPosition {
  if (keyframes.length === 0) return startPos;
  
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  
  if (time <= 0) return { x: startPos.x, z: startPos.z };
  if (time >= 1.0) {
    const last = sorted[sorted.length - 1];
    return { x: last.x, z: last.z };
  }

  let prev = { time: 0, x: startPos.x, z: startPos.z, easing: 'linear' };
  let next = sorted[0];

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].time <= time) {
      prev = {
        time: sorted[i].time,
        x: sorted[i].x,
        z: sorted[i].z,
        easing: sorted[i].easing || 'linear'
      };
    } else {
      next = sorted[i];
      break;
    }
  }

  const range = next.time - prev.time;
  if (range === 0) return { x: prev.x, z: prev.z };

  const t = (time - prev.time) / range;
  const easedT = ease(t, prev.easing);

  return {
    x: prev.x + (next.x - prev.x) * easedT,
    z: prev.z + (next.z - prev.z) * easedT,
  };
}

export interface CompileResult {
  players: PlayerState[];
  arrows: ArrowState[];
  overlays: OverlayState[];
  ball: {
    startPos: TacticalPosition;
    keyFrames: AnimationFrame[];
  };
  phases: PhaseInfo[];
  annotations: AnnotationInfo[];
  analyticsEvents: AnalyticsEventInfo[];
  cameraPresets: CameraPresetInfo[];
  validationReport: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export class PrimitiveCompiler {
  public static compile(
    rootPrimitives: TacticalPrimitive[],
    durationSeconds: number,
    activeBranch: 'A' | 'B' = 'A'
  ): CompileResult {
    const playersMap = new Map<string, PlayerState>();
    const arrows: ArrowState[] = [];
    const overlays: OverlayState[] = [];
    const ballKeyFrames: AnimationFrame[] = [];
    
    const context: PrimitiveCompileContext = {
      players: playersMap,
      arrows,
      overlays,
      ballKeyFrames,
      ballStartPos: { x: 0, z: 0 },
      phases: [],
      annotations: [],
      analyticsEvents: [],
      cameraPresets: [],
      activeBranch,
      durationSeconds,
      
      getPlayerPosition(playerId: string, time: number): TacticalPosition {
        const p = playersMap.get(playerId);
        if (!p) return { x: 0, z: 0 };
        return interpolatePlayerPosition(p.keyFrames, p.startPos, time);
      },
      
      addPlayerKeyframe(
        playerId: string, 
        time: number, 
        pos: TacticalPosition, 
        easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
      ): void {
        const p = playersMap.get(playerId);
        if (!p) return;
        
        // Remove duplicate times to avoid conflicts
        p.keyFrames = p.keyFrames.filter(kf => Math.abs(kf.time - time) > 0.0001);
        p.keyFrames.push({ time, x: pos.x, z: pos.z, easing });
        p.keyFrames.sort((a, b) => a.time - b.time);
      }
    };

    // Compile each root primitive node
    rootPrimitives.forEach(primitive => {
      primitive.compile(context);
    });

    // Ensure all players have a closing keyframe at t=1.0 reflecting their final positions
    playersMap.forEach(p => {
      if (p.keyFrames.length > 0) {
        const last = p.keyFrames[p.keyFrames.length - 1];
        if (last.time < 1.0) {
          p.keyFrames.push({ time: 1.0, x: last.x, z: last.z });
        }
      } else {
        p.keyFrames.push({ time: 1.0, x: p.startPos.x, z: p.startPos.z });
      }
    });

    // Perform runtime validations
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 1. Check player bounds
    playersMap.forEach(p => {
      p.keyFrames.forEach(kf => {
        if (Math.abs(kf.x) > 55 || Math.abs(kf.z) > 37) {
          errors.push(`Player "${p.id}" keyframe at t=${kf.time} is out of pitch bounds (x: ${kf.x.toFixed(1)}, z: ${kf.z.toFixed(1)})`);
        }
      });
    });

    // 2. Check timing ranges
    arrows.forEach(a => {
      if (a.startFrame < 0 || a.endFrame > 1 || a.startFrame > a.endFrame) {
        errors.push(`Arrow "${a.id}" has invalid timing bounds [${a.startFrame}, ${a.endFrame}]`);
      }
    });

    overlays.forEach(o => {
      if (o.startFrame < 0 || o.endFrame > 1 || o.startFrame > o.endFrame) {
        errors.push(`Overlay "${o.id}" has invalid timing bounds [${o.startFrame}, ${o.endFrame}]`);
      }
    });

    // 3. Warnings for empty timelines
    if (playersMap.size === 0) {
      warnings.push('Compiled concept has no players registered.');
    }
    
    const valid = errors.length === 0;

    return {
      players: Array.from(playersMap.values()),
      arrows,
      overlays,
      ball: {
        startPos: context.ballStartPos,
        keyFrames: ballKeyFrames.sort((a, b) => a.time - b.time)
      },
      phases: context.phases,
      annotations: context.annotations,
      analyticsEvents: context.analyticsEvents,
      cameraPresets: context.cameraPresets,
      validationReport: {
        valid,
        errors,
        warnings
      }
    };
  }
}
