import { HistoricalExample } from '@football-atlas/shared';
import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';

export class HistoricalExplanationGenerator {
  private static instance: HistoricalExplanationGenerator;

  private isMockMode: boolean;
  private isHFMode: boolean;
  private isOpenRouterMode: boolean;

  private constructor() {
    const key = envConfig.ibmApiKey;
    const baseUrl = envConfig.ibmBaseUrl;
    this.isMockMode = !key || key === 'mock-key-for-local-testing' || key.toLowerCase().includes('mock');
    this.isOpenRouterMode = !!key && (key.startsWith('sk-or-') || baseUrl.includes('openrouter.ai'));
    this.isHFMode = !!key && key.startsWith('hf_') && !this.isOpenRouterMode;
  }

  public static getInstance(): HistoricalExplanationGenerator {
    if (!HistoricalExplanationGenerator.instance) {
      HistoricalExplanationGenerator.instance = new HistoricalExplanationGenerator();
    }
    return HistoricalExplanationGenerator.instance;
  }

  /**
   * Generates a conversational explanation about a historical example using IBM Granite.
   * Falls back to a clean template generator if offline or in mock mode.
   */
  public async generateExplanation(
    example: HistoricalExample,
    conceptName: string,
    userQuestion: string,
    traceId: string = 'historical-request',
    userLevel?: string
  ): Promise<string> {
    const promptText = `You are a world-class Tactical Analyst for Football Atlas.
Explain the following historical match example in relation to the tactical concept:
Tactical Concept: ${conceptName}
Match: ${example.match_name} (${example.season})
Coach: ${example.coach}
Players involved: ${example.players.join(', ')}
Tactical Summary: ${example.tactical_summary}
Description: ${example.description}

User Question: ${userQuestion}

Provide a concise, engaging tactical explanation (100-150 words) describing how the tactical concept was implemented in this match. Focus on the movements of the key players and how they disrupted the opponent. Keep the tone expert, clear, and educational.`;

    if (this.isMockMode) {
      return this.generateFallbackExplanation(example, conceptName);
    }

    try {
      if (this.isOpenRouterMode) {
        const url = envConfig.ibmBaseUrl.startsWith('http')
          ? `${envConfig.ibmBaseUrl}/chat/completions`
          : `https://${envConfig.ibmBaseUrl}/chat/completions`;

        const payload = {
          model: envConfig.ibmGraniteModel,
          messages: [
            { role: 'system', content: 'You are a professional football tactical analyst.' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.2,
          max_tokens: 300
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.ibmApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });

        if (res.ok) {
          const body = await res.json();
          return body.choices?.[0]?.message?.content || this.generateFallbackExplanation(example, conceptName);
        }
      } else if (this.isHFMode) {
        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        const payload = {
          inputs: `<|system|>\nYou are a professional football tactical analyst.\n<|user|>\n${promptText}\n<|assistant|>\n`,
          parameters: { max_new_tokens: 300, temperature: 0.2 }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.ibmApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000)
        });

        if (res.ok) {
          const body = await res.json();
          let text = '';
          if (Array.isArray(body)) text = body[0]?.generated_text || '';
          else text = body.generated_text || '';
          return text.trim() || this.generateFallbackExplanation(example, conceptName);
        }
      }
    } catch (err: any) {
      Logger.warn(`[HistoricalExplanationGenerator] API generation error: ${err.message}. Using fallback.`, { trace_id: traceId });
    }

    return this.generateFallbackExplanation(example, conceptName);
  }

  private generateFallbackExplanation(example: HistoricalExample, conceptName: string): string {
    return `In the ${example.season} ${example.competition} match between **${example.teams.join(' and ')}**, coach **${example.coach}** famously utilized **${conceptName}** to secure a tactical advantage. 

Specifically, **${example.players.join(', ')}** executed this role perfectly. ${example.description}

This implementation represents a classic study of how coordinated spacing and player roles manipulate defensive structures: ${example.tactical_summary}`;
  }
}

export const historicalExplanationGenerator = HistoricalExplanationGenerator.getInstance();
