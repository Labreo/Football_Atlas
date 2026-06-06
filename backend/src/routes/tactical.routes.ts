import { Router, Request, Response, NextFunction } from 'express';
import { tacticalRegistry, TutorResponse, ComplexityLevel, ConversationTurn } from '@football-atlas/shared';
import { GraniteService } from '../services/granite.service';
import { historicalExampleService } from '../services/historicalExample.service';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';
import { historicalBreakdownService } from '../services/historicalBreakdown.service';

const router = Router();
const graniteService = new GraniteService();

/**
 * GET /api/tactical/concepts
 * Returns all tactical concepts from the shared registry (populated with matching docling chunks).
 */
router.get('/concepts', (req: Request, res: Response) => {
  const concepts = tacticalRegistry.getAllConcepts();
  res.json(concepts);
});

/**
 * GET /api/tactical/concepts/:id
 * Returns a specific tactical concept by ID.
 */
router.get('/concepts/:id', (req: Request, res: Response) => {
  const concept = tacticalRegistry.getConcept(req.params.id);
  if (!concept) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Concept with ID ${req.params.id} does not exist.`
    });
  }
  res.json(concept);
});

/**
 * POST /api/tactical/tutor
 * Interacts with the IBM Granite Tutor service and returns mapped tutoring responses.
 */
router.post('/tutor', async (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req as any).traceId || 'unknown-trace';
  const { prompt, history } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'The "prompt" field is required in the JSON body.'
    });
  }

  try {
    const tutorResult = await graniteService.queryTutor(prompt, 'default-session', traceId, history);
    const rawData: any = tutorResult.data;
    let tutorResponse: TutorResponse;

    if (rawData.needs_clarification) {
      tutorResponse = {
        explanation: rawData.clarification_question || 'Could you clarify what you mean?',
        detected_level: ComplexityLevel.BEGINNER,
        follow_up_suggestions: [],
        confidence_score: 0.65,
        clarification_requested: true,
        followup_detected: rawData.followup_detected || false,
        conversation_thread: rawData.conversation_thread || []
      };
    } else {
      tutorResponse = {
        explanation: rawData.explanation,
        concept_id: rawData.concept_id,
        detected_level: rawData.user_level || ComplexityLevel.BEGINNER,
        follow_up_suggestions: rawData.follow_up_suggestions || [],
        confidence_score: rawData.confidence_score !== undefined ? rawData.confidence_score : 0.93,
        actions: rawData.actions || [],
        followup_detected: rawData.followup_detected || false,
        reference_resolved: rawData.reference_resolved || false,
        clarification_requested: false,
        context_recovered: rawData.context_recovered || false,
        concept_transition: rawData.concept_transition || false,
        breakdown_followup: rawData.breakdown_followup || false,
        resolved_references: rawData.resolved_references || [],
        conversation_thread: rawData.conversation_thread || []
      };
    }

    res.json(tutorResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tactical/historical/concepts/:id
 * Returns ranked historical examples for a concept.
 */
router.get('/historical/concepts/:id', (req: Request, res: Response) => {
  const conceptId = req.params.id;
  const complexity = req.query.complexity as ComplexityLevel | undefined;
  const exclude = req.query.exclude ? (req.query.exclude as string).split(',') : [];

  const bestOnly = req.query.best === 'true';
  if (bestOnly) {
    const best = historicalExampleService.getBestExample(conceptId, complexity, exclude);
    if (!best) {
      return res.status(404).json({ error: 'Not Found', message: 'No suitable historical example found.' });
    }
    return res.json(best);
  }

  const examples = historicalExampleService.getExamplesByConcept(conceptId);
  return res.json(examples);
});

/**
 * GET /api/tactical/historical/search
 * Filters historical examples by coach, team, player, or returns all examples.
 */
router.get('/historical/search', (req: Request, res: Response) => {
  const coach = req.query.coach as string | undefined;
  const team = req.query.team as string | undefined;
  const player = req.query.player as string | undefined;

  if (coach) {
    return res.json(historicalExampleService.getExamplesByCoach(coach));
  }
  if (team) {
    return res.json(historicalExampleService.getExamplesByTeam(team));
  }
  if (player) {
    return res.json(historicalExampleService.getExamplesByPlayer(player));
  }

  return res.json(historicalExampleRepository.getAll());
});

/**
 * GET /api/tactical/historical/breakdowns/:exampleId
 * Returns the interactive tactical breakdown for a historical match example.
 */
router.get('/historical/breakdowns/:exampleId', (req: Request, res: Response) => {
  const exampleId = req.params.exampleId;
  const breakdown = historicalBreakdownService.getBreakdownByExampleId(exampleId);
  if (!breakdown) {
    return res.status(404).json({ error: 'Not Found', message: 'No tactical breakdown found for this historical example.' });
  }
  return res.json(breakdown);
});

export default router;
