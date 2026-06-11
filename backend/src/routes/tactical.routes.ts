import { Router, Request, Response, NextFunction } from 'express';
import { tacticalRegistry, TutorResponse, ComplexityLevel, ConversationTurn, AudienceMode } from '@football-atlas/shared';
import { GraniteService } from '../services/granite.service';
import { historicalExampleService } from '../services/historicalExample.service';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';
import { historicalBreakdownService } from '../services/historicalBreakdown.service';
import { groundedExampleService } from '../services/groundedExample.service';
import { contextForgeGateway } from '../services/contextForge.service';
import { footballAtlasMCPServer } from '../services/mcpServer.service';

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
 * Interacts with the Context Forge MCP Gateway to orchestrate tool selection and synthesis.
 * Accepts optional audience_mode ('CASUAL_FAN' | 'TACTICAL_STUDENT') to shape the Granite voice.
 */
router.post('/tutor', async (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req as any).traceId || 'unknown-trace';
  const { prompt, history, audience_mode } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'The "prompt" field is required in the JSON body.'
    });
  }

  // Validate and coerce audience_mode — default to CASUAL_FAN if missing/invalid
  const validModes: AudienceMode[] = [AudienceMode.CASUAL_FAN, AudienceMode.TACTICAL_STUDENT];
  const resolvedAudienceMode: AudienceMode = validModes.includes(audience_mode)
    ? audience_mode
    : AudienceMode.CASUAL_FAN;

  try {
    const tutorResponse = await contextForgeGateway.queryTutor(
      prompt,
      'default-session',
      traceId,
      history,
      resolvedAudienceMode
    );
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

/**
 * GET /api/tactical/historical/evidence/:exampleId
 * Returns the supporting evidence chunks for a specific historical match.
 */
router.get('/historical/evidence/:exampleId', (req: Request, res: Response) => {
  const exampleId = req.params.exampleId;
  const evidence = groundedExampleService.getEvidenceForExample(exampleId);
  return res.json(evidence);
});

/**
 * GET /api/tactical/historical/examples/:exampleId/evidence
 * Alternative path to retrieve supporting evidence.
 */
router.get('/historical/examples/:exampleId/evidence', (req: Request, res: Response) => {
  const exampleId = req.params.exampleId;
  const evidence = groundedExampleService.getEvidenceForExample(exampleId);
  return res.json(evidence);
});

/**
 * GET /api/tactical/mcp/tools
 * Returns the list of registered tools and schemas on FootballAtlasMCPServer.
 */
router.get('/mcp/tools', (req: Request, res: Response) => {
  const toolsList = footballAtlasMCPServer.listTools();
  res.json(toolsList);
});

export default router;
