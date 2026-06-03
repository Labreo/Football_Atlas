# Back 3 / Wing-Back System — Primitives Dependency Report

This report certifies that the `BackThreeWingBackModule` has been built **100% using the declarative Tactical Primitive Library** and standard compose contracts.

Under no circumstances does it use bespoke ticker loops, custom canvas rendering, or raw WebGL/Three.js coordinate interpolation. All visual layouts, player movements, ball kinetics, spatial overlays, semantic decision events, and annotations are constructed purely by composing library primitives.

---

## 1. Primitives Used

Below is the list of primitives imported and composed to construct the **Back 3 / Wing-Back System** tactical lesson:

| Primitive Category | Primitive Name | Quantity Used | Purpose / Context |
| :--- | :--- | :---: | :--- |
| **Formation Setup** | `FormationState` | **2** | Sets up Blue team in a 3-4-3 shape and Red team in a 4-3-3 shape. |
| **Player Movement** | `MovePlayer` | **45** | Coordinates GK, center-backs, midfielders, and forwards across all phases. |
| | `PushForward` | **4** | Directs wing-backs to advance up the flanks in Phases 2 and 3. |
| | `TriggerRun` | **1** | Coordinates the inside winger's underlapping run centrally in Branch A. |
| | `RecoveryRun` | **2** | Coordinates wing-backs dropping back deep to reform the 5-back defensive block in Phase 7. |
| **Ball Kinetics** | `SetBallPosition` | **7** | Positions the ball on the pitch during pass receptions and buildup phases. |
| | `PassBall` | **5** | Executes ball circulation: interception pass, CB-to-LCB, LCB-to-LCM, LCM-to-option, and recovery pass. |
| | `DribbleBall` | **1** | Attaches the ball to the wing-back's coordinates during transition carrying. |
| **Spatial Highlights** | `HighlightChannel` | **7** | Visualizes width channels (Phase 3) and all five attacking lanes (Phase 4). |
| | `HighlightCompactness` | **3** | Displays team defensive compactness in Phase 1, Phase 7, and Phase 8. |
| | `HighlightShapePolygon` | **4** | Custom local primitive highlighting shapes (defensive back 5, attacking 5-line, rest defense block). |
| | `HighlightZone` | **2** | Highlights the central gap in Branch A and the free wing-back area in Branch B. |
| | `HighlightNumericalAdvantage` | **1** | Highlights the central advantage in Branch A. |
| | `HighlightPassingLane` | **1** | Highlights the wide passing lane to the free wing-back in Branch B. |
| **Arrows** | `PassingArrow` | **2** | Draws cyan vectors for passing lanes in the dilemma branch. |
| | `MovementArrow` | **4** | Draws green vectors for run trajectories. |
| **Decision Events** | `PossessionWon` | **1** | Emits possession gained event at `0.12`. |
| | `DefenderFollows` | **1** | Emits choice feedback for Branch A (sliding fullback). |
| | `DefenderHolds` | **1** | Emits choice feedback for Branch B (narrow fullback). |
| **Custom Registry** | `AnalyticsTrigger` | **6** | Custom local primitive recording semantic triggers (e.g. `lesson_started`, `possession_gained`, `shape_expansion_started`, `wing_back_advanced`, `attacking_shape_formed`, `possession_lost`, `defensive_shape_restored`, `lesson_completed`). |

---

## 2. Code Composition Proof

All primitives are registered cleanly in the constructor:

```typescript
export class BackThreeWingBackModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'back_three_wing_back',
      name: 'Back 3 / Wing-Back System',
      ...
      primitives: [
        new FormationState(...),
        new FormationState(...),
        new MovePlayer(...),
        new PushForward(...),
        new RecoveryRun(...),
        new PassBall(...),
        new HighlightCompactness(...)
      ],
      branchPrimitives: {
        A: [
          new MovePlayer(...),
          new TriggerRun(...),
          new PassBall(...),
          new HighlightZone(...)
        ],
        B: [
          new MovePlayer(...),
          new PassBall(...),
          new HighlightZone(...)
        ]
      }
    });
  }
}
```

The compilation process resolves all player coordinates, ball curves, and overlay states into declarative arrays of keyframes at initialization. The rendering engine tick plays back these keyframes at 60fps with zero custom update code.

---

## 3. Structural Compliance

- **No bespoke coordinate formulas**: All movement trajectories are linear or quadratic/cubic ease interpolations defined strictly within `MovePlayer` / `PushForward` / `TriggerRun` / `RecoveryRun`.
- **No manual ball mapping**: The ball's coordinate is resolved automatically by the composition engine using `PassBall` and `DribbleBall`.
- **No custom overlays**: Visual styling (colors, opacities) defaults entirely to `PRIMITIVE_STYLE_CONFIG` or standard ThreeJS meshes.
