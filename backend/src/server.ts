import app from './app';
import { validateEnv, envConfig } from './config/env.config';
import { Logger } from './utils/logger';
import * as Sentry from '@sentry/node';
import { verifyAndRegisterTools } from './services/mcpRegistration.service';

// Fail fast at startup if critical variables are entirely missing (triggered reload)
validateEnv();

// Initialize Sentry if DSN provided
if (envConfig.sentryDsn) {
  Sentry.init({ dsn: envConfig.sentryDsn, environment: envConfig.nodeEnv });
  Logger.info('Sentry initialized for error monitoring');
}

const PORT = envConfig.port;

async function start() {
  // Verify MCP registration before accepting traffic in production
  const result = await verifyAndRegisterTools();
  if (!result.ok) {
    Logger.error('MCP registration verification failed. Aborting startup.', { detail: result.detail });
    process.exit(1);
  }

  app.listen(PORT, () => {
    Logger.info('⚽ Football Atlas AI Tutor API Server successfully started.', {
      port: PORT,
      environment: envConfig.nodeEnv,
      granite_model: envConfig.ibmGraniteModel,
      api_base: envConfig.ibmBaseUrl
    });
  });
}

start().catch((err) => {
  Logger.error('Startup failed', err);
  process.exit(1);
});
