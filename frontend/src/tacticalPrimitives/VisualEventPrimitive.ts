import { TacticalPrimitive, PrimitiveCompileContext } from './types';
import { TacticalEventType, VisualMode } from '../visualLanguage/types';
import { VisualLanguageRegistry } from '../visualLanguage/VisualLanguageRegistry';
import { TacticalPosition } from '../tacticalEngine/types';

export class VisualEventPrimitive implements TacticalPrimitive {
  type = 'VisualEventPrimitive';
  
  constructor(
    public id: string,
    public eventType: TacticalEventType,
    public startTime: number,
    public endTime: number,
    public options: {
      from?: TacticalPosition | string;
      to?: TacticalPosition | string;
      center?: TacticalPosition | string;
      radius?: number;
      bounds?: { width: number; length: number; rotation?: number };
      points?: TacticalPosition[];
      curved?: boolean;
      visualMode?: VisualMode;
    } = {}
  ) {}

  compile(context: PrimitiveCompileContext): void {
    const mode = this.options.visualMode || (context as any).visualMode || 'concept';
    const signature = VisualLanguageRegistry.getSignature(this.eventType, mode);

    const resolvePosition = (val: string | TacticalPosition | undefined, time: number): TacticalPosition | undefined => {
      if (!val) return undefined;
      if (typeof val === 'string') {
        return context.getPlayerPosition(val, time);
      }
      return val;
    };

    const fromPos = resolvePosition(this.options.from, this.startTime);
    const toPos = resolvePosition(this.options.to, this.endTime);
    const centerPos = resolvePosition(this.options.center, this.startTime);

    // 1. If signature has arrow style, add to arrows
    if (signature.arrow) {
      if (fromPos && toPos) {
        let points: TacticalPosition[] | undefined = undefined;
        const isCurved = this.options.curved || signature.arrow.curved;
        if (isCurved) {
          const dx = toPos.x - fromPos.x;
          const dz = toPos.z - fromPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          const perpX = -dz / dist * (dist * 0.15);
          const perpZ = dx / dist * (dist * 0.15);
          points = [
            { ...fromPos },
            { x: fromPos.x + dx * 0.5 + perpX, z: fromPos.z + dz * 0.5 + perpZ },
            { ...toPos }
          ];
        }

        context.arrows.push({
          id: `${this.id}_arrow`,
          fromPos,
          toPos,
          points,
          style: {
            color: signature.arrow.color,
            width: signature.arrow.width,
            dashSpeed: signature.arrow.dashSpeed,
            dashSize: signature.arrow.dashSize,
            gapSize: signature.arrow.gapSize,
            curved: isCurved,
          },
          startFrame: this.startTime,
          endFrame: this.endTime,
          currentProgress: 0.0,
          eventType: this.eventType,
        });
      }
    }

    // 2. If signature has stages (like THIRD_MAN_RUN), render sequential stages
    if (signature.stages && signature.stages.length > 0 && fromPos && toPos) {
      const totalDuration = this.endTime - this.startTime;
      let currentStart = this.startTime;
      
      signature.stages.forEach((stage, idx) => {
        const stageDuration = totalDuration * stage.durationFraction;
        const currentEnd = currentStart + stageDuration;
        
        const startFraction = (currentStart - this.startTime) / totalDuration;
        const endFraction = (currentEnd - this.startTime) / totalDuration;
        
        const stageFrom = {
          x: fromPos.x + (toPos.x - fromPos.x) * startFraction,
          z: fromPos.z + (toPos.z - fromPos.z) * startFraction
        };
        const stageTo = {
          x: fromPos.x + (toPos.x - fromPos.x) * endFraction,
          z: fromPos.z + (toPos.z - fromPos.z) * endFraction
        };

        const isCurved = this.options.curved || stage.arrowStyle.curved;
        let points: TacticalPosition[] | undefined = undefined;
        if (isCurved) {
          const dx = stageTo.x - stageFrom.x;
          const dz = stageTo.z - stageFrom.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 1;
          const perpX = -dz / dist * (dist * 0.15);
          const perpZ = dx / dist * (dist * 0.15);
          points = [
            { ...stageFrom },
            { x: stageFrom.x + dx * 0.5 + perpX, z: stageFrom.z + dz * 0.5 + perpZ },
            { ...stageTo }
          ];
        }

        context.arrows.push({
          id: `${this.id}_stage_${idx}`,
          fromPos: stageFrom,
          toPos: stageTo,
          points,
          style: {
            color: stage.arrowStyle.color,
            width: stage.arrowStyle.width,
            dashSpeed: stage.arrowStyle.dashSpeed,
            dashSize: stage.arrowStyle.dashSize,
            gapSize: stage.arrowStyle.gapSize,
            curved: isCurved,
          },
          startFrame: currentStart,
          endFrame: currentEnd,
          currentProgress: 0.0,
          eventType: this.eventType,
        });

        currentStart = currentEnd;
      });
    }

    // 3. If signature has overlay, add to overlays
    if (signature.overlay) {
      context.overlays.push({
        id: `${this.id}_overlay`,
        type: signature.overlay.mode as any,
        center: centerPos || fromPos,
        radius: this.options.radius,
        bounds: this.options.bounds,
        points: this.options.points,
        startFrame: this.startTime,
        endFrame: this.endTime,
        color: signature.overlay.color,
        colorSecondary: signature.overlay.colorSecondary,
        opacity: signature.overlay.opacity,
        eventType: this.eventType,
        pulseCount: signature.overlay.pulseCount,
        pulsePeriodMs: signature.overlay.pulsePeriodMs,
        squeezeAxis: signature.overlay.squeezeAxis,
        flashDurationMs: signature.overlay.flashDurationMs,
      });
    }
  }
}
