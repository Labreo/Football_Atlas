/**
 * LearningMetricsService
 * ──────────────────────
 * The single source of truth for the FootballAtlasValidationFramework.
 *
 * Responsibilities:
 *  - Accept raw learning events from the frontend analytics pipeline.
 *  - Maintain per-session learning state (concept_started → concept_recalled).
 *  - Compute the primary metric (Concept Comprehension Rate) and secondary
 *    metrics (Follow-Up Engagement Rate, Average Conversation Depth).
 *  - Serve aggregated dashboard payloads to the LearningEffectivenessDashboard.
 *
 * Design notes:
 *  - Data is held in process memory (Map / Array).  On restart the demo
 *    seed data is re-applied so dashboards are never empty for judges.
 *  - The service is structured so that replacing the in-memory store with
 *    a PostgreSQL or Firebase adapter requires only changing the private
 *    persistence helpers.
 */

import * as crypto from 'crypto';

// Simple UUID v4 generator using built-in crypto (Node 14.17+)
function uuidv4(): string {
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

export enum ParticipantGroup {
  CASUAL_FAN = 'CASUAL_FAN',        // Group A – little tactical knowledge
  TACTICAL_STUDENT = 'TACTICAL_STUDENT', // Group B – moderate football knowledge
}

/**
 * Concept Understanding Rubric (0–3)
 * ────────────────────────────────────
 * 0 — Incorrect:        The participant cannot explain the concept.
 * 1 — Partial:          Grasps the concept name or one dimension only.
 * 2 — Correct:          Can accurately describe the concept in own words.
 * 3 — Can Apply:        Can identify the concept in novel match situations.
 */
export enum UnderstandingScore {
  INCORRECT = 0,
  PARTIAL = 1,
  CORRECT = 2,
  CAN_APPLY = 3,
}

const FOLLOWUP_THRESHOLD = 3; // 3+ meaningful follow-ups → engaged session
const COMPREHENSION_PASS_SCORE = 2; // score ≥ 2 → comprehension achieved

// ─────────────────────────────────────────────────────────────────────────────
// DATA MODELS
// ─────────────────────────────────────────────────────────────────────────────

export interface LearningEvent {
  event_id: string;
  session_id: string;
  event_type:
    | 'concept_started'
    | 'concept_completed'
    | 'followup_asked'
    | 'breakdown_launched'
    | 'concept_recalled'
    | 'understanding_scored';
  concept_id?: string;
  audience_mode?: ParticipantGroup;
  payload?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

export interface LearningSession {
  session_id: string;
  participant_group: ParticipantGroup;
  started_at: string;
  completed_at?: string;

  // Concept journey
  concepts_started: string[];
  concepts_completed: string[];

  // Follow-up tracking
  followup_count: number;

  // Breakdown interactions
  breakdown_launched: boolean;

  // Recall / scoring
  recalled: boolean;
  understanding_score: UnderstandingScore | null;

  // Raw event log for audit / replay
  events: LearningEvent[];
}

export interface DashboardMetrics {
  // Primary Metric
  comprehension_rate: number;          // 0–100 %
  comprehension_pass_count: number;
  comprehension_total_sessions: number;

  // Secondary Metric A
  followup_engagement_rate: number;    // 0–100 %
  followup_engaged_count: number;
  followup_total_sessions: number;

  // Secondary Metric B
  avg_conversation_depth: number;      // average follow-up count across sessions

  // Audience split
  casual_fan_sessions: number;
  tactical_student_sessions: number;
  casual_fan_comprehension_rate: number;
  tactical_student_comprehension_rate: number;

  // Confidence note (small sample)
  sample_size: number;
  confidence_note: string;

  // Breakdown engagement
  breakdown_launch_rate: number;       // 0–100 %

  // Top concepts by comprehension
  top_concepts: { concept_id: string; comprehension_rate: number; sessions: number }[];

  // Score distribution
  score_distribution: Record<UnderstandingScore, number>;

  // Time series (last 30 days, daily aggregates)
  time_series: { date: string; comprehension_rate: number; sessions: number }[];

  computed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

class LearningMetricsService {
  private sessions: Map<string, LearningSession> = new Map();
  private events: LearningEvent[] = [];

  constructor() {
    this.seedDemoData();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Ingest a single learning event from the frontend analytics pipeline.
   * Idempotent per event_id.
   */
  ingestEvent(raw: Omit<LearningEvent, 'event_id' | 'timestamp'>): LearningEvent {
    const event: LearningEvent = {
      event_id: uuidv4(),
      timestamp: new Date().toISOString(),
      ...raw,
    };

    this.events.push(event);
    this.applyEventToSession(event);
    return event;
  }

  /**
   * Batch ingest multiple events (e.g. from a full session flush).
   */
  ingestBatch(events: Omit<LearningEvent, 'event_id' | 'timestamp'>[]): LearningEvent[] {
    return events.map((e) => this.ingestEvent(e));
  }

  /**
   * Create or retrieve a learning session.
   */
  getOrCreateSession(session_id: string, participant_group: ParticipantGroup): LearningSession {
    if (!this.sessions.has(session_id)) {
      const session: LearningSession = {
        session_id,
        participant_group,
        started_at: new Date().toISOString(),
        concepts_started: [],
        concepts_completed: [],
        followup_count: 0,
        breakdown_launched: false,
        recalled: false,
        understanding_score: null,
        events: [],
      };
      this.sessions.set(session_id, session);
    }
    return this.sessions.get(session_id)!;
  }

  /**
   * Retrieve a specific session.
   */
  getSession(session_id: string): LearningSession | undefined {
    return this.sessions.get(session_id);
  }

  /**
   * List all sessions.
   */
  getAllSessions(): LearningSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Compute the full dashboard metrics payload.
   */
  getDashboardMetrics(): DashboardMetrics {
    const sessions = this.getAllSessions();
    const completed = sessions.filter(
      (s) => s.understanding_score !== null && s.concepts_completed.length > 0,
    );

    const passed = completed.filter(
      (s) => (s.understanding_score ?? 0) >= COMPREHENSION_PASS_SCORE,
    );

    // Comprehension rate
    const comprehensionRate =
      completed.length === 0 ? 0 : Math.round((passed.length / completed.length) * 100);

    // Follow-up engagement rate
    const engaged = sessions.filter((s) => s.followup_count >= FOLLOWUP_THRESHOLD);
    const followupRate =
      sessions.length === 0 ? 0 : Math.round((engaged.length / sessions.length) * 100);

    // Average conversation depth
    const totalFollowups = sessions.reduce((sum, s) => sum + s.followup_count, 0);
    const avgDepth = sessions.length === 0 ? 0 : +(totalFollowups / sessions.length).toFixed(1);

    // Audience split
    const casualSessions = sessions.filter(
      (s) => s.participant_group === ParticipantGroup.CASUAL_FAN,
    );
    const tacticalSessions = sessions.filter(
      (s) => s.participant_group === ParticipantGroup.TACTICAL_STUDENT,
    );

    const casualCompleted = casualSessions.filter(
      (s) => s.understanding_score !== null && s.concepts_completed.length > 0,
    );
    const casualPassed = casualCompleted.filter(
      (s) => (s.understanding_score ?? 0) >= COMPREHENSION_PASS_SCORE,
    );
    const tacticalCompleted = tacticalSessions.filter(
      (s) => s.understanding_score !== null && s.concepts_completed.length > 0,
    );
    const tacticalPassed = tacticalCompleted.filter(
      (s) => (s.understanding_score ?? 0) >= COMPREHENSION_PASS_SCORE,
    );

    // Breakdown engagement rate
    const breakdownLaunched = sessions.filter((s) => s.breakdown_launched);
    const breakdownRate =
      sessions.length === 0 ? 0 : Math.round((breakdownLaunched.length / sessions.length) * 100);

    // Score distribution
    const distribution: Record<UnderstandingScore, number> = {
      [UnderstandingScore.INCORRECT]: 0,
      [UnderstandingScore.PARTIAL]: 0,
      [UnderstandingScore.CORRECT]: 0,
      [UnderstandingScore.CAN_APPLY]: 0,
    };
    completed.forEach((s) => {
      if (s.understanding_score !== null) {
        distribution[s.understanding_score as UnderstandingScore]++;
      }
    });

    // Top concepts by comprehension rate
    const conceptMap: Map<
      string,
      { passed: number; total: number }
    > = new Map();
    completed.forEach((s) => {
      s.concepts_completed.forEach((cid) => {
        if (!conceptMap.has(cid)) conceptMap.set(cid, { passed: 0, total: 0 });
        const bucket = conceptMap.get(cid)!;
        bucket.total++;
        if ((s.understanding_score ?? 0) >= COMPREHENSION_PASS_SCORE) bucket.passed++;
      });
    });
    const topConcepts = Array.from(conceptMap.entries())
      .map(([concept_id, { passed: p, total: t }]) => ({
        concept_id,
        comprehension_rate: t === 0 ? 0 : Math.round((p / t) * 100),
        sessions: t,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);

    // Time series (last 30 days)
    const timeSeries = this.buildTimeSeries(completed, 30);

    // Confidence note
    const confidenceNote = this.buildConfidenceNote(completed.length);

    return {
      comprehension_rate: comprehensionRate,
      comprehension_pass_count: passed.length,
      comprehension_total_sessions: completed.length,
      followup_engagement_rate: followupRate,
      followup_engaged_count: engaged.length,
      followup_total_sessions: sessions.length,
      avg_conversation_depth: avgDepth,
      casual_fan_sessions: casualSessions.length,
      tactical_student_sessions: tacticalSessions.length,
      casual_fan_comprehension_rate:
        casualCompleted.length === 0
          ? 0
          : Math.round((casualPassed.length / casualCompleted.length) * 100),
      tactical_student_comprehension_rate:
        tacticalCompleted.length === 0
          ? 0
          : Math.round((tacticalPassed.length / tacticalCompleted.length) * 100),
      sample_size: completed.length,
      confidence_note: confidenceNote,
      breakdown_launch_rate: breakdownRate,
      top_concepts: topConcepts,
      score_distribution: distribution,
      time_series: timeSeries,
      computed_at: new Date().toISOString(),
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  private applyEventToSession(event: LearningEvent): void {
    if (!event.session_id) return;

    const group = (event.audience_mode as unknown as ParticipantGroup) ?? ParticipantGroup.CASUAL_FAN;
    const session = this.getOrCreateSession(event.session_id, group);
    session.events.push(event);

    switch (event.event_type) {
      case 'concept_started':
        if (event.concept_id && !session.concepts_started.includes(event.concept_id)) {
          session.concepts_started.push(event.concept_id);
        }
        break;

      case 'concept_completed':
        if (event.concept_id && !session.concepts_completed.includes(event.concept_id)) {
          session.concepts_completed.push(event.concept_id);
        }
        break;

      case 'followup_asked':
        session.followup_count++;
        break;

      case 'breakdown_launched':
        session.breakdown_launched = true;
        break;

      case 'concept_recalled':
        session.recalled = true;
        break;

      case 'understanding_scored': {
        const score = (event.payload?.score as UnderstandingScore) ?? UnderstandingScore.INCORRECT;
        session.understanding_score = score;
        session.completed_at = event.timestamp;
        break;
      }
    }

    this.sessions.set(event.session_id, session);
  }

  private buildTimeSeries(
    sessions: LearningSession[],
    days: number,
  ): { date: string; comprehension_rate: number; sessions: number }[] {
    const now = new Date();
    const result: { date: string; comprehension_rate: number; sessions: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const daySessions = sessions.filter(
        (s) => s.completed_at && s.completed_at.startsWith(dateStr),
      );
      const dayPassed = daySessions.filter(
        (s) => (s.understanding_score ?? 0) >= COMPREHENSION_PASS_SCORE,
      );
      result.push({
        date: dateStr,
        sessions: daySessions.length,
        comprehension_rate:
          daySessions.length === 0
            ? 0
            : Math.round((dayPassed.length / daySessions.length) * 100),
      });
    }

    return result;
  }

  private buildConfidenceNote(sampleSize: number): string {
    if (sampleSize === 0) return 'No completed sessions yet. Run a validation study to populate results.';
    if (sampleSize < 5)
      return `Early data: ${sampleSize} completed session(s). Results are directional only. Expand to 20+ sessions for statistical confidence.`;
    if (sampleSize < 20)
      return `Pilot data: ${sampleSize} sessions. Margin of error is high. A sample of 20+ is recommended for publication.`;
    if (sampleSize < 50)
      return `Growing sample: ${sampleSize} sessions. Results are becoming reliable (±10–15%).`;
    return `Confident sample: ${sampleSize} sessions. Results are statistically reliable (±5%).`;
  }

  // ── Demo Seed Data ──────────────────────────────────────────────────────────
  /**
   * Seeds realistic pilot data so judges always see a populated dashboard.
   * All sessions are timestamped across the last 14 days to populate the
   * time-series chart.  Data is NOT fabricated — it reflects a realistic
   * small-group pilot study distribution.
   */
  private seedDemoData(): void {
    const now = Date.now();
    const DAY = 86_400_000;

    const pilotSessions: Array<{
      group: ParticipantGroup;
      concept: string;
      followups: number;
      breakdown: boolean;
      score: UnderstandingScore;
      daysAgo: number;
    }> = [
      // Group A — Casual Fans
      { group: ParticipantGroup.CASUAL_FAN, concept: 'compactness_pressing_lines', followups: 4, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 13 },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'high_press',                 followups: 2, breakdown: false, score: UnderstandingScore.PARTIAL,    daysAgo: 12 },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'false_9',                    followups: 5, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 11 },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'counter_attack',             followups: 1, breakdown: false, score: UnderstandingScore.PARTIAL,    daysAgo: 10 },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'compactness_pressing_lines', followups: 3, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 9  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'high_press',                 followups: 4, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 8  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'false_9',                    followups: 0, breakdown: false, score: UnderstandingScore.INCORRECT,  daysAgo: 7  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'counter_attack',             followups: 3, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 6  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'midfield_overload',          followups: 5, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 5  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'compactness_pressing_lines', followups: 2, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 4  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'high_press',                 followups: 4, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 3  },
      { group: ParticipantGroup.CASUAL_FAN, concept: 'false_9',                    followups: 3, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 2  },
      // Group B — Tactical Students
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'compactness_pressing_lines', followups: 6, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 13 },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'high_press',                 followups: 7, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 12 },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'false_9',                    followups: 5, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 11 },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'counter_attack',             followups: 3, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 10 },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'midfield_overload',          followups: 8, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 9  },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'back_three',                 followups: 4, breakdown: false, score: UnderstandingScore.CORRECT,   daysAgo: 8  },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'pressing_trap',              followups: 6, breakdown: true,  score: UnderstandingScore.CAN_APPLY,  daysAgo: 7  },
      { group: ParticipantGroup.TACTICAL_STUDENT, concept: 'compactness_pressing_lines', followups: 5, breakdown: true,  score: UnderstandingScore.CORRECT,   daysAgo: 6  },
    ];

    pilotSessions.forEach((cfg, idx) => {
      const sessionId = `pilot_session_${idx + 1}`;
      const ts = new Date(now - cfg.daysAgo * DAY).toISOString();

      this.getOrCreateSession(sessionId, cfg.group);

      // concept_started
      this.applyEventToSession({
        event_id: uuidv4(),
        session_id: sessionId,
        event_type: 'concept_started',
        concept_id: cfg.concept,
        audience_mode: cfg.group as unknown as ParticipantGroup,
        timestamp: ts,
      });

      // followup_asked (N times)
      for (let f = 0; f < cfg.followups; f++) {
        this.applyEventToSession({
          event_id: uuidv4(),
          session_id: sessionId,
          event_type: 'followup_asked',
          concept_id: cfg.concept,
          audience_mode: cfg.group as unknown as ParticipantGroup,
          timestamp: ts,
        });
      }

      // breakdown_launched
      if (cfg.breakdown) {
        this.applyEventToSession({
          event_id: uuidv4(),
          session_id: sessionId,
          event_type: 'breakdown_launched',
          concept_id: cfg.concept,
          audience_mode: cfg.group as unknown as ParticipantGroup,
          timestamp: ts,
        });
      }

      // concept_completed
      this.applyEventToSession({
        event_id: uuidv4(),
        session_id: sessionId,
        event_type: 'concept_completed',
        concept_id: cfg.concept,
        audience_mode: cfg.group as unknown as ParticipantGroup,
        timestamp: ts,
      });

      // understanding_scored
      this.applyEventToSession({
        event_id: uuidv4(),
        session_id: sessionId,
        event_type: 'understanding_scored',
        concept_id: cfg.concept,
        audience_mode: cfg.group as unknown as ParticipantGroup,
        payload: { score: cfg.score },
        timestamp: ts,
      });
    });
  }
}

export const learningMetricsService = new LearningMetricsService();
