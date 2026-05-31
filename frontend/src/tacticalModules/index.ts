import { TacticalAnimation } from './base';
import { false9Animation } from './false9';
import { highPressAnimation } from './highPress';

export * from './base';
export { false9Animation } from './false9';
export { highPressAnimation } from './highPress';

export const animationRegistry: Record<string, TacticalAnimation> = {
  false9: false9Animation,
  highPress: highPressAnimation
};
