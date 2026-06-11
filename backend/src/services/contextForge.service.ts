import { ComplexityLevel, TutorResponse, ToolInvocation, ConversationTurn, ClassroomAction } from '@football-atlas/shared';
import { footballAtlasMCPServer } from './mcpServer.service';
import { contextManager } from './context.manager';
import { classroomIntentEngine } from './classroomIntentEngine.service';
import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';

export class ContextForgeGateway {
  private static instance: ContextForgeGateway;

  private constructor() {}

  public static getInstance(): ContextForgeGateway {
    if (!ContextForgeGateway.instance) {
      ContextForgeGateway.instance = new ContextForgeGateway();
    }
    return ContextForgeGateway.instance;
  }

  /**
   * Main entry point for tutoring requests. Processes the prompt using the MCP agent pattern.
   */
  public async queryTutor(
    question: string,
    conversationId: string = 'default-session',
    traceId: string = 'system-request',
    history?: ConversationTurn[]
  ): Promise<TutorResponse> {
    const startTime = Date.now();
    const session = contextManager.getOrCreateSessionContext(conversationId);
    const context = session.context;

    // Track all tool executions in this turn
    const mcpToolChain: ToolInvocation[] = [];

    // Helper to execute a tool and track latency/observability
    const callTool = async (name: string, args: any): Promise<any> => {
      const toolStart = Date.now();
      const invocation: ToolInvocation = {
        tool_name: name,
        arguments: args,
        status: 'running',
        latency_ms: 0,
        timestamp: new Date().toISOString()
      };
      mcpToolChain.push(invocation);

      try {
        const response = await footballAtlasMCPServer.executeTool(name, args);
        invocation.status = 'success';
        invocation.latency_ms = Date.now() - toolStart;
        invocation.response = response;
        Logger.info(`MCP Tool Executed: ${name} in ${invocation.latency_ms}ms`, { trace_id: traceId });
        return response;
      } catch (err: any) {
        invocation.status = 'failure';
        invocation.latency_ms = Date.now() - toolStart;
        invocation.error_message = err.message;
        Logger.error(`MCP Tool Failed: ${name} - ${err.message}`, err, { trace_id: traceId });
        return { error: true, message: err.message };
      }
    };

    // 1. Tool 1: assess_knowledge_level
    const historyStrings = session.last_questions || [];
    const levelResult = await callTool('assess_knowledge_level', {
      conversation_history: [...historyStrings, question]
    });

    const detectedLevel = levelResult.detected_level?.toUpperCase() as ComplexityLevel || ComplexityLevel.INTERMEDIATE;
    const confidenceScore = levelResult.confidence || 0.85;

    session.user_level = detectedLevel;
    session.knowledge_profile = {
      detected_level: detectedLevel,
      confidence_score: confidenceScore,
      evidence: levelResult.evidence_matches || [],
      conversation_history: [...session.last_questions]
    };

    // 2. Predict which MCP tools to execute based on intent analysis
    const qLower = question.toLowerCase();
    const intentResult = classroomIntentEngine.classifyIntent(question, context);
    let conceptId = intentResult.matchedConceptId || context.active_concept || 'false_9';

    // Build the tool call plan
    const toolsToCall: Array<{ name: string; args: any }> = [];

    // Check if comparison query
    const isCompare = qLower.includes('compare') || qLower.includes('difference between') || qLower.includes('versus') || qLower.includes(' vs ');
    const isHistorical = qLower.includes('example') || qLower.includes('famous') || qLower.includes('who played') || qLower.includes('team') || qLower.includes('coach') || qLower.includes('messi') || qLower.includes('robben') || qLower.includes('salah');
    const isSourceEvidence = qLower.includes('source') || qLower.includes('evidence') || qLower.includes('where did you get') || qLower.includes('prove it');

    if (isCompare) {
      // Find comparing concept
      let conceptB = 'inverted_winger';
      if (conceptId === 'false_9') {
        conceptB = 'inverted_winger';
      } else if (conceptId === 'high_press') {
        conceptB = 'pressing_trap';
      }
      toolsToCall.push({ name: 'compose_concepts', args: { concept_a: conceptId, concept_b: conceptB } });
      toolsToCall.push({ name: 'get_concept_explanation', args: { concept_id: conceptId, knowledge_level: detectedLevel.toLowerCase() } });
      toolsToCall.push({ name: 'get_concept_explanation', args: { concept_id: conceptB, knowledge_level: detectedLevel.toLowerCase() } });
    } else if (isSourceEvidence) {
      const activeExId = session.last_example || context.active_example || 'barcelona_2009_f9';
      toolsToCall.push({ name: 'retrieve_source_evidence', args: { example_id: activeExId } });
    } else if (isHistorical) {
      // Find details from question
      let player: string | undefined = undefined;
      let coach: string | undefined = undefined;
      if (qLower.includes('messi')) player = 'Messi';
      if (qLower.includes('guardiola')) coach = 'Guardiola';
      if (qLower.includes('klopp')) coach = 'Klopp';
      if (qLower.includes('simeone')) coach = 'Simeone';

      toolsToCall.push({ name: 'fetch_historical_example', args: { concept_id: conceptId, player, coach } });
      toolsToCall.push({ name: 'launch_breakdown', args: { breakdown_id: 'barcelona_2009_f9' } });
    } else {
      // Default: explain active concept
      toolsToCall.push({ name: 'get_concept_explanation', args: { concept_id: conceptId, knowledge_level: detectedLevel.toLowerCase() } });
      toolsToCall.push({ name: 'trigger_animation', args: { concept_id: conceptId } });
    }

    // Always append suggest_next_concept to suggest followups
    toolsToCall.push({ name: 'suggest_next_concept', args: { completed_concepts: session.context.previous_concepts || [] } });

    // 3. Execute MCP Tool Chain
    const toolOutputs: any[] = [];
    for (const t of toolsToCall) {
      const output = await callTool(t.name, t.args);
      toolOutputs.push({ tool: t.name, response: output });
    }

    // 4. Synthesize final answer (Agent Compiler Pass)
    const isMock = !envConfig.ibmApiKey || envConfig.ibmApiKey === 'mock-key-for-local-testing' || envConfig.ibmApiKey.toLowerCase().includes('mock');
    let finalExplanation = '';
    let suggestions: string[] = ['Explain the defensive response', 'Show me the 3D lesson', 'Give me another example'];
    let actions: ClassroomAction[] = [];

    if (!isMock) {
      try {
        // Run Granite Live Synthesis
        finalExplanation = await this.synthesizeGraniteLive(question, toolOutputs, detectedLevel, traceId);
      } catch (err: any) {
        Logger.warn(`Granite live synthesis failed, falling back to local template compiler. Error: ${err.message}`);
        finalExplanation = this.synthesizeLocalTemplates(question, toolOutputs, detectedLevel);
      }
    } else {
      // Run Local Template Compiler
      finalExplanation = this.synthesizeLocalTemplates(question, toolOutputs, detectedLevel);
    }

    // Resolve details from tool outputs to populate response fields
    const getExplanationOutput = toolOutputs.find(o => o.tool === 'get_concept_explanation')?.response;
    const composeOutput = toolOutputs.find(o => o.tool === 'compose_concepts')?.response;
    const fetchExOutput = toolOutputs.find(o => o.tool === 'fetch_historical_example')?.response;
    const breakdownOutput = toolOutputs.find(o => o.tool === 'launch_breakdown')?.response;
    const suggestOutput = toolOutputs.find(o => o.tool === 'suggest_next_concept')?.response;
    const evidenceOutput = toolOutputs.find(o => o.tool === 'retrieve_source_evidence')?.response;

    if (suggestOutput?.recommended_concept_name) {
      suggestions.push(`Tell me about ${suggestOutput.recommended_concept_name}`);
    }

    // Bind action buttons based on executed tools
    if (breakdownOutput) {
      actions.push({
        type: 'LAUNCH_HISTORICAL_BREAKDOWN',
        label: `View Tactical Breakdown: ${breakdownOutput.title || 'Match Breakdown'}`,
        payload: {
          concept_id: conceptId,
          example_id: breakdownOutput.example_id,
          breakdown_id: breakdownOutput.example_id
        }
      });
    }

    if (getExplanationOutput) {
      actions.push({
        type: 'LAUNCH_CONCEPT',
        label: `Launch 3D Lesson: ${getExplanationOutput.concept_name}`,
        payload: {
          concept_id: getExplanationOutput.concept_id
        }
      });
    }

    if (evidenceOutput && evidenceOutput.length > 0) {
      actions.push({
        type: 'OPEN_EVIDENCE',
        label: `Open Grounded Evidence: ${evidenceOutput[0].source_title}`,
        payload: {
          example_id: session.last_example || 'barcelona_2009_f9',
          evidence_id: evidenceOutput[0].evidence_id
        }
      });
    }

    // Update session context state
    contextManager.updateContext(conversationId, {
      active_concept: conceptId,
      active_example: fetchExOutput?.[0]?.example_id || context.active_example
    });
    contextManager.addTurn(conversationId, question, finalExplanation);

    // Save history lists
    session.last_questions.push(question);
    session.last_answers.push(finalExplanation);

    const duration = Date.now() - startTime;
    Logger.info(`Context Forge Gateway request processed successfully in ${duration}ms`, { trace_id: traceId });

    return {
      explanation: finalExplanation,
      concept_id: conceptId,
      detected_level: detectedLevel,
      follow_up_suggestions: suggestions.slice(0, 3),
      confidence_score: confidenceScore,
      actions: actions.slice(0, 2),
      mcp_tool_chain: mcpToolChain,
      resolved_references: evidenceOutput ? evidenceOutput.map((e: any) => e.source_title) : [],
      conversation_thread: [...session.conversation_thread]
    };
  }

