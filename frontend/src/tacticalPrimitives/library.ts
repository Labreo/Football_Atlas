import { 
  TacticalPrimitive, 
  PrimitiveCompileContext, 
  FormationType, 
  TeamType, 
  PitchSide 
} from './types';
import { PRIMITIVE_STYLE_CONFIG } from './config';
import { TacticalPosition, OverlayType } from '../tacticalEngine/types';

// ────────────────────────────────────────────────────────────
// FORMATION COORDINATE PRESETS
// ────────────────────────────────────────────────────────────
export function getFormationPositions(
  formation: FormationType,
  _team: TeamType,
  side: PitchSide
): Map<string, TacticalPosition> {
  const positions = new Map<string, TacticalPosition>();
  // Standard X coordinate offsets depending on side and team role
  // Attackers face from -X to +X.
  const sign = side === 'left' ? -1 : 1;
  const scaleX = (x: number) => x * sign;
  const scaleZ = (z: number) => z * sign;

  // Pre-configured role coordinates (assume baseline for Right side, mirror for Left)
  if (formation === '4-3-3') {
    positions.set('GK', { x: scaleX(-45), z: 0 });
    positions.set('LB', { x: scaleX(-20), z: scaleZ(-22) });
    positions.set('LCB', { x: scaleX(-25), z: scaleZ(-8) });
    positions.set('RCB', { x: scaleX(-25), z: scaleZ(8) });
    positions.set('RB', { x: scaleX(-20), z: scaleZ(22) });
    positions.set('DM', { x: scaleX(-12), z: 0 });
    positions.set('LCM', { x: scaleX(-5), z: scaleZ(-10) });
    positions.set('RCM', { x: scaleX(-5), z: scaleZ(10) });
    positions.set('LW', { x: scaleX(15), z: scaleZ(-22) });
    positions.set('CF', { x: scaleX(20), z: 0 });
    positions.set('RW', { x: scaleX(15), z: scaleZ(22) });
  } else if (formation === '4-4-2') {
    positions.set('GK', { x: scaleX(-45), z: 0 });
    positions.set('LB', { x: scaleX(-20), z: scaleZ(-22) });
    positions.set('LCB', { x: scaleX(-25), z: scaleZ(-8) });
    positions.set('RCB', { x: scaleX(-25), z: scaleZ(8) });
    positions.set('RB', { x: scaleX(-20), z: scaleZ(22) });
    positions.set('LM', { x: scaleX(-5), z: scaleZ(-20) });
    positions.set('LCM', { x: scaleX(-8), z: scaleZ(-7) });
    positions.set('RCM', { x: scaleX(-8), z: scaleZ(7) });
    positions.set('RM', { x: scaleX(-5), z: scaleZ(20) });
    positions.set('LST', { x: scaleX(18), z: scaleZ(-7) });
    positions.set('RST', { x: scaleX(18), z: scaleZ(7) });
  } else if (formation === '3-4-3') {
    positions.set('GK', { x: scaleX(-45), z: 0 });
    positions.set('LCB', { x: scaleX(-26), z: scaleZ(-12) });
    positions.set('CCB', { x: scaleX(-28), z: 0 });
    positions.set('RCB', { x: scaleX(-26), z: scaleZ(12) });
    positions.set('LWB', { x: scaleX(-15), z: scaleZ(-24) });
    positions.set('LCM', { x: scaleX(-8), z: scaleZ(-7) });
    positions.set('RCM', { x: scaleX(-8), z: scaleZ(7) });
    positions.set('RWB', { x: scaleX(-15), z: scaleZ(24) });
    positions.set('LW', { x: scaleX(15), z: scaleZ(-22) });
    positions.set('CF', { x: scaleX(20), z: 0 });
    positions.set('RW', { x: scaleX(15), z: scaleZ(22) });
  } else if (formation === '3-5-2') {
    positions.set('GK', { x: scaleX(-45), z: 0 });
    positions.set('LCB', { x: scaleX(-26), z: scaleZ(-12) });
    positions.set('CCB', { x: scaleX(-28), z: 0 });
    positions.set('RCB', { x: scaleX(-26), z: scaleZ(12) });
    positions.set('LWB', { x: scaleX(-15), z: scaleZ(-24) });
    positions.set('DM', { x: scaleX(-12), z: 0 });
    positions.set('LCM', { x: scaleX(-5), z: scaleZ(-9) });
    positions.set('RCM', { x: scaleX(-5), z: scaleZ(9) });
    positions.set('RWB', { x: scaleX(-15), z: scaleZ(24) });
    positions.set('LST', { x: scaleX(18), z: scaleZ(-7) });
    positions.set('RST', { x: scaleX(18), z: scaleZ(7) });
  } else if (formation === '5-3-2') {
    positions.set('GK', { x: scaleX(-45), z: 0 });
    positions.set('LWB', { x: scaleX(-20), z: scaleZ(-24) });
    positions.set('LCB', { x: scaleX(-26), z: scaleZ(-10) });
    positions.set('CCB', { x: scaleX(-28), z: 0 });
    positions.set('RCB', { x: scaleX(-26), z: scaleZ(10) });
    positions.set('RWB', { x: scaleX(-20), z: scaleZ(24) });
    positions.set('LCM', { x: scaleX(-8), z: scaleZ(-8) });
    positions.set('DM', { x: scaleX(-12), z: 0 });
    positions.set('RCM', { x: scaleX(-8), z: scaleZ(8) });
    positions.set('LST', { x: scaleX(18), z: scaleZ(-7) });
    positions.set('RST', { x: scaleX(18), z: scaleZ(7) });
  }

  return positions;
}

