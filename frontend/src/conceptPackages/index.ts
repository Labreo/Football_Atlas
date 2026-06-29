import { ConceptPackage } from '@football-atlas/shared';
import { false9Package } from './false9.package';
import { highPressPackage } from './highPress.package';
import { defensiveBlockPackage } from './defensiveBlock.package';
import { pressingTrapPackage } from './pressingTrap.package';
import { midfieldOverloadPackage } from './midfieldOverload.package';
import { counterAttackTriggerPackage } from './counterAttackTrigger.package';
import { invertedWingerPackage } from './invertedWinger.package';
import { backThreeWingBackPackage } from './backThreeWingBack.package';
import { thirdManRunPackage } from './thirdManRun.package';
import { compactnessPressingLinesPackage } from './compactnessPressingLines.package';
import { argentinaFrance2022Package } from './argentinaFrance2022.package';
import { gegenpressingPackage } from './gegenpressing.package';
import { restDefensePackage } from './restDefense.package';
import { positionalPlayPackage } from './positionalPlay.package';
import { boxMidfieldPackage } from './boxMidfield.package';
import { overlappingRunsPackage } from './overlappingRuns.package';
import { overloadingToIsolatePackage } from './overloadingToIsolate.package';
import { halfSpaceExploitationPackage } from './halfSpaceExploitation.package';
import { verticalTikiTakaPackage } from './verticalTikiTaka.package';
import { shadowStrikerPackage } from './shadowStriker.package';
import { pressingTriggersPackage } from './pressingTriggers.package';
import { midfieldRotationPackage } from './midfieldRotation.package';
import { sweeperKeeperPackage } from './sweeperKeeper.package';
import { defensiveTransitionsPackage } from './defensiveTransitions.package';
import { invertedFullbacksPackage } from './invertedFullbacks.package';

// ────────────────────────────────────────────────────────────
// ALL CONCEPT PACKAGES
// The single entry point for the ConceptLoader.
//
// To add a new concept:
//   1. Create a new file: myConceptName.package.ts
//   2. Export a ConceptPackage object
//   3. Import it here and add it to the array below
//   4. Also export it at the bottom
// ────────────────────────────────────────────────────────────

export const allConceptPackages: ConceptPackage[] = [
  false9Package,
  highPressPackage,
  defensiveBlockPackage,
  pressingTrapPackage,
  midfieldOverloadPackage,
  counterAttackTriggerPackage,
  invertedWingerPackage,
  backThreeWingBackPackage,
  thirdManRunPackage,
  compactnessPressingLinesPackage,
  argentinaFrance2022Package,
  gegenpressingPackage,
  restDefensePackage,
  positionalPlayPackage,
  boxMidfieldPackage,
  overlappingRunsPackage,
  overloadingToIsolatePackage,
  halfSpaceExploitationPackage,
  verticalTikiTakaPackage,
  shadowStrikerPackage,
  pressingTriggersPackage,
  midfieldRotationPackage,
  sweeperKeeperPackage,
  defensiveTransitionsPackage,
  invertedFullbacksPackage,
];

// Re-export individual packages for direct access
export { false9Package } from './false9.package';
export { highPressPackage } from './highPress.package';
export { defensiveBlockPackage } from './defensiveBlock.package';
export { pressingTrapPackage } from './pressingTrap.package';
export { midfieldOverloadPackage } from './midfieldOverload.package';
export { counterAttackTriggerPackage } from './counterAttackTrigger.package';
export { invertedWingerPackage } from './invertedWinger.package';
export { backThreeWingBackPackage } from './backThreeWingBack.package';
export { thirdManRunPackage } from './thirdManRun.package';
export { compactnessPressingLinesPackage } from './compactnessPressingLines.package';
export { argentinaFrance2022Package } from './argentinaFrance2022.package';
export { gegenpressingPackage } from './gegenpressing.package';
export { restDefensePackage } from './restDefense.package';
export { positionalPlayPackage } from './positionalPlay.package';
export { boxMidfieldPackage } from './boxMidfield.package';
export { overlappingRunsPackage } from './overlappingRuns.package';
export { overloadingToIsolatePackage } from './overloadingToIsolate.package';
export { halfSpaceExploitationPackage } from './halfSpaceExploitation.package';
export { verticalTikiTakaPackage } from './verticalTikiTaka.package';
export { shadowStrikerPackage } from './shadowStriker.package';
export { pressingTriggersPackage } from './pressingTriggers.package';
export { midfieldRotationPackage } from './midfieldRotation.package';
export { sweeperKeeperPackage } from './sweeperKeeper.package';
export { defensiveTransitionsPackage } from './defensiveTransitions.package';
export { invertedFullbacksPackage } from './invertedFullbacks.package';
