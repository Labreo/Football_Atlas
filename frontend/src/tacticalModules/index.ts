import { TacticalAnimation } from './base';
import { false9Animation } from './false9';
import { highPressAnimation } from './highPress';
import { pressingTrapAnimation } from './pressingTrap';

export * from './base';
export { false9Animation } from './false9';
export { highPressAnimation } from './highPress';
export { pressingTrapAnimation } from './pressingTrap';

export const animationRegistry: Record<string, TacticalAnimation> = {
  false9: false9Animation,
  highPress: highPressAnimation,
  pressingTrap: pressingTrapAnimation
};