export function getPlayerNumber(role: string, _team: TeamType): number {
  const map: Record<string, number> = {
    'GK': 1, 'Goalkeeper': 1,
    'LB': 3, 'Left Back': 3,
    'LCB': 4, 'Left Center Back': 4,
    'RCB': 5, 'Right Center Back': 5,
    'RB': 2, 'Right Back': 2,
    'DM': 6, 'Defensive Midfielder': 6,
    'LCM': 8, 'Left Midfielder': 8, 'Central Midfielder': 8, 'Central Midfielder L': 8,
    'RCM': 10, 'Right Midfielder': 10, 'Central Midfielder R': 10,
    'LW': 11, 'Left Winger': 11,
    'CF': 9, 'Center Forward': 9, 'Striker': 9, 'False 9': 9,
    'RW': 7, 'Right Winger': 7,
    'LM': 11, 'RM': 7,
    'CCB': 5, 'LWB': 3, 'RWB': 2,
    'LST': 9, 'RST': 11, 'Striker Left': 9, 'Striker Right': 11,
  };
  return map[role] || 8;
}

// Helper to resolve player positions from context or a raw coordinate
function resolvePosition(val: string | TacticalPosition, context: PrimitiveCompileContext, time: number): TacticalPosition {
  if (typeof val === 'string') {
    return context.getPlayerPosition(val, time);
  }
  return val;
}

// ────────────────────────────────────────────────────────────
// PLAYER MOVEMENT PRIMITIVES
// ────────────────────────────────────────────────────────────

export class MovePlayer implements TacticalPrimitive {
  type = 'MovePlayer';
  constructor(
    public playerId: string,
    public targetPos: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const current = context.getPlayerPosition(this.playerId, this.startTime);
    context.addPlayerKeyframe(this.playerId, this.startTime, current);
    context.addPlayerKeyframe(this.playerId, this.endTime, this.targetPos, this.easing);
  }
}

export class MoveGroup implements TacticalPrimitive {
  type = 'MoveGroup';
  constructor(
    public playerIds: string[],
    public offset: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    this.playerIds.forEach(id => {
      const current = context.getPlayerPosition(id, this.startTime);
      const target = { x: current.x + this.offset.x, z: current.z + this.offset.z };
      context.addPlayerKeyframe(id, this.startTime, current);
      context.addPlayerKeyframe(id, this.endTime, target, this.easing);
    });
  }
}

export class DropDeep implements TacticalPrimitive {
  type = 'DropDeep';
  constructor(
    public playerId: string,
    public distance: number,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const p = context.players.get(this.playerId);
    if (!p) return;
    const current = context.getPlayerPosition(this.playerId, this.startTime);
    const dir = p.team === 'attack' ? -1 : 1;
    const target = { x: current.x + dir * this.distance, z: current.z };
    context.addPlayerKeyframe(this.playerId, this.startTime, current);
    context.addPlayerKeyframe(this.playerId, this.endTime, target, this.easing);
  }
}

