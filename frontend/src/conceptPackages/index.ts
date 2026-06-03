import { ConceptPackage } from '@football-atlas/shared';
import { false9Package } from './false9.package';
import { highPressPackage } from './highPress.package';
import { defensiveBlockPackage } from './defensiveBlock.package';
import { pressingTrapPackage } from './pressingTrap.package';
import { midfieldOverloadPackage } from './midfieldOverload.package';
import { counterAttackPackage } from './counterAttack.package';
import { counterAttackTriggerPackage } from './counterAttackTrigger.package';

// ────────────────────────────────────────────────────────────
// ALL CONCEPT PACKAGES
// The single entry point for the ConceptLoader.
//
// To add a new concept:
//   1. Create a new file: myConceptName.package.ts
//   2. Export a ConceptPackage object
//   3. Import it here and add it to the array below
// ────────────────────────────────────────────────────────────

export const allConceptPackages: ConceptPackage[] = [
  false9Package,
  highPressPackage,
  defensiveBlockPackage,
  pressingTrapPackage,
  midfieldOverloadPackage,
  counterAttackPackage,
  counterAttackTriggerPackage,
];

// Re-export individual packages for direct access
export { false9Package } from './false9.package';
export { highPressPackage } from './highPress.package';
export { defensiveBlockPackage } from './defensiveBlock.package';
export { pressingTrapPackage } from './pressingTrap.package';
export { midfieldOverloadPackage } from './midfieldOverload.package';
export { counterAttackPackage } from './counterAttack.package';
export { counterAttackTriggerPackage } from './counterAttackTrigger.package';
