import crypto from 'crypto';

export class Logger {
  /**
   * Logs an informational message with structured metadata.
   */
  public static info(message: string, meta?: Record<string, any>): void {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message,
        ...meta
      })
    );
  }

  /**
   * Logs a warning message with structured metadata.
   */
  public static warn(message: string, meta?: Record<string, any>): void {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        ...meta
      })
    );
  }

  /**
   * Logs an error message, stack traces, and relevant context.
   */
  public static error(message: string, error?: Error | any, meta?: Record<string, any>): void {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        error_message: error?.message || String(error),
        stack: error?.stack || null,
        ...meta
      })
    );
  }

  /**
   * Generates a unique trace/correlation ID for request tracking.
   */
  public static generateTraceId(): string {
    return crypto.randomUUID();
  }
}