export class PushForward implements TacticalPrimitive {
  type = 'PushForward';
  constructor(
    public playerId: string,
    public distance: number,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const p = context.players.get(this.playerId);
    if (!p) return;
    const current = context.getPlayerPosition(this.playerId, this.startTime);
    const dir = p.team === 'attack' ? 1 : -1;
    const target = { x: current.x + dir * this.distance, z: current.z };
    context.addPlayerKeyframe(this.playerId, this.startTime, current);
    context.addPlayerKeyframe(this.playerId, this.endTime, target, this.easing);
  }
}

export class Overlap implements TacticalPrimitive {
  type = 'Overlap';
  constructor(
    public fullbackId: string,
    public wingerId: string,
    public startTime: number,
    public endTime: number,
    public distance: number = 5,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const fbPos = context.getPlayerPosition(this.fullbackId, this.startTime);
    const wingPos = context.getPlayerPosition(this.wingerId, this.startTime);
    
    const outsideZDir = wingPos.z < 0 ? -1 : 1;
    const midTime = (this.startTime + this.endTime) / 2;
    
    const midPos = {
      x: wingPos.x,
      z: wingPos.z + outsideZDir * this.distance
    };
    
    const teamDir = context.players.get(this.fullbackId)?.team === 'attack' ? 1 : -1;
    const endPos = {
      x: wingPos.x + teamDir * 8,
      z: wingPos.z + outsideZDir * 2
    };
    
    context.addPlayerKeyframe(this.fullbackId, this.startTime, fbPos);
    context.addPlayerKeyframe(this.fullbackId, midTime, midPos, this.easing);
    context.addPlayerKeyframe(this.fullbackId, this.endTime, endPos, this.easing);
  }
}

export class Underlap implements TacticalPrimitive {
  type = 'Underlap';
  constructor(
    public fullbackId: string,
    public wingerId: string,
    public startTime: number,
    public endTime: number,
    public distance: number = 6,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const fbPos = context.getPlayerPosition(this.fullbackId, this.startTime);
    const wingPos = context.getPlayerPosition(this.wingerId, this.startTime);
    
    const insideZDir = wingPos.z < 0 ? 1 : -1;
    const midTime = (this.startTime + this.endTime) / 2;
    
    const midPos = {
      x: wingPos.x,
      z: wingPos.z + insideZDir * this.distance
    };
    
    const teamDir = context.players.get(this.fullbackId)?.team === 'attack' ? 1 : -1;
    const endPos = {
      x: wingPos.x + teamDir * 8,
      z: wingPos.z + insideZDir * 1
    };
    
    context.addPlayerKeyframe(this.fullbackId, this.startTime, fbPos);
    context.addPlayerKeyframe(this.fullbackId, midTime, midPos, this.easing);
    context.addPlayerKeyframe(this.fullbackId, this.endTime, endPos, this.easing);
  }
}

export class RotatePositions implements TacticalPrimitive {
  type = 'RotatePositions';
  constructor(
    public playerIds: string[],
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const initialPositions = this.playerIds.map(id => context.getPlayerPosition(id, this.startTime));
    
    this.playerIds.forEach((id, index) => {
      const nextIndex = (index + 1) % this.playerIds.length;
      const targetPos = initialPositions[nextIndex];
      const startPos = initialPositions[index];
      
      context.addPlayerKeyframe(id, this.startTime, startPos);
      context.addPlayerKeyframe(id, this.endTime, targetPos, this.easing);
    });
  }
}

export class ShiftBlock implements TacticalPrimitive {
  type = 'ShiftBlock';
  constructor(
    public team: TeamType,
    public offset: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const matchTeam = this.team === 'attack' ? 'attack' : 'defend';
    context.players.forEach(p => {
      if (p.team === matchTeam) {
        const start = context.getPlayerPosition(p.id, this.startTime);
        const target = { x: start.x + this.offset.x, z: start.z + this.offset.z };
        context.addPlayerKeyframe(p.id, this.startTime, start);
        context.addPlayerKeyframe(p.id, this.endTime, target, this.easing);
      }
    });
  }
}

