import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');
const loaded = dotenv.config({ path: envPath });
if (loaded.error) {
  console.warn(`Warning: failed to load backend/.env: ${loaded.error}`);
}

const maskKey = (key?: string) => {
  if (!key) return '<missing>';
  if (key.length <= 8) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

const env = process.env;
const ibmApiKey = env.IBM_API_KEY?.trim();
const ibmProjectId = env.IBM_PROJECT_ID?.trim();
const ibmGraniteModel = env.IBM_GRANITE_MODEL?.trim();
const ibmBaseUrl = (env.IBM_URL || env.IBM_BASE_URL || '').trim();
const ibmRegion = env.IBM_REGION?.trim();

const detectedMode = ibmApiKey?.startsWith('sk-or-')
  ? 'OpenRouter-style key (not IBM IAM)'
  : ibmApiKey?.startsWith('hf_')
  ? 'HuggingFace-style key'
  : 'IBM Watsonx-style key';

const authUrl = 'https://iam.cloud.ibm.com/identity/token';
const version = '2023-05-29';

const logSection = (title: string) => {
  console.log('\n' + '='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
};

const ensure = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

async function authenticate(): Promise<{ token?: string; expiresIn?: number; error?: string }> {
  if (!ibmApiKey) {
    return { error: 'IBM_API_KEY is not set' };
  }

  const body = new URLSearchParams({
    grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
    apikey: ibmApiKey,
  });

  try {
    const start = Date.now();
    const resp = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const latency = Date.now() - start;

    if (!resp.ok) {
      const text = await resp.text();
      return { error: `IAM auth failed: ${resp.status} ${resp.statusText} - ${text}` };
    }

    const data = await resp.json();
    const token = data.access_token as string | undefined;
    const expiresIn = data.expires_in as number | undefined;

    if (!token) {
      return { error: 'IAM auth succeeded but access_token was missing from response' };
    }

    return { token, expiresIn, error: undefined, latency_ms: latency } as any;
  } catch (err: any) {
    return { error: `IAM auth request failed: ${err.message || err}` };
  }
}

async function verifyGranite(token: string): Promise<{ ok: boolean; latencyMs: number; detail: string; responseText?: string }> {
  const baseUrl = ibmBaseUrl || 'us-south.ml.cloud.ibm.com';
  const url = `https://${baseUrl}/ml/v1/text/generation?version=${version}`;

  const prompt = 'Ping. Please reply with only the single word PONG.';
  const payload = {
    model_id: ibmGraniteModel || 'ibm/granite-13b-chat-v2',
    project_id: ibmProjectId || 'unknown',
    input: prompt,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: 10,
      temperature: 0,
      min_new_tokens: 1,
      stop_sequences: ['\n'],
    },
  };

  try {
    const start = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const latencyMs = Date.now() - start;
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        latencyMs,
        detail: `Watsonx Granite request failed: ${response.status} ${response.statusText}`,
        responseText: text,
      };
    }
    return {
      ok: true,
      latencyMs,
      detail: 'Success',
      responseText: text,
    };
  } catch (err: any) {
    return {
      ok: false,
      latencyMs: -1,
      detail: `Watsonx Granite request error: ${err.message || err}`,
    };
  }
}

async function main() {
  logSection('Watsonx Validation Diagnostic');

  console.log(`Environment file loaded: ${envPath}`);
  console.table({
    IBM_API_KEY: maskKey(ibmApiKey),
    IBM_PROJECT_ID: ibmProjectId || '<missing>',
    IBM_GRANITE_MODEL: ibmGraniteModel || '<missing>',
    IBM_URL: env.IBM_URL || '<unset>',
    IBM_BASE_URL: env.IBM_BASE_URL || '<unset>',
    IBM_REGION: ibmRegion || '<unset>',
    detected_key_style: ibmApiKey ? detectedMode : '<missing key>',
  });

  if (!ibmApiKey) {
    console.error('ERROR: IBM_API_KEY is required for Watsonx IAM validation.');
    process.exit(1);
  }

  if (ibmApiKey.startsWith('sk-or-')) {
    console.warn('WARNING: Detected an OpenRouter-style API key. This key will not authenticate with IBM Cloud IAM.');
  }
  if (ibmApiKey.startsWith('hf_')) {
    console.warn('WARNING: Detected a HuggingFace-style API key. This key will not authenticate with IBM Cloud IAM.');
  }

  logSection('IAM Authentication Check');
  const auth = await authenticate();

  if (auth.error) {
    console.error(`Authentication Status: FAILED`);
    console.error(`Detail: ${auth.error}`);
    process.exitCode = 2;
  } else {
    console.log(`Authentication Status: SUCCESS`);
    console.log(`Token expires in: ${auth.expiresIn ?? 'unknown'} seconds`);
  }

  if (!auth.token) {
    console.error('Cannot continue to Granite verification without an IAM access token.');
    return;
  }

  logSection('Granite Inference Check');
  const verify = await verifyGranite(auth.token);
  if (!verify.ok) {
    console.error('Granite inference status: FAILED');
    console.error(`Detail: ${verify.detail}`);
    if (verify.responseText) {
      console.error(`Response body: ${verify.responseText}`);
    }
    process.exitCode = 3;
  } else {
    console.log('Granite inference status: SUCCESS');
    console.log(`Response latency: ${verify.latencyMs} ms`);
    try {
      const parsed = JSON.parse(verify.responseText || '{}');
      console.log('Received response payload:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Received raw response body:');
      console.log(verify.responseText);
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error during Watsonx diagnostics:', err);
  process.exit(99);
});
