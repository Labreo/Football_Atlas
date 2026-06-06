import { VisualLanguageRegistry } from '../visualLanguage/VisualLanguageRegistry';
import { TacticalEventType } from '../visualLanguage/types';

export const PRIMITIVE_STYLE_CONFIG = {
  colors: {
    attack: '#1D4ED8', // Royal Blue
    defend: '#DC2626', // Crimson Red
    get highlight() { return VisualLanguageRegistry.getSignature(TacticalEventType.MOVEMENT_RUN).arrow?.color ?? '#39FF14'; },
    get danger() { return VisualLanguageRegistry.getSignature(TacticalEventType.PRESSING_TRAP).overlay?.color ?? '#FF0055'; },
    get numericalAdvantage() { return VisualLanguageRegistry.getSignature(TacticalEventType.MIDFIELD_OVERLOAD).overlay?.color ?? '#00F3FF'; },
    get passingLane() { return VisualLanguageRegistry.getSignature(TacticalEventType.PASSING_LANE).arrow?.color ?? '#00F3FF'; },
    get pressingArea() { return VisualLanguageRegistry.getSignature(TacticalEventType.PRESS_TRIGGER).overlay?.color ?? '#DC2626'; },
    get compactness() { return VisualLanguageRegistry.getSignature(TacticalEventType.DEFENSIVE_COMPACTNESS).overlay?.color ?? '#FFCC00'; },
  },
  opacities: {
    default: 0.2,
    light: 0.15,
    heavy: 0.25,
  },
  arrows: {
    get movement() {
      const sig = VisualLanguageRegistry.getSignature(TacticalEventType.MOVEMENT_RUN);
      return {
        color: sig.arrow?.color ?? '#39FF14',
        width: sig.arrow?.width ?? 3,
        dashSpeed: sig.arrow?.dashSpeed ?? 1.0,
        dashSize: sig.arrow?.dashSize ?? 1.5,
        gapSize: sig.arrow?.gapSize ?? 1.0,
      };
    },
    get passing() {
      const sig = VisualLanguageRegistry.getSignature(TacticalEventType.PASSING_LANE);
      return {
        color: sig.arrow?.color ?? '#00F3FF',
        width: sig.arrow?.width ?? 2.5,
        dashSpeed: sig.arrow?.dashSpeed ?? 0.0,
      };
    },
    get pressing() {
      const sig = VisualLanguageRegistry.getSignature(TacticalEventType.PRESSING_TRAP);
      return {
        color: sig.arrow?.color ?? '#DC2626',
        width: sig.arrow?.width ?? 2,
        dashSpeed: sig.arrow?.dashSpeed ?? 1.2,
        dashSize: sig.arrow?.dashSize ?? 1.0,
        gapSize: sig.arrow?.gapSize ?? 1.0,
      };
    },
    get rotation() {
      return {
        color: '#FFCC00',
        width: 2.5,
        curved: true,
      };
    },
    get support() {
      const sig = VisualLanguageRegistry.getSignature(TacticalEventType.SPACE_EXPLOITATION);
      return {
        color: sig.arrow?.color ?? '#39FF14',
        width: sig.arrow?.width ?? 2.5,
        dashSpeed: 0.8,
      };
    },
    get counter() {
      const sig = VisualLanguageRegistry.getSignature(TacticalEventType.COUNTER_ATTACK_TRIGGER);
      return {
        color: sig.arrow?.color ?? '#00F3FF',
        width: sig.arrow?.width ?? 3,
        dashSpeed: 1.5,
      };
    },
  },
};