export class CompressShape implements TacticalPrimitive {
  type = 'CompressShape';
  constructor(
    public team: TeamType,
    public startTime: number,
    public endTime: number,
    public factor: number = 0.8,
    public customCentroid?: TacticalPosition,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const matchTeam = this.team === 'attack' ? 'attack' : 'defend';
    const activePlayers: { id: string; start: TacticalPosition }[] = [];
    let sumX = 0, sumZ = 0;

    context.players.forEach(p => {
      if (p.team === matchTeam && p.visible) {
        const pos = context.getPlayerPosition(p.id, this.startTime);
        activePlayers.push({ id: p.id, start: pos });
        sumX += pos.x;
        sumZ += pos.z;
      }
    });

    if (activePlayers.length === 0) return;

    const centroid = this.customCentroid || {
      x: sumX / activePlayers.length,
      z: sumZ / activePlayers.length
    };

    activePlayers.forEach(item => {
      const dx = item.start.x - centroid.x;
      const dz = item.start.z - centroid.z;
      const target = {
        x: centroid.x + dx * this.factor,
        z: centroid.z + dz * this.factor
      };
      context.addPlayerKeyframe(item.id, this.startTime, item.start);
      context.addPlayerKeyframe(item.id, this.endTime, target, this.easing);
    });
  }
}

export class ExpandShape implements TacticalPrimitive {
  type = 'ExpandShape';
  constructor(
    public team: TeamType,
    public startTime: number,
    public endTime: number,
    public factor: number = 1.2,
    public customCentroid?: TacticalPosition,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const compressor = new CompressShape(this.team, this.startTime, this.endTime, this.factor, this.customCentroid, this.easing);
    compressor.compile(context);
  }
}

export class TriggerRun implements TacticalPrimitive {
  type = 'TriggerRun';
  constructor(
    public playerId: string,
    public targetPos: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut' = 'cubicInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const mover = new MovePlayer(this.playerId, this.targetPos, this.startTime, this.endTime, this.easing);
    mover.compile(context);
  }
}

export class SupportRun implements TacticalPrimitive {
  type = 'SupportRun';
  constructor(
    public playerId: string,
    public targetPos: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut' = 'quadInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const mover = new MovePlayer(this.playerId, this.targetPos, this.startTime, this.endTime, this.easing);
    mover.compile(context);
  }
}

export class RecoveryRun implements TacticalPrimitive {
  type = 'RecoveryRun';
  constructor(
    public playerId: string,
    public targetPos: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut' = 'quadInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const mover = new MovePlayer(this.playerId, this.targetPos, this.startTime, this.endTime, this.easing);
    mover.compile(context);
  }
}

// ────────────────────────────────────────────────────────────
// FORMATION PRIMITIVES
// ────────────────────────────────────────────────────────────

export class FormationState implements TacticalPrimitive {
  type = 'FormationState';
  constructor(
    public team: TeamType,
    public formation: FormationType,
    public side: PitchSide,
    public customPositions?: Record<string, TacticalPosition>,
    public customIds?: Record<string, string>,
    public onlyShowCustom: boolean = false
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const defaultPositions = getFormationPositions(this.formation, this.team, this.side);
    
    defaultPositions.forEach((pos, role) => {
      if (this.onlyShowCustom && (!this.customPositions || !this.customPositions[role])) {
        return;
      }
      const mergedPos = (this.customPositions && this.customPositions[role]) || pos;
      const defaultId = `${this.team === 'attack' ? 'att' : 'def'}_${role.toLowerCase().replace(/ /g, '_')}`;
      const id = (this.customIds && this.customIds[role]) || defaultId;
      const number = getPlayerNumber(role, this.team);
      
      const newPlayer = {
        id,
        team: this.team === 'attack' ? 'attack' : ('defend' as any),
        role,
        number,
        startPos: { ...mergedPos },
        currentPos: { ...mergedPos },
        keyFrames: [{ time: 0.0, x: mergedPos.x, z: mergedPos.z }],
        visible: true
      };
      
      context.players.set(id, newPlayer);
    });
  }
}

export class ShapeTransition implements TacticalPrimitive {
  type = 'ShapeTransition';
  constructor(
    public team: TeamType,
    public targetFormation: FormationType,
    public side: PitchSide,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const targets = getFormationPositions(this.targetFormation, this.team, this.side);
    targets.forEach((pos, role) => {
      const id = `${this.team === 'attack' ? 'att' : 'def'}_${role.toLowerCase().replace(/ /g, '_')}`;
      if (context.players.has(id)) {
        const start = context.getPlayerPosition(id, this.startTime);
        context.addPlayerKeyframe(id, this.startTime, start);
        context.addPlayerKeyframe(id, this.endTime, pos, this.easing);
      }
    });
  }
}

export class FormationShift implements TacticalPrimitive {
  type = 'FormationShift';
  constructor(
    public team: TeamType,
    public offset: TacticalPosition,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const shifter = new ShiftBlock(this.team, this.offset, this.startTime, this.endTime, this.easing);
    shifter.compile(context);
  }
}

