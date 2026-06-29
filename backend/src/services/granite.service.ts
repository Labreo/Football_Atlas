import { envConfig } from '../config/env.config';
import { Logger } from '../utils/logger';
import { parseGraniteJson } from '../utils/jsonParser';
import { GraniteTestResponse, FootballConceptData } from '../types/granite.types';
import { ComplexityLevel, tacticalRegistry, ConversationContext, ConversationTurn } from '@football-atlas/shared';
import { historicalExampleService } from './historicalExample.service';
import { historicalExplanationGenerator } from './historicalExplanation.generator';
import { contextManager } from './context.manager';
import { conceptChainEngine } from './chainEngine.service';
import { conversationSummarizer } from './summarizer.service';
import { conceptVocabularyService } from './vocabulary.service';
import { classroomIntentEngine } from './classroomIntentEngine.service';
import { historicalExampleRepository } from '../repositories/historicalExample.repository';
import { KnowledgeLevelDetector } from './knowledgeLevelDetector.service';
import { explanationAdaptationLayer } from './explanationAdaptation.service';
import { ReferenceResolver } from './referenceResolver.service';
import { FollowUpIntentEngine } from './followUpIntentEngine.service';
import { ContextRecoveryService } from './contextRecovery.service';

export class GraniteService {
  private static cachedToken: string | null = null;
  private static tokenExpiry: number = 0;

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
   * Helper that builds the dynamic system prompt containing the session's conversational context.
   */
  private buildSystemPrompt(
    context: ConversationContext,
    userLevel: ComplexityLevel = ComplexityLevel.INTERMEDIATE,
    confidenceScore: number = 0.5
  ): string {
    const conceptIds = conceptVocabularyService.getSupportedConceptIds();
    const conceptListStr = conceptIds.map((id) => `- ${id}`).join('\n');
    const numConcepts = conceptIds.length;

    let contextSection = '';
    if (context.active_concept) {
      contextSection += `ACTIVE CONCEPT IN PLAY: ${context.active_concept}\n`;
    }
    if (context.previous_concepts && context.previous_concepts.length > 0) {
      contextSection += `PREVIOUS DISCUSSIONS CONCEPTS: ${context.previous_concepts.join(', ')}\n`;
    }
    if (context.conversation_summary) {
      contextSection += `TACTICAL CONTEXT SUMMARY: ${context.conversation_summary}\n`;
    }
    if (context.active_example) {
      contextSection += `CURRENT EXAMPLE INDEX: ${context.active_example}\n`;
    }
    if (context.active_breakdown) {
      contextSection += `CURRENT BREAKDOWN VIEW: ${context.active_breakdown}\n`;
    }
    contextSection += `DETECTED KNOWLEDGE LEVEL: ${userLevel}\n`;
    contextSection += `LEVEL CONFIDENCE SCORE: ${confidenceScore.toFixed(2)}\n`;

    let evidenceSection = '';
    const activeExampleId = context.active_example || (context.active_concept ? require('./historicalExample.service').historicalExampleService.getBestExample(context.active_concept, userLevel)?.example_id : null);
    if (activeExampleId) {
      try {
        const evidenceList = require('./groundedExample.service').groundedExampleService.getEvidenceForExample(activeExampleId);
        if (evidenceList.length > 0) {
          evidenceSection = `\nSUPPORTING EVIDENCE FOR GROUNDING:\n` + evidenceList.map((ev: any, idx: number) => {
            return `[Source #${idx + 1}]
Title: ${ev.source_title}
Type: ${ev.source_type}
Excerpt: "${ev.excerpt}"`;
          }).join('\n\n') + `\n\nINSTRUCTION: When the CURRENT CONVERSATION CONTEXT contains SUPPORTING EVIDENCE, you MUST base your explanation on these sources. Prefer grounded claims referencing specific matches, coaches, players, and excerpts from the sources (e.g. "In Barcelona's 2009 Champions League Final performance...") rather than generic statements. Cite your sources inline, e.g. [Source Title].\n`;
        }
      } catch (err) {
        // Safe catch for potential init/circular dependencies
      }
    }
    if (evidenceSection) {
      contextSection += evidenceSection;
    }

    let levelGuidance = '';
    if (userLevel === ComplexityLevel.BEGINNER) {
      levelGuidance = `You must explain the concept in BEGINNER MODE.
- Prioritize: simple language, visual analogies (e.g. decoy runner, magnets), clear examples, and minimal jargon.
- Do NOT use advanced terms like "half-spaces", "Zone 14", "reference points", or "compactness".
- Example of style: "A False 9 is a striker who moves away from the goal to create space."`;
    } else if (userLevel === ComplexityLevel.ADVANCED) {
      levelGuidance = `You must explain the concept in ADVANCED MODE.
- Prioritize: positional play, defensive manipulation, structural effects, and tradeoffs.
- Use specialized terminology like "half-spaces", "Zone 14", "reference points", "compactness", and "overloads".
- Example of style: "The False 9 destabilizes defensive reference points and creates central superiority during positional attacks."`;
    } else {
      levelGuidance = `You must explain the concept in INTERMEDIATE MODE.
- Prioritize: tactical reasoning, shape explanations (e.g. 4-3-3, defensive block), role interactions, and overloads.
- Example of style: "A False 9 pulls defenders out of position and creates midfield overloads."`;
    }

    return `You are the Football Atlas AI Tactical Tutor, an elite football coach (UEFA Pro License analyst level), tactical educator, and visual explainer.
Your job is to analyze the user's question, detect their level of football knowledge, and map their query to one of our supported tactical concepts.

You must maintain continuity across multiple conversational turns. Use the tactical context provided below to resolve implicit pronouns like "that", "this", "it" or questions like "why does that happen" or "what happens next" without requiring concept names.

SUPPORTED CONCEPT LIST (All outputs MUST map to one of these IDs):
${conceptListStr}

${contextSection ? `CURRENT CONVERSATION CONTEXT:\n${contextSection}\n` : ''}

CRITICAL PERSONAL & EXPLANATION INSTRUCTIONS:
1. Persona: Speak with professional coaching authority, but remain accessible. Explain in terms of visual spatial movements on a pitch (e.g., "player drops into midfield, drawing the center-back and leaving space behind"). Avoid dry spreadsheets or generic football clichés ("give 110%").
2. Level Calibration Guidance:
${levelGuidance}
3. JSON CONTRACT:
Your output MUST be a valid JSON object. Do not wrap the JSON object in markdown blocks (do NOT output \`\`\`json ... \`\`\`), and do not write any introductory or trailing conversational text. Respond ONLY with the JSON object.

If you have high confidence (>75% probability) that the question is about one of our supported concepts (either explicitly mentioned or inferred from the tactical context):
{
  "needs_clarification": false,
  "concept_id": "one_of_the_${numConcepts}_ids_above",
  "concept_name": "Readable Name (e.g., 'False 9')",
  "complexity": "${userLevel.toLowerCase()}",
  "user_level": "${userLevel.toLowerCase()}",
  "animation_module": "matching_module_id_e.g._false9_or_highPress",
  "explanation": "Your visual and educational explanation calibrating to the user_level. Detail player runs and spacing.",
  "follow_up_suggestions": [
    "Follow-up question about related concepts 1",
    "Follow-up question 2",
    "Follow-up question 3"
  ],
  "actions": [
    {
      "type": "LAUNCH_CONCEPT" | "LAUNCH_MATCH" | "LAUNCH_HISTORICAL_EXAMPLE" | "LAUNCH_HISTORICAL_BREAKDOWN" | "OPEN_RELATED_CONCEPT",
      "label": "Clickable Button Label",
      "payload": {
        "concept_id": "concept_id_string",
        "example_id": "example_id_string",
        "breakdown_id": "breakdown_id_string"
      }
    }
  ]
}

If you have low confidence, or the user's query is highly ambiguous, or is completely unrelated to football/tactics:
{
  "needs_clarification": true,
  "clarification_question": "A specific, helpful clarifying question to guide the user back to the tactical discussion (e.g., 'Would you like to explore how defenders respond to the False 9, or look at midfield overloads?')"
}`;
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
    traceId: string = 'system-request',
    history?: ConversationTurn[]
  ): Promise<GraniteTestResponse> {
    const startTime = Date.now();
    const session = contextManager.getOrCreateSessionContext(conversationId);
    const context = session.context;

    // A. Context Recovery
    const recoveryResult = ContextRecoveryService.evaluate(question, session);
    let contextRecovered = false;
    if (recoveryResult.recovered && recoveryResult.recoveredConceptId) {
      contextManager.updateContext(conversationId, {
        active_concept: recoveryResult.recoveredConceptId,
        active_example: recoveryResult.recoveredExampleId
      });
      session.last_concept = recoveryResult.recoveredConceptId;
      session.last_example = recoveryResult.recoveredExampleId;
      contextRecovered = true;
    }

    // B. Reference Resolution
    const refResult = ReferenceResolver.resolve(question, session);
    if (refResult.resolvedConceptId && refResult.resolvedConceptId !== context.active_concept) {
      contextManager.updateContext(conversationId, {
        active_concept: refResult.resolvedConceptId
      });
      session.last_concept = refResult.resolvedConceptId;
    }

    // C. Follow-up Intent Detection
    const followUpResult = FollowUpIntentEngine.classify(question, session);

    // D. Clarification Routing (Ambiguity Handling)
    if (followUpResult.requiresClarification) {
      Logger.info('Clarification requested due to ambiguous follow-up', {
        question,
        clarification_question: followUpResult.clarificationQuestion
      });
      return {
        success: true,
        is_mocked: true,
        mode: 'mock',
        latency_ms: Date.now() - startTime,
        data: {
          needs_clarification: true,
          clarification_question: followUpResult.clarificationQuestion,
          concept_id: session.last_concept || context.active_concept || '',
          concept_name: (session.last_concept || context.active_concept || '').replace(/_/g, ' '),
          complexity: session.user_level,
          user_level: session.user_level,
          followup_detected: true,
          clarification_requested: true,
          resolved_references: [],
          conversation_thread: session.conversation_thread
        } as any
      };
    }

    // E. Call the internal handler
    const response = await this.queryTutorInternal(question, conversationId, traceId, history);

    // F. Enrich Output with Metadata & Update Memory
    if (response && response.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedData: any = response.data;
      
      // Update memory variables
      const conceptId = parsedData.concept_id || refResult.resolvedConceptId || context.active_concept;
      if (conceptId) {
        session.last_concept = conceptId;
        const regObj = tacticalRegistry.getConcept(conceptId);
        if (regObj) {
          session.last_animation = regObj.animation_module?.module_id || null;
        }
      }

      const exampleId = parsedData.example_id || parsedData.active_example || refResult.resolvedExampleId;
      if (exampleId) {
        session.last_example = exampleId;
        const example = historicalExampleRepository.getById(exampleId);
        if (example) {
          session.last_match = example.example_id;
          session.last_player = example.players?.[0] || null;
          session.last_coach = example.coach || null;
        }
      }

      if (parsedData.active_breakdown || refResult.resolvedBreakdownId) {
        session.last_breakdown = parsedData.active_breakdown || refResult.resolvedBreakdownId;
      }

      // Update the thread sequence
      const conceptFriendlyNames: Record<string, string> = {
        false_9: 'False 9',
        midfield_overload: 'Midfield Overload',
        third_man_run: 'Third Man Run',
        high_press: 'High Press',
        pressing_trap: 'Pressing Trap',
        compactness_pressing_lines: 'Compactness',
        defensive_block: 'Defensive Block',
        counter_attack_trigger: 'Counter Attack Trigger',
        back_three_wing_back: 'Back Three Recovery',
        inverted_winger: 'Inverted Winger'
      };

      const addToThread = (item: string) => {
        if (session.conversation_thread.length === 0) {
          session.conversation_thread.push(item);
        } else {
          const last = session.conversation_thread[session.conversation_thread.length - 1];
          if (last !== item && !session.conversation_thread.includes(item)) {
            session.conversation_thread.push(item);
          }
        }
      };

      if (conceptId && conceptFriendlyNames[conceptId]) {
        addToThread(conceptFriendlyNames[conceptId]);
      }

      if (followUpResult.intent === 'CONCEPT_TRANSITION') {
        if (conceptId === 'false_9' && /defend|defender|stop|react|respond/i.test(question.toLowerCase())) {
          addToThread('Defensive Response');
        }
      }

      const activeEx = session.last_example;
      if (activeEx && (followUpResult.intent === 'BREAKDOWN_REQUEST' || question.toLowerCase().includes('breakdown') || question.toLowerCase().includes('example'))) {
        const example = historicalExampleRepository.getById(activeEx);
        if (example) {
          addToThread(`${example.match_name.split('vs')[0].trim()} ${example.season} Breakdown`);
        }
      }

      // Inject metrics
      parsedData.followup_detected = followUpResult.intent !== 'DIRECT_FOLLOWUP' || refResult.resolved;
      parsedData.reference_resolved = refResult.resolved;
      parsedData.clarification_requested = false;
      parsedData.context_recovered = contextRecovered;
      parsedData.concept_transition = followUpResult.intent === 'CONCEPT_TRANSITION';
      parsedData.breakdown_followup = followUpResult.intent === 'BREAKDOWN_REQUEST';
      
      let sourceRefs = [...refResult.evidence];
      const activeExId = session.last_example || parsedData.example_id || parsedData.active_example;
      if (activeExId) {
        try {
          const evidenceList = require('./groundedExample.service').groundedExampleService.getEvidenceForExample(activeExId);
          sourceRefs.push(...evidenceList.map((e: any) => e.source_title));
        } catch (_) {}
      } else if (conceptId) {
        try {
          const bestEx = require('./historicalExample.service').historicalExampleService.getBestExample(conceptId, session.user_level);
          if (bestEx) {
            const evidenceList = require('./groundedExample.service').groundedExampleService.getEvidenceForExample(bestEx.example_id);
            sourceRefs.push(...evidenceList.map((e: any) => e.source_title));
          }
        } catch (_) {}
      }
      parsedData.resolved_references = Array.from(new Set(sourceRefs));
      parsedData.conversation_thread = [...session.conversation_thread];
    }

    return response;
  }

