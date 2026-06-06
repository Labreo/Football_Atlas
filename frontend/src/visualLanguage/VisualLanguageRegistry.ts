/**
 * Tactical Visual Language System — Visual Language Registry
 *
 * Singleton registry that maps every tactical event type to its canonical
 * visual signature. All modules, primitives, and components call this registry.
 * No custom inline implementations are permitted.
 *
 * Usage:
 *   const sig = VisualLanguageRegistry.getSignature(TacticalEventType.PRESS_TRIGGER);
 *   const historicalSig = VisualLanguageRegistry.getSignature(TacticalEventType.PRESS_TRIGGER, 'historical');
 */

import {
  TacticalEventType,
  EventSignature,
  HistoricalTheme,
  ArrowSignature,
  OverlaySignature,
  VisualMode,
} from './types';
import { ArrowState, OverlayState } from '../tacticalEngine/types';

import { HISTORICAL_THEME } from './HistoricalVisualTheme';
import { EVENT_SIGNATURE_LIBRARY } from './EventSignatureLibrary';


// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY CLASS
// ─────────────────────────────────────────────────────────────────────────────

class VisualLanguageRegistryImpl {
  private signatures: Map<TacticalEventType, EventSignature> = new Map();
  private historicalTheme: HistoricalTheme = HISTORICAL_THEME;
  private registrationLog: Array<{ eventType: TacticalEventType; timestamp: number }> = [];

  constructor() {
    this.bootstrap();
  }

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  private bootstrap(): void {
    Object.values(TacticalEventType).forEach((eventType) => {
      const sig = EVENT_SIGNATURE_LIBRARY[eventType as TacticalEventType];
      if (sig) {
        this.signatures.set(eventType as TacticalEventType, sig);
        this.registrationLog.push({ eventType: eventType as TacticalEventType, timestamp: Date.now() });
      } else {
        console.error(`[VisualLanguageRegistry] Missing signature for: ${eventType}`);
      }
    });

    console.log(
      `[VisualLanguageRegistry] ✅ ${this.signatures.size}/13 event signatures registered.`
    );
  }

  // ─── Core API ───────────────────────────────────────────────────────────────

  /**
   * Returns the canonical EventSignature for a given event type.
   * When mode is 'historical', applies the Historical Theme modifications
   * to arrow and overlay styles before returning.
   */
  public getSignature(eventType: TacticalEventType, mode: VisualMode = 'concept'): EventSignature {
    const sig = this.signatures.get(eventType);
    if (!sig) {
      console.warn(`[VisualLanguageRegistry] Unknown event type: ${eventType}. Falling back to MOVEMENT_RUN.`);
      return this.signatures.get(TacticalEventType.MOVEMENT_RUN)!;
    }

    if (mode === 'historical' && sig.hasHistoricalVariant) {
      return this.applyHistoricalTheme(sig);
    }

    return sig;
  }

  /**
   * Returns the canonical arrow style for an event type.
   * Convenience shorthand for primitives that only need arrow config.
   */
  public getArrowStyle(eventType: TacticalEventType, mode: VisualMode = 'concept'): ArrowSignature {
    const sig = this.getSignature(eventType, mode);
    if (!sig.arrow) {
      // Synthesize a default arrow from overlay color if no arrow is defined
      const color = sig.overlay?.color ?? '#FFFFFF';
      return {
        color,
        width: 2.5,
        dashed: false,
        opacity: 0.85,
      };
    }
    return sig.arrow;
  }

  /**
   * Returns the canonical overlay style for an event type.
   */
  public getOverlayStyle(eventType: TacticalEventType, mode: VisualMode = 'concept'): OverlaySignature | undefined {
    return this.getSignature(eventType, mode).overlay;
  }

  /**
   * Returns the Historical Visual Theme definition.
   */
  public getHistoricalTheme(): HistoricalTheme {
    return this.historicalTheme;
  }

  /**
   * Allows runtime extension — registers a new event type signature.
   * Designed for the platform scaling beyond 100 concepts.
   * Will log a warning if overwriting an existing signature.
   */
  public register(eventType: TacticalEventType, signature: EventSignature): void {
    if (this.signatures.has(eventType)) {
      console.warn(`[VisualLanguageRegistry] Overwriting existing signature for: ${eventType}`);
    }
    this.signatures.set(eventType, signature);
    this.registrationLog.push({ eventType, timestamp: Date.now() });
  }

