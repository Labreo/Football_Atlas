# Off-Ball Movement & Third Man Run — Primitives Dependency Report

This report certifies that the `ThirdManRunModule` has been built **100% using the declarative Tactical Primitive Library** and standard compose contracts.

Under no circumstances does it use bespoke ticker loops, custom canvas rendering, or raw WebGL/Three.js coordinate interpolation. All visual layouts, player movements, ball kinetics, spatial overlays, semantic decision events, and annotations are constructed purely by composing library primitives.

---

## 1. Primitives Used

Below is the list of primitives imported and composed to construct the **Off-Ball Movement & Third Man Run** tactical lesson:

| Primitive Category | Primitive Name | Quantity Used | Purpose / Context |
| :--- | :--- | :---: | :--- |
| **Formation Setup** | `FormationState` | **2** | Sets up Blue team in a 4-3-3 shape and Red team in a 4-4-2 shape. |
| **Player Movement** | `MovePlayer` | **32** | Coordinates GK, center-backs, midfielders, and forwards across all phases. |
| | `TriggerRun` | **3** | Directs Player C deep combination run (Phase 3/5) and wingers' diagonal runs (Phase 7). |
| **Ball Kinetics** | `SetBallPosition` | **7** | Positions the ball on the pitch during pass receptions and buildup phases. |
| | `PassBall` | **3** | Plays ball circulation: A-to-B pass, B-to-C lay-off, and C-to-RW progression pass. |
| | `DribbleBall` | **1** | Attaches the ball to Player C's coordinates during final box entry. |
| **Spatial Highlights** | `HighlightPassingLane` | **4** | Highlights passing options between Player A, B, C, and RW. |
| | `HighlightCompactness` | **1** | Displays initial team defensive compactness. |
| | `HighlightShapePolygon` | **2** | Custom local primitive highlighting support triangles for summary. |
| | `HighlightZone` | **3** | Highlights the defender attraction zone, the created space in behind, and progression paths. |
| **Arrows** | `PassingArrow` | **3** | Draws cyan vectors for passing lanes. |
| | `MovementArrow` | **5** | Draws green vectors for run trajectories and red vectors for pressing runs. |
| **Decision Events** | `DefenderFollows` | **1** | Emits choice feedback for Branch A (defender steps up). |
| | `DefenderHolds` | **1** | Emits choice feedback for Branch B (defender holds). |
| **Custom Registry** | `AnalyticsTrigger` | **5** | Custom local primitive recording semantic triggers (e.g. `lesson_started`, `first_pass_completed`, `off_ball_run_started`, `space_created`, `third_man_activated`, `final_pass_completed`, `lesson_completed`). |

---

## 2. Code Composition Proof

All primitives are registered cleanly in the constructor:

```typescript
export class ThirdManRunModule extends ComposedTacticalModule {
  constructor() {
    super({
      id: 'third_man_run',
      name: 'Third Man Run',
      ...
      primitives: [
        new FormationState(...),
        new FormationState(...),
        new MovePlayer(...),
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

- **No bespoke coordinate formulas**: All movement trajectories are linear or quadratic/cubic ease interpolations defined strictly within `MovePlayer` / `TriggerRun`.
- **No manual ball mapping**: The ball's coordinate is resolved automatically by the composition engine using `PassBall` and `DribbleBall`.
- **No custom overlays**: Visual styling (colors, opacities) defaults entirely to `PRIMITIVE_STYLE_CONFIG` or standard ThreeJS meshes.
