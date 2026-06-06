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

  public trackBreakdownRequested(question: string, data: any = {}): void {
    this.track('breakdown_requested', { question, ...data });
  }

  public trackBreakdownLaunched(exampleId: string, data: any = {}): void {
    this.track('breakdown_launched', { example_id: exampleId, ...data });
  }

  public trackHistoricalExampleRequested(question: string, data: any = {}): void {
    this.track('historical_example_requested', { question, ...data });
  }

  public trackPlayerExampleRequested(question: string, data: any = {}): void {
    this.track('player_example_requested', { question, ...data });
  }

  public trackCoachExampleRequested(question: string, data: any = {}): void {
    this.track('coach_example_requested', { question, ...data });
  }

  public trackMatchExampleRequested(question: string, data: any = {}): void {
    this.track('match_example_requested', { question, ...data });
  }

  public trackConceptChainTriggered(question: string, data: any = {}): void {
    this.track('concept_chain_triggered', { question, ...data });
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

  public trackConceptChainStarted(conceptId: string, data: any = {}): void {
    this.track('concept_chain_started', { concept_id: conceptId, ...data });
  }

  public trackConceptTransition(fromConceptId: string, toConceptId: string, data: any = {}): void {
    this.track('concept_transition', { from_concept_id: fromConceptId, to_concept_id: toConceptId, ...data });
  }

  public trackContextRecovered(conceptId: string, data: any = {}): void {
    this.track('context_recovered', { concept_id: conceptId, ...data });
  }

  public trackClarificationRequested(question: string, data: any = {}): void {
    this.track('clarification_requested', { question, ...data });
  }

  public trackConversationCompleted(data: any = {}): void {
    this.track('conversation_completed', data);
  }

  public trackEvidenceOpened(exampleId: string, data: any = {}): void {
    this.track('evidence_opened', { example_id: exampleId, ...data });
  }

  public trackSourceViewed(evidenceId: string, sourceTitle: string, data: any = {}): void {
    this.track('source_viewed', { evidence_id: evidenceId, source_title: sourceTitle, ...data });
  }

  public trackGroundedExampleUsed(exampleId: string, data: any = {}): void {
    this.track('grounded_example_used', { example_id: exampleId, ...data });
  }

  public trackHistoricalModeEntered(conceptId: string, data: any = {}): void {
    this.track('historical_mode_entered', { concept_id: conceptId, ...data });
  }

  public trackSourceFollowupAsked(question: string, data: any = {}): void {
    this.track('source_followup_asked', { question, ...data });
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
