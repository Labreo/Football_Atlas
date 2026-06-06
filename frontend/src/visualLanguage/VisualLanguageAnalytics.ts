import { analyticsTracker } from '../tacticalOrchestrator/analytics';
import { TacticalEventType, VisualMode } from './types';

class VisualLanguageAnalyticsImpl {
  private sessionId: string = Math.random().toString(36).substring(2, 11);

  public trackSignatureShown(eventType: TacticalEventType, mode: VisualMode, conceptId?: string): void {
    analyticsTracker.track('visual_signature_shown', {
      eventType,
      mode,
      conceptId,
      sessionId: this.sessionId,
      timestampMs: Date.now(),
    });
  }

  public trackSignatureRecognized(eventType: TacticalEventType, userConfirmed: boolean, latencyMs: number): void {
    analyticsTracker.track('visual_signature_recognized', {
      eventType,
      userConfirmed,
      latencyMs,
      sessionId: this.sessionId,
      timestampMs: Date.now(),
    });
  }

  public trackHistoricalModeViewed(exampleId: string, durationMs: number): void {
    analyticsTracker.track('historical_mode_viewed', {
      exampleId,
      durationMs,
      sessionId: this.sessionId,
      timestampMs: Date.now(),
    });
  }
}

export const VisualLanguageAnalytics = new VisualLanguageAnalyticsImpl();
