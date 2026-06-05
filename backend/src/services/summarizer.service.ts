import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';

export class ConversationSummarizer {
  private static instance: ConversationSummarizer;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  private constructor() {}

  public static getInstance(): ConversationSummarizer {
    if (!ConversationSummarizer.instance) {
      ConversationSummarizer.instance = new ConversationSummarizer();
    }
    return ConversationSummarizer.instance;
  }

  /**
   * Generates a 1-2 sentence tactical summary of the conversation history.
   */
  public async summarize(
    questions: string[],
    answers: string[],
    activeConcept: string | null,
    traceId: string = 'summarize-request'
  ): Promise<string> {
    const totalTurns = questions.length;
    if (totalTurns === 0) return '';

    const isMock = !envConfig.ibmApiKey || envConfig.ibmApiKey === 'mock-key-for-local-testing' || envConfig.ibmApiKey.toLowerCase().includes('mock');

    if (isMock) {
      // Return a structured mock summary
      const conceptText = activeConcept ? activeConcept.replace(/_/g, ' ') : 'tactics';
      return `Discussion centered on ${conceptText} and related movements across ${totalTurns} tactical questions.`;
    }

    // Build conversation text for summarization
    let dialogue = '';
    for (let i = 0; i < questions.length; i++) {
      dialogue += `User: ${questions[i]}\nAssistant: ${answers[i] || ''}\n`;
    }

    const systemPrompt = `You are a professional football analyst assistant. Summarize the following tactical discussion in 1-2 concise sentences. Focus ONLY on the tactical concepts discussed (like False 9, pressing trigger) and match details. Do not include introductory text.`;
    const userPrompt = `Dialogue to summarize:\n${dialogue}\n\nSummary:`;

    try {
      const isHFMode = envConfig.ibmApiKey.startsWith('hf_');
      const isOpenRouter = envConfig.ibmApiKey.startsWith('sk-or-') || envConfig.ibmBaseUrl.includes('openrouter.ai');

      if (isHFMode) {
        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        const inputPrompt = `<|system|>\n${systemPrompt}\n<|user|>\n${userPrompt}\n<|assistant|>\n`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${envConfig.ibmApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: inputPrompt,
            parameters: { max_new_tokens: 100, temperature: 0.1 },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          let summary = '';
          if (Array.isArray(data)) {
            summary = data[0]?.generated_text || '';
          } else {
            summary = data?.generated_text || '';
          }
          return this.cleanSummaryText(summary);
        }
      } else if (isOpenRouter) {
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
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 100,
            temperature: 0.1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const summary = data.choices?.[0]?.message?.content || '';
          return this.cleanSummaryText(summary);
        }
      } else {
        // IBM Watsonx Production Call
        const token = await this.getAccessToken(traceId);
        const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;
        const inputPrompt = `<|system|>\n${systemPrompt}\n<|user|>\n${userPrompt}\n<|assistant|>\n`;

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            model_id: envConfig.ibmGraniteModel,
            input: inputPrompt,
            parameters: {
              decoding_method: 'greedy',
              max_new_tokens: 100,
              stop_sequences: ['<|endoftext|>'],
            },
            project_id: envConfig.ibmProjectId,
          }),
        });
        if (res.ok) {
          const body = await res.json();
          const summary = body.results?.[0]?.generated_text || '';
          return this.cleanSummaryText(summary);
        }
      }
    } catch (err: any) {
      Logger.error('Failed to summarize conversation history', err, { trace_id: traceId });
    }

    // Fallback if APIs fail
    const conceptText = activeConcept ? activeConcept.replace(/_/g, ' ') : 'tactics';
    return `Discussion centered on ${conceptText} and related movements across ${totalTurns} tactical questions.`;
  }

  private cleanSummaryText(text: string): string {
    return text.replace(/<\|endoftext\|>/g, '').replace(/User:|Assistant:/g, '').trim();
  }

  private async getAccessToken(traceId: string): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }
    const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: envConfig.ibmApiKey,
      }),
    });
    if (!res.ok) {
      throw new Error(`IAM Auth API rejected credentials in Summarizer: ${res.statusText}`);
    }
    const data = await res.json();
    this.cachedToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    return this.cachedToken!;
  }
}

export const conversationSummarizer = ConversationSummarizer.getInstance();
