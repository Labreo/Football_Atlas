import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const traceId = Logger.generateTraceId();
  (req as any).traceId = traceId;

  const startTime = Date.now();
  
  // Log request arrival
  Logger.info(`Incoming REST Request: ${req.method} ${req.path}`, {
    trace_id: traceId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined
  });

  // Track completion and compute total request processing time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    Logger.info(`Request Completed: ${req.method} ${req.path} -> ${res.statusCode}`, {
      trace_id: traceId,
      status_code: res.statusCode,
      latency_ms: duration
    });
  });

  next();
};
