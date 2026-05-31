import { Router, Request, Response, NextFunction } from 'express';
import { GraniteService } from '../services/granite.service';
import { Logger } from '../utils/logger';

const router = Router();
const graniteService = new GraniteService();

/**
 * POST /api/granite/test
 * Accepts a football question, queries Granite, returns formatted response.
 */
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req as any).traceId || 'unknown-trace';
  const { question } = req.body;

  if (!question) {
    Logger.warn('Test endpoint query validation failed: missing question', { trace_id: traceId });
    return res.status(400).json({
      success: false,
      error: {
        message: 'The "question" field is required in the JSON body.'
      }
    });
  }

  const startTime = Date.now();
  try {
    const responseData = await graniteService.queryTutor(question, 'default-session', traceId);
    const duration = Date.now() - startTime;

    Logger.info('Tutor query completed successfully', {
      trace_id: traceId,
      latency_ms: duration,
      concept_id: (responseData.data as any).concept_id || 'needs_clarification'
    });

    res.json(responseData);
  } catch (err: any) {
    next(err);
  }
});

/**
 * GET /api/granite/ping
 * Performs a fast connectivity check with the IBM Cloud endpoints.
 */
router.get('/ping', async (req: Request, res: Response, next: NextFunction) => {
  const traceId = (req as any).traceId || 'unknown-trace';
  const startTime = Date.now();

  try {
    const isOnline = await graniteService.pingConnectivity(traceId);
    const duration = Date.now() - startTime;

    if (isOnline) {
      Logger.info('Connection ping check succeeded', { trace_id: traceId, latency_ms: duration });
      res.json({
        success: true,
        latency_ms: duration,
        message: 'Successfully established communication with IBM watsonx.ai Granite endpoint.'
      });
    } else {
      Logger.warn('Connection ping check failed', { trace_id: traceId, latency_ms: duration });
      res.status(502).json({
        success: false,
        latency_ms: duration,
        error: {
          message: 'Failed to authenticate or connect to IBM watsonx.ai.'
        }
      });
    }
  } catch (err: any) {
    next(err);
  }
});

export default router;