  /**
   * Returns all registered event types (for guide rendering, testing, etc.)
   */
  public getAllEventTypes(): TacticalEventType[] {
    return Array.from(this.signatures.keys());
  }

  /**
   * Returns all registered signatures (for guide rendering, testing, etc.)
   */
  public getAllSignatures(): EventSignature[] {
    return Array.from(this.signatures.values());
  }

  /**
   * Returns the registration log for debugging / audit.
   */
  public getRegistrationLog(): Array<{ eventType: TacticalEventType; timestamp: number }> {
    return [...this.registrationLog];
  }

  /**
   * Validates that all 13 required event types are registered.
   * Returns a validation report.
   */
  public validate(): { valid: boolean; registered: number; missing: TacticalEventType[]; duplicates: TacticalEventType[] } {
    const required = Object.values(TacticalEventType) as TacticalEventType[];
    const missing = required.filter(et => !this.signatures.has(et));

    const seen = new Set<TacticalEventType>();
    const duplicates: TacticalEventType[] = [];
    this.registrationLog.forEach(({ eventType }) => {
      if (seen.has(eventType)) {
        duplicates.push(eventType);
      }
      seen.add(eventType);
    });

    return {
      valid: missing.length === 0,
      registered: this.signatures.size,
      missing,
      duplicates,
    };
  }

  // ─── Historical Converters ─────────────────────────────────────────

  /**
   * Transforms any compiled overlay to match the historical theme parameters.
   */
  public applyHistoricalToOverlay(overlay: OverlayState): OverlayState {
    const theme = this.historicalTheme;
    return {
      ...overlay,
      opacity: (overlay.opacity !== undefined ? overlay.opacity : 0.3) * theme.overlayOpacityScale,
      color: this.blendTowardTint(overlay.color, theme.tintColor, theme.desaturationAmount),
      colorSecondary: overlay.colorSecondary 
        ? this.blendTowardTint(overlay.colorSecondary, theme.tintColor, theme.desaturationAmount)
        : undefined,
    };
  }

  /**
   * Transforms any compiled arrow to match the historical theme parameters.
   */
  public applyHistoricalToArrow(arrow: ArrowState): ArrowState {
    const theme = this.historicalTheme;
    return {
      ...arrow,
      style: {
        ...arrow.style,
        opacity: (arrow.style.opacity !== undefined ? arrow.style.opacity : 0.85) * theme.arrowOpacityScale,
        color: this.blendTowardTint(arrow.style.color, theme.tintColor, theme.desaturationAmount),
      }
    };
  }

  // ─── Internal: Historical Theme Application ─────────────────────────────────

  private applyHistoricalTheme(sig: EventSignature): EventSignature {
    const theme = this.historicalTheme;

    const modifiedArrow: ArrowSignature | undefined = sig.arrow
      ? {
          ...sig.arrow,
          opacity: (sig.arrow.opacity ?? 0.9) * theme.arrowOpacityScale,
          // In historical mode, desaturate toward the tint color
          color: this.blendTowardTint(sig.arrow.color, theme.tintColor, theme.desaturationAmount),
        }
      : undefined;


    const modifiedOverlay: OverlaySignature | undefined = sig.overlay
      ? {
          ...sig.overlay,
          opacity: sig.overlay.opacity * theme.overlayOpacityScale,
          color: this.blendTowardTint(sig.overlay.color, theme.tintColor, theme.desaturationAmount),
        }
      : undefined;

    return {
      ...sig,
      arrow: modifiedArrow,
      overlay: modifiedOverlay,
    };
  }

  /**
   * Blends a hex color toward a tint color by `amount` (0 = original, 1 = full tint).
   */
  private blendTowardTint(hexColor: string, tintHex: string, amount: number): string {
    const parse = (hex: string): [number, number, number] => {
      const h = hex.replace('#', '');
      return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
      ];
    };
    const [r1, g1, b1] = parse(hexColor);
    const [r2, g2, b2] = parse(tintHex);
    const blend = (a: number, b: number) => Math.round(a + (b - a) * amount);
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(blend(r1, r2))}${toHex(blend(g1, g2))}${toHex(blend(b1, b2))}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const VisualLanguageRegistry = new VisualLanguageRegistryImpl();

// Re-export types for convenience
export type { VisualMode } from './types';
export { TacticalEventType } from './types';