export class LineCompression implements TacticalPrimitive {
  type = 'LineCompression';
  constructor(
    public team: TeamType,
    public targetLine: 'defense' | 'midfield',
    public compressionFactor: number = 0.75,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const matchTeam = this.team === 'attack' ? 'attack' : 'defend';
    
    // 1. Calculate centroid of target line
    let sumX = 0, count = 0;
    const linePlayers: string[] = [];
    
    context.players.forEach(p => {
      if (p.team === matchTeam && p.visible) {
        const isTarget = this.targetLine === 'defense' 
          ? (p.role.includes('Back') || p.role.includes('CB') || p.role.includes('LWB') || p.role.includes('RWB'))
          : (p.role.includes('Midfielder') || p.role.includes('DM') || p.role.includes('CM') || p.role.includes('LM') || p.role.includes('RM'));
          
        if (isTarget) {
          linePlayers.push(p.id);
          const current = context.getPlayerPosition(p.id, this.startTime);
          sumX += current.x;
          count++;
        }
      }
    });
    
    if (count === 0) return;
    const targetCentroidX = sumX / count;
    
    // 2. Compresses the X coordinates towards the centroid line
    linePlayers.forEach(id => {
      const current = context.getPlayerPosition(id, this.startTime);
      const dx = current.x - targetCentroidX;
      const target = {
        x: targetCentroidX + dx * this.compressionFactor,
        z: current.z
      };
      
      context.addPlayerKeyframe(id, this.startTime, current);
      context.addPlayerKeyframe(id, this.endTime, target, this.easing);
    });
  }
}

export class LineExpansion implements TacticalPrimitive {
  type = 'LineExpansion';
  constructor(
    public team: TeamType,
    public targetLine: 'defense' | 'midfield',
    public expansionFactor: number = 1.25,
    public startTime: number,
    public endTime: number,
    public easing?: 'linear' | 'quadInOut' | 'cubicInOut' | 'sineInOut'
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const compressor = new LineCompression(this.team, this.targetLine, this.expansionFactor, this.startTime, this.endTime, this.easing);
    compressor.compile(context);
  }
}

// ────────────────────────────────────────────────────────────
// SPATIAL PRIMITIVES
// ────────────────────────────────────────────────────────────

export class HighlightZone implements TacticalPrimitive {
  type = 'HighlightZone';
  constructor(
    public id: string,
    public overlayType: OverlayType,
    public options: {
      center?: TacticalPosition | string;
      radius?: number;
      bounds?: { width: number; length: number; rotation?: number };
      points?: TacticalPosition[];
    },
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.highlight,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.default
  ) {}

