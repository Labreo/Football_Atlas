import app from './app';
import { validateEnv, envConfig } from './config/env.config';
import { Logger } from './utils/logger';

// Fail fast at startup if critical variables are entirely missing
validateEnv();

const PORT = envConfig.port;

app.listen(PORT, () => {
  Logger.info('⚽ Football Atlas AI Tutor API Server successfully started.', {
    port: PORT,
    environment: envConfig.nodeEnv,
    granite_model: envConfig.ibmGraniteModel,
    api_base: envConfig.ibmBaseUrl
  });
});
