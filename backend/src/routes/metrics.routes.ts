/**
 * metrics.routes.ts
 * ──────────────────
 * FootballAtlasValidationFramework REST API
 *
 * Endpoints:
 *   GET  /api/metrics/dashboard          → DashboardMetrics payload
 *   GET  /api/metrics/sessions           → All learning sessions (summary)
 *   GET  /api/metrics/sessions/:id       → Single session detail
 *   POST /api/metrics/events             → Ingest a single LearningEvent
 *   POST /api/metrics/events/batch       → Ingest a batch of events
 *   POST /api/metrics/sessions           → Create / get a session
 *   GET  /api/metrics/rubric             → Concept Understanding Rubric definitions
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  learningMetricsService,
  ParticipantGroup,
  UnderstandingScore,
} from '../services/learningMetrics.service';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/metrics/dashboard
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the full aggregated metrics payload used by the
 * LearningEffectivenessDashboard component.
 */
router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const metrics = learningMetricsService.getDashboardMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute dashboard metrics', detail: String(err) });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/metrics/sessions
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sessions', (_req: Request, res: Response) => {
  const sessions = learningMetricsService.getAllSessions().map((s) => ({
    session_id: s.session_id,
    participant_group: s.participant_group,
    started_at: s.started_at,
    completed_at: s.completed_at,
    followup_count: s.followup_count,
    breakdown_launched: s.breakdown_launched,
    understanding_score: s.understanding_score,
    concepts_completed: s.concepts_completed,
  }));
  res.json(sessions);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/metrics/sessions/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/sessions/:id', (req: Request, res: Response) => {
  const session = learningMetricsService.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found', session_id: req.params.id });
  }
  res.json(session);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/metrics/sessions
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Creates (or retrieves) a learning session.
 * Body: { session_id: string, participant_group: 'CASUAL_FAN' | 'TACTICAL_STUDENT' }
 */
router.post('/sessions', (req: Request, res: Response) => {
  const { session_id, participant_group } = req.body;
  if (!session_id) {
    return res.status(400).json({ error: 'session_id is required' });
  }
  const group = Object.values(ParticipantGroup).includes(participant_group)
    ? participant_group
    : ParticipantGroup.CASUAL_FAN;

  const session = learningMetricsService.getOrCreateSession(session_id, group);
  res.status(201).json(session);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/metrics/events
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Ingest a single learning event.
 *
 * Body: {
 *   session_id: string
 *   event_type: 'concept_started' | 'concept_completed' | 'followup_asked'
 *              | 'breakdown_launched' | 'concept_recalled' | 'understanding_scored'
 *   concept_id?: string
 *   audience_mode?: 'CASUAL_FAN' | 'TACTICAL_STUDENT'
 *   payload?: object   // e.g. { score: 2 } for 'understanding_scored'
 * }
 */
router.post('/events', (req: Request, res: Response, _next: NextFunction) => {
  const { session_id, event_type, concept_id, audience_mode, payload } = req.body;

  if (!session_id || !event_type) {
    return res
      .status(400)
      .json({ error: 'session_id and event_type are required' });
  }

  const event = learningMetricsService.ingestEvent({
    session_id,
    event_type,
    concept_id,
    audience_mode,
    payload,
  });

  res.status(201).json(event);
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/metrics/events/batch
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Ingest a batch of events at once. Body: { events: LearningEvent[] }
 */
router.post('/events/batch', (req: Request, res: Response) => {
  const { events } = req.body;
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'events must be a non-empty array' });
  }
  const ingested = learningMetricsService.ingestBatch(events);
  res.status(201).json({ ingested: ingested.length, events: ingested });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/metrics/rubric
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the Concept Understanding Rubric with evaluator guidance.
 * Used by human evaluators conducting the validation study.
 */
router.get('/rubric', (_req: Request, res: Response) => {
  res.json({
    name: 'Concept Understanding Rubric',
    version: '1.0.0',
    description:
      'Used by independent evaluators to score participant recall after one Football Atlas learning loop.',
    levels: [
      {
        score: UnderstandingScore.INCORRECT,
        label: 'Incorrect',
        emoji: '❌',
        description: 'Participant cannot describe the concept or gives a wrong explanation.',
        evaluator_guidance: [
          'Participant uses the wrong tactical term.',
          'Participant confuses the concept with a different one (e.g., high press vs. low block).',
          'Participant says "I don\'t know" or cannot recall anything substantive.',
        ],
        example_response: '"Mbappé just scored because he\'s fast."',
      },
      {
        score: UnderstandingScore.PARTIAL,
        label: 'Partial Understanding',
        emoji: '🟡',
        description: 'Participant grasps one dimension — the name, the outcome, or the trigger — but cannot explain the mechanism.',
        evaluator_guidance: [
          'Knows the concept name but cannot explain what it does spatially.',
          'Describes the outcome (goal scored) but not the cause (midfield disconnection).',
          'Uses approximate language: "the team pressed a lot" without explaining where or why.',
        ],
        example_response: '"Argentina didn\'t defend well and left gaps."',
      },
      {
        score: UnderstandingScore.CORRECT,
        label: 'Correct Understanding',
        emoji: '✅',
        description: 'Participant accurately describes the concept in their own words, including the spatial and structural mechanism.',
        evaluator_guidance: [
          'Names the concept correctly and explains how it operates.',
          'Identifies the spatial relationship (e.g., "the defensive line dropped too deep, opening space in Zone 14").',
          'Can say why it happened, not just that it happened.',
        ],
        example_response:
          '"Argentina\'s midfield disconnected from the back four, so France had space between the lines to play through quickly."',
      },
      {
        score: UnderstandingScore.CAN_APPLY,
        label: 'Can Apply Concept',
        emoji: '🏆',
        description: 'Participant can identify the concept in a new, unprompted match situation.',
        evaluator_guidance: [
          'When shown a second clip or described a novel match, participant correctly identifies the same structural pattern.',
          'Offers tactical recommendations (e.g., "the manager should have had the midfielder track the runner").',
          'Generalises from the specific example to the abstract principle.',
        ],
        example_response:
          '"That\'s the same thing — the centre-back followed the striker into midfield and left the channel open, exactly like Romero did."',
      },
    ],
    scoring_notes: [
      'Score is assigned by an independent evaluator, not the participant themselves.',
      'Score ≥ 2 (Correct or Can Apply) counts as a comprehension success.',
      'Evaluation should occur immediately after the learning loop, before the participant can revisit the material.',
      'For small samples (< 20), report individual scores alongside the aggregate rate.',
    ],
  });
});

export default router;