  /**
   * Synthesize final educational response by feeding raw tool outputs to Granite via watsonx/OpenRouter.
   */
  private async synthesizeGraniteLive(
    question: string,
    toolOutputs: any[],
    level: ComplexityLevel,
    traceId: string
  ): Promise<string> {
    const formattedOutputs = toolOutputs.map(t => {
      return `[Tool: ${t.tool}]
Response Data: ${JSON.stringify(t.response, null, 2)}`;
    }).join('\n\n');

    const systemPrompt = `You are the Football Atlas AI Tactical Tutor, an elite UEFA Pro License analyst.
Your job is to synthesize a natural, engaging, and structured educational explanation for the user's question, based strictly on the MCP tool outputs provided below.

INSTRUCTIONS:
1. Explain clearly and visually, focusing on spatial corridors and player movement.
2. Adapt your tone to the knowledge level: ${level}.
3. Cite the sources or tools naturally if they contain historical data or coaching excerpts.
4. Respond with the plain-text final explanation ONLY. Do not wrap in JSON blocks.

MCP TOOL OUTPUTS DATA:
${formattedOutputs}`;

    const isOR = envConfig.ibmApiKey.startsWith('sk-or-') || envConfig.ibmBaseUrl.includes('openrouter.ai');
    if (isOR) {
      const url = envConfig.ibmBaseUrl.startsWith('http')
        ? `${envConfig.ibmBaseUrl}/chat/completions`
        : `https://${envConfig.ibmBaseUrl}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${envConfig.ibmApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/google-deepmind/football-atlas',
          'X-Title': 'Football Atlas Tactical Tutor'
        },
        body: JSON.stringify({
          model: envConfig.ibmGraniteModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.1,
          max_tokens: 500
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API failed during synthesis: ${response.statusText}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Error compiling explanation.';
    } else {
      // Watsonx synthesis
      const token = await this.getAccessToken(traceId);
      const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;

      const promptText = `<|system|>\n${systemPrompt}\n<|user|>\n${question}\n<|assistant|>\n`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model_id: envConfig.ibmGraniteModel,
          input: promptText,
          parameters: {
            decoding_method: 'greedy',
            max_new_tokens: 500,
            stop_sequences: ['<|endoftext|>'],
          },
          project_id: envConfig.ibmProjectId,
        }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`Watsonx API failed during synthesis: ${response.statusText}`);
      }
      const body = await response.json();
      return body.results?.[0]?.generated_text || 'Error compiling explanation.';
    }
  }

  /**
   * Fast, reliable local compiler compiling explanations when running offline/mock mode.
   */
  private synthesizeLocalTemplates(question: string, toolOutputs: any[], level: ComplexityLevel): string {
    const getExplanationOutput = toolOutputs.find(o => o.tool === 'get_concept_explanation')?.response;
    const composeOutput = toolOutputs.find(o => o.tool === 'compose_concepts')?.response;
    const fetchExOutput = toolOutputs.find(o => o.tool === 'fetch_historical_example')?.response;
    const evidenceOutput = toolOutputs.find(o => o.tool === 'retrieve_source_evidence')?.response;

    if (composeOutput) {
      return `### Tactical Comparison: ${composeOutput.concept_a.replace(/_/g, ' ').toUpperCase()} vs ${composeOutput.concept_b.replace(/_/g, ' ').toUpperCase()}
      
**Relationship**: ${composeOutput.description}
**Common Spaces**: ${composeOutput.common_spaces.join(', ')}

**Tactical Breakdown**:
${composeOutput.tactical_logic}

*Calculated adaptation applied for ${level.toLowerCase()} level.*`;
    }

    if (evidenceOutput && evidenceOutput.length > 0) {
      const docs = evidenceOutput.map((ev: any, idx: number) => {
        return `**Source #${idx + 1}: ${ev.source_title}** (${ev.source_type})
*"${ev.excerpt}"* (Ingestion Confidence: ${Math.round(ev.confidence * 100)}%)`;
      }).join('\n\n');
      return `This analysis is backed by the following coaching literature, parsed via **IBM Docling**:

${docs}`;
    }

    if (fetchExOutput && fetchExOutput.length > 0) {
      const example = fetchExOutput[0];
      return `### Match Analysis: ${example.match_name} (${example.season})
      
**Coach**: ${example.coach}
**Key Players**: ${example.players.join(', ')}

**Tactical Implementation**:
${example.description}

**Outcome**:
${example.tactical_summary}`;
    }

    if (getExplanationOutput) {
      return `### Tactical Lesson: ${getExplanationOutput.concept_name}
      
${getExplanationOutput.explanation}

**Key Pillars**:
${getExplanationOutput.key_principles.map((kp: any) => `- **${kp.title}**: ${kp.description}`).join('\n')}

  **Defensive Counter-Measure**: **${getExplanationOutput.defensive_response.title}** (Effectiveness: ${getExplanationOutput.defensive_response.effectiveness_rating}%)
  *Description*: ${getExplanationOutput.defensive_response.description}
  *Advantages*: ${getExplanationOutput.defensive_response.advantages.join(', ')}
  *Risks*: ${getExplanationOutput.defensive_response.risks.join(', ')}`;
    }

    return `I executed the MCP tool chain to gather tactical information, but no direct templates matched your query. Please try asking about a specific concept like False 9 or High Press, or request a match example.`;
  }

  /**
   * Fast token retriever copy from GraniteService.
   */
  private async getAccessToken(traceId: string): Promise<string> {
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
        throw new Error(`IAM Auth API rejected credentials`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (err: any) {
      throw err;
    }
  }
}

export const contextForgeGateway = ContextForgeGateway.getInstance();
export default contextForgeGateway;