  compile(context: PrimitiveCompileContext): void {
    let resolvedCenter: TacticalPosition | undefined = undefined;
    if (this.options.center) {
      resolvedCenter = resolvePosition(this.options.center, context, this.startTime);
    }

    context.overlays.push({
      id: this.id,
      type: this.overlayType,
      center: resolvedCenter,
      radius: this.options.radius,
      bounds: this.options.bounds,
      points: this.options.points,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightHalfSpace implements TacticalPrimitive {
  type = 'HighlightHalfSpace';
  constructor(
    public side: 'left' | 'right',
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.compactness,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.light
  ) {}

  compile(context: PrimitiveCompileContext): void {
    // Half spaces are located around Z: -18 to -6 (left) and 6 to 18 (right) in the final third (X: 15 to 35)
    const zCenter = this.side === 'left' ? -12 : 12;
    context.overlays.push({
      id: `halfspace_${this.side}_${this.startTime}`,
      type: OverlayType.RECTANGLE,
      center: { x: 22, z: zCenter },
      bounds: { width: 12, length: 18, rotation: 0 },
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightChannel implements TacticalPrimitive {
  type = 'HighlightChannel';
  constructor(
    public channel: 'left_wing' | 'left_halfspace' | 'center' | 'right_halfspace' | 'right_wing',
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.numericalAdvantage,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.light
  ) {}

  compile(context: PrimitiveCompileContext): void {
    let zCenter = 0;
    let width = 12;
    
    if (this.channel === 'left_wing') { zCenter = -25; width = 14; }
    else if (this.channel === 'left_halfspace') { zCenter = -12; width = 12; }
    else if (this.channel === 'center') { zCenter = 0; width = 12; }
    else if (this.channel === 'right_halfspace') { zCenter = 12; width = 12; }
    else if (this.channel === 'right_wing') { zCenter = 25; width = 14; }

    context.overlays.push({
      id: `channel_${this.channel}_${this.startTime}`,
      type: OverlayType.RECTANGLE,
      center: { x: 0, z: zCenter },
      bounds: { width, length: 100, rotation: 0 },
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightDangerZone implements TacticalPrimitive {
  type = 'HighlightDangerZone';
  constructor(
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.danger,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.default
  ) {}

  compile(context: PrimitiveCompileContext): void {
    // Zone 14 is the area right in front of the box: X: 15 to 30, Z: -15 to 15
    context.overlays.push({
      id: `danger_zone_${this.startTime}`,
      type: OverlayType.RECTANGLE,
      center: { x: 22.5, z: 0 },
      bounds: { width: 28, length: 16, rotation: 0 },
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightPassingLane implements TacticalPrimitive {
  type = 'HighlightPassingLane';
  constructor(
    public fromPlayerId: string,
    public toPlayerId: string,
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.passingLane,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.default
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const from = context.getPlayerPosition(this.fromPlayerId, this.startTime);
    const to = context.getPlayerPosition(this.toPlayerId, this.startTime);
    
    // Draw polygon representing the passing corridor lane
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = -dz / dist;
    const nz = dx / dist;
    const width = 1.6;

    const points = [
      { x: from.x + nx * width, z: from.z + nz * width },
      { x: to.x + nx * width, z: to.z + nz * width },
      { x: to.x - nx * width, z: to.z - nz * width },
      { x: from.x - nx * width, z: from.z - nz * width }
    ];

    context.overlays.push({
      id: `pass_lane_${this.fromPlayerId}_${this.toPlayerId}_${this.startTime}`,
      type: OverlayType.POLYGON,
      points,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightPressingArea implements TacticalPrimitive {
  type = 'HighlightPressingArea';
  constructor(
    public center: TacticalPosition | string,
    public radius: number = 6.0,
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.pressingArea,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.default
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const resolvedCenter = resolvePosition(this.center, context, this.startTime);
    context.overlays.push({
      id: `pressing_area_${this.startTime}`,
      type: OverlayType.CIRCLE,
      center: resolvedCenter,
      radius: this.radius,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightCompactness implements TacticalPrimitive {
  type = 'HighlightCompactness';
  constructor(
    public team: TeamType,
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.compactness,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.light
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const matchTeam = this.team === 'attack' ? 'attack' : 'defend';
    
    // Dynamically calculate the bounding box of defenders and midfielders
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    context.players.forEach(p => {
      if (p.team === matchTeam && p.visible && !p.role.includes('Goalkeeper') && !p.role.includes('GK') && !p.role.includes('Striker') && !p.role.includes('Forward') && !p.role.includes('CF')) {
        const pos = context.getPlayerPosition(p.id, this.startTime);
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minZ = Math.min(minZ, pos.z);
        maxZ = Math.max(maxZ, pos.z);
      }
    });

    if (minX === Infinity) return;

    // Add padding to polygon
    minX -= 2.0; maxX += 2.0;
    minZ -= 2.0; maxZ += 2.0;

    const points = [
      { x: minX, z: minZ },
      { x: maxX, z: minZ },
      { x: maxX, z: maxZ },
      { x: minX, z: maxZ }
    ];

    context.overlays.push({
      id: `compactness_${this.team}_${this.startTime}`,
      type: OverlayType.POLYGON,
      points,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

export class HighlightNumericalAdvantage implements TacticalPrimitive {
  type = 'HighlightNumericalAdvantage';
  constructor(
    public center: TacticalPosition | string,
    public radius: number = 7.0,
    public startTime: number,
    public endTime: number,
    public color: string = PRIMITIVE_STYLE_CONFIG.colors.numericalAdvantage,
    public opacity: number = PRIMITIVE_STYLE_CONFIG.opacities.default
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const resolvedCenter = resolvePosition(this.center, context, this.startTime);
    context.overlays.push({
      id: `numerical_adv_${this.startTime}`,
      type: OverlayType.CIRCLE,
      center: resolvedCenter,
      radius: this.radius,
      startFrame: this.startTime,
      endFrame: this.endTime,
      color: this.color,
      opacity: this.opacity
    });
  }
}

// ────────────────────────────────────────────────────────────
// DECISION PRIMITIVES
// ────────────────────────────────────────────────────────────

export class DefenderFollows implements TacticalPrimitive {
  type = 'DefenderFollows';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'step_changed',
      data: { outcome: 'defender_follows', ...this.data }
    });
  }
}

export class DefenderHolds implements TacticalPrimitive {
  type = 'DefenderHolds';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'step_changed',
      data: { outcome: 'defender_holds', ...this.data }
    });
  }
}

export class PressTriggered implements TacticalPrimitive {
  type = 'PressTriggered';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'trigger_detected',
      data: { trigger_type: 'press_triggered', ...this.data }
    });
  }
}

export class TrapActivated implements TacticalPrimitive {
  type = 'TrapActivated';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'trap_activated',
      data: { trap_zone: 'sideline', ...this.data }
    });
  }
}

export class CounterAttackTriggered implements TacticalPrimitive {
  type = 'CounterAttackTriggered';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'replay_triggered',
      data: { reason: 'counter_attack_started', ...this.data }
    });
  }
}

export class PossessionWon implements TacticalPrimitive {
  type = 'PossessionWon';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'turnover_created',
      data: { possession: 'won', ...this.data }
    });
  }
}

export class PossessionLost implements TacticalPrimitive {
  type = 'PossessionLost';
  constructor(public time: number, public data: any = {}) {}

  compile(context: PrimitiveCompileContext): void {
    context.analyticsEvents.push({
      timeFraction: this.time,
      eventName: 'turnover_created',
      data: { possession: 'lost', ...this.data }
    });
  }
}

// ────────────────────────────────────────────────────────────
// ARROW PRIMITIVES
// ────────────────────────────────────────────────────────────

abstract class BaseArrowPrimitive implements TacticalPrimitive {
  abstract type: string;
  constructor(
    public id: string,
    public from: TacticalPosition | string,
    public to: TacticalPosition | string,
    public startTime: number,
    public endTime: number,
    public defaultStyle: any,
    public customStyle?: any,
    public curved: boolean = false
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const fromPos = resolvePosition(this.from, context, this.startTime);
    const toPos = resolvePosition(this.to, context, this.endTime);
    
    // Generate curved control points if requested
    let points: TacticalPosition[] | undefined = undefined;
    if (this.curved) {
      const dx = toPos.x - fromPos.x;
      const dz = toPos.z - fromPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const perpX = -dz / dist * (dist * 0.15); // Offset curve control point
      const perpZ = dx / dist * (dist * 0.15);
      
      points = [
        { ...fromPos },
        { x: fromPos.x + dx * 0.5 + perpX, z: fromPos.z + dz * 0.5 + perpZ },
        { ...toPos }
      ];
    }

    const mergedStyle = {
      ...this.defaultStyle,
      ...this.customStyle,
      curved: this.curved || this.defaultStyle.curved
    };

    context.arrows.push({
      id: this.id,
      fromPos,
      toPos,
      points,
      style: mergedStyle,
      startFrame: this.startTime,
      endFrame: this.endTime,
      currentProgress: 0.0
    });
  }
}

export class MovementArrow extends BaseArrowPrimitive {
  type = 'MovementArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = false
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.movement, customStyle, curved);
  }
}

export class PassingArrow extends BaseArrowPrimitive {
  type = 'PassingArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = false
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.passing, customStyle, curved);
  }
}

export class PressingArrow extends BaseArrowPrimitive {
  type = 'PressingArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = false
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.pressing, customStyle, curved);
  }
}

export class RotationArrow extends BaseArrowPrimitive {
  type = 'RotationArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = true
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.rotation, customStyle, curved);
  }
}

export class SupportArrow extends BaseArrowPrimitive {
  type = 'SupportArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = false
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.support, customStyle, curved);
  }
}

