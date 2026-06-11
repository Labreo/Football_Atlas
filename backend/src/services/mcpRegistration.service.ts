import { envConfig } from '../config/env.config';
import { footballAtlasMCPServer } from './mcpServer.service';
import { Logger } from '../utils/logger';

export async function verifyAndRegisterTools(): Promise<{ ok: boolean; detail?: string }> {
  const mcpUrl = envConfig.mcpServerUrl;
  if (!mcpUrl) return { ok: false, detail: 'MCP_SERVER_URL not configured' };

  const probe = mcpUrl.endsWith('/') ? `${mcpUrl}tools` : `${mcpUrl}/tools`;
  const registerEndpoint = mcpUrl.endsWith('/') ? `${mcpUrl}tools/register` : `${mcpUrl}/tools/register`;

  try {
    const resp = await fetch(probe, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (resp.ok) {
      const data = await resp.json();
      const remoteNames = Array.isArray(data) ? data.map((t: any) => t.name) : [];
      const localTools = footballAtlasMCPServer.listTools().map((t) => t.name);

      const missing = localTools.filter((n) => !remoteNames.includes(n));
      if (missing.length === 0) {
        Logger.info('MCP registration verified: all tools present on MCP server');
        return { ok: true };
      }
      Logger.warn('MCP server missing tools', { missing });

      // Attempt to register missing tools by POSTing our tool definitions
      const payload = { tools: footballAtlasMCPServer.listTools() };
      try {
        const regResp = await fetch(registerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(7000)
        });

        if (!regResp.ok) {
          Logger.warn('MCP registration endpoint rejected payload', { status: regResp.status });
        } else {
          Logger.info('Attempted to register tools on MCP server');
        }
      } catch (regErr: any) {
        Logger.warn('Failed to POST tool registration to MCP server', { err: String(regErr) });
      }

      // Re-check
      const resp2 = await fetch(probe, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (resp2.ok) {
        const data2 = await resp2.json();
        const remoteNames2 = Array.isArray(data2) ? data2.map((t: any) => t.name) : [];
        const stillMissing = localTools.filter((n) => !remoteNames2.includes(n));
        if (stillMissing.length === 0) {
          Logger.info('MCP registration completed after POST attempt');
          return { ok: true };
        }
        return { ok: false, detail: `Missing tools after register attempt: ${stillMissing.join(', ')}` };
      }
      return { ok: false, detail: `Unable to re-query MCP tools: ${resp2.status}` };
    }

    return { ok: false, detail: `MCP /tools probe returned ${resp.status}` };
  } catch (err: any) {
    Logger.error('MCP registration verification failed', err);
    return { ok: false, detail: String(err) };
  }
}
