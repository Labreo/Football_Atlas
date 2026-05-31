import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const traceId = (req as any).traceId || 'system-level';
  
  // Log full error details to stderr stream
  Logger.error('Unhandled request exception caught by global boundary', err, {
    trace_id: traceId,
    path: req.path,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'An internal server error occurred',
      trace_id: traceId
    }
  });
};
