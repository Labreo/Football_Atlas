# Tactical Visual Language System (TVLS) — Guide & Reference

The Tactical Visual Language System (TVLS) defines the canonical visual design specifications, color schemes, animations, and non-color accessibility fallbacks used platform-wide in Football Atlas.

---

## 1. Universal Event Registry

All animations, overlays, and classroom lessons MUST resolve styles through the central `VisualLanguageRegistry`. No hardcoded hex values or ad-hoc custom arrow/overlay classes are permitted.

### Event Type Visual Reference Table

| Event Type | Visual Mode | Primary Color | Motion Profile | Accessibility Pattern |
|---|---|---|---|---|
| `PRESS_TRIGGER` | Pulse ring overlay | `#EF4444` (Red) | 3 concentric rings, 420ms interval | concentric-rings |
| `PASSING_LANE` | corridor overlay + line | `#00F3FF` (Cyan) | 300ms fade-in | parallel-corridor |
| `MOVEMENT_RUN` | Dashed curve arrow | `#39FF14` (Green) | Flowing dashed curve | dashed-curve |
| `THIRD_MAN_RUN` | Multi-stage path | Red / Amber / Green | Sequential phase reveal | three-segment-path |
| `ZONE_OCCUPATION` | Heat area highlight | `#8B5CF6` (Purple) | Slow breathing cycle (800ms) | breathing-heat-area |
| `MIDFIELD_OVERLOAD` | Expanding heat area | `#F59E0B` (Amber) | Radial expansion from center | expanding-amber-zone |
| `DEFENSIVE_COMPACTNESS` | Squeezing overlay band | `#FFCC00` (Yellow) | Inward bilateral compression | narrowing-band |
| `DEFENSIVE_LINE_DROP` | Drop-back overlay bar | `#6366F1` (Indigo) | Synchronized line retreat | synchronized-horizontal-line |
| `PRESSING_TRAP` | Converging arrow vectors | `#DC2626` (Crimson) | Simultaneously inward convergence | inward-converging-arrows |
| `COUNTER_ATTACK_TRIGGER` | Radial flash burst | `#10B981` (Green) | Fast 150ms flash | instant-flash-burst |
| `TRANSITION_MOMENT` | Halved pitch overlay | Indigo / Green | Bilateral field state split | split-field-halves |
| `SPACE_CREATION` | Shimmering empty zone | `#FDE68A` (Gold) | Shimmer shimmer cycle (1.2s) | shimmering-empty-zone |
| `SPACE_EXPLOITATION` | Target path arrow | `#10B981` (Green) | Transform to solid attack arrow | glow-to-solid-path |

---

## 2. Historical Visual Theme

When the platform switches to **Historical Mode**, the registry adapts visual representations to match historical footage aesthetics while maintaining cognitive clarity.

*   **Sepia Gold Tint**: A warm gold tint (`#C8A96E`) is blended over all highlights.
*   **Grayscale Desaturation**: Overlay and arrow color saturations are reduced by 35% to mimic period-accurate television broadcasts.
*   **Opacity Scaling**: Overlays are scaled to `68%` and arrows to `72%` opacity to feel less "live" and more "analytical".
*   **Watermarked Badges**: A "REAL MATCH" badge is displayed alongside serif typography annotations.

---

## 3. Accessibility & Non-Color Distinguishers

To accommodate color-blind users (deuteranopia, protanopia, tritanopia) and screen-readers:

1.  **Rhythm and Timing**: Fast pulses, instant flashes, and slow breathing cycles distinguish actions regardless of color visibility.
2.  **Unique Geometry Patterns**: Every event type maps to a distinct geometry footprint (concentric rings, parallel corridors, converging spikes).
3.  **Alternative Line Styles**: In color-blind fallback mode, arrows map to distinct line styles: `solid`, `dashed`, `dotted`, and `dash-dot`.

---

## 4. How to Extend: Adding a New Event Type

To register a 14th tactical event type:

1.  **Types**: Add your event name to the `TacticalEventType` enum in `types.ts`.
2.  **Signature Definition**: Define its canonical color, shape, motion, and accessibility descriptors in `EventSignatureLibrary.ts`.
3.  **Verification**: Re-run the automated test suite to ensure the new signature is valid, unique, and has historical modes defined:
    ```bash
    npm run test:visual-language
    ```