export class CounterArrow extends BaseArrowPrimitive {
  type = 'CounterArrow';
  constructor(
    id: string,
    from: TacticalPosition | string,
    to: TacticalPosition | string,
    startTime: number,
    endTime: number,
    customStyle?: any,
    curved: boolean = false
  ) {
    super(id, from, to, startTime, endTime, PRIMITIVE_STYLE_CONFIG.arrows.counter, customStyle, curved);
  }
}

// ────────────────────────────────────────────────────────────
// BALL MOVEMENT PRIMITIVES
// ────────────────────────────────────────────────────────────

export class PassBall implements TacticalPrimitive {
  type = 'PassBall';
  constructor(
    public fromPlayerId: string,
    public toPlayerId: string | TacticalPosition,
    public startTime: number,
    public endTime: number
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const startPos = context.getPlayerPosition(this.fromPlayerId, this.startTime);
    const endPos = resolvePosition(this.toPlayerId, context, this.endTime);
    
    // Add ball keyframes
    context.ballKeyFrames.push({ time: this.startTime, x: startPos.x, z: startPos.z });
    context.ballKeyFrames.push({ time: this.endTime, x: endPos.x, z: endPos.z });
    
    // If it's the first ball action, define startPos
    if (context.ballKeyFrames.length === 2 && context.ballKeyFrames[0].time === this.startTime) {
      context.ballStartPos = { ...startPos };
    }
  }
}

