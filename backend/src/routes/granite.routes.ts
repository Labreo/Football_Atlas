import { Router, Request, Response, NextFunction } from 'express';
import { GraniteService } from '../services/granite.service';
import { Logger } from '../utils/logger';

export const createGraniteRouter = (graniteService = new GraniteService()) => {
  const router = Router();

  /**
   * POST /api/granite/test
   * Accepts a football question, queries Granite, returns formatted response.
   */
  router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req as any).traceId || 'unknown-trace';
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      Logger.warn('Test endpoint query validation failed: invalid question payload', { trace_id: traceId });
      return res.status(400).json({
        success: false,
        error: {
          message: 'The "question" field is required in the JSON body and must be a non-empty string.'
        }
      });
    }

    const startTime = Date.now();
    try {
      const responseData = await graniteService.queryTutor(question.trim(), 'default-session', traceId);
      const duration = Date.now() - startTime;
      const responseDataAny = responseData as any;
      const conceptId = responseDataAny?.data?.concept_id || 'unknown';

      Logger.info('Tutor query completed successfully', {
        trace_id: traceId,
        latency_ms: duration,
        concept_id: conceptId
      });

      if (!responseData) {
        return res.status(502).json({
          success: false,
          error: {
            message: 'Granite service returned an empty response.'
          }
        });
      }

      if (responseDataAny.success === false) {
        return res.status(502).json(responseData);
      }

      if (responseDataAny.success === true) {
        if (!responseDataAny.data) {
          return res.status(502).json({
            success: false,
            error: {
              message: 'Granite service returned a successful response without response data.'
            }
          });
        }

        if (!responseDataAny.data.concept_id) {
          responseDataAny.data.concept_id = 'unknown';
        }
      }

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

  return router;
};

export default createGraniteRouter();
