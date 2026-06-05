import { Router, Request, Response } from 'express';
import { learningJourneyService } from '../services/learningJourney.service';
import { learningRecommendationService } from '../services/learningRecommendation.service';
import { Logger } from '../utils/logger';

const router = Router();
const DEFAULT_USER = 'local-user';

// Helper to extract userId from headers or query, defaulting to DEFAULT_USER
const getUserId = (req: Request): string => {
  return (req.headers['x-user-id'] as string) || (req.query.userId as string) || DEFAULT_USER;
};

/**
 * GET /api/tactical/journey/profile
 * Returns the active user's learner profile.
 */
router.get('/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  try {
    const profile = learningJourneyService.getOrCreateProfile(userId);
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to fetch profile: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/profile
 * Updates the user's difficulty level or settings.
 */
router.post('/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { difficulty_level } = req.body;
  
  try {
    const profile = learningJourneyService.getOrCreateProfile(userId);
    if (difficulty_level) {
      profile.difficulty_level = difficulty_level;
      learningJourneyService.saveProfile(profile);
    }
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to update profile: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/start-path
 * Sets the active learning path.
 */
router.post('/start-path', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { pathId } = req.body;

  if (!pathId) {
    return res.status(400).json({ error: 'Bad Request', message: 'pathId is required' });
  }

  try {
    const profile = learningJourneyService.startPath(userId, pathId);
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to start path: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/tactical/journey/mastery
 * Returns all concept mastery values for the user.
 */
router.get('/mastery', (req: Request, res: Response) => {
  const userId = getUserId(req);
  try {
    const masteries = learningJourneyService.getMasteries(userId);
    res.json(masteries);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to fetch masteries: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/concept/view
 * Tracks a concept view.
 */
router.post('/concept/view', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { conceptId } = req.body;

  if (!conceptId) {
    return res.status(400).json({ error: 'Bad Request', message: 'conceptId is required' });
  }

  try {
    learningJourneyService.trackConceptView(userId, conceptId);
    res.json({ success: true });
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to track concept view: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/concept/complete
 * Marks a concept lesson completed.
 */
router.post('/concept/complete', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { conceptId } = req.body;

  if (!conceptId) {
    return res.status(400).json({ error: 'Bad Request', message: 'conceptId is required' });
  }

  try {
    const profile = learningJourneyService.completeConcept(userId, conceptId);
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to complete concept: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/breakdown/complete
 * Marks a breakdown finished.
 */
router.post('/breakdown/complete', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { conceptId, exampleId } = req.body;

  if (!conceptId || !exampleId) {
    return res.status(400).json({ error: 'Bad Request', message: 'conceptId and exampleId are required' });
  }

  try {
    const profile = learningJourneyService.completeBreakdown(userId, conceptId, exampleId);
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to complete breakdown: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/track-question
 * Increments asked questions count for a concept.
 */
router.post('/track-question', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { conceptId } = req.body;

  if (!conceptId) {
    return res.status(400).json({ error: 'Bad Request', message: 'conceptId is required' });
  }

  try {
    learningJourneyService.trackQuestionAsked(userId, conceptId);
    res.json({ success: true });
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to track question: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * POST /api/tactical/journey/add-time
 * Adds minutes to the user's active study time.
 */
router.post('/add-time', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { minutes } = req.body;

  if (typeof minutes !== 'number') {
    return res.status(400).json({ error: 'Bad Request', message: 'minutes must be a number' });
  }

  try {
    const profile = learningJourneyService.addLearningTime(userId, minutes);
    res.json(profile);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to add study time: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/tactical/journey/paths
 * Returns seeded learning paths.
 */
router.get('/paths', (req: Request, res: Response) => {
  try {
    const paths = learningRecommendationService.getPaths();
    res.json(paths);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/tactical/journey/recommendations
 * Computes recommendations for the user.
 */
router.get('/recommendations', (req: Request, res: Response) => {
  const userId = getUserId(req);
  try {
    const profile = learningJourneyService.getOrCreateProfile(userId);
    const masteries = learningJourneyService.getMasteries(userId);
    const recs = learningRecommendationService.generateRecommendations(profile, masteries);
    res.json(recs);
  } catch (err: any) {
    Logger.error(`[JourneyRoutes] Failed to generate recommendations: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

/**
 * GET /api/tactical/journey/activities
 * Returns recent activity logs.
 */
router.get('/activities', (req: Request, res: Response) => {
  const userId = getUserId(req);
  try {
    const activities = learningJourneyService.getActivities(userId);
    res.json(activities);
  } catch (err: any) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

export default router;
