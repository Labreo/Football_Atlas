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
  private isOpenRouterMode: boolean;

  constructor() {
    const key = envConfig.ibmApiKey;
    const baseUrl = envConfig.ibmBaseUrl;
    this.isMockMode = !key || key === 'mock-key-for-local-testing' || key.toLowerCase().includes('mock');
    this.isOpenRouterMode = !!key && (key.startsWith('sk-or-') || baseUrl.includes('openrouter.ai'));
    this.isHFMode = !!key && key.startsWith('hf_') && !this.isOpenRouterMode;
    if (this.isHFMode || this.isOpenRouterMode) {
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

    // 2.5. Trigger OpenRouter API if in OpenRouter mode
    if (this.isOpenRouterMode) {
      try {
        Logger.info('Querying OpenRouter API endpoint...', {
          trace_id: traceId,
          model: envConfig.ibmGraniteModel,
        });

        const url = envConfig.ibmBaseUrl.startsWith('http')
          ? `${envConfig.ibmBaseUrl}/chat/completions`
          : `https://${envConfig.ibmBaseUrl}/chat/completions`;

        const payload = {
          model: envConfig.ibmGraniteModel,
          messages: [
            { role: 'system', content: TUTOR_SYSTEM_PROMPT },
            { role: 'user', content: question }
          ],
          temperature: 0.1,
          max_tokens: 500
        };

        const response = await this.fetchWithRetryAndTimeout(
          url,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${envConfig.ibmApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/google-deepmind/football-atlas',
              'X-Title': 'Football Atlas Tactical Tutor'
            },
            body: JSON.stringify(payload),
          },
          3,
          15000,
          traceId
        );

        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(`OpenRouter API returned error ${response.status}: ${errMsg}`);
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || '';

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
        Logger.warn(`OpenRouter API error: ${err.message}. Falling back to local mock generator. Responses are NOT from a real AI model.`, {
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

    if (this.isOpenRouterMode) {
      try {
        const url = envConfig.ibmBaseUrl.startsWith('http')
          ? `${envConfig.ibmBaseUrl}/chat/completions`
          : `https://${envConfig.ibmBaseUrl}/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.ibmApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: envConfig.ibmGraniteModel,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
          signal: AbortSignal.timeout(6000),
        });
        return res.ok;
      } catch (err: any) {
        Logger.error('OpenRouter ping connectivity check failed', err, { trace_id: traceId });
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

    // 1. Resolve matched concept (with typo tolerance and keyword mapping)
    let matchedConcept = '';
    if (q.includes('false 9') || q.includes('false9') || q.includes('flase 9') || q.includes('flase9') || q.includes('dropped striker')) {
      matchedConcept = 'false_9';
    } else if (q.includes('high press') || q.includes('gegenpress') || q.includes('gegen press') || q.includes('pressing high')) {
      matchedConcept = 'high_press';
    } else if (q.includes('pressing trap') || q.includes('press trap') || (q.includes('trap') && q.includes('press'))) {
      matchedConcept = 'pressing_trap';
    } else if (q.includes('overload') || q.includes('midfield overload')) {
      matchedConcept = 'midfield_overload';
    } else if (q.includes('defensive block') || q.includes('defensiveblock') || q.includes('4-4-2 block') || q.includes('442 block') || q.includes('compact block')) {
      matchedConcept = 'defensive_block';
    } else if (q.includes('low block') || q.includes('lowblock') || q.includes('defending deep')) {
      matchedConcept = 'low_block';
    } else if (q.includes('counter') || q.includes('transition') || q.includes('counter-attack') || q.includes('counter attack')) {
      matchedConcept = 'counter_attack';
    } else if (q.includes('inverted') || q.includes('winger') || q.includes('cut inside')) {
      matchedConcept = 'inverted_winger';
    } else if (q.includes('back three') || q.includes('back 3') || q.includes('wingback') || q.includes('wing-back')) {
      matchedConcept = 'back_three';
    } else if (q.includes('third man') || q.includes('off-ball run') || q.includes('third-man')) {
      matchedConcept = 'third_man_run';
    } else if (q.includes('compactness') || q.includes('compact') || q.includes('lines') || q.includes('vertical distance')) {
      matchedConcept = 'compactness';
    }

    // Adapt user level based on keyword signals
    if (q.includes('zone 14') || q.includes('half-space') || q.includes('catenaccio')) {
      context.user_level = ComplexityLevel.ADVANCED;
    } else if (q.includes('trigger') || q.includes('structure') || q.includes('tactical')) {
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

    // 2. Classify Intent
    let intent: 'overview' | 'origin' | 'defense' | 'examples' | 'prosCons' = 'overview';
    if (q.includes('originate') || q.includes('history') || q.includes('invented') || q.includes('where did') || q.includes('who came up') || q.includes('first time') || q.includes('origins') || q.includes('where does') || q.includes('where deos') || q.includes('creator') || q.includes('invent')) {
      intent = 'origin';
    } else if (q.includes('defend') || q.includes('stop') || q.includes('counter') || q.includes('prevent') || q.includes('deal with') || q.includes('combat') || q.includes('neutralize') || q.includes('limit')) {
      intent = 'defense';
    } else if (q.includes('player') || q.includes('example') || q.includes('who played') || q.includes('messi') || q.includes('totti') || q.includes('cruyff') || q.includes('firmino') || q.includes('guardiola') || q.includes('klopp') || q.includes('famous') || q.includes('team') || q.includes('match') || q.includes('coach')) {
      intent = 'examples';
    } else if (q.includes('pro') || q.includes('con') || q.includes('advantage') || q.includes('disadvantage') || q.includes('benefit') || q.includes('strength') || q.includes('weakness') || q.includes('vulnerability') || q.includes('drawback') || q.includes('positive') || q.includes('negative')) {
      intent = 'prosCons';
    }

    const mockDatabase: Record<string, { name: string; complexity: ComplexityLevel; module: string; overview: string; origin: string; defense: string; examples: string; prosCons: string }> = {
      false_9: {
        name: 'False 9',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'false9',
        overview: 'The False 9 is a striker who drops deep into central midfield, pulling the opposing center-backs out of position. This spatial disruption vacates channels behind the defensive line for inverted wingers to exploit.',
        origin: 'The False 9 concept has deep roots, originating in Matthias Sindelar\'s Austrian \'Wunderteam\' (1930s) and Nándor Hidegkuti\'s Hungarian \'Golden Team\' (1950s). Johan Cruyff refined it at Ajax/Barcelona, and Pep Guardiola famously modernized it in 2009 with Lionel Messi in the El Clásico.',
        defense: 'To defend against a False 9, the defensive block must avoid tracking the dropping striker deep. A defensive pivot (holding midfielder) should pick up the False 9 zonal space, allowing the center-backs to maintain their defensive line and cover inverted winger runs.',
        examples: 'Famous examples include Lionel Messi under Pep Guardiola at Barcelona, Francesco Totti in Luciano Spalletti\'s Roma (4-6-0), and Roberto Firmino under Jürgen Klopp at Liverpool.',
        prosCons: 'Pros: Creates midfield numerical superiority (4v3 overload), disrupts traditional defender marking systems, opens deep vertical lanes for wingers. Cons: Lacks physical penalty box presence, struggles to establish depth against very deep low blocks, requires highly disciplined wingers.'
      },
      high_press: {
        name: 'High Press',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'highPress',
        overview: 'A high press applies aggressive pressure on the opponent\'s defenders and goalkeeper close to their own goal, forcing hurried clearances or bad passes to win possession high up the pitch.',
        origin: 'Early variants were developed by Viktor Maslov at Dynamo Kyiv (1960s) and Ernst Happel at Feyenoord. Rinus Michels integrated it into \'Total Football\' in the 1970s, which later evolved into Ralf Rangnick and Jürgen Klopp\'s \'Gegenpressing\' movement.',
        defense: 'Bypassing a high press is done by utilizing direct lofted vertical passes to a physical target man, introducing the goalkeeper as a scanning passing option to create numerical overloads, or using quick third-man combinations on the weak side.',
        examples: 'Famous systems include Jürgen Klopp\'s Dortmund and Liverpool, Pep Guardiola\'s Barcelona and Man City, and Marcelo Bielsa\'s high-octane Athletic Bilbao and Leeds United teams.',
        prosCons: 'Pros: Direct turnovers near the opponent box, disrupts opposing build-up structure, creates psychological pressure. Cons: Extremely demanding physically, leaves vast spaces behind the high defensive line vulnerable to direct long balls.'
      },
      pressing_trap: {
        name: 'Pressing Trap',
        complexity: ComplexityLevel.ADVANCED,
        module: 'pressingTrap',
        overview: 'A pressing trap intentionally leaves a specific passing channel open, inviting the opponent to pass into that zone before closing down the receiver simultaneously with multiple defenders.',
        origin: 'Pressing traps emerged alongside modern zonal systems in the late 1980s, pioneered by Arrigo Sacchi\'s AC Milan. They shifted focus from chasing the ball to manipulating the opponent\'s passing decisions based on visual triggers.',
        defense: 'To break a pressing trap, players must execute rapid, early switches of play to the weak side, use diagonal line-breaking passes, or play direct vertical passes to bypass the traps altogether.',
        examples: 'Diego Simeone\'s Atlético Madrid frequently utilizes sideline traps, forcing teams wide before locking them in. Pep Guardiola\'s teams set central traps to win the ball back in high-density corridors.',
        prosCons: 'Pros: High rate of deterministic ball recovery, keeps defensive structure compact, saves energy compared to constant pressing. Cons: Requires flawless tactical discipline; if a single defender fails to trigger on time, the trap is easily bypassed.'
      },
      midfield_overload: {
        name: 'Overload in Midfield',
        complexity: ComplexityLevel.ADVANCED,
        module: 'midfieldOverload',
        overview: 'Creating numerical superiority in central midfield (e.g., 4v3) by dropping attackers or bringing inverted fullbacks inside to dominate possession and progress play.',
        origin: 'Rooted in Total Football\'s fluid rotations, but highly structured in modern times by Pep Guardiola using inverted full-backs (like Philipp Lahm, João Cancelo) moving into midfield to dominate transition play.',
        defense: 'Defended by shifting into a narrow compact shape (e.g., narrow 4-4-2 or 5-4-1) to block central corridors, or matching the numbers by having wingers tuck inside.',
        examples: 'Pep Guardiola\'s Bayern Munich and Manchester City, Mikel Arteta\'s Arsenal (using Oleksandr Zinchenko).',
        prosCons: 'Pros: Clean progression, dominant possession, control of the game\'s tempo. Cons: Vulnerability on the flanks if possession is lost, physical demands on fullbacks transitions.'
      },
      low_block: {
        name: 'Defensive Block (Low Block)',
        complexity: ComplexityLevel.BEGINNER,
        module: 'lowBlock',
        overview: 'A deep, compact defensive shape where all players drop close to their own box, minimizing space behind and protecting central corridors.',
        origin: 'Evolved from the Italian Catenaccio (door bolt) system in the 1960s (pioneered by Nereo Rocco and Helenio Herrera), and modernly mastered by coaches like José Mourinho and Diego Simeone.',
        defense: 'To break down a low block, teams must circulate the ball quickly horizontally, make third-man runs to stretch lines, or attempt early crosses into the penalty box.',
        examples: 'Diego Simeone\'s Atlético Madrid, Chelsea under José Mourinho (2004-06), and Greece under Otto Rehhagel (Euro 2004).',
        prosCons: 'Pros: Extremely difficult to score against, high defensive stability, space behind line is minimized. Cons: Offensively passive, high fatigue from sliding, surrenders field control.'
      },
      defensive_block: {
        name: 'Defensive Block',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'defensiveBlock',
        overview: 'A structured, compact defensive setup (often in a 4-4-2) designed to protect central space, closing the central corridor and half spaces, forcing the opposition to attack down the wings where the threat is minimized.',
        origin: 'Pioneered by Italian tacticians developing Catenaccio in the 1960s, it evolved into modern zonal blocks popularized by Arrigo Sacchi at Milan, Rafa Benitez, and Diego Simeone at Atletico Madrid.',
        defense: 'To bypass a compact defensive block, teams must circulate the ball quickly to stretch the block horizontally, use overlapping fullbacks to create 2v1 situations out wide, or play diagonal crosses from half-spaces to target back-post runners.',
        examples: 'Diego Simeone\'s Atletico Madrid (disciplined 4-4-2 block), Jose Mourinho\'s Chelsea (2004-05), and Claudio Ranieri\'s Leicester City (2015-16).',
        prosCons: 'Pros: High spatial protection of danger zones, low physical exertion in possession, easy to counter-attack from. Cons: Yields possession dominance to the opponent, vulnerable to early crosses and fatigue from constant shifting.'
      },
      counter_attack: {
        name: 'Counter-Attack',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'counterTrigger',
        overview: 'An immediate shift from defending to attacking upon winning possession, moving the ball forward quickly before the opponent can reorganize.',
        origin: 'Part of football since its early days, but systemized by Herbert Chapman\'s W-M formation in the 1930s and refined through Italian counter-attacking traditions (Contropiede).',
        defense: 'Prevented by aggressive counter-pressing (winning the ball back immediately), tactical fouling, or maintaining a rest-defense structure (e.g., keeping a 3+2 rest shape behind the ball).',
        examples: 'Leicester City 2015/16 (Ranieri), Real Madrid under Mourinho (2011/12), Borussia Dortmund under Klopp.',
        prosCons: 'Pros: Exploit disorganized defenses, highly efficient, simple patterns. Cons: Relies on opponent making mistakes/committing men forward, requires high pace and stamina.'
      },
      inverted_winger: {
        name: 'Inverted Winger',
        complexity: ComplexityLevel.BEGINNER,
        module: 'invertedWinger',
        overview: 'A wide attacking player positioned on the side opposite their dominant foot, enabling them to cut inside to shoot or pass, rather than cross.',
        origin: 'Though wide players always cut inside occasionally, the modern tactically permanent inverted winger became standard in the 2000s, popularized by players like Arjen Robben and Franck Ribéry (Robbery) at Bayern Munich.',
        defense: 'Defended by using fullbacks with matching dominant feet, double-teaming with a tracking winger/midfielder, or forcing them onto their weaker foot toward the touchline.',
        examples: 'Arjen Robben, Lionel Messi (early years/right wing), Mohamed Salah, Franck Ribéry.',
        prosCons: 'Pros: Goal-scoring threat from wings, opens overlapping lanes for fullbacks, creates central overloads. Cons: Predictable if one-dimensional, leaves the flank open for counter-attacks, reduces traditional cross opportunities.'
      },
      back_three: {
        name: 'Back 3 / Wing-Back System',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'back3Wingbacks',
        overview: 'A formation using three center-backs and two advanced wing-backs, combining defensive stability with wide attacking options.',
        origin: 'Traceable to Karl Rappan\'s bolt system, later becoming the Libero/Sweeper systems in Germany and Italy. Modern back-3 was popularized by Antonio Conte at Juventus, Chelsea, and Inter.',
        defense: 'Countered by pressing the wide center-backs, overloading the flanks before the wingbacks can drop back, or occupying the spaces behind the wingbacks.',
        examples: 'Antonio Conte\'s Chelsea (2016/17), Gian Piero Gasperini\'s Atalanta, Thomas Tuchel\'s Chelsea (2021).',
        prosCons: 'Pros: Defensive solidity, structural flexibility in possession, high-pressing fullbacks. Cons: Vulnerable to quick diagonal switches, high physical demands on wingbacks, can become a defensive back-5 if pinned down.'
      },
      third_man_run: {
        name: 'Off-Ball Movement & Third Man Run',
        complexity: ComplexityLevel.ADVANCED,
        module: 'thirdManRun',
        overview: 'An attacking pattern where Player A passes to Player B to draw markers, while Player C makes a run to receive a one-touch pass from Player B.',
        origin: 'Fundamental concept of Ajax\'s Total Football and Cruyffian philosophy, famously summarized by Xavi Hernandez: "The third man is impossible to defend."',
        defense: 'Defended by using a compact zonal system where players pass runners between zones rather than tracking them individually, and putting pressure on the passer (Player A) to prevent the initial pass.',
        examples: 'Barcelona under Guardiola (Busquets to Messi to Xavi), Arrigo Sacchi\'s Milan.',
        prosCons: 'Pros: Dynamically breaks defensive lines, impossible to mark manually, high-speed ball progression. Cons: Requires perfect timing, coordination, and high technical quality.'
      },
      compactness: {
        name: 'Compactness & Pressing Lines',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'compactnessPressing',
        overview: 'The distance between the forward pressing line and the back line, kept short (10-15m) to limit central passing options.',
        origin: 'Mastered and codified by Arrigo Sacchi in AC Milan (vertical distance kept under 25 meters) using active offside traps.',
        defense: 'Countered by playing long diagonal balls over the block, stretching the field with wide wingers, or using rapid vertical combinations.',
        examples: 'Sacchi\'s AC Milan, Simeone\'s Atlético Madrid.',
        prosCons: 'Pros: Direct control of central spaces, intercepts passes easily. Cons: High stamina requirement, vulnerable to quick switches or runs behind if the defensive line isn\'t perfectly coordinated.'
      }
    };

    const concept = mockDatabase[matchedConcept];
    const explanation = concept[intent] || concept.overview;
    const suggestions = this.getSuggestionsForConcept(matchedConcept, intent);

    return {
      needs_clarification: false,
      concept_id: matchedConcept,
      concept_name: concept.name,
      complexity: concept.complexity,
      user_level: context.user_level,
      animation_module: concept.module,
      explanation: explanation,
      follow_up_suggestions: suggestions,
    };
  }

  /**
   * Helper that builds dynamic user suggestions based on concept and active intent.
   */
  private getSuggestionsForConcept(conceptId: string, currentIntent: string): string[] {
    const questions: Record<string, Record<string, string>> = {
      false_9: {
        overview: "What is a False 9?",
        origin: "Where does the False 9 originate from?",
        defense: "How do you defend against a False 9?",
        examples: "Who are some famous False 9 players?",
        prosCons: "What are the pros and cons of a False 9?"
      },
      high_press: {
        overview: "What is a High Press?",
        origin: "Where did the High Press originate from?",
        defense: "How do you bypass a High Press?",
        examples: "What are some famous High Press teams?",
        prosCons: "What are the pros and cons of a High Press?"
      },
      pressing_trap: {
        overview: "What is a Pressing Trap?",
        origin: "Where did Pressing Traps originate from?",
        defense: "How do you break a Pressing Trap?",
        examples: "What are some famous examples of Pressing Traps?",
        prosCons: "What are the pros and cons of Pressing Traps?"
      },
      midfield_overload: {
        overview: "What is a Midfield Overload?",
        origin: "Where did the Midfield Overload concept originate from?",
        defense: "How do you counter a Midfield Overload?",
        examples: "Who are famous coaches using Midfield Overloads?",
        prosCons: "What are the pros and cons of Midfield Overloads?"
      },
      low_block: {
        overview: "What is a Low Block?",
        origin: "Where did the Low Block originate from?",
        defense: "How do you break down a Low Block?",
        examples: "What are famous examples of a Low Block?",
        prosCons: "What are the pros and cons of a Low Block?"
      },
      defensive_block: {
        overview: "What is a Defensive Block?",
        origin: "Where did the Defensive Block concept originate from?",
        defense: "How do you break down a Defensive Block?",
        examples: "What are famous examples of a Defensive Block?",
        prosCons: "What are the pros and cons of a Defensive Block?"
      },
      counter_attack: {
        overview: "What is a Counter-Attack?",
        origin: "Where did the Counter-Attack originate from?",
        defense: "How do you stop a Counter-Attack?",
        examples: "What are famous counter-attacking teams?",
        prosCons: "What are the pros and cons of counter-attacks?"
      },
      inverted_winger: {
        overview: "What is an Inverted Winger?",
        origin: "Where did Inverted Wingers originate from?",
        defense: "How do you defend against an Inverted Winger?",
        examples: "Who are famous Inverted Wingers in history?",
        prosCons: "What are the pros and cons of Inverted Wingers?"
      },
      back_three: {
        overview: "What is a Back 3 / Wingback system?",
        origin: "Where did the Back 3 originate from?",
        defense: "How do you counter a Back 3?",
        examples: "What are famous Back 3 teams in history?",
        prosCons: "What are the pros and cons of a Back 3?"
      },
      third_man_run: {
        overview: "What is a Third Man Run?",
        origin: "Where did Third Man Runs originate from?",
        defense: "How do you defend against a Third Man Run?",
        examples: "What are famous examples of Third Man Runs?",
        prosCons: "What are the pros and cons of Third Man Runs?"
      },
      compactness: {
        overview: "What is Compactness?",
        origin: "Where did defensive Compactness originate from?",
        defense: "How do you counter defensive Compactness?",
        examples: "What are famous examples of defensive Compactness?",
        prosCons: "What are the pros and cons of keeping compact lines?"
      }
    };

    const conceptQ = questions[conceptId];
    if (!conceptQ) return [];

    return Object.entries(conceptQ)
      .filter(([intent]) => intent !== currentIntent)
      .map(([_, questionText]) => questionText)
      .slice(0, 4); // return up to 4 other questions
  }
}

