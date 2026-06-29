import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend root directory .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export function validateEnv(): void {
  const ibmKey = process.env.IBM_API_KEY || '';
  const hasLiveProvider = ibmKey && !ibmKey.toLowerCase().includes('mock') && !ibmKey.toLowerCase().includes('test') && ibmKey.trim() !== 'example';

  if (!hasLiveProvider) {
    console.warn('Starting in local/mock mode because IBM_API_KEY is missing or placeholder-like.');
    return;
  }

  const requiredEnv = ['IBM_API_KEY', 'IBM_PROJECT_ID', 'IBM_GRANITE_MODEL', 'IBM_BASE_URL'];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('\n================================================================');
    console.error('❌ CRITICAL STARTUP ERROR: Missing Environment Variables');
    console.error('================================================================');
    missing.forEach(key => console.error(`  - ${key} is required but undefined`));
    console.error('================================================================');
    console.error('Please define these values in your backend/.env file.');
    console.error('Refer to backend/.env.example for guidance.\n');
    process.exit(1);
  }
}

export const envConfig = {
  ibmApiKey: process.env.IBM_API_KEY || '',
  ibmProjectId: process.env.IBM_PROJECT_ID || '',
  ibmGraniteModel: process.env.IBM_GRANITE_MODEL || 'ibm/granite-13b-chat-v2',
  ibmBaseUrl: process.env.IBM_BASE_URL || 'us-south.ml.cloud.ibm.com',
  mcpServerUrl: process.env.MCP_SERVER_URL || '',
  sentryDsn: process.env.SENTRY_DSN || '',
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development'
};
