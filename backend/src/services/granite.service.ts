import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';
import { parseGraniteJson } from '../utils/jsonParser';
import { GraniteTestResponse, FootballConceptData, ConversationContext } from '../types/granite.types';
import { TUTOR_SYSTEM_PROMPT } from '../prompts/tutor.prompt';
import { ComplexityLevel } from '@football-atlas/shared';

export class GraniteService {
  private static cachedToken: string | null = null;
  private static tokenExpiry: number = 0;

  // Track simple session memory mapping for future multi-turn support
  private static conversationMemory: Record<string, ConversationContext> = {};

  private isMockMode: boolean;
  private isHFMode: boolean;

  constructor() {
    const key = envConfig.ibmApiKey;
    this.isMockMode = !key || key === 'mock-key-for-local-testing' || key.toLowerCase().includes('mock');
    this.isHFMode = !!key && key.startsWith('hf_');
    if (this.isHFMode) {
      this.isMockMode = false;
    }
  }

  /**
   * Retrieves and caches the Watsonx IAM OAuth token.
   */
  private async getAccessToken(traceId: string): Promise<string> {
    if (GraniteService.cachedToken && Date.now() < GraniteService.tokenExpiry) {
      return GraniteService.cachedToken;
    }

    Logger.info('IAM token expired or absent. Requesting fresh token from IBM Cloud...', { trace_id: traceId });
    const startTime = Date.now();

    try {
      const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
          apikey: envConfig.ibmApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error(`IAM Auth API rejected credentials: ${response.statusText} (${response.status})`);
      }

      const data = (await response.json()) as { access_token: string; expires_in: number };
      GraniteService.cachedToken = data.access_token;
      // Subtract 5 minutes from expiry for safety margin
      GraniteService.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

      Logger.info('IAM Token successfully generated and cached.', {
        trace_id: traceId,
        latency_ms: Date.now() - startTime,
      });

      return GraniteService.cachedToken;
    } catch (err: any) {
      Logger.error('Failed to retrieve IBM OAuth Token', err, { trace_id: traceId });
      throw err;
    }
  }

  /**
   * Calls Watsonx prediction generation endpoints with retries, timeouts, and fallback routing.
   */
  public async queryTutor(
    question: string,
    conversationId: string = 'default-session',
    traceId: string = 'system-request'
  ): Promise<GraniteTestResponse> {
    const startTime = Date.now();
    
    // Resolve session context history
    const context = this.getOrCreateContext(conversationId);
    context.last_questions.push(question);

    // 1. Trigger mock completion if in Mock Mode
    if (this.isMockMode) {
      Logger.warn('IBM_API_KEY is not set or is a mock key — running in MOCK mode. Responses are NOT from a real AI model.', { trace_id: traceId });
      const latency = Math.floor(Math.random() * 400) + 200;
      await new Promise((r) => setTimeout(r, latency));
      const mockResult = this.generateMockResponse(question, context);

      return {
        success: true,
        is_mocked: true,
        mode: 'mock',
        latency_ms: Date.now() - startTime,
        data: mockResult,
      };
    }

    // 2. Trigger Hugging Face API if in Hugging Face mode
    if (this.isHFMode) {
      try {
        Logger.info('Querying Hugging Face Serverless Inference endpoint...', {
          trace_id: traceId,
          model: envConfig.ibmGraniteModel,
        });

        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        const promptText = `<|system|>\n${TUTOR_SYSTEM_PROMPT}\n<|user|>\n${question}\n<|assistant|>\n`;

        const payload = {
          inputs: promptText,
          parameters: {
            max_new_tokens: 500,
            return_full_text: false,
            temperature: 0.1,
          },
        };

        const response = await this.fetchWithRetryAndTimeout(
          url,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${envConfig.ibmApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          },
          3,
          15000,
          traceId
        );

        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(`Hugging Face API returned error ${response.status}: ${errMsg}`);
        }

        const data = await response.json();
        let rawText = '';
        if (Array.isArray(data) && data[0]?.generated_text) {
          rawText = data[0].generated_text;
        } else if (data && typeof data === 'object' && 'generated_text' in data) {
          rawText = (data as any).generated_text;
        } else {
          throw new Error(`Unexpected Hugging Face response structure: ${JSON.stringify(data)}`);
        }

        const parsedData = parseGraniteJson(rawText, traceId);

        if (parsedData && !parsedData.needs_clarification && parsedData.concept_id) {
          context.last_concepts.push(parsedData.concept_id);
          context.user_level = parsedData.user_level as ComplexityLevel;
        }

        return {
          success: true,
          is_mocked: false,
          mode: 'live',
          latency_ms: Date.now() - startTime,
          data: parsedData,
        };

      } catch (err: any) {
        Logger.warn(`Hugging Face API error: ${err.message}. Falling back to local mock generator. Responses are NOT from a real AI model.`, {
          trace_id: traceId,
        });
        const mockResult = this.generateMockResponse(question, context);
        return {
          success: true,
          is_mocked: true,
          mode: 'mock',
          latency_ms: Date.now() - startTime,
          data: mockResult,
        };
      }
    }

    // 3. Perform production IBM Cloud call
    try {
      const token = await this.getAccessToken(traceId);
      const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;
      
      const promptText = `<|system|>\n${TUTOR_SYSTEM_PROMPT}\n<|user|>\n${question}\n<|assistant|>\n`;

      const payload = {
        model_id: envConfig.ibmGraniteModel,
        input: promptText,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 500,
          min_new_tokens: 1,
          stop_sequences: ['<|endoftext|>'],
          repetition_penalty: 1.05,
        },
        project_id: envConfig.ibmProjectId,
      };

      Logger.info(`Sending generation query to watsonx.ai model: ${envConfig.ibmGraniteModel}`, {
        trace_id: traceId,
        project_id: envConfig.ibmProjectId,
      });

      const response = await this.fetchWithRetryAndTimeout(
        url,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        },
        3, // 3 retries
        15000, // 15-second timeout
        traceId
      );

      if (!response.ok) {
        throw new Error(`Watsonx API returned error code ${response.status}: ${response.statusText}`);
      }

      const body = (await response.json()) as { results?: Array<{ generated_text: string }> };
      const rawText = body.results?.[0]?.generated_text || '';
      
      // Parse generated output to JSON structure
      const parsedData = parseGraniteJson(rawText, traceId);

      // Track active concept memory
      if (parsedData && !parsedData.needs_clarification && parsedData.concept_id) {
        context.last_concepts.push(parsedData.concept_id);
        context.user_level = parsedData.user_level as ComplexityLevel;
      }

      return {
        success: true,
        is_mocked: false,
        mode: 'live',
        latency_ms: Date.now() - startTime,
        data: parsedData,
      };

    } catch (err: any) {
      Logger.warn(`IBM Granite API error: ${err.message}. Falling back to local mock generator. Responses are NOT from a real AI model.`, {
        trace_id: traceId,
      });

      const mockResult = this.generateMockResponse(question, context);
      return {
        success: true,
        is_mocked: true,
        mode: 'mock',
        latency_ms: Date.now() - startTime,
        data: mockResult,
      };
    }
  }

  /**
   * Helper that fetches with timeout and retries on 5xx errors.
   */
  private async fetchWithRetryAndTimeout(
    url: string,
    options: RequestInit,
    retries: number,
    timeoutMs: number,
    traceId: string
  ): Promise<Response> {
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      
      const reqOptions = { ...options, signal: controller.signal };

      try {
        const res = await fetch(url, reqOptions);
        clearTimeout(id);

        if (res.ok) return res;
        
        // Retry only on server errors (500, 502, 503, 504)
        if (res.status >= 500 && i < retries - 1) {
          Logger.warn(`Watsonx returned transient error ${res.status}. Retrying in ${delay}ms...`, {
            trace_id: traceId,
            attempt: i + 1,
          });
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2;
          continue;
        }

        return res;
      } catch (err: any) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
          Logger.warn(`Request timed out after ${timeoutMs}ms.`, { trace_id: traceId, attempt: i + 1 });
        } else {
          Logger.warn(`Network fail: ${err.message}`, { trace_id: traceId, attempt: i + 1 });
        }

        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }

    throw new Error('Retries exhausted');
  }

  /**
   * Checks IBM connectivity with a quick, lightweight request.
   */
  public async pingConnectivity(traceId: string): Promise<boolean> {
    if (this.isMockMode) return true;

    if (this.isHFMode) {
      try {
        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.ibmApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: 'ping',
            parameters: { max_new_tokens: 1 },
          }),
          signal: AbortSignal.timeout(6000),
        });
        return res.ok;
      } catch (err: any) {
        Logger.error('Hugging Face ping connectivity check failed', err, { trace_id: traceId });
        return false;
      }
    }

    try {
      const token = await this.getAccessToken(traceId);
      const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;
      
      const payload = {
        model_id: envConfig.ibmGraniteModel,
        input: 'ping',
        parameters: { max_new_tokens: 1 },
        project_id: envConfig.ibmProjectId,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000), // 6-second quick check
      });

      return res.ok;
    } catch (err: any) {
      Logger.error('Ping connectivity check failed', err, { trace_id: traceId });
      return false;
    }
  }

  /**
   * Resolves or initializes session memory.
   */
  private getOrCreateContext(conversationId: string): ConversationContext {
    if (!GraniteService.conversationMemory[conversationId]) {
      GraniteService.conversationMemory[conversationId] = {
        conversation_id: conversationId,
        last_questions: [],
        last_concepts: [],
        user_level: ComplexityLevel.BEGINNER,
      };
    }
    return GraniteService.conversationMemory[conversationId];
  }

  /**
   * Evaluates user question against concept tags and returns high-fidelity fallback objects.
   */
  private generateMockResponse(question: string, context: ConversationContext): any {
    const q = question.toLowerCase();

    // Mapping keyword heuristics (with typo-tolerance)
    let matchedConcept = '';
    if (q.includes('false 9') || q.includes('false9') || q.includes('flase 9') || q.includes('flase9') || q.includes('dropped striker')) {
      matchedConcept = 'false_9';
    } else if (q.includes('high press') || q.includes('gegenpress') || q.includes('gegen press') || q.includes('pressing high')) {
      matchedConcept = 'high_press';
    } else if (q.includes('trap') || q.includes('pressing trap')) {
      matchedConcept = 'pressing_trap';
    } else if (q.includes('overload') || q.includes('midfield overload')) {
      matchedConcept = 'midfield_overload';
    } else if (q.includes('low block') || q.includes('lowblock') || q.includes('defending deep') || q.includes('compact block')) {
      matchedConcept = 'low_block';
    } else if (q.includes('counter') || q.includes('transition') || q.includes('counter-attack') || q.includes('counter attack')) {
      matchedConcept = 'counter_attack';
    } else if (q.includes('inverted') || q.includes('winger') || q.includes('cut inside')) {
      matchedConcept = 'inverted_winger';
    } else if (q.includes('back three') || q.includes('back 3') || q.includes('wingback')) {
      matchedConcept = 'back_three';
    } else if (q.includes('third man') || q.includes('off-ball run') || q.includes('third-man')) {
      matchedConcept = 'third_man_run';
    } else if (q.includes('compactness') || q.includes('compact') || q.includes('lines') || q.includes('vertical distance')) {
      matchedConcept = 'compactness';
    }

    // Adapt user level based on keyword signals
    if (q.includes('zone 14') || q.includes('half-space')) {
      context.user_level = ComplexityLevel.ADVANCED;
    } else if (q.includes('trigger') || q.includes('structure')) {
      context.user_level = ComplexityLevel.INTERMEDIATE;
    }

    if (!matchedConcept) {
      // Context-aware fallback: if the user typed a typo or follow-up, use the last discussed concept!
      if (context.last_concepts.length > 0) {
        matchedConcept = context.last_concepts[context.last_concepts.length - 1];
      } else {
        return {
          needs_clarification: true,
          clarification_question: 'Are you asking about pressing high up the pitch (High Press) or defending deep (Low Block)?',
        };
      }
    }

    // Store concept memory
    context.last_concepts.push(matchedConcept);

    const mockDatabase: Record<string, { name: string; complexity: ComplexityLevel; module: string; text: string; suggestions: string[] }> = {
      false_9: {
        name: 'False 9',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'false9',
        text: 'The False 9 is a striker who drops deep into central midfield, pulling the opposing center-backs out of position. This spatial disruption vacates channels behind the defensive line for inverted wingers to exploit.',
        suggestions: ['What happens if the defender follows the False 9?', 'Show a match example of Messi', 'How does it connect to third man runs?'],
      },
      high_press: {
        name: 'High Press',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'highPress',
        text: 'A high press applies aggressive pressure on the opponent center-backs close to their own goal, forcing hurried clearances or bad passes to win possession high up.',
        suggestions: ['What is a pressing trap?', 'How do you bypass a high press?', 'Show Klopp\'s Liverpool triggers'],
      },
      pressing_trap: {
        name: 'Pressing Trap',
        complexity: ComplexityLevel.ADVANCED,
        module: 'pressingTrap',
        text: 'A pressing trap intentionally leaves a specific passing channel open, inviting the ball inside before closing down the target simultaneously with multiple defenders.',
        suggestions: ['What are pressing triggers?', 'What is a cover shadow?', 'Show Mourinho\'s Inter Milan setups'],
      },
      midfield_overload: {
        name: 'Overload in Midfield',
        complexity: ComplexityLevel.ADVANCED,
        module: 'midfieldOverload',
        text: 'Creating numerical superiority in central midfield (e.g., 4v3) by dropping attackers or bringing inverted fullbacks inside to dominate possession and progress play.',
        suggestions: ['What is an inverted fullback?', 'How does a back 3 help overload?', 'Show Guardiola\'s box midfield'],
      },
      low_block: {
        name: 'Defensive Block (Low Block)',
        complexity: ComplexityLevel.BEGINNER,
        module: 'lowBlock',
        text: 'A deep, compact defensive shape where all players drop close to their own box, minimizing space behind and protecting central corridors.',
        suggestions: ['How do you break down a low block?', 'What is compactness?', 'Show Chelsea\'s 2012 UCL block'],
      },
      counter_attack: {
        name: 'Counter-Attack',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'counterTrigger',
        text: 'An immediate shift from defending to attacking upon winning possession, moving the ball forward quickly before the opponent can reorganize.',
        suggestions: ['What are transition zones?', 'Show Leicester\'s 2016 Vardy counter', 'What is counter-pressing?'],
      },
      inverted_winger: {
        name: 'Inverted Winger',
        complexity: ComplexityLevel.BEGINNER,
        module: 'invertedWinger',
        text: 'A wide attacking player positioned on the side opposite their dominant foot, enabling them to cut inside to shoot or pass, rather than cross.',
        suggestions: ['Show Robben\'s classic cut-inside move', 'How does this create overlapping lanes?', 'What is the difference with inside forwards?'],
      },
      back_three: {
        name: 'Back 3 / Wing-Back System',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'back3Wingbacks',
        text: 'A formation using three center-backs and two advanced wing-backs, combining defensive stability with wide attacking options.',
        suggestions: ['How does a back 3 transition in defense?', 'Show Conte\'s Chelsea systems', 'What are the spacing demands on centerbacks?'],
      },
      third_man_run: {
        name: 'Off-Ball Movement & Third Man Run',
        complexity: ComplexityLevel.ADVANCED,
        module: 'thirdManRun',
        text: 'An attacking pattern where Player A passes to Player B to draw markers, while Player C makes a run to receive a one-touch pass from Player B.',
        suggestions: ['What is positional play?', 'Show Xavi/Messi combinations', 'How do you defend off-ball runs?'],
      },
      compactness: {
        name: 'Compactness & Pressing Lines',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'compactnessPressing',
        text: 'The distance between the forward pressing line and the back line, kept short (10-15m) to limit central passing options.',
        suggestions: ['What is a block height?', 'Show Simeone\'s Atletico Madrid shape', 'What happens if lines stretch?'],
      },
    };

    const concept = mockDatabase[matchedConcept];
    return {
      needs_clarification: false,
      concept_id: matchedConcept,
      concept_name: concept.name,
      complexity: concept.complexity,
      user_level: context.user_level,
      animation_module: concept.module,
      explanation: concept.text,
      follow_up_suggestions: concept.suggestions,
    };
  }
}