export class DribbleBall implements TacticalPrimitive {
  type = 'DribbleBall';
  constructor(
    public playerId: string,
    public startTime: number,
    public endTime: number
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const player = context.players.get(this.playerId);
    if (!player) return;
    
    // Pull player keyframes inside dribble range and replicate them to ball
    const sorted = [...player.keyFrames].sort((a, b) => a.time - b.time);
    
    // Fill/Lock start position of dribble
    const startPos = context.getPlayerPosition(this.playerId, this.startTime);
    context.ballKeyFrames.push({ time: this.startTime, x: startPos.x, z: startPos.z });
    if (context.ballKeyFrames.length === 1) {
      context.ballStartPos = { ...startPos };
    }
    
    sorted.forEach(kf => {
      if (kf.time > this.startTime && kf.time < this.endTime) {
        context.ballKeyFrames.push({ time: kf.time, x: kf.x, z: kf.z });
      }
    });

    const endPos = context.getPlayerPosition(this.playerId, this.endTime);
    context.ballKeyFrames.push({ time: this.endTime, x: endPos.x, z: endPos.z });
  }
}

export class SetBallPosition implements TacticalPrimitive {
  type = 'SetBallPosition';
  constructor(
    public pos: TacticalPosition | string,
    public startTime: number
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const resolved = resolvePosition(this.pos, context, this.startTime);
    context.ballKeyFrames.push({ time: this.startTime, x: resolved.x, z: resolved.z });
    if (this.startTime === 0.0 || context.ballKeyFrames.length === 1) {
      context.ballStartPos = { ...resolved };
    }
  }
}

// ────────────────────────────────────────────────────────────
// TIMELINE PRIMITIVES (SEQUENCING)
// ────────────────────────────────────────────────────────────

export class Sequence implements TacticalPrimitive {
  type = 'Sequence';
  constructor(public children: TacticalPrimitive[]) {}

  compile(context: PrimitiveCompileContext): void {
    // Simply compile children in sequence (they define their own absolute start/end times)
    this.children.forEach(child => child.compile(context));
  }
}

export class ParallelSequence implements TacticalPrimitive {
  type = 'ParallelSequence';
  constructor(public children: TacticalPrimitive[]) {}

  compile(context: PrimitiveCompileContext): void {
    this.children.forEach(child => child.compile(context));
  }
}

export class ConditionalSequence implements TacticalPrimitive {
  type = 'ConditionalSequence';
  constructor(public branch: 'A' | 'B', public children: TacticalPrimitive[]) {}

  compile(context: PrimitiveCompileContext): void {
    if (context.activeBranch === this.branch) {
      this.children.forEach(child => child.compile(context));
    }
  }
}

export class Delay implements TacticalPrimitive {
  type = 'Delay';
  constructor(public duration: number, public child: TacticalPrimitive) {}

  compile(context: PrimitiveCompileContext): void {
    // Delays timing - in our framework, primitives define absolute times.
    // If needed, the compiler could offset times, but since primitives are configured
    // with explicit start/end fractions, Delay acts as a structural separator.
    this.child.compile(context);
  }
}

export class Repeat implements TacticalPrimitive {
  type = 'Repeat';
  constructor(public times: number, public child: TacticalPrimitive) {}

  compile(context: PrimitiveCompileContext): void {
    for (let i = 0; i < this.times; i++) {
      this.child.compile(context);
    }
  }
}

export class Branch implements TacticalPrimitive {
  type = 'Branch';
  constructor(
    public branches: {
      A: TacticalPrimitive[];
      B: TacticalPrimitive[];
    }
  ) {}

  compile(context: PrimitiveCompileContext): void {
    if (context.activeBranch === 'A') {
      this.branches.A.forEach(child => child.compile(context));
    } else {
      this.branches.B.forEach(child => child.compile(context));
    }
  }
}