  private async queryTutorInternal(
    question: string,
    conversationId: string = 'default-session',
    traceId: string = 'system-request',
    history?: ConversationTurn[]
  ): Promise<GraniteTestResponse> {
    const startTime = Date.now();
    
    // Resolve session context history using the unified Context Manager
    const session = contextManager.getOrCreateSessionContext(conversationId);
    const context = session.context;

    // Run level detection
    const detection = KnowledgeLevelDetector.detect(question, session.last_questions);
    
    // Log detection events for analytics tracking
    Logger.info('Knowledge Level Detected', {
      question,
      detected_level: detection.detected_level,
      confidence_score: detection.confidence_score,
      evidence: detection.evidence
    });

    session.user_level = detection.detected_level;
    session.knowledge_profile = {
      detected_level: detection.detected_level,
      confidence_score: detection.confidence_score,
      evidence: detection.evidence,
      conversation_history: [...session.last_questions]
    };

    // Auto-summarize if conversation depth exceeds 5 turns
    if (session.last_questions.length > 5) {
      try {
        const summary = await conversationSummarizer.summarize(
          session.last_questions,
          session.last_answers,
          context.active_concept,
          traceId
        );
        contextManager.updateContext(conversationId, { conversation_summary: summary });
      } catch (sumErr) {
        Logger.error('Failed to auto-summarize session history', sumErr, { trace_id: traceId });
      }
    }

    const qLower = question.toLowerCase();
    const isSourceFollowUp = /where did (you|that) (get|come from)|what source|show supporting evidence|what document discusses|prove it|evidence for this|source reference|where does this analysis come from|show (me )?(a )?source|show source/i.test(qLower);

    if (isSourceFollowUp) {
      const activeExampleId = session.last_example || session.context.active_example || 'barcelona_2009_f9';
      const evidenceList = require('./groundedExample.service').groundedExampleService.getEvidenceForExample(activeExampleId);
      
      const sourceListStr = evidenceList.map((ev: any, idx: number) => {
        return `Source #${idx + 1}: **${ev.source_title}** (${ev.source_type})
Excerpt: "${ev.excerpt}" (Confidence: ${Math.round(ev.confidence * 100)}%)`;
      }).join('\n\n');

      const explanationText = `This tactical analysis is backed by the following documented sources in Football Atlas:

${sourceListStr}

These documents discuss positional structures, spaces, and tactical roles like the False 9 dropping centrally to create midfield overloads.`;

      // Update session metrics
      session.last_questions.push(question);
      session.last_answers.push(explanationText);

      return {
        success: true,
        is_mocked: true,
        mode: 'mock',
        latency_ms: Date.now() - startTime,
        data: {
          needs_clarification: false,
          concept_id: session.last_concept || session.context.active_concept || 'false_9',
          concept_name: (session.last_concept || session.context.active_concept || 'false_9').replace(/_/g, ' '),
          complexity: session.user_level,
          user_level: session.user_level,
          explanation: explanationText,
          follow_up_suggestions: ['Show supporting evidence', 'Launch breakdown', 'View core lesson'],
          actions: [
            {
              type: 'VIEW_SOURCE',
              label: 'View Ingested Source Document',
              payload: {
                example_id: activeExampleId,
                document_id: evidenceList[0]?.document_id || 'tactical_analysis_guardiola',
                chunk_id: evidenceList[0]?.chunk_id || 'chunk_1'
              }
            },
            {
              type: 'OPEN_EVIDENCE',
              label: 'Open Evidence Card',
              payload: {
                example_id: activeExampleId,
                evidence_id: evidenceList[0]?.evidence_id || 'ev_barcelona_2009_f9_chunk_1'
              }
            }
          ]
        } as any
      };
    }

    const isHistoricalRequest = /show me (?:a |an )?example|give me (?:a |an )?example|real example|famous team|when has this happened|another example|an example of|example of this|example/i.test(qLower);

    if (isHistoricalRequest) {
      // 1. Resolve matched concept
      let matchedConcept = '';
      if (qLower.includes('false 9') || qLower.includes('false9') || qLower.includes('dropped striker')) {
        matchedConcept = 'false_9';
      } else if (qLower.includes('high press') || qLower.includes('gegenpress') || qLower.includes('pressing high')) {
        matchedConcept = 'high_press';
      } else if (qLower.includes('pressing trap') || qLower.includes('press trap')) {
        matchedConcept = 'pressing_trap';
      } else if (qLower.includes('overload') || qLower.includes('midfield overload')) {
        matchedConcept = 'midfield_overload';
      } else if (qLower.includes('defensive block') || qLower.includes('compact block')) {
        matchedConcept = 'defensive_block';
      } else if (qLower.includes('low block') || qLower.includes('defending deep')) {
        matchedConcept = 'defensive_block';
      } else if (qLower.includes('counter') || qLower.includes('transition') || qLower.includes('counter-attack')) {
        matchedConcept = 'counter_attack_trigger';
      } else if (qLower.includes('inverted') || qLower.includes('winger') || qLower.includes('cut inside')) {
        matchedConcept = 'inverted_winger';
      } else if (qLower.includes('back three') || qLower.includes('back 3') || qLower.includes('wingback') || qLower.includes('wing-back')) {
        matchedConcept = 'back_three_wing_back';
      } else if (qLower.includes('third man') || qLower.includes('off-ball run') || qLower.includes('third-man')) {
        matchedConcept = 'third_man_run';
      } else if (qLower.includes('compactness') || qLower.includes('pressing lines') || qLower.includes('compact')) {
        matchedConcept = 'compactness_pressing_lines';
      }

      if (!matchedConcept) {
        matchedConcept = context.active_concept || '';
      }

      if (!matchedConcept) {
        return {
          success: true,
          is_mocked: true,
          mode: 'mock',
          latency_ms: Date.now() - startTime,
          data: {
            needs_clarification: true,
            clarification_question: 'Which tactical concept would you like to see a real example of? (e.g., False 9, High Press, Defensive Block)',
          } as any
        };
      }

      // Retrieve best example
      let example = historicalExampleService.getBestExample(matchedConcept, session.user_level, session.served_example_ids);
      if (!example && session.served_example_ids.length > 0) {
        // Reset served history to wrap around if we've shown everything
        session.served_example_ids = [];
        example = historicalExampleService.getBestExample(matchedConcept, session.user_level, []);
      }

      if (!example) {
        return {
          success: true,
          is_mocked: true,
          mode: 'mock',
          latency_ms: Date.now() - startTime,
          data: {
            needs_clarification: false,
            concept_id: matchedConcept,
            concept_name: matchedConcept.replace(/_/g, ' '),
            complexity: session.user_level,
            user_level: session.user_level,
            animation_module: '',
            explanation: `I'm sorry, I don't have any curated historical examples for the concept "${matchedConcept.replace(/_/g, ' ')}" yet.`,
            follow_up_suggestions: ['Explain how this concept works', 'Show me the 3D lesson']
          } as any
        };
      }

      // Track this example
      session.served_example_ids.push(example.example_id);

      // Get concept display name
      const conceptRegistryObj = tacticalRegistry.getConcept(matchedConcept);
      const conceptName = conceptRegistryObj?.concept_name || matchedConcept.replace(/_/g, ' ');

      // Generate Granite explanation
      const explanationText = await historicalExplanationGenerator.generateExplanation(
        example,
        conceptName,
        question,
        traceId,
        session.user_level
      );

      // Format target experience output exactly as requested
      let formattedExplanation = `Example:
${example.match_name}
${example.season} ${example.competition}

Player:
${example.players.join(', ')}

Tactical Context:
${example.tactical_summary}

Explanation:
${explanationText}`;

      // Adapt historical explanation
      formattedExplanation = explanationAdaptationLayer.adaptHistoricalExplanation(
        matchedConcept,
        session.user_level,
        example,
        formattedExplanation
      );

      // Update context state
      contextManager.updateContext(conversationId, {
        active_concept: matchedConcept,
        active_example: example.example_id
      });
      contextManager.addTurn(conversationId, question, formattedExplanation);

      // Classify via intent engine to fetch additional matches if appropriate
      const intentResult = classroomIntentEngine.classifyIntent(question, context);

      return {
        success: true,
        is_mocked: this.isMockMode,
        mode: this.isMockMode ? 'mock' : 'live',
        latency_ms: Date.now() - startTime,
        data: {
          needs_clarification: false,
          concept_id: matchedConcept,
          concept_name: conceptName,
          complexity: conceptRegistryObj?.complexity || session.user_level,
          user_level: session.user_level,
          animation_module: conceptRegistryObj?.animation_module?.module_id || '',
          explanation: formattedExplanation,
          follow_up_suggestions: ['Explain the defensive response', 'Show me the 3D lesson', 'Give me another example'],
          actions: intentResult.actions && intentResult.actions.length > 0 ? intentResult.actions : [
            {
              type: 'LAUNCH_HISTORICAL_BREAKDOWN',
              label: `View Tactical Breakdown: ${example.match_name}`,
              payload: {
                concept_id: matchedConcept,
                example_id: example.example_id,
                breakdown_id: example.example_id
              }
            },
            {
              type: 'LAUNCH_MATCH',
              label: `Open Match Card: ${example.match_name}`,
              payload: {
                concept_id: matchedConcept,
                example_id: example.example_id
              }
            }
          ]
        } as any
      };
    }

    // 1. Prevent accidental mock-mode responses in production.
    if (this.isMockMode) {
      Logger.error('Detected mock-mode at runtime. Production must provide a valid IBM API key.');
      return {
        success: false,
        is_mocked: true,
        mode: 'error',
        latency_ms: Date.now() - startTime,
        error: 'Server configured in mock mode. Set a valid IBM_API_KEY in production to enable watsonx.ai.'
      } as any;
    }

    // Format the last 5 turns (max 10 messages) of conversation history
    const historyMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (history && history.length > 0) {
      historyMessages.push(
        ...history.slice(-10).map((t) => ({
          role: t.role,
          content: t.content,
        }))
      );
    } else {
      const len = Math.min(session.last_questions.length, session.last_answers.length);
      const startIdx = Math.max(0, len - 5);
      for (let i = startIdx; i < len; i++) {
        historyMessages.push({ role: 'user', content: session.last_questions[i] });
        historyMessages.push({ role: 'assistant', content: session.last_answers[i] });
      }
    }

    // Prepare system prompt with injected context variables
    const systemPrompt = this.buildSystemPrompt(context, session.user_level, detection.confidence_score);

    // 2. Trigger Hugging Face API if in Hugging Face mode
    if (this.isHFMode) {
      try {
        Logger.info('Querying Hugging Face Serverless Inference endpoint...', {
          trace_id: traceId,
          model: envConfig.ibmGraniteModel,
        });

        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        let promptText = `<|system|>\n${systemPrompt}\n`;
        for (const msg of historyMessages) {
          if (msg.role === 'user') {
            promptText += `<|user|>\n${msg.content}\n`;
          } else {
            promptText += `<|assistant|>\n${msg.content}\n`;
          }
        }
        promptText += `<|user|>\n${question}\n<|assistant|>\n`;

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

        if (parsedData) {
          const intentResult = classroomIntentEngine.classifyIntent(question, context);
          if (!parsedData.actions || parsedData.actions.length === 0) {
            parsedData.actions = intentResult.actions;
          }
          parsedData.actions = this.sanitizeActions(parsedData.actions, parsedData.concept_id || intentResult.matchedConceptId || context.active_concept);
          if (!parsedData.needs_clarification && parsedData.concept_id) {
            contextManager.updateContext(conversationId, {
              active_concept: parsedData.concept_id
            });
            session.user_level = parsedData.user_level as ComplexityLevel;
            contextManager.addTurn(conversationId, question, parsedData.explanation);
          } else if (parsedData.needs_clarification) {
            contextManager.addTurn(conversationId, question, parsedData.clarification_question);
          }
        }

        return {
          success: true,
          is_mocked: false,
          mode: 'live',
          latency_ms: Date.now() - startTime,
          data: parsedData,
        };

      } catch (err: any) {
        Logger.error(`Hugging Face API error: ${err.message}.`, { trace_id: traceId });
        return {
          success: false,
          is_mocked: false,
          mode: 'error',
          latency_ms: Date.now() - startTime,
          error: `Hugging Face API error: ${String(err.message || err)}`
        } as any;
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
            { role: 'system', content: systemPrompt },
            ...historyMessages,
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

        if (parsedData) {
          const intentResult = classroomIntentEngine.classifyIntent(question, context);
          if (!parsedData.actions || parsedData.actions.length === 0) {
            parsedData.actions = intentResult.actions;
          }
          parsedData.actions = this.sanitizeActions(parsedData.actions, parsedData.concept_id || intentResult.matchedConceptId || context.active_concept);
          if (!parsedData.needs_clarification && parsedData.concept_id) {
            contextManager.updateContext(conversationId, {
              active_concept: parsedData.concept_id
            });
            session.user_level = parsedData.user_level as ComplexityLevel;
            contextManager.addTurn(conversationId, question, parsedData.explanation);
          } else if (parsedData.needs_clarification) {
            contextManager.addTurn(conversationId, question, parsedData.clarification_question);
          }
        }

        return {
          success: true,
          is_mocked: false,
          mode: 'live',
          latency_ms: Date.now() - startTime,
          data: parsedData,
        };

      } catch (err: any) {
        Logger.error(`OpenRouter API error: ${err.message}.`, { trace_id: traceId });
        return {
          success: false,
          is_mocked: false,
          mode: 'error',
          latency_ms: Date.now() - startTime,
          error: `OpenRouter API error: ${String(err.message || err)}`
        } as any;
      }
    }

    // 3. Perform production IBM Cloud call
    try {
      const token = await this.getAccessToken(traceId);
      const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;
      
      let promptText = `<|system|>\n${systemPrompt}\n`;
      for (const msg of historyMessages) {
        if (msg.role === 'user') {
          promptText += `<|user|>\n${msg.content}\n`;
        } else {
          promptText += `<|assistant|>\n${msg.content}\n`;
        }
      }
      promptText += `<|user|>\n${question}\n<|assistant|>\n`;

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

      if (parsedData) {
        const intentResult = classroomIntentEngine.classifyIntent(question, context);
        if (!parsedData.actions || parsedData.actions.length === 0) {
          parsedData.actions = intentResult.actions;
        }
        parsedData.actions = this.sanitizeActions(parsedData.actions, parsedData.concept_id || intentResult.matchedConceptId || context.active_concept);
        if (!parsedData.needs_clarification && parsedData.concept_id) {
          contextManager.updateContext(conversationId, {
            active_concept: parsedData.concept_id
          });
          session.user_level = parsedData.user_level as ComplexityLevel;
          contextManager.addTurn(conversationId, question, parsedData.explanation);
        } else if (parsedData.needs_clarification) {
          contextManager.addTurn(conversationId, question, parsedData.clarification_question);
        }
      }

      return {
        success: true,
        is_mocked: false,
        mode: 'live',
        latency_ms: Date.now() - startTime,
        data: parsedData,
      };

    } catch (err: any) {
      Logger.error(`IBM Granite API error: ${err.message}.`, { trace_id: traceId });
      return {
        success: false,
        is_mocked: false,
        mode: 'error',
        latency_ms: Date.now() - startTime,
        error: `Watsonx/IBM Granite API error: ${String(err.message || err)}`
      } as any;
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
   * Evaluates user question against concept tags and returns high-fidelity fallback objects in mock mode.
   */
  private generateMockResponse(question: string, conversationId: string): any {
    const q = question.toLowerCase();
    const session = contextManager.getOrCreateSessionContext(conversationId);
    const context = session.context;

    // Run level detection
    const detection = KnowledgeLevelDetector.detect(question, session.last_questions);
    session.user_level = detection.detected_level;
    session.knowledge_profile = {
      detected_level: detection.detected_level,
      confidence_score: detection.confidence_score,
      evidence: detection.evidence,
      conversation_history: [...session.last_questions]
    };

    // Use IntentEngine to evaluate intent and routing
    const intentResult = classroomIntentEngine.classifyIntent(question, context);
    let matchedConcept = intentResult.matchedConceptId || 'false_9';

    // Failsafe: if we couldn't resolve a concept and there's no active concept
    if (!matchedConcept) {
      return {
        needs_clarification: true,
        clarification_question: 'Are you asking about pressing high up the pitch (High Press) or defending deep (Low Block)?',
      };
    }

    // Check if the query is unrelated to football/tactics
    const isUnrelated = !q.includes('press') && !q.includes('block') && !q.includes('false') && !q.includes('overload') && !q.includes('third') && !q.includes('back') && !q.includes('compact') && !q.includes('trigger') && !q.includes('messi') && !q.includes('robben') && !q.includes('salah') && !q.includes('firmino') && !q.includes('fabregas') && !q.includes('totti') && !q.includes('guardiola') && !q.includes('klopp') && !q.includes('simeone') && !q.includes('mourinho') && !context.active_concept;
    
    if (intentResult.intent === 'CONCEPT_EXPLANATION' && !intentResult.matchedConceptId && isUnrelated) {
      return {
        needs_clarification: true,
        clarification_question: 'Are you asking about pressing high up the pitch (High Press) or defending deep (Low Block)?',
      };
    }

    // Classify Intent for explanation lookup
    let explanationKey: 'overview' | 'origin' | 'defense' | 'examples' | 'prosCons' = 'overview';
    if (q.includes('originate') || q.includes('history') || q.includes('invented') || q.includes('where did') || q.includes('who came up') || q.includes('first time') || q.includes('origins') || q.includes('creator') || q.includes('invent')) {
      explanationKey = 'origin';
    } else if (q.includes('defend') || q.includes('stop') || q.includes('counter') || q.includes('prevent') || q.includes('deal with') || q.includes('neutralize') || q.includes('limit') || q.includes('respond')) {
      explanationKey = 'defense';
    } else if (q.includes('player') || q.includes('example') || q.includes('who played') || q.includes('famous') || q.includes('team') || q.includes('match') || q.includes('coach')) {
      explanationKey = 'examples';
    } else if (q.includes('pro') || q.includes('con') || q.includes('advantage') || q.includes('disadvantage') || q.includes('benefit') || q.includes('strength') || q.includes('weakness')) {
      explanationKey = 'prosCons';
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
      counter_attack_trigger: {
        name: 'Counter-Attack Trigger',
        complexity: ComplexityLevel.ADVANCED,
        module: 'counter_attack_trigger',
        overview: 'A transition tactic focused on the immediate moments after winning possession, exploiting the opponent\'s structural disorganization and advanced players before they can recover their defensive shape.',
        origin: 'Part of football since its early days, but systemized by Herbert Chapman\'s W-M formation in the 1930s and refined through Italian counter-attacking traditions (Contropiede). Modern counter-attack trigger play relies on high-speed vertical outlets and space exploitation.',
        defense: 'Prevented by aggressive counter-pressing (winning the ball back immediately), tactical fouling, or maintaining a rest-defense structure (e.g., keeping a 3+2 rest shape behind the ball).',
        examples: 'Leicester City 2015/16 (Ranieri), Real Madrid under Mourinho (2011/12), Borussia Dortmund under Klopp.',
        prosCons: 'Pros: Exploit disorganized defenses, highly efficient, simple patterns. Cons: Relies on opponent making mistakes/committing men forward, requires high pace and stamina.'
      },
      inverted_winger: {
        name: 'Inverted Winger',
        complexity: ComplexityLevel.BEGINNER,
        module: 'invertedWinger',
        overview: 'A wide attacking player positioned on the side opposite their dominant foot, enabling them to cut inside to shoot or pass, rather than cross.',
        origin: 'Though wide players always cut inside occasionally, the permanent inverted winger became standard in the 2000s, popularized by players like Arjen Robben and Franck Ribéry (Robbery) at Bayern Munich.',
        defense: 'Defended by using fullbacks with matching dominant feet, double-teaming with a tracking winger/midfielder, or forcing them onto their weaker foot toward the touchline.',
        examples: 'Arjen Robben, Lionel Messi (early years/right wing), Mohamed Salah, Franck Ribéry.',
        prosCons: 'Pros: Goal-scoring threat from wings, opens overlapping lanes for fullbacks, creates central overloads. Cons: Predictable if one-dimensional, leaves the flank open for counter-attacks, reduces traditional cross opportunities.'
      },
      back_three_wing_back: {
        name: 'Back 3 / Wing-Back System',
        complexity: ComplexityLevel.INTERMEDIATE,
        module: 'back_three_wing_back',
        overview: 'A formation using three center-backs and two advanced wing-backs, combining defensive stability with wide attacking options.',
        origin: 'Traceable to Karl Rappan\'s bolt system, later becoming the Libero/Sweeper systems in Germany and Italy. Modern back-3 was popularized by Antonio Conte at Juventus, Chelsea, and Inter.',
        defense: 'Countered by pressing the wide center-backs, overloading the flanks before the wingbacks can drop back, or occupying the spaces behind the wingbacks.',
        examples: 'Antonio Conte\'s Chelsea (2016/17), Gian Piero Gasperini\'s Atalanta, Thomas Tuchel\'s Chelsea (2021).',
        prosCons: 'Pros: Defensive solidity, structural flexibility in possession, high-pressing fullbacks. Cons: Vulnerability to quick diagonal switches, high physical demands on wingbacks, can become a defensive back-5 if pinned down.'
      },
      third_man_run: {
        name: 'Off-Ball Movement & Third Man Run',
        complexity: ComplexityLevel.ADVANCED,
        module: 'third_man_run',
        overview: 'An attacking pattern where Player A passes to Player B to draw markers, while Player C makes a run to receive a one-touch pass from Player B.',
        origin: 'Fundamental concept of Ajax\'s Total Football and Cruyffian philosophy, famously summarized by Xavi Hernandez: "The third man is impossible to defend."',
        defense: 'Defended by using a compact zonal system where players pass runners between zones rather than tracking them individually, and putting pressure on the passer (Player A) to prevent the initial pass.',
        examples: 'Barcelona under Guardiola (Busquets to Messi to Xavi), Arrigo Sacchi\'s Milan.',
        prosCons: 'Pros: Dynamically breaks defensive lines, impossible to mark manually, high-speed ball progression. Cons: Requires perfect timing, coordination, and high technical quality.'
      },
      compactness_pressing_lines: {
        name: 'Compactness & Pressing Lines',
        complexity: ComplexityLevel.ADVANCED,
        module: 'compactness_pressing_lines',
        overview: 'The distance between the forward pressing line and the back line, kept short (10-15m) to limit central passing options.',
        origin: 'Mastered and codified by Arrigo Sacchi in AC Milan (vertical distance kept under 25 meters) using active offside traps.',
        defense: 'Countered by playing long diagonal balls over the block, stretching the field with wide wingers, or using rapid vertical combinations.',
        examples: 'Sacchi\'s AC Milan, Simeone\'s Atlético Madrid.',
        prosCons: 'Pros: Direct control of central spaces, intercepts passes easily. Cons: High stamina requirement, vulnerable to quick switches or runs behind if the defensive line isn\'t perfectly coordinated.'
      }
    };

    const conceptKey = matchedConcept === 'low_block' ? 'defensive_block' : matchedConcept;
    const concept = mockDatabase[conceptKey] || mockDatabase['false_9'];
    let explanation = concept[explanationKey] || concept.overview;

    // Adapt explanation dynamically
    explanation = explanationAdaptationLayer.adaptExplanation(matchedConcept, session.user_level, explanation);

    // Custom tactical adjustments for key experiences
    if (intentResult.intent === 'PLAYER_EXAMPLE' || intentResult.intent === 'COACH_EXAMPLE' || q.includes('example')) {
      explanation = explanationAdaptationLayer.adaptHistoricalExplanation(
        matchedConcept,
        session.user_level,
        {
          example_id: 'barcelona_2009_f9',
          concept_id: 'false_9',
          match_name: 'Barcelona vs Manchester United (2009 UCL Final)',
          competition: 'UEFA Champions League',
          season: '2008-09',
          teams: ['Barcelona', 'Manchester United'],
          date: '2009-05-27',
          coach: 'Pep Guardiola',
          players: ['Lionel Messi', "Samuel Eto'o", 'Thierry Henry'],
          description: 'Pep Guardiola deployed Messi centrally as a dropping striker to create a 4v3 numerical overload in midfield, pulling United center-backs Ferdinand and Vidic out of position.',
          tactical_summary: 'Messi dropped deep into Zone 14, attracting the attention of central defenders. This opened vertical channels behind the backline for Samuel Eto\'o and Thierry Henry to exploit.',
          source_references: [],
          confidence_score: 98,
          tags: [],
          review_status: 'approved',
          validation_metadata: { difficulty: 'beginner', educational_value: '', suitability_score: 95 },
          beginner_friendly: true
        },
        explanation
      );
    }

    // Special behavior override for Target Experience Chain 1:
    // If we transition to midfield overload or third man run, explain that
    const transitionOutcome = conceptChainEngine.evaluateTransition(question, context);
    if (transitionOutcome.intent === 'midfield_impact') {
      explanation = `By dropping deep, the False 9 draws the opposing center-back out, creating a midfield overload. This numerical superiority (e.g. 4v3) allows extra passing lanes and lets the team dominate central spaces, causing defensive confusion.`;
    } else if (transitionOutcome.intent === 'attacking_progression') {
      explanation = `The numerical advantage in midfield facilitates Third Man Runs. When Player A passes to Player B (the False 9), the defenders shift focus, allowing Player C to run off-the-ball into the vacated space behind to receive a quick combination pass.`;
    }

    const suggestions = this.getSuggestionsForConcept(matchedConcept, explanationKey);

    return {
      needs_clarification: false,
      concept_id: matchedConcept,
      concept_name: concept.name,
      complexity: concept.complexity,
      user_level: session.user_level,
      animation_module: concept.module,
      explanation: explanation,
      follow_up_suggestions: suggestions,
      actions: this.sanitizeActions(intentResult.actions, matchedConcept)
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
      counter_attack_trigger: {
        overview: "What is a Counter-Attack Trigger?",
        origin: "Where did the Counter-Attack Trigger originate from?",
        defense: "How do you stop a Counter-Attack Trigger?",
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
      back_three_wing_back: {
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
      compactness_pressing_lines: {
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

  private sanitizeActions(actions: any[], activeConceptId?: string): any[] {
    if (!actions || !Array.isArray(actions)) return [];

    const sanitized: any[] = [];

    for (const act of actions) {
      if (!act || typeof act !== 'object') continue;
      
      if (act.type === 'LAUNCH_HISTORICAL_BREAKDOWN' || act.type === 'LAUNCH_MATCH') {
        const exampleId = act.payload?.example_id || act.payload?.breakdown_id;
        const conceptId = act.payload?.concept_id || activeConceptId || 'false_9';
        
        let validExample = exampleId ? historicalExampleRepository.getById(exampleId) : undefined;
        
        if (!validExample) {
          // Hallucinated or invalid match ID! Let's find a valid seeded example for this concept!
          const candidates = historicalExampleRepository.getByConcept(conceptId);
          if (candidates.length > 0) {
            validExample = candidates[0];
          } else {
            const allExamples = historicalExampleRepository.getAll();
            if (allExamples.length > 0) {
              validExample = allExamples[0];
            }
          }
        }
        
        if (validExample) {
          sanitized.push({
            type: act.type,
            label: act.type === 'LAUNCH_HISTORICAL_BREAKDOWN'
              ? `View Tactical Breakdown: ${validExample.match_name}`
              : `Open Match Card: ${validExample.match_name}`,
            payload: {
              concept_id: validExample.concept_id,
              example_id: validExample.example_id,
              breakdown_id: validExample.example_id
            }
          });
        }
      } else if (act.type === 'LAUNCH_CONCEPT' || act.type === 'OPEN_RELATED_CONCEPT') {
        const conceptId = act.payload?.concept_id || activeConceptId || 'false_9';
        const exists = tacticalRegistry.getConcept(conceptId) !== undefined;
        if (exists) {
          sanitized.push({
            type: act.type,
            label: act.type === 'LAUNCH_CONCEPT'
              ? `Launch 3D Concept: ${conceptId.replace(/_/g, ' ')}`
              : `Explore Related: ${conceptId.replace(/_/g, ' ')}`,
            payload: {
              concept_id: conceptId
            }
          });
        }
      } else {
        sanitized.push(act);
      }
    }
    
    return sanitized;
  }

  /**
   * Translates arbitrary text into the target language using the Granite model.
   */
  public async translateText(
    text: string,
    targetLang: string,
    traceId: string = 'translation-request'
  ): Promise<string> {
    const cleanText = text.trim();
    if (!cleanText) return '';

    // Standard translation dictionary for mock mode & quick responses
    const dictionary: Record<string, Record<string, string>> = {
      es: {
        "Welcome to Football Atlas! I'm your AI tactical tutor powered by IBM Granite. Ask me questions like 'Why is a False 9 hard to defend?' or 'How does a high press work?' to begin!":
          "¡Bienvenido a Football Atlas! Soy tu tutor táctico de IA impulsado por IBM Granite. ¡Hazme preguntas como '¿Por qué es difícil defender a un Falso 9?' o '¿Cómo funciona una presión alta?' para comenzar!",
        "Why is a False 9 hard to defend?": "¿Por qué es difícil defender a un Falso 9?",
        "Why is False 9 hard to defend?": "¿Por qué es difícil defender a un Falso 9?",
        "How does a high press create chances?": "¿Cómo crea oportunidades una presión alta?",
        "How does a high press work?": "¿Cómo funciona una presión alta?",
        "Can you show me a pressing trap?": "¿Puedes mostrarme una trampa de presión?",
        "What is a low block?": "¿Qué es un bloque bajo?",
        "Show supporting evidence": "Mostrar evidencia de respaldo",
        "Launch breakdown": "Iniciar desglose",
        "View core lesson": "Ver lección principal",
        "Explain how this concept works": "Explicar cómo funciona este concepto",
        "Show me the 3D lesson": "Muéstrame la lección 3D",
        "A False 9 is a striker who moves away from the goal to create space.": "Un Falso 9 es un delantero que se aleja de la portería para crear espacio.",
        "A False 9 pulls defenders out of position and creates midfield overloads.": "Un Falso 9 saca a los defensores de su posición y crea superioridad numérica en el mediocampo.",
        "The False 9 destabilizes defensive reference points and creates central superiority during positional attacks.": "El Falso 9 desestabiliza los puntos de referencia defensivos y crea superioridad central durante los ataques posicionales.",
      },
      fr: {
        "Welcome to Football Atlas! I'm your AI tactical tutor powered by IBM Granite. Ask me questions like 'Why is a False 9 hard to defend?' or 'How does a high press work?' to begin!":
          "Bienvenue sur Football Atlas! Je suis votre tuteur tactique IA propulsé par IBM Granite. Posez-moi des questions comme 'Pourquoi un Faux 9 est-il difficile à défendre?' ou 'Comment fonctionne un pressing haut?' pour commencer!",
        "Why is a False 9 hard to defend?": "Pourquoi un Faux 9 est-il difficile à défendre?",
        "Why is False 9 hard to defend?": "Pourquoi un Faux 9 est-il difficile à défendre?",
        "How does a high press create chances?": "Comment un pressing haut crée-t-il des occasions?",
        "How does a high press work?": "Comment fonctionne un pressing haut?",
        "Can you show me a pressing trap?": "Pouvez-vous me montrer un piège de pressing?",
        "What is a low block?": "Qu'est-ce qu'un bloc bas?",
        "Show supporting evidence": "Afficher les preuves à l'appui",
        "Launch breakdown": "Lancer l'analyse",
        "View core lesson": "Voir la leçon principale",
        "Explain how this concept works": "Expliquer le fonctionnement de ce concept",
        "Show me the 3D lesson": "Montrez-moi la leçon 3D",
        "A False 9 is a striker who moves away from the goal to create space.": "Un Faux 9 est un attaquant qui s'éloigne du but pour créer de l'espace.",
        "A False 9 pulls defenders out of position and creates midfield overloads.": "Un Faux 9 attire les défenseurs hors de leur position et crée des surcharges au milieu de terrain.",
        "The False 9 destabilizes defensive reference points and creates central superiority during positional attacks.": "Le Faux 9 déstabilise les points de référence défensifs et crée une supériorité centrale lors des attaques positionnelles.",
      },
      de: {
        "Welcome to Football Atlas! I'm your AI tactical tutor powered by IBM Granite. Ask me questions like 'Why is a False 9 hard to defend?' or 'How does a high press work?' to begin!":
          "Willkommen bei Football Atlas! Ich bin Ihr KI-Taktiklehrer, unterstützt von IBM Granite. Stellen Sie mir Fragen wie 'Warum ist eine Falsche 9 schwer zu verteidigen?' oder 'Wie funktioniert ein hohes Pressing?', um zu beginnen!",
        "Why is a False 9 hard to defend?": "Warum ist eine Falsche 9 schwer zu verteidigen?",
        "Why is False 9 hard to defend?": "Warum ist eine Falsche 9 schwer zu verteidigen?",
        "How does a high press create chances?": "Wie schafft ein hohes Pressing Torchancen?",
        "How does a high press work?": "Wie funktioniert ein hohes Pressing?",
        "Can you show me a pressing trap?": "Können Sie mir eine Pressingfalle zeigen?",
        "What is a low block?": "Was ist ein tiefer Block?",
        "Show supporting evidence": "Belege anzeigen",
        "Launch breakdown": "Analyse starten",
        "View core lesson": "Hauptlektion anzeigen",
        "Explain how this concept works": "Erklären Sie, wie dieses Konzept funktioniert",
        "Show me the 3D lesson": "Zeig mir die 3D-Lektion",
        "A False 9 is a striker who moves away from the goal to create space.": "Eine falsche 9 ist ein Stürmer, der sich vom Tor wegbewegt, um Platz zu schaffen.",
        "A False 9 pulls defenders out of position and creates midfield overloads.": "Eine falsche 9 zieht Verteidiger aus der Position und schafft Überzahl im Mittelfeld.",
        "The False 9 destabilizes defensive reference points and creates central superiority during positional attacks.": "Die Falsche 9 destabilisiert defensive Referenzpunkte und schafft zentrale Überlegenheit bei positionellen Angriffen.",
      }
    };

    if (dictionary[targetLang]?.[cleanText]) {
      return dictionary[targetLang][cleanText];
    }

    if (this.isMockMode) {
      // Basic rule-based translation fallback for paragraphs in mock mode
      const prefix = targetLang === 'es' ? '[ES] ' : targetLang === 'fr' ? '[FR] ' : targetLang === 'de' ? '[DE] ' : '';
      
      // If the text looks like a tactical concept description, let's make it look slightly more translated by replacing a few terms.
      let mockTranslated = cleanText;
      if (targetLang === 'es') {
        mockTranslated = mockTranslated
          .replace(/False 9/g, 'Falso 9')
          .replace(/high press/gi, 'presión alta')
          .replace(/defensive block/gi, 'bloque defensivo')
          .replace(/low block/gi, 'bloque bajo')
          .replace(/midfield overload/gi, 'sobrecarga del mediocampo')
          .replace(/passing lane/gi, 'carril de pase')
          .replace(/defender/gi, 'defensor')
          .replace(/space/gi, 'espacio');
        return `[ES] ${mockTranslated}`;
      } else if (targetLang === 'fr') {
        mockTranslated = mockTranslated
          .replace(/False 9/g, 'Faux 9')
          .replace(/high press/gi, 'pressing haut')
          .replace(/defensive block/gi, 'bloc défensif')
          .replace(/low block/gi, 'bloc bas')
          .replace(/midfield overload/gi, 'surcharge du milieu')
          .replace(/passing lane/gi, 'ligne de passe')
          .replace(/defender/gi, 'défenseur')
          .replace(/space/gi, 'espace');
        return `[FR] ${mockTranslated}`;
      } else if (targetLang === 'de') {
        mockTranslated = mockTranslated
          .replace(/False 9/g, 'Falsche 9')
          .replace(/high press/gi, 'hohes Pressing')
          .replace(/defensive block/gi, 'Abwehrblock')
          .replace(/low block/gi, 'tiefer Block')
          .replace(/midfield overload/gi, 'Mittelfeldüberzahl')
          .replace(/passing lane/gi, 'Passweg')
          .replace(/defender/gi, 'Verteidiger')
          .replace(/space/gi, 'Raum');
        return `[DE] ${mockTranslated}`;
      }

      return `${prefix}${cleanText}`;
    }

    const systemPrompt = `You are a professional football translator. Translate the given text into ${
      targetLang === 'es' ? 'Spanish' : targetLang === 'fr' ? 'French' : targetLang === 'de' ? 'German' : 'English'
    }. Keep all tactical terms, player names, markdown formatting, lists, and numbers exactly the same. Respond ONLY with the translated text, without any additional comments, explanations, or quotes.`;

    const userPrompt = cleanText;

    try {
      if (this.isHFMode) {
        const url = `https://${envConfig.ibmBaseUrl}/models/${envConfig.ibmGraniteModel}`;
        const promptText = `<|system|>\n${systemPrompt}\n<|user|>\n${userPrompt}\n<|assistant|>\n`;
        const payload = {
          inputs: promptText,
          parameters: {
            max_new_tokens: 1000,
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
        if (response.ok) {
          const data = await response.json();
          let rawText = '';
          if (Array.isArray(data) && data[0]?.generated_text) {
            rawText = data[0].generated_text;
          } else if (data && typeof data === 'object' && 'generated_text' in data) {
            rawText = (data as any).generated_text;
          }
          return rawText.trim() || cleanText;
        }
      } else if (this.isOpenRouterMode) {
        const url = envConfig.ibmBaseUrl.startsWith('http')
          ? `${envConfig.ibmBaseUrl}/chat/completions`
          : `https://${envConfig.ibmBaseUrl}/chat/completions`;
        const payload = {
          model: envConfig.ibmGraniteModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          max_tokens: 1000
        };
        const response = await this.fetchWithRetryAndTimeout(
          url,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${envConfig.ibmApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com/google-deepmind/football-atlas',
              'X-Title': 'Football Atlas Translator'
            },
            body: JSON.stringify(payload),
          },
          3,
          15000,
          traceId
        );
        if (response.ok) {
          const data = await response.json();
          return (data.choices?.[0]?.message?.content || '').trim() || cleanText;
        }
      } else {
        const token = await this.getAccessToken(traceId);
        const url = `https://${envConfig.ibmBaseUrl}/ml/v1/text/generation?version=2023-05-29`;
        const promptText = `<|system|>\n${systemPrompt}\n<|user|>\n${userPrompt}\n<|assistant|>\n`;
        const payload = {
          model_id: envConfig.ibmGraniteModel,
          input: promptText,
          parameters: {
            decoding_method: 'greedy',
            max_new_tokens: 1000,
            min_new_tokens: 1,
            stop_sequences: ['<|endoftext|>'],
            repetition_penalty: 1.05,
          },
          project_id: envConfig.ibmProjectId,
        };
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
          3,
          15000,
          traceId
        );
        if (response.ok) {
          const data = await response.json();
          const rawText = data.results?.[0]?.generated_text || '';
          return rawText.trim() || cleanText;
        }
      }
    } catch (err) {
      Logger.error(`Translation failed, falling back to original text. Error: ${err}`);
    }
    return cleanText;
  }
}

