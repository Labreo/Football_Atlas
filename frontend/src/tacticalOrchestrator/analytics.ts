import { AnalyticsEventType, AnalyticsEvent } from '@football-atlas/shared';

// ────────────────────────────────────────────────────────────
// ANALYTICS TRACKER
// Typed event tracking with session-scoped event buffer.
// ────────────────────────────────────────────────────────────

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessionId: string;
  private eventBuffer: AnalyticsEvent[] = [];
  private maxBufferSize: number = 500;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  // ──────────────── Generic Track ────────────────

  /**
   * Generic event tracking (backward-compatible).
   */
  public track(eventName: string, data: any = {}): void {
    const timestamp = new Date().toISOString();
    console.log(`[Analytics] [${timestamp}] Event: "${eventName}" | Data:`, data);

    // Buffer the event
    const event: AnalyticsEvent = {
      event: eventName as AnalyticsEventType,
      concept_id: data.conceptId || data.concept_id || undefined,
      data,
      timestamp,
      session_id: this.sessionId,
    };
    this.bufferEvent(event);

    // Dispatch browser custom event
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('football_atlas_analytics', {
        detail: { eventName, data, timestamp }
      });
      window.dispatchEvent(customEvent);
    }
  }

  // ──────────────── Typed Event Methods ────────────────

  /**
   * Tracks when a concept package is successfully loaded during runtime boot.
   */
  public trackConceptLoaded(conceptId: string, loadTimeMs: number): void {
    this.track('concept_loaded', { concept_id: conceptId, load_time_ms: loadTimeMs });
  }

  /**
   * Tracks when a lesson starts for a specific concept.
   */
  public trackLessonStarted(conceptId: string, lessonId?: string): void {
    this.track('lesson_started', { concept_id: conceptId, lesson_id: lessonId });
  }

  /**
   * Tracks when a lesson completes for a specific concept.
   */
  public trackLessonCompleted(conceptId: string, lessonId?: string, durationMs?: number): void {
    this.track('lesson_completed', {
      concept_id: conceptId,
      lesson_id: lessonId,
      duration_ms: durationMs,
    });
  }

  /**
   * Tracks when a user abandons a concept before completing the lesson.
   */
  public trackConceptAbandoned(conceptId: string, reason?: string): void {
    this.track('concept_abandoned', { concept_id: conceptId, reason });
  }

  /**
   * Tracks when a user selects a follow-up concept suggestion.
   */
  public trackFollowUpSelected(fromConceptId: string, toConceptId: string): void {
    this.track('follow_up_selected', {
      from_concept_id: fromConceptId,
      to_concept_id: toConceptId,
    });
  }

  /**
   * Tracks when a user switches between concepts.
   */
  public trackConceptSwitched(fromConceptId: string | null, toConceptId: string): void {
    this.track('concept_switched', {
      from_concept_id: fromConceptId,
      to_concept_id: toConceptId,
    });
  }

  // ──────────────── Session Buffer ────────────────

  /**
   * Returns all events from the current session.
   */
  public getSessionEvents(): AnalyticsEvent[] {
    return [...this.eventBuffer];
  }

  /**
   * Returns events filtered by type.
   */
  public getEventsByType(eventType: AnalyticsEventType): AnalyticsEvent[] {
    return this.eventBuffer.filter((e) => e.event === eventType);
  }

  /**
   * Returns events filtered by concept ID.
   */
  public getEventsForConcept(conceptId: string): AnalyticsEvent[] {
    return this.eventBuffer.filter((e) => e.concept_id === conceptId);
  }

  /**
   * Returns the current session ID.
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Returns the total number of buffered events.
   */
  public getBufferSize(): number {
    return this.eventBuffer.length;
  }

  /**
   * Clears the event buffer and starts a new session.
   */
  public resetSession(): void {
    this.eventBuffer = [];
    this.sessionId = this.generateSessionId();
  }

  // ──────────────── Internals ────────────────

  private bufferEvent(event: AnalyticsEvent): void {
    this.eventBuffer.push(event);

    // Evict oldest events if buffer exceeds capacity
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.maxBufferSize);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}

export const analyticsTracker = AnalyticsTracker.getInstance();
