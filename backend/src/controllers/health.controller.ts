import { Request, Response } from 'express';
import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';

async function checkIamToken(): Promise<{ ok: boolean; detail?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const body = new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: envConfig.ibmApiKey
    });
    const resp = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!resp.ok) {
      return { ok: false, detail: `IAM responded ${resp.status} ${resp.statusText}` };
    }
    const data = await resp.json();
    if (data && data.access_token) {
      return { ok: true };
    }
    return { ok: false, detail: 'No access_token in IAM response' };
  } catch (err: any) {
    clearTimeout(timeout);
    Logger.warn('IAM health check failed', { err: String(err) });
    return { ok: false, detail: String(err) };
  }
}

async function checkMcp(): Promise<{ ok: boolean; detail?: string }> {
  const mcpUrl = envConfig.mcpServerUrl;
  if (!mcpUrl) return { ok: false, detail: 'MCP_SERVER_URL not configured' };
  const probe = mcpUrl.endsWith('/') ? `${mcpUrl}health` : `${mcpUrl}/health`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const resp = await fetch(probe, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return { ok: false, detail: `MCP responded ${resp.status}` };
    return { ok: true };
  } catch (err: any) {
    clearTimeout(timeout);
    Logger.warn('MCP health check failed', { err: String(err) });
    return { ok: false, detail: String(err) };
  }
}

export const getHealth = async (_req: Request, res: Response) => {
  const start = Date.now();
  const env = process.env.NODE_ENV || 'development';

  // Run external checks in parallel but with sensible timeouts
  const [iam, mcp] = await Promise.all([checkIamToken(), checkMcp()]);

  const overallOk = iam.ok && mcp.ok;

  const payload = {
    status: overallOk ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env,
    checks: {
      watsonx: iam.ok ? { status: 'UP' } : { status: 'DOWN', detail: iam.detail },
      mcp: mcp.ok ? { status: 'UP' } : { status: 'DOWN', detail: mcp.detail },
      database: { status: 'NOT_CONFIGURED' }
    },
    latency_ms: Date.now() - start
  };

  res.status(overallOk ? 200 : 503).json(payload);
};
