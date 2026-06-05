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
   * Tracks when a concept is opened.
   */
  public trackConceptOpened(conceptId: string, data: any = {}): void {
    this.track('concept_opened', { concept_id: conceptId, ...data });
  }

  /**
   * Tracks when a breakdown is started.
   */
  public trackBreakdownStarted(breakdownId: string, data: any = {}): void {
    this.track('breakdown_started', { breakdown_id: breakdownId, ...data });
  }

  /**
   * Tracks when a historical example is viewed.
   */
  public trackHistoricalExampleViewed(exampleId: string, data: any = {}): void {
    this.track('historical_example_viewed', { example_id: exampleId, ...data });
  }

  /**
   * Tracks when a match is opened.
   */
  public trackMatchOpened(matchId: string, data: any = {}): void {
    this.track('match_opened', { match_id: matchId, ...data });
  }

  /**
   * Tracks when a question is asked in the classroom.
   */
  public trackQuestionAsked(question: string, data: any = {}): void {
    this.track('question_asked', { question, ...data });
  }

  /**
   * Tracks when a related concept is opened.
   */
  public trackRelatedConceptOpened(fromConceptId: string, toConceptId: string, data: any = {}): void {
    this.track('related_concept_opened', {
      from_concept_id: fromConceptId,
      to_concept_id: toConceptId,
      ...data
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
