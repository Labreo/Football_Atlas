import { Request, Response } from 'express';
import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';
import { footballAtlasMCPServer } from '../services/mcpServer.service';

type InferenceProvider = 'OPENROUTER' | 'WATSONX' | 'HUGGINGFACE' | 'MOCK';

interface ProviderHealth { ok: boolean; status: 'UP' | 'DOWN'; detail?: string; provider: InferenceProvider }

function getActiveInferenceProvider(): ProviderHealth {
  const key = envConfig.ibmApiKey;
  const baseUrl = envConfig.ibmBaseUrl;
  const isMockMode = !key || key === 'mock-key-for-local-testing' || key.toLowerCase().includes('mock');
  const isOpenRouterMode = !!key && (key.startsWith('sk-or-') || baseUrl.includes('openrouter.ai'));
  const isHFMode = !!key && key.startsWith('hf_') && !isOpenRouterMode;

  if (isOpenRouterMode) {
    return { ok: false, status: 'DOWN', provider: 'OPENROUTER', detail: 'OpenRouter provider detected; connectivity has not yet been verified.' };
  }

  if (isHFMode) {
    return { ok: false, status: 'DOWN', provider: 'HUGGINGFACE', detail: 'Hugging Face provider detected; connectivity has not yet been verified.' };
  }

  if (isMockMode) {
    return { ok: true, status: 'UP', provider: 'MOCK', detail: 'Mock provider mode detected; local fallback responses are active.' };
  }

  return { ok: false, status: 'DOWN', provider: 'WATSONX', detail: 'IBM watsonx provider detected; IAM validation has not yet been verified.' };
}

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

async function checkOpenRouterConnectivity(): Promise<{ ok: boolean; detail?: string }> {
  const baseUrl = envConfig.ibmBaseUrl.startsWith('http') ? envConfig.ibmBaseUrl.replace(/\/$/, '') : `https://${envConfig.ibmBaseUrl.replace(/\/$/, '')}`;
  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${envConfig.ibmApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: envConfig.ibmGraniteModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return { ok: false, detail: `OpenRouter responded ${resp.status} ${resp.statusText}` };
    }

    return { ok: true };
  } catch (err: any) {
    clearTimeout(timeout);
    Logger.warn('OpenRouter health check failed', { err: String(err) });
    return { ok: false, detail: String(err) };
  }
}

async function checkHfConnectivity(): Promise<{ ok: boolean; detail?: string }> {
  const baseUrl = envConfig.ibmBaseUrl.startsWith('http') ? envConfig.ibmBaseUrl.replace(/\/$/, '') : `https://${envConfig.ibmBaseUrl.replace(/\/$/, '')}`;
  const url = `${baseUrl}/models/${envConfig.ibmGraniteModel}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${envConfig.ibmApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: 'ping', parameters: { max_new_tokens: 1 } }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return { ok: false, detail: `Hugging Face responded ${resp.status} ${resp.statusText}` };
    }

    return { ok: true };
  } catch (err: any) {
    clearTimeout(timeout);
    Logger.warn('Hugging Face health check failed', { err: String(err) });
    return { ok: false, detail: String(err) };
  }
}

async function checkProvider(): Promise<ProviderHealth> {
  const providerHealth = getActiveInferenceProvider();

  switch (providerHealth.provider) {
    case 'OPENROUTER': {
      const connectivity = await checkOpenRouterConnectivity();
      return {
        provider: 'OPENROUTER',
        ok: connectivity.ok,
        status: connectivity.ok ? 'UP' : 'DOWN',
        detail: connectivity.detail
      };
    }
    case 'HUGGINGFACE': {
      const connectivity = await checkHfConnectivity();
      return {
        provider: 'HUGGINGFACE',
        ok: connectivity.ok,
        status: connectivity.ok ? 'UP' : 'DOWN',
        detail: connectivity.detail
      };
    }
    case 'WATSONX': {
      const iam = await checkIamToken();
      return {
        provider: 'WATSONX',
        ok: iam.ok,
        status: iam.ok ? 'UP' : 'DOWN',
        detail: iam.detail
      };
    }
    default:
      return {
        provider: 'MOCK',
        ok: true,
        status: 'UP',
        detail: 'No live inference provider configured; mock mode is active.'
      };
  }
}

async function checkMcp(): Promise<{ ok: boolean; mode: 'local' | 'external'; registeredTools: string[]; detail?: string }> {
  const mcpUrl = envConfig.mcpServerUrl;
  if (!mcpUrl) {
    // Local mode — return registered tools from in-process MCP server
    try {
      const localTools = footballAtlasMCPServer.listTools().map((t) => t.name);
      return { ok: true, mode: 'local', registeredTools: localTools };
    } catch (err: any) {
      Logger.warn('Local MCP check failed', { err: String(err) });
      return { ok: false, mode: 'local', registeredTools: [], detail: String(err) };
    }
  }

  const probe = mcpUrl.endsWith('/') ? `${mcpUrl}health` : `${mcpUrl}/health`;
  const toolsEndpoint = mcpUrl.endsWith('/') ? `${mcpUrl}tools` : `${mcpUrl}/tools`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const resp = await fetch(probe, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (!resp.ok) return { ok: false, mode: 'external', registeredTools: [], detail: `MCP health responded ${resp.status}` };

    // Fetch registered tools list
    try {
      const tResp = await fetch(toolsEndpoint, { method: 'GET', signal: AbortSignal.timeout(4000) });
      if (!tResp.ok) return { ok: true, mode: 'external', registeredTools: [], detail: `MCP /tools returned ${tResp.status}` };
      const data = await tResp.json();
      const remoteNames = Array.isArray(data) ? data.map((t: any) => t.name) : [];
      return { ok: true, mode: 'external', registeredTools: remoteNames };
    } catch (tErr: any) {
      Logger.warn('Failed to fetch MCP /tools', { err: String(tErr) });
      return { ok: true, mode: 'external', registeredTools: [], detail: String(tErr) };
    }
  } catch (err: any) {
    clearTimeout(timeout);
    Logger.warn('MCP health check failed', { err: String(err) });
    return { ok: false, mode: 'external', registeredTools: [], detail: String(err) };
  }
}

export const getHealth = async (_req: Request, res: Response) => {
  const start = Date.now();
  const env = process.env.NODE_ENV || 'development';

  const [providerHealth, mcpResult] = await Promise.all([checkProvider(), checkMcp()]);
  const providerStatus = providerHealth.ok ? 'UP' : 'DOWN';
  const mcpStatus = mcpResult.ok ? 'UP' : 'DOWN';
  const overallOk = providerHealth.ok && mcpResult.ok;

  const payload: any = {
    status: overallOk ? 'UP' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env,
    checks: {
      provider: {
        name: providerHealth.provider,
        status: providerStatus,
        detail: providerHealth.detail
      },
      watsonx: providerHealth.provider === 'WATSONX'
        ? { status: providerStatus, detail: providerHealth.detail }
        : { status: 'SKIPPED', detail: `Provider ${providerHealth.provider} active; IAM validation not applicable.` },
      mcp: {
        mode: mcpResult.mode,
        status: mcpStatus,
        registeredTools: mcpResult.registeredTools || [],
        detail: mcpResult.detail || undefined
      },
      database: { status: 'NOT_CONFIGURED' }
    },
    latency_ms: Date.now() - start
  };

  res.status(overallOk ? 200 : 503).json(payload);
};
