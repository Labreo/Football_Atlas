import { SessionContext } from './context.manager';

export type FollowUpIntent =
  | 'DIRECT_FOLLOWUP'
  | 'AMBIGUOUS_FOLLOWUP'
  | 'CONCEPT_TRANSITION'
  | 'BREAKDOWN_REQUEST'
  | 'EXAMPLE_REQUEST'
  | 'COMPARISON_REQUEST'
  | 'CLARIFICATION_REQUEST';

export interface FollowUpIntentResult {
  intent: FollowUpIntent;
  confidence: number;
  evidence: string[];
  requiresClarification: boolean;
  clarificationQuestion?: string;
}

export class FollowUpIntentEngine {
  /**
   * Classifies the follow-up intent based on the query text and current session context.
   */
  public static classify(question: string, session: SessionContext): FollowUpIntentResult {
    const q = question.toLowerCase();
    const result: FollowUpIntentResult = {
      intent: 'DIRECT_FOLLOWUP',
      confidence: 0.60,
      evidence: [],
      requiresClarification: false
    };

    // 1. Detect AMBIGUOUS_FOLLOWUP first
    // Case A: "show me another example" / "give me another example" etc.
    const isAmbiguousExampleRequest = /show me another example|give me another example|another example|show another example/i.test(q);
    if (isAmbiguousExampleRequest) {
      result.intent = 'AMBIGUOUS_FOLLOWUP';
      result.confidence = 0.95;
      result.requiresClarification = true;
      result.clarificationQuestion = 'Would you like another match example or another tactical concept example?';
      result.evidence.push('Ambiguous example request detected: user did not specify match or concept.');
      return result;
    }

    // Case B: Ultra-short bare object-less "show/give me one/it/that/this" (≤6 tokens, no named subject)
    // E.g. "Show me one.", "Give me one.", "Show it.", "Show that."
    const wordCount = q.trim().split(/\s+/).length;
    const isBareShowRequest = /^(show|give|tell) me (one|it|this|that|them|those)\.?$/i.test(q.trim()) ||
      (wordCount <= 6 && /^(show|give|tell) (me )?(one|it|this|that)\.?$/i.test(q.trim()));
    if (isBareShowRequest) {
      result.intent = 'AMBIGUOUS_FOLLOWUP';
      result.confidence = 0.90;
      result.requiresClarification = true;
      result.clarificationQuestion = 'Could you clarify what you\'d like to see — a match example, a tactical animation, or something else?';
      result.evidence.push('Ambiguous bare-object request: no explicit concept or example type specified.');
      return result;
    }

    // 2. Detect BREAKDOWN_REQUEST
    // E.g. "Can you show a real example?", "Show the passing lane", "Why did Messi move there?", "What was the defender thinking?"
    const isBreakdownQuery = 
      /show (?:the )?passing lane|why did messi move|defender thinking|what was the defender|tactical breakdown|launch breakdown|show breakdown|show breakdown moment/i.test(q) ||
      (session.context.active_breakdown !== null && /movement|space|run|pass|lane|defender|center-back|goalkeeper/i.test(q));

    if (isBreakdownQuery) {
      result.intent = 'BREAKDOWN_REQUEST';
      result.confidence = 0.90;
      result.evidence.push('Breakdown query detected based on terminology or active breakdown view.');
      return result;
    }

    // 3. Detect COMPARISON_REQUEST
    // E.g. "compare them", "difference between", "messi vs", "versus", "comparison"
    const isComparisonQuery = /compare|difference| versus |\bvs\b|comparison/i.test(q);
    if (isComparisonQuery) {
      result.intent = 'COMPARISON_REQUEST';
      result.confidence = 0.95;
      result.evidence.push('Comparison query detected.');
      return result;
    }

    // 4. Detect EXAMPLE_REQUEST (if not ambiguous)
    // E.g. "Give me a real example", "when did Guardiola do this", "show me a messi example"
    const isExampleQuery = /show me (?:a |an )?example|give me (?:a |an )?example|real example|famous team|when has this happened|another example|an example of|example of this/i.test(q);
    if (isExampleQuery) {
      result.intent = 'EXAMPLE_REQUEST';
      result.confidence = 0.90;
      result.evidence.push('Specific example query detected.');
      return result;
    }

    // 5. Detect CLARIFICATION_REQUEST
    // E.g. "Explain this simply", "What does pressing mean", "Explain in simple terms"
    const isClarificationQuery = /explain (?:this )?simply|explain simply|what does .* mean|explain in simple/i.test(q);
    if (isClarificationQuery) {
      result.intent = 'CLARIFICATION_REQUEST';
      result.confidence = 0.90;
      result.evidence.push('Clarification/simplification request detected.');
      return result;
    }

    // 6. Detect CONCEPT_TRANSITION
    // E.g. "How do defenders stop it?" -> Transitions False 9 to defensive response.
    // "How do they play after a turnover?" -> Counter Attack to recovery.
    // Check if query contains terms from related concepts that differ from current concept
    const active = session.context.active_concept;
    if (active) {
      if (active === 'false_9' && /(defend|defender|defensive|stop|react|respond|response)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Defensive Response.');
        return result;
      }
      if (active === 'false_9' && /(midfield|overload|numerical)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Midfield Overload.');
        return result;
      }
      if (active === 'midfield_overload' && /(third man|run|combination)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Third Man Run.');
        return result;
      }
      if (active === 'high_press' && /(trap|funnel|pressing trap)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Pressing Trap.');
        return result;
      }
      if (active === 'pressing_trap' && /(compact|compactness|lines)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Compactness & Pressing Lines.');
        return result;
      }
      if (active === 'compactness_pressing_lines' && /(block|defensive block|low block)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Defensive Block.');
        return result;
      }
      if (active === 'counter_attack_trigger' && /(transition|recover|back three|wingback)/i.test(q)) {
        result.intent = 'CONCEPT_TRANSITION';
        result.confidence = 0.85;
        result.evidence.push('Concept transition to Back Three Wing Back.');
        return result;
      }
    }

    // Default to DIRECT_FOLLOWUP if it has pronouns or continues the topic
    const hasPronouns = /\b(that|it|this|those|they|them|these)\b/i.test(q);
    if (hasPronouns || /why|how|what|explain/i.test(q)) {
      result.intent = 'DIRECT_FOLLOWUP';
      result.confidence = 0.80;
      result.evidence.push('Direct follow-up containing pronoun or continuing question.');
      return result;
    }

    return result;
  }
}
